const express = require('express');
const router = express.Router();
const {
  investigateCredential,
  getCredentialHistory,
  getCredentialInvestigation,
  deleteCredentialInvestigation,
  getVerificationSources
} = require('../controllers/credentialCheckController');
const { protect } = require('../middleware/authMiddleware');
const { verificationRateLimiter } = require('../middleware/rateLimiter');

// Public information endpoint for sources
router.get('/sources', getVerificationSources);

// Protected endpoints requiring Firebase Auth
router.post('/investigate', protect, verificationRateLimiter, investigateCredential);
router.get('/history', protect, getCredentialHistory);
router.get('/investigations/:id', protect, getCredentialInvestigation);
router.delete('/investigations/:id', protect, deleteCredentialInvestigation);

module.exports = router;
