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
const adminApprovalRoutes = require('./adminApprovalRoutes');
const factoryRoutes = require('./factoryRoutes'); // Add this line

// API routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin-approval', adminApprovalRoutes);
router.use('/users', userRoutes);
router.use('/collections', garbageCollectionRoutes);
// Use marketplace routes for marketplace functionality
router.use('/marketplace', marketplaceRoutes);
router.use('/orders', orderRoutes);
router.use('/general-transactions', transactionRoutes);
router.use('/eco-token', ecoTokenRoutes);
router.use('/factory', factoryRoutes); // Add this line

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// API root endpoint with available routes information
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to EcoChain API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      collections: '/api/collections',
      marketplace: '/api/marketplace',
      orders: '/api/orders',
      transactions: '/api/general-transactions',
      ecoToken: '/api/eco-token',
      admin: '/api/admin',
      adminApproval: '/api/admin-approval',
      factory: '/api/factory', // Add this line
      health: '/api/health'
    }
  });
});

module.exports = router;