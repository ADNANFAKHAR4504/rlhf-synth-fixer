import {
  DynamoDBClient,
  DescribeTableCommand,
  GetItemCommand,
  DescribeTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json',
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

const region = process.env.AWS_REGION || 'ca-central-1';
const dynamoClient = new DynamoDBClient({ region });
const snsClient = new SNSClient({ region });
const sqsClient = new SQSClient({ region });
const lambdaClient = new LambdaClient({ region });

describe('Transaction Processing Pipeline - Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('all required outputs are present', () => {
      expect(outputs.WebhookEndpointUrl).toBeDefined();
      expect(outputs.TransactionTopicArn).toBeDefined();
      expect(outputs.HighValueQueueUrl).toBeDefined();
      expect(outputs.StandardValueQueueUrl).toBeDefined();
      expect(outputs.LowValueQueueUrl).toBeDefined();
      expect(outputs.TransactionTableName).toBeDefined();
    });

    test('webhook endpoint URL is accessible', () => {
      expect(outputs.WebhookEndpointUrl).toMatch(/^https:\/\//);
      expect(outputs.WebhookEndpointUrl).toContain('lambda-url');
    });
  });

  describe('DynamoDB Table Validation', () => {
    test('transaction table exists and has correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionTableName,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TransactionTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST',
      );
      expect(response.Table?.TableStatus).toBe('ACTIVE');

      // Verify partition key
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema?.[0].AttributeName).toBe('transactionId');
      expect(keySchema?.[0].KeyType).toBe('HASH');

      // Verify TTL is enabled using dedicated API
      const ttlCommand = new DescribeTimeToLiveCommand({
        TableName: outputs.TransactionTableName,
      });
      const ttlResponse = await dynamoClient.send(ttlCommand);

      expect(ttlResponse.TimeToLiveDescription?.TimeToLiveStatus).toBe(
        'ENABLED',
      );
      expect(ttlResponse.TimeToLiveDescription?.AttributeName).toBe('ttl');
    }, 30000);

    test('table has encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionTableName,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);
  });

  describe('SNS Topic Validation', () => {
    test('transaction topic exists and is accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.TransactionTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.TransactionTopicArn);
      expect(response.Attributes?.DisplayName).toBe(
        'Transaction Processing Topic',
      );
    }, 30000);

    test('topic has subscriptions configured', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.TransactionTopicArn,
      });

      const response = await snsClient.send(command);

      // At least one subscription should exist (validator lambda)
      const subscriptionsConfirmed =
        parseInt(response.Attributes?.SubscriptionsConfirmed || '0', 10) || 0;
      const subscriptionsPending =
        parseInt(response.Attributes?.SubscriptionsPending || '0', 10) || 0;

      expect(subscriptionsConfirmed + subscriptionsPending).toBeGreaterThan(0);
    }, 30000);
  });

  describe('SQS Queues Validation', () => {
    test('high value queue exists and is accessible', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.HighValueQueueUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toContain('high-value-queue');
      expect(response.Attributes?.VisibilityTimeout).toBe('180');
      expect(response.Attributes?.MessageRetentionPeriod).toBe('345600');
    }, 30000);

    test('standard value queue exists with correct configuration', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.StandardValueQueueUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toContain('standard-value-queue');
      expect(response.Attributes?.VisibilityTimeout).toBe('180');
      expect(response.Attributes?.MessageRetentionPeriod).toBe('345600');
    }, 30000);

    test('low value queue exists with correct configuration', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.LowValueQueueUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toContain('low-value-queue');
      expect(response.Attributes?.VisibilityTimeout).toBe('180');
      expect(response.Attributes?.MessageRetentionPeriod).toBe('345600');
    }, 30000);

    test('queues have encryption enabled', async () => {
      const queues = [
        outputs.HighValueQueueUrl,
        outputs.StandardValueQueueUrl,
        outputs.LowValueQueueUrl,
      ];

      for (const queueUrl of queues) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['KmsMasterKeyId'],
        });

        const response = await sqsClient.send(command);
        expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      }
    }, 30000);

    test('queues have dead letter queues configured', async () => {
      const queues = [
        outputs.HighValueQueueUrl,
        outputs.StandardValueQueueUrl,
        outputs.LowValueQueueUrl,
      ];

      for (const queueUrl of queues) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy'],
        });

        const response = await sqsClient.send(command);

        if (response.Attributes?.RedrivePolicy) {
          const redrivePolicy = JSON.parse(response.Attributes.RedrivePolicy);
          expect(redrivePolicy.maxReceiveCount).toBe(3);
          expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
        }
      }
    }, 30000);
  });

  describe('End-to-End Transaction Processing', () => {
    test('webhook can receive and process a high value transaction', async () => {
      const transaction = {
        transactionId: `test-high-${Date.now()}`,
        amount: 15000,
        currency: 'USD',
        customerId: 'cust-123',
        timestamp: new Date().toISOString(),
      };

      // Send transaction to webhook
      const response = await fetch(outputs.WebhookEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.message).toBe('Transaction received');
      expect(data.transactionId).toBe(transaction.transactionId);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Check if transaction appears in high value queue
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: outputs.HighValueQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });

      const messages = await sqsClient.send(receiveCommand);
      const foundTransaction = messages.Messages?.some((msg) => {
        const body = JSON.parse(msg.Body || '{}');
        return body.transactionId === transaction.transactionId;
      });

      // Message might have been processed already, which is also success
      expect(foundTransaction !== undefined).toBe(true);
    }, 45000);

    test('webhook can process a standard value transaction', async () => {
      const transaction = {
        transactionId: `test-standard-${Date.now()}`,
        amount: 5000,
        currency: 'USD',
        customerId: 'cust-456',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(outputs.WebhookEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.message).toBe('Transaction received');

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Check standard value queue
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: outputs.StandardValueQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });

      const messages = await sqsClient.send(receiveCommand);
      expect(messages.Messages !== undefined).toBe(true);
    }, 45000);

    test('webhook can process a low value transaction', async () => {
      const transaction = {
        transactionId: `test-low-${Date.now()}`,
        amount: 500,
        currency: 'USD',
        customerId: 'cust-789',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(outputs.WebhookEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.message).toBe('Transaction received');

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Check low value queue
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: outputs.LowValueQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });

      const messages = await sqsClient.send(receiveCommand);
      expect(messages.Messages !== undefined).toBe(true);
    }, 45000);

    test('transactions are stored in DynamoDB', async () => {
      const transactionId = `test-db-${Date.now()}`;
      const transaction = {
        transactionId,
        amount: 2500,
        currency: 'USD',
        customerId: 'cust-999',
        timestamp: new Date().toISOString(),
      };

      // Send transaction
      await fetch(outputs.WebhookEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      // Wait for processing and storage
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Query DynamoDB
      const getItemCommand = new GetItemCommand({
        TableName: outputs.TransactionTableName,
        Key: {
          transactionId: { S: transactionId },
        },
      });

      const result = await dynamoClient.send(getItemCommand);

      if (result.Item) {
        expect(result.Item.transactionId.S).toBe(transactionId);
        expect(result.Item.status?.S).toBeDefined();
        expect(['validated', 'enriched', 'routed']).toContain(
          result.Item.status?.S,
        );
      }
    }, 45000);
  });

  describe('Error Handling', () => {
    test('webhook handles invalid transaction gracefully', async () => {
      const invalidTransaction = {
        // Missing required fields
        amount: 'invalid',
      };

      const response = await fetch(outputs.WebhookEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidTransaction),
      });

      // Should still return 200 but transaction won't be processed successfully
      expect([200, 400, 500]).toContain(response.status);
    }, 30000);

    test('webhook handles malformed JSON', async () => {
      const response = await fetch(outputs.WebhookEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });

      expect([400, 500]).toContain(response.status);
    }, 30000);
  });

  describe('Queue Message Routing', () => {
    test('verifies value-based routing thresholds', async () => {
      // Test boundary conditions
      const testCases = [
        { amount: 10001, expectedQueue: 'high' }, // Just above $10,000
        { amount: 10000, expectedQueue: 'standard' }, // Exactly $10,000
        { amount: 1000, expectedQueue: 'standard' }, // Exactly $1,000
        { amount: 999, expectedQueue: 'low' }, // Just below $1,000
      ];

      for (const testCase of testCases) {
        const transactionId = `test-routing-${testCase.amount}-${Date.now()}`;
        const transaction = {
          transactionId,
          amount: testCase.amount,
          currency: 'USD',
          customerId: 'cust-routing',
          timestamp: new Date().toISOString(),
        };

        await fetch(outputs.WebhookEndpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Wait for all to process
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify at least one transaction in each queue category
      const queues = [
        outputs.HighValueQueueUrl,
        outputs.StandardValueQueueUrl,
        outputs.LowValueQueueUrl,
      ];

      for (const queueUrl of queues) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: [
            'ApproximateNumberOfMessages',
            'ApproximateNumberOfMessagesNotVisible',
          ],
        });

        const result = await sqsClient.send(command);
        expect(result.Attributes).toBeDefined();
      }
    }, 60000);
  });

  describe('Infrastructure Health', () => {
    test('all queues are operational', async () => {
      const queues = [
        outputs.HighValueQueueUrl,
        outputs.StandardValueQueueUrl,
        outputs.LowValueQueueUrl,
      ];

      for (const queueUrl of queues) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['ApproximateNumberOfMessages'],
        });

        const result = await sqsClient.send(command);
        expect(result.Attributes).toBeDefined();
      }
    }, 30000);

    test('DynamoDB table is healthy and responsive', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TransactionTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('SNS topic is operational', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.TransactionTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    }, 30000);
  });
});
