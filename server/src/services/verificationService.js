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

    case 'phone': {
      // Clean common formatting characters (spaces, hyphens, parentheses, dots)
      let phoneClean = normalized.replace(/[\s().-]/g, '');
      // Handle international access prefix '00' (e.g. '001415...' -> '+1415...')
      if (phoneClean.startsWith('00')) {
        phoneClean = '+' + phoneClean.slice(2);
      }
      const hasPlus = phoneClean.startsWith('+');
      const digitsOnly = phoneClean.replace(/\D/g, '');
      return hasPlus ? `+${digitsOnly}` : digitsOnly;
    }

    case 'website': {
      // Lowercase and strip trailing slashes for baseline comparison
      normalized = normalized.toLowerCase();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    }

    default:
      return normalized;
  }
};

module.exports = {
  normalizeInput
};
