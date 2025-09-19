// scripts/repairSeededPasswords.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../database/models/User');
const Product = require('../database/models/Product');
const Factory = require('../database/models/Factory');
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

// Function to repair seeded passwords
async function repairSeededPasswords() {
  const targets = [
    { email: 'admin@ecochain.com', password: 'Admin@123', role: 'admin' },
    { email: 'factory@ecochain.com', password: 'Factory@123', role: 'factory' },
    { email: 'collector@ecochain.com', password: 'Collector@123', role: 'collector' },
    { email: 'user@ecochain.com', password: 'User@123', role: 'user' }
  ];

  try {
    await connectDB();

    console.log('Starting password repair process...');

    // Process each target user
    for (const target of targets) {
      try {
        // Check if user already exists
        let user = await User.findOne({ 'personalInfo.email': target.email });

        if (user) {
          console.log(`User with email ${target.email} already exists. Updating password...`);
          // Hash the new password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(target.password, salt);
          
          // Update the password directly in the database to avoid triggering the pre-save middleware
          await User.updateOne(
            { 'personalInfo.email': target.email },
            { 
              $set: { 
                password: hashedPassword,
                role: target.role,
                accountStatus: 'active'
              }
            }
          );
          
          console.log(`Password updated for ${target.email}`);
        } else {
          console.log(`Creating new user for ${target.email}...`);
          // Generate unique userId
          const userId = target.role.toUpperCase().substring(0, 3) + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
          
          // Hash the password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(target.password, salt);
          
          // Create new user
          user = new User({
            userId,
            personalInfo: {
              name: target.role.charAt(0).toUpperCase() + target.role.slice(1),
              email: target.email,
              phone: '+919876543210'
            },
            password: hashedPassword,
            role: target.role,
            accountStatus: 'active',
            isEmailVerified: true
          });
          
          await user.save();
          console.log(`Created new user for ${target.email}`);
        }
      } catch (error) {
        console.error(`Error processing user ${target.email}:`, error.message);
      }
    }

    console.log('Password repair process completed.');

    // Assign all products to factory
    console.log('Assigning all products to factory...');
    
    // Find the factory user
    const factoryUser = await User.findOne({ role: 'factory' });
    if (!factoryUser) {
      console.log('No factory user found. Skipping product assignment.');
      await mongoose.connection.close();
      return;
    }

    // Check if factory already exists
    let factory = await Factory.findOne({ userId: factoryUser._id });
    
    if (!factory) {
      console.log('Creating factory record...');
      // Create factory record if it doesn't exist
      factory = new Factory({
        factoryId: 'FCT' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
        userId: factoryUser._id,
        companyInfo: {
          name: 'EcoChain Factory',
          registrationNumber: 'REG' + Date.now(),
          establishedYear: 2020,
          website: 'https://ecochain-factory.com'
        },
        contactInfo: {
          email: factoryUser.personalInfo.email,
          phone: factoryUser.personalInfo.phone || '+919876543210',
          primaryContact: factoryUser.personalInfo.name
        },
        location: {
          address: '123 Factory Street',
          city: 'Factory City',
          state: 'Factory State',
          country: 'India',
          coordinates: {
            type: 'Point',
            coordinates: [77.5946, 12.9716] // Default coordinates (Bangalore, India)
          }
        },
        capabilities: {
          acceptedMaterials: ['plastic', 'paper', 'metal', 'glass'],
          processingCapacity: 1000
        },
        status: 'active'
      });
      
      await factory.save();
      console.log('Factory record created.');
    }

    // Assign all products to this factory
    const products = await Product.find({});
    console.log(`Found ${products.length} products to assign.`);
    
    let updatedCount = 0;
    for (const product of products) {
      try {
        product.factoryId = factory._id;
        await product.save();
        updatedCount++;
      } catch (error) {
        console.error(`Error updating product ${product.productId}:`, error.message);
      }
    }
    
    console.log(`Assigned ${updatedCount} products to factory.`);

    await mongoose.connection.close();
    console.log('All operations completed successfully.');
  } catch (error) {
    console.error('Error in repairSeededPasswords:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  repairSeededPasswords();
}

module.exports = repairSeededPasswords;