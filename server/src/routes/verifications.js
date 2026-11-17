const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { verificationRateLimiter } = require('../middleware/rateLimiter');
const validateVerificationRequest = require('../middleware/validateVerification');
const { createVerification } = require('../controllers/verificationController');

// @desc    Create a new verification request
// @route   POST /api/verifications
// @access  Private (Authenticated Firebase session required)
router.post('/', protect, verificationRateLimiter, validateVerificationRequest, createVerification);

module.exports = router;
