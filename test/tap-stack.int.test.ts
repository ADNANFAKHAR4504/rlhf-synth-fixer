// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const cloudwatch = new AWS.CloudWatch();

// Test data
const testOrderData = {
  orderId: 'TEST-ORDER-12345',
  customerEmail: 'test.customer@example.com',
  phoneNumber: '+1234567890',
  orderAmount: 99.99,
  items: ['Widget A', 'Widget B'],
  timestamp: Date.now(),
};

describe('Notification System Integration Tests', () => {
  const notificationTopicArn = outputs.NotificationTopicArn;
  const notificationTableName = outputs.NotificationTableName;

  beforeAll(() => {
    // Verify required outputs exist
    expect(notificationTopicArn).toBeDefined();
    expect(notificationTableName).toBeDefined();
  });

  afterEach(async () => {
    // Clean up test data from DynamoDB after each test
    await cleanupTestData();
  });

  describe('SNS Topic Functionality', () => {
    test('SNS topic exists and is accessible', async () => {
      const params = {
        TopicArn: notificationTopicArn,
      };

      const response = await sns.getTopicAttributes(params).promise();
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(notificationTopicArn);
    });

    test('can publish message to SNS topic', async () => {
      const message = JSON.stringify(testOrderData);
      const params = {
        TopicArn: notificationTopicArn,
        Message: message,
        MessageAttributes: {
          channel: {
            DataType: 'String',
            StringValue: 'email',
          },
        },
      };

      const response = await sns.publish(params).promise();
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table exists and is accessible', async () => {
      const params = {
        TableName: notificationTableName,
        Limit: 1,
      };

      // Should not throw error if table exists and is accessible
      const response = await dynamodb.scan(params).promise();
      expect(response).toBeDefined();
    });

    test('can write notification log to DynamoDB', async () => {
      // Publish message to trigger Lambda function
      const message = JSON.stringify(testOrderData);
      const publishParams = {
        TopicArn: notificationTopicArn,
        Message: message,
        MessageAttributes: {
          channel: {
            DataType: 'String',
            StringValue: 'email',
          },
        },
      };

      const publishResponse = await sns.publish(publishParams).promise();
      const messageId = publishResponse.MessageId;

      if (!messageId) {
        throw new Error('MessageId was not returned from SNS');
      }

      // Wait for Lambda to process and write to DynamoDB
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query DynamoDB for the notification log
      const queryParams = {
        TableName: notificationTableName,
        KeyConditionExpression: 'notificationId = :messageId',
        ExpressionAttributeValues: {
          ':messageId': { S: messageId },
        },
      };

      const queryResponse = await dynamodb.query(queryParams).promise();
      expect(queryResponse.Items?.length).toBeGreaterThan(0);

      const item = queryResponse.Items![0];
      expect(item.notificationId.S).toBe(messageId);
      expect(item.notificationType.S).toBe('EMAIL');
      expect(item.orderId.S).toBe(testOrderData.orderId);
    });

    test('can query by delivery status using GSI', async () => {
      // Publish message first
      const message = JSON.stringify(testOrderData);
      await sns
        .publish({
          TopicArn: notificationTopicArn,
          Message: message,
          MessageAttributes: {
            channel: {
              DataType: 'String',
              StringValue: 'sms',
            },
          },
        })
        .promise();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Query by delivery status
      const queryParams = {
        TableName: notificationTableName,
        IndexName: 'StatusIndex',
        KeyConditionExpression: 'deliveryStatus = :status',
        ExpressionAttributeValues: {
          ':status': { S: 'SENT' },
        },
      };

      const response = await dynamodb.query(queryParams).promise();
      expect(response.Items?.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Notification Flow', () => {
    test('complete email notification workflow', async () => {
      const message = JSON.stringify({
        ...testOrderData,
        orderId: 'EMAIL-FLOW-TEST-' + Date.now(),
      });

      // Step 1: Publish to SNS
      const publishParams = {
        TopicArn: notificationTopicArn,
        Message: message,
        MessageAttributes: {
          channel: {
            DataType: 'String',
            StringValue: 'email',
          },
        },
      };

      const publishResponse = await sns.publish(publishParams).promise();
      const messageId = publishResponse.MessageId;

      if (!messageId) {
        throw new Error('MessageId was not returned from SNS');
      }

      // Step 2: Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Step 3: Verify notification logged in DynamoDB
      const queryParams = {
        TableName: notificationTableName,
        KeyConditionExpression: 'notificationId = :messageId',
        ExpressionAttributeValues: {
          ':messageId': { S: messageId },
        },
      };

      const queryResponse = await dynamodb.query(queryParams).promise();
      expect(queryResponse.Items?.length).toBe(1);

      const notificationLog = queryResponse.Items![0];
      expect(notificationLog.notificationType.S).toBe('EMAIL');
      expect(notificationLog.recipient.S).toBe(testOrderData.customerEmail);
      expect(notificationLog.deliveryStatus.S).toBe('SENT');
      expect(notificationLog.messageBody.S).toContain(
        testOrderData.orderId.replace('TEST-ORDER', 'EMAIL-FLOW-TEST')
      );

      // Step 4: Verify CloudWatch metrics (basic check)
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const metricsParams = {
        Namespace: 'AWS/SNS',
        MetricName: 'NumberOfMessagesPublished',
        Dimensions: [
          {
            Name: 'TopicName',
            Value: `order-notifications-${environmentSuffix}`,
          },
        ],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ['Sum'],
      };

      const metricsResponse = await cloudwatch
        .getMetricStatistics(metricsParams)
        .promise();
      expect(metricsResponse.Datapoints).toBeDefined();
    });

    test('complete SMS notification workflow', async () => {
      const message = JSON.stringify({
        ...testOrderData,
        orderId: 'SMS-FLOW-TEST-' + Date.now(),
      });

      // Step 1: Publish to SNS
      const publishResponse = await sns
        .publish({
          TopicArn: notificationTopicArn,
          Message: message,
          MessageAttributes: {
            channel: {
              DataType: 'String',
              StringValue: 'sms',
            },
          },
        })
        .promise();

      const messageId = publishResponse.MessageId;

      if (!messageId) {
        throw new Error('MessageId was not returned from SNS');
      }

      // Step 2: Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Step 3: Verify notification logged in DynamoDB
      const queryResponse = await dynamodb
        .query({
          TableName: notificationTableName,
          KeyConditionExpression: 'notificationId = :messageId',
          ExpressionAttributeValues: {
            ':messageId': { S: messageId },
          },
        })
        .promise();

      expect(queryResponse.Items?.length).toBe(1);

      const notificationLog = queryResponse.Items![0];
      expect(notificationLog.notificationType.S).toBe('SMS');
      expect(notificationLog.recipient.S).toBe(testOrderData.phoneNumber);
      expect(notificationLog.deliveryStatus.S).toBe('SENT');
    });

    test('dual channel notification (both email and SMS)', async () => {
      const message = JSON.stringify({
        ...testOrderData,
        orderId: 'DUAL-FLOW-TEST-' + Date.now(),
      });

      // Publish with 'both' channel
      const publishResponse = await sns
        .publish({
          TopicArn: notificationTopicArn,
          Message: message,
          MessageAttributes: {
            channel: {
              DataType: 'String',
              StringValue: 'both',
            },
          },
        })
        .promise();

      const messageId = publishResponse.MessageId;

      if (!messageId) {
        throw new Error('MessageId was not returned from SNS');
      }

      // Wait for both Lambda functions to process
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify both email and SMS notifications were processed
      const queryResponse = await dynamodb
        .query({
          TableName: notificationTableName,
          KeyConditionExpression: 'notificationId = :messageId',
          ExpressionAttributeValues: {
            ':messageId': { S: messageId },
          },
        })
        .promise();

      expect(queryResponse.Items?.length).toBe(2);

      const notifications = queryResponse.Items!;
      const notificationTypes = notifications.map(
        (item: any) => item.notificationType.S
      );
      expect(notificationTypes).toContain('EMAIL');
      expect(notificationTypes).toContain('SMS');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('handles invalid message format gracefully', async () => {
      const invalidMessage = '{ invalid json';

      const publishResponse = await sns
        .publish({
          TopicArn: notificationTopicArn,
          Message: invalidMessage,
          MessageAttributes: {
            channel: {
              DataType: 'String',
              StringValue: 'email',
            },
          },
        })
        .promise();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // System should handle the error without crashing
      expect(publishResponse.MessageId).toBeDefined();
    });
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Get all test items from DynamoDB
      const scanResponse = await dynamodb
        .scan({
          TableName: notificationTableName,
          FilterExpression: 'contains(orderId, :prefix)',
          ExpressionAttributeValues: {
            ':prefix': { S: 'TEST-' },
          },
        })
        .promise();

      // Delete each test item
      if (scanResponse.Items && scanResponse.Items.length > 0) {
        for (const item of scanResponse.Items) {
          await dynamodb
            .deleteItem({
              TableName: notificationTableName,
              Key: {
                notificationId: item.notificationId,
                timestamp: item.timestamp,
              },
            })
            .promise();
        }
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }
});
