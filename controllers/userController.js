// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../database/models/User');
const { FactoryApplication, CollectorApplication } = require('../database/models');
const { sendRegistrationConfirmation } = require('../utils/notificationService');

/**
 * Register a new user
 */
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'user',
      address,
      // Factory specific fields
      factoryName,
      ownerName,
      gstNumber,
      // Collector specific fields
      companyName,
      contactName,
      serviceArea
    } = req.body;
    
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
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Generate unique userId
    const userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Set approval status based on role
    let approvalStatus = 'approved'; // Default for regular users and admins
    if (role === 'factory' || role === 'collector') {
      approvalStatus = 'pending'; // Factories and collectors need approval
    }
    
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
      approvalStatus,
      address: address || {}
    });
    
    await user.save();
    
    // If factory or collector, create application
    if (role === 'factory') {
      // Ensure address has all required fields for factory application
      const factoryAddress = {
        street: (address && address.street) || '',
        city: (address && address.city) || '',
        state: (address && address.state) || '',
        zipCode: (address && address.zipCode) || '',
        country: (address && address.country) || 'India'
      };
      
      const factoryApplication = new FactoryApplication({
        userId: user._id,
        factoryName,
        ownerName,
        email,
        phone,
        address: factoryAddress,
        gstNumber
      });
      await factoryApplication.save();
    } else if (role === 'collector') {
      const collectorApplication = new CollectorApplication({
        userId: user._id,
        companyName,
        contactName,
        email,
        phone,
        serviceArea
      });
      await collectorApplication.save();
    }
    
    // Send registration confirmation email
    try {
      await sendRegistrationConfirmation(user);
    } catch (emailError) {
      console.error('Failed to send registration confirmation email:', emailError);
      // Don't fail the registration if email fails
    }
    
    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    await user.save(); // Save refresh token
    
    res.status(201).json({
      success: true,
      message: role === 'factory' || role === 'collector' 
        ? 'Account created successfully. Waiting for admin approval.' 
        : 'User registered successfully',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.personalInfo.name,
          email: user.personalInfo.email,
          role: user.role,
          approvalStatus: user.approvalStatus,
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
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
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
    
    // Check approval status for factory and collector roles
    if ((user.role === 'factory' || user.role === 'collector') && user.approvalStatus !== 'approved') {
      return res.status(200).json({
        success: true,
        message: 'Login successful. Account pending approval.',
        data: {
          user: {
            id: user._id,
            userId: user.userId,
            name: user.personalInfo.name,
            email: user.personalInfo.email,
            phone: user.personalInfo.phone,
            profileImage: user.personalInfo.profileImage,
            role: user.role,
            approvalStatus: user.approvalStatus,
            ecoWallet: user.ecoWallet,
            sustainabilityScore: user.sustainabilityScore
          },
          tokens: {
            accessToken,
            refreshToken
          },
          pendingApproval: true
        }
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
          phone: user.personalInfo.phone,
          profileImage: user.personalInfo.profileImage,
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
        profileImage: user.personalInfo.profileImage,
        role: user.role,
        address: user.address,
        ecoWallet: user.ecoWallet,
        sustainabilityScore: user.sustainabilityScore,
        preferences: user.preferences,
        kycStatus: user.kycStatus,
        registrationDate: user.registrationDate,
        lastActive: user.lastActive,
        approvalStatus: user.approvalStatus
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
    
    // Handle profile image upload
    if (req.file) {
      // Save the file path to the user's profile
      user.personalInfo.profileImage = `/uploads/profile-images/${req.file.filename}`;
    }
    
    // Handle profile data updates
    if (req.body.name) {
      user.personalInfo.name = req.body.name;
    }
    
    if (req.body.email) {
      user.personalInfo.email = req.body.email;
    }
    
    if (req.body.phone) {
      user.personalInfo.phone = req.body.phone;
    }
    
    // Handle address updates
    if (req.body.address) {
      try {
        const addressData = typeof req.body.address === 'string' 
          ? JSON.parse(req.body.address) 
          : req.body.address;
          
        user.address = { ...user.address, ...addressData };
      } catch (parseError) {
        // If it's not JSON, treat as individual fields
        user.address = { ...user.address, ...req.body.address };
      }
    }
    
    // Also handle address fields sent as individual parameters (from form data)
    if (req.body['address[street]']) {
      user.address.street = req.body['address[street]'];
    }
    
    if (req.body['address[city]']) {
      user.address.city = req.body['address[city]'];
    }
    
    if (req.body['address[state]']) {
      user.address.state = req.body['address[state]'];
    }
    
    if (req.body['address[zipCode]']) {
      user.address.zipCode = req.body['address[zipCode]'];
    }
    
    if (req.body['address[country]']) {
      user.address.country = req.body['address[country]'];
    }

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
        profileImage: user.personalInfo.profileImage,
        address: user.address,
        role: user.role,
        ecoWallet: user.ecoWallet,
        sustainabilityScore: user.sustainabilityScore
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