const { getAuth } = require('firebase-admin/auth');

/**
 * Firebase ID Token Authentication & Authorization Middleware
 * - Extracts and verifies Firebase Bearer tokens from Authorization header
 * - Verifies cryptographic token signature, expiration, audience and issuer
 * - Checks revocation when credentials or configuration permits
 * - Extracts authenticated identity: uid, email, name
 * - Derives role strictly from verified custom claims, defaulting to 'USER'
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token || token.trim() === '') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized: Bearer token is empty or missing.'
        });
      }

      // Allow test injection of mock auth if provided
      const authService = req.firebaseAuth || (req.app && req.app.get('firebaseAuth')) || getAuth();

      // Revocation checking decision:
      // In production or when service account credentials are provided, verify revocation against Firebase Auth.
      // In local dev without credentials, verify token cryptographically (signature, exp, aud, iss).
      const hasCredentials = Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST
      );
      const checkRevocation = process.env.CHECK_TOKEN_REVOCATION === 'true' ||
        (process.env.CHECK_TOKEN_REVOCATION !== 'false' && hasCredentials);

      const decodedToken = await authService.verifyIdToken(token, checkRevocation);

      // Resolve role STRICTLY from verified Firebase custom claims.
      // Never trust client-supplied headers, body, or query parameters.
      const rawRole = (decodedToken.role || (decodedToken.admin === true ? 'ADMIN' : 'USER')).toString().toUpperCase();
      const resolvedRole = (rawRole === 'ADMIN') ? 'ADMIN' : 'USER';

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        name: decodedToken.name || null,
        role: resolvedRole
      };

      next();
    } catch (error) {
      const code = error.code || '';
      let message = 'Not authorized: Token verification failed.';

      if (code === 'auth/id-token-expired') {
        message = 'Not authorized: Firebase ID token has expired.';
      } else if (code === 'auth/id-token-revoked') {
        message = 'Not authorized: User session has been revoked.';
      } else if (code === 'auth/argument-error' || code === 'auth/invalid-id-token') {
        message = 'Not authorized: Malformed or forged token structure.';
      }

      if (process.env.NODE_ENV !== 'production') {
        console.error('[authMiddleware] Token verification failed:', error.message);
      }

      return res.status(401).json({
        success: false,
        error: message,
        code: code || 'auth/unauthorized',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: 'Not authorized: No Bearer token provided in Authorization header.'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Restricts access to routes based on verified user role.
 * Role check is performed strictly against req.user.role resolved by protect().
 */
const authorizeRoles = (...roles) => {
  const normalizedAllowedRoles = roles.map(r => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: User identity or role has not been authenticated.'
      });
    }

    const userRole = req.user.role.toUpperCase();

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles
};
