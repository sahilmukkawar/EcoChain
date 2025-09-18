// check-factory-application.js
const mongoose = require('mongoose');
const { FactoryApplication, User } = require('./database/models');
const connectDB = require('./database/connection');

async function checkFactoryApplication() {
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
    
    // Check if there's a factory application for this user
    const factoryApplication = await FactoryApplication.findOne({ userId: userIdFromLogs });
    if (!factoryApplication) {
      console.log('No factory application found for this user');
      return;
    }
    
    console.log('Factory application found:');
    console.log('- Status:', factoryApplication.status);
    console.log('- Factory Name:', factoryApplication.factoryName);
    console.log('- Submitted At:', factoryApplication.submittedAt);
    
    // Check if there are any other factory applications
    const allApplications = await FactoryApplication.find({});
    console.log('\nAll factory applications:');
    allApplications.forEach(app => {
      console.log(`- ${app.factoryName}: userId=${app.userId}, status=${app.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFactoryApplication();