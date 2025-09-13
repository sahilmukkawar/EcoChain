// controllers/marketplaceController.js
const { Factory, Product } = require('../database/models');
const logger = require('../utils/logger');

// Use the Product model directly

/**
 * Get all marketplace listings
 */
const getAllListings = async (req, res) => {
  try {
    const listings = await Product.find({ 'availability.isActive': true })
      .populate('factoryId', 'companyInfo.name location.city businessMetrics.sustainabilityRating');
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
    const listing = await Product.findById(req.params.id)
      .populate('factoryId', 'companyInfo.name location.city businessMetrics.sustainabilityRating');
    
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
    const { name, description, category, price, inventory, sustainabilityScore } = JSON.parse(req.body.data || '{}');
    
    // Check if user is a factory
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can create products' });
    }

    // Find factory profile
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    // Generate unique product ID
    const productId = 'PRD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Process uploaded images
    let productImages = [];
    if (req.files && req.files.length > 0) {
      // Map uploaded files to their paths - include the product-images subdirectory
      productImages = req.files.map(file => {
        // Create the correct path for product images
        return `/uploads/product-images/${file.filename}`;
      });
    } else {
      // Use default image if no images uploaded
      productImages = ['/uploads/default-product.svg'];
    }

    const listing = new Product({
      productId,
      factoryId: factory._id,
      productInfo: {
        name,
        description,
        category,
        images: productImages
      },
      pricing: {
        costPrice: Number(price.fiatAmount) || 0,  // Cost to produce (₹) - exact value
        sellingPrice: Number(price.fiatAmount) || 0,  // Selling price in money (₹) - exact value
        ecoTokenDiscount: Number(price.tokenAmount) || 0  // Token price - exact value
      },
      inventory: {
        currentStock: inventory.available || 0
      },
      sustainability: {
        recycledMaterialPercentage: sustainabilityScore || 0
      },
      availability: {
        isActive: true
      }
    });

    console.log('Creating product with exact pricing:');
    console.log('  Fiat Price (₹):', listing.pricing.sellingPrice);
    console.log('  Token Price:', listing.pricing.ecoTokenDiscount);

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
    console.log('=== UPDATE PRODUCT REQUEST ===');
    console.log('Request body data:', req.body.data);
    console.log('Request files:', req.files?.length || 0);
    
    const { name, description, category, price, images, inventory, sustainabilityScore, status } = JSON.parse(req.body.data || '{}');
    
    console.log('Parsed data:');
    console.log('- name:', name);
    console.log('- description:', description);
    console.log('- category:', category);
    console.log('- price:', price);
    console.log('- images:', images);
    console.log('- inventory:', inventory);
    console.log('- sustainabilityScore:', sustainabilityScore);
    console.log('- status:', status);
    
    // Check if user is a factory
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can update products' });
    }

    // Find factory profile
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }
    
    const listing = await Product.findOne({ _id: req.params.id, factoryId: factory._id });
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
    }
    
    console.log('=== BEFORE UPDATE ===');
    console.log('Current product name:', listing.productInfo.name);
    console.log('Current pricing:', {
      costPrice: listing.pricing.costPrice,
      sellingPrice: listing.pricing.sellingPrice,
      ecoTokenDiscount: listing.pricing.ecoTokenDiscount
    });
    console.log('Current inventory:', listing.inventory.currentStock);
    console.log('Current sustainability:', listing.sustainability.recycledMaterialPercentage);
    
    // Update fields
    if (name) {
      console.log('Updating name from', listing.productInfo.name, 'to', name);
      listing.productInfo.name = name;
    }
    if (description) {
      console.log('Updating description from', listing.productInfo.description, 'to', description);
      listing.productInfo.description = description;
    }
    if (category) {
      console.log('Updating category from', listing.productInfo.category, 'to', category);
      listing.productInfo.category = category;
    }
    
    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      // Map uploaded files to their paths - include the product-images subdirectory
      const uploadedImages = req.files.map(file => {
        // Create the correct path for product images
        return `/uploads/product-images/${file.filename}`;
      });
      
      // If we have existing images and new images, combine them
      // Otherwise, just use the new images
      if (images && images.length > 0) {
        // Filter out any invalid image paths and combine with new images
        const validExistingImages = images.filter(img => img && (img.startsWith('/uploads/') || img.startsWith('http')));
        listing.productInfo.images = [...validExistingImages, ...uploadedImages];
      } else {
        listing.productInfo.images = uploadedImages;
      }
      console.log('Updated images:', listing.productInfo.images);
    } else if (images && images.length > 0) {
      // Use provided image URLs if no new files uploaded
      console.log('Using existing images:', images);
      listing.productInfo.images = images;
    }
    
    if (price) {
      console.log('=== UPDATING PRICING ===');
      console.log('Price data received:', price);
      
      if (price.fiatAmount !== undefined) {
        // Ensure exact value preservation by using the exact input value
        const exactFiatAmount = Number(price.fiatAmount);
        console.log('Updating fiat amount from', listing.pricing.sellingPrice, 'to', exactFiatAmount);
        listing.pricing.costPrice = exactFiatAmount;
        listing.pricing.sellingPrice = exactFiatAmount;  // Use exact fiatAmount for selling price
      }
      if (price.tokenAmount !== undefined) {
        // Ensure exact value preservation by using the exact input value
        const exactTokenAmount = Number(price.tokenAmount);
        console.log('Updating token amount from', listing.pricing.ecoTokenDiscount, 'to', exactTokenAmount);
        listing.pricing.ecoTokenDiscount = exactTokenAmount;  // Store exact token price
      }
    }
    
    if (inventory && inventory.available !== undefined) {
      console.log('Updating inventory from', listing.inventory.currentStock, 'to', inventory.available);
      listing.inventory.currentStock = inventory.available;
    }
    
    if (sustainabilityScore !== undefined) {
      console.log('Updating sustainability from', listing.sustainability.recycledMaterialPercentage, 'to', sustainabilityScore);
      listing.sustainability.recycledMaterialPercentage = sustainabilityScore;
    }
    
    if (status) {
      const newActiveStatus = status === 'active';
      console.log('Updating status from', listing.availability.isActive, 'to', newActiveStatus);
      listing.availability.isActive = newActiveStatus;
    }
    
    console.log('=== SAVING PRODUCT ===');
    await listing.save();
    
    console.log('=== AFTER UPDATE ===');
    console.log('Updated pricing:', {
      costPrice: listing.pricing.costPrice,
      sellingPrice: listing.pricing.sellingPrice,
      ecoTokenDiscount: listing.pricing.ecoTokenDiscount
    });
    console.log('Updated inventory:', listing.inventory.currentStock);
    console.log('Updated sustainability:', listing.sustainability.recycledMaterialPercentage);
    
    res.status(200).json({ success: true, message: 'Product updated successfully', data: listing });
  } catch (error) {
    console.error('=== UPDATE ERROR ===', error);
    logger.error('Error updating marketplace listing:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

/**
 * Delete a marketplace listing
 */
const deleteListing = async (req, res) => {
  try {
    // Check if user is a factory
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can delete products' });
    }

    // Find factory profile
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }
    
    const listing = await Product.findOne({ _id: req.params.id, factoryId: factory._id });
    
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting marketplace listing:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

/**
 * Get user's marketplace listings (for factories)
 */
const getUserListings = async (req, res) => {
  try {
    // Check if user is a factory
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can access this endpoint' });
    }

    // Find factory profile
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }
    
    const listings = await Product.find({ factoryId: factory._id });
    res.status(200).json({ success: true, message: 'Products fetched successfully', data: listings });
  } catch (error) {
    logger.error('Error fetching user marketplace listings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

// Add a new function to get factory products using the correct model
const getFactoryProducts = async (req, res) => {
  try {
    // Log the incoming request for debugging
    logger.info('getFactoryProducts called with user:', req.user);
    
    // Check if user is a factory
    if (req.user.role !== 'factory') {
      logger.warn('Non-factory user attempted to access factory products:', req.user.role);
      return res.status(403).json({ success: false, message: 'Only factories can access this endpoint' });
    }

    // Find factory profile
    logger.info('Looking for factory with userId:', req.user.id);
    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      logger.warn('Factory profile not found for userId:', req.user.id);
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }
    
    logger.info('Found factory:', factory.companyInfo.name);
    logger.info('Factory ID:', factory._id);
    
    // Find products for this factory
    logger.info('Looking for products with factoryId:', factory._id);
    const products = await Product.find({ factoryId: factory._id });
    logger.info('Found products count:', products.length);
    
    res.status(200).json({ success: true, message: 'Products fetched successfully', data: products });
  } catch (error) {
    logger.error('Error fetching factory products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

/**
 * Search marketplace listings
 */
const searchListings = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice } = req.query;
    
    const searchQuery = { 'availability.isActive': true };
    
    if (query) {
      searchQuery.$or = [
        { 'productInfo.name': { $regex: query, $options: 'i' } },
        { 'productInfo.description': { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery['productInfo.category'] = category;
    }
    
    if (minPrice || maxPrice) {
      searchQuery['pricing.sellingPrice'] = {};
      if (minPrice) searchQuery['pricing.sellingPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
    }
    
    const listings = await Product.find(searchQuery)
      .populate('factoryId', 'companyInfo.name location.city businessMetrics.sustainabilityRating');
    res.status(200).json({ success: true, message: 'Search completed successfully', data: listings });
  } catch (error) {
    logger.error('Error searching marketplace listings:', error);
    res.status(500).json({ success: false, message: 'Failed to search products', error: error.message });
  }
};

// New function to get all active products for user-facing browsing
const getActiveProducts = async (req, res) => {
  try {
    // Get all active products with populated factory information
    const products = await Product.find({ 'availability.isActive': true })
      .populate('factoryId', 'companyInfo.name location.city businessMetrics.sustainabilityRating');
    
    res.status(200).json({ 
      success: true, 
      message: 'Active products fetched successfully', 
      data: products 
    });
  } catch (error) {
    logger.error('Error fetching active products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getUserListings,
  getFactoryProducts, // Add this new function
  searchListings,
  getActiveProducts // Add the new function for user-facing product browsing
};