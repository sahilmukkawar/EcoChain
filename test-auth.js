// test-auth.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('./database/models');
const connectDB = require('./database/connection');

async function testAuth() {
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

    // Generate a JWT token for this user
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      'dev_jwt_secret_change_me',
      { expiresIn: '7d' }
    );

    console.log('Generated token:', token);

    // Decode the token
    const decoded = jwt.verify(token, 'dev_jwt_secret_change_me');
    console.log('Decoded token:', decoded);
    console.log('Decoded id type:', typeof decoded.id);
    console.log('Decoded id value:', decoded.id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAuth();