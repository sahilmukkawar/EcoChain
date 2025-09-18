// check-factory-data.js
const mongoose = require('mongoose');
const { Factory } = require('./database/models');
const connectDB = require('./database/connection');

async function checkFactoryData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Find all factories and show their userId field details
    const factories = await Factory.find({});
    console.log('Number of factories found:', factories.length);
    
    factories.forEach((factory, index) => {
      console.log(`\n--- Factory ${index + 1} ---`);
      console.log('Factory ID:', factory._id);
      console.log('Factory userId:', factory.userId);
      console.log('Type of factory.userId:', typeof factory.userId);
      console.log('Is factory.userId an ObjectId?', factory.userId instanceof mongoose.Types.ObjectId);
      
      if (factory.userId && typeof factory.userId === 'object') {
        console.log('factory.userId.toString():', factory.userId.toString());
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFactoryData();