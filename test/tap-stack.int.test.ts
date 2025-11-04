import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

// Integration tests for multi-environment data processing pipeline
// These tests validate the actual deployed infrastructure

describe('Multi-Environment Data Processing Pipeline Integration Tests', () => {
  let outputs: Record<string, string>;
  let region: string;
  let s3Client: S3Client;
  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const rawOutputs = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(rawOutputs);
    } else {
      console.warn(
        'Warning: flat-outputs.json not found. Tests may fail without deployment.'
      );
      outputs = {};
    }

    // Get region from outputs or environment
    region =
      process.env.AWS_REGION ||
      outputs.AwsRegion ||
      'ap-southeast-1';

    // Initialize AWS clients
    s3Client = new S3Client({ region });
    dynamoClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
  });

  describe('S3 Data Storage', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.BucketName;
      expect(bucketName).toBeDefined();

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket allows object upload and retrieval', async () => {
      const bucketName = outputs.BucketName;
      const testKey = `test-data-${Date.now()}.txt`;
      const testContent = 'Test data for integration testing';

      // Upload test object
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });

      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Retrieve test object
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const getResponse = await s3Client.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);

      const bodyString = await getResponse.Body?.transformToString();
      expect(bodyString).toBe(testContent);
    });
  });

  describe('DynamoDB Job Tracking', () => {
    test('DynamoDB table exists and is accessible', async () => {
      const tableName = outputs.TableName;
      expect(tableName).toBeDefined();

      const jobId = `test-job-${Date.now()}`;
      const timestamp = Date.now();

      const command = new PutItemCommand({
        TableName: tableName,
        Item: {
          jobId: { S: jobId },
          timestamp: { N: timestamp.toString() },
          status: { S: 'TESTING' },
          environment: { S: outputs.Environment || 'dev' },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('DynamoDB table allows item retrieval', async () => {
      const tableName = outputs.TableName;
      const jobId = `test-job-retrieve-${Date.now()}`;
      const timestamp = Date.now();

      // Insert item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            jobId: { S: jobId },
            timestamp: { N: timestamp.toString() },
            status: { S: 'COMPLETED' },
            environment: { S: outputs.Environment || 'dev' },
          },
        })
      );

      // Retrieve item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          jobId: { S: jobId },
          timestamp: { N: timestamp.toString() },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.status.S).toBe('COMPLETED');
    });

    test('DynamoDB GSI (StatusIndex) allows querying by status', async () => {
      const tableName = outputs.TableName;
      const testStatus = `STATUS-${Date.now()}`;
      const jobId = `test-job-gsi-${Date.now()}`;
      const timestamp = Date.now();

      // Insert item with unique status
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            jobId: { S: jobId },
            timestamp: { N: timestamp.toString() },
            status: { S: testStatus },
            environment: { S: outputs.Environment || 'dev' },
          },
        })
      );

      // Wait a moment for GSI to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Query using GSI
      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :statusValue',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':statusValue': { S: testStatus },
        },
      });

      const response = await dynamoClient.send(queryCommand);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Lambda Data Processor', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    test('Lambda function has correct environment variables', async () => {
      const functionName = outputs.LambdaFunctionName;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.ENVIRONMENT).toBe(outputs.Environment || 'dev');
      expect(envVars?.BUCKET_NAME).toBe(outputs.BucketName);
      expect(envVars?.TABLE_NAME).toBe(outputs.TableName);
      expect(envVars?.REGION).toBe(region);
    });

    test('Lambda function can be invoked successfully', async () => {
      const functionName = outputs.LambdaFunctionName;

      const testEvent = {
        eventType: 'test',
        records: [{ id: '1', data: 'test data' }],
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(
        Buffer.from(response.Payload!).toString()
      );
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toContain('completed successfully');
      expect(body.environment).toBe(outputs.Environment || 'dev');
    });

    test('Lambda execution creates job entries in DynamoDB', async () => {
      const functionName = outputs.LambdaFunctionName;
      const tableName = outputs.TableName;

      // Invoke Lambda
      const testEvent = {
        eventType: 'integration-test',
        records: [{ id: '1', data: 'test' }],
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(
        Buffer.from(invokeResponse.Payload!).toString()
      );
      const body = JSON.parse(payload.body);
      const jobId = body.jobId;

      expect(jobId).toBeDefined();

      // Wait for DynamoDB to be consistent
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Query DynamoDB for the job entries
      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'jobId = :jobId',
        ExpressionAttributeValues: {
          ':jobId': { S: jobId },
        },
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items!.length).toBeGreaterThanOrEqual(1);

      const completedItem = queryResponse.Items!.find(
        (item) => item.status.S === 'COMPLETED'
      );
      expect(completedItem).toBeDefined();
    });
  });

  describe('CloudWatch Logging', () => {
    test('CloudWatch log group exists for Lambda function', async () => {
      const logGroupName = outputs.LogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });

    test('CloudWatch log group has correct retention policy', async () => {
      const logGroupName = outputs.LogGroupName;
      const environment = outputs.Environment || 'dev';

      // Expected retention based on environment
      const expectedRetention: Record<string, number> = {
        dev: 7,
        staging: 30,
        prod: 90,
      };

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups![0];

      expect(logGroup.retentionInDays).toBe(
        expectedRetention[environment]
      );
    });
  });

  describe('Cross-Environment Isolation', () => {
    test('Resources are tagged with correct environment', async () => {
      const environment = outputs.Environment || 'dev';
      const environmentSuffix = outputs.EnvironmentSuffix;

      // Verify naming convention includes environment and suffix
      expect(outputs.BucketName).toContain(environment);
      expect(outputs.BucketName).toContain(environmentSuffix);
      expect(outputs.TableName).toContain(environment);
      expect(outputs.TableName).toContain(environmentSuffix);
      expect(outputs.LambdaFunctionName).toContain(environment);
      expect(outputs.LambdaFunctionName).toContain(environmentSuffix);
    });

    test('Lambda function has correct memory allocation for environment', async () => {
      const functionName = outputs.LambdaFunctionName;
      const environment = outputs.Environment || 'dev';

      // Expected memory by environment
      const expectedMemory: Record<string, number> = {
        dev: 128,
        staging: 256,
        prod: 512,
      };

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.MemorySize).toBe(
        expectedMemory[environment]
      );
    });
  });

  describe('End-to-End Data Processing Flow', () => {
    test('Complete workflow: S3 upload -> Lambda processing -> DynamoDB tracking', async () => {
      const bucketName = outputs.BucketName;
      const functionName = outputs.LambdaFunctionName;
      const tableName = outputs.TableName;

      // 1. Upload test data to S3
      const testKey = `e2e-test-${Date.now()}.json`;
      const testData = {
        id: `e2e-${Date.now()}`,
        type: 'integration-test',
        timestamp: new Date().toISOString(),
      };

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
        })
      );

      // 2. Invoke Lambda to process the data
      const event = {
        eventType: 'e2e-test',
        records: [testData],
        s3Key: testKey,
      };

      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(event),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);

      const payload = JSON.parse(
        Buffer.from(invokeResponse.Payload!).toString()
      );
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      const jobId = body.jobId;

      // 3. Verify job tracking in DynamoDB
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const queryResponse = await dynamoClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'jobId = :jobId',
          ExpressionAttributeValues: {
            ':jobId': { S: jobId },
          },
        })
      );

      expect(queryResponse.Items!.length).toBeGreaterThan(0);

      // 4. Verify data consistency
      const completedJob = queryResponse.Items!.find(
        (item) => item.status.S === 'COMPLETED'
      );
      expect(completedJob).toBeDefined();
      expect(completedJob!.environment.S).toBe(
        outputs.Environment || 'dev'
      );
    });
  });
});
