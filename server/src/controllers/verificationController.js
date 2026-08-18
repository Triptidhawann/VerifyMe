const Verification = require('../models/Verification');
const { normalizeInput } = require('../services/verificationService');

/**
 * @desc    Create a new verification request
 * @route   POST /api/verifications
 * @access  Private
 */
const createVerification = async (req, res, next) => {
  try {
    const { type, input } = req.body;

    // 1. Validate request
    if (!type || !input) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both type and input for verification.'
      });
    }

    const validTypes = ['phone', 'email', 'website'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // 2. Normalize input
    const normalizedInput = normalizeInput(type, input);

    if (!normalizedInput) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format provided.'
      });
    }

    // 3. Create verification record
    const verification = await Verification.create({
      user: req.user._id,
      type,
      input,
      normalizedInput,
      status: 'pending' // Engine will pick this up later
    });

    // 4. Return clean response
    res.status(201).json({
      success: true,
      message: 'Verification request created successfully.',
      verification: {
        id: verification._id,
        type: verification.type,
        status: verification.status,
        createdAt: verification.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVerification
};
