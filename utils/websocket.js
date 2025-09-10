// utils/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let wss = null;
const clients = new Map(); // Map to store client connections with their user IDs

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    // Extract token from URL query parameters
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    if (!token) {
      logger.warn('WebSocket connection attempt without token');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      
      // Store client connection with user ID
      clients.set(ws, userId);
      logger.info(`WebSocket client connected: ${userId}`);
      
      // Send initial connection success message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'success',
        message: 'Connected to EcoChain sync service'
      }));
      
      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          handleClientMessage(ws, userId, data);
        } catch (error) {
          logger.error(`Error processing WebSocket message: ${error.message}`);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle client disconnection
      ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${userId}`);
        clients.delete(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${userId}: ${error.message}`);
        clients.delete(ws);
      });
      
    } catch (error) {
      logger.warn(`WebSocket authentication failed: ${error.message}`);
      ws.close(1008, 'Authentication failed');
    }
  });
  
  logger.info('WebSocket server initialized');
};

/**
 * Handle incoming client messages
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} userId - User ID
 * @param {Object} data - Message data
 */
const handleClientMessage = (ws, userId, data) => {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
      break;
      
    case 'subscribe':
      // Handle subscription to specific entity types
      if (Array.isArray(data.entityTypes) && data.entityTypes.length > 0) {
        // Store subscription preferences (could be expanded)
        ws.entitySubscriptions = data.entityTypes;
        ws.send(JSON.stringify({
          type: 'subscribe',
          status: 'success',
          entityTypes: data.entityTypes
        }));
        logger.info(`Client ${userId} subscribed to: ${data.entityTypes.join(', ')}`);
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid subscription request'
        }));
      }
      break;
      
    default:
      logger.warn(`Unknown message type from client ${userId}: ${data.type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
};

/**
 * Broadcast data changes to relevant clients
 * @param {string} entityType - Type of entity that changed
 * @param {Array} changes - Array of changed entities
 * @param {string} changeType - Type of change (create, update, delete)
 * @param {string} [excludeUserId] - User ID to exclude from broadcast (usually the one who made the change)
 */
const broadcastChanges = (entityType, changes, changeType, excludeUserId = null) => {
  if (!wss || clients.size === 0) return;
  
  const message = JSON.stringify({
    type: 'sync',
    entityType,
    changeType,
    timestamp: Date.now(),
    changes
  });
  
  // Broadcast to all connected clients who are subscribed to this entity type
  for (const [ws, userId] of clients.entries()) {
    // Skip the user who made the change
    if (userId === excludeUserId) continue;
    
    // Check if client is subscribed to this entity type
    if (ws.entitySubscriptions && 
        (ws.entitySubscriptions.includes(entityType) || ws.entitySubscriptions.includes('all'))) {
      ws.send(message);
    }
  }
  
  logger.info(`Broadcasted ${changeType} for ${entityType} to ${clients.size} clients`);
};

/**
 * Send notification to specific user
 * @param {string} userId - User ID to send notification to
 * @param {Object} notification - Notification data
 */
const notifyUser = (userId, notification) => {
  if (!wss || clients.size === 0) return false;
  
  let notified = false;
  
  // Find all connections for this user ID
  for (const [ws, clientUserId] of clients.entries()) {
    if (clientUserId === userId) {
      ws.send(JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: Date.now()
      }));
      notified = true;
    }
  }
  
  if (notified) {
    logger.info(`Sent notification to user ${userId}`);
  }
  
  return notified;
};

/**
 * Get count of connected clients
 * @returns {number} Number of connected clients
 */
const getConnectedClientsCount = () => {
  return clients.size;
};

/**
 * Close all WebSocket connections
 */
const closeAllConnections = () => {
  if (!wss) return;
  
  for (const [ws] of clients.entries()) {
    ws.close(1001, 'Server shutting down');
  }
  
  clients.clear();
  logger.info('All WebSocket connections closed');
};

module.exports = {
  initWebSocket,
  broadcastChanges,
  notifyUser,
  getConnectedClientsCount,
  closeAllConnections
};