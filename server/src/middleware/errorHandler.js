/**
 * Central Error Handling Middleware
 * - Intercepts body-parser JSON syntax errors (400)
 * - Intercepts payload size limit errors (413)
 * - Shields internal stack traces, paths, and sensitive secrets in production (500)
 */
const errorHandler = (err, req, res, next) => {
  // 1. JSON Syntax Error from express.json()
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body.'
    });
  }

  // 2. Request Entity Too Large (exceeds express.json size limit)
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    return res.status(413).json({
      success: false,
      error: 'Payload too large. Request body exceeds maximum allowed size.'
    });
  }

  // 3. Resolve status code
  const statusCode = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600)
    ? err.statusCode
    : (typeof err.status === 'number' && err.status >= 400 && err.status < 600)
      ? err.status
      : (res.statusCode >= 400 && res.statusCode < 600 ? res.statusCode : 500);

  const isProduction = process.env.NODE_ENV === 'production';

  // 4. Shield internal implementation details and stack traces in production
  let responseError = err.message || 'Internal verification service error';
  if (isProduction && statusCode === 500) {
    // Preserve CORS error message so clients know why CORS failed, shield other internal errors
    if (!responseError.startsWith('Not allowed by CORS')) {
      responseError = 'Internal verification service error';
    }
  }

  const responsePayload = {
    success: false,
    error: responseError
  };

  if (!isProduction && err.stack && statusCode === 500) {
    responsePayload.debug = {
      name: err.name,
      message: err.message
    };
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
