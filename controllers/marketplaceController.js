// controllers/marketplaceController.js
const Marketplace = require('../database/models/Marketplace');
const logger = require('../utils/logger');

/**
 * Get all marketplace listings
 */
const getAllListings = async (req, res) => {
  try {
    const listings = await Marketplace.find({}).populate('userId', 'personalInfo.name');
    res.status(200).json(listings);
  } catch (error) {
    logger.error('Error fetching marketplace listings:', error);
    res.status(500).json({ message: 'Failed to fetch marketplace listings', error: error.message });
  }
};

/**
 * Get a single marketplace listing by ID
 */
const getListingById = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id).populate('userId', 'personalInfo.name');
    
    if (!listing) {
      return res.status(404).json({ message: 'Marketplace listing not found' });
    }
    
    res.status(200).json(listing);
  } catch (error) {
    logger.error('Error fetching marketplace listing:', error);
    res.status(500).json({ message: 'Failed to fetch marketplace listing', error: error.message });
  }
};

/**
 * Create a new marketplace listing
 */
const createListing = async (req, res) => {
  try {
    const { title, description, category, price, quantity, images, location } = req.body;
    const userId = req.user.id;

    const listing = new Marketplace({
      userId,
      title,
      description,
      category,
      price,
      quantity,
      images,
      location,
      status: 'active'
    });

    await listing.save();
    res.status(201).json(listing);
  } catch (error) {
    logger.error('Error creating marketplace listing:', error);
    res.status(500).json({ message: 'Failed to create marketplace listing', error: error.message });
  }
};

/**
 * Update a marketplace listing
 */
const updateListing = async (req, res) => {
  try {
    const { title, description, category, price, quantity, images, location, status } = req.body;
    
    const listing = await Marketplace.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Marketplace listing not found' });
    }
    
    // Check if the listing belongs to the authenticated user
    if (listing.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }
    
    // Update fields
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (category) listing.category = category;
    if (price) listing.price = price;
    if (quantity) listing.quantity = quantity;
    if (images) listing.images = images;
    if (location) listing.location = location;
    if (status) listing.status = status;
    
    await listing.save();
    res.status(200).json(listing);
  } catch (error) {
    logger.error('Error updating marketplace listing:', error);
    res.status(500).json({ message: 'Failed to update marketplace listing', error: error.message });
  }
};

/**
 * Delete a marketplace listing
 */
const deleteListing = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Marketplace listing not found' });
    }
    
    // Check if the listing belongs to the authenticated user
    if (listing.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }
    
    await listing.remove();
    res.status(200).json({ message: 'Marketplace listing deleted successfully' });
  } catch (error) {
    logger.error('Error deleting marketplace listing:', error);
    res.status(500).json({ message: 'Failed to delete marketplace listing', error: error.message });
  }
};

/**
 * Search marketplace listings
 */
const searchListings = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, location } = req.query;
    
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }
    
    if (location) {
      searchQuery['location.city'] = { $regex: location, $options: 'i' };
    }
    
    const listings = await Marketplace.find(searchQuery).populate('userId', 'personalInfo.name');
    res.status(200).json(listings);
  } catch (error) {
    logger.error('Error searching marketplace listings:', error);
    res.status(500).json({ message: 'Failed to search marketplace listings', error: error.message });
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