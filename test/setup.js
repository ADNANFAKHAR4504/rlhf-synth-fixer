// Jest setup file for CDKTF tests
// This file is required by the test:unit-cdktf and test:integration-cdktf scripts
// but not actually used for CDK tests

// Set up any global test configuration if needed
global.testTimeout = 30000;

// Mock any global objects that might be needed
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Export empty to satisfy module requirements
module.exports = {}; 