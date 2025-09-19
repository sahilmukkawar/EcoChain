// scripts/checkApplications.js
const mongoose = require('mongoose');
const User = require('../database/models/User');
const FactoryApplication = require('../database/models/FactoryApplication');
const CollectorApplication = require('../database/models/CollectorApplication');
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

// Function to check applications
async function checkApplications() {
  try {
    await connectDB();

    console.log('Checking applications...');

    // Check factory applications
    console.log('\n=== Factory Applications ===');
    const factoryApps = await FactoryApplication.find({}).populate('userId', 'personalInfo.name personalInfo.email role');
    console.log(`Found ${factoryApps.length} factory applications:`);
    
    factoryApps.forEach((app, index) => {
      console.log(`\n${index + 1}. Factory Application:`);
      console.log(`   ID: ${app._id}`);
      console.log(`   Factory Name: ${app.factoryName}`);
      console.log(`   GST Number: ${app.gstNumber}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Submitted: ${app.submittedAt}`);
      if (app.userId) {
        console.log(`   User: ${app.userId.personalInfo.name} (${app.userId.personalInfo.email})`);
        console.log(`   Role: ${app.userId.role}`);
      }
    });

    // Check collector applications
    console.log('\n=== Collector Applications ===');
    const collectorApps = await CollectorApplication.find({}).populate('userId', 'personalInfo.name personalInfo.email role');
    console.log(`Found ${collectorApps.length} collector applications:`);
    
    collectorApps.forEach((app, index) => {
      console.log(`\n${index + 1}. Collector Application:`);
      console.log(`   ID: ${app._id}`);
      console.log(`   Company Name: ${app.companyName}`);
      console.log(`   License Number: ${app.licenseNumber}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Submitted: ${app.submittedAt}`);
      if (app.userId) {
        console.log(`   User: ${app.userId.personalInfo.name} (${app.userId.personalInfo.email})`);
        console.log(`   Role: ${app.userId.role}`);
      }
    });

    // Check users with business roles
    console.log('\n=== Business Users ===');
    const businessUsers = await User.find({ 
      role: { $in: ['factory', 'collector'] } 
    }).select('personalInfo.name personalInfo.email role accountStatus');
    
    console.log(`Found ${businessUsers.length} business users:`);
    businessUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`);
      console.log(`   Name: ${user.personalInfo.name}`);
      console.log(`   Email: ${user.personalInfo.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.accountStatus}`);
    });

    await mongoose.connection.close();
    console.log('\nApplication check completed.');
  } catch (error) {
    console.error('Error in checkApplications:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  checkApplications();
}

module.exports = checkApplications;