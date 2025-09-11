/**
 * Custom webpack configuration for Create React App
 * This file uses react-app-rewired to override the default webpack config
 */

module.exports = function override(config) {
  // Add our custom resolver for the missing MUI module
  if (!config.resolve) {
    config.resolve = {};
  }
  
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }
  
  // Add the alias for the missing MUI module
  config.resolve.alias['@mui/utils/formatMuiErrorMessage'] = 
    require('path').resolve(__dirname, 'src/utils/mui-utils-shim.js');
  
  return config;
};