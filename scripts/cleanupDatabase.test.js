// scripts/cleanupDatabase.test.js
// Simple test to verify the cleanupDatabase script can be imported without errors

describe('cleanupDatabase', () => {
  it('should be able to import the cleanupDatabase module', () => {
    expect(() => {
      require('./cleanupDatabase');
    }).not.toThrow();
  });
});
