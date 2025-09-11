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

module.exports = router;