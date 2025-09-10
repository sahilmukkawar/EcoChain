// database/ensure-dirs.js
const fs = require('fs');
const path = require('path');

/**
 * Ensure that all required directories exist
 */
function ensureDirectories() {
  console.log('Ensuring required directories exist...');
  
  const requiredDirs = [
    'models'
  ];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  console.log('✅ All required directories are in place');
  return true;
}

// Run the check if this script is executed directly
if (require.main === module) {
  const result = ensureDirectories();
  process.exit(result ? 0 : 1);
}

module.exports = { ensureDirectories };