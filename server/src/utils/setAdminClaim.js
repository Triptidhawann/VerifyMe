require('dotenv').config();
const admin = require('../config/firebase');
const { getAuth } = require('firebase-admin/auth');

/**
 * Sanctioned Administrative Provisioning Utility
 * Grants or revokes the ADMIN custom claim for a specified Firebase User UID.
 * 
 * Usage:
 *   node server/src/utils/setAdminClaim.js <UID> [true|false]
 */
const setAdminClaim = async (uid, shouldBeAdmin = true) => {
  if (!uid) {
    console.error('Error: Target Firebase User UID is required.');
    console.error('Usage: node server/src/utils/setAdminClaim.js <UID> [true|false]');
    process.exit(1);
  }

  try {
    const auth = getAuth();
    // Retrieve user to verify existence before assigning claim
    const userRecord = await auth.getUser(uid);
    console.log(`[VerifyMe Admin Provisioning] Target user identified: ${userRecord.email || userRecord.uid}`);

    const existingClaims = userRecord.customClaims || {};
    const newClaims = {
      ...existingClaims,
      role: shouldBeAdmin ? 'ADMIN' : 'USER',
      admin: shouldBeAdmin
    };

    await auth.setCustomUserClaims(uid, newClaims);
    console.log(`[VerifyMe Admin Provisioning] Successfully ${shouldBeAdmin ? 'granted ADMIN' : 'revoked ADMIN'} claim for UID: ${uid}`);
    console.log('[VerifyMe Admin Provisioning] Note: User must refresh their Firebase ID token for changes to take effect.');
    process.exit(0);
  } catch (err) {
    console.error(`[VerifyMe Admin Provisioning Error]: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  const targetUid = process.argv[2];
  const grant = process.argv[3] !== 'false';
  setAdminClaim(targetUid, grant);
}

module.exports = { setAdminClaim };
