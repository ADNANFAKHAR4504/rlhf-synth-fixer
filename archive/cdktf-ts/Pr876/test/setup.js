// CDKTF Test Setup File
// This file sets up the testing environment for CDKTF projects

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set default test environment variables
process.env.ENVIRONMENT = 'test';
process.env.ENVIRONMENT_SUFFIX = 'test';

// Add any global test configuration here