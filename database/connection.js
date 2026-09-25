// database/connection.js
const mongoose = require('mongoose');
require('dotenv').config();

// The application data lives in the `test` database on Atlas. Both production and
// development point at it deliberately, so the database name is pinned here rather
// than read from the URI - any path in MONGODB_URI is ignored (see `dbName` below).
const DB_NAME = 'test';

// MongoDB connection string - fallback to local MongoDB if no URI is provided
const MONGODB_URI = process.env.MONGODB_URI || `mongodb://localhost:27017/${DB_NAME}`;

// Connection options
const options = {
  dbName: DB_NAME, // Overrides whatever database the URI points at
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

// Create connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection disconnected through app termination');
  process.exit(0);
});

module.exports = connectDB;