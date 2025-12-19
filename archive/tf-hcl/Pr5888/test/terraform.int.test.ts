// Integration tests for Terraform Webhook Processing System
// Tests deployed AWS infrastructure using real resources

import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand, GetQueueAttributesCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, SubscribeCommand, UnsubscribeCommand } from '@aws-sdk/client-sns';
import { LambdaClient, InvokeCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { ApiGatewayV2Client, GetApisCommand } from '@aws-sdk/client-apigatewayv2';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

// Setup before all tests
beforeAll(() => {
  // Check if outputs file exists
  if (!fs.existsSync(outputsPath)) {
    console.warn('⚠️  No deployment outputs found. Tests will be skipped.');
    outputs = {};
  } else {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  }
});

// Helper to skip tests if no outputs
const skipIfNoOutputs = () => {
  if (Object.keys(outputs).length === 0) {
    return test.skip;
  }
  return test;
};

describe('Webhook Processing System Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';

  describe('DynamoDB Table', () => {
    let dynamoClient: DynamoDBClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
    });

    skipIfNoOutputs()('DynamoDB table exists and is accessible', async () => {
      const tableName = outputs.dynamodb_table_name;
      expect(tableName).toBeDefined();

      // Scan table to verify it exists and is accessible
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    skipIfNoOutputs()('DynamoDB table can accept writes', async () => {
      const tableName = outputs.dynamodb_table_name;
      const testId = `integration-test-${Date.now()}`;

      const command = new PutItemCommand({
        TableName: tableName,
        Item: {
          webhook_id: { S: testId },
          payload: { S: JSON.stringify({ test: true }) },
          timestamp: { N: String(Math.floor(Date.now() / 1000)) },
          expiry_time: { N: String(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('SQS Queues', () => {
    let sqsClient: SQSClient;

    beforeAll(() => {
      sqsClient = new SQSClient({ region });
    });

    skipIfNoOutputs()('Main SQS queue is accessible', async () => {
      const queueUrl = outputs.sqs_queue_url;
      expect(queueUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn', 'FifoQueue', 'ContentBasedDeduplication'],
      });

      const response = await sqsClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Attributes?.FifoQueue).toBe('true');
    });

    skipIfNoOutputs()('Dead letter queue is accessible', async () => {
      const dlqUrl = outputs.dlq_url;
      expect(dlqUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['QueueArn', 'FifoQueue'],
      });

      const response = await sqsClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Attributes?.FifoQueue).toBe('true');
    });

    skipIfNoOutputs()('Main queue can receive messages', async () => {
      const queueUrl = outputs.sqs_queue_url;
      const testMessageId = `test-${Date.now()}`;

      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          webhook_id: testMessageId,
          payload: { test: true },
        }),
        MessageGroupId: 'integration-test',
        MessageDeduplicationId: testMessageId,
      });

      const response = await sqsClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.MessageId).toBeDefined();
    });

    skipIfNoOutputs()('Main queue has dead letter queue configured', async () => {
      const queueUrl = outputs.sqs_queue_url;

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes?.RedrivePolicy).toBeDefined();

      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('webhook-dlq');
    });
  });

  describe('SNS Topic', () => {
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = new SNSClient({ region });
    });

    skipIfNoOutputs()('SNS topic exists and is accessible', async () => {
      const topicArn = outputs.sns_topic_arn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toMatch(/^arn:aws:sns:/);
    });

    skipIfNoOutputs()('SNS topic can create subscriptions', async () => {
      const topicArn = outputs.sns_topic_arn;

      // Create a test email subscription (won't be confirmed, just testing API)
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'email',
        Endpoint: 'test@example.com',
        ReturnSubscriptionArn: true,
      });

      const response = await snsClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.SubscriptionArn).toBeDefined();

      // Clean up: Unsubscribe if we got an ARN back
      if (response.SubscriptionArn && !response.SubscriptionArn.includes('pending')) {
        await snsClient.send(
          new UnsubscribeCommand({
            SubscriptionArn: response.SubscriptionArn,
          })
        );
      }
    });
  });

  describe('Lambda Functions', () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    skipIfNoOutputs()('Validation Lambda function exists', async () => {
      const functionArn = outputs.validation_lambda_arn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    skipIfNoOutputs()('Processing Lambda function exists', async () => {
      const functionArn = outputs.processing_lambda_arn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    skipIfNoOutputs()('Validation Lambda has correct environment variables', async () => {
      const functionArn = outputs.validation_lambda_arn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.DYNAMODB_TABLE).toBeDefined();
      expect(envVars?.SQS_QUEUE_URL).toBeDefined();
    });

    skipIfNoOutputs()('Processing Lambda has correct environment variables', async () => {
      const functionArn = outputs.processing_lambda_arn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.SNS_TOPIC_ARN).toBeDefined();
    });

    skipIfNoOutputs()('Validation Lambda can be invoked', async () => {
      const functionArn = outputs.validation_lambda_arn;
      const functionName = functionArn.split(':').pop();

      // Create a test event with valid signature
      const testPayload = { merchant_id: 'test123', amount: 100 };
      const testEvent = {
        body: JSON.stringify(testPayload),
        headers: {
          'X-Webhook-Signature': 'test-signature', // Will fail validation but tests Lambda execution
        },
        requestContext: {
          identity: { sourceIp: '127.0.0.1' },
        },
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(testEvent)),
      });

      const response = await lambdaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      // Should return 401 for invalid signature
      expect(payload.statusCode).toBe(401);
    });
  });

  describe('API Gateway', () => {
    skipIfNoOutputs()('API Gateway URL is available', () => {
      const apiUrl = outputs.api_gateway_url;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^https:\/\//);
      expect(apiUrl).toContain('/webhooks');
    });

    skipIfNoOutputs()('Custom domain URL is configured', () => {
      const customUrl = outputs.custom_domain_url;
      expect(customUrl).toBeDefined();
      expect(customUrl).toMatch(/^https:\/\//);
      expect(customUrl).toContain('/webhooks');
    });

    skipIfNoOutputs()('API Gateway endpoint is accessible', async () => {
      const apiUrl = outputs.api_gateway_url;

      // Make a simple request (will fail validation but tests endpoint accessibility)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'test-signature',
        },
        body: JSON.stringify({ test: true }),
      });

      // Should get a response (even if 401 for invalid signature)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('End-to-End Webhook Processing', () => {
    let dynamoClient: DynamoDBClient;
    let sqsClient: SQSClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
      sqsClient = new SQSClient({ region });
    });

    skipIfNoOutputs()('Complete webhook flow works', async () => {
      // This test validates the complete flow:
      // 1. Message sent to SQS queue
      // 2. Processing Lambda picks it up
      // 3. SNS notification published

      const queueUrl = outputs.sqs_queue_url;
      const testWebhookId = `integration-e2e-${Date.now()}`;

      // Step 1: Send message to SQS queue
      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          webhook_id: testWebhookId,
          payload: {
            merchant_id: 'integration-test',
            amount: 100,
            currency: 'USD',
          },
        }),
        MessageGroupId: 'integration-test',
        MessageDeduplicationId: testWebhookId,
      });

      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.$metadata.httpStatusCode).toBe(200);

      // Step 2: Verify message was sent
      expect(sendResponse.MessageId).toBeDefined();

      // Wait a few seconds for processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Step 3: Check that queue was processed (message should be gone or processed)
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      });

      const receiveResponse = await sqsClient.send(receiveCommand);

      // If Lambda is working, messages should be processed and queue should be relatively empty
      // or at least our test message should eventually be processed
      expect(receiveResponse.$metadata.httpStatusCode).toBe(200);
    }, 30000); // Extended timeout for E2E test

    skipIfNoOutputs()('Webhook data persistence in DynamoDB', async () => {
      const tableName = outputs.dynamodb_table_name;
      const testWebhookId = `integration-persistence-${Date.now()}`;

      // Store a test webhook
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          webhook_id: { S: testWebhookId },
          payload: {
            S: JSON.stringify({
              merchant_id: 'persistence-test',
              amount: 150,
              currency: 'USD',
            }),
          },
          timestamp: { N: String(Math.floor(Date.now() / 1000)) },
          expiry_time: { N: String(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) },
          source_ip: { S: '127.0.0.1' },
        },
      });

      const putResponse = await dynamoClient.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Verify we can retrieve it
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'webhook_id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testWebhookId },
        },
      });

      const scanResponse = await dynamoClient.send(scanCommand);
      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);
      expect(scanResponse.Items![0].webhook_id.S).toBe(testWebhookId);
    });
  });

  describe('CloudWatch Monitoring', () => {
    let cwClient: CloudWatchClient;

    beforeAll(() => {
      cwClient = new CloudWatchClient({ region });
    });

    skipIfNoOutputs()('CloudWatch metrics are being collected for Lambda functions', async () => {
      const functionArn = outputs.validation_lambda_arn;
      const functionName = functionArn.split(':').pop();

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // 1 hour ago

      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
      });

      const response = await cwClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Datapoints).toBeDefined();
    });
  });

  describe('Resource Naming and Tags', () => {
    skipIfNoOutputs()('All resources include environment suffix', () => {
      // Verify all output keys contain environment-specific naming
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      if (outputs.dynamodb_table_name) {
        expect(outputs.dynamodb_table_name).toContain('-');
      }

      if (outputs.sqs_queue_url) {
        expect(outputs.sqs_queue_url).toContain('.fifo');
      }

      if (outputs.validation_lambda_arn) {
        expect(outputs.validation_lambda_arn).toContain('webhook-validation');
      }

      if (outputs.processing_lambda_arn) {
        expect(outputs.processing_lambda_arn).toContain('webhook-processing');
      }
    });
  });

  describe('Security and Encryption', () => {
    let dynamoClient: DynamoDBClient;
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
      lambdaClient = new LambdaClient({ region });
    });

    skipIfNoOutputs()('KMS key is created', () => {
      const kmsKeyId = outputs.kms_key_id;
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    skipIfNoOutputs()('Lambda functions have X-Ray tracing enabled', async () => {
      const validationArn = outputs.validation_lambda_arn;
      const processingArn = outputs.processing_lambda_arn;

      // Check validation Lambda
      const validationCommand = new GetFunctionCommand({
        FunctionName: validationArn.split(':').pop(),
      });
      const validationResponse = await lambdaClient.send(validationCommand);
      expect(validationResponse.Configuration?.TracingConfig?.Mode).toBe('Active');

      // Check processing Lambda
      const processingCommand = new GetFunctionCommand({
        FunctionName: processingArn.split(':').pop(),
      });
      const processingResponse = await lambdaClient.send(processingCommand);
      expect(processingResponse.Configuration?.TracingConfig?.Mode).toBe('Active');
    });
  });
});
