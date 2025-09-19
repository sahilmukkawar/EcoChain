// scripts/checkUsers.js
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

// Function to check users
async function checkUsers() {
  try {
    await connectDB();

    console.log('Checking seeded users...');

    const emails = [
      'admin@ecochain.com',
      'factory@ecochain.com',
      'collector@ecochain.com',
      'user@ecochain.com'
    ];

    for (const email of emails) {
      const user = await User.findOne({ 'personalInfo.email': email });
      if (user) {
        console.log(`\nUser: ${email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Status: ${user.accountStatus}`);
        console.log(`  Verified: ${user.isEmailVerified}`);
        console.log(`  User ID: ${user.userId}`);
      } else {
        console.log(`\nUser ${email} not found!`);
      }
    }

    await mongoose.connection.close();
    console.log('\nUser check completed.');
  } catch (error) {
    console.error('Error in checkUsers:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  checkUsers();
}

module.exports = checkUsers;