// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, FactoryApplication, CollectorApplication } = require('../database/models');
const { sendRegistrationConfirmation } = require('../utils/notificationService');
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

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
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

    // Validate role-specific fields
    if (role === 'factory') {
      if (!factoryName || !ownerName || !gstNumber) {
        return res.status(400).json({
          success: false,
          message: 'Factory name, owner name, and GST number are required for factory registration'
        });
      }
    } else if (role === 'collector') {
      if (!companyName || !contactName || !serviceArea) {
        return res.status(400).json({
          success: false,
          message: 'Company name, contact name, and service area are required for collector registration'
        });
      }
    }

    // Generate unique userId
    const userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Set approval status based on role
    let approvalStatus = 'approved'; // Default for regular users and admins
    if (role === 'factory' || role === 'collector') {
      approvalStatus = 'pending'; // Factories and collectors need approval
    }

    // Handle address for user creation
    let userAddress = {};
    if (address && typeof address === 'object') {
      // Address is sent as an object (from frontend form)
      userAddress = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'India'
      };
    } else {
      // Address fields are sent individually (fallback)
      userAddress = {
        street: req.body['address[street]'] || '',
        city: req.body['address[city]'] || '',
        state: req.body['address[state]'] || '',
        zipCode: req.body['address[zipCode]'] || '',
        country: req.body['address[country]'] || 'India'
      };
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
      address: userAddress
    });

    await user.save();

    // If factory or collector, create application
    if (role === 'factory') {
      // Ensure address has all required fields for factory application
      // Handle both flat address fields and nested address object
      let street, city, state, zipCode, country;
      
      if (address && typeof address === 'object') {
        // Address is sent as an object (from frontend form)
        street = address.street || '';
        city = address.city || '';
        state = address.state || '';
        zipCode = address.zipCode || '';
        country = address.country || 'India';
      } else {
        // Address fields are sent individually (fallback)
        street = req.body['address[street]'] || '';
        city = req.body['address[city]'] || '';
        state = req.body['address[state]'] || '';
        zipCode = req.body['address[zipCode]'] || '';
        country = req.body['address[country]'] || 'India';
      }
      
      const factoryAddress = {
        street,
        city,
        state,
        zipCode,
        country
      };
      
      // Validate that required address fields are provided for factory registration
      if (!factoryAddress.street || !factoryAddress.city || !factoryAddress.state || !factoryAddress.zipCode) {
        // Clean up the user we just created since factory application failed
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: 'Complete address (street, city, state, ZIP code) is required for factory registration'
        });
      }
      
      try {
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
      } catch (factoryError) {
        // Clean up the user we just created since factory application failed
        await User.findByIdAndDelete(user._id);
        console.error('Factory application error:', factoryError);
        return res.status(400).json({
          success: false,
          message: 'Failed to create factory application: ' + factoryError.message
        });
      }
    } else if (role === 'collector') {
      try {
        const collectorApplication = new CollectorApplication({
          userId: user._id,
          companyName,
          contactName,
          email,
          phone,
          serviceArea: Array.isArray(serviceArea) ? serviceArea : serviceArea.split(',').map(area => area.trim()).filter(area => area)
        });
        await collectorApplication.save();
      } catch (collectorError) {
        // Clean up the user we just created since collector application failed
        await User.findByIdAndDelete(user._id);
        console.error('Collector application error:', collectorError);
        return res.status(400).json({
          success: false,
          message: 'Failed to create collector application: ' + collectorError.message
        });
      }
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
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') || 'Validation error during registration' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error during registration' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // First, aggressively clean any corrupted address data using direct MongoDB update
    console.log('Pre-cleaning address data for user:', email);
    await User.updateOne(
      { 'personalInfo.email': email },
      { 
        $unset: { 
          'address.location': 1,
          'address.coordinates': 1 
        }
      }
    ).catch(err => console.log('Pre-clean update error (expected):', err.message));

    // Find user and include password for verification
    let user = await User.findOne({ 'personalInfo.email': email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('User found:', user.personalInfo.name, 'Role:', user.role);
    console.log('User has password hash:', !!user.password);

    // Clean corrupted address data before any operations
    let needsSave = false;
    console.log('Checking address data for user:', email);
    
    if (user.address) {
      console.log('Current address data:', JSON.stringify(user.address, null, 2));
      
      // Check and clean location data
      if (user.address.location) {
        console.log('Location data exists:', JSON.stringify(user.address.location, null, 2));
        
        // Check coordinates
        if (user.address.location.coordinates) {
          const coords = user.address.location.coordinates;
          console.log('Coordinates:', coords, 'Type:', typeof coords, 'IsArray:', Array.isArray(coords));
          
          // Check if coordinates are invalid
          const isInvalid = !Array.isArray(coords) || 
                           coords.length !== 2 || 
                           coords.some(coord => typeof coord !== 'number' || isNaN(coord) || coord === null || coord === undefined);
          
          if (isInvalid) {
            console.log('Invalid coordinates detected, cleaning...');
            user.address.location = undefined;
            user.markModified('address.location');
            needsSave = true;
          }
        } else {
          // Location exists but no coordinates - this might cause issues too
          console.log('Location exists but no coordinates, cleaning location...');
          user.address.location = undefined;
          user.markModified('address.location');
          needsSave = true;
        }
      }
      
      // If address is completely empty, clean it up
      if (Object.keys(user.address).length === 0 || 
          (Object.keys(user.address).length === 1 && user.address.location === undefined)) {
        console.log('Empty address object, removing...');
        user.address = undefined;
        user.markModified('address');
        needsSave = true;
      }
    }
    
    // Save cleaned user data if needed
    if (needsSave) {
      console.log('Saving user with cleaned address data...');
      try {
        // Use direct MongoDB update to bypass validation issues
        await User.updateOne(
          { 'personalInfo.email': email },
          { $unset: user.address ? { 'address.location': 1 } : { address: 1 } }
        );
        console.log('Direct database update completed');
        
        // Refetch user to ensure clean data
        user = await User.findOne({ 'personalInfo.email': email }).select('+password');
        console.log('User refetched after cleanup');
      } catch (updateError) {
        console.log('Direct update failed, trying save method:', updateError.message);
        // Fallback to save method with aggressive cleaning
        user.address = {};
        user.markModified('address');
        await user.save({ validateBeforeSave: false });
        
        // Refetch user again
        user = await User.findOne({ 'personalInfo.email': email }).select('+password');
      }
    }

    // Check password
    console.log('Checking password for user:', email);
    const isPasswordValid = await user.matchPassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', email);
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
      // For pending users, still generate tokens but indicate pending status
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      
      return res.status(200).json({
        success: true,
        message: user.approvalStatus === 'pending' 
          ? 'Login successful. Account pending admin approval.' 
          : `Login successful. Account ${user.approvalStatus}.`,
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
            rejectionReason: user.rejectionReason,
            ecoWallet: user.ecoWallet,
            sustainabilityScore: user.sustainabilityScore
          },
          tokens: {
            accessToken,
            refreshToken
          },
          pendingApproval: user.approvalStatus === 'pending'
        }
      });
    }

    // Generate tokens BEFORE any save operations that might trigger validation
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    
    // Update last active and save tokens with validation disabled
    try {
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastActive: new Date(),
            refreshToken: refreshToken
          }
        }
      );
      console.log('User tokens and lastActive updated successfully');
    } catch (saveError) {
      console.error('Error saving user tokens:', saveError.message);
      // Continue with login even if token save fails
    }

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
    console.error('Login error:', error);
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
          // Convert existing address to plain object to avoid subdocument issues
          const existingAddress = user.address ? user.address.toObject() : {};
          
          // Merge with existing address data, ensuring no location field
          const mergedAddress = { ...existingAddress, ...cleanAddressData };
          
          // Explicitly remove any location field that might exist
          delete mergedAddress.location;

          // Reassign cleaned address object
          user.address = mergedAddress;
          
          // Final safety check - mark address as modified to ensure pre-save middleware runs
          user.markModified('address');
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
            // Convert existing address to plain object to avoid subdocument issues
            const existingAddress = user.address ? user.address.toObject() : {};
            
            // Ensure no location field gets through
            delete cleanAddressData.location;
            
            // Merge and reassign cleaned address object
            user.address = { ...existingAddress, ...cleanAddressData };
            user.markModified('address');
          }
        }
      }
    }

    // Debug: Log the address data before saving (JSON endpoint)
    console.log('Address data before save (JSON endpoint):', {
      hasAddress: !!user.address,
      addressData: user.address,
      hasLocation: user.address?.location,
      locationType: typeof user.address?.location
    });

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

    // CRITICAL: Explicitly remove location field that causes validation errors
    if (hasAddressUpdate || user.address) {
      // Get current address data as plain object to avoid Mongoose issues
      const currentAddress = user.address ? user.address.toObject() : {};
      
      // Create a completely clean address object with only allowed fields
      const cleanAddress = {};
      const allowedFields = ['street', 'city', 'state', 'zipCode', 'country'];
      
      for (const field of allowedFields) {
        if (currentAddress[field]) {
          cleanAddress[field] = currentAddress[field];
        }
      }
      
      // Completely replace the address with the clean object (no location field)
      user.address = cleanAddress;
      
      // Force Mongoose to recognize the change
      user.markModified('address');
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
          // Convert existing address to plain object to avoid subdocument issues
          const existingAddress = user.address ? user.address.toObject() : {};
          
          // Merge with existing address data, ensuring no location field
          const mergedAddress = { ...existingAddress, ...cleanAddressData };
          
          // Explicitly remove any location field that might exist
          delete mergedAddress.location;

          // Reassign cleaned address object
          user.address = mergedAddress;
          
          // Final safety check - mark address as modified to ensure pre-save middleware runs
          user.markModified('address');
        }
      } catch (parseError) {
        console.warn('Failed to parse address JSON:', parseError);
      }
    }

    // Debug: Log the address data before saving (Image endpoint)
    console.log('Address data before save (Image endpoint):', {
      hasAddress: !!user.address,
      addressData: user.address,
      hasLocation: user.address?.location,
      locationType: typeof user.address?.location
    });

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