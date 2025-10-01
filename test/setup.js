// Jest setup file for unit tests
module.exports = {
  // Set test environment variables
  testEnvironment: 'node',

  // Setup function
  setup: () => {
    process.env.ENVIRONMENT_SUFFIX = 'test123';
    process.env.AWS_REGION = 'us-east-2';
  }
};