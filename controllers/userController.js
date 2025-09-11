// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Register a new user
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'user', address } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }
    
    // Check password requirements
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 'personalInfo.email': email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Generate unique userId
    const userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Create new user
    const user = new User({
      userId,
      personalInfo: {
        name,
        email,
        phone
      },
      password,
      role,
      address: address || {}
    });
    
    await user.save();
    
    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save(); // Save refresh token
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.personalInfo.name,
          email: user.personalInfo.email,
          role: user.role,
          ecoWallet: user.ecoWallet,
          sustainabilityScore: user.sustainabilityScore
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email and include password for verification
    const user = await User.findOne({ 'personalInfo.email': email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check password using User model method
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is suspended or inactive' 
      });
    }
    
    // Update last active
    await user.updateLastActive();
    
    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save();
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.personalInfo.name,
          email: user.personalInfo.email,
          role: user.role,
          ecoWallet: user.ecoWallet,
          sustainabilityScore: user.sustainabilityScore
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        userId: user.userId,
        name: user.personalInfo.name,
        email: user.personalInfo.email,
        phone: user.personalInfo.phone,
        role: user.role,
        address: user.address,
        ecoWallet: user.ecoWallet,
        sustainabilityScore: user.sustainabilityScore,
        preferences: user.preferences,
        kycStatus: user.kycStatus,
        registrationDate: user.registrationDate,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const allowedUpdates = ['personalInfo', 'address', 'preferences'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field]) {
        updates[field] = { ...user[field], ...req.body[field] };
      }
    });
    
    Object.assign(user, updates);
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        userId: user.userId,
        name: user.personalInfo.name,
        email: user.personalInfo.email,
        phone: user.personalInfo.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user wallet
 */
const getUserWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        wallet: {
          currentBalance: user.ecoWallet.currentBalance,
          totalEarned: user.ecoWallet.totalEarned,
          totalSpent: user.ecoWallet.totalSpent
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserWallet
};