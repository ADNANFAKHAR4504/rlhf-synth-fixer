// Test setup for CDKTF tests
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = process.env.AWS_REGION || 'ca-central-1';
process.env.ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';

// Suppress console output during tests unless verbose is set
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

