const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('Firestore Security Rules: Integrity & Role-Based Access Audit', () => {
  const rootRulesPath = path.resolve(__dirname, '../../firestore.rules');
  const clientRulesPath = path.resolve(__dirname, '../../client/firestore.rules');

  it('TEST 1: Root firestore.rules and client/firestore.rules both exist and are identical', () => {
    assert.ok(fs.existsSync(rootRulesPath), 'Root firestore.rules must exist');
    assert.ok(fs.existsSync(clientRulesPath), 'Client firestore.rules must exist');

    const rootRules = fs.readFileSync(rootRulesPath, 'utf8').trim();
    const clientRules = fs.readFileSync(clientRulesPath, 'utf8').trim();

    assert.strictEqual(rootRules, clientRules, 'Root and client rules must be 100% synchronized');
  });

  it('TEST 2: Default catch-all denies all unauthorized read and write access', () => {
    const rules = fs.readFileSync(rootRulesPath, 'utf8').replace(/\r\n/g, '\n');
    assert.ok(
      rules.includes('match /{document=**} {\n      allow read, write: if false;\n    }'),
      'Catch-all rule must default deny all reads and writes'
    );
  });

  it('TEST 3: User profile read permits authenticated owner and verified ADMIN claim only', () => {
    const rules = fs.readFileSync(rootRulesPath, 'utf8');
    assert.ok(
      rules.includes('match /users/{userId}'),
      'Must define match block for user profile'
    );
    assert.ok(
      rules.includes("request.auth != null && (request.auth.uid == userId || request.auth.token.role == 'ADMIN')"),
      'Must allow read only when authenticated user matches userId or has verified ADMIN claim'
    );
  });

  it('TEST 4: User profile creation strictly whitelists fields and forces role == USER', () => {
    const rules = fs.readFileSync(rootRulesPath, 'utf8');
    assert.ok(
      rules.includes("keys().hasOnly(['uid', 'name', 'email', 'role', 'createdAt', 'updatedAt'])"),
      'Must restrict fields strictly to whitelist'
    );
    assert.ok(
      rules.includes("request.resource.data.uid == userId"),
      'Must enforce payload UID matching path userId'
    );
    assert.ok(
      rules.includes("request.resource.data.role == 'USER'"),
      'Must strictly enforce role == USER on creation (preventing self-promotion to ADMIN)'
    );
  });

  it('TEST 5: User profile update restricts updatable fields strictly to name and updatedAt', () => {
    const rules = fs.readFileSync(rootRulesPath, 'utf8');
    assert.ok(
      rules.includes("affectedKeys().hasOnly(['name', 'updatedAt'])"),
      'Must restrict updatable fields strictly to name and updatedAt'
    );
    assert.ok(
      rules.includes("request.resource.data.role == resource.data.role"),
      'Must prevent changing role during profile update'
    );
    assert.ok(
      rules.includes("request.resource.data.uid == resource.data.uid"),
      'Must prevent changing UID during profile update'
    );
    assert.ok(
      rules.includes('allow delete: if false;'),
      'Must prevent client-side user deletion'
    );
  });

  it('TEST 6: Verification, JobShield, and CredentialCheck subcollections are strictly write-disabled for clients', () => {
    const rules = fs.readFileSync(rootRulesPath, 'utf8').replace(/\r\n/g, '\n');

    // Verifications subcollection
    assert.ok(
      rules.includes('match /users/{userId}/verifications/{verificationId}'),
      'Must protect verifications subcollection'
    );

    // JobShield subcollection
    assert.ok(
      rules.includes('match /users/{userId}/jobshield_investigations/{investigationId}'),
      'Must protect jobshield_investigations subcollection'
    );

    // CredentialCheck subcollection
    assert.ok(
      rules.includes('match /users/{userId}/credentialcheck_investigations/{investigationId}'),
      'Must protect credentialcheck_investigations subcollection'
    );

    // Count write: if false
    const writeFalseCount = (rules.match(/allow write: if false;/g) || []).length;
    assert.ok(writeFalseCount >= 3, 'All subcollections must strictly set allow write: if false;');
  });
});
