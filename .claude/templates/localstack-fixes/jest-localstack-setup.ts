/**
 * Jest Setup for LocalStack Integration Tests
 * Template: jest-localstack-setup
 * 
 * Add to jest.config.js:
 *   setupFilesAfterEnv: ['<rootDir>/test/jest-localstack-setup.ts']
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALSTACK DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const isLocalStack = (): boolean => {
  return !!(
    process.env.LOCALSTACK_HOSTNAME ||
    process.env.AWS_ENDPOINT_URL ||
    process.env.CDK_LOCAL ||
    process.env.LOCALSTACK
  );
};

const getLocalStackEndpoint = (): string => {
  return process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL SETUP
// ═══════════════════════════════════════════════════════════════════════════════

beforeAll(async () => {
  // Set LocalStack environment if in local mode
  if (isLocalStack()) {
    process.env.AWS_ENDPOINT_URL = getLocalStackEndpoint();
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.AWS_DEFAULT_REGION = 'us-east-1';
    process.env.CDK_DEFAULT_ACCOUNT = '000000000000';
    process.env.CDK_DEFAULT_REGION = 'us-east-1';
    
    // Wait for LocalStack to be ready
    console.log('Waiting for LocalStack to be ready...');
    
    const maxRetries = 30;
    const retryDelay = 1000;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${getLocalStackEndpoint()}/_localstack/health`);
        if (response.ok) {
          console.log('LocalStack is ready!');
          break;
        }
      } catch {
        // LocalStack not ready yet
      }
      
      if (i === maxRetries - 1) {
        console.warn('Warning: LocalStack health check timed out');
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}, 60000); // 60 second timeout for setup

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL TEARDOWN
// ═══════════════════════════════════════════════════════════════════════════════

afterAll(async () => {
  // Cleanup any global resources if needed
  console.log('Test suite completed');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST HELPERS AVAILABLE IN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

declare global {
  // eslint-disable-next-line no-var
  var localStackHelpers: {
    isLocalStack: () => boolean;
    getEndpoint: () => string;
    getS3Config: () => object;
    getDynamoDBConfig: () => object;
    retry: <T>(fn: () => Promise<T>, retries?: number) => Promise<T>;
  };
}

globalThis.localStackHelpers = {
  isLocalStack,
  getEndpoint: getLocalStackEndpoint,
  
  getS3Config: () => ({
    endpoint: isLocalStack() ? getLocalStackEndpoint() : undefined,
    region: 'us-east-1',
    credentials: isLocalStack() ? {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    } : undefined,
    forcePathStyle: isLocalStack(),
  }),
  
  getDynamoDBConfig: () => ({
    endpoint: isLocalStack() ? getLocalStackEndpoint() : undefined,
    region: 'us-east-1',
    credentials: isLocalStack() ? {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    } : undefined,
  }),
  
  retry: async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw lastError;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INCREASE DEFAULT TIMEOUT FOR LOCALSTACK TESTS
// ═══════════════════════════════════════════════════════════════════════════════

if (isLocalStack()) {
  jest.setTimeout(30000); // 30 seconds for LocalStack tests
}

export {};

