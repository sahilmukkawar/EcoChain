// middleware/requestLogger.js
const logger = require('../utils/logger');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Custom token for request ID
morgan.token('id', (req) => req.id);

// Custom token for response time
morgan.token('response-time', (req, res) => {
  if (!req.startTime) return '';
  return Date.now() - req.startTime;
});

// Custom format that includes request ID and response time
const morganFormat = ':id :method :url :status :response-time ms - :res[content-length]';

// Request logger middleware
const requestLogger = () => {
  return [
    // Add request ID and start time to each request
    (req, res, next) => {
      req.id = uuidv4();
      req.startTime = Date.now();
      next();
    },
    // Log requests using Morgan
    morgan(morganFormat, {
      stream: logger.stream
    }),
    // Log detailed request information
    (req, res, next) => {
      // Capture the original end function
      const originalEnd = res.end;
      
      // Override the end function
      res.end = function(chunk, encoding) {
        // Call the original end function
        originalEnd.call(this, chunk, encoding);
        
        // Log the response
        logger.info(`Request completed: ${req.method} ${req.originalUrl}`, {
          requestId: req.id,
          statusCode: res.statusCode,
          responseTime: Date.now() - req.startTime,
          userAgent: req.headers['user-agent'],
          ip: req.ip
        });
      };
      
      next();
    }
  ];
};

module.exports = requestLogger;