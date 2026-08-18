const express = require('express');
const router = express.Router();

// @desc    Placeholder for admin routes
// @route   GET /api/admin
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '[Development Placeholder] Admin route exists. Logic to be implemented in future phases.'
  });
});

module.exports = router;
