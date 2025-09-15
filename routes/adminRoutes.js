// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Get collections ready for collector payment
router.get('/collections/payment-pending', authenticate, adminController.getCollectionsForPayment);

// Process collector payment
router.post('/collections/:collectionId/pay-collector', authenticate, adminController.processCollectorPayment);

// Get admin dashboard statistics
router.get('/stats', authenticate, adminController.getAdminStats);

// Get real users data
router.get('/users', authenticate, adminController.getAllUsers);

// Get real collectors data
router.get('/collectors', authenticate, adminController.getAllCollectors);

// Get real factories data
router.get('/factories', authenticate, adminController.getAllFactories);

// Get payment history with filtering and pagination
router.get('/payments/history', authenticate, adminController.getPaymentHistory);

// Get payment statistics
router.get('/payments/statistics', authenticate, adminController.getPaymentStatistics);

// Get analytics data
router.get('/analytics', authenticate, adminController.getAnalyticsData);

// Debug payment history (temporary)
router.get('/debug/payment-history', authenticate, adminController.debugPaymentHistory);

module.exports = router;