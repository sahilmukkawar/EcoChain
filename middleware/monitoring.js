// middleware/monitoring.js
const os = require('os');
const logger = require('../utils/logger');

// Store metrics
const metrics = {
  requestCount: 0,
  errorCount: 0,
  startTime: Date.now(),
  endpoints: {}
};

// Get system information
const getSystemInfo = () => {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    freeMemory: os.freemem(),
    totalMemory: os.totalmem(),
    loadAvg: os.loadavg()
  };
};

// Middleware to track request metrics
const monitoringMiddleware = (req, res, next) => {
  // Increment request count
  metrics.requestCount++;
  
  // Track endpoint usage
  const endpoint = `${req.method} ${req.route ? req.route.path : req.path}`;
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = {
      count: 0,
      totalResponseTime: 0,
      errors: 0
    };
  }
  
  metrics.endpoints[endpoint].count++;
  
  // Track response time
  const startHrTime = process.hrtime();
  
  // Override end method to capture metrics after response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate response time
    const hrTime = process.hrtime(startHrTime);
    const responseTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    // Update metrics
    metrics.endpoints[endpoint].totalResponseTime += responseTimeMs;
    
    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
      metrics.endpoints[endpoint].errors++;
    }
    
    // Log slow requests (over 1000ms)
    if (responseTimeMs > 1000) {
      logger.warn(`Slow request: ${endpoint} took ${responseTimeMs.toFixed(2)}ms`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: responseTimeMs
      });
    }
    
    // Call original end
    originalEnd.apply(res, arguments);
  };
  
  next();
};

// Health check endpoint handler
const healthCheck = (req, res) => {
  const systemInfo = getSystemInfo();
  const uptime = Date.now() - metrics.startTime;
  
  // Calculate average response time for each endpoint
  const endpointStats = {};
  Object.keys(metrics.endpoints).forEach(endpoint => {
    const data = metrics.endpoints[endpoint];
    endpointStats[endpoint] = {
      count: data.count,
      avgResponseTime: data.count > 0 ? (data.totalResponseTime / data.count).toFixed(2) : 0,
      errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) : 0
    };
  });
  
  // Calculate error rate
  const errorRate = metrics.requestCount > 0 
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) 
    : 0;
  
  // Memory usage in MB
  const memoryUsageMB = {
    rss: (systemInfo.memoryUsage.rss / 1024 / 1024).toFixed(2),
    heapTotal: (systemInfo.memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
    heapUsed: (systemInfo.memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
    external: (systemInfo.memoryUsage.external / 1024 / 1024).toFixed(2)
  };
  
  // System memory in GB
  const systemMemoryGB = {
    total: (systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2),
    free: (systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(2),
    used: ((systemInfo.totalMemory - systemInfo.freeMemory) / 1024 / 1024 / 1024).toFixed(2)
  };
  
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime / 1000),
      formatted: `${Math.floor(uptime / (1000 * 60 * 60))}h ${Math.floor((uptime / (1000 * 60)) % 60)}m ${Math.floor((uptime / 1000) % 60)}s`
    },
    process: {
      pid: process.pid,
      uptime: systemInfo.uptime,
      memoryUsage: memoryUsageMB,
      cpuUsage: systemInfo.cpuUsage
    },
    system: {
      memory: systemMemoryGB,
      loadAverage: systemInfo.loadAvg
    },
    requests: {
      total: metrics.requestCount,
      errors: metrics.errorCount,
      errorRate: `${errorRate}%`
    },
    endpoints: endpointStats
  });
};

module.exports = {
  monitoringMiddleware,
  healthCheck,
  metrics
};