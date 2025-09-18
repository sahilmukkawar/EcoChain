// test-api-request.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Factory } = require('./database/models');
const connectDB = require('./database/connection');

async function testApiRequest() {
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

    // Simulate the request object that would be created by the auth middleware
    const req = {
      user: {
        id: user._id.toString(), // This is what the auth middleware does - converts ObjectId to string
        role: user.role
      }
    };

    console.log('Simulated request user:', req.user);
    console.log('Type of req.user.id:', typeof req.user.id);
    console.log('Value of req.user.id:', req.user.id);

    // This is what the marketplace controller was doing before my fix:
    console.log('\n--- BEFORE FIX ---');
    let factory = await Factory.findOne({ userId: req.user.id });
    console.log('Factory found with string userId:', !!factory);

    // This is what the marketplace controller does after my fix:
    console.log('\n--- AFTER FIX ---');
    // Convert userId to ObjectId if it's a string
    let userId = req.user.id;
    if (typeof userId === 'string') {
      const mongoose = require('mongoose');
      try {
        userId = new mongoose.Types.ObjectId(userId);
        console.log('Converted userId to ObjectId:', userId);
      } catch (conversionError) {
        console.error('Failed to convert userId to ObjectId:', conversionError);
      }
    }
    
    factory = await Factory.findOne({ userId: userId });
    console.log('Factory found with ObjectId userId:', !!factory);
    if (factory) {
      console.log('Factory name:', factory.companyInfo.name);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testApiRequest();