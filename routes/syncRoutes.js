// routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Mock data for demonstration
// In a real application, this would interact with your database models
const syncData = {
  users: [],
  collections: [],
  marketplace: [],
  transactions: []
};

// Get latest data for an entity type
router.get('/:entityType', authenticate, (req, res) => {
  try {
    const { entityType } = req.params;
    const lastSyncTimestamp = parseInt(req.query.lastSyncTimestamp) || 0;
    
    // Validate entity type
    if (!syncData.hasOwnProperty(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }
    
    // Filter data based on timestamp
    const filteredData = syncData[entityType].filter(item => {
      return !item.updatedAt || new Date(item.updatedAt).getTime() > lastSyncTimestamp;
    });
    
    res.json({
      success: true,
      data: filteredData,
      syncTimestamp: Date.now()
    });
  } catch (error) {
    console.error('Sync get error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync data'
    });
  }
});

// Push updates for an entity type
router.post('/:entityType', authenticate, (req, res) => {
  try {
    const { entityType } = req.params;
    const { updates } = req.body;
    
    // Validate entity type
    if (!syncData.hasOwnProperty(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type'
      });
    }
    
    // Process updates
    const results = [];
    
    if (Array.isArray(updates)) {
      updates.forEach((update, index) => {
        try {
          const { id, operation, data } = update;
          
          switch (operation) {
            case 'create':
              const newItem = {
                ...data,
                id: id || Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              syncData[entityType].push(newItem);
              results.push({
                success: true,
                id: newItem.id,
                operation,
                index
              });
              break;
              
            case 'update':
              const itemIndex = syncData[entityType].findIndex(item => item.id === id);
              if (itemIndex !== -1) {
                syncData[entityType][itemIndex] = {
                  ...syncData[entityType][itemIndex],
                  ...data,
                  updatedAt: new Date().toISOString()
                };
                results.push({
                  success: true,
                  id,
                  operation,
                  index
                });
              } else {
                results.push({
                  success: false,
                  id,
                  operation,
                  index,
                  error: 'Item not found'
                });
              }
              break;
              
            case 'delete':
              const deleteIndex = syncData[entityType].findIndex(item => item.id === id);
              if (deleteIndex !== -1) {
                syncData[entityType].splice(deleteIndex, 1);
                results.push({
                  success: true,
                  id,
                  operation,
                  index
                });
              } else {
                results.push({
                  success: false,
                  id,
                  operation,
                  index,
                  error: 'Item not found'
                });
              }
              break;
              
            default:
              results.push({
                success: false,
                id,
                operation,
                index,
                error: 'Invalid operation'
              });
          }
        } catch (error) {
          results.push({
            success: false,
            id: update.id,
            operation: update.operation,
            index,
            error: error.message
          });
        }
      });
    }
    
    res.json({
      success: true,
      results,
      syncTimestamp: Date.now()
    });
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to push sync data'
    });
  }
});

// Get sync status
router.get('/status', authenticate, (req, res) => {
  try {
    const status = {};
    
    Object.keys(syncData).forEach(entityType => {
      status[entityType] = {
        count: syncData[entityType].length,
        lastUpdated: syncData[entityType].length > 0 
          ? Math.max(...syncData[entityType].map(item => new Date(item.updatedAt || item.createdAt).getTime()))
          : null
      };
    });
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status'
    });
  }
});

module.exports = router;