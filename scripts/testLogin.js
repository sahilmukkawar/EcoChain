// scripts/testLogin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../database/models/User');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecochain');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Function to test login
async function testLogin() {
  try {
    await connectDB();

    console.log('Testing login functionality...');

    const testCredentials = [
      { email: 'admin@ecochain.com', password: 'Admin@123' },
      { email: 'factory@ecochain.com', password: 'Factory@123' },
      { email: 'collector@ecochain.com', password: 'Collector@123' },
      { email: 'user@ecochain.com', password: 'User@123' }
    ];

    for (const credential of testCredentials) {
      console.log(`\nTesting login for ${credential.email}...`);
      
      // Find user and include password for verification
      const user = await User.findOne({ 'personalInfo.email': credential.email }).select('+password');
      if (!user) {
        console.log(`  User not found!`);
        continue;
      }

      console.log(`  User found with role: ${user.role}`);
      console.log(`  Account status: ${user.accountStatus}`);
      
      // Check password
      const isPasswordValid = await user.matchPassword(credential.password);
      console.log(`  Password valid: ${isPasswordValid}`);
      
      if (isPasswordValid) {
        console.log(`  ✅ Login would be successful for ${credential.email}`);
      } else {
        console.log(`  ❌ Login would fail for ${credential.email}`);
        
        // Let's check what password is actually stored
        console.log(`  Stored password hash: ${user.password.substring(0, 20)}...`);
        
        // Try to hash the expected password and compare
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(credential.password, salt);
        console.log(`  New hash of same password: ${hashedPassword.substring(0, 20)}...`);
      }
    }

    await mongoose.connection.close();
    console.log('\nLogin test completed.');
  } catch (error) {
    console.error('Error in testLogin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  testLogin();
}

module.exports = testLogin;