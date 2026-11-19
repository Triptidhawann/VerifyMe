const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

describe('CredentialCheck: API Endpoints, Security & Authentication', () => {
  let server;
  let baseUrl;
  let savedDoc = null;
  let deletedId = null;
  const mockUid = 'cred_test_user_456';

  const mockAuth = {
    verifyIdToken: async (token) => {
      if (token === 'valid_cred_token') {
        return { uid: mockUid, email: 'candidate@example.com', role: 'USER' };
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
            id: id || 'cred_doc_789',
            get: async () => ({
              exists: true,
              id: id || 'cred_doc_789',
              data: () => ({
                category: 'ACADEMIC',
                outcome: 'VERIFIED',
                fileName: 'degree.pdf'
              })
            }),
            set: async (data) => {
              savedDoc = data;
              return { writeTime: {} };
            },
            delete: async () => {
              deletedId = id;
              return { writeTime: {} };
            }
          }),
          orderBy: () => ({
            limit: () => ({
              get: async () => ({
                forEach: (cb) => {
                  cb({ id: 'cred_doc_789', data: () => ({ outcome: 'VERIFIED', category: 'ACADEMIC' }) });
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

  it('TEST 1: Reject unauthenticated investigation request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/credentialcheck/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'data:application/pdf;base64,JVBERi0xLjQ=' })
    });
    assert.equal(res.status, 401);
  });

  it('TEST 2: Reject forged / invalid Bearer token with 401', async () => {
    const res = await fetch(`${baseUrl}/api/credentialcheck/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer forged_token'
      },
      body: JSON.stringify({ fileBase64: 'data:application/pdf;base64,JVBERi0xLjQ=' })
    });
    assert.equal(res.status, 401);
  });

  it('TEST 3: Reject empty file payload with 400', async () => {
    const res = await fetch(`${baseUrl}/api/credentialcheck/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid_cred_token'
      },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it('TEST 4: Sources registry endpoint returns active official sources without authentication', async () => {
    const res = await fetch(`${baseUrl}/api/credentialcheck/sources`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.sources));
    assert.ok(data.sources.some(s => s.id === 'ugc_registry'));
    assert.ok(data.sources.some(s => s.id === 'cca_digital_signatures'));
  });

  it('TEST 5: Authorized investigation executes and persists to Firestore without storing raw file', async () => {
    // Valid minimal PDF base64: %PDF-1.4 ... %%EOF
    const validPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Test Degree) >>\nendobj\nThis is to certify that Rahul Sharma completed Bachelor of Technology at University of Delhi.\n%%EOF');
    const base64Payload = validPdf.toString('base64');

    const res = await fetch(`${baseUrl}/api/credentialcheck/investigate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid_cred_token'
      },
      body: JSON.stringify({
        fileBase64: base64Payload,
        fileName: 'degree.pdf',
        documentCategory: 'ACADEMIC'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.investigation.id);
    assert.ok(data.investigation.documentSha256);
    assert.equal(data.investigation.category, 'ACADEMIC');
    assert.ok(data.investigation.dimensions);

    // Assert that raw fileBase64 was NOT persisted to Firestore (Data Privacy Rule)
    assert.ok(savedDoc);
    assert.equal(savedDoc.fileBase64, undefined);
    assert.equal(savedDoc.userId, mockUid);
  });

  it('TEST 6: Get user credential investigation history returns user audit records', async () => {
    const res = await fetch(`${baseUrl}/api/credentialcheck/history`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid_cred_token'
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.history));
  });

  it('TEST 7: Delete credential investigation removes record', async () => {
    const res = await fetch(`${baseUrl}/api/credentialcheck/investigations/cred_doc_789`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer valid_cred_token'
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(deletedId, 'cred_doc_789');
  });
});
