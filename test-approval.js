// test-approval.js
const mongoose = require('mongoose');
const { FactoryApplication, Factory, User } = require('./database/models');
const connectDB = require('./database/connection');

async function testApproval() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Find a pending factory application
    const factoryApplication = await FactoryApplication.findOne({ status: 'pending' });
    if (!factoryApplication) {
      console.log('No pending factory applications found');
      return;
    }

    console.log('Found factory application:', factoryApplication);

    // Update factory application status
    factoryApplication.status = 'approved';
    factoryApplication.reviewedBy = factoryApplication.userId; // Use the same user as reviewer for testing
    factoryApplication.reviewedAt = new Date();
    await factoryApplication.save();

    // Update user approval status
    const user = await User.findById(factoryApplication.userId);
    if (user) {
      user.approvalStatus = 'approved';
      await user.save();
      console.log('User approval status updated');

      // Automatically create factory profile using application data
      try {
        const existingFactory = await Factory.findOne({ userId: factoryApplication.userId });
        if (!existingFactory) {
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
          console.log('Factory profile created successfully:', factory._id);
        } else {
          console.log('Factory profile already exists for userId:', factoryApplication.userId);
        }
      } catch (factoryCreationError) {
        console.error('Failed to create factory profile:', factoryCreationError);
      }
    }

    console.log('Factory application approved successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testApproval();