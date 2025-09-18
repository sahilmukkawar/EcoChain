// test-factory-profile.js
const mongoose = require('mongoose');
const { Factory, User } = require('./database/models');
const connectDB = require('./database/connection');

async function testFactoryProfile() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Find the test factory user
    const user = await User.findOne({ 'personalInfo.email': 'testfactory@example.com' });
    if (!user) {
      console.log('Test factory user not found');
      return;
    }

    console.log('Found user:', user.userId, user._id, user.approvalStatus);

    // Find factory profile
    console.log('Looking for factory with userId:', user._id);
    console.log('Type of userId:', typeof user._id);
    
    const factory = await Factory.findOne({ userId: user._id });
    if (!factory) {
      console.log('Factory profile not found');
      
      // Additional debugging - check all factories
      const allFactories = await Factory.find({});
      console.log('All factories in database:', allFactories.map(f => ({
        id: f._id,
        userId: f.userId,
        factoryId: f.factoryId,
        companyName: f.companyInfo?.name
      })));
    } else {
      console.log('Found factory profile:', factory.companyInfo.name);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFactoryProfile();