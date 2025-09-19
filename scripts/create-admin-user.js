const mongoose = require('mongoose');
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

// Create admin user
const createAdminUser = async () => {
  try {
    console.log('\n=== CREATING ADMIN USER ===');
    
    // Delete any existing admin users with the same email
    await User.deleteMany({ 'personalInfo.email': 'admin@ecochain.com' });
    console.log('✅ Removed existing admin users');
    
    // Create a new admin user with known password
    const userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    const adminUser = new User({
      userId,
      personalInfo: {
        name: 'Admin User',
        email: 'admin@ecochain.com',
        phone: '1234567890'
      },
      password: 'Admin@123', // This will be hashed
      role: 'admin',
      accountStatus: 'active'
      // Note: Not setting address to avoid validation issues
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`User ID: ${adminUser._id}`);
    console.log(`User Email: ${adminUser.personalInfo.email}`);
    console.log(`User Role: ${adminUser.role}`);
    
    // Verify the user was created correctly
    const verifyUser = await User.findOne({ 'personalInfo.email': 'admin@ecochain.com' }).select('+password');
    if (verifyUser) {
      console.log('✅ User verified in database');
      console.log(`Password hash: ${verifyUser.password}`);
      
      // Test password matching
      const isMatch = await verifyUser.matchPassword('Admin@123');
      console.log(`Password match test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    } else {
      console.log('❌ User verification failed');
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Main function
const main = async () => {
  const conn = await connectDB();
  await createAdminUser();
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

main();