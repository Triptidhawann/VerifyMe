// const Verification = require('../models/Verification');
const { normalizeInput } = require('../services/verificationService');
const { performVerification } = require('../services/intelligenceEngine');

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

    // 3. Perform analysis
    const analysisResult = await performVerification(type, normalizedInput);

    // 4. Return clean response to frontend
    res.status(200).json({
      success: true,
      message: 'Verification request processed successfully.',
      verification: {
        id: `local-${Date.now()}`, // Temporary ID, frontend generates Firestore ID via addDoc
        targetType: type,
        target: input,
        normalizedTarget: normalizedInput,
        ...analysisResult
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVerification
};
