// Test setup file for Jest

// Set up environment variables for testing
process.env.ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Global test timeout
jest.setTimeout(30000);

// Suppress console output during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsoleError; // Keep error logging
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
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
