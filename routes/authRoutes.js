// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database/models');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'user',
      address
    } = req.body;

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

    // Process address data to prevent validation errors
    let cleanAddress = undefined;
    if (address) {
      // Create clean address object with only valid values
      cleanAddress = {};
      const validAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];

      for (const [key, value] of Object.entries(address)) {
        if (validAddressFields.includes(key) &&
          value !== undefined && value !== null &&
          typeof value === 'string' && value.trim() !== '') {
          cleanAddress[key] = value.trim();
        }
      }

      // NEVER include location field to prevent validation errors
      delete cleanAddress.location;

      // If no valid address data, explicitly set to undefined
      if (Object.keys(cleanAddress).length === 0) {
        cleanAddress = undefined;
      }
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
      address: cleanAddress
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
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for verification
    const user = await User.findOne({ 'personalInfo.email': email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// Alias for client compatibility
router.post('/refresh-token', async (req, res, next) => {
  // Delegate to /refresh handler logic
  req.url = '/refresh';
  next();
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.refreshToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone, address } = req.body;

    // Update personal info
    if (name) user.personalInfo.name = name;
    if (email) user.personalInfo.email = email;
    if (phone !== undefined) user.personalInfo.phone = phone;

    // Process address data to prevent validation errors
    if (address) {
      // Create clean address object with only valid values
      const cleanAddressData = {};
      const validAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];

      for (const [key, value] of Object.entries(address)) {
        if (validAddressFields.includes(key) &&
          value !== undefined && value !== null &&
          typeof value === 'string' && value.trim() !== '') {
          cleanAddressData[key] = value.trim();
        }
      }

      // NEVER include location field to prevent validation errors
      delete cleanAddressData.location;

      // Only update address if we have valid data
      if (Object.keys(cleanAddressData).length > 0) {
        user.address = cleanAddressData;
      } else {
        // If no valid address data, explicitly set to undefined
        user.address = undefined;
      }
    } else {
      // If no address data provided, explicitly set to undefined
      user.address = undefined;
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
        role: user.role,
        address: user.address,
        ecoWallet: user.ecoWallet,
        sustainabilityScore: user.sustainabilityScore
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update user profile with image upload
router.put('/profile/image', authenticate, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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

    // Handle address fields sent as individual parameters (from form data)
    const addressFields = ['street', 'city', 'state', 'zipCode', 'country'];
    let addressData = {};

    for (const field of addressFields) {
      const formFieldName = `address[${field}]`;
      if (req.body[formFieldName] && req.body[formFieldName].trim()) {
        addressData[field] = req.body[formFieldName].trim();
      }
    }

    // Handle address updates as JSON (fallback)
    if (Object.keys(addressData).length === 0 && req.body.address) {
      try {
        addressData = typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;
      } catch (parseError) {
        console.warn('Failed to parse address JSON:', parseError);
      }
    }

    // Process address data to prevent validation errors
    if (Object.keys(addressData).length > 0) {
      // Create clean address object with only valid values
      const cleanAddressData = {};
      const validAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];

      for (const [key, value] of Object.entries(addressData)) {
        if (validAddressFields.includes(key) &&
          value !== undefined && value !== null &&
          typeof value === 'string' && value.trim() !== '') {
          cleanAddressData[key] = value.trim();
        }
      }

      // NEVER include location field to prevent validation errors
      delete cleanAddressData.location;

      // Only update address if we have valid data
      if (Object.keys(cleanAddressData).length > 0) {
        user.address = cleanAddressData;
      } else {
        // If no valid address data, explicitly set to undefined
        user.address = undefined;
      }
    } else {
      // If no address data provided, explicitly set to undefined
      user.address = undefined;
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
        role: user.role,
        address: user.address,
        ecoWallet: user.ecoWallet,
        sustainabilityScore: user.sustainabilityScore
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;