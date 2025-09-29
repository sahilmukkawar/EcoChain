// middleware/errorHandler.js

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for server-side debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    errorCode: err.code || 'SERVER_ERROR',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'SERVER_ERROR';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation Error',
      code: 'VALIDATION_ERROR',
      errors: err.errors
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate Key Error',
      code: 'DUPLICATE_KEY',
      field: Object.keys(err.keyValue)[0]
    });
  }
  
  // Send standardized error response
  res.status(status).json({
    success: false,
    message,
    code: errorCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Not found middleware for handling 404 errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

/**
 * Async handler to catch errors in async routes
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};