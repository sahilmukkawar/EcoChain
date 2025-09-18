// routes/garbageCollectionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { checkApprovalStatus } = require('../middleware/approvalMiddleware');
const upload = require('../middleware/upload');
const garbageCollectionController = require('../controllers/garbageCollectionController');

// Apply approval middleware to all collection routes
router.use(authenticate);
router.use(checkApprovalStatus);

// Create a new garbage collection
router.post('/', upload.array('images', 10), garbageCollectionController.createCollection);

// Get all garbage collections for the authenticated user
router.get('/', garbageCollectionController.getAllCollections);

// Alias path for client compatibility
router.get('/user', garbageCollectionController.getAllCollections);

// Get nearby collections for collectors
router.get('/nearby', authorize(['collector']), garbageCollectionController.getNearbyCollections);

// Get a single garbage collection by ID
router.get('/:id', garbageCollectionController.getCollectionById);

// Update a garbage collection
router.put('/:id', garbageCollectionController.updateCollection);

// Delete a garbage collection
router.delete('/:id', garbageCollectionController.deleteCollection);

// Assign collector to a collection
router.post('/:collectionId/assign', authorize(['collector']), garbageCollectionController.assignCollector);

// Update a garbage collection status
router.put('/:collectionId/status', garbageCollectionController.updateCollectionStatus);

// Submit vision inference for a collection
router.post('/:collectionId/vision', authorize(['collector']), (req, res) => {
  // TODO: Implement submit vision inference
  res.status(501).json({ 
    success: false, 
    message: 'Vision inference feature not implemented yet' 
  });
});

// Complete a garbage collection and issue tokens
router.post('/:collectionId/complete', authorize(['collector', 'factory']), (req, res, next) => {
  req.body.status = 'completed';
  garbageCollectionController.updateCollectionStatus(req, res, next);
});

// Mark collection as collected (collector button action)
router.post('/:collectionId/collected', authorize(['collector']), garbageCollectionController.markAsCollected);

module.exports = router;