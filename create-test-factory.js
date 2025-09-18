// create-test-factory.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, FactoryApplication } = require('./database/models');
const connectDB = require('./database/connection');

async function createTestFactory() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Create a test factory user
    const factoryUser = new User({
      userId: 'FAC' + Date.now(),
      personalInfo: {
        name: 'Test Factory Owner',
        email: 'testfactory@example.com',
        phone: '+1234567890'
      },
      password: 'TestPass123',
      role: 'factory',
      approvalStatus: 'pending',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      }
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    factoryUser.password = await bcrypt.hash(factoryUser.password, salt);

    await factoryUser.save();
    console.log('Factory user created:', factoryUser.userId);

    // Create a factory application
    const factoryApplication = new FactoryApplication({
      userId: factoryUser._id,
      factoryName: 'Test Eco Factory',
      ownerName: 'Test Factory Owner',
      email: 'testfactory@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      },
      gstNumber: 'GST1234567890'
    });

    await factoryApplication.save();
    console.log('Factory application created:', factoryApplication._id);

    console.log('Test factory user and application created successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestFactory();