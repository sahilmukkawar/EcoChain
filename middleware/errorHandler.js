// middleware/errorHandler.js

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(err.stack);
  
  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate Key Error',
      field: Object.keys(err.keyValue)[0]
    });
  }
  
  // Send error response
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Not found middleware for handling 404 errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};