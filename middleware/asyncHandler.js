// middleware/asyncHandler.js
const logger = require('../utils/logger');

/**
 * Async error handler middleware
 * Wraps async route handlers to catch unhandled promise rejections
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Execute the async function and catch any errors
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Log the error with request context
    logger.error('Async handler caught error:', {
      url: req.url,
      method: req.method,
      userId: req.user ? req.user.id : 'unauthenticated',
      error: error.message,
      stack: error.stack
    });
    
    // Send consistent error response
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  });
};

module.exports = asyncHandler;