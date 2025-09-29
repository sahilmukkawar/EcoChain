// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { rateLimits } = require('../config/security');

/**
 * Rate limiter middleware for authentication routes
 * Prevents brute force attacks by limiting login attempts
 */
const authLimiter = rateLimit({
  windowMs: rateLimits.auth.windowMs,
  max: rateLimits.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(rateLimits.auth.message);
  }
});

/**
 * General API rate limiter
 * Prevents abuse and DoS attacks
 */
const apiLimiter = rateLimit({
  windowMs: rateLimits.api.windowMs,
  max: rateLimits.api.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(rateLimits.api.message);
  }
});

module.exports = {
  authLimiter,
  apiLimiter
};