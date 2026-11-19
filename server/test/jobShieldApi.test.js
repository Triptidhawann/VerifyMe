const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

describe('JobShield: API Endpoints, Security & Authentication', () => {
  let server;
  let baseUrl;
  let savedDoc = null;
  const mockUid = 'jobshield_test_user_789';

  const mockAuth = {
    verifyIdToken: async (token) => {
      if (token === 'valid_jobshield_token') {
        return { uid: mockUid, email: 'user@example.com', role: 'USER' };
      }
      const err = new Error('Invalid token');
      err.code = 'auth/invalid-id-token';
      throw err;
    }
  };

  const mockDb = {
    collection: (col) => ({
      doc: (uid) => ({
        collection: (subCol) => ({
          doc: (id) => ({
            id: id || 'js_test_doc_123',
            set: async (data) => {
              savedDoc = data;
              return { writeTime: {} };
            }
          }),
          orderBy: () => ({
            limit: () => ({
              get: async () => ({
                forEach: (cb) => {
                  cb({ id: 'js_test_doc_123', data: () => ({ outcome: 'VERIFIED THROUGH OFFICIAL SOURCES' }) });
                }
              })
            })
          })
        })
      })
    })
  };

  before(async () => {
    app.set('firebaseAuth', mockAuth);
    app.set('firestoreDb', mockDb);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('should reject unauthenticated POST /api/jobshield/investigate with 401', async () => {
    const res = await fetch(`${baseUrl}/api/jobshield/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionType: 'text',
        rawText: 'We are hiring a Software Engineer at Stripe with salary $150,000.'
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('Not authorized'));
  });

  it('should reject unauthenticated GET /api/jobshield/history with 401', async () => {
    const res = await fetch(`${baseUrl}/api/jobshield/history`);

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  it('should successfully process authenticated investigation with mocked auth and db', async () => {
    const res = await fetch(`${baseUrl}/api/jobshield/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid_jobshield_token'
      },
      body: JSON.stringify({
        submissionType: 'text',
        rawText: 'From: recruiter@stripe.com\nOffer from Stripe for Senior Engineer. Compensation: $180,000 per year.',
        claimedCompany: 'Stripe',
        claimedWebsite: 'stripe.com'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.investigation);
    assert.strictEqual(body.investigation.claims.companyName, 'Stripe');
    assert.ok(savedDoc !== null);
    assert.strictEqual(savedDoc.userId, mockUid);
  });

  it('should retrieve history for authenticated user via GET /api/jobshield/history', async () => {
    const res = await fetch(`${baseUrl}/api/jobshield/history`, {
      headers: {
        'Authorization': 'Bearer valid_jobshield_token'
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.history));
  });
});
