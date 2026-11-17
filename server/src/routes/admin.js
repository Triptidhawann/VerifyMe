const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// @desc    Administrative dashboard overview
// @route   GET /api/admin
// @access  Protected (Requires authenticated Firebase session with ADMIN custom claim)
router.get('/', protect, authorizeRoles('ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: '[VerifyMe Admin Portal] Administrative route accessed successfully.',
    admin: {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
