// utils/socketManager.js
const logger = require('./logger');

/**
 * Utility functions for WebSocket communication
 */

/**
 * Broadcast an update to all connected clients subscribed to the entity type
 * @param {string} entityType - The type of entity being updated
 * @param {string} changeType - The type of change (create, update, delete)
 * @param {Array|Object} changes - The data that was changed
 */
const broadcastUpdate = (entityType, changeType, changes) => {
  try {
    // Check if global.broadcastUpdate exists (set up in server.js)
    if (typeof global.broadcastUpdate === 'function') {
      global.broadcastUpdate(entityType, changeType, changes);
      logger.info(`Broadcast ${changeType} for ${entityType} to WebSocket clients`);
    } else {
      logger.warn('WebSocket broadcast function not available');
    }
  } catch (error) {
    logger.error('Error broadcasting WebSocket update:', error);
  }
};

module.exports = {
  broadcastUpdate
};