// create-missing-factory.js
const mongoose = require('mongoose');
const { Factory, FactoryApplication, User } = require('./database/models');
const connectDB = require('./database/connection');

async function createMissingFactory() {
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
    
    // Check if factory profile already exists
    const existingFactory = await Factory.findOne({ userId: userIdFromLogs });
    if (existingFactory) {
      console.log('Factory profile already exists:', existingFactory.factoryId);
      return;
    }
    
    // Find the factory application
    const factoryApplication = await FactoryApplication.findOne({ userId: userIdFromLogs });
    if (!factoryApplication) {
      console.log('No factory application found for this user');
      return;
    }
    
    console.log('Factory application found:', factoryApplication.factoryName);
    
    // Create factory profile using application data
    const factoryData = {
      factoryId: 'FAC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
      userId: factoryApplication.userId,
      companyInfo: {
        name: factoryApplication.factoryName,
        registrationNumber: factoryApplication.gstNumber,
      },
      contactInfo: {
        email: factoryApplication.email,
        phone: factoryApplication.phone,
        primaryContact: factoryApplication.ownerName,
      },
      location: {
        address: factoryApplication.address.street,
        city: factoryApplication.address.city,
        state: factoryApplication.address.state,
        country: factoryApplication.address.country,
        coordinates: {
          type: 'Point',
          coordinates: [0, 0] // Default coordinates, can be updated later
        }
      },
      capabilities: {
        processingCapacity: 1, // Set to 1 as minimum required value
        acceptedMaterials: [] // Will be set by factory later
      }
    };

    console.log('Creating factory profile with data:', factoryData);
    const factory = new Factory(factoryData);
    await factory.save();
    console.log('Factory profile created successfully:', factory._id, factory.factoryId);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMissingFactory();