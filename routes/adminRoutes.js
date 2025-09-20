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

// Get all applications (collectors and factories)
router.get('/applications', authenticate, adminController.getAllApplications);

// Approve factory application
router.post('/applications/factory/:applicationId/approve', authenticate, adminController.approveFactoryApplication);

// Reject factory application
router.post('/applications/factory/:applicationId/reject', authenticate, adminController.rejectFactoryApplication);

// Approve collector application
router.post('/applications/collector/:applicationId/approve', authenticate, adminController.approveCollectorApplication);

// Reject collector application
router.post('/applications/collector/:applicationId/reject', authenticate, adminController.rejectCollectorApplication);

// Debug payment history (temporary)
router.get('/debug/payment-history', authenticate, adminController.debugPaymentHistory);

// Material requests routes
// Get all material requests
router.get('/material-requests', authenticate, adminController.getMaterialRequests);

// Get collected waste
router.get('/waste/collected', authenticate, adminController.getCollectedWaste);

// Fulfill a material request
router.post('/material-requests/:requestId/fulfill', authenticate, adminController.fulfillMaterialRequest);

// Update material request status
router.put('/material-requests/:requestId/status', authenticate, adminController.updateMaterialRequestStatus);

module.exports = router;