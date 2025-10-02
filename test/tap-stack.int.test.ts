// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { APIGatewayClient, GetRestApiCommand, GetStageCommand } from '@aws-sdk/client-api-gateway';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read region from AWS_REGION file
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

// Extract stack outputs
const tableName = outputs.DynamoDBTableName;
const lambdaFunctionName = outputs.LambdaFunction;
const apiUrl = outputs.ApiUrl;

// Derive resource names based on environment suffix
const expectedBucketName = `${environmentSuffix}-lambda-code-bucket`;
const expectedAlarmTopicName = `${environmentSuffix}-lambda-alarms`;
const expectedErrorAlarmName = `${environmentSuffix}-lambda-errors`;
const expectedThrottleAlarmName = `${environmentSuffix}-lambda-throttles`;

describe('Serverless API Infrastructure Integration Tests', () => {
  describe('DynamoDB Table', () => {
    test('should exist and have correct configuration', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have correct partition and sort keys', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const partitionKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const sortKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(partitionKey?.AttributeName).toBe('id');
      expect(sortKey?.AttributeName).toBe('timestamp');
    });

    test('should use PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should have correct attribute definitions', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const attributeDefinitions = response.Table?.AttributeDefinitions;
      expect(attributeDefinitions).toBeDefined();
      expect(attributeDefinitions?.length).toBe(2);

      const idAttribute = attributeDefinitions?.find((a) => a.AttributeName === 'id');
      const timestampAttribute = attributeDefinitions?.find(
        (a) => a.AttributeName === 'timestamp'
      );

      expect(idAttribute?.AttributeType).toBe('S');
      expect(timestampAttribute?.AttributeType).toBe('S');
    });
  });

  describe('Lambda Function', () => {
    test('should exist and be in active state', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(lambdaFunctionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should have correct runtime and configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('should have correct environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.TABLE_NAME).toBe(tableName);
      expect(envVars?.NODE_ENV).toBe('development');
    });

    test('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have Lambda Insights layer attached', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);

      const layers = response.Configuration?.Layers || [];
      const hasInsightsLayer = layers.some((layer) =>
        layer.Arn?.includes('LambdaInsightsExtension')
      );

      expect(hasInsightsLayer).toBe(true);
    });
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      // Get account ID to construct bucket name
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(command);
      const lambdaArn = response.Configuration?.FunctionArn;
      const accountId = lambdaArn?.split(':')[4];

      const bucketName = `${expectedBucketName}-${accountId}`;

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have Lambda errors alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [expectedErrorAlarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms?.length).toBe(1);
      const alarm = response.MetricAlarms?.[0];

      expect(alarm?.AlarmName).toBe(expectedErrorAlarmName);
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('should have Lambda throttles alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [expectedThrottleAlarmName],
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms?.length).toBe(1);
      const alarm = response.MetricAlarms?.[0];

      expect(alarm?.AlarmName).toBe(expectedThrottleAlarmName);
      expect(alarm?.MetricName).toBe('Throttles');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Threshold).toBe(1);
    });

    test('should have alarm actions configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [expectedErrorAlarmName],
      });
      const response = await cloudwatchClient.send(command);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.ActionsEnabled).toBe(true);
      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway', () => {
    test('should be accessible and return valid response', async () => {
      // Test the root path
      const response = await axios.get(apiUrl, { validateStatus: () => true });

      // API Gateway should respond (even if it's a 404 or other status)
      expect(response.status).toBeDefined();
    });

    test('should have CORS headers configured', async () => {
      const response = await axios.options(`${apiUrl}api/events`, {
        validateStatus: () => true,
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('End-to-End API Tests', () => {
    let createdEventId: string;

    test('should create a new event via POST /api/events', async () => {
      const eventData = {
        name: 'Integration Test Event',
        description: 'This is a test event created during integration testing',
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(`${apiUrl}api/events`, eventData, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.event).toBeDefined();
      expect(response.data.event.id).toBeDefined();

      createdEventId = response.data.event.id;
    });

    test('should list events via GET /api/events', async () => {
      const response = await axios.get(`${apiUrl}api/events`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.events).toBeInstanceOf(Array);
      expect(response.data.count).toBeGreaterThan(0);
    });

    test('should retrieve a specific event via GET /api/events/{id}', async () => {
      if (!createdEventId) {
        throw new Error('No event ID available for testing');
      }

      const response = await axios.get(`${apiUrl}api/events/${createdEventId}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(createdEventId);
    });

    test('should delete an event via DELETE /api/events/{id}', async () => {
      if (!createdEventId) {
        throw new Error('No event ID available for testing');
      }

      const response = await axios.delete(`${apiUrl}api/events/${createdEventId}`);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('successfully');
    });

    test('should return 404 for non-existent event', async () => {
      const response = await axios.get(`${apiUrl}api/events/non-existent-id`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
    });

    test('should return 400 for POST with empty body', async () => {
      const response = await axios.post(`${apiUrl}api/events`, null, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });
  });

  describe('Data Persistence and Consistency', () => {
    test('should persist data correctly in DynamoDB', async () => {
      // Create an event
      const eventData = {
        name: 'Persistence Test',
        value: Math.random().toString(),
      };

      const createResponse = await axios.post(`${apiUrl}api/events`, eventData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const eventId = createResponse.data.event.id;

      // Wait a moment for consistency
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Retrieve the event by ID
      const getResponse = await axios.get(`${apiUrl}api/events/${eventId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data).toMatchObject(eventData);

      // Cleanup
      await axios.delete(`${apiUrl}api/events/${eventId}`);
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        axios.get(`${apiUrl}api/events`)
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    test('should respond within acceptable time', async () => {
      const start = Date.now();
      await axios.get(`${apiUrl}api/events`);
      const duration = Date.now() - start;

      // API should respond within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
