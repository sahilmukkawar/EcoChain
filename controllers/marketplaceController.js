// controllers/marketplaceController.js
const { Product } = require('../database/models/Marketplace');
const logger = require('../utils/logger');

/**
 * Get all marketplace listings
 */
const getAllListings = async (req, res) => {
  try {
    const listings = await Product.find({ status: 'active' }).populate('sellerId', 'personalInfo.name');
    res.status(200).json({ success: true, message: 'Products fetched successfully', data: listings });
  } catch (error) {
    logger.error('Error fetching marketplace listings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marketplace listings', error: error.message });
  }
};

/**
 * Get a single marketplace listing by ID
 */
const getListingById = async (req, res) => {
  try {
    const listing = await Product.findById(req.params.id).populate('sellerId', 'personalInfo.name');
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.status(200).json({ success: true, message: 'Product fetched successfully', data: listing });
  } catch (error) {
    logger.error('Error fetching marketplace listing:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

/**
 * Create a new marketplace listing
 */
const createListing = async (req, res) => {
  try {
    const { name, description, category, price, images } = req.body;
    const sellerId = req.user.id;

    // Generate unique product ID
    const productId = 'PRD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const listing = new Product({
      productId,
      sellerId,
      sellerType: 'user', // Can be determined based on user role
      name,
      description,
      category,
      price: {
        tokenAmount: price.tokenAmount || 0,
        fiatAmount: price.fiatAmount || 0,
        currency: price.currency || 'EcoToken'
      },
      images: images || [],
      inventory: {
        available: req.body.quantity || 1
      },
      status: 'active'
    });

    await listing.save();
    res.status(201).json({ success: true, message: 'Product created successfully', data: listing });
  } catch (error) {
    logger.error('Error creating marketplace listing:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

/**
 * Update a marketplace listing
 */
const updateListing = async (req, res) => {
  try {
    const { name, description, category, price, images, status } = req.body;
    
    const listing = await Product.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if the listing belongs to the authenticated user
    if (listing.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }
    
    // Update fields
    if (name) listing.name = name;
    if (description) listing.description = description;
    if (category) listing.category = category;
    if (price) listing.price = price;
    if (images) listing.images = images;
    if (status) listing.status = status;
    
    await listing.save();
    res.status(200).json({ success: true, message: 'Product updated successfully', data: listing });
  } catch (error) {
    logger.error('Error updating marketplace listing:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

/**
 * Delete a marketplace listing
 */
const deleteListing = async (req, res) => {
  try {
    const listing = await Product.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if the listing belongs to the authenticated user
    if (listing.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting marketplace listing:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

/**
 * Search marketplace listings
 */
const searchListings = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice } = req.query;
    
    const searchQuery = { status: 'active' };
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (minPrice || maxPrice) {
      searchQuery['price.fiatAmount'] = {};
      if (minPrice) searchQuery['price.fiatAmount'].$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery['price.fiatAmount'].$lte = parseFloat(maxPrice);
    }
    
    const listings = await Product.find(searchQuery).populate('sellerId', 'personalInfo.name');
    res.status(200).json({ success: true, message: 'Search completed successfully', data: listings });
  } catch (error) {
    logger.error('Error searching marketplace listings:', error);
    res.status(500).json({ success: false, message: 'Failed to search products', error: error.message });
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  searchListings
};