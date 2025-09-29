// middleware/compression.js
const compression = require('compression');

/**
 * Configure compression middleware with optimal settings
 * Reduces payload size for HTTP responses
 * 
 * @returns {Function} Configured compression middleware
 */
const compressionMiddleware = () => {
  return compression({
    // Filter function to determine which responses to compress
    filter: (req, res) => {
      // Don't compress if client explicitly refuses compression
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Use compression for all other responses
      return compression.filter(req, res);
    },
    // Compression level (0-9, where 9 is maximum compression)
    level: 6,
    // Minimum size threshold in bytes to compress response
    threshold: 1024 // Don't compress responses smaller than 1KB
  });
};

module.exports = compressionMiddleware;