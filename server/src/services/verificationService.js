/**
 * Normalizes input for verification to ensure consistent database lookups
 * and risk engine processing.
 * 
 * @param {string} type - The type of input ('phone', 'email', 'website')
 * @param {string} input - The raw input provided by the user
 * @returns {string} The normalized input
 */
const normalizeInput = (type, input) => {
  if (!input) return '';

  let normalized = input.trim();

  switch (type) {
    case 'email':
      // Lowercase and trim
      return normalized.toLowerCase();

    case 'phone':
      // Strip all non-digit characters except leading plus (for E.164 format)
      // e.g. "+1 (555) 123-4567" -> "+15551234567"
      const hasPlus = normalized.startsWith('+');
      const digitsOnly = normalized.replace(/\D/g, '');
      return hasPlus ? `+${digitsOnly}` : digitsOnly;

    case 'website':
      // Lowercase and strip trailing slashes for baseline comparison
      normalized = normalized.toLowerCase();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;

    default:
      return normalized;
  }
};

module.exports = {
  normalizeInput
};
