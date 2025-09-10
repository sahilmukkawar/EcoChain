// database/setup.js
require('dotenv').config();
const { initDatabase } = require('./init');
const { testConnection } = require('./test-connection');
const { checkDatabaseFiles } = require('./check-files');
const { ensureDirectories } = require('./ensure-dirs');
const { checkEnvironmentVariables } = require('./check-env');

/**
 * Setup the database by initializing it and testing the connection
 */
async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Check environment variables
    console.log('\n1. Checking environment variables...');
    const envOk = checkEnvironmentVariables();
    if (!envOk) {
      throw new Error('Missing required environment variables');
    }
    console.log('✅ All required environment variables are set');
    
    // Ensure all required directories exist
    console.log('\n2. Ensuring required directories exist...');
    ensureDirectories();
    console.log('✅ All required directories are in place');
    
    // Check if all required database files are in place
    console.log('\n3. Checking database files...');
    const filesOk = checkDatabaseFiles();
    if (!filesOk) {
      throw new Error('Missing required database files');
    }
    console.log('✅ All database files are in place');
    
    // Initialize the database with seed data
    console.log('\n4. Initializing database with seed data...');
    await initDatabase();
    console.log('✅ Database initialization completed');
    
    // Test the database connection and models
    console.log('\n5. Testing database connection and models...');
    await testConnection();
    console.log('✅ Database connection and models test completed');
    
    console.log('\n✅ Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(success => {
      if (success) {
        console.log('Database setup script completed successfully');
        process.exit(0);
      } else {
        console.error('Database setup script failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Database setup script encountered an error:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };