// test-exact-scenario.js
const mongoose = require('mongoose');
const { Factory, User } = require('./database/models');
const connectDB = require('./database/connection');

async function testExactScenario() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Simulate the exact scenario from the logs
    const userIdFromLogs = "68cbe6d331ec077baf734b7f";
    const role = "factory";
    
    console.log('Testing with userId from logs:', userIdFromLogs);
    
    // Check if this user exists
    const user = await User.findById(userIdFromLogs);
    if (!user) {
      console.log('User not found in database');
      
      // Let's check all users to see if we can find a match
      const allUsers = await User.find({});
      console.log('All users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.userId}: ${u._id} (${u.role}, ${u.approvalStatus})`);
      });
      
      return;
    }
    
    console.log('Found user:', user.userId, user.role, user.approvalStatus);
    
    // Simulate the request object
    const req = {
      user: {
        id: userIdFromLogs,
        role: role
      }
    };
    
    console.log('Request user object:', req.user);
    
    // Try to find the factory profile
    console.log('Looking for factory with userId:', req.user.id);
    
    // Test 1: Direct string search (this is what was failing)
    let factory = await Factory.findOne({ userId: req.user.id });
    console.log('Factory found with direct string search:', !!factory);
    
    // Test 2: Convert to ObjectId first (this is what I fixed)
    const mongoose = require('mongoose');
    let userId = req.user.id;
    if (typeof userId === 'string') {
      try {
        userId = new mongoose.Types.ObjectId(userId);
        console.log('Converted userId to ObjectId:', userId);
      } catch (conversionError) {
        console.error('Failed to convert userId to ObjectId:', conversionError);
        return;
      }
    }
    
    factory = await Factory.findOne({ userId: userId });
    console.log('Factory found with ObjectId search:', !!factory);
    if (factory) {
      console.log('Factory details:', factory.companyInfo.name);
    } else {
      console.log('Still no factory found. Let\'s check all factories:');
      const allFactories = await Factory.find({});
      allFactories.forEach(f => {
        console.log(`- ${f.factoryId}: userId=${f.userId} (${typeof f.userId})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testExactScenario();