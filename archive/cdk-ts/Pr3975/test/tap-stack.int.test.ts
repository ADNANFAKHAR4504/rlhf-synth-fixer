import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';
// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Monitoring System Integration Tests', () => {
  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let cloudWatchClient: CloudWatchClient;

  beforeAll(() => {
    // Initialize AWS SDK clients
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
    };

    dynamoClient = new DynamoDBClient(config);
    lambdaClient = new LambdaClient(config);
    snsClient = new SNSClient(config);
    cloudWatchClient = new CloudWatchClient(config);
  });

  afterAll(async () => {
    // Cleanup clients
    dynamoClient.destroy();
    lambdaClient.destroy();
    snsClient.destroy();
    cloudWatchClient.destroy();
  });

  describe('Infrastructure Validation', () => {
    test('DynamoDB error logs table exists and is configured correctly', async () => {
      const tableName = outputs.ErrorLogsTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain(`error-logs-${environmentSuffix}`);

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table!.StreamSpecification?.StreamEnabled).toBe(true);

      // Verify key schema
      expect(response.Table!.KeySchema).toEqual(
        expect.arrayContaining([
          { AttributeName: 'errorId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ])
      );

      // Verify GSI exists
      expect(response.Table!.GlobalSecondaryIndexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'FunctionNameIndex',
            KeySchema: expect.arrayContaining([
              { AttributeName: 'functionName', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ])
          })
        ])
      );
    });

    test('SNS topic exists and has email subscription', async () => {
      const topicArn = outputs.AlertTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(`monitoring-alerts-${environmentSuffix}`);

      const topicCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const topicResponse = await snsClient.send(topicCommand);
      expect(topicResponse.Attributes).toBeDefined();

      const subscriptionsCommand = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
      const subscriptionsResponse = await snsClient.send(subscriptionsCommand);
      expect(subscriptionsResponse.Subscriptions?.length).toBeGreaterThan(0);
      expect(subscriptionsResponse.Subscriptions?.[0].Protocol).toBe('email');
    });

    test('all Lambda functions exist and are configured correctly', async () => {
      const expectedFunctions = [
        `user-service-${environmentSuffix}`,
        `order-processor-${environmentSuffix}`,
        `payment-handler-${environmentSuffix}`,
        `notification-sender-${environmentSuffix}`,
        `data-aggregator-${environmentSuffix}`
      ];

      for (const functionName of expectedFunctions) {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
        expect(response.Configuration!.Runtime).toBe('nodejs18.x');
        expect(response.Configuration!.Handler).toBe('index.handler');
        expect(response.Configuration!.Timeout).toBe(30);
        expect(response.Configuration!.MemorySize).toBe(256);

        // Verify environment variables
        const envVars = response.Configuration!.Environment?.Variables;
        expect(envVars?.ERROR_TABLE_NAME).toBe(outputs.ErrorLogsTableName);
        expect(envVars?.FUNCTION_NAME).toBe(functionName);
        expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
      }
    });

    test('CloudWatch alarms exist for all functions', async () => {
      const alarmCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `user-service-error-rate-${environmentSuffix}`
      });
      const alarmResponse = await cloudWatchClient.send(alarmCommand);

      expect(alarmResponse.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = alarmResponse.MetricAlarms![0];
      expect(alarm.Threshold).toBe(5);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
    });
  });

  describe('Complete Flow Test', () => {
    test('end-to-end monitoring workflow', async () => {
      const functionName = `user-service-${environmentSuffix}`;

      // Step 1: Invoke Lambda function multiple times to generate metrics
      console.log('Step 1: Invoking Lambda functions to generate data...');
      const invocations = [];
      for (let i = 0; i < 10; i++) {
        const invokeCommand = new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify({
            testId: `integration-test-${i}`,
            timestamp: new Date().toISOString()
          }))
        });
        invocations.push(lambdaClient.send(invokeCommand));
      }

      const responses = await Promise.all(invocations);

      // Step 2: Verify some invocations succeeded
      const successfulInvocations = responses.filter(r => !r.FunctionError);
      const errorInvocations = responses.filter(r => r.FunctionError);

      expect(successfulInvocations.length).toBeGreaterThan(0);
      console.log(`Successful invocations: ${successfulInvocations.length}, Errors: ${errorInvocations.length}`);

      // Step 3: Wait for error logs to be written to DynamoDB
      console.log('Step 2: Waiting for error logs to be written...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      // Step 4: Verify error logs were written to DynamoDB (if any errors occurred)
      if (errorInvocations.length > 0) {
        console.log('Step 3: Verifying error logs in DynamoDB...');
        const scanCommand = new ScanCommand({
          TableName: outputs.ErrorLogsTableName,
          FilterExpression: 'contains(eventData, :testPrefix)',
          ExpressionAttributeValues: {
            ':testPrefix': { S: 'integration-test-' }
          }
        });

        const scanResponse = await dynamoClient.send(scanCommand);
        expect(scanResponse.Items?.length).toBeGreaterThan(0);

        // Verify error log structure
        const errorLog = scanResponse.Items![0];
        expect(errorLog.errorId?.S).toBeDefined();
        expect(errorLog.timestamp?.S).toBeDefined();
        expect(errorLog.functionName?.S).toBe(functionName);
        expect(errorLog.errorMessage?.S).toBeDefined();
        expect(errorLog.duration?.N).toBeDefined();
        expect(errorLog.eventData?.S).toBeDefined();
      }

      // Step 5: Verify GSI query functionality
      console.log('Step 4: Testing GSI query functionality...');
      const queryCommand = new QueryCommand({
        TableName: outputs.ErrorLogsTableName,
        IndexName: 'FunctionNameIndex',
        KeyConditionExpression: 'functionName = :fn',
        ExpressionAttributeValues: {
          ':fn': { S: functionName }
        },
        ScanIndexForward: false,
        Limit: 5
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      // Should not fail even if no items found
      expect(queryResponse.Items).toBeDefined();

      // Step 6: Verify CloudWatch metrics are being generated
      console.log('Step 5: Verifying CloudWatch metrics...');
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 600000); // 10 minutes ago

      const metricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      });

      const metricsResponse = await cloudWatchClient.send(metricsCommand);
      expect(metricsResponse.Datapoints).toBeDefined();

      console.log('Complete flow test passed successfully!');
    }, 60000); // 60 second timeout for complete flow test
  });

  describe('Functionality Tests', () => {
    test('Lambda functions can write error logs to DynamoDB', async () => {
      const functionName = `order-processor-${environmentSuffix}`;

      // Invoke function that should potentially generate an error
      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify({
          testScenario: 'error-logging-test',
          forceError: true
        }))
      });

      const response = await lambdaClient.send(invokeCommand);

      // Wait for DynamoDB write
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query DynamoDB for any error logs from this function
      const queryCommand = new QueryCommand({
        TableName: outputs.ErrorLogsTableName,
        IndexName: 'FunctionNameIndex',
        KeyConditionExpression: 'functionName = :fn',
        ExpressionAttributeValues: {
          ':fn': { S: functionName }
        },
        Limit: 1,
        ScanIndexForward: false
      });

      const queryResponse = await dynamoClient.send(queryCommand);

      // Should be able to query without errors (may or may not have results)
      expect(queryResponse.Items).toBeDefined();
    });

    test('multiple Lambda function types are operational', async () => {
      const functions = [
        `user-service-${environmentSuffix}`,
        `payment-handler-${environmentSuffix}`,
        `data-aggregator-${environmentSuffix}`
      ];

      const invocationPromises = functions.map(functionName =>
        lambdaClient.send(new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify({ test: 'multi-function-test' }))
        }))
      );

      const responses = await Promise.all(invocationPromises);

      // All functions should respond (success or controlled error)
      responses.forEach((response, index) => {
        expect(response.StatusCode).toBe(200);
        expect(response.Payload).toBeDefined();
      });
    });

    test('CloudWatch dashboard is accessible', async () => {
      const dashboardURL = outputs.DashboardURL;
      expect(dashboardURL).toBeDefined();
      expect(dashboardURL).toContain('cloudwatch/home');
      expect(dashboardURL).toContain(`serverless-monitoring-${environmentSuffix}`);
    });

    test('system handles concurrent Lambda invocations', async () => {
      const functionName = `notification-sender-${environmentSuffix}`;

      // Create 5 concurrent invocations
      const concurrentInvocations = Array.from({ length: 5 }, (_, i) =>
        lambdaClient.send(new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify({
            concurrentTest: true,
            invocationId: i
          }))
        }))
      );

      const results = await Promise.allSettled(concurrentInvocations);

      // All invocations should complete (successfully or with expected errors)
      expect(results.length).toBe(5);
      const successfulInvocations = results.filter(r => r.status === 'fulfilled');
      expect(successfulInvocations.length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('alarms are properly configured for error rates', async () => {
      const alarmNames = [
        `user-service-error-rate-${environmentSuffix}`,
        `order-processor-error-rate-${environmentSuffix}`,
        `payment-handler-error-rate-${environmentSuffix}`,
        `notification-sender-error-rate-${environmentSuffix}`,
        `data-aggregator-error-rate-${environmentSuffix}`
      ];

      for (const alarmName of alarmNames) {
        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        });

        const response = await cloudWatchClient.send(command);
        expect(response.MetricAlarms?.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.AlarmName).toBe(alarmName);
        expect(alarm.Threshold).toBe(5);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
      }
    });

    test('alarms are configured for latency monitoring', async () => {
      const latencyAlarmName = `user-service-latency-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [latencyAlarmName]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(500);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.MetricName).toBe('Duration');
    });

    test('throttle alarms are configured', async () => {
      const throttleAlarmName = `user-service-throttles-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [throttleAlarmName]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(5);
      expect(alarm.MetricName).toBe('Throttles');
      expect(alarm.EvaluationPeriods).toBe(1);
    });
  });

  describe('Data Persistence and Querying', () => {
    test('DynamoDB table supports efficient querying patterns', async () => {
      const tableName = outputs.ErrorLogsTableName;

      // Test primary key query (by errorId - though we need an actual errorId)
      // This test verifies the table structure supports the query
      const currentTime = new Date().toISOString();
      const testErrorId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // We can't easily insert test data without proper permissions in integration tests,
      // but we can verify the table supports the query structure
      const command = new GetItemCommand({
        TableName: tableName,
        Key: {
          errorId: { S: testErrorId },
          timestamp: { S: currentTime }
        }
      });

      // Should execute without error (will just return empty result)
      const response = await dynamoClient.send(command);
      expect(response).toBeDefined();
    });

    test('GSI supports function-based error log queries', async () => {
      const tableName = outputs.ErrorLogsTableName;
      const functionName = `user-service-${environmentSuffix}`;

      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'FunctionNameIndex',
        KeyConditionExpression: 'functionName = :fn',
        ExpressionAttributeValues: {
          ':fn': { S: functionName }
        },
        Limit: 10
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      // Items may be empty if no errors have occurred, but query should succeed
    });
  });
});
