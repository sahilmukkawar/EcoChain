// routes/garbageCollectionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const garbageCollectionController = require('../controllers/garbageCollectionController');

// Create a new garbage collection
router.post('/', authenticate, upload.array('images', 10), garbageCollectionController.createCollection);

// Get all garbage collections for the authenticated user
router.get('/', authenticate, garbageCollectionController.getAllCollections);

// Alias path for client compatibility
router.get('/user', authenticate, garbageCollectionController.getAllCollections);

// Get nearby collections for collectors
router.get('/nearby', authenticate, authorize(['collector']), garbageCollectionController.getNearbyCollections);

// Get a single garbage collection by ID
router.get('/:id', authenticate, garbageCollectionController.getCollectionById);

// Update a garbage collection
router.put('/:id', authenticate, garbageCollectionController.updateCollection);

// Delete a garbage collection
router.delete('/:id', authenticate, garbageCollectionController.deleteCollection);

// Assign collector to a collection
router.post('/:collectionId/assign', authenticate, authorize(['collector']), garbageCollectionController.assignCollector);

// Update a garbage collection status
router.put('/:collectionId/status', authenticate, garbageCollectionController.updateCollectionStatus);

// Submit vision inference for a collection
router.post('/:collectionId/vision', authenticate, authorize(['collector']), (req, res) => {
  // TODO: Implement submit vision inference
  res.status(501).json({ 
    success: false, 
    message: 'Vision inference feature not implemented yet' 
  });
});

// Complete a garbage collection and issue tokens
router.post('/:collectionId/complete', authenticate, authorize(['collector', 'factory']), (req, res, next) => {
  req.body.status = 'completed';
  garbageCollectionController.updateCollectionStatus(req, res, next);
});

module.exports = router;