// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const marketplaceController = require('../controllers/marketplaceController');

// Get all marketplace listings
router.get('/', marketplaceController.getAllListings);

// Get a single marketplace listing by ID
router.get('/:id', marketplaceController.getListingById);

// Create a new marketplace listing
router.post('/', authenticate, marketplaceController.createListing);

// Update a marketplace listing
router.put('/:id', authenticate, marketplaceController.updateListing);

// Delete a marketplace listing
router.delete('/:id', authenticate, marketplaceController.deleteListing);

// Search marketplace listings
router.get('/search', marketplaceController.searchListings);

module.exports = router;