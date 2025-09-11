/**
 * Custom webpack configuration to resolve the missing MUI module
 */

const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // Alias the missing MUI module to our custom implementation
      '@mui/utils/formatMuiErrorMessage': path.resolve(__dirname, 'src/utils/mui-utils-shim.js')
    }
  }
};