const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../src/app');

describe('Batch 2A: Security Architecture, Authoritative Persistence & RBAC', () => {
  let server;
  let baseUrl;
  let savedDocs = [];
  let simulatePersistenceFailure = false;

  // Mock Firebase Auth service
  const mockFirebaseAuth = {
    verifyIdToken: async (token, checkRevoked) => {
      if (!token || token === 'forged-token') {
        const err = new Error('Decoding Firebase ID token failed');
        err.code = 'auth/invalid-id-token';
        throw err;
      }
      if (token === 'expired-token') {
        const err = new Error('Firebase ID token has expired');
        err.code = 'auth/id-token-expired';
        throw err;
      }
      if (token === 'revoked-token') {
        const err = new Error('Firebase ID token has been revoked');
        err.code = 'auth/id-token-revoked';
        throw err;
      }
      if (token === 'admin-token') {
        return {
          uid: 'admin_user_999',
          email: 'admin@verifyme.org',
          name: 'Verified Admin',
          role: 'ADMIN',
          admin: true
        };
      }
      if (token === 'user-token' || token === 'user-token-with-spoofed-role') {
        return {
          uid: 'user_norm_123',
          email: 'member@verifyme.org',
          name: 'Regular Member',
          role: 'USER',
          admin: false
        };
      }
      const err = new Error('Unknown token');
      err.code = 'auth/invalid-id-token';
      throw err;
    }
  };

  // Mock Firestore Database
  const mockFirestoreDb = {
    collection: (colName) => ({
      doc: (docId) => ({
        collection: (subColName) => ({
          doc: (subDocId) => {
            const genId = subDocId || 'server_doc_' + Math.random().toString(36).substring(2, 9);
            return {
              id: genId,
              set: async (record) => {
                if (simulatePersistenceFailure) {
                  throw new Error('Firestore connection timeout or quota exceeded');
                }
                savedDocs.push({
                  rootCol: colName,
                  userId: docId,
                  subCol: subColName,
                  docId: genId,
                  record
                });
                return record;
              }
            };
          }
        })
      })
    })
  };

  before(async () => {
    app.set('firebaseAuth', mockFirebaseAuth);
    app.set('firestoreDb', mockFirestoreDb);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION & TOKEN INTEGRITY TESTS
  // --------------------------------------------------------------------------

  it('TEST 1: Unauthenticated verification requests are rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'phone', input: '+12025550123' })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('No Bearer token provided'));
  });

  it('TEST 2: Invalid and forged Firebase tokens are rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer forged-token'
      },
      body: JSON.stringify({ type: 'phone', input: '+12025550123' })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'auth/invalid-id-token');
  });

  it('TEST 3: Expired tokens and revoked sessions are rejected with 401', async () => {
    const resExpired = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer expired-token'
      },
      body: JSON.stringify({ type: 'phone', input: '+12025550123' })
    });
    assert.strictEqual(resExpired.status, 401);
    const bodyExpired = await resExpired.json();
    assert.strictEqual(bodyExpired.code, 'auth/id-token-expired');

    const resRevoked = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer revoked-token'
      },
      body: JSON.stringify({ type: 'phone', input: '+12025550123' })
    });
    assert.strictEqual(resRevoked.status, 401);
    const bodyRevoked = await resRevoked.json();
    assert.strictEqual(bodyRevoked.code, 'auth/id-token-revoked');
  });

  // --------------------------------------------------------------------------
  // ROLE-BASED ACCESS CONTROL (RBAC) TESTS
  // --------------------------------------------------------------------------

  it('TEST 4: Ordinary authenticated users cannot access administrative endpoints (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer user-token' }
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes("Forbidden: Role 'USER' is not authorized"));
  });

  it('TEST 5: Verified ADMIN custom claims permit authorized administrative access (200)', async () => {
    const res = await fetch(`${baseUrl}/api/admin`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer admin-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.admin.role, 'ADMIN');
    assert.strictEqual(body.admin.uid, 'admin_user_999');
  });

  it('TEST 6: Client-supplied role values cannot grant admin privileges', async () => {
    const res = await fetch(`${baseUrl}/api/admin?role=ADMIN`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer user-token-with-spoofed-role',
        'X-User-Role': 'ADMIN',
        'Content-Type': 'application/json'
      }
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes("Role 'USER' is not authorized"));
  });

  // --------------------------------------------------------------------------
  // AUTHORITATIVE BACKEND PERSISTENCE TESTS
  // --------------------------------------------------------------------------

  it('TEST 7: Verification records are authoritatively persisted to Firestore by backend', async () => {
    savedDocs = [];
    const res = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify({ type: 'phone', input: '+12025550123' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.verification.id);
    assert.ok(body.verification.createdAt);

    // Verify record was written to mock Firestore under authenticated user's UID
    assert.strictEqual(savedDocs.length, 1);
    const persisted = savedDocs[0];
    assert.strictEqual(persisted.rootCol, 'users');
    assert.strictEqual(persisted.userId, 'user_norm_123');
    assert.strictEqual(persisted.subCol, 'verifications');
    assert.strictEqual(persisted.docId, body.verification.id);
    assert.strictEqual(persisted.record.target, '+12025550123');
    assert.strictEqual(persisted.record.type, 'phone');
    assert.strictEqual(typeof persisted.record.score, 'number');
  });

  it('TEST 8: Client-supplied score, risk, and verdict fields cannot override engine results', async () => {
    savedDocs = [];
    const spoofAttempt = {
      type: 'phone',
      input: '+12025550123',
      score: 1, // Attempted score tampering
      riskLevel: 'HIGH RISK', // Attempted risk tampering
      technicalStatus: 'VERIFIED_SAFE', // Attempted verdict spoofing
      createdAt: '1999-01-01T00:00:00.000Z' // Attempted timestamp manipulation
    };

    const res = await fetch(`${baseUrl}/api/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer user-token'
      },
      body: JSON.stringify(spoofAttempt)
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.verification.score, 100, 'Server must enforce engine score, not client spoof');
    assert.strictEqual(body.verification.riskLevel, 'LIMITED VERIFICATION', 'Server must enforce engine risk level');

    // Check database record
    assert.strictEqual(savedDocs.length, 1);
    const stored = savedDocs[0].record;
    assert.strictEqual(stored.score, 100);
    assert.strictEqual(stored.riskLevel, 'LIMITED VERIFICATION');
    assert.notStrictEqual(stored.createdAt, '1999-01-01T00:00:00.000Z');
  });

  it('TEST 9: Persistence failures are handled correctly without false success claims (500)', async () => {
    simulatePersistenceFailure = true;
    try {
      const res = await fetch(`${baseUrl}/api/verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-token'
        },
        body: JSON.stringify({ type: 'phone', input: '+12025550123' })
      });

      assert.strictEqual(res.status, 500);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.includes('authoritative persistence to database failed'));
    } finally {
      simulatePersistenceFailure = false;
    }
  });

  // --------------------------------------------------------------------------
  // USER PROFILE CONTRACT TESTS
  // --------------------------------------------------------------------------

  it('TEST 10: /api/users/me returns authenticated Firebase profile without undefined metadata', async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer user-token' }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.uid, 'user_norm_123');
    assert.strictEqual(body.user.email, 'member@verifyme.org');
    assert.strictEqual(body.user.name, 'Regular Member');
    assert.strictEqual(body.user.role, 'USER');
    assert.strictEqual(body.user._id, undefined);
    assert.strictEqual(body.user.createdAt, undefined);
  });

  // --------------------------------------------------------------------------
  // DECOMMISSIONED ROUTES & NETWORK SECURITY TESTS
  // --------------------------------------------------------------------------

  it('TEST 11: Legacy MongoDB/JWT routes (/api/auth) are no longer reachable (404)', async () => {
    const resSignup = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    assert.strictEqual(resSignup.status, 404);

    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    assert.strictEqual(resLogin.status, 404);
  });

  it('TEST 12: Strict CORS policy denies arbitrary Netlify origins', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { 'Origin': 'https://malicious-attacker.netlify.app' }
    });

    assert.strictEqual(res.status, 403); // Express CORS middleware rejects unauthorized origin with HTTP 403 Forbidden
  });

  // --------------------------------------------------------------------------
  // FIRESTORE RULES INTEGRITY AUDIT
  // --------------------------------------------------------------------------

  it('TEST 13: Firestore rules enforce read-only history and strict field whitelist', () => {
    const rulesPath = path.resolve(__dirname, '../../client/firestore.rules');
    assert.ok(fs.existsSync(rulesPath), 'client/firestore.rules must exist');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    // 1. Prohibit write on verifications
    assert.ok(
      rulesContent.includes('match /users/{userId}/verifications/{verificationId}'),
      'Must match verifications subcollection'
    );
    assert.ok(
      rulesContent.includes('allow write: if false;'),
      'Verification history must strictly prohibit client write (create/update/delete)'
    );

    // 2. Allow read only for owner or ADMIN
    assert.ok(
      rulesContent.includes("request.auth.uid == userId || request.auth.token.role == 'ADMIN'"),
      'Must allow read only for owner or verified ADMIN custom claim'
    );

    // 3. User profile field whitelist and role enforcement
    assert.ok(
      rulesContent.includes("keys().hasOnly(['uid', 'name', 'email', 'role', 'createdAt', 'updatedAt'])"),
      'User profile creation must whitelist exact allowed fields'
    );
    assert.ok(
      rulesContent.includes("request.resource.data.role == 'USER'"),
      'User creation must strictly enforce role == USER'
    );
    assert.ok(
      rulesContent.includes("affectedKeys().hasOnly(['name', 'updatedAt'])"),
      'User update must strictly restrict affected keys to name and updatedAt'
    );
    assert.ok(
      rulesContent.includes('allow delete: if false;'),
      'User deletion must be denied to clients'
    );
  });
});
