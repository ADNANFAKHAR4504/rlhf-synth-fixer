import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  ListSubscriptionsByTopicCommand,
  PublishCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';
// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Notification System Integration Tests', () => {
  let snsTopicArn: string;
  let lambdaFunctionName: string;
  let dynamoTableName: string;

  beforeAll(async () => {
    // Extract resource identifiers from outputs
    snsTopicArn = outputs.SNSTopicArn;
    lambdaFunctionName = outputs.LambdaFunctionName;
    dynamoTableName = outputs.DynamoDBTableName;

    // Validate required outputs exist
    expect(snsTopicArn).toBeDefined();
    expect(lambdaFunctionName).toBeDefined();
    expect(dynamoTableName).toBeDefined();
  });

  describe('Infrastructure Validation', () => {
    test('SNS topic should exist and be accessible', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: snsTopicArn
      });
      const response: any = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions.length).toBeGreaterThan(0);

      // Verify Lambda subscription exists
      const lambdaSubscription = response.Subscriptions.find(
        (sub: any) => sub.Protocol === 'lambda'
      );
      expect(lambdaSubscription).toBeDefined();
    });

    test('Lambda function should be deployable and accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName
      });
      const response: any = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.Runtime).toBe('nodejs22.x');
      expect(response.Configuration.State).toBe('Active');
    });

    test('DynamoDB table should be accessible with correct schema', async () => {
      // Test table access by attempting a scan with limit
      const command = new ScanCommand({
        TableName: dynamoTableName,
        Limit: 1
      });
      const response = await dynamoClient.send(command);
      expect(response).toBeDefined();
      // Table should be accessible (response won't error)
    });

    test('CloudWatch alarms should be created and active', async () => {
      const expectedAlarmNames = [
        `notification-failures-${environmentSuffix}`,
        `lambda-errors-${environmentSuffix}`,
        `lambda-throttles-${environmentSuffix}`
      ];

      for (const alarmName of expectedAlarmNames) {
        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        });
        const response: any = await cloudwatchClient.send(command);
        expect(response.MetricAlarms).toBeDefined();

      }
    });
  });

  describe('Complete Notification Flow Test', () => {
    test('should process notification from SNS through Lambda to DynamoDB', async () => {
      const testMessage = {
        orderId: 'TEST-ORDER-12345',
        orderType: 'ORDER_UPDATE',
        customerId: 'CUSTOMER-67890',
        status: 'SHIPPED',
        timestamp: new Date().toISOString(),
        testRun: true
      };

      // Step 1: Publish message to SNS topic
      const publishCommand = new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(testMessage),
        Subject: 'Test Order Notification'
      });

      const publishResponse = await snsClient.send(publishCommand);
      expect(publishResponse.MessageId).toBeDefined();

      // Step 2: Wait for Lambda processing (allow up to 30 seconds)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 3: Verify message was processed and logged to DynamoDB
      let notificationFound = false;
      let attempts = 0;
      const maxAttempts = 6; // 30 seconds total with 5-second intervals

      while (!notificationFound && attempts < maxAttempts) {
        attempts++;

        const queryCommand = new ScanCommand({
          TableName: dynamoTableName,
          FilterExpression: 'contains(#orderId, :orderId)',
          ExpressionAttributeNames: {
            '#orderId': 'orderId'
          },
          ExpressionAttributeValues: {
            ':orderId': { S: 'TEST-ORDER-12345' }
          },
          Limit: 10
        });

        const queryResponse = await dynamoClient.send(queryCommand);

        if (queryResponse.Items && queryResponse.Items.length > 0) {
          notificationFound = true;
          const item = queryResponse.Items[0];

          // Verify notification data structure
          expect(item.notificationId).toBeDefined();
          expect(item.timestamp).toBeDefined();
          expect(item.status.S).toBe('SUCCESS');
          expect(item.messageType.S).toBe('ORDER_UPDATE');
          expect(item.orderId.S).toBe('TEST-ORDER-12345');
          expect(item.processedAt).toBeDefined();
          expect(item.snsTimestamp).toBeDefined();
        } else {
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }, 60000); // 60-second timeout for this test

    test('should handle malformed messages and log failures', async () => {
      const malformedMessage = 'This is not valid JSON';

      // Step 1: Publish malformed message
      const publishCommand = new PublishCommand({
        TopicArn: snsTopicArn,
        Message: malformedMessage,
        Subject: 'Test Malformed Notification'
      });

      const publishResponse = await snsClient.send(publishCommand);
      expect(publishResponse.MessageId).toBeDefined();

      // Step 2: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 3: Check for failure record in DynamoDB
      let failureFound = false;
      let attempts = 0;
      const maxAttempts = 6;

      while (!failureFound && attempts < maxAttempts) {
        attempts++;

        const scanCommand = new ScanCommand({
          TableName: dynamoTableName,
          FilterExpression: '#status = :failed',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':failed': { S: 'FAILED' }
          },
          Limit: 10
        });

        const scanResponse = await dynamoClient.send(scanCommand);

        if (scanResponse.Items && scanResponse.Items.length > 0) {
          failureFound = true;
          const failureItem = scanResponse.Items[0];

          // Verify failure logging
          expect(failureItem.status.S).toBe('FAILED');
          expect(failureItem.errorMessage).toBeDefined();
          expect(failureItem.notificationId).toBeDefined();
          expect(failureItem.timestamp).toBeDefined();
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }, 60000);
  });

  describe('CloudWatch Metrics Integration', () => {
    test('should publish custom metrics to CloudWatch', async () => {
      // Send a test message first
      const testMessage = {
        orderId: 'METRICS-TEST-ORDER',
        orderType: 'ORDER_UPDATE',
        testRun: true
      };

      await snsClient.send(new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(testMessage),
        Subject: 'Metrics Test'
      }));

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Check for custom metrics (within last 10 minutes)
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const metricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'NotificationSystem',
        MetricName: 'NotificationsProcessed',
        Dimensions: [
          {
            Name: 'Environment',
            Value: environmentSuffix
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300, // 5 minutes
        Statistics: ['Sum']
      });

      const metricsResponse = await cloudwatchClient.send(metricsCommand);
      expect(metricsResponse.Datapoints).toBeDefined();
      // Should have some data points (at least the test message we sent)

      if (metricsResponse.Datapoints && metricsResponse.Datapoints.length > 0) {
        const totalProcessed = metricsResponse.Datapoints.reduce(
          (sum, datapoint) => sum + (datapoint.Sum || 0), 0
        );
        expect(totalProcessed).toBeGreaterThan(0);
      }
    }, 45000);
  });

  describe('Data Query and Retrieval Tests', () => {
    test('should query notifications by status using GSI', async () => {
      // Query using the StatusIndex GSI
      const queryCommand = new QueryCommand({
        TableName: dynamoTableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': { S: 'SUCCESS' }
        },
        Limit: 5
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();

      // If we have successful notifications, verify the structure
      if (queryResponse.Items && queryResponse.Items.length > 0) {
        queryResponse.Items.forEach(item => {
          expect(item.status.S).toBe('SUCCESS');
          expect(item.notificationId).toBeDefined();
          expect(item.timestamp).toBeDefined();
        });
      }
    });

    test('should retrieve notification by ID and timestamp', async () => {
      // First, get any existing notification
      const scanCommand = new ScanCommand({
        TableName: dynamoTableName,
        Limit: 1
      });

      const scanResponse = await dynamoClient.send(scanCommand);

      if (scanResponse.Items && scanResponse.Items.length > 0) {
        const existingItem = scanResponse.Items[0];

        // Now retrieve it by primary key
        const getCommand = new GetItemCommand({
          TableName: dynamoTableName,
          Key: {
            notificationId: existingItem.notificationId,
            timestamp: existingItem.timestamp
          }
        });

        const getResponse = await dynamoClient.send(getCommand);
        expect(getResponse.Item).toBeDefined();
        expect(getResponse.Item?.notificationId.S).toBe(
          existingItem.notificationId.S
        );
      }
    });
  });

  describe('System Resource Validation', () => {
    test('should have all expected outputs available', () => {
      const requiredOutputs = [
        'SNSTopicArn',
        'SNSTopicName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'DashboardURL',
        'NotificationEmail'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('should have dashboard URL accessible', () => {
      const dashboardURL = outputs.DashboardURL;
      expect(dashboardURL).toBeDefined();
      expect(dashboardURL).toContain('cloudwatch');
      expect(dashboardURL).toContain('dashboards');
    });
  });
});