/**
 * This file creates a shim for the missing @mui/utils/formatMuiErrorMessage module
 * It will be used by the webpack resolver to provide the missing functionality
 */

import { formatMuiErrorMessage } from './muiUtils';

// Export the function directly as the default export
// This matches how the original module would be structured
export default formatMuiErrorMessage;