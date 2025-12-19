// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';
// Add fetch polyfill for Node.js
import fetch from 'node-fetch';

// Type definitions for the outputs
interface CfnOutputs {
  ApiGatewayUrl: string;
  LambdaFunctionName: string;
  DynamoDBTableName: string;
  CloudWatchAlarmName: string;
}

// Type definitions for test data
interface TestData {
  message: string;
  timestamp: string;
  testId: string;
}

interface ApiResponse {
  message: string;
  id: string;
  stage: string;
}

interface TestItem {
  id: string;
  data: { message: string };
  timestamp: string;
  stage: string;
}

const outputs: CfnOutputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment and environmentSuffix from environment variables (matches CDK parameters)
const environment = process.env.ENVIRONMENT || 'dev';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const dynamodbClient = new AWS.DynamoDB({ region: 'us-east-1' }); // For describe operations
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });
const logs = new AWS.CloudWatchLogs({ region: 'us-east-1' });

describe('Serverless Application Integration Tests', () => {
  describe('API Gateway Integration', () => {
    test('should have valid API Gateway URL', () => {
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.ApiGatewayUrl).toMatch(/^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\/.+\/$/);
    });

    test('should successfully POST data to /data endpoint', async () => {
      const testData: TestData = {
        message: 'Integration test data',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7),
      };

      const response = await fetch(`${outputs.ApiGatewayUrl}data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
      const responseData = await response.json() as ApiResponse;
      expect(responseData).toHaveProperty('message', 'Data processed successfully');
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('stage');
    }, 30000);

    test('should handle invalid POST requests gracefully', async () => {
      const response = await fetch(`${outputs.ApiGatewayUrl}data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(500);
      const responseData = await response.json() as { error: string };
      expect(responseData).toHaveProperty('error');
    }, 30000);
  });

  describe('DynamoDB Integration', () => {
    test('should have accessible DynamoDB table', async () => {
      expect(outputs.DynamoDBTableName).toBeDefined();

      const describeParams = {
        TableName: outputs.DynamoDBTableName,
      };

      // Fixed: Use correct DynamoDB client for describe operations
      const tableDescription = await dynamodbClient.describeTable(describeParams).promise();

      // Add proper undefined checks
      expect(tableDescription.Table).toBeDefined();
      expect(tableDescription.Table?.TableName).toBe(outputs.DynamoDBTableName);
      expect(tableDescription.Table?.KeySchema?.[0]?.AttributeName).toBe('id');
    });

    test('should store and retrieve data from DynamoDB', async () => {
      const testItem: TestItem = {
        id: `test-${Date.now()}`,
        data: { message: 'Integration test item' },
        timestamp: new Date().toISOString(),
        stage: environment,
      };

      // Put item
      await dynamodb.put({
        TableName: outputs.DynamoDBTableName,
        Item: testItem,
      }).promise();

      // Get item
      const result = await dynamodb.get({
        TableName: outputs.DynamoDBTableName,
        Key: { id: testItem.id },
      }).promise();

      // Add proper undefined checks
      expect(result.Item).toBeDefined();
      expect(result.Item?.id).toBe(testItem.id);
      expect((result.Item?.data as { message: string })?.message).toBe('Integration test item');
    });

    test('should verify auto-scaling configuration', async () => {
      const autoscaling = new AWS.ApplicationAutoScaling({ region: 'us-east-1' });

      const readTargets = await autoscaling.describeScalableTargets({
        ServiceNamespace: 'dynamodb',
        ResourceIds: [`table/${outputs.DynamoDBTableName}`],
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
      }).promise();

      const writeTargets = await autoscaling.describeScalableTargets({
        ServiceNamespace: 'dynamodb',
        ResourceIds: [`table/${outputs.DynamoDBTableName}`],
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
      }).promise();

      // Add proper undefined checks
      expect(readTargets.ScalableTargets).toBeDefined();
      expect(readTargets.ScalableTargets).toHaveLength(1);
      expect(readTargets.ScalableTargets?.[0]?.MinCapacity).toBe(5);
      expect(readTargets.ScalableTargets?.[0]?.MaxCapacity).toBe(20);

      expect(writeTargets.ScalableTargets).toBeDefined();
      expect(writeTargets.ScalableTargets).toHaveLength(1);
      expect(writeTargets.ScalableTargets?.[0]?.MinCapacity).toBe(5);
      expect(writeTargets.ScalableTargets?.[0]?.MaxCapacity).toBe(20);
    });
  });

  describe('Lambda Function Integration', () => {
    test('should have correct Lambda function configuration', async () => {
      const lambda = new AWS.Lambda({ region: 'us-east-1' });

      const functionConfig = await lambda.getFunction({
        FunctionName: outputs.LambdaFunctionName,
      }).promise();

      // Add proper undefined checks
      expect(functionConfig.Configuration).toBeDefined();
      expect(functionConfig.Configuration?.Runtime).toBe('python3.9');
      expect(functionConfig.Configuration?.Handler).toBe('index.handler');
      expect(functionConfig.Configuration?.Environment?.Variables?.STAGE).toBeDefined();
      expect(functionConfig.Configuration?.Environment?.Variables?.REGION).toBe('us-east-1');
      expect(functionConfig.Configuration?.Environment?.Variables?.LOG_LEVEL).toBeDefined();
      expect(functionConfig.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
    });

    test('should invoke Lambda function successfully', async () => {
      const lambda = new AWS.Lambda({ region: 'us-east-1' });

      const testEvent = {
        body: JSON.stringify({
          message: 'Direct Lambda test',
          timestamp: new Date().toISOString(),
        }),
      };

      const invokeParams = {
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify(testEvent),
      };

      const result = await lambda.invoke(invokeParams).promise();
      expect(result.StatusCode).toBe(200);

      // Add proper undefined checks
      if (result.Payload) {
        const response = JSON.parse(result.Payload as string);
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.message).toBe('Data processed successfully');
        expect(body.id).toBeDefined();
      } else {
        fail('Lambda function did not return a payload');
      }
    });
  });

  describe('CloudWatch Integration', () => {
    test('should have CloudWatch log group created', async () => {
      // Fixed: Use consistent log group name pattern with environmentSuffix
      const expectedLogGroupName = `/aws/lambda/data-processor-${environment}-${environmentSuffix}`;

      const logGroups = await logs.describeLogGroups({
        logGroupNamePrefix: expectedLogGroupName,
      }).promise();

      // Add proper undefined checks
      expect(logGroups.logGroups).toBeDefined();
      const targetLogGroup = logGroups.logGroups?.find(lg =>
        lg.logGroupName === expectedLogGroupName
      );

      expect(targetLogGroup).toBeDefined();
      expect(targetLogGroup?.retentionInDays).toBe(7);
    });

    test('should have CloudWatch alarm configured', async () => {
      const alarms = await cloudwatch.describeAlarms({
        AlarmNames: [outputs.CloudWatchAlarmName],
      }).promise();

      // Add proper undefined checks
      expect(alarms.MetricAlarms).toBeDefined();
      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms?.[0];

      expect(alarm).toBeDefined();
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm?.Threshold).toBe(5);
      expect(alarm?.EvaluationPeriods).toBe(5);
      expect(alarm?.TreatMissingData).toBe('notBreaching');
    });

    test('should verify Lambda logs are being written', async () => {
      // First, invoke the Lambda function to generate logs
      const lambda = new AWS.Lambda({ region: 'us-east-1' });

      await lambda.invoke({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify({
          body: JSON.stringify({ test: 'log generation' }),
        }),
      }).promise();

      // Wait a moment for logs to be written
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Fixed: Use consistent log group name with environmentSuffix
      const logGroupName = `/aws/lambda/data-processor-${environment}-${environmentSuffix}`;

      // Check for recent log streams
      const logStreams = await logs.describeLogStreams({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1,
      }).promise();

      // Add proper undefined checks
      expect(logStreams.logStreams).toBeDefined();
      expect(logStreams.logStreams?.length).toBeGreaterThan(0);

      if (logStreams.logStreams?.[0]?.logStreamName) {
        const logEvents = await logs.getLogEvents({
          logGroupName,
          logStreamName: logStreams.logStreams[0].logStreamName,
        }).promise();

        expect(logEvents.events).toBeDefined();
        expect(logEvents.events?.length).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('End-to-End Workflow', () => {

    test('should handle concurrent requests properly', async () => {
      const concurrentRequests = 5;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const testData = {
          concurrentTest: true,
          requestId: i,
          timestamp: new Date().toISOString(),
        };

        requests.push(
          fetch(`${outputs.ApiGatewayUrl}data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
          })
        );
      }

      const responses = await Promise.all(requests);
      const responseData = await Promise.all(
        responses.map(r => r.json() as Promise<ApiResponse>)
      );

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // All should have unique IDs
      const ids = responseData.map(data => data.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(concurrentRequests);

      // Verify all items are stored in DynamoDB
      for (const data of responseData) {
        const dbResult = await dynamodb.get({
          TableName: outputs.DynamoDBTableName,
          Key: { id: data.id },
        }).promise();

        // Add proper undefined checks
        expect(dbResult.Item).toBeDefined();
        expect((dbResult.Item?.data as any)?.concurrentTest).toBe(true);
      }
    }, 45000);
  });

  // Additional test to verify resource naming with environmentSuffix
  describe('Resource Naming Verification', () => {
    test('should verify all resources follow the correct naming convention', () => {
      // Verify that output names include both environment and environmentSuffix
      expect(outputs.DynamoDBTableName).toMatch(new RegExp(`data-table-.*-${environmentSuffix}`));
      expect(outputs.LambdaFunctionName).toMatch(new RegExp(`data-processor-.*-${environmentSuffix}`));
      expect(outputs.CloudWatchAlarmName).toMatch(new RegExp(`lambda-error-rate-.*-${environmentSuffix}`));
    });
  });
});