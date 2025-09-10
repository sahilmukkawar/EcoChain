// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

/**
 * Register a new user
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 'personalInfo.email': email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = new User({
      userId: `user_${Date.now()}`, // Generate a unique userId
      personalInfo: {
        name,
        email,
        phone
      },
      password,
      role
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.personalInfo.name,
        email: user.personalInfo.email,
        role: user.role
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
    
    // Find user by email
    const user = await User.findOne({ 'personalInfo.email': email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.personalInfo.name,
        email: user.personalInfo.email,
        role: user.role
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
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      user: {
        id: user._id,
        name: user.personalInfo.name,
        email: user.personalInfo.email,
        phone: user.personalInfo.phone,
        address: user.address,
        role: user.role,
        sustainabilityScore: user.sustainabilityScore,
        createdAt: user.createdAt
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
    const userId = req.user.userId;
    const { name, phone, address } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.personalInfo.name = name;
    if (phone) user.personalInfo.phone = phone;
    if (address) user.address = address;
    
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
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
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      wallet: {
        balance: user.ecoWallet.currentBalance,
        lifetimeEarned: user.ecoWallet.totalEarned,
        lifetimeSpent: user.ecoWallet.totalSpent
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