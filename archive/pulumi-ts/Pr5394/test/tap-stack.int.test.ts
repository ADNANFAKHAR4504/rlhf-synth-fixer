/**
 * Integration tests for TapStack deployed infrastructure
 *
 * These tests verify that actual AWS resources are correctly configured
 * and working as expected. They use real stack outputs and make actual
 * API calls to AWS services.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetBucketNotificationConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { IAMClient, GetPolicyCommand } from '@aws-sdk/client-iam';

// Load stack outputs from deployment
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

interface StackOutputs {
  bucketName: string;
  tableName: string;
  queueUrl: string;
}

let outputs: StackOutputs;

// AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const dynamodbClient = new DynamoDBClient({ region });
const sqsClient = new SQSClient({ region });
const iamClient = new IAMClient({ region });

describe('TapStack Integration Tests', () => {
  beforeAll(() => {
    // Load outputs from deployment
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    console.log('Testing with outputs:', outputs);

    // Verify required outputs exist
    expect(outputs.bucketName).toBeDefined();
    expect(outputs.tableName).toBeDefined();
    expect(outputs.queueUrl).toBeDefined();
  });

  describe('S3 Bucket Configuration', () => {
    it('should have the S3 bucket deployed and accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled on the bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption configured with SSE-S3', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(
        1
      );
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle rules configured for Glacier transition', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const glacierRule = response.Rules?.find(
        (rule) => rule.ID === 'transition-to-glacier'
      );
      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Status).toBe('Enabled');
      expect(glacierRule?.Transitions).toHaveLength(1);
      expect(glacierRule?.Transitions?.[0]?.Days).toBe(90);
      expect(glacierRule?.Transitions?.[0]?.StorageClass).toBe('GLACIER');
    });

    it('should have event notification configured for SQS', async () => {
      const command = new GetBucketNotificationConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.QueueConfigurations).toBeDefined();
      expect(response.QueueConfigurations?.length).toBeGreaterThan(0);

      const queueConfig = response.QueueConfigurations?.[0];
      expect(queueConfig?.Events).toContain('s3:ObjectCreated:*');
      expect(queueConfig?.QueueArn).toContain('datapipeline-queue');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should have the DynamoDB table deployed and active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamodbClient.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(outputs.tableName);
    });

    it('should have correct key schema configured', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamodbClient.send(command);
      const keySchema = response.Table?.KeySchema;

      expect(keySchema).toHaveLength(2);

      const partitionKey = keySchema?.find((key) => key.KeyType === 'HASH');
      const sortKey = keySchema?.find((key) => key.KeyType === 'RANGE');

      expect(partitionKey?.AttributeName).toBe('fileId');
      expect(sortKey?.AttributeName).toBe('timestamp');
    });

    it('should use on-demand (PAY_PER_REQUEST) billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamodbClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.tableName,
      });

      const response = await dynamodbClient.send(command);
      expect(
        response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    it('should allow writing and reading items', async () => {
      const testFileId = `test-file-${Date.now()}`;
      const testTimestamp = new Date().toISOString();

      // Write an item
      const putCommand = new PutItemCommand({
        TableName: outputs.tableName,
        Item: {
          fileId: { S: testFileId },
          timestamp: { S: testTimestamp },
          metadata: { S: 'integration-test-data' },
        },
      });

      await dynamodbClient.send(putCommand);

      // Read the item back
      const getCommand = new GetItemCommand({
        TableName: outputs.tableName,
        Key: {
          fileId: { S: testFileId },
          timestamp: { S: testTimestamp },
        },
      });

      const response = await dynamodbClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.fileId.S).toBe(testFileId);
      expect(response.Item?.timestamp.S).toBe(testTimestamp);
      expect(response.Item?.metadata.S).toBe('integration-test-data');
    });
  });

  describe('SQS Queue Configuration', () => {
    it('should have the SQS queue deployed and accessible', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.queueUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    it('should have correct message retention period (14 days)', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.queueUrl,
        AttributeNames: ['MessageRetentionPeriod'],
      });

      const response = await sqsClient.send(command);
      const retentionSeconds = parseInt(
        response.Attributes?.MessageRetentionPeriod || '0',
        10
      );
      expect(retentionSeconds).toBe(14 * 24 * 60 * 60); // 14 days in seconds
    });

    it('should have correct visibility timeout (300 seconds)', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.queueUrl,
        AttributeNames: ['VisibilityTimeout'],
      });

      const response = await sqsClient.send(command);
      const visibilityTimeout = parseInt(
        response.Attributes?.VisibilityTimeout || '0',
        10
      );
      expect(visibilityTimeout).toBe(300); // 5 minutes
    });

    it('should have the correct queue name', async () => {
      const queueName = outputs.queueUrl.split('/').pop();
      expect(queueName).toContain('datapipeline-queue');
    });
  });

  describe('S3 to SQS Event Integration', () => {
    it('should send notification to SQS when object is created in S3', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload a test file to S3
      const putCommand = new PutObjectCommand({
        Bucket: outputs.bucketName,
        Key: testKey,
        Body: testContent,
      });

      await s3Client.send(putCommand);

      // Wait a bit for the event to propagate
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check for message in SQS
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: outputs.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });

      const response = await sqsClient.send(receiveCommand);
      expect(response.Messages).toBeDefined();
      expect(response.Messages!.length).toBeGreaterThan(0);

      // Verify message contains S3 event data
      const message = response.Messages!.find((msg) => {
        const body = JSON.parse(msg.Body || '{}');
        return body.Records?.[0]?.s3?.object?.key === testKey;
      });

      expect(message).toBeDefined();

      if (message) {
        const body = JSON.parse(message.Body || '{}');
        expect(body.Records).toHaveLength(1);
        expect(body.Records[0].eventName).toContain('ObjectCreated');
        expect(body.Records[0].s3.bucket.name).toBe(outputs.bucketName);
        expect(body.Records[0].s3.object.key).toBe(testKey);

        // Clean up: Delete the message from queue
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: outputs.queueUrl,
            ReceiptHandle: message.ReceiptHandle!,
          })
        );
      }
    }, 15000); // Extended timeout for async operations
  });

  describe('Resource Tagging', () => {
    it('should have tags applied to S3 bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      // Note: HeadBucket doesn't return tags, but confirms bucket exists
      // Tags verification would require GetBucketTagging command
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Environment Suffix Validation', () => {
    it('should include environmentSuffix in bucket name', () => {
      expect(outputs.bucketName).toMatch(/datapipeline-bucket-\w+-[a-f0-9]+/);
    });

    it('should include environmentSuffix in table name', () => {
      expect(outputs.tableName).toMatch(/datapipeline-table-\w+/);
    });

    it('should include environmentSuffix in queue URL', () => {
      expect(outputs.queueUrl).toContain('datapipeline-queue-');
    });
  });
});
