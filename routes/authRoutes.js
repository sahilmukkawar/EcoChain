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

// Update user profile - for JSON data only
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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

    // Handle address updates - Enhanced validation error prevention
    if (req.body.address) {
      try {
        const addressData = typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;

        // Create clean address object with only valid values
        const cleanAddressData = {};
        const validAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];

        for (const [key, value] of Object.entries(addressData)) {
          // Only include valid address fields with non-empty values
          if (validAddressFields.includes(key) &&
            value !== undefined && value !== null &&
            typeof value === 'string' && value.trim() !== '') {
            cleanAddressData[key] = value.trim();
          }
        }

        // Never include location field from client data to prevent validation errors
        delete cleanAddressData.location;

        // Only update address if we have valid data
        if (Object.keys(cleanAddressData).length > 0) {
          // Initialize address if it doesn't exist
          if (!user.address) {
            user.address = {};
          }

          // Merge with existing address data, ensuring no undefined location
          const mergedAddress = { ...user.address, ...cleanAddressData };

          // Explicitly remove any undefined or null location field
          if (mergedAddress.location === undefined || mergedAddress.location === null) {
            delete mergedAddress.location;
          }

          user.address = mergedAddress;
        }
      } catch (parseError) {
        console.warn('Failed to parse address data:', parseError);
        // If parsing fails, try to handle as individual fields
        if (typeof req.body.address === 'object') {
          const cleanAddressData = {};
          const validAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];

          for (const [key, value] of Object.entries(req.body.address)) {
            if (validAddressFields.includes(key) &&
              value !== undefined && value !== null &&
              typeof value === 'string' && value.trim() !== '') {
              cleanAddressData[key] = value.trim();
            }
          }

          if (Object.keys(cleanAddressData).length > 0) {
            if (!user.address) {
              user.address = {};
            }
            user.address = { ...user.address, ...cleanAddressData };
          }
        }
      }
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
    let hasAddressUpdate = false;

    for (const field of addressFields) {
      const formFieldName = `address[${field}]`;
      if (req.body[formFieldName] && req.body[formFieldName].trim()) {
        if (!user.address) user.address = {};
        user.address[field] = req.body[formFieldName].trim();
        hasAddressUpdate = true;
      }
    }

    // Handle address updates as JSON (fallback)
    if (!hasAddressUpdate && req.body.address) {
      try {
        const addressData = typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;

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

        // Never include location field to prevent validation errors
        delete cleanAddressData.location;

        if (Object.keys(cleanAddressData).length > 0) {
          if (!user.address) {
            user.address = {};
          }

          // Merge with existing address data, ensuring no undefined location
          const mergedAddress = { ...user.address, ...cleanAddressData };

          // Explicitly remove any undefined or null location field
          if (mergedAddress.location === undefined || mergedAddress.location === null) {
            delete mergedAddress.location;
          }

          user.address = mergedAddress;
        }
      } catch (parseError) {
        console.warn('Failed to parse address JSON:', parseError);
      }
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