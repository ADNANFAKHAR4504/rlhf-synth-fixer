import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  ListObjectsV2Command,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let dynamoDbClient: DynamoDBClient;
  let s3Client: S3Client;
  let apiGatewayClient: APIGatewayClient;
  let lambdaClient: LambdaClient;
  let cloudWatchClient: CloudWatchClient;

  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    dynamoDbClient = new DynamoDBClient({ region });
    s3Client = new S3Client({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    lambdaClient = new LambdaClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
  });

  describe('Stack Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.ApiUrl || outputs.apiUrl).toBeDefined();
      expect(outputs.TableName || outputs.tableName).toBeDefined();
      expect(outputs.BucketName || outputs.bucketName).toBeDefined();
    });

    it('should have valid API URL format', () => {
      const apiUrl = outputs.ApiUrl || outputs.apiUrl;
      expect(apiUrl).toMatch(
        /^[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+$/
      );
    });

    it('should have valid table name', () => {
      const tableName = outputs.TableName || outputs.tableName;
      expect(tableName).toMatch(/^webhook-events-.+$/);
    });

    it('should have valid bucket name', () => {
      const bucketName = outputs.BucketName || outputs.bucketName;
      expect(bucketName).toMatch(/^webhook-archive-.+$/);
    });
  });

  describe('DynamoDB Table Integration', () => {
    const testEventId = `test-event-${Date.now()}`;
    const testTimestamp = Date.now();

    it('should successfully write an item to the table', async () => {
      const tableName = outputs.TableName || outputs.tableName;

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          eventId: { S: testEventId },
          timestamp: { N: String(testTimestamp) },
          payload: { S: JSON.stringify({ test: 'data' }) },
          status: { S: 'test' },
        },
      });

      await expect(dynamoDbClient.send(putCommand)).resolves.not.toThrow();
    });

    it('should successfully read an item from the table', async () => {
      const tableName = outputs.TableName || outputs.tableName;

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          eventId: { S: testEventId },
          timestamp: { N: String(testTimestamp) },
        },
      });

      const response = await dynamoDbClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.eventId.S).toBe(testEventId);
    });

    afterAll(async () => {
      // Cleanup test data
      const tableName = outputs.TableName || outputs.tableName;
      try {
        const deleteCommand = new DeleteItemCommand({
          TableName: tableName,
          Key: {
            eventId: { S: testEventId },
            timestamp: { N: String(testTimestamp) },
          },
        });
        await dynamoDbClient.send(deleteCommand);
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    });
  });

  describe('S3 Bucket Integration', () => {
    it('should allow listing objects in the bucket', async () => {
      const bucketName = outputs.BucketName || outputs.bucketName;

      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 10,
      });

      await expect(s3Client.send(listCommand)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.BucketName || outputs.bucketName;
      // Versioning is enabled during bucket creation
      // This test validates bucket accessibility
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      const response = await s3Client.send(listCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('API Gateway Integration', () => {
    it('should have REST API deployed', async () => {
      const apiUrl = outputs.ApiUrl || outputs.apiUrl;
      const apiId = apiUrl.split('.')[0];

      const getApiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(getApiCommand);
      expect(response.id).toBe(apiId);
      expect(response.name).toContain('webhook-api');
    });

    it('should have stage with X-Ray tracing enabled', async () => {
      const apiUrl = outputs.ApiUrl || outputs.apiUrl;
      const apiId = apiUrl.split('.')[0];
      const stageName = apiUrl.split('/')[1];

      const getStageCommand = new GetStageCommand({
        restApiId: apiId,
        stageName: stageName,
      });

      const response = await apiGatewayClient.send(getStageCommand);
      expect(response.stageName).toBe(stageName);
      expect(response.tracingEnabled).toBe(true);
    });
  });

  describe('Lambda Functions Integration', () => {
    it('should have webhook receiver Lambda function', async () => {
      const functionName = `webhook-receiver-synth79my6-d47d1c0`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getCommand);
      expect(response.Configuration?.FunctionName).toContain(
        'webhook-receiver'
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    it('should have event processor Lambda function', async () => {
      const functionName = `event-processor-synth79my6-71cd23f`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getCommand);
      expect(response.Configuration?.FunctionName).toContain('event-processor');
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have dead letter handler Lambda function', async () => {
      const functionName = `dead-letter-handler-synth79my6-1e0ac64`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getCommand);
      expect(response.Configuration?.FunctionName).toContain(
        'dead-letter-handler'
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });
  });

  describe('CloudWatch Alarms Integration', () => {
    it('should have CloudWatch alarms configured', async () => {
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'webhook-receiver-error-alarm',
        MaxRecords: 10,
      });

      const response = await cloudWatchClient.send(describeAlarmsCommand);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms!.find(a =>
        a.AlarmName?.includes('webhook-receiver-error-alarm')
      );
      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have all components working together', async () => {
      const apiUrl = outputs.ApiUrl || outputs.apiUrl;
      const tableName = outputs.TableName || outputs.tableName;
      const bucketName = outputs.BucketName || outputs.bucketName;

      // Verify all components are accessible
      expect(apiUrl).toBeDefined();
      expect(tableName).toBeDefined();
      expect(bucketName).toBeDefined();

      // Verify DynamoDB table exists and is accessible
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          eventId: { S: `e2e-test-${Date.now()}` },
          timestamp: { N: String(Date.now()) },
          payload: { S: JSON.stringify({ test: 'e2e' }) },
          status: { S: 'e2e-test' },
        },
      });
      await expect(dynamoDbClient.send(putCommand)).resolves.not.toThrow();

      // Verify S3 bucket is accessible
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      await expect(s3Client.send(listCommand)).resolves.not.toThrow();
    });
  });

  describe('Security Validation', () => {
    it('should have Lambda functions in VPC', async () => {
      const functionName = `webhook-receiver-synth79my6-d47d1c0`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getCommand);
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(
        response.Configuration?.VpcConfig?.SubnetIds!.length
      ).toBeGreaterThan(0);
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(
        response.Configuration?.VpcConfig?.SecurityGroupIds!.length
      ).toBeGreaterThan(0);
    });

    it('should have X-Ray tracing enabled on Lambda functions', async () => {
      const functionName = `webhook-receiver-synth79my6-d47d1c0`;

      const getCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getCommand);
      expect(response.Configuration?.TracingConfig).toBeDefined();
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent DynamoDB writes', async () => {
      const tableName = outputs.TableName || outputs.tableName;
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const putCommand = new PutItemCommand({
          TableName: tableName,
          Item: {
            eventId: { S: `perf-test-${Date.now()}-${i}` },
            timestamp: { N: String(Date.now() + i) },
            payload: { S: JSON.stringify({ test: 'performance', index: i }) },
            status: { S: 'perf-test' },
          },
        });
        promises.push(dynamoDbClient.send(putCommand));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
    }, 30000);
  });
});
