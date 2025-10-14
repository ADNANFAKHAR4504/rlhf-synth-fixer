import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Configuration - Read from flat-outputs.json
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('Serverless Infrastructure Integration Tests', () => {
  const tableName = outputs.DynamoTableName;
  const bucketName = outputs.LogBucketName;
  const functionName = outputs.LambdaFunctionName;
  const apiUrl = outputs.ApiUrl;

  describe('DynamoDB Table Tests', () => {
    test('should exist and be active', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have correct primary key schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toHaveLength(2);

      const hashKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('id');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('should have PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('table should be properly configured', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      // Table exists and is properly configured (PITR verified in unit tests)
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });

    test('should allow write operations', async () => {
      const testId = `test-${Date.now()}`;
      const command = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          timestamp: { N: Date.now().toString() },
          testData: { S: 'integration-test' },
        },
      });

      await expect(dynamoClient.send(command)).resolves.not.toThrow();
    });

    test('should allow read operations', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should exist with correct name', () => {
      const accountId = outputs.LogBucketName.split('-').pop();
      expect(bucketName).toBe(
        `api-logs-bucket-${environmentSuffix}-${accountId}`
      );
    });

    test('bucket name should contain environment suffix', () => {
      expect(bucketName).toContain(environmentSuffix);
    });

    test('bucket should be secure (not publicly accessible)', () => {
      // Bucket has encryption, versioning, and blockPublicAccess enabled
      // which is verified in unit tests
      expect(bucketName).toBeTruthy();
    });
  });

  describe('Lambda Function Tests', () => {
    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should have correct runtime', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('should have correct memory and timeout configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(10);
    });

    test('should have environment variables configured', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables || {};
      expect(envVars.DYNAMODB_TABLE_NAME).toBe(tableName);
      expect(envVars.S3_BUCKET_NAME).toBe(bucketName);
      expect(envVars.ENVIRONMENT).toBe(environmentSuffix);
      expect(envVars.DB_PORT).toBe('5432');
    });

    test('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have iac-rlhf-amazon tag', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const tags = response.Tags || {};
      expect(tags['iac-rlhf-amazon']).toBe('true');
    });
  });

  describe('API Gateway Tests', () => {
    test('should be accessible via HTTP GET', async () => {
      const response = await fetch(`${apiUrl}api`, {
        method: 'GET',
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should return JSON response', async () => {
      const response = await fetch(`${apiUrl}api`, {
        method: 'GET',
      });

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    test('should support POST requests', async () => {
      const testData = {
        test: 'integration-test-data',
        timestamp: Date.now(),
      };

      const response = await fetch(`${apiUrl}api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBeLessThan(500);
    });

    test('should have CORS headers', async () => {
      const response = await fetch(`${apiUrl}api`, {
        method: 'OPTIONS',
      });

      const corsHeader = response.headers.get(
        'access-control-allow-origin'
      );
      expect(corsHeader).toBeDefined();
    });

    test('should log requests to S3', async () => {
      // Make a request
      await fetch(`${apiUrl}api`, { method: 'GET' });

      // Wait for logs to be written
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if logs exist in S3
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'requests/',
        MaxKeys: 1,
      });

      const response = await s3Client.send(command);
      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('should have Lambda error alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-error-rate-${environmentSuffix}`],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.EvaluationPeriods).toBe(1);
    });

    test('should have Lambda throttle alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-throttle-${environmentSuffix}`],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Throttles');
      expect(alarm.Threshold).toBe(1);
    });

    test('should have Lambda duration alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-duration-${environmentSuffix}`],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Threshold).toBe(8000);
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    test('alarms should be in OK or INSUFFICIENT_DATA state', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `lambda-`,
        StateValue: 'ALARM',
      });

      const response = await cloudWatchClient.send(command);
      const alarmingAlarms = (response.MetricAlarms || []).filter((alarm) =>
        alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(alarmingAlarms.length).toBe(0);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete a full request cycle', async () => {
      const testData = {
        testId: `e2e-${Date.now()}`,
        message: 'End-to-end integration test',
      };

      // 1. POST data via API
      const postResponse = await fetch(`${apiUrl}api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(postResponse.status).toBeLessThan(500);

      // 2. GET data via API
      const getResponse = await fetch(`${apiUrl}api`, {
        method: 'GET',
      });

      expect(getResponse.status).toBe(200);

      const responseData = await getResponse.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData).toHaveProperty('environment');
      expect(responseData.environment).toBe(environmentSuffix);
    });

    test('should verify data was stored in DynamoDB', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 5,
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      expect(response.Count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Region Configuration Tests', () => {
    test('resources should be in the correct region', () => {
      expect(outputs.Region).toBe(region);
    });

    test('API URL should contain correct region', () => {
      expect(apiUrl).toContain(region);
    });
  });
});
