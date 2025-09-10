// database/check-env.js
require('dotenv').config();

/**
 * Check if all required environment variables are set
 */
function checkEnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
    return true;
  } else {
    console.error('❌ Missing environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease set these variables in your .env file');
    console.error('You can use .env.example as a template');
    return false;
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  const result = checkEnvironmentVariables();
  process.exit(result ? 0 : 1);
}

module.exports = { checkEnvironmentVariables };