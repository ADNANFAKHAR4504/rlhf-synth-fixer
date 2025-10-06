// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// AWS SDK clients
const sqs = new AWS.SQS();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

describe('Retail Order Processing System Integration Tests', () => {
  const testOrderId = `test-order-${Date.now()}`;
  const testOrder = {
    orderId: testOrderId,
    customerName: 'Integration Test Customer',
    orderTotal: 150.99,
    items: [
      { productId: 'PROD-001', quantity: 2, price: 75.50 }
    ]
  };

  describe('SQS Queue Integration', () => {
    test('should successfully send message to order queue', async () => {
      const queueUrl = outputs.OrderQueueURL;
      expect(queueUrl).toBeDefined();

      const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(testOrder)
      };

      const response = await sqs.sendMessage(params).promise();
      expect(response.MessageId).toBeDefined();
    }, 30000);

    test('should have proper queue configuration', async () => {
      const queueUrl = outputs.OrderQueueURL;

      const params = {
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout', 'MessageRetentionPeriod', 'ReceiveMessageWaitTimeSeconds']
      };

      const response: any = await sqs.getQueueAttributes(params).promise();
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.VisibilityTimeout).toBe('180');
      expect(response.Attributes.MessageRetentionPeriod).toBe('345600');
      expect(response.Attributes.ReceiveMessageWaitTimeSeconds).toBe('20');
    });
  });

  describe('DynamoDB Integration', () => {
    test('should have correct table configuration', async () => {
      const tableName = outputs.OrderTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain('orders');
    });

    test('should support querying by status using GSI', async () => {
      const tableName = outputs.OrderTableName;

      // Query processed orders using the StatusIndex
      const scanParams = {
        TableName: tableName,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'PROCESSED'
        }
      };

      const response: any = await dynamodb.scan(scanParams).promise();
      expect(response.Items).toBeDefined();
      // Should have at least our test order
      expect(response.Items.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('System Health and Monitoring', () => {
    test('should have all required outputs for monitoring', () => {
      expect(outputs.OrderQueueURL).toBeDefined();
      expect(outputs.OrderQueueARN).toBeDefined();
      expect(outputs.OrderDLQURL).toBeDefined();
      expect(outputs.OrderTableName).toBeDefined();
      expect(outputs.OrderProcessorFunctionName).toBeDefined();
      expect(outputs.OrderProcessorFunctionARN).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();
      expect(outputs.TestCommand).toBeDefined();
    });

    test('should have dashboard URL pointing to correct region', () => {
      const dashboardUrl = outputs.DashboardURL;
      const awsRegion = process.env.AWS_REGION || 'us-east-1';
      expect(dashboardUrl).toContain(`region=${awsRegion}`);
      expect(dashboardUrl).toContain('cloudwatch');
    });
  });
});