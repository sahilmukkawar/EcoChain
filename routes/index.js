// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const garbageCollectionRoutes = require('./garbageCollectionRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const transactionRoutes = require('./transactionRoutes');
const ecoTokenRoutes = require('./ecoTokenRoutes');
const factoryRoutes = require('./factoryRoutes');
const adminRoutes = require('./adminRoutes');
const adminApprovalRoutes = require('./adminApprovalRoutes');
const syncRoutes = require('./syncRoutes');

// SSE controller
const { sseHandler } = require('../controllers/sseController');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// SSE endpoint for real-time updates
router.get('/sse', sseHandler);

// API route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/collections', garbageCollectionRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/transactions', transactionRoutes);
router.use('/eco-token', ecoTokenRoutes);
router.use('/factory', factoryRoutes);
router.use('/admin', adminRoutes);
router.use('/approvals', adminApprovalRoutes);
router.use('/sync', syncRoutes);

module.exports = router;