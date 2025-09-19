// scripts/directLoginTest.js
const mongoose = require('mongoose');
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

// Function to test login directly
async function directLoginTest() {
  try {
    await connectDB();

    console.log('Testing direct login functionality...');

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
      
      // Check password using the User model method
      const isPasswordValid = await user.matchPassword(credential.password);
      console.log(`  Password valid (using matchPassword): ${isPasswordValid}`);
      
      if (isPasswordValid) {
        console.log(`  ✅ Login would be successful for ${credential.email}`);
      } else {
        console.log(`  ❌ Login would fail for ${credential.email}`);
      }
    }

    await mongoose.connection.close();
    console.log('\nDirect login test completed.');
  } catch (error) {
    console.error('Error in directLoginTest:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  directLoginTest();
}

module.exports = directLoginTest;