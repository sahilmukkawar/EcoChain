// controllers/garbageCollectionController.js
const GarbageCollection = require('../database/models/GarbageCollection');
const User = require('../database/models/User');
const logger = require('../utils/logger');

/**
 * Create a new garbage collection
 */
const createCollection = async (req, res) => {
  try {
    // Debug logging
    console.log('=== CREATE COLLECTION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request user:', req.user);
    console.log('================================');
    
    const { 
      type, 
      subType, 
      weight, 
      quality, 
      description, 
      location, 
      preferredTimeSlot,
      pickupDate
    } = req.body;
    const userId = req.user.id;

    // Validate required fields based on schema
    if (!type) {
      console.log('Error: Missing waste type');
      return res.status(400).json({ 
        success: false, 
        message: 'Waste type is required' 
      });
    }

    // Validate type enum
    const validTypes = ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid waste type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    if (!weight) {
      console.log('Error: Missing weight');
      return res.status(400).json({ 
        success: false, 
        message: 'Weight is required' 
      });
    }

    if (!userId) {
      console.log('Error: Missing user ID');
      return res.status(400).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // Handle uploaded files
    const images = req.files ? req.files.map(file => file.filename) : [];
    console.log('Processed images:', images);

    // Parse location if it's a string (from FormData)
    let locationData = {};
    if (typeof location === 'string') {
      try {
        locationData = JSON.parse(location);
      } catch (e) {
        console.log('Location parsing error:', e.message);
        locationData = { address: location };
      }
    } else {
      locationData = location || {};
    }
    console.log('Processed location:', locationData);

    // Generate unique collection ID
    const collectionId = 'COL' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    console.log('Generated collection ID:', collectionId);

    const collectionData = {
      collectionId,
      userId,
      collectionDetails: {
        type,
        subType: subType || undefined,
        weight: parseFloat(weight) || 0,
        quality: quality || 'fair',
        images: images,
        description: description || ''
      },
      location: {
        pickupAddress: locationData.address || ''
        // No coordinates field at all to avoid GeoJSON issues
      },
      scheduling: {
        requestedDate: pickupDate ? new Date(pickupDate) : new Date(),
        preferredTimeSlot: preferredTimeSlot || ''
      },
      status: 'requested'
    };
    
    // NOTE: Coordinates functionality removed temporarily to resolve MongoDB GeoJSON issues
    
    console.log('Creating collection with data:', JSON.stringify(collectionData, null, 2));

    const collection = new GarbageCollection(collectionData);
    await collection.save();
    
    console.log('Collection saved successfully:', collection._id);
    
    // Broadcast update via WebSocket
    if (global.broadcastUpdate) {
      global.broadcastUpdate('garbage_collection', 'created', {
        collectionId: collection.collectionId,
        userId: collection.userId,
        status: collection.status
      });
    }

    res.status(201).json({
      success: true,
      message: 'Garbage collection request created successfully',
      data: collection
    });
  } catch (error) {
    console.error('=== CREATE COLLECTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===============================');
    
    logger.error('Error creating garbage collection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create garbage collection', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get all garbage collections for the authenticated user
 */
const getAllCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, assignedToMe } = req.query;
    
    console.log('=== GET ALL COLLECTIONS DEBUG ===');
    console.log('getAllCollections - User:', req.user.role, 'UserId:', userId);
    console.log('getAllCollections - Query params:', { status, page, limit, assignedToMe });
    
    let filter;
    
    // If assignedToMe is true, get collections assigned to the current collector
    if (assignedToMe === 'true') {
      filter = { collectorId: userId };
      if (status) filter.status = status;
    } else {
      // For regular users or when getting all collections
      // If user is a collector and status is 'requested', show available collections
      if (req.user.role === 'collector' && status === 'requested') {
        filter = { status: 'requested', $or: [{ collectorId: { $exists: false } }, { collectorId: null }] };
        console.log('>>> COLLECTOR REQUESTING AVAILABLE COLLECTIONS <<<');
      } else {
        filter = { userId };
        if (status) filter.status = status;
      }
    }
    
    console.log('getAllCollections - Filter being used:', JSON.stringify(filter, null, 2));
    
    const skip = (page - 1) * limit;
    
    // First, let's check what collections exist in total
    const totalCollections = await GarbageCollection.find({});
    console.log('getAllCollections - TOTAL collections in database:', totalCollections.length);
    console.log('getAllCollections - Sample of all collections:', totalCollections.slice(0, 2).map(c => ({
      id: c._id,
      status: c.status,
      collectorId: c.collectorId,
      userId: c.userId
    })));
    
    const collections = await GarbageCollection.find(filter)
      .populate('userId', 'personalInfo.name personalInfo.phone')
      .populate('collectorId', 'personalInfo.name personalInfo.phone')
      .populate('factoryId', 'companyInfo.name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await GarbageCollection.countDocuments(filter);
    
    console.log('getAllCollections - Filter result count:', collections.length, 'total matching:', total);
    console.log('getAllCollections - Sample filtered collection:', collections[0] ? {
      id: collections[0]._id,
      status: collections[0].status,
      collectorId: collections[0].collectorId,
      userId: collections[0].userId
    } : 'No filtered collections found');
    console.log('=== END GET ALL COLLECTIONS DEBUG ===');
    
    res.json({
      success: true,
      data: {
        collections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching garbage collections:', error);
    logger.error('Error fetching garbage collections:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch garbage collections', 
      error: error.message 
    });
  }
};

/**
 * Get a single garbage collection by ID
 */
const getCollectionById = async (req, res) => {
  try {
    const collection = await GarbageCollection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Garbage collection not found' });
    }
    
    // Check if the collection belongs to the authenticated user
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this collection' });
    }
    
    res.status(200).json(collection);
  } catch (error) {
    logger.error('Error fetching garbage collection:', error);
    res.status(500).json({ message: 'Failed to fetch garbage collection', error: error.message });
  }
};

/**
 * Update a garbage collection
 */
const updateCollection = async (req, res) => {
  try {
    const { type, weight, location, images, notes, status } = req.body;
    
    const collection = await GarbageCollection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Garbage collection not found' });
    }
    
    // Check if the collection belongs to the authenticated user
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this collection' });
    }
    
    // Update fields
    if (type) collection.type = type;
    if (weight) collection.weight = weight;
    if (location) collection.location = location;
    if (images) collection.images = images;
    if (notes) collection.notes = notes;
    if (status) collection.status = status;
    
    await collection.save();
    res.status(200).json(collection);
  } catch (error) {
    logger.error('Error updating garbage collection:', error);
    res.status(500).json({ message: 'Failed to update garbage collection', error: error.message });
  }
};

/**
 * Delete a garbage collection
 */
const deleteCollection = async (req, res) => {
  try {
    const collection = await GarbageCollection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Garbage collection not found' });
    }
    
    // Check if the collection belongs to the authenticated user
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this collection' });
    }
    
    await collection.remove();
    res.status(200).json({ message: 'Garbage collection deleted successfully' });
  } catch (error) {
    logger.error('Error deleting garbage collection:', error);
    res.status(500).json({ message: 'Failed to delete garbage collection', error: error.message });
  }
};

/**
 * Update a garbage collection status
 */
const updateCollectionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const collectionId = req.params.collectionId || req.params.id;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const collection = await GarbageCollection.findById(collectionId);
    
    if (!collection) {
      return res.status(404).json({ 
        success: false, 
        message: 'Garbage collection not found' 
      });
    }
    
    // Use the model's updateStatus method for proper validation
    await collection.updateStatus(status, notes);
    
    // Token awarding logic based on status
    if (status === 'completed' && (!collection.tokenCalculation || !collection.tokenCalculation.totalTokensIssued)) {
      // Only award tokens if they haven't been awarded yet (for cases where tokens weren't awarded on 'scheduled')
      const tokensEarned = collection.calculateTokens();
      
      // Update user's token balance using the User model method
      const user = await User.findById(collection.userId);
      if (user) {
        await user.addTokens(tokensEarned, `Waste collection completed: ${collection.collectionId}`);
        
        collection.tokenCalculation.totalTokensIssued = tokensEarned;
        await collection.save();
        
        console.log(`Completion tokens awarded: ${tokensEarned} to user ${user.personalInfo.name} for collection ${collection.collectionId}`);
      }
    } else if (status === 'collected') {
      // When collection is marked as collected, we can add a small bonus if desired
      console.log(`Collection ${collection.collectionId} has been collected. Tokens were already awarded when collector accepted.`);
    }
    
    // Broadcast update via WebSocket
    if (global.broadcastUpdate) {
      global.broadcastUpdate('garbage_collection', 'status_updated', {
        collectionId: collection.collectionId,
        status: collection.status,
        tokensIssued: collection.tokenCalculation?.totalTokensIssued
      });
    }
    
    res.json({
      success: true,
      message: 'Collection status updated successfully',
      data: collection
    });
  } catch (error) {
    logger.error('Error updating garbage collection status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update garbage collection status'
    });
  }
};

/**
 * Get nearby collections for collectors
 */
const getNearbyCollections = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }
    
    const collections = await GarbageCollection.findNearbyCollections(
      parseFloat(longitude), 
      parseFloat(latitude), 
      parseInt(maxDistance)
    );
    
    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    logger.error('Error fetching nearby collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby collections',
      error: error.message
    });
  }
};

/**
 * Assign collector to a collection
 */
const assignCollector = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collectorId = req.user.id;
    
    const collection = await GarbageCollection.findById(collectionId);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    if (collection.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Collection is not available for assignment'
      });
    }
    
    // Assign collector and update status
    collection.collectorId = collectorId;
    
    // Set scheduled date to today and ensure we have proper scheduling info
    if (!collection.scheduling.scheduledDate) {
      collection.scheduling.scheduledDate = new Date();
    }
    
    await collection.updateStatus('scheduled', 'Assigned to collector');
    console.log(`Collection ${collection.collectionId} assigned to collector and scheduled for ${collection.scheduling.scheduledDate}`);
    
    // Calculate and award tokens to the user immediately when collector accepts
    const tokensEarned = collection.calculateTokens();
    
    // Update user's token balance
    const User = require('../database/models/User');
    const user = await User.findById(collection.userId);
    if (user) {
      await user.addTokens(tokensEarned, `Waste collection accepted by collector: ${collection.collectionId}`);
      
      // Update the collection with token calculation
      collection.tokenCalculation.totalTokensIssued = tokensEarned;
      await collection.save();
      
      console.log(`Tokens awarded: ${tokensEarned} to user ${user.personalInfo.name} for collection ${collection.collectionId}`);
    }
    
    // Broadcast update via WebSocket
    if (global.broadcastUpdate) {
      global.broadcastUpdate('garbage_collection', 'accepted', {
        collectionId: collection.collectionId,
        status: collection.status,
        collectorId: collectorId,
        tokensAwarded: tokensEarned,
        userId: collection.userId
      });
    }
    
    res.json({
      success: true,
      message: `Collection assigned successfully! User has been awarded ${tokensEarned} EcoTokens.`,
      data: {
        ...collection.toObject(),
        tokensAwarded: tokensEarned
      }
    });
  } catch (error) {
    logger.error('Error assigning collector:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign collector',
      error: error.message
    });
  }
};

/**
 * Mark collection as collected (collector action)
 */
const markAsCollected = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collectorId = req.user.id;
    
    const collection = await GarbageCollection.findById(collectionId);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Verify this collector is assigned to this collection
    if (collection.collectorId.toString() !== collectorId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this collection'
      });
    }
    
    // Verify collection is in correct status
    if (collection.status !== 'scheduled' && collection.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark collection as collected. Current status: ${collection.status}`
      });
    }
    
    // Update status to collected
    await collection.updateStatus('collected', `Waste collected by collector on ${new Date().toLocaleDateString()}`);
    
    console.log(`Collection ${collection.collectionId} marked as collected by collector ${req.user.name}`);
    
    // Broadcast update via WebSocket
    if (global.broadcastUpdate) {
      global.broadcastUpdate('garbage_collection', 'collected', {
        collectionId: collection.collectionId,
        status: collection.status,
        collectorId: collectorId,
        collectedAt: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Collection marked as collected successfully. It will now be sent to admin for payment processing.',
      data: collection
    });
  } catch (error) {
    logger.error('Error marking collection as collected:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark collection as collected',
      error: error.message
    });
  }
};

module.exports = {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  updateCollectionStatus,
  getNearbyCollections,
  assignCollector,
  markAsCollected
};