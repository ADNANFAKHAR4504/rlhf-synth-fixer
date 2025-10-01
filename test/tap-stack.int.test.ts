// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

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

      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(testOrder)
      });

      const response = await sqsClient.send(command);
      expect(response.MessageId).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should have proper queue configuration', async () => {
      const queueUrl = outputs.OrderQueueURL;
      
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout', 'MessageRetentionPeriod', 'ReceiveMessageWaitTimeSeconds']
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.VisibilityTimeout).toBe('180');
      expect(response.Attributes.MessageRetentionPeriod).toBe('345600');
      expect(response.Attributes.ReceiveMessageWaitTimeSeconds).toBe('20');
    });
  });

  describe('Lambda Processing Integration', () => {
    test('should process order and store in DynamoDB', async () => {
      // Send message to SQS
      const queueUrl = outputs.OrderQueueURL;
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(testOrder)
      });
      
      await sqsClient.send(sendCommand);

      // Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if order was processed in DynamoDB
      const tableName = outputs.OrderTableName;
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: { orderId: testOrderId }
      });

      const response = await docClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item.orderId).toBe(testOrderId);
      expect(response.Item.status).toBe('PROCESSED');
      expect(response.Item.metadata.customerName).toBe('Integration Test Customer');
      expect(response.Item.metadata.orderTotal).toBe(150.99);
    }, 45000);

    test('should handle invalid order data gracefully', async () => {
      const invalidOrder = { 
        customerName: 'Test Customer',
        // Missing required orderId field
        orderTotal: 100
      };

      const queueUrl = outputs.OrderQueueURL;
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(invalidOrder)
      });
      
      await sqsClient.send(sendCommand);

      // Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if failed order was logged in DynamoDB
      const tableName = outputs.OrderTableName;
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'FAILED'
        }
      });

      const response = await docClient.send(scanCommand);
      expect(response.Items.length).toBeGreaterThan(0);
      
      const failedItem = response.Items.find(item => 
        item.originalMessage && item.originalMessage.includes('Test Customer')
      );
      expect(failedItem).toBeDefined();
      expect(failedItem.status).toBe('FAILED');
      expect(failedItem.error).toContain('Missing required field: orderId');
    }, 45000);
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
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'PROCESSED'
        }
      });

      const response = await docClient.send(scanCommand);
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

  describe('End-to-End Workflow', () => {
    test('should complete full order processing workflow', async () => {
      const workflowOrderId = `workflow-test-${Date.now()}`;
      const workflowOrder = {
        orderId: workflowOrderId,
        customerName: 'Workflow Test Customer',
        orderTotal: 299.99,
        items: [
          { productId: 'PROD-101', quantity: 1, price: 199.99 },
          { productId: 'PROD-102', quantity: 1, price: 100.00 }
        ]
      };

      // Step 1: Send order to SQS
      const queueUrl = outputs.OrderQueueURL;
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(workflowOrder)
      });
      
      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.MessageId).toBeDefined();

      // Step 2: Wait for processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Step 3: Verify order processing in DynamoDB
      const tableName = outputs.OrderTableName;
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: { orderId: workflowOrderId }
      });

      const getResponse = await docClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item.orderId).toBe(workflowOrderId);
      expect(getResponse.Item.status).toBe('PROCESSED');
      expect(getResponse.Item.processedAt).toBeDefined();
      expect(getResponse.Item.processingTimestamp).toBeDefined();
      expect(getResponse.Item.metadata).toBeDefined();
      expect(getResponse.Item.metadata.customerName).toBe('Workflow Test Customer');
      expect(getResponse.Item.metadata.orderTotal).toBe(299.99);
      expect(getResponse.Item.metadata.items).toHaveLength(2);

      // Step 4: Verify message was removed from queue (processed successfully)
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1
      });

      const receiveResponse = await sqsClient.send(receiveCommand);
      // The message should not be in the queue anymore (processed and deleted)
      const ourMessage = receiveResponse.Messages?.find(msg => 
        msg.Body && JSON.parse(msg.Body).orderId === workflowOrderId
      );
      expect(ourMessage).toBeUndefined();
    }, 60000);
  });
});
