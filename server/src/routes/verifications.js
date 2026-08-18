const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createVerification } = require('../controllers/verificationController');

// @desc    Create a new verification request
// @route   POST /api/verifications
// @access  Private
router.post('/', protect, createVerification);

module.exports = router;
