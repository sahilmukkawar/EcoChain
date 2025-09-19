// routes/factoryRoutes.js
const express = require('express');
const router = express.Router();
const { Factory, MaterialRequest, Product, User } = require('../database/models');
const auth = require('../middleware/auth');

// Sign up factory profile
router.post('/register', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factory users can create factory profiles' });
    }

    // Check if factory profile already exists
    const existingFactory = await Factory.findOne({ userId: req.user.id });
    if (existingFactory) {
      return res.status(400).json({ success: false, message: 'Factory profile already exists' });
    }

    const factoryData = {
      ...req.body,
      userId: req.user.id,
      factoryId: 'FAC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
    };

    const factory = new Factory(factoryData);
    await factory.save();

    res.status(201).json({
      success: true,
      message: 'Factory profile created successfully',
      data: factory
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get factory profile
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    res.json({
      success: true,
      data: factory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update factory profile
router.put('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    Object.assign(factory, req.body);
    await factory.save();

    res.json({
      success: true,
      message: 'Factory profile updated successfully',
      data: factory
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all factories (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, city, materialType } = req.query;
    
    const filters = { status: 'active' };
    if (city) filters['location.city'] = new RegExp(city, 'i');
    if (materialType) filters['capabilities.acceptedMaterials'] = materialType;

    const factories = await Factory.find(filters)
      .select('factoryId companyInfo location capabilities businessMetrics')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'businessMetrics.sustainabilityRating': -1 });

    const total = await Factory.countDocuments(filters);

    res.json({
      success: true,
      data: factories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create material request
router.post('/material-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Only factories can create material requests' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    const materialRequest = new MaterialRequest({
      ...req.body,
      factoryId: factory._id
    });

    await materialRequest.save();

    res.status(201).json({
      success: true,
      message: 'Material request created successfully',
      data: materialRequest
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get factory's material requests
router.get('/material-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const filters = { factoryId: factory._id };
    if (status) filters.status = status;

    const requests = await MaterialRequest.find(filters)
      .populate('matchedCollections.collectionId', 'collectionDetails location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await MaterialRequest.countDocuments(filters);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get factory's products
router.get('/products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    const { page = 1, limit = 10 } = req.query;

    const { Product } = require('../database/models');
    const products = await Product.find({ factoryId: factory._id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({ factoryId: factory._id });

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get factory dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'factory') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const factory = await Factory.findOne({ userId: req.user.id });
    if (!factory) {
      return res.status(404).json({ success: false, message: 'Factory profile not found' });
    }

    // Get various statistics
    const totalProducts = await Product.countDocuments({ factoryId: factory._id });
    const activeProducts = await Product.countDocuments({ 
      factoryId: factory._id, 
      'availability.isActive': true 
    });
    
    const openRequests = await MaterialRequest.countDocuments({ 
      factoryId: factory._id, 
      status: 'open' 
    });
    
    const { Order } = require('../database/models');
    const totalOrders = await Order.countDocuments({ 
      'orderItems.productId': { 
        $in: await Product.find({ factoryId: factory._id }).distinct('_id') 
      } 
    });

    res.json({
      success: true,
      data: {
        factory: factory.businessMetrics,
        stats: {
          totalProducts,
          activeProducts,
          openRequests,
          totalOrders
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
