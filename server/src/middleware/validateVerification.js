/**
 * Request validation middleware for verification endpoints
 * Validates request structure, types, lengths, and cleans inputs.
 */
const validateVerificationRequest = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body. JSON object expected.'
    });
  }

  const { type, input } = req.body;

  // 1. Validate 'type'
  if (!type || typeof type !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Verification 'type' is required and must be a string."
    });
  }

  const normalizedType = type.trim().toLowerCase();
  const validTypes = ['phone', 'email', 'website'];
  if (!validTypes.includes(normalizedType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid verification type. Supported types are: ${validTypes.join(', ')}.`
    });
  }

  // 2. Validate 'input'
  if (input === undefined || input === null || typeof input !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Verification 'input' is required and must be a string."
    });
  }

  const trimmedInput = input.trim();
  if (trimmedInput.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Verification 'input' cannot be empty."
    });
  }

  if (trimmedInput.length > 2048) {
    return res.status(400).json({
      success: false,
      error: "Verification 'input' exceeds maximum allowed length of 2048 characters."
    });
  }

  // Attach sanitized inputs
  req.body.type = normalizedType;
  req.body.input = trimmedInput;

  next();
};

module.exports = validateVerificationRequest;
