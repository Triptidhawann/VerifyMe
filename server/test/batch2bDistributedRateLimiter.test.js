const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const {
  FirestoreRateLimitStore,
  MemoryRateLimitStore,
  createRateLimiter,
  verificationRateLimiter
} = require('../src/middleware/rateLimiter');
const verificationRouter = require('../src/routes/verifications');

describe('Batch 2B: Distributed Rate Limiter Reliability & Transaction Correctness', () => {

  // --------------------------------------------------------------------------
  // TEST 1: FIRESTORE TRANSACTION BEHAVIOR & ATOMIC INCREMENT
  // --------------------------------------------------------------------------

  it('TEST 1: FirestoreRateLimitStore uses db.runTransaction to atomically check and increment', async () => {
    let transactionCalled = false;
    let storedDoc = null;

    const mockAdmin = {
      apps: ['[DEFAULT]'],
      firestore: () => ({
        collection: (col) => ({
          doc: (id) => ({
            id,
            col
          })
        }),
        runTransaction: async (updateFunction) => {
          transactionCalled = true;
          const mockTransaction = {
            get: async (docRef) => ({
              exists: !!storedDoc,
              data: () => storedDoc
            }),
            set: (docRef, data, opts) => {
              storedDoc = { ...data };
            }
          };
          return await updateFunction(mockTransaction);
        }
      })
    };

    const store = new FirestoreRateLimitStore(mockAdmin);
    const result1 = await store.checkAndIncrement('user_test_1', 60000, 5);

    assert.strictEqual(transactionCalled, true);
    assert.strictEqual(result1.count, 1);
    assert.strictEqual(result1.exceeded, false);
    assert.strictEqual(storedDoc.count, 1);

    const result2 = await store.checkAndIncrement('user_test_1', 60000, 5);
    assert.strictEqual(result2.count, 2);
    assert.strictEqual(result2.exceeded, false);
    assert.strictEqual(storedDoc.count, 2);
  });

  // --------------------------------------------------------------------------
  // TEST 2: CONCURRENT REQUEST RACE CONDITION PREVENTION
  // --------------------------------------------------------------------------

  it('TEST 2: Concurrent requests are serialized by transaction, preventing limit overrun', async () => {
    let count = 0;
    // Simulate Firestore serialized transaction queue
    let transactionQueue = Promise.resolve();

    const mockAdmin = {
      apps: ['[DEFAULT]'],
      firestore: () => ({
        collection: () => ({ doc: (id) => ({ id }) }),
        runTransaction: (fn) => {
          transactionQueue = transactionQueue.then(async () => {
            const mockTx = {
              get: async () => ({
                exists: count > 0,
                data: () => ({ count })
              }),
              set: (docRef, data) => {
                count = data.count;
              }
            };
            return await fn(mockTx);
          });
          return transactionQueue;
        }
      })
    };

    const store = new FirestoreRateLimitStore(mockAdmin);
    const limit = 4;
    const concurrentAttempts = 10;

    // Dispatch 10 concurrent requests simultaneously
    const results = await Promise.all(
      Array.from({ length: concurrentAttempts }, () =>
        store.checkAndIncrement('concurrent_key', 60000, limit)
      )
    );

    const permitted = results.filter((r) => !r.exceeded);
    const rejected = results.filter((r) => r.exceeded);

    assert.strictEqual(permitted.length, limit, 'Exactly 4 requests should be permitted');
    assert.strictEqual(rejected.length, concurrentAttempts - limit, 'Exactly 6 requests should be rejected with exceeded=true');
    assert.strictEqual(count, limit, 'Counter should not exceed max limit in storage');
  });

  // --------------------------------------------------------------------------
  // TEST 3: PRODUCTION STORE FAILURE ENFORCES HTTP 503 (NO SILENT MEMORY FALLBACK)
  // --------------------------------------------------------------------------

  it('TEST 3: In production, store unavailability returns controlled HTTP 503 rather than falling back', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origStore = process.env.RATE_LIMIT_STORE;
    process.env.NODE_ENV = 'production';
    delete process.env.RATE_LIMIT_STORE; // Enforce production distributed mode

    const testApp = express();
    testApp.use(express.json());

    // Middleware simulating failure in distributed Firestore store
    const failingLimiter = createRateLimiter({
      windowMs: 60000,
      maxLimit: 10,
      keyGenerator: () => 'prod_test_key',
      isProtected: true
    });

    testApp.post('/protected-test', failingLimiter, (req, res) => {
      res.json({ success: true });
    });

    const server = http.createServer(testApp);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server.address().port}/protected-test`;

    try {
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      // Must return HTTP 503 Service Unavailable (not 200, not silent in-memory fallback)
      assert.strictEqual(res.status, 503);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.code, 'RATE_LIMITER_UNAVAILABLE');
      assert.match(data.error, /Rate limiting service temporarily unavailable/);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      if (origStore) process.env.RATE_LIMIT_STORE = origStore;
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // --------------------------------------------------------------------------
  // TEST 4: MIDDLEWARE ORDERING (AUTH MUST PRECEDE UID RATE LIMITING)
  // --------------------------------------------------------------------------

  it('TEST 4: Firebase auth middleware executes before verification rate limiter (rejects 401 before rate limiter)', async () => {
    // In verifications.js route: router.post('/', protect, verificationRateLimiter, validateVerificationRequest, createVerification);
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/verifications', verificationRouter);

    const server = http.createServer(testApp);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const testUrl = `http://127.0.0.1:${server.address().port}/api/verifications`;

    try {
      // Unauthenticated request without Authorization header
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phone', input: '+1234567890' })
      });

      // Rejection must come from authMiddleware.protect with 401
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.match(body.error, /Not authorized: No Bearer token provided/);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: MEMORY STORE REMAINS FUNCTIONAL FOR LOCAL DEVELOPMENT & TESTS
  // --------------------------------------------------------------------------

  it('TEST 5: MemoryRateLimitStore functions correctly in dev/test environment', async () => {
    const store = new MemoryRateLimitStore();
    const res1 = await store.checkAndIncrement('dev_key', 10000, 2);
    assert.strictEqual(res1.count, 1);
    assert.strictEqual(res1.exceeded, false);

    const res2 = await store.checkAndIncrement('dev_key', 10000, 2);
    assert.strictEqual(res2.count, 2);
    assert.strictEqual(res2.exceeded, false);

    const res3 = await store.checkAndIncrement('dev_key', 10000, 2);
    assert.strictEqual(res3.count, 3);
    assert.strictEqual(res3.exceeded, true);
  });
});
