import { setupTestEnvironment } from './aws-test-config';

// Setup test environment
setupTestEnvironment();

// Configure AWS SDK for testing
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Only show console output for errors in tests
console.log = (...args: unknown[]) => {
  if (process.env.TEST_VERBOSE === 'true') {
    originalConsoleLog(...args);
  }
};

console.warn = (...args: unknown[]) => {
  if (process.env.TEST_VERBOSE === 'true') {
    originalConsoleWarn(...args);
  }
};

console.error = (...args: unknown[]) => {
  originalConsoleError(...args);
};

// Global test configuration
beforeAll(() => {
  // Set up any global test configuration
  jest.setTimeout(30000); // 30 seconds timeout for all tests
});

afterAll(() => {
  // Clean up any global test resources
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper function to create mock CloudFormation outputs
  createMockOutputs: () => ({
    VpcId: 'vpc-test123',
    DatabaseEndpoint: 'test-db.region.rds.amazonaws.com',
    WafAclArn:
      'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test/12345678-1234-1234-1234-123456789012',
  }),

  // Helper function to validate resource properties
  validateResourceProperties: (
    resource: { Properties: Record<string, unknown> },
    expectedProperties: Record<string, unknown>
  ) => {
    Object.entries(expectedProperties).forEach(([key, value]) => {
      expect(resource.Properties[key]).toEqual(value);
    });
  },

  // Helper function to check if resource has required tags
  hasRequiredTags: (
    resource: { Properties?: { Tags?: Array<{ Key: string; Value: string }> } },
    environment: string
  ) => {
    const tags = resource.Properties?.Tags || [];
    const hasEnvironmentTag = tags.some(
      tag => tag.Key === 'Environment' && tag.Value === environment
    );
    const hasNameTag = tags.some(tag => tag.Key === 'Name');
    return hasEnvironmentTag && hasNameTag;
  },
};

// Type definitions for global test utilities
declare global {
  var testUtils: {
    createMockOutputs: () => {
      VpcId: string;
      DatabaseEndpoint: string;
      WafAclArn: string;
    };
    validateResourceProperties: (
      resource: { Properties: Record<string, unknown> },
      expectedProperties: Record<string, unknown>
    ) => void;
    hasRequiredTags: (
      resource: {
        Properties?: { Tags?: Array<{ Key: string; Value: string }> };
      },
      environment: string
    ) => boolean;
  };
}
