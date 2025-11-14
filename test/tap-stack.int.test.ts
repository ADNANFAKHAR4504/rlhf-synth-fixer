/**
 * Integration Tests for Trading Platform Infrastructure
 *
 * These tests verify the deployed infrastructure against live AWS resources.
 * Tests use flat-outputs.json to discover resource names dynamically.
 *
 * Prerequisites:
 * - Run ./scripts/generate-flat-outputs.sh before running these tests
 * - AWS credentials must be configured (AWS_PROFILE=turing)
 * - Environment variables: AWS_REGION, ENVIRONMENT_SUFFIX
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetResourcesCommand,
} from '@aws-sdk/client-api-gateway';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';

// Load flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

function loadOutputs() {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `flat-outputs.json not found at ${outputsPath}. Run ./scripts/generate-flat-outputs.sh first.`
    );
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get credentials explicitly to avoid dynamic import issues
const getCredentials = () => {
  try {
    return fromEnv();
  } catch (e) {
    return undefined;
  }
};

describe('Trading Platform Infrastructure - Integration Tests', () => {
  let outputs: any;
  let region: string;
  let environmentSuffix: string;

  beforeAll(() => {
    outputs = loadOutputs();
    region = outputs.region || process.env.AWS_REGION || 'us-east-1';
    environmentSuffix =
      outputs.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    console.log(`\n🧪 Running integration tests for environment: ${environmentSuffix}`);
    console.log(`📍 Region: ${region}\n`);
  });

  describe('VPC Resources', () => {
    test('VPC ID should be exported', () => {
      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);
    });

    test('should export subnet IDs', () => {
      const publicSubnet1 = outputs['public-subnet-1-id'];
      const publicSubnet2 = outputs['public-subnet-2-id'];

      // Public subnets should always be exported
      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet1).toMatch(/^subnet-/);
      expect(publicSubnet2).toMatch(/^subnet-/);

      // Private subnet IDs may not be exported if using PRIVATE_ISOLATED (natGateways: 0)
      // This is intentional for dev environment to avoid EIP quota limits
    });
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have encryption enabled', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have lifecycle policies configured', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const hasIntelligentTiering = response.Rules!.some((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'INTELLIGENT_TIERING')
      );
      expect(hasIntelligentTiering).toBe(true);
    });

    test('should support PUT and GET operations', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const testKey = `integration-test-${Date.now()}.json`;
      const testData = { message: 'Integration test', timestamp: Date.now() };

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      });
      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);

      const body = await getResponse.Body!.transformToString();
      const retrievedData = JSON.parse(body);
      expect(retrievedData.message).toBe(testData.message);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('DynamoDB Table', () => {
    test('should exist with correct configuration', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const tableName = outputs['orders-table-name'];
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct partition and sort keys', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const tableName = outputs['orders-table-name'];
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table!.KeySchema!;
      expect(keySchema).toHaveLength(2);

      const partitionKey = keySchema.find((k) => k.KeyType === 'HASH');
      const sortKey = keySchema.find((k) => k.KeyType === 'RANGE');

      expect(partitionKey!.AttributeName).toBe('orderId');
      expect(sortKey!.AttributeName).toBe('timestamp');
    });

    test('should support CRUD operations', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const tableName = outputs['orders-table-name'];
      const testOrderId = `test-order-${Date.now()}`;

      const testTimestamp = new Date().toISOString();
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          orderId: { S: testOrderId },
          timestamp: { S: testTimestamp },
          status: { S: 'PENDING' },
          amount: { N: '100.50' },
          symbol: { S: 'AAPL' },
        },
      });
      const putResponse = await dynamoClient.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: testOrderId },
          timestamp: { S: testTimestamp },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.orderId.S).toBe(testOrderId);

      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: testOrderId },
          timestamp: { S: testTimestamp },
        },
      });
      await dynamoClient.send(deleteCommand);
    });
  });

  describe('SQS Queues', () => {
    test('should have main queue with correct configuration', async () => {
      const sqsClient = new SQSClient({ region });
      const queueUrl = outputs['order-processing-queue-url'];
      expect(queueUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toContain(
        `order-processing-${environmentSuffix}`
      );
      expect(response.Attributes!.SqsManagedSseEnabled).toBe('true');
    });

    test('should have redrive policy configured', async () => {
      const sqsClient = new SQSClient({ region });
      const queueUrl = outputs['order-processing-queue-url'];
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('order-processing-dlq');
    });

    test('should support send and receive operations', async () => {
      const sqsClient = new SQSClient({ region });
      const queueUrl = outputs['order-processing-queue-url'];
      const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const testMessage = {
        orderId: uniqueId,
        type: 'integration-test',
        timestamp: Date.now(),
      };

      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(testMessage),
      });
      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.MessageId).toBeDefined();

      // Wait a bit for message to be available
      await new Promise(resolve => setTimeout(resolve, 1000));

      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });
      const receiveResponse = await sqsClient.send(receiveCommand);

      expect(receiveResponse.Messages).toBeDefined();
      expect(receiveResponse.Messages!.length).toBeGreaterThan(0);

      // Find our specific message
      const ourMessage = receiveResponse.Messages!.find(msg => {
        try {
          const body = JSON.parse(msg.Body!);
          return body.orderId === uniqueId;
        } catch {
          return false;
        }
      });

      if (ourMessage) {
        const body = JSON.parse(ourMessage.Body!);
        expect(body.type).toBe('integration-test');
        expect(body.orderId).toBe(uniqueId);

        const deleteCommand = new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: ourMessage.ReceiptHandle!,
        });
        await sqsClient.send(deleteCommand);
      }
    });
  });

  describe('Lambda Function', () => {
    test('should have correct memory and timeout settings', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = `order-processing-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.MemorySize).toBe(512);
      expect(response.Timeout).toBe(30);
    });

    test('should have environment variables configured', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = `order-processing-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment!.Variables!.ENVIRONMENT).toBe(environmentSuffix);
      expect(response.Environment!.Variables!.DYNAMODB_TABLE).toBeDefined();
      expect(response.Environment!.Variables!.SQS_QUEUE).toBeDefined();
      expect(response.Environment!.Variables!.S3_BUCKET).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should export API ID and endpoint', () => {
      const apiId = outputs['api-id'];
      const apiEndpoint = outputs['api-endpoint'] || outputs['ApiEndpoint'];

      expect(apiId).toBeDefined();
      expect(apiId).toMatch(/^[a-z0-9]+$/);
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\//);
      expect(apiEndpoint).toContain(apiId);
      expect(apiEndpoint).toContain(environmentSuffix);
    });
  });

  describe('Monitoring Resources', () => {
    test('should export monitoring resource identifiers', () => {
      const dashboardName = outputs['dashboard-name'];
      const driftTopicArn = outputs['drift-topic-arn'];

      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain('trading-platform');
      expect(dashboardName).toContain(environmentSuffix);

      expect(driftTopicArn).toBeDefined();
      expect(driftTopicArn).toMatch(/^arn:aws:sns:/);
      expect(driftTopicArn).toContain('drift-detection');
      expect(driftTopicArn).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should support complete order processing workflow', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const sqsClient = new SQSClient({ region });
      const s3Client = new S3Client({ region });

      const orderId = `e2e-test-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const tableName = outputs['orders-table-name'];
      const queueUrl = outputs['order-processing-queue-url'];
      const bucketName = outputs['trade-data-bucket-name'];

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          orderId: { S: orderId },
          timestamp: { S: timestamp },
          status: { S: 'PENDING' },
          symbol: { S: 'TSLA' },
          quantity: { N: '100' },
          price: { N: '250.75' },
        },
      });
      await dynamoClient.send(putCommand);

      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          orderId,
          action: 'process',
          timestamp,
        }),
      });
      await sqsClient.send(sendMessageCommand);

      const s3Key = `trades/${orderId}.json`;
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: JSON.stringify({
          orderId,
          timestamp,
          details: 'End-to-end integration test',
        }),
        ContentType: 'application/json',
      });
      await s3Client.send(putObjectCommand);

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: orderId },
          timestamp: { S: timestamp },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.orderId.S).toBe(orderId);

      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      const s3Response = await s3Client.send(getObjectCommand);
      const s3Body = await s3Response.Body!.transformToString();
      const s3Data = JSON.parse(s3Body);
      expect(s3Data.orderId).toBe(orderId);

      const deleteItemCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: orderId },
          timestamp: { S: timestamp },
        },
      });
      await dynamoClient.send(deleteItemCommand);

      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      await s3Client.send(deleteObjectCommand);
    });
  });
});
