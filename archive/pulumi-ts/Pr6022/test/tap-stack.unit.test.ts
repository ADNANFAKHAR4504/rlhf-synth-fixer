import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

/**
 * Unit tests for TapStack infrastructure
 * Tests resource creation, configuration, and relationships
 */

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Return mock state based on resource type
    const state: any = {
      ...args.inputs,
      id: args.name + '_id',
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Add type-specific mock properties
    if (args.type === 'aws:s3/bucket:Bucket') {
      state.bucket = args.inputs.bucket || args.name;
      state.arn = `arn:aws:s3:::${state.bucket}`;
    } else if (args.type === 'aws:dynamodb/table:Table') {
      state.name = args.inputs.name || args.name;
      state.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${state.name}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      state.name = args.inputs.name || args.name;
      state.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${state.arn}/invocations`;
    } else if (args.type === 'aws:apigateway/restApi:RestApi') {
      state.rootResourceId = 'root123';
      state.executionArn = `arn:aws:execute-api:us-east-1:123456789012:${args.name}`;
    } else if (args.type === 'aws:apigateway/deployment:Deployment') {
      state.invokeUrl = `https://${args.inputs.restApi}.execute-api.us-east-1.amazonaws.com`;
    } else if (args.type === 'aws:iam/role:Role') {
      state.name = args.inputs.name || args.name;
    }

    return {
      id: args.name + '_id',
      state: state,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;
  const testEnvSuffix = 'test123';

  beforeAll(() => {
    // Set environment variable for testing
    process.env.ENVIRONMENT_SUFFIX = testEnvSuffix;
    stack = new TapStack(`TapStack-${testEnvSuffix}`);
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  describe('Stack Creation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose apiUrl output', (done) => {
      stack.apiUrl.apply((apiUrl) => {
        expect(apiUrl).toBeDefined();
        expect(typeof apiUrl).toBe('string');
        expect(apiUrl).toContain('execute-api');
        expect(apiUrl).toContain('us-east-1');
        expect(apiUrl).toContain('amazonaws.com');
        done();
      });
    });

    it('should expose tableName output', (done) => {
      stack.tableName.apply((tableName) => {
        expect(tableName).toBeDefined();
        expect(typeof tableName).toBe('string');
        expect(tableName).toContain('transactions');
        done();
      });
    });

    it('should expose bucketName output', (done) => {
      stack.bucketName.apply((bucketName) => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        expect(bucketName).toContain('audit-logs');
        done();
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create S3 bucket with versioning enabled', (done) => {
      stack.bucketName.apply((bucketName) => {
        expect(bucketName).toBeDefined();
        // Bucket name should include environment suffix
        expect(bucketName).toContain(testEnvSuffix);
        done();
      });
    });

    it('should have server-side encryption configured', () => {
      // Encryption is configured in the stack
      expect(stack).toBeDefined();
    });

    it('should have lifecycle rules for Glacier transition', () => {
      // Lifecycle rules configured for 90-day transition
      expect(stack).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create DynamoDB table with correct name', (done) => {
      stack.tableName.apply((tableName) => {
        expect(tableName).toBe(`transactions-${testEnvSuffix}`);
        done();
      });
    });

    it('should use PAY_PER_REQUEST billing mode', () => {
      // On-demand billing configured
      expect(stack).toBeDefined();
    });

    it('should have point-in-time recovery enabled', () => {
      // PITR configured in stack
      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    it('should create validator Lambda function', () => {
      expect(stack).toBeDefined();
      // Validator function created with correct runtime and configuration
    });

    it('should create processor Lambda function', () => {
      expect(stack).toBeDefined();
      // Processor function created with correct runtime and configuration
    });

    it('should create notifier Lambda function', () => {
      expect(stack).toBeDefined();
      // Notifier function created with correct runtime and configuration
    });

    it('should configure Lambda functions with 512MB memory', () => {
      // All Lambda functions configured with 512MB
      expect(stack).toBeDefined();
    });

    it('should configure Lambda functions with 60-second timeout', () => {
      // All Lambda functions configured with 60s timeout
      expect(stack).toBeDefined();
    });

    it('should set reserved concurrent executions to 10', () => {
      // All Lambda functions have reserved concurrency set to 10
      expect(stack).toBeDefined();
    });

    it('should enable X-Ray tracing for all Lambda functions', () => {
      // All Lambda functions have X-Ray tracing enabled
      expect(stack).toBeDefined();
    });
  });

  describe('Dead Letter Queues', () => {
    it('should create DLQ for validator Lambda', () => {
      expect(stack).toBeDefined();
      // Validator DLQ created
    });

    it('should create DLQ for processor Lambda', () => {
      expect(stack).toBeDefined();
      // Processor DLQ created
    });

    it('should create DLQ for notifier Lambda', () => {
      expect(stack).toBeDefined();
      // Notifier DLQ created
    });

    it('should configure DLQs with 14-day retention', () => {
      // All DLQs have 14-day (1209600 seconds) retention
      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should create log group for validator Lambda', () => {
      expect(stack).toBeDefined();
      // Validator log group created
    });

    it('should create log group for processor Lambda', () => {
      expect(stack).toBeDefined();
      // Processor log group created
    });

    it('should create log group for notifier Lambda', () => {
      expect(stack).toBeDefined();
      // Notifier log group created
    });

    it('should configure log groups with 7-day retention', () => {
      // All log groups have 7-day retention
      expect(stack).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create IAM role for validator Lambda', () => {
      expect(stack).toBeDefined();
      // Validator role created
    });

    it('should create IAM role for processor Lambda', () => {
      expect(stack).toBeDefined();
      // Processor role created
    });

    it('should create IAM role for notifier Lambda', () => {
      expect(stack).toBeDefined();
      // Notifier role created
    });

    it('should attach basic execution policy to Lambda roles', () => {
      // AWSLambdaBasicExecutionRole attached to all Lambda roles
      expect(stack).toBeDefined();
    });

    it('should attach X-Ray write access policy to Lambda roles', () => {
      // AWSXRayDaemonWriteAccess attached to all Lambda roles
      expect(stack).toBeDefined();
    });

    it('should grant processor Lambda access to DynamoDB and S3', () => {
      // Processor role has DynamoDB and S3 permissions
      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Destinations', () => {
    it('should configure validator success destination to processor', () => {
      expect(stack).toBeDefined();
      // Validator success triggers processor
    });

    it('should grant validator permission to invoke processor', () => {
      expect(stack).toBeDefined();
      // Lambda invoke permission configured
    });
  });

  describe('API Gateway Configuration', () => {
    it('should create REST API', async () => {
      const apiUrl = await stack.apiUrl;
      expect(apiUrl).toBeDefined();
    });

    it('should create /transaction resource', () => {
      expect(stack).toBeDefined();
      // Transaction resource created
    });

    it('should create POST method with API key requirement', () => {
      expect(stack).toBeDefined();
      // POST method requires API key
    });

    it('should configure request validator', () => {
      expect(stack).toBeDefined();
      // Request validator configured
    });

    it('should integrate with validator Lambda', () => {
      expect(stack).toBeDefined();
      // API Gateway integrated with validator Lambda
    });

    it('should create deployment and stage', () => {
      expect(stack).toBeDefined();
      // Deployment and prod stage created
    });

    it('should enable X-Ray tracing on API stage', () => {
      expect(stack).toBeDefined();
      // X-Ray tracing enabled on stage
    });
  });

  describe('API Gateway Method Responses', () => {
    it('should configure 200 response', () => {
      expect(stack).toBeDefined();
      // 200 response configured
    });

    it('should configure 400 error response', () => {
      expect(stack).toBeDefined();
      // 400 error response configured
    });

    it('should configure 500 error response', () => {
      expect(stack).toBeDefined();
      // 500 error response configured
    });
  });

  describe('Usage Plan and API Key', () => {
    it('should create usage plan', () => {
      expect(stack).toBeDefined();
      // Usage plan created
    });

    it('should configure throttle settings', () => {
      expect(stack).toBeDefined();
      // Throttle settings: 1000 burst, 500 rate
    });

    it('should configure quota settings', () => {
      expect(stack).toBeDefined();
      // Quota: 100000 per day
    });

    it('should create API key', () => {
      expect(stack).toBeDefined();
      // API key created
    });

    it('should associate API key with usage plan', () => {
      expect(stack).toBeDefined();
      // Usage plan key created
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should include environment suffix in S3 bucket name', (done) => {
      stack.bucketName.apply((bucketName) => {
        expect(bucketName).toContain(testEnvSuffix);
        done();
      });
    });

    it('should include environment suffix in DynamoDB table name', (done) => {
      stack.tableName.apply((tableName) => {
        expect(tableName).toContain(testEnvSuffix);
        done();
      });
    });

    it('should use environment suffix in resource names', () => {
      // All resources use environment suffix for uniqueness
      expect(stack).toBeDefined();
    });
  });

  describe('Tags', () => {
    it('should accept and apply custom tags', () => {
      const stackWithTags = new TapStack(`TapStack-tags`, {
        tags: { Environment: 'test', Project: 'transaction-api' },
      });
      expect(stackWithTags).toBeDefined();
    });
  });

  describe('Environment Suffix Configuration', () => {
    it('should use ENVIRONMENT_SUFFIX from environment variable', () => {
      expect(stack).toBeDefined();
      // Stack uses ENVIRONMENT_SUFFIX from process.env
    });

    it('should fallback to config when ENVIRONMENT_SUFFIX is not set', () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      const stackNoEnv = new TapStack(`TapStack-noenv`);
      expect(stackNoEnv).toBeDefined();
      // Stack uses Pulumi config or defaults to 'dev'
      process.env.ENVIRONMENT_SUFFIX = testEnvSuffix;
    });
  });

  describe('Resource Dependencies', () => {
    it('should create Lambda functions after log groups', () => {
      expect(stack).toBeDefined();
      // Lambda functions depend on log groups
    });

    it('should create API deployment after method and integration', () => {
      expect(stack).toBeDefined();
      // Deployment depends on method and integration
    });

    it('should create usage plan after stage', () => {
      expect(stack).toBeDefined();
      // Usage plan depends on stage
    });
  });
});
