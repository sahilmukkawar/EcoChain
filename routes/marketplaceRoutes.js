// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Add this line to import upload middleware
const marketplaceController = require('../controllers/marketplaceController');

// Get all marketplace listings (user-facing, only active products)
router.get('/', marketplaceController.getActiveProducts);

// Get user's marketplace listings (for factories)
router.get('/user', authenticate, marketplaceController.getUserListings);

// Get factory's products (for factories)
router.get('/my-products', authenticate, marketplaceController.getFactoryProducts);

// Search marketplace listings
router.get('/search', marketplaceController.searchListings);

// Get a single marketplace listing by ID (must be after specific routes like /my-products)
router.get('/:id', marketplaceController.getListingById);

// Create a new marketplace listing with file upload support
router.post('/', authenticate, upload.array('images', 5), marketplaceController.createListing);

// Update a marketplace listing with file upload support
router.put('/:id', authenticate, upload.array('images', 5), marketplaceController.updateListing);

// Delete a marketplace listing
router.delete('/:id', authenticate, marketplaceController.deleteListing);

module.exports = router;