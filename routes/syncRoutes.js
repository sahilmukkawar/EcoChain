// routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const syncController = require('../controllers/syncController');

// Get latest data for a specific entity type
router.get('/:entityType', authenticate, syncController.getLatestData);

// Push updates from client to server
router.post('/:entityType', authenticate, syncController.pushUpdates);

// Get sync status and statistics
router.get('/status', authenticate, syncController.getSyncStatus);

module.exports = router;