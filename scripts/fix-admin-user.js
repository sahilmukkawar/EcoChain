// scripts/fix-admin-user.js
// Script to fix admin user data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../database/models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Fix admin user
const fixAdminUser = async () => {
  try {
    await connectDB();
    
    const user = await User.findOne({ 'personalInfo.email': 'admin@ecochain.com' });
    if (!user) {
      console.log('Admin user not found');
      process.exit(1);
    }
    
    console.log('Before fix:');
    console.log('Address:', user.address);
    
    // Fix the address by removing invalid location data
    if (user.address && user.address.location) {
      // Check if location is an empty object
      if (typeof user.address.location === 'object' && 
          !Array.isArray(user.address.location) && 
          Object.keys(user.address.location).length === 0) {
        delete user.address.location;
        console.log('Removed empty location object');
      }
      
      // If address is now empty, remove it entirely
      if (Object.keys(user.address).length === 0) {
        user.address = undefined;
        console.log('Removed empty address object');
      }
    }
    
    // Save the user
    await user.save();
    
    console.log('After fix:');
    console.log('Address:', user.address);
    console.log('Admin user fixed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin user:', error);
    process.exit(1);
  }
};

fixAdminUser();