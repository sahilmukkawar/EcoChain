// This file is executed before running tests
// It can be used to set up the test environment

// Mock the missing MUI module
jest.mock('@mui/utils/formatMuiErrorMessage', () => {
  return function formatMuiErrorMessage(code) {
    const url = `https://mui.com/production-error/?code=${code}`;
    return `MUI: Error code ${code}\nFor more info, see ${url}`;
  };
});