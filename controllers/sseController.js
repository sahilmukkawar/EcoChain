// controllers/sseController.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Store connected clients
const clients = new Map();

/**
 * SSE endpoint for real-time updates
 */
const sseHandler = (req, res) => {
  try {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Extract token from query parameters
    const token = req.query.token;
    if (!token) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Authentication required' })}\n\n`);
      res.end();
      return;
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Invalid SSE authentication attempt', { error: err.message });
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Invalid token' })}\n\n`);
        res.end();
        return;
      }

      // Generate unique client ID
      const clientId = `${decoded.id}-${Date.now()}`;
      
      // Store client info
      const client = {
        id: clientId,
        userId: decoded.id,
        res: res,
        subscriptions: req.query.entities ? req.query.entities.split(',') : []
      };
      
      clients.set(clientId, client);
      
      logger.info(`SSE client connected: ${client.userId}`, { clientId });

      // Send welcome message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to EcoChain SSE service',
        timestamp: Date.now()
      })}\n\n`);

      // Handle client disconnect
      req.on('close', () => {
        clients.delete(clientId);
        logger.info(`SSE client disconnected: ${client.userId}`, { clientId });
      });

      // Handle client errors
      req.on('error', (error) => {
        clients.delete(clientId);
        logger.error('SSE client error:', error);
      });
    });
  } catch (error) {
    logger.error('SSE connection error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Server error' })}\n\n`);
    res.end();
  }
};

/**
 * Broadcast an update to all subscribed clients
 */
const broadcastUpdate = (entityType, changeType, changes) => {
  const message = JSON.stringify({
    type: 'sync',
    entityType,
    changeType,
    changes,
    timestamp: Date.now()
  });

  clients.forEach((client) => {
    try {
      // Check if client is subscribed to this entity type
      if (client.subscriptions.length === 0 || client.subscriptions.includes(entityType)) {
        client.res.write(`data: ${message}\n\n`);
      }
    } catch (error) {
      logger.error('Error sending SSE message:', error);
      // Remove client if we can't send messages
      clients.delete(client.id);
    }
  });
};

module.exports = {
  sseHandler,
  broadcastUpdate
};