// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const garbageCollectionRoutes = require('./garbageCollectionRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const transactionRoutes = require('./transactionRoutes');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const productRoutes = require('./productRoutes');
const ecoTokenRoutes = require('./ecoTokenRoutes');
const adminRoutes = require('./adminRoutes');

// API routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/collections', garbageCollectionRoutes);
// Use marketplace routes for marketplace functionality
router.use('/marketplace', marketplaceRoutes);
router.use('/orders', orderRoutes);
router.use('/general-transactions', transactionRoutes);
router.use('/eco-token', ecoTokenRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router;