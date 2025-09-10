// database/check-files.js
const fs = require('fs');
const path = require('path');

/**
 * Check if all required database files are in place
 */
function checkDatabaseFiles() {
  console.log('Checking database files...');
  
  const requiredFiles = [
    'connection.js',
    'init.js',
    'setup.js',
    'test-connection.js',
    'utils.js',
    'validation.js',
    'models/User.js',
    'models/GarbageCollection.js',
    'models/Transaction.js',
    'models/Marketplace.js',
    'models/VisionInference.js',
    'models/index.js'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length === 0) {
    console.log('✅ All database files are in place');
    return true;
  } else {
    console.error('❌ Missing database files:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    return false;
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  const result = checkDatabaseFiles();
  process.exit(result ? 0 : 1);
}

module.exports = { checkDatabaseFiles };