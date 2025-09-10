// routes/garbageCollectionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const garbageCollectionController = require('../controllers/garbageCollectionController');

// Create a new garbage collection
router.post('/', authenticate, garbageCollectionController.createCollection);

// Get all garbage collections for the authenticated user
router.get('/', authenticate, garbageCollectionController.getAllCollections);

// Alias path for client compatibility
router.get('/user', authenticate, garbageCollectionController.getAllCollections);

// Get a single garbage collection by ID
router.get('/:id', authenticate, garbageCollectionController.getCollectionById);

// Update a garbage collection
router.put('/:id', authenticate, garbageCollectionController.updateCollection);

// Delete a garbage collection
router.delete('/:id', authenticate, garbageCollectionController.deleteCollection);

// Get all garbage collections for a factory (placeholder route)
router.get('/factory/:factoryId', authenticate, authorize(['factory']), (req, res, next) => {
  // TODO: Implement get factory's garbage collection requests
  res.status(501).json({ message: 'Not implemented yet' });
});

// Update a garbage collection status
router.put('/:collectionId/status', authenticate, garbageCollectionController.updateCollectionStatus);

// Submit vision inference for a collection
router.post('/:collectionId/vision', authenticate, authorize(['collector']), (req, res) => {
  // TODO: Implement submit vision inference
  res.status(501).json({ message: 'Not implemented yet' });
});

// Complete a garbage collection and issue tokens
router.post('/:collectionId/complete', authenticate, authorize(['collector']), (req, res, next) => {
  req.body.status = 'completed';
  garbageCollectionController.updateCollectionStatus(req, res, next);
});

module.exports = router;