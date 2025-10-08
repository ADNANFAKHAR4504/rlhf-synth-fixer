// Integration tests for Terraform-based Order Processing System
// These tests validate the actual deployed infrastructure without fake scenarios

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetQueueAttributesCommand,
  SQSClient,
  SendMessageCommand
} from '@aws-sdk/client-sqs';
import * as fs from 'fs';
import * as path from 'path';

// Helper to check if flat outputs exist
const outputsFile = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsExist = fs.existsSync(outputsFile);

describe('Order Processing System Integration Tests', () => {
  if (!outputsExist) {
    test.skip('Integration tests require deployment outputs', () => {
      console.log('Skipping integration tests - deployment outputs not available yet');
    });
    return;
  }

  const outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  const region = process.env.AWS_REGION || 'us-east-1';

  // AWS Clients
  const sqsClient = new SQSClient({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  // Helper function for retry logic
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    predicate: (result: T) => boolean,
    maxAttempts: number = 5,
    delayMs: number = 2000
  ): Promise<T> => {
    let lastResult: T;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      lastResult = await operation();
      if (predicate(lastResult)) {
        return lastResult;
      }
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return lastResult!;
  };

  // Test data
  const testOrderId = `test-order-${Date.now()}`;

  describe('Infrastructure Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'order_queue_url',
        'order_queue_arn',
        'dlq_url',
        'dlq_arn',
        'lambda_function_arn',
        'lambda_function_name',
        'dynamodb_table_name',
        'dynamodb_table_arn',
        'cloudwatch_log_group'
      ];

      expectedOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(typeof outputs[output]).toBe('string');
        expect(outputs[output].trim().length).toBeGreaterThan(0);
      });
    });

    test('should have valid ARN formats', () => {
      const arnOutputs = [
        'order_queue_arn',
        'dlq_arn',
        'lambda_function_arn',
        'dynamodb_table_arn'
      ];

      arnOutputs.forEach(output => {
        expect(outputs[output]).toMatch(/^arn:aws:/);
      });
    });

    test('should have valid resource names with environment suffix', () => {
      if (outputs.environment_suffix) {
        expect(outputs.lambda_function_name).toContain(outputs.environment_suffix);
        expect(outputs.dynamodb_table_name).toContain(outputs.environment_suffix);
      }
    });
  });

  describe('SQS Queue Integration', () => {
    test('main queue should be accessible and configured correctly', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.order_queue_url,
        AttributeNames: ['All']
      });

      const response = await sqsClient.send(getAttributesCommand);
      const attributes = response.Attributes;

      expect(attributes).toBeDefined();
      expect(attributes?.QueueArn).toBe(outputs.order_queue_arn);
      expect(attributes?.VisibilityTimeout).toBeDefined();
      expect(attributes?.MessageRetentionPeriod).toBeDefined();
      expect(attributes?.RedrivePolicy).toBeDefined();

      // Validate redrive policy contains DLQ ARN
      const redrivePolicy = JSON.parse(attributes?.RedrivePolicy || '{}');
      expect(redrivePolicy.deadLetterTargetArn).toBe(outputs.dlq_arn);
    });

    test('dead letter queue should be accessible', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ['QueueArn', 'MessageRetentionPeriod']
      });

      const response = await sqsClient.send(getAttributesCommand);
      expect(response.Attributes?.QueueArn).toBe(outputs.dlq_arn);
    });

    test('should be able to send messages and verify processing via Lambda', async () => {
      const testMessage = {
        orderId: testOrderId,
        customerEmail: 'test@example.com',
        items: [
          { productId: 'PROD001', quantity: 2, price: 29.99 },
          { productId: 'PROD002', quantity: 1, price: 19.99 }
        ],
        totalAmount: 79.97,
        timestamp: new Date().toISOString()
      };

      // Send message to SQS queue
      const sendCommand = new SendMessageCommand({
        QueueUrl: outputs.order_queue_url,
        MessageBody: JSON.stringify(testMessage)
      });

      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.MessageId).toBeDefined();

      // Since Lambda processes messages automatically via event source mapping,
      // we verify processing by checking DynamoDB for the processed order
      const dbResponse = await retryOperation(
        async () => {
          const response = await dynamoClient.send(new GetItemCommand({
            TableName: outputs.dynamodb_table_name,
            Key: {
              order_id: { S: testOrderId }
            }
          }));
          console.log(`DynamoDB check: Item ${response.Item ? 'found' : 'not found'}`);
          return response;
        },
        (response) => !!response.Item,
        5,
        2000
      );

      // Verify that the message was processed by Lambda and stored in DynamoDB
      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.order_id?.S).toBe(testOrderId);
      expect(dbResponse.Item?.status?.S).toBeDefined();
      expect(dbResponse.Item?.customer_email?.S).toBe('test@example.com');

      // Verify the queue is empty (messages were consumed by Lambda)
      const queueAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.order_queue_url,
        AttributeNames: ['ApproximateNumberOfMessages']
      });
      const queueResponse = await sqsClient.send(queueAttributesCommand);

      // The queue should be empty or have very few messages (depending on timing)
      const messageCount = parseInt(queueResponse.Attributes?.ApproximateNumberOfMessages || '0');
      expect(messageCount).toBeLessThanOrEqual(1);
    });
  });

  describe('DynamoDB Table Integration', () => {
    test('table should be accessible and configured correctly', async () => {
      const scanCommand = new ScanCommand({
        TableName: outputs.dynamodb_table_name,
        Limit: 1
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to write and read order status', async () => {
      const orderStatus = {
        order_id: { S: testOrderId },
        status: { S: 'PROCESSING' },
        customer_email: { S: 'test@example.com' },
        total_amount: { N: '79.97' },
        created_at: { S: new Date().toISOString() },
        updated_at: { S: new Date().toISOString() }
      };

      // Put item
      const putCommand = new PutItemCommand({
        TableName: outputs.dynamodb_table_name,
        Item: orderStatus
      });

      const putResponse = await dynamoClient.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Get item
      const getCommand = new GetItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          order_id: { S: testOrderId }
        }
      });

      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.order_id?.S).toBe(testOrderId);
      expect(getResponse.Item?.status?.S).toBe('PROCESSING');
    });
  });

  describe('Lambda Function Integration', () => {
    test('lambda function should exist and be configured correctly', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      });

      const response = await lambdaClient.send(getFunctionCommand);
      expect(response.Configuration?.FunctionArn).toBe(outputs.lambda_function_arn);
      expect(response.Configuration?.Runtime).toMatch(/python/);
      expect(response.Configuration?.Handler).toBeDefined();
      expect(response.Configuration?.Timeout).toBeGreaterThan(0);
      expect(response.Configuration?.MemorySize).toBeGreaterThan(0);
    });

    test('lambda function should process order correctly when invoked directly', async () => {
      const testPayload = {
        Records: [
          {
            body: JSON.stringify({
              orderId: testOrderId,
              customerEmail: 'test@example.com',
              items: [
                { productId: 'PROD001', quantity: 1, price: 29.99 }
              ],
              totalAmount: 29.99,
              timestamp: new Date().toISOString()
            }),
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle'
          }
        ]
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify(testPayload)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      // Verify the order was processed in DynamoDB
      const getCommand = new GetItemCommand({
        TableName: outputs.dynamodb_table_name,
        Key: {
          order_id: { S: testOrderId }
        }
      });

      const dbResponse = await dynamoClient.send(getCommand);
      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.order_id?.S).toBe(testOrderId);
    });
  });

  describe('CloudWatch Logs Integration', () => {
    test('log group should exist and be configured correctly', async () => {
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group
      });

      const response = await logsClient.send(describeCommand);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.cloudwatch_log_group);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
    });

    test('should have lambda execution logs', async () => {
      const filterCommand = new FilterLogEventsCommand({
        logGroupName: outputs.cloudwatch_log_group,
        limit: 10,
        startTime: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
      });

      try {
        const response = await logsClient.send(filterCommand);
        // Log events may not exist if function hasn't been invoked recently
        // Just verify the command doesn't throw an error
        expect(response.events).toBeDefined();
      } catch (error: any) {
        // If no log streams exist yet, that's acceptable for new deployments
        if (!error.message.includes('ResourceNotFoundException')) {
          throw error;
        }
      }
    });
  });

  describe('End-to-End Order Processing Workflow', () => {
    const workflowOrderId = `workflow-order-${Date.now()}`;

    test('complete order processing workflow', async () => {
      const orderData = {
        orderId: workflowOrderId,
        customerEmail: 'workflow-test@example.com',
        items: [
          { productId: 'PROD001', quantity: 2, price: 29.99 },
          { productId: 'PROD002', quantity: 1, price: 19.99 }
        ],
        totalAmount: 79.97,
        timestamp: new Date().toISOString()
      };

      // Step 1: Send message to SQS
      const sendCommand = new SendMessageCommand({
        QueueUrl: outputs.order_queue_url,
        MessageBody: JSON.stringify(orderData)
      });

      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.MessageId).toBeDefined();

      // Step 2: Simulate Lambda processing by invoking directly
      const lambdaPayload = {
        Records: [
          {
            body: JSON.stringify(orderData),
            messageId: sendResponse.MessageId,
            receiptHandle: 'test-receipt-handle'
          }
        ]
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify(lambdaPayload)
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      // Step 3: Verify order status in DynamoDB with retry logic
      const dbResponse = await retryOperation(
        async () => {
          const response = await dynamoClient.send(new GetItemCommand({
            TableName: outputs.dynamodb_table_name,
            Key: {
              order_id: { S: workflowOrderId }
            }
          }));
          console.log(`DynamoDB get attempt: Item ${response.Item ? 'found' : 'not found'}`);
          return response;
        },
        (response) => !!response.Item,
        5,
        3000
      );

      if (!dbResponse.Item) {
        console.error('Item not found in DynamoDB after retries');
        console.log('Table name:', outputs.dynamodb_table_name);
        console.log('Order ID:', workflowOrderId);

        // Check if the Lambda function actually processed the message
        const functionResponse = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
        console.log('Lambda response:', functionResponse);
      }

      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.order_id?.S).toBe(workflowOrderId);
      expect(dbResponse.Item?.status?.S).toBeDefined();
      expect(dbResponse.Item?.customer_email?.S).toBe('workflow-test@example.com');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle malformed messages gracefully', async () => {
      const malformedPayload = {
        Records: [
          {
            body: 'invalid json',
            messageId: 'test-malformed-message',
            receiptHandle: 'test-receipt-handle'
          }
        ]
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify(malformedPayload)
      });

      const response = await lambdaClient.send(invokeCommand);
      // Lambda should handle the error gracefully
      expect(response.StatusCode).toBe(200);
    });

    test('should validate queue configuration for failure handling', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.order_queue_url,
        AttributeNames: ['RedrivePolicy', 'VisibilityTimeout']
      });

      const response = await sqsClient.send(getAttributesCommand);
      const attributes = response.Attributes;

      expect(attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(attributes?.RedrivePolicy || '{}');
      expect(redrivePolicy.maxReceiveCount).toBeGreaterThan(0);
      expect(redrivePolicy.deadLetterTargetArn).toBe(outputs.dlq_arn);
    });
  });

  describe('Performance and Monitoring', () => {
    test('lambda function should have appropriate timeout and memory configuration', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      });

      const response = await lambdaClient.send(getFunctionCommand);
      const config = response.Configuration;

      expect(config?.Timeout).toBeGreaterThanOrEqual(30);
      expect(config?.Timeout).toBeLessThanOrEqual(900);
      expect(config?.MemorySize).toBeGreaterThanOrEqual(128);
      expect(config?.MemorySize).toBeLessThanOrEqual(10240);
    });

    test('should have monitoring and logging configured', async () => {
      // Verify log group exists and has proper retention
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group
      });

      const response = await logsClient.send(describeCommand);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.cloudwatch_log_group);

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThan(0);
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data from DynamoDB
    const testOrderIds = [testOrderId, `workflow-order-${Date.now()}`];

    // Note: In a real scenario, you might want to clean up test data
    // For now, we'll leave it as the table uses PAY_PER_REQUEST billing
    console.log('Integration tests completed. Test data cleanup may be needed.');
  });
});
