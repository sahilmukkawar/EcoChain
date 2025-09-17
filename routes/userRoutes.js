// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');

// User registration
router.post('/register', userController.registerUser);

// User login
router.post('/login', userController.loginUser);

// Get user profile - protected route
router.get('/profile', authenticate, userController.getUserProfile);

// Update user profile - protected route
router.put('/profile', authenticate, upload.single('profileImage'), userController.updateUserProfile);

// Get user wallet - protected route
router.get('/wallet', authenticate, userController.getUserWallet);

// Get user transaction history - protected route
router.get('/transactions', authenticate, (req, res) => {
  // TODO: Implement get user transaction history
  res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router;