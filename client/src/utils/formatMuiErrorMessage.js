/**
 * Direct implementation of the missing formatMuiErrorMessage function
 * This file will be used as a direct replacement for the missing module
 */

/**
 * Format a MUI error message with the provided code
 * @param {number} code - The error code
 * @param {Object} [args] - Optional arguments to include in the error message
 * @returns {string} The formatted error message
 */
export default function formatMuiErrorMessage(code, args = {}) {
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