// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const garbageCollectionRoutes = require('./garbageCollectionRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const transactionRoutes = require('./transactionRoutes');
const syncRoutes = require('./syncRoutes');

// API routes
router.use('/users', userRoutes);
router.use('/collections', garbageCollectionRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/transactions', transactionRoutes);
router.use('/sync', syncRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router;