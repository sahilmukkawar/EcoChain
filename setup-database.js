// setup-database.js
require('dotenv').config();
const { setupDatabase } = require('./database/setup');
const connectDB = require('./database/connection');
const { repairSeededPasswords } = require('./database/utils');

/**
 * Main script to set up the EcoChain database
 */
async function main() {
  console.log('=== EcoChain Database Setup ===');
  console.log('This script will set up the MongoDB database for the EcoChain application.');
  console.log('It will create the necessary collections, indexes, and seed data.');
  console.log('Make sure your MongoDB connection string is correctly set in the .env file.');
  console.log('\n');
  
  try {
    const success = await setupDatabase();
    
    if (success) {
      // Attempt one-time password repair for seeded users
      try {
        await connectDB();
        await repairSeededPasswords();
        console.log('Seeded user passwords verified/repaired');
      } catch (e) {
        console.warn('Password repair skipped:', e.message);
      }
      console.log('\n=== Database Setup Completed Successfully ===');
      console.log('You can now start the application.');
      console.log('\nTo start the backend server:');
      console.log('npm run dev');
    } else {
      console.error('\n=== Database Setup Failed ===');
      console.error('Please check the error messages above and try again.');
      console.error('Make sure your MongoDB connection string is correctly set in the .env file.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n=== Database Setup Failed ===');
    console.error('An unexpected error occurred:', error);
    console.error('Please check the error messages and try again.');
    process.exit(1);
  }
}

// Run the main function
main();