const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Attach modular services to admin for backward compatibility across controllers
admin.firestore = getFirestore;
admin.firestore.FieldValue = FieldValue;
admin.auth = getAuth;

/**
 * Robust Firebase Admin SDK Initialization
 * Supports:
 * 1. FIREBASE_SERVICE_ACCOUNT (full JSON string, single/double-quoted JSON, or Base64 string)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON file)
 * 3. Structured environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 4. Local / Emulator / Test fallback
 */
const initFirebaseAdmin = () => {
  if (admin && admin.apps && admin.apps.length > 0) {
    return admin;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  let credential = null;
  // Firebase Project ID is a public project identifier (matching client config & hosting domain).
  // Priority: FIREBASE_PROJECT_ID -> VITE_FIREBASE_PROJECT_ID -> default project ID.
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'verifyme-96690';

  // 1. Full service account JSON or Base64 in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      // Strip surrounding quotes often added by Netlify or CI/CD environment variable inputs
      if ((rawJson.startsWith("'") && rawJson.endsWith("'")) || (rawJson.startsWith('"') && rawJson.endsWith('"'))) {
        rawJson = rawJson.slice(1, -1).trim();
      }
      if (!rawJson.startsWith('{')) {
        rawJson = Buffer.from(rawJson, 'base64').toString('utf8');
      }
      const sa = JSON.parse(rawJson);
      // Ensure private key newlines are properly unescaped
      if (sa.private_key) {
        sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(sa);
    } catch (err) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT:', err.message);
    }
  }

  // 2. Structured individual credentials
  if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      credential = admin.credential.cert({
        projectId: projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      });
    } catch (err) {
      console.error('[Firebase Admin] Error constructing cert from individual env vars:', err.message);
    }
  }

  // 3. GOOGLE_APPLICATION_CREDENTIALS file path
  if (!credential && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      credential = admin.credential.applicationDefault();
    } catch (err) {
      console.error('[Firebase Admin] Error loading applicationDefault credentials:', err.message);
    }
  }

  // 4. Strict check in production: fail clearly if credentials missing
  if (isProduction && !credential && !process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error(
      '[Firebase Admin] Missing required credentials in production. Configure FIREBASE_SERVICE_ACCOUNT, ' +
      'GOOGLE_APPLICATION_CREDENTIALS, or (FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY). ' +
      'Ambient GCP credentials are not assumed on Netlify/serverless.'
    );
  }

  const options = {};
  if (credential) {
    options.credential = credential;
  }
  options.projectId = projectId;

  admin.initializeApp(options);
  console.log(`[Firebase Admin] Initialized successfully for project: ${projectId}`);
  return admin;
};

try {
  initFirebaseAdmin();
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('[Firebase Admin Initialization Error]:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

module.exports = admin;
