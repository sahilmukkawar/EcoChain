/**
 * Direct replacement for the missing @mui/utils module
 */

// Export the formatMuiErrorMessage function
export { default as formatMuiErrorMessage } from './formatMuiErrorMessage';

// Export a default object with all utilities
const utils = {
  formatMuiErrorMessage: require('./formatMuiErrorMessage').default
};

export default utils;