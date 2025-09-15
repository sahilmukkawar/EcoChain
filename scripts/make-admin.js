// scripts/make-admin.js
// Script to make a user an admin
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

// Make user admin
const makeAdmin = async (email) => {
  try {
    await connectDB();
    
    const user = await User.findOne({ 'personalInfo.email': email });
    if (!user) {
      console.log('User not found with email:', email);
      process.exit(1);
    }
    
    console.log('Found user:', user.personalInfo.name, user.personalInfo.email, user.role);
    
    // Update role to admin
    user.role = 'admin';
    await user.save();
    
    console.log('User role updated to admin successfully!');
    console.log('Updated user:', user.personalInfo.name, user.personalInfo.email, user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user role:', error);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/make-admin.js <user-email>');
  process.exit(1);
}

makeAdmin(email);