/**
 * Custom implementation of the missing MUI utility function
 * This file provides the formatMuiErrorMessage function that's missing from @mui/utils
 */

/**
 * Format a MUI error message with the provided code
 * @param {number} code - The error code
 * @param {Object} [args] - Optional arguments to include in the error message
 * @returns {string} The formatted error message
 */
export function formatMuiErrorMessage(code, args = {}) {
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

export default {
  formatMuiErrorMessage
};