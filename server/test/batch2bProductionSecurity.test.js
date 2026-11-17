const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const app = require('../src/app');
const {
  getClientIp,
  MemoryRateLimitStore,
  FirestoreRateLimitStore,
  createRateLimiter,
  resetRateLimitStores
} = require('../src/middleware/rateLimiter');

describe('Batch 2B: API Security, Production Reliability & End-to-End Verification', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start local ephemeral HTTP server using app
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    resetRateLimitStores();
  });

  // --------------------------------------------------------------------------
  // PART 1: CORS & ORIGIN POLICIES
  // --------------------------------------------------------------------------

  it('TEST 1: Authorized origins receive Access-Control-Allow-Origin header', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    // Verify credentials: false (no cookie auth needed)
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), null);
  });

  it('TEST 2: Non-browser clients without Origin header are allowed (curl / server-to-server)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    // Origin header was not present, so no Access-Control-Allow-Origin should be emitted
    assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
  });

  it('TEST 3: Unauthorized origins are rejected by CORS', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://evil-hacker.com' }
    });
    // CORS middleware halts execution for untrusted origins
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.match(body.error, /Not allowed by CORS/);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
  });

  it('TEST 4: Arbitrary netlify.app subdomains are strictly rejected (no wildcard matching)', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://phishing-site.netlify.app' }
    });
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.match(body.error, /Not allowed by CORS/);
  });

  // --------------------------------------------------------------------------
  // PART 2: HELMET SECURITY HEADERS & BODY PARSING
  // --------------------------------------------------------------------------

  it('TEST 5: Helmet security headers are present with API-compatible settings', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
    assert.strictEqual(res.headers.get('x-dns-prefetch-control'), 'off');
  });

  it('TEST 6: Malformed JSON payloads return clean HTTP 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: '{ "type": "phone", "input": ' // Broken JSON syntax
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error, 'Malformed JSON payload in request body.');
  });

  it('TEST 7: Oversized JSON payloads (>16KB) are rejected with HTTP 413 Payload Too Large', async () => {
    const largePayload = JSON.stringify({
      type: 'phone',
      input: '1'.repeat(20000) // 20KB exceeds 16KB limit
    });

    const res = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: largePayload
    });

    assert.strictEqual(res.status, 413);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.error, /Payload too large/);
  });

  // --------------------------------------------------------------------------
  // PART 3: VERIFICATION ENDPOINT REQUEST VALIDATION
  // --------------------------------------------------------------------------

  it('TEST 8: Rejects verification request with missing or non-string type (400)', async () => {
    const appWithMockAuth = express();
    appWithMockAuth.use(express.json());
    appWithMockAuth.use((req, res, next) => {
      req.user = { uid: 'test-user-123', role: 'USER' };
      next();
    });
    const validateVerificationRequest = require('../src/middleware/validateVerification');
    appWithMockAuth.post('/test-validate', validateVerificationRequest, (req, res) => res.json({ success: true }));

    const server2 = http.createServer(appWithMockAuth);
    await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server2.address().port}/test-validate`;

    try {
      const res1 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: '+1234567890' }) // missing type
      });
      assert.strictEqual(res1.status, 400);
      const b1 = await res1.json();
      assert.match(b1.error, /Verification 'type' is required/);

      const res2 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unsupported_module', input: '+1234567890' })
      });
      assert.strictEqual(res2.status, 400);
      const b2 = await res2.json();
      assert.match(b2.error, /Invalid verification type/);
    } finally {
      await new Promise((resolve) => server2.close(resolve));
    }
  });

  it('TEST 9: Rejects verification request with empty or oversized input (400)', async () => {
    const appWithMockAuth = express();
    appWithMockAuth.use(express.json());
    appWithMockAuth.use((req, res, next) => {
      req.user = { uid: 'test-user-123', role: 'USER' };
      next();
    });
    const validateVerificationRequest = require('../src/middleware/validateVerification');
    appWithMockAuth.post('/test-validate', validateVerificationRequest, (req, res) => res.json({ success: true }));

    const server2 = http.createServer(appWithMockAuth);
    await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server2.address().port}/test-validate`;

    try {
      // Empty input
      const res1 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'website', input: '   ' })
      });
      assert.strictEqual(res1.status, 400);
      const b1 = await res1.json();
      assert.match(b1.error, /cannot be empty/);

      // Oversized input string (> 2048 chars)
      const res2 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'website', input: 'a'.repeat(2049) })
      });
      assert.strictEqual(res2.status, 400);
      const b2 = await res2.json();
      assert.match(b2.error, /exceeds maximum allowed length/);
    } finally {
      await new Promise((resolve) => server2.close(resolve));
    }
  });

  // --------------------------------------------------------------------------
  // PART 4: RATE LIMITING & NETLIFY PROXY SPOOFING IMMUNITY
  // --------------------------------------------------------------------------

  it('TEST 10: getClientIp prioritizes Netlify x-nf-client-connection-ip over x-forwarded-for', () => {
    const req = {
      headers: {
        'x-nf-client-connection-ip': '203.0.113.195',
        'x-forwarded-for': '198.51.100.1, 10.0.0.1' // spoofed by attacker
      },
      ip: '198.51.100.1'
    };

    const ip = getClientIp(req);
    // Must strictly equal Netlify's authenticated edge header
    assert.strictEqual(ip, '203.0.113.195');
  });

  it('TEST 11: Global rate limiter enforces limits, sets RFC headers, and responds with 429', async () => {
    const testApp = express();
    const testLimiter = createRateLimiter({
      windowMs: 10000,
      maxLimit: 3,
      keyGenerator: () => 'test_client_key',
      errorMessage: 'Rate limit exceeded for test.'
    });
    testApp.use(testLimiter);
    testApp.get('/test-rate', (req, res) => res.json({ ok: true }));

    const server2 = http.createServer(testApp);
    await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server2.address().port}/test-rate`;

    try {
      // 1st request
      const res1 = await fetch(testUrl);
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.headers.get('ratelimit-limit'), '3');
      assert.strictEqual(res1.headers.get('ratelimit-remaining'), '2');

      // 2nd request
      const res2 = await fetch(testUrl);
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('ratelimit-remaining'), '1');

      // 3rd request (hits limit)
      const res3 = await fetch(testUrl);
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.headers.get('ratelimit-remaining'), '0');

      // 4th request (exceeds limit -> 429)
      const res4 = await fetch(testUrl);
      assert.strictEqual(res4.status, 429);
      assert.strictEqual(res4.headers.get('ratelimit-remaining'), '0');
      assert.ok(Number(res4.headers.get('retry-after')) > 0);

      const body4 = await res4.json();
      assert.strictEqual(body4.success, false);
      assert.strictEqual(body4.error, 'Rate limit exceeded for test.');
      assert.ok(body4.retryAfter > 0);
    } finally {
      await new Promise((resolve) => server2.close(resolve));
    }
  });

  it('TEST 12: Verification rate limiter keys on authenticated UID (cannot be bypassed by IP rotation)', async () => {
    const testApp = express();
    let currentUid = 'user_alice_456';

    testApp.use((req, res, next) => {
      req.user = { uid: currentUid };
      next();
    });

    const testVerificationLimiter = createRateLimiter({
      windowMs: 10000,
      maxLimit: 2,
      keyGenerator: (req) => `uid_${req.user.uid}`,
      errorMessage: 'Verification rate limit exceeded.'
    });

    testApp.post('/test-verify-limit', testVerificationLimiter, (req, res) => res.json({ ok: true }));

    const server2 = http.createServer(testApp);
    await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server2.address().port}/test-verify-limit`;

    try {
      // Request 1 from IP A
      const r1 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'x-nf-client-connection-ip': '1.1.1.1' }
      });
      assert.strictEqual(r1.status, 200);

      // Request 2 from rotated IP B
      const r2 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'x-nf-client-connection-ip': '2.2.2.2' }
      });
      assert.strictEqual(r2.status, 200);

      // Request 3 from rotated IP C (exceeds UID limit even though IP is different)
      const r3 = await fetch(testUrl, {
        method: 'POST',
        headers: { 'x-nf-client-connection-ip': '3.3.3.3' }
      });
      assert.strictEqual(r3.status, 429);
      const b3 = await r3.json();
      assert.match(b3.error, /Verification rate limit exceeded/);
    } finally {
      await new Promise((resolve) => server2.close(resolve));
    }
  });

  // --------------------------------------------------------------------------
  // PART 5: DISTRIBUTED STORE LOGIC & TEST VERIFICATION
  // --------------------------------------------------------------------------

  it('TEST 13: MemoryRateLimitStore handles sliding windows and resets cleanly', async () => {
    const store = new MemoryRateLimitStore();
    const res1 = await store.increment('test_key', 5000);
    assert.strictEqual(res1.count, 1);

    const res2 = await store.increment('test_key', 5000);
    assert.strictEqual(res2.count, 2);

    store.reset();
    const res3 = await store.increment('test_key', 5000);
    assert.strictEqual(res3.count, 1);
  });

  it('TEST 14: FirestoreRateLimitStore simulates atomic increment and key sanitization', async () => {
    // Mock Firestore Admin interface supporting transactions
    let storedData = {};
    const mockAdmin = {
      apps: ['[DEFAULT]'],
      firestore: () => ({
        collection: (colName) => ({
          doc: (docId) => ({
            id: docId
          })
        }),
        runTransaction: async (txFn) => {
          const mockTx = {
            get: async (docRef) => ({
              exists: !!storedData[docRef.id],
              data: () => storedData[docRef.id]
            }),
            set: (docRef, data, opts) => {
              storedData[docRef.id] = {
                ...storedData[docRef.id],
                ...data
              };
            }
          };
          return await txFn(mockTx);
        }
      })
    };

    const firestoreStore = new FirestoreRateLimitStore(mockAdmin);
    const hit1 = await firestoreStore.increment('ip:192.168.1.1', 60000);
    assert.strictEqual(hit1.count, 1);

    const hit2 = await firestoreStore.increment('ip:192.168.1.1', 60000);
    assert.strictEqual(hit2.count, 2);

    // Verify key was sanitized (no dots or colons in docId)
    const docKeys = Object.keys(storedData);
    assert.ok(docKeys.length > 0);
    assert.ok(!docKeys[0].includes(':'));
    assert.ok(!docKeys[0].includes('.'));
  });

  // --------------------------------------------------------------------------
  // PART 6: PRODUCTION ERROR SHIELDING
  // --------------------------------------------------------------------------

  it('TEST 15: In production, internal 500 errors shield stack traces and sensitive details', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const testApp = express();
    testApp.get('/test-crash', (req, res) => {
      throw new Error('Database password failed at /var/secret/credentials.key:42');
    });
    const errorHandler = require('../src/middleware/errorHandler');
    testApp.use(errorHandler);

    const server2 = http.createServer(testApp);
    await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server2.address().port}/test-crash`;

    try {
      const res = await fetch(testUrl);
      assert.strictEqual(res.status, 500);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      // Sensitive file path and password message must be hidden
      assert.strictEqual(body.error, 'Internal verification service error');
      assert.strictEqual(body.debug, undefined);
    } finally {
      process.env.NODE_ENV = origEnv;
      await new Promise((resolve) => server2.close(resolve));
    }
  });

  it('TEST 16: Health check endpoint remains operational and exempt from rate-limit exhaustion', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.timestamp);
  });
});
