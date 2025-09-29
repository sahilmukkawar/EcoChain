// middleware/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // Default 5 min TTL

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a cache key from the request URL and query params
    const cacheKey = `${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      // Add cache hit header for monitoring
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }

    // Store the original send method
    const originalSend = res.json;

    // Override res.json method to cache the response
    res.json = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, ttl);
      }
      
      // Add cache miss header for monitoring
      res.set('X-Cache', 'MISS');
      
      // Call the original method
      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Clear cache for specific routes
 * @param {string|Array} routes - Route(s) to clear from cache
 */
const clearCache = (routes) => {
  if (!routes) {
    // Clear all cache
    cache.flushAll();
    return;
  }

  const routeArray = Array.isArray(routes) ? routes : [routes];
  
  // Get all cache keys
  const keys = cache.keys();
  
  // Filter keys that match the routes and delete them
  keys.forEach(key => {
    if (routeArray.some(route => key.includes(route))) {
      cache.del(key);
    }
  });
};

module.exports = {
  cacheMiddleware,
  clearCache
};