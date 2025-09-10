// controllers/garbageCollectionController.js
const { GarbageCollection } = require('../database/models');

/**
 * Get all garbage collections
 */
const getAllCollections = async (req, res, next) => {
  try {
    const collections = await GarbageCollection.find({ userId: req.user.id });
    res.status(200).json(collections);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single garbage collection by ID
 */
const getCollectionById = async (req, res, next) => {
  try {
    const collection = await GarbageCollection.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new garbage collection
 */
const createCollection = async (req, res, next) => {
  try {
    const newCollection = new GarbageCollection({
      ...req.body,
      userId: req.user.id
    });
    
    const savedCollection = await newCollection.save();
    res.status(201).json(savedCollection);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a garbage collection
 */
const updateCollection = async (req, res, next) => {
  try {
    const collection = await GarbageCollection.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a garbage collection
 */
const deleteCollection = async (req, res, next) => {
  try {
    const collection = await GarbageCollection.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection
};