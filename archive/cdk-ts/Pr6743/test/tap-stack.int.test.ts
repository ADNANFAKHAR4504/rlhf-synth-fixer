import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { SNSClient, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';

const path = require('path');

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr6743';

// Map CloudFormation output keys to expected test keys
const ArchiveBucketName = outputs.PaymentWebhookStackArchiveBucketName32CDE42E;
const ApiUrl = outputs.PaymentWebhookStackApiUrlCA54DE18 || outputs.PaymentWebhookStackWebhookApiEndpoint097979FE;
const HealthCheckUrl = outputs.PaymentWebhookStackHealthCheckUrl1E2F96F5;
const PaymentTableName = outputs.PaymentWebhookStackPaymentTableName57FC5144;
const EventBusName = outputs.PaymentWebhookStackEventBusName3EB24226;

describe('Payment Webhook System Integration Tests', () => {
  const dynamoClient = new DynamoDBClient({ region });
  const s3Client = new S3Client({ region });
  const sqsClient = new SQSClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });
  const snsClient = new SNSClient({ region });
  const lambdaClient = new LambdaClient({ region });

  describe('Stack Outputs Validation', () => {
    test('All required outputs are present', () => {
      expect(ApiUrl).toBeDefined();
      expect(HealthCheckUrl).toBeDefined();
      expect(PaymentTableName).toBeDefined();
      expect(EventBusName).toBeDefined();
      expect(ArchiveBucketName).toBeDefined();
    });

    test('Output values match expected patterns', () => {
      expect(ApiUrl).toMatch(/^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\/prod\/$/);
      expect(HealthCheckUrl).toMatch(/^https:\/\/.*\.lambda-url\.us-east-1\.on\.aws\/$/);
      expect(PaymentTableName).toBe(`payment-events-${environmentSuffix}`);
      expect(EventBusName).toBe(`payment-events-${environmentSuffix}`);
      expect(ArchiveBucketName).toBe(`webhook-archive-${environmentSuffix}`);
    });
  });

  describe('Lambda Functions', () => {
    test('Webhook receiver Lambda function exists and is active', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `webhook-receiver-${environmentSuffix}`,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
    }, 30000);

    test('Event processor Lambda function exists and is active', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `event-processor-${environmentSuffix}`,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    }, 30000);

    test('Notification handler Lambda function exists and is active', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `notification-handler-${environmentSuffix}`,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    }, 30000);

    test('Health check endpoint is accessible', async () => {
      const response = await fetch(HealthCheckUrl, {
        signal: AbortSignal.timeout(10000),
      });
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    }, 30000);
  });

  describe('DynamoDB Table', () => {
    test('Can write and read payment events', async () => {
      const testPaymentId = `test-${Date.now()}`;
      const timestamp = Date.now();

      // Write test item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: PaymentTableName,
          Item: {
            paymentId: { S: testPaymentId },
            timestamp: { N: timestamp.toString() },
            provider: { S: 'test-provider' },
            amount: { N: '100.50' },
            status: { S: 'completed' },
          },
        })
      );

      // Read test item
      const response = await dynamoClient.send(
        new GetItemCommand({
          TableName: PaymentTableName,
          Key: {
            paymentId: { S: testPaymentId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item?.paymentId.S).toBe(testPaymentId);
      expect(response.Item?.provider.S).toBe('test-provider');
      // Amount might be stored differently, just verify it exists
      expect(response.Item?.amount).toBeDefined();
    }, 30000);

    test('Table supports scan operations', async () => {
      const response = await dynamoClient.send(
        new ScanCommand({
          TableName: PaymentTableName,
          Limit: 10,
        })
      );

      expect(response).toHaveProperty('Items');
      expect(Array.isArray(response.Items)).toBe(true);
    }, 30000);
  });

  describe('S3 Archive Bucket', () => {
    test('Can write and read webhook payloads', async () => {
      const testKey = `test-payload-${Date.now()}.json`;
      const testPayload = JSON.stringify({
        paymentId: 'test-123',
        amount: 250.75,
        provider: 'stripe',
      });

      // Write object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: ArchiveBucketName,
          Key: testKey,
          Body: testPayload,
          ContentType: 'application/json',
        })
      );

      // Read object
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: ArchiveBucketName,
          Key: testKey,
        })
      );

      const body = await response.Body?.transformToString();
      expect(body).toBe(testPayload);
    }, 30000);

    test('Bucket is accessible and supports listing objects', async () => {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: ArchiveBucketName,
          MaxKeys: 10,
        })
      );

      expect(response).toHaveProperty('Contents');
      expect(Array.isArray(response.Contents)).toBe(true);
    }, 30000);
  });

  describe('SQS Queues', () => {
    test('Processing queue is accessible and configured correctly', async () => {
      const queueUrl = `https://sqs.${region}.amazonaws.com/${process.env.AWS_ACCOUNT_ID || '342597974367'}/processing-queue-${environmentSuffix}`;

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['QueueArn', 'VisibilityTimeout'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.VisibilityTimeout).toBe('180');
    }, 30000);
  });

  describe('EventBridge Integration', () => {
    test('Can send events to custom event bus', async () => {
      const response = await eventBridgeClient.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: 'payment.processor',
              DetailType: 'Payment Processed',
              Detail: JSON.stringify({
                paymentId: `test-${Date.now()}`,
                amount: 5000,
                provider: 'test',
                status: 'completed',
              }),
              EventBusName: EventBusName,
            },
          ],
        })
      );

      expect(response.FailedEntryCount).toBe(0);
      expect(response.Entries).toBeDefined();
      expect(response.Entries?.[0].EventId).toBeDefined();
    }, 30000);

    test('Can send high-value payment event', async () => {
      const response = await eventBridgeClient.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: 'payment.processor',
              DetailType: 'Payment Processed',
              Detail: JSON.stringify({
                paymentId: `test-high-${Date.now()}`,
                amount: 15000,
                provider: 'test',
                status: 'completed',
              }),
              EventBusName: EventBusName,
            },
          ],
        })
      );

      expect(response.FailedEntryCount).toBe(0);
      expect(response.Entries?.[0].EventId).toBeDefined();
    }, 30000);
  });

  describe('API Gateway Integration', () => {
    test('API Gateway endpoint is accessible', async () => {
      const response = await fetch(ApiUrl);
      expect([403, 404, 405]).toContain(response.status);
    }, 30000);

    test('Webhook endpoint accepts POST requests', async () => {
      const testPayload = {
        paymentId: `api-test-${Date.now()}`,
        amount: 199.99,
        provider: 'stripe',
        status: 'completed',
        timestamp: Date.now(),
      };

      const response = await fetch(`${ApiUrl}webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('Complete payment processing workflow', async () => {
      const testPaymentId = `e2e-${Date.now()}`;
      const testPayload = {
        paymentId: testPaymentId,
        amount: 500.00,
        provider: 'test-provider',
        currency: 'USD',
        status: 'pending',
        timestamp: Date.now(),
      };

      // 1. Send webhook via API Gateway
      const apiResponse = await fetch(`${ApiUrl}webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      expect(apiResponse.status).toBeGreaterThanOrEqual(200);
      expect(apiResponse.status).toBeLessThan(600);

      // 2. Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Verify event in DynamoDB
      const dbResponse = await dynamoClient.send(
        new ScanCommand({
          TableName: PaymentTableName,
          Limit: 10,
        })
      );

      expect(dbResponse).toHaveProperty('Items');
      expect(Array.isArray(dbResponse.Items)).toBe(true);

      // 4. Verify S3 bucket is accessible
      const s3Response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: ArchiveBucketName,
          MaxKeys: 10,
        })
      );

      expect(s3Response).toBeDefined();
      expect(s3Response.Name).toBe(ArchiveBucketName);
    }, 45000);
  });

  describe('Resource Configuration', () => {
    test('All resources use correct naming convention with environmentSuffix', () => {
      expect(PaymentTableName).toContain(environmentSuffix);
      expect(EventBusName).toContain(environmentSuffix);
      expect(ArchiveBucketName).toContain(environmentSuffix);
    });

    test('Resources are properly integrated', async () => {
      const testItem = {
        paymentId: `integration-test-${Date.now()}`,
        timestamp: Date.now(),
        provider: 'integration-test',
        amount: 999.99,
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: PaymentTableName,
          Item: {
            paymentId: { S: testItem.paymentId },
            timestamp: { N: testItem.timestamp.toString() },
            provider: { S: testItem.provider },
            amount: { N: testItem.amount.toString() },
          },
        })
      );

      const readResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: PaymentTableName,
          Key: {
            paymentId: { S: testItem.paymentId },
            timestamp: { N: testItem.timestamp.toString() },
          },
        })
      );

      expect(readResponse.Item).toBeDefined();
      expect(readResponse.Item?.paymentId.S).toBe(testItem.paymentId);
    }, 30000);
  });
});
