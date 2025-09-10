// controllers/garbageCollectionController.js
const GarbageCollection = require('../database/models/GarbageCollection');
const User = require('../database/models/User');
const logger = require('../utils/logger');

/**
 * Create a new garbage collection
 */
const createCollection = async (req, res) => {
  try {
    const { type, weight, location, images, notes } = req.body;
    const userId = req.user.id;

    const collection = new GarbageCollection({
      userId,
      type,
      weight,
      location,
      images,
      notes,
      status: 'pending'
    });

    await collection.save();
    res.status(201).json(collection);
  } catch (error) {
    logger.error('Error creating garbage collection:', error);
    res.status(500).json({ message: 'Failed to create garbage collection', error: error.message });
  }
};

/**
 * Get all garbage collections for the authenticated user
 */
const getAllCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const collections = await GarbageCollection.find({ userId });
    res.status(200).json(collections);
  } catch (error) {
    logger.error('Error fetching garbage collections:', error);
    res.status(500).json({ message: 'Failed to fetch garbage collections', error: error.message });
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
    const { status } = req.body;
    const collectionId = req.params.collectionId || req.params.id;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const collection = await GarbageCollection.findById(collectionId);
    
    if (!collection) {
      return res.status(404).json({ message: 'Garbage collection not found' });
    }
    
    // Update status
    collection.status = status;
    
    // If status is completed, issue tokens to the user
    if (status === 'completed') {
      const userId = collection.userId;
      const tokensToIssue = calculateTokens(collection.weight, collection.type);
      
      // Update user's token balance
      await User.findByIdAndUpdate(userId, { $inc: { tokenBalance: tokensToIssue } });
      
      // Add token issuance to response
      collection.tokensIssued = tokensToIssue;
    }
    
    await collection.save();
    res.status(200).json(collection);
  } catch (error) {
    logger.error('Error updating garbage collection status:', error);
    res.status(500).json({ message: 'Failed to update garbage collection status', error: error.message });
  }
};

/**
 * Helper function to calculate tokens based on weight and type
 */
const calculateTokens = (weight, type) => {
  // Base rate per kg
  const baseRate = 10;
  
  // Multipliers for different types
  const typeMultipliers = {
    'plastic': 1.2,
    'paper': 0.8,
    'metal': 1.5,
    'glass': 1.0,
    'electronic': 2.0,
    'organic': 0.5,
    'other': 0.7
  };
  
  const multiplier = typeMultipliers[type] || 1.0;
  
  // Calculate tokens: weight * baseRate * typeMultiplier
  return Math.round(weight * baseRate * multiplier);
};

module.exports = {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  updateCollectionStatus
};