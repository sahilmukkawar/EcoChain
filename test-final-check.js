// test-final-check.js
const mongoose = require('mongoose');
const { Factory, User } = require('./database/models');
const connectDB = require('./database/connection');

async function testFinalCheck() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // The userId from the logs
    const userIdFromLogs = "68cbe6d331ec077baf734b7f";
    
    // Find the user
    const user = await User.findById(userIdFromLogs);
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.userId, user.role, user.approvalStatus);
    
    // Simulate the request object
    const req = {
      user: {
        id: userIdFromLogs,
        role: user.role
      }
    };
    
    console.log('Request user object:', req.user);
    
    // Try to find the factory profile (using the fixed approach)
    console.log('Looking for factory with userId:', req.user.id);
    
    // Convert userId to ObjectId if it's a string
    let userId = req.user.id;
    if (typeof userId === 'string') {
      const mongoose = require('mongoose');
      try {
        userId = new mongoose.Types.ObjectId(userId);
        console.log('Converted userId to ObjectId:', userId);
      } catch (conversionError) {
        console.error('Failed to convert userId to ObjectId:', conversionError);
        return;
      }
    }
    
    const factory = await Factory.findOne({ userId: userId });
    if (!factory) {
      console.log('Factory profile not found');
      return;
    }
    
    console.log('Factory profile found successfully!');
    console.log('Factory details:', factory.companyInfo.name, factory.factoryId);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFinalCheck();