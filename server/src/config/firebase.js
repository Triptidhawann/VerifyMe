const admin = require('firebase-admin');

// Note: In production, the GOOGLE_APPLICATION_CREDENTIALS environment variable
// should point to the service account JSON file, or you can pass the object directly.
// For development, we'll initialize without arguments to use default credentials,
// or you can configure a service account JSON path here.

try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });
  console.log('Firebase Admin initialized');
} catch (error) {
  // If already initialized, ignore the error
  if (!/already exists/.test(error.message)) {
    console.error('Firebase Admin initialization error', error.stack);
  }
}

module.exports = admin;
