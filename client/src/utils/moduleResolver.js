/**
 * Module resolver to handle missing MUI modules at runtime
 */

// Store original require function
const originalRequire = window.require || (() => {});

// Create a custom require function that intercepts specific module requests
window.require = function(modulePath) {
  // Check if the requested module is the missing MUI module
  if (modulePath === '@mui/utils/formatMuiErrorMessage') {
    // Return our custom implementation
    return require('./formatMuiErrorMessage').default;
  }
  
  // Otherwise, use the original require function
  return originalRequire(modulePath);
};

// Export a function to initialize the resolver
export function initModuleResolver() {
  console.log('MUI module resolver initialized');
}