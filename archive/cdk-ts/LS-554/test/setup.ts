// Test setup file for Jest

// Detect LocalStack environment
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

// Mock environment variables for testing
process.env.ENVIRONMENT_SUFFIX = 'test';
process.env.API_ENDPOINT = isLocalStack
  ? 'http://localhost:4566/restapis/test-api-id/test/_user_request_'
  : 'https://mock-api.execute-api.us-east-1.amazonaws.com/test';
process.env.API_KEY = 'test-api-key';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_testpool';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.S3_BUCKET_NAME = 'test-serverless-data-bucket';
process.env.LAMBDA_FUNCTION_NAME = 'test-serverless-function';
process.env.BUCKET_NAME = 'test-serverless-data-bucket';
process.env.ENVIRONMENT = 'test';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// LocalStack endpoint configuration
if (isLocalStack) {
  process.env.LOCALSTACK_HOSTNAME = 'localhost:4566';
}

// Global test utilities
(global as Record<string, unknown>).testConfig = {
  apiEndpoint: process.env.API_ENDPOINT,
  apiKey: process.env.API_KEY,
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  cognitoClientId: process.env.COGNITO_CLIENT_ID,
  s3BucketName: process.env.S3_BUCKET_NAME,
  lambdaFunctionName: process.env.LAMBDA_FUNCTION_NAME,
};

// Mock console methods to reduce noise in tests
(global as Record<string, unknown>).console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock fs for file operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn().mockImplementation((path: string) => {
    if (path.includes('cfn-outputs')) {
      return JSON.stringify({
        ServerlessStackServerlessApiEndpoint3B0EFFAB:
          'https://mock-api.execute-api.us-east-1.amazonaws.com/test',
        ServerlessStackServerlessBucket42EDACEC: 'test-serverless-data-bucket',
        ServerlessStackServerlessFunction8E4B5BF6: 'test-serverless-function',
        ServerlessStackApiUserPool03DDFC07: 'us-east-1_testpool',
        ServerlessStackApiUserPoolClient78FCC2AF: 'test-client-id',
      });
    }
    return '{}';
  }),
  existsSync: jest.fn().mockReturnValue(true),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  default: {
    get: jest
      .fn()
      .mockImplementation((_url: string, config?: Record<string, unknown>) => {
        const headers = (config?.headers as Record<string, string>) || {};

        // Mock different responses based on the request
        if (!headers['X-API-Key']) {
          const error = new Error('Forbidden');
          (error as any).response = { status: 403, data: 'Forbidden' };
          return Promise.reject(error);
        }

        if (!headers['Authorization']) {
          const error = new Error('Unauthorized');
          (error as any).response = { status: 401, data: 'Unauthorized' };
          return Promise.reject(error);
        }

        if (_url.includes('/nonexistent')) {
          const error = new Error('Not Found');
          (error as any).response = { status: 404, data: 'Not Found' };
          return Promise.reject(error);
        }

        // Rate limiting simulation (deterministic for testing)
        if (_url.includes('/rate-limit-test')) {
          const error = new Error('Too Many Requests');
          (error as any).response = { status: 429, data: 'Too Many Requests' };
          return Promise.reject(error);
        }

        return Promise.resolve({
          status: 200,
          data: {
            message: 'Success',
            timestamp: new Date().toISOString(),
          },
          headers: {
            'content-type': 'application/json',
          },
        });
      }),
    post: jest
      .fn()
      .mockImplementation(
        (_url: string, data: unknown, config?: Record<string, unknown>) => {
          const headers = (config?.headers as Record<string, string>) || {};

          if (!headers['X-API-Key']) {
            const error = new Error('Forbidden');
            (error as any).response = { status: 403, data: 'Forbidden' };
            return Promise.reject(error);
          }

          if (!headers['Authorization']) {
            const error = new Error('Unauthorized');
            (error as any).response = { status: 401, data: 'Unauthorized' };
            return Promise.reject(error);
          }

          // Check for malformed JSON
          if (data === 'invalid-json') {
            const error = new Error('Bad Request');
            (error as any).response = { status: 400, data: 'Bad Request' };
            return Promise.reject(error);
          }

          return Promise.resolve({
            status: 200,
            data: {
              message: 'Success',
              timestamp: new Date().toISOString(),
            },
            headers: {
              'content-type': 'application/json',
            },
          });
        }
      ),
    options: jest
      .fn()
      .mockImplementation((_url: string, _config?: Record<string, unknown>) => {
        return Promise.resolve({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,POST,OPTIONS',
            'access-control-allow-headers':
              'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          },
        });
      }),
  },
}));

// Test timeout configuration
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test data
(global as Record<string, unknown>).testData = {
  message: 'Integration test data',
  timestamp: new Date().toISOString(),
  testId: `test-${Date.now()}`,
};
