// scripts/getAdminToken.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models
const { User } = require('../database/models');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain_dev', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate auth token
const generateAuthToken = function(user) {
  const payload = {
    id: user._id,
    role: user.role
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Get admin token
const getAdminToken = async () => {
  try {
    console.log('\n=== GETTING ADMIN TOKEN ===');
    
    // Find the admin user
    const user = await User.findOne({ 'personalInfo.email': 'admin@ecochain.com' }).select('+password');
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found');
    console.log(`User ID: ${user._id}`);
    console.log(`User Email: ${user.personalInfo.email}`);
    console.log(`User Role: ${user.role}`);
    
    // Verify password
    const isPasswordValid = await user.matchPassword('Admin@123');
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }
    
    console.log('✅ Password verified');
    
    // Generate token
    const token = generateAuthToken(user);
    console.log('✅ Token generated successfully');
    console.log(`Token: ${token}`);
    
    // Test the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
      console.log('✅ Token verified successfully');
      console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error getting admin token:', error);
  }
};

// Main function
const main = async () => {
  const conn = await connectDB();
  await getAdminToken();
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

main();