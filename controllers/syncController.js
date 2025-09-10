// controllers/syncController.js
const { User } = require('../database/models');
const logger = require('../utils/logger');
const websocket = require('../utils/websocket');

/**
 * Controller for handling data synchronization between frontend and backend
 */

/**
 * Get the latest data for a specific entity type
 */
const getLatestData = async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const { lastSyncTimestamp } = req.query;
    
    // Validate entity type
    const validEntityTypes = ['users', 'collections', 'marketplace', 'transactions'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid entity type: ${entityType}` 
      });
    }
    
    // Parse timestamp or use a default old date
    const timestamp = lastSyncTimestamp ? new Date(parseInt(lastSyncTimestamp)) : new Date(0);
    
    // Get model based on entity type
    let Model;
    switch(entityType) {
      case 'users':
        Model = require('../database/models/User');
        break;
      case 'collections':
        Model = require('../database/models/GarbageCollection');
        break;
      case 'marketplace':
        Model = require('../database/models/MarketplaceItem');
        break;
      case 'transactions':
        Model = require('../database/models/Transaction');
        break;
    }
    
    // Query for updated records
    const updatedRecords = await Model.find({
      updatedAt: { $gt: timestamp }
    }).select('-password');
    
    // Log synchronization activity
    logger.info(`Sync requested for ${entityType} since ${timestamp}. Found ${updatedRecords.length} updated records.`);
    
    return res.status(200).json({
      success: true,
      data: updatedRecords,
      syncTimestamp: Date.now()
    });
  } catch (error) {
    logger.error(`Sync error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Push updates from client to server
 */
const pushUpdates = async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const { updates } = req.body;
    
    // Validate entity type
    const validEntityTypes = ['users', 'collections', 'marketplace', 'transactions'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid entity type: ${entityType}` 
      });
    }
    
    // Validate updates array
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be a non-empty array'
      });
    }
    
    // Get model based on entity type
    let Model;
    switch(entityType) {
      case 'users':
        Model = require('../database/models/User');
        break;
      case 'collections':
        Model = require('../database/models/GarbageCollection');
        break;
      case 'marketplace':
        Model = require('../database/models/MarketplaceItem');
        break;
      case 'transactions':
        Model = require('../database/models/Transaction');
        break;
    }
    
    // Process each update
    const results = [];
    const successfulUpdates = [];
    
    for (const update of updates) {
      const { id, data, operation } = update;
      
      let result;
      switch(operation) {
        case 'create':
          const newRecord = new Model(data);
          result = await newRecord.save();
          break;
        case 'update':
          result = await Model.findByIdAndUpdate(id, { $set: data }, { new: true });
          break;
        case 'delete':
          result = await Model.findByIdAndDelete(id);
          break;
        default:
          results.push({
            id,
            success: false,
            message: `Invalid operation: ${operation}`
          });
          continue;
      }
      
      const resultObj = {
        id: result ? result._id : id,
        success: !!result,
        message: result ? 'Operation successful' : 'Record not found'
      };
      
      results.push(resultObj);
      
      // If successful, add to list for broadcasting
      if (resultObj.success) {
        successfulUpdates.push({
          ...resultObj,
          operation,
          data: result || data
        });
      }
    }
    
    // Log synchronization activity
    logger.info(`${results.length} updates processed for ${entityType}`);
    
    // Broadcast changes to connected clients via WebSocket
    if (successfulUpdates.length > 0) {
      const userId = req.user ? req.user.id : null;
      websocket.broadcastChanges(entityType, successfulUpdates, userId);
      logger.info(`Broadcasting ${successfulUpdates.length} changes for ${entityType}`);
    }
    
    return res.status(200).json({
      success: true,
      results,
      syncTimestamp: Date.now()
    });
  } catch (error) {
    logger.error(`Sync error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get sync status and statistics
 */
const getSyncStatus = async (req, res, next) => {
  try {
    // Get counts from each collection
    const userCount = await require('../database/models/User').countDocuments();
    const collectionCount = await require('../database/models/GarbageCollection').countDocuments();
    const marketplaceCount = await require('../database/models/MarketplaceItem').countDocuments();
    const transactionCount = await require('../database/models/Transaction').countDocuments();
    
    return res.status(200).json({
      success: true,
      status: 'online',
      lastServerSync: Date.now(),
      statistics: {
        users: userCount,
        collections: collectionCount,
        marketplace: marketplaceCount,
        transactions: transactionCount
      }
    });
  } catch (error) {
    logger.error(`Sync status error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  getLatestData,
  pushUpdates,
  getSyncStatus
};