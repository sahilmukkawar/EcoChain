/**
 * This file patches the webpack module system to provide the missing MUI module
 */

// Define the formatMuiErrorMessage function
function formatMuiErrorMessage(code, args = {}) {
  // Format the error message with the code
  const url = `https://mui.com/production-error/?code=${code}`;
  const message = `MUI: Error code ${code}`;
  
  // Add any additional arguments to the message
  if (Object.keys(args).length) {
    const formattedArgs = JSON.stringify(args);
    return `${message}\nDetails: ${formattedArgs}\nFor more info, see ${url}`;
  }
  
  return `${message}\nFor more info, see ${url}`;
}

// Patch the webpack module system
if (typeof window !== 'undefined') {
  // Store the original __webpack_require__ function
  const originalRequire = window.__webpack_require__;
  
  // Override the __webpack_require__ function
  window.__webpack_require__ = function(moduleId) {
    // Check if the requested module is the missing MUI module
    try {
      return originalRequire(moduleId);
    } catch (error) {
      // If the error is about the missing MUI module, return our implementation
      if (error.message && error.message.includes('@mui/utils/formatMuiErrorMessage')) {
        console.log('Providing polyfill for @mui/utils/formatMuiErrorMessage');
        return formatMuiErrorMessage;
      }
      
      // Otherwise, rethrow the error
      throw error;
    }
  };
}

// Export the function for direct imports
export default formatMuiErrorMessage;