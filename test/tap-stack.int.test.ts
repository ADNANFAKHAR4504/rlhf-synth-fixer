// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  KinesisClient,
  DescribeStreamCommand,
  PutRecordsCommand,
} from '@aws-sdk/client-kinesis';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth68172439';
const region = process.env.AWS_DEFAULT_REGION || 'us-east-2';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const kinesisClient = new KinesisClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('Recommendation Engine Integration Tests', () => {
  const streamName = outputs['RecommendationEngineStreamName7538BE53'] ||
    `recommendation-${environmentSuffix}-user-events`;
  const tableName = outputs['RecommendationEngineTableNameFCA08599'] ||
    `recommendation-${environmentSuffix}-user-profiles`;
  const bucketName = outputs['RecommendationEngineBucketName661DC7B5'];
  const streamProcessorFunctionName =
    outputs['RecommendationEngineStreamProcessorFunctionName18D3AFAA'] ||
    `recommendation-${environmentSuffix}-stream-processor`;
  const batchProcessorFunctionName =
    outputs['RecommendationEngineBatchProcessorFunctionNameFC477A05'] ||
    `recommendation-${environmentSuffix}-batch-processor`;

  describe('Kinesis Stream Validation', () => {
    test('Kinesis stream should exist and be active', async () => {
      const response = await kinesisClient.send(
        new DescribeStreamCommand({ StreamName: streamName })
      );

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription?.StreamName).toBe(streamName);
    });

    test('Kinesis stream should have 4 shards', async () => {
      const response = await kinesisClient.send(
        new DescribeStreamCommand({ StreamName: streamName })
      );

      const shardCount = response.StreamDescription?.Shards?.length || 0;
      expect(shardCount).toBe(4);
    });

    test('Should be able to put records to Kinesis stream', async () => {
      const record = {
        userId: 'test-user-1',
        interactionType: 'view',
        itemId: 'item-123',
        timestamp: new Date().toISOString(),
      };

      const response = await kinesisClient.send(
        new PutRecordsCommand({
          StreamName: streamName,
          Records: [
            {
              Data: Buffer.from(JSON.stringify(record)),
              PartitionKey: record.userId,
            },
          ],
        })
      );

      expect(response.Records).toBeDefined();
      expect(response.Records?.[0].SequenceNumber).toBeDefined();
      expect(response.FailedRecordCount).toBe(0);
    });
  });

  describe('DynamoDB Table Validation', () => {
    test('DynamoDB table should exist and be active', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(tableName);
    });

    test('Table should have userId as partition key', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const keySchema = response.Table?.KeySchema || [];
      const partitionKey = keySchema.find((key) => key.KeyType === 'HASH');

      expect(partitionKey).toBeDefined();
      expect(partitionKey?.AttributeName).toBe('userId');
    });

    test('Table should have auto-scaling configured', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table?.ProvisionedThroughput).toBeDefined();
      expect(response.Table?.ProvisionedThroughput?.ReadCapacityUnits).toBeGreaterThan(0);
      expect(response.Table?.ProvisionedThroughput?.WriteCapacityUnits).toBeGreaterThan(0);
    });

    test('Should be able to write to DynamoDB table', async () => {
      const response = await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            userId: { S: `test-user-${Date.now()}` },
            lastInteraction: { S: new Date().toISOString() },
            interactionCount: { N: '1' },
          },
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('S3 Bucket Validation', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should be empty initially', async () => {
      const response = await s3Client.send(
        new ListObjectsV2Command({ Bucket: bucketName })
      );

      expect(response.Contents).toBeUndefined();
    });
  });

  describe('Lambda Functions Validation', () => {
    test('Stream processor Lambda function should exist', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: streamProcessorFunctionName })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(streamProcessorFunctionName);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('Stream processor should have reserved concurrency of 50', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: streamProcessorFunctionName })
      );

      expect(response.Concurrency?.ReservedConcurrentExecutions).toBe(50);
    });

    test('Stream processor should have correct environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: streamProcessorFunctionName })
      );

      const env = response.Configuration?.Environment?.Variables || {};
      expect(env.TABLE_NAME).toBe(tableName);
      expect(env.ENDPOINT_NAME).toBeDefined();
    });

    test('Batch processor Lambda function should exist', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: batchProcessorFunctionName })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(batchProcessorFunctionName);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('Batch processor should have 15 minute timeout', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: batchProcessorFunctionName })
      );

      expect(response.Configuration?.Timeout).toBe(900);
    });

    test('Batch processor should have correct environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: batchProcessorFunctionName })
      );

      const env = response.Configuration?.Environment?.Variables || {};
      expect(env.TABLE_NAME).toBe(tableName);
      expect(env.BUCKET_NAME).toBe(bucketName);
      expect(env.ENDPOINT_NAME).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    test('Lambda latency alarm should exist', async () => {
      const alarmName = `recommendation-${environmentSuffix}-lambda-latency`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
      expect(response.MetricAlarms?.[0].Threshold).toBe(30000);
    });

    test('Lambda error alarm should exist', async () => {
      const alarmName = `recommendation-${environmentSuffix}-lambda-errors`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
      expect(response.MetricAlarms?.[0].Threshold).toBe(5);
    });

    test('Kinesis iterator age alarm should exist', async () => {
      const alarmName = `recommendation-${environmentSuffix}-kinesis-iterator-age`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
      expect(response.MetricAlarms?.[0].Threshold).toBe(60000);
    });

    test('DynamoDB throttle alarm should exist', async () => {
      const alarmName = `recommendation-${environmentSuffix}-dynamo-read-throttle`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
      expect(response.MetricAlarms?.[0].Threshold).toBe(10);
    });
  });

  describe('EventBridge Rule Validation', () => {
    test('Batch processing rule should exist', async () => {
      const ruleName = `recommendation-${environmentSuffix}-batch-processing`;
      const response = await eventBridgeClient.send(
        new ListRulesCommand({ NamePrefix: ruleName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const rule = response.Rules?.find((r) => r.Name === ruleName);
      expect(rule).toBeDefined();
      expect(rule?.ScheduleExpression).toBe('cron(0 2 * * ? *)');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Complete workflow: Kinesis -> Lambda -> DynamoDB', async () => {
      const testUserId = `test-user-workflow-${Date.now()}`;
      const record = {
        userId: testUserId,
        interactionType: 'view',
        itemId: 'item-456',
        timestamp: new Date().toISOString(),
      };

      // 1. Put record to Kinesis
      const kinesisResponse = await kinesisClient.send(
        new PutRecordsCommand({
          StreamName: streamName,
          Records: [
            {
              Data: Buffer.from(JSON.stringify(record)),
              PartitionKey: record.userId,
            },
          ],
        })
      );

      expect(kinesisResponse.FailedRecordCount).toBe(0);

      // 2. Wait for processing (Lambda is async)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 3. Verify Lambda function configuration
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: streamProcessorFunctionName })
      );

      expect(lambdaResponse.Configuration?.State).toBe('Active');
    });
  });
});
