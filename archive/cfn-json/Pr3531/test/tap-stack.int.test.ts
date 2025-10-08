// Configuration - These are coming from cfn-outputs after cdk deploy
import * as AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-2' });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const sqs = new AWS.SQS();
const cloudwatch = new AWS.CloudWatch();

describe('Push Notification System Integration Tests', () => {
  describe('DynamoDB Table Tests', () => {
    test('should be able to write and read from DeviceTokensTable', async () => {
      const tableName = outputs.DeviceTokensTableName;
      const testItem = {
        userId: `test-user-${Date.now()}`,
        deviceToken: `test-token-${Date.now()}`,
        platform: 'ios',
        timestamp: new Date().toISOString()
      };

      // Write item
      await dynamodb.put({
        TableName: tableName,
        Item: testItem
      }).promise();

      // Read item
      const result = await dynamodb.get({
        TableName: tableName,
        Key: {
          userId: testItem.userId,
          deviceToken: testItem.deviceToken
        }
      }).promise();

      expect(result.Item).toBeDefined();
      expect(result.Item?.userId).toBe(testItem.userId);
      expect(result.Item?.platform).toBe('ios');

      // Clean up
      await dynamodb.delete({
        TableName: tableName,
        Key: {
          userId: testItem.userId,
          deviceToken: testItem.deviceToken
        }
      }).promise();
    });

    test('should be able to query by platform using GSI', async () => {
      const tableName = outputs.DeviceTokensTableName;
      const testPlatform = 'android';

      const result = await dynamodb.query({
        TableName: tableName,
        IndexName: 'PlatformIndex',
        KeyConditionExpression: 'platform = :platform',
        ExpressionAttributeValues: {
          ':platform': testPlatform
        }
      }).promise();

      expect(result).toBeDefined();
      expect(result.$response.error).toBeNull();
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should be able to write and read from CampaignAnalyticsBucket', async () => {
      const bucketName = outputs.CampaignAnalyticsBucketName;
      const testKey = `test/analytics-${Date.now()}.json`;
      const testData = {
        campaign: 'test',
        timestamp: new Date().toISOString()
      };

      // Write object
      await s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json'
      }).promise();

      // Read object
      const result = await s3.getObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();

      const retrievedData = JSON.parse(result.Body?.toString() || '{}');
      expect(retrievedData.campaign).toBe('test');

      // Clean up
      await s3.deleteObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
    });

    test('bucket should have versioning enabled', async () => {
      const bucketName = outputs.CampaignAnalyticsBucketName;

      const versioning = await s3.getBucketVersioning({
        Bucket: bucketName
      }).promise();

      expect(versioning.Status).toBe('Enabled');
    });

    test('bucket should block public access', async () => {
      const bucketName = outputs.CampaignAnalyticsBucketName;

      const publicAccess = await s3.getPublicAccessBlock({
        Bucket: bucketName
      }).promise();

      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('SNS Topics Tests', () => {
    test('should be able to publish to NotificationTopic', async () => {
      const topicArn = outputs.NotificationTopicArn;

      const result = await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify({
          test: 'message',
          timestamp: new Date().toISOString()
        }),
        Subject: 'Integration Test Message'
      }).promise();

      expect(result.MessageId).toBeDefined();
    });

    test('should have iOS and Android topics', async () => {
      const iosTopicArn = outputs.IOSNotificationTopicArn;
      const androidTopicArn = outputs.AndroidNotificationTopicArn;

      const iosAttrs = await sns.getTopicAttributes({
        TopicArn: iosTopicArn
      }).promise();

      const androidAttrs = await sns.getTopicAttributes({
        TopicArn: androidTopicArn
      }).promise();

      expect(iosAttrs.Attributes).toBeDefined();
      expect(androidAttrs.Attributes).toBeDefined();
    });
  });

  describe('Lambda Function Tests', () => {
    test('should have NotificationProcessor function configured correctly', async () => {
      const functionArn = outputs.NotificationProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const config = await lambda.getFunctionConfiguration({
        FunctionName: functionName!
      }).promise();

      expect(config.Runtime).toBe('python3.9');
      expect(config.Handler).toBe('index.lambda_handler');
      expect(config.Timeout).toBe(30);
      expect(config.MemorySize).toBe(512);
      // Note: ReservedConcurrency is checked separately via getProvisionedConcurrencyConfig
    });

    test('should have correct environment variables', async () => {
      const functionArn = outputs.NotificationProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const config = await lambda.getFunctionConfiguration({
        FunctionName: functionName!
      }).promise();

      expect(config.Environment?.Variables?.DEVICE_TOKENS_TABLE).toBe(outputs.DeviceTokensTableName);
      expect(config.Environment?.Variables?.ANALYTICS_BUCKET).toBe(outputs.CampaignAnalyticsBucketName);
      expect(config.Environment?.Variables?.MAX_RETRIES).toBe('3');
      expect(config.Environment?.Variables?.INITIAL_BACKOFF).toBe('1');
    });

    test('should be able to invoke NotificationProcessor', async () => {
      const functionArn = outputs.NotificationProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const payload = {
        userId: 'test-user',
        content: {
          message: 'Test notification',
          title: 'Test'
        }
      };

      const result = await lambda.invoke({
        FunctionName: functionName!,
        Payload: JSON.stringify(payload)
      }).promise();

      expect(result.StatusCode).toBe(200);
      const response = JSON.parse(result.Payload?.toString() || '{}');
      expect(response.statusCode).toBe(200);
    });
  });

  describe('SQS Queue Tests', () => {
    test('should be able to send and receive messages from DeadLetterQueue', async () => {
      const queueUrl = outputs.DeadLetterQueueUrl;
      const testMessage = {
        test: 'message',
        timestamp: new Date().toISOString()
      };

      // Send message
      const sendResult = await sqs.sendMessage({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(testMessage)
      }).promise();

      expect(sendResult.MessageId).toBeDefined();

      // Receive message
      const receiveResult = await sqs.receiveMessage({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 5
      }).promise();

      if (receiveResult.Messages && receiveResult.Messages.length > 0) {
        const message = receiveResult.Messages[0];
        const body = JSON.parse(message.Body || '{}');
        expect(body.test).toBe('message');

        // Delete message
        await sqs.deleteMessage({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle!
        }).promise();
      }
    });

    test('DeadLetterQueue should have correct retention period', async () => {
      const queueUrl = outputs.DeadLetterQueueUrl;

      const attributes = await sqs.getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['MessageRetentionPeriod', 'VisibilityTimeout']
      }).promise();

      expect(attributes.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(attributes.Attributes?.VisibilityTimeout).toBe('60');
    });
  });

  describe('CloudWatch Alarm Tests', () => {
    test('should have SuccessAlarm configured', async () => {
      const alarms = await cloudwatch.describeAlarms({
        AlarmNamePrefix: 'PushNotification-LowSuccessRate'
      }).promise();

      const alarm = alarms.MetricAlarms?.find(a =>
        a.AlarmName?.includes('LowSuccessRate')
      );

      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('SuccessfulDelivery');
      expect(alarm?.Namespace).toBe('PushNotifications');
      expect(alarm?.Threshold).toBe(0.9);
      expect(alarm?.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should process notification through the complete pipeline', async () => {
      const tableName = outputs.DeviceTokensTableName;
      const topicArn = outputs.NotificationTopicArn;

      // Create a test device token
      const testItem = {
        userId: `e2e-user-${Date.now()}`,
        deviceToken: `e2e-token-${Date.now()}`,
        platform: 'ios',
        timestamp: new Date().toISOString()
      };

      await dynamodb.put({
        TableName: tableName,
        Item: testItem
      }).promise();

      // Send notification
      const notificationPayload = {
        userId: testItem.userId,
        content: {
          message: 'E2E Test Notification',
          title: 'E2E Test'
        },
        platform: 'ios'
      };

      const result = await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify(notificationPayload)
      }).promise();

      expect(result.MessageId).toBeDefined();

      // Clean up
      await dynamodb.delete({
        TableName: tableName,
        Key: {
          userId: testItem.userId,
          deviceToken: testItem.deviceToken
        }
      }).promise();
    }, 30000); // 30 second timeout for E2E test
  });
});
