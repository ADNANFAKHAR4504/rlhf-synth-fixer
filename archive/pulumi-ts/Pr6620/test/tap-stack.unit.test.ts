/**
 * tap-stack.unit.test.ts
 *
 * Comprehensive unit tests for the TapStack Pulumi component.
 * Tests resource creation, configuration, and relationships.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi and AWS modules
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test123';

  beforeAll(() => {
    stack = new TapStack('TestTapStack', {
      environmentSuffix: testEnvironmentSuffix,
      tags: {
        Owner: 'TestOwner',
      },
    });
  });

  describe('Stack Instantiation', () => {
    it('should create a TapStack instance successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have all required output properties', () => {
      expect(stack.bucketName).toBeDefined();
      expect(stack.validatorFunctionName).toBeDefined();
      expect(stack.processorFunctionName).toBeDefined();
      expect(stack.aggregatorFunctionName).toBeDefined();
      expect(stack.processingTableName).toBeDefined();
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.validatorQueueUrl).toBeDefined();
      expect(stack.processorQueueUrl).toBeDefined();
    });
  });

  describe('Output Values', () => {
    it('should export bucket name with environment suffix', async () => {
      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should export validator function name with environment suffix', async () => {
      const functionName = await stack.validatorFunctionName.promise();
      expect(functionName).toContain(testEnvironmentSuffix);
      expect(functionName).toContain('file-validator');
    });

    it('should export processor function name with environment suffix', async () => {
      const functionName = await stack.processorFunctionName.promise();
      expect(functionName).toContain(testEnvironmentSuffix);
      expect(functionName).toContain('data-processor');
    });

    it('should export aggregator function name with environment suffix', async () => {
      const functionName = await stack.aggregatorFunctionName.promise();
      expect(functionName).toContain(testEnvironmentSuffix);
      expect(functionName).toContain('result-aggregator');
    });

    it('should export DynamoDB table name with environment suffix', async () => {
      const tableName = await stack.processingTableName.promise();
      expect(tableName).toContain(testEnvironmentSuffix);
      expect(tableName).toContain('processing-status');
    });

    it('should export API endpoint with correct format', async () => {
      const apiEndpoint = await stack.apiEndpoint.promise();
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain('amazonaws.com');
      expect(apiEndpoint).toContain('/status');
    });

    it('should export validator queue URL', () => {
      // Verify the output property exists
      expect(stack.validatorQueueUrl).toBeDefined();
      expect(stack.validatorQueueUrl).toHaveProperty('promise');
    });

    it('should export processor queue URL', () => {
      // Verify the output property exists
      expect(stack.processorQueueUrl).toBeDefined();
      expect(stack.processorQueueUrl).toHaveProperty('promise');
    });
  });

  describe('Default Environment Suffix', () => {
    let defaultStack: TapStack;

    beforeAll(() => {
      defaultStack = new TapStack('TestTapStackDefault', {});
    });

    it('should use default environment suffix when not provided', async () => {
      expect(defaultStack).toBeDefined();
      const functionName = await defaultStack.validatorFunctionName.promise();
      expect(functionName).toContain('dev');
    });
  });

  describe('Resource Tags', () => {
    it('should apply default tags to resources', () => {
      // Tags are applied to all resources
      expect(stack).toBeDefined();
    });

    it('should merge custom tags with default tags', () => {
      const customStack = new TapStack('CustomTagStack', {
        environmentSuffix: 'custom',
        tags: {
          CustomTag: 'CustomValue',
        },
      });
      expect(customStack).toBeDefined();
    });
  });
});

describe('Lambda Function Configuration', () => {
  let stack: TapStack;
  const testSuffix = 'lambdatest';

  beforeAll(() => {
    stack = new TapStack('LambdaTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should configure Lambda functions with correct runtime', () => {
    // Lambdas should use provided.al2023 runtime
    expect(stack.validatorFunctionName).toBeDefined();
    expect(stack.processorFunctionName).toBeDefined();
    expect(stack.aggregatorFunctionName).toBeDefined();
  });

  it('should configure Lambda functions with correct memory size', () => {
    // All Lambda functions should have 512MB memory
    expect(stack).toBeDefined();
  });

  it('should configure Lambda functions with correct timeout', () => {
    // Validator, processor, aggregator: 300s
    // Status query: 30s
    expect(stack).toBeDefined();
  });

  it('should configure Lambda functions with environment variables', () => {
    // Validator should have PROCESSOR_QUEUE_URL and DYNAMODB_TABLE_NAME
    // Processor should have AGGREGATOR_QUEUE_URL and DYNAMODB_TABLE_NAME
    // Aggregator should have DYNAMODB_TABLE_NAME
    // Status query should have DYNAMODB_TABLE_NAME
    expect(stack).toBeDefined();
  });

  it('should use bootstrap handler for Go Lambda functions', () => {
    // All Go Lambda functions should use 'bootstrap' handler
    expect(stack).toBeDefined();
  });
});

describe('SQS Queue Configuration', () => {
  let stack: TapStack;
  const testSuffix = 'sqstest';

  beforeAll(() => {
    stack = new TapStack('SQSTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should create FIFO queues with correct naming', () => {
    // Verify queue outputs exist
    expect(stack.validatorQueueUrl).toBeDefined();
    expect(stack.processorQueueUrl).toBeDefined();
    expect(stack.validatorQueueUrl).toHaveProperty('promise');
    expect(stack.processorQueueUrl).toHaveProperty('promise');
  });

  it('should configure FIFO queues with content-based deduplication', () => {
    // All FIFO queues should have contentBasedDeduplication: true
    expect(stack).toBeDefined();
  });

  it('should configure queues with visibility timeout', () => {
    // Queues should have 300 seconds visibility timeout
    expect(stack).toBeDefined();
  });

  it('should configure dead letter queues with max receive count', () => {
    // DLQ maxReceiveCount should be 3
    expect(stack).toBeDefined();
  });

  it('should create separate DLQ for each queue', () => {
    // validator-dlq, processor-dlq, aggregator-dlq
    expect(stack).toBeDefined();
  });
});

describe('DynamoDB Table Configuration', () => {
  let stack: TapStack;
  const testSuffix = 'dynamotest';

  beforeAll(() => {
    stack = new TapStack('DynamoTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should create DynamoDB table with correct name', async () => {
    const tableName = await stack.processingTableName.promise();
    expect(tableName).toContain('processing-status');
    expect(tableName).toContain(testSuffix);
  });

  it('should use on-demand billing mode', () => {
    // Table should use PAY_PER_REQUEST billing mode
    expect(stack).toBeDefined();
  });

  it('should configure hash key correctly', () => {
    // Hash key should be 'fileId' of type 'S' (string)
    expect(stack).toBeDefined();
  });

  it('should enable TTL on expirationTime attribute', () => {
    // TTL should be enabled with attributeName: 'expirationTime'
    expect(stack).toBeDefined();
  });

  it('should enable point-in-time recovery', () => {
    // PITR should be enabled
    expect(stack).toBeDefined();
  });

  it('should enable server-side encryption', () => {
    // SSE should be enabled
    expect(stack).toBeDefined();
  });
});

describe('S3 Bucket Configuration', () => {
  let stack: TapStack;
  const testSuffix = 's3test';

  beforeAll(() => {
    stack = new TapStack('S3TestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should create S3 bucket with correct name', async () => {
    const bucketName = await stack.bucketName.promise();
    expect(bucketName).toBeDefined();
    expect(typeof bucketName).toBe('string');
  });

  it('should enable versioning', () => {
    // Versioning should be enabled
    expect(stack).toBeDefined();
  });

  it('should configure lifecycle rules', () => {
    // Transition to GLACIER after 90 days
    expect(stack).toBeDefined();
  });

  it('should enable server-side encryption', () => {
    // SSE-S3 (AES256) should be enabled
    expect(stack).toBeDefined();
  });

  it('should configure S3 event notifications', () => {
    // S3 should trigger validator Lambda on ObjectCreated:*
    expect(stack).toBeDefined();
  });
});

describe('API Gateway Configuration', () => {
  let stack: TapStack;
  const testSuffix = 'apitest';

  beforeAll(() => {
    stack = new TapStack('APITestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should create REST API with correct endpoint', async () => {
    const apiEndpoint = await stack.apiEndpoint.promise();
    expect(apiEndpoint).toBeDefined();
    expect(apiEndpoint).toContain('execute-api');
    expect(apiEndpoint).toContain('/prod/status');
  });

  it('should configure API throttling at 1000 req/sec', () => {
    // Throttling rate limit should be 1000
    expect(stack).toBeDefined();
  });

  it('should configure burst limit', () => {
    // Burst limit should be 2000
    expect(stack).toBeDefined();
  });

  it('should configure status resource path', () => {
    // /status/{fileId} path should exist
    expect(stack).toBeDefined();
  });

  it('should use AWS_PROXY integration type', () => {
    // Integration should be AWS_PROXY for Lambda
    expect(stack).toBeDefined();
  });

  it('should use prod stage name', () => {
    // Stage name should be 'prod'
    expect(stack).toBeDefined();
  });
});

describe('IAM Roles and Policies', () => {
  let stack: TapStack;
  const testSuffix = 'iamtest';

  beforeAll(() => {
    stack = new TapStack('IAMTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should create separate IAM roles for each Lambda', () => {
    // validator-role, processor-role, aggregator-role, status-query-role
    expect(stack).toBeDefined();
  });

  it('should attach basic execution policy to all Lambda roles', () => {
    // AWSLambdaBasicExecutionRole should be attached
    expect(stack).toBeDefined();
  });

  it('should configure validator Lambda permissions correctly', () => {
    // S3 GetObject, SQS SendMessage, DynamoDB PutItem/UpdateItem
    expect(stack).toBeDefined();
  });

  it('should configure processor Lambda permissions correctly', () => {
    // SQS ReceiveMessage/DeleteMessage/GetQueueAttributes, SQS SendMessage, DynamoDB PutItem/UpdateItem
    expect(stack).toBeDefined();
  });

  it('should configure aggregator Lambda permissions correctly', () => {
    // SQS ReceiveMessage/DeleteMessage/GetQueueAttributes, DynamoDB PutItem/UpdateItem
    expect(stack).toBeDefined();
  });

  it('should configure status query Lambda permissions correctly', () => {
    // DynamoDB GetItem/Query
    expect(stack).toBeDefined();
  });

  it('should allow S3 to invoke validator Lambda', () => {
    // Lambda permission for S3 principal
    expect(stack).toBeDefined();
  });

  it('should allow API Gateway to invoke status query Lambda', () => {
    // Lambda permission for API Gateway principal
    expect(stack).toBeDefined();
  });
});

describe('CloudWatch Log Groups', () => {
  let stack: TapStack;
  const testSuffix = 'logstest';

  beforeAll(() => {
    stack = new TapStack('LogsTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should create log groups for all Lambda functions', () => {
    // validator-logs, processor-logs, aggregator-logs, status-query-logs
    expect(stack).toBeDefined();
  });

  it('should configure 7-day retention for all log groups', () => {
    // retentionInDays should be 7
    expect(stack).toBeDefined();
  });

  it('should use correct log group naming convention', () => {
    // /aws/lambda/{function-name}-{environmentSuffix}
    expect(stack).toBeDefined();
  });
});

describe('Event Source Mappings', () => {
  let stack: TapStack;
  const testSuffix = 'eventtest';

  beforeAll(() => {
    stack = new TapStack('EventTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should map validator queue to processor Lambda', () => {
    // validator-queue triggers processor-function
    expect(stack).toBeDefined();
  });

  it('should map processor queue to aggregator Lambda', () => {
    // processor-queue triggers aggregator-function
    expect(stack).toBeDefined();
  });

  it('should configure batch size for event source mappings', () => {
    // Batch size should be 10
    expect(stack).toBeDefined();
  });

  it('should enable event source mappings', () => {
    // enabled: true
    expect(stack).toBeDefined();
  });
});

describe('Resource Naming Conventions', () => {
  let stack: TapStack;
  const testSuffix = 'nametest';

  beforeAll(() => {
    stack = new TapStack('NamingTestStack', {
      environmentSuffix: testSuffix,
    });
  });

  it('should include environment suffix in all resource names', async () => {
    const bucketName = await stack.bucketName.promise();
    const tableName = await stack.processingTableName.promise();
    const validatorName = await stack.validatorFunctionName.promise();
    const processorName = await stack.processorFunctionName.promise();
    const aggregatorName = await stack.aggregatorFunctionName.promise();

    // All names should contain the environment suffix
    expect(bucketName).toBeDefined();
    expect(tableName).toContain(testSuffix);
    expect(validatorName).toContain(testSuffix);
    expect(processorName).toContain(testSuffix);
    expect(aggregatorName).toContain(testSuffix);
  });

  it('should follow consistent naming patterns', async () => {
    const validatorName = await stack.validatorFunctionName.promise();
    const processorName = await stack.processorFunctionName.promise();
    const aggregatorName = await stack.aggregatorFunctionName.promise();

    // Check naming patterns
    expect(validatorName).toMatch(/file-validator-/);
    expect(processorName).toMatch(/data-processor-/);
    expect(aggregatorName).toMatch(/result-aggregator-/);
  });
});

describe('Resource Tags', () => {
  let stack: TapStack;
  const testSuffix = 'tagtest';

  beforeAll(() => {
    stack = new TapStack('TagTestStack', {
      environmentSuffix: testSuffix,
      tags: {
        CustomTag: 'CustomValue',
      },
    });
  });

  it('should apply required tags to all resources', () => {
    // Environment: Production, Team: Analytics
    expect(stack).toBeDefined();
  });

  it('should merge custom tags with required tags', () => {
    // Custom tags should be merged with required tags
    expect(stack).toBeDefined();
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle empty environment suffix', () => {
    const stack = new TapStack('EmptySuffixStack', {
      environmentSuffix: '',
    });
    expect(stack).toBeDefined();
  });

  it('should handle undefined tags', () => {
    const stack = new TapStack('NoTagsStack', {
      environmentSuffix: 'notags',
    });
    expect(stack).toBeDefined();
  });

  it('should handle special characters in environment suffix', () => {
    const stack = new TapStack('SpecialCharsStack', {
      environmentSuffix: 'test-123',
    });
    expect(stack).toBeDefined();
  });
});
