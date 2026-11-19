const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { verificationRateLimiter } = require('../middleware/rateLimiter');
const {
  investigateJob,
  getJobShieldHistory,
  getJobShieldInvestigation
} = require('../controllers/jobShieldController');

// @route   POST /api/jobshield/investigate
// @desc    Run recruitment fraud investigation on text, PDF, image, or URL
// @access  Private (Firebase Bearer token required)
router.post('/investigate', protect, verificationRateLimiter, investigateJob);

// @route   GET /api/jobshield/history
// @desc    Get user's JobShield investigation history
// @access  Private
router.get('/history', protect, getJobShieldHistory);

// @route   GET /api/jobshield/investigations/:id
// @desc    Get details of a single JobShield investigation
// @access  Private
router.get('/investigations/:id', protect, getJobShieldInvestigation);

module.exports = router;
