// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, FactoryApplication, CollectorApplication } = require('../database/models');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { 
  registerValidation, 
  loginValidation, 
  otpValidation, 
  refreshTokenValidation 
} = require('../middleware/inputValidation');
const { authLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeObject } = require('../config/security');
const { sendOTP, sendRegistrationConfirmation } = require('../client/src/utils/notificationService');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'user',
      address,
      // Additional fields for collectors and factories
      collectorInfo,
      factoryInfo
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 'personalInfo.email': email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
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

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // For factory and collector roles, set account status to inactive initially
    const accountStatus = (role === 'factory' || role === 'collector') ? 'inactive' : 'active';

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
      address: cleanAddress,
      accountStatus, // Set account status based on role
      otp: {
        code: otp,
        expiresAt: otpExpiry
      },
      isEmailVerified: false
    });

    await user.save();

    // For factory and collector roles, create an application automatically if info is provided
    if ((role === 'factory' || role === 'collector') && (collectorInfo || factoryInfo)) {
      try {
        if (role === 'collector' && collectorInfo) {
          // Create collector application
          const serviceArea = Array.isArray(collectorInfo.serviceArea) 
            ? collectorInfo.serviceArea 
            : collectorInfo.serviceArea ? [collectorInfo.serviceArea] : [];
          
          const collectorApplication = new CollectorApplication({
            userId: user._id,
            companyName: collectorInfo.companyName || '',
            serviceArea: serviceArea,
            vehicleDetails: collectorInfo.vehicleDetails || '',
            licenseNumber: collectorInfo.licenseNumber || '',
            contactPerson: {
              name: collectorInfo.contactPerson?.name || name || '',
              email: collectorInfo.contactPerson?.email || email || '',
              phone: collectorInfo.contactPerson?.phone || phone || ''
            },
            businessDetails: collectorInfo.businessDetails || {}
          });
          
          await collectorApplication.save();
        } else if (role === 'factory' && factoryInfo) {
          // Create factory application
          const factoryApplication = new FactoryApplication({
            userId: user._id,
            factoryName: factoryInfo.factoryName || '',
            gstNumber: factoryInfo.gstNumber || '',
            address: factoryInfo.address || {},
            contactPerson: {
              name: factoryInfo.contactPerson?.name || name || '',
              email: factoryInfo.contactPerson?.email || email || '',
              phone: factoryInfo.contactPerson?.phone || phone || ''
            },
            businessDetails: factoryInfo.businessDetails || {}
          });
          
          await factoryApplication.save();
        }
      } catch (appError) {
        console.error('Failed to create application:', appError);
        // Don't fail registration if application creation fails, but log the error
      }
    }

    // Send OTP email
    try {
      await sendOTP(user, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails, but log the error
    }

    res.status(201).json({
      success: true,
      message: 'User signed up successfully. Please check your email for verification code.',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.personalInfo.name,
          email: user.personalInfo.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        requiresEmailVerification: true,
        requiresApplication: (role === 'factory' || role === 'collector')
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Submit factory application
router.post('/factory-application', authenticate, async (req, res) => {
  try {
    // Check if user is a factory
    if (req.user.role !== 'factory') {
      return res.status(403).json({
        success: false,
        message: 'Only factory users can submit factory applications'
      });
    }

    const {
      factoryName,
      gstNumber,
      address,
      contactPerson,
      businessDetails,
      documents
    } = req.body;

    // Check if application already exists for this user
    const existingApplication = await FactoryApplication.findOne({ userId: req.user.id });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Factory application already exists for this user'
      });
    }

    // Create factory application
    const factoryApplication = new FactoryApplication({
      userId: req.user.id,
      factoryName,
      gstNumber,
      address,
      contactPerson,
      businessDetails,
      documents,
      status: 'pending'
    });

    await factoryApplication.save();

    res.status(201).json({
      success: true,
      message: 'Factory application submitted successfully. Awaiting admin approval.',
      data: {
        application: factoryApplication
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Submit collector application
router.post('/collector-application', authenticate, async (req, res) => {
  try {
    // Check if user is a collector
    if (req.user.role !== 'collector') {
      return res.status(403).json({
        success: false,
        message: 'Only collector users can submit collector applications'
      });
    }

    const {
      companyName,
      serviceArea,
      vehicleDetails,
      licenseNumber,
      contactPerson,
      businessDetails,
      documents
    } = req.body;

    // Check if application already exists for this user
    const existingApplication = await CollectorApplication.findOne({ userId: req.user.id });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Collector application already exists for this user'
      });
    }

    // Create collector application
    const collectorApplication = new CollectorApplication({
      userId: req.user.id,
      companyName,
      serviceArea,
      vehicleDetails,
      licenseNumber,
      contactPerson,
      businessDetails,
      documents,
      status: 'pending'
    });

    await collectorApplication.save();

    res.status(201).json({
      success: true,
      message: 'Collector application submitted successfully. Awaiting admin approval.',
      data: {
        application: collectorApplication
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login user
router.post('/login', authLimiter, loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for verification
  const user = await User.findOne({ 'personalInfo.email': email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check account status
  if (user.accountStatus !== 'active') {
    // For factory and collector users, provide a specific message about approval
    if (user.role === 'factory' || user.role === 'collector') {
      return res.status(403).json({
        success: false,
        message: 'Your application is pending admin approval. You will receive a notification once approved.',
        code: 'PENDING_APPROVAL'
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }
  }

  // Update last active
  await user.updateLastActive();

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  
  await user.save();

  // Sanitize user object before sending response
  const sanitizedUserData = {
    id: user._id,
    userId: user.userId,
    name: user.personalInfo.name,
    email: user.personalInfo.email,
    phone: user.personalInfo.phone,
    profileImage: user.personalInfo.profileImage,
    role: user.role,
    ecoWallet: user.ecoWallet,
    sustainabilityScore: user.sustainabilityScore
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: sanitizedUserData,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
}));

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
router.post('/refresh-token', authLimiter, refreshTokenValidation, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token', 
      code: 'INVALID_TOKEN' 
    });
  }
  
  // Find user with matching refresh token
  const user = await User.findOne({ _id: decoded.userId, refreshToken });
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token', 
      code: 'INVALID_TOKEN' 
    });
  }
  
  // Generate new access token
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    accessToken
  });
}));

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

// Verify OTP
router.post('/verify-otp', otpValidation, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ 'personalInfo.email': email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if OTP exists and is valid
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this user',
        code: 'OTP_NOT_FOUND'
      });
    }

    // Check if OTP is expired
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if OTP matches
    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        code: 'INVALID_OTP'
      });
    }

    // OTP is valid, mark email as verified
    user.isEmailVerified = true;
    user.otp = undefined; // Clear OTP after successful verification
    await user.save();

    // Send welcome email
    try {
      await sendRegistrationConfirmation(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the response if email fails
    }

    // Generate tokens for regular users
    let tokens = null;
    if (user.role !== 'factory' && user.role !== 'collector') {
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      await user.save(); // Save refresh token
      
      tokens = {
        accessToken,
        refreshToken
      };
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          name: user.personalInfo.name,
          email: user.personalInfo.email,
          role: user.role,
          ecoWallet: user.ecoWallet,
          sustainabilityScore: user.sustainabilityScore,
          isEmailVerified: user.isEmailVerified
        },
        tokens: tokens
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP verification',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ 'personalInfo.email': email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with new OTP
    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP email
    try {
      await sendOTP(user, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail the response if email fails
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully. Please check your email.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;