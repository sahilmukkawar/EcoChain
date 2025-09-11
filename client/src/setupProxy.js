/**
 * This file configures webpack to resolve the missing MUI module
 */

const path = require('path');

module.exports = function(app) {
  // This function is used by Create React App to configure the dev server
  // We can also use it to modify the webpack configuration
  
  // Get the webpack config from the app
  const webpackConfig = app.get('webpack');
  
  // Add our custom resolver for the missing MUI module
  if (webpackConfig && webpackConfig.resolve && webpackConfig.resolve.alias) {
    webpackConfig.resolve.alias['@mui/utils/formatMuiErrorMessage'] = 
      path.resolve(__dirname, './utils/mui-utils-shim.js');
    
    // Update the webpack instance
    app.set('webpack', webpackConfig);
  }
};