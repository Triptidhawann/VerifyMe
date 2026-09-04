const admin = require('../config/firebase');
const { getAuth } = require('firebase-admin/auth');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify Firebase ID Token
      const decodedToken = await getAuth().verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        role: 'USER' // Role can be stored in custom claims if needed later
      };

      next();
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, no user found'));
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role ${req.user.role} is not authorized to access this route`));
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
