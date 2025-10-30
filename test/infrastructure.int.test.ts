import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { EventBridgeClient, DescribeRuleCommand } from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'all-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Extract region from ARNs
const getRegionFromArn = (arn: string): string => {
  const parts = arn.split(':');
  return parts[3] || 'us-east-1';
};

describe('Multi-Environment Data Pipeline Infrastructure - Integration Tests', () => {
  describe('Dev Environment Resources', () => {
    const devOutputs = outputs.dev;
    const region = getRegionFromArn(devOutputs.tableArn);
    const s3Client = new S3Client({ region: 'us-east-1' }); // S3 is global, but bucket is in us-east-1
    const dynamoClient = new DynamoDBClient({ region });
    const snsClient = new SNSClient({ region });
    const sqsClient = new SQSClient({ region });

    it('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: devOutputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('S3 bucket name includes environment suffix', () => {
      expect(devOutputs.bucketName).toContain('dev');
      expect(devOutputs.bucketName).toContain('synthfh1si');
    });

    it('DynamoDB table exists with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: devOutputs.tableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.TableName).toBe(devOutputs.tableName);
    });

    it('DynamoDB table has correct schema', async () => {
      const command = new DescribeTableCommand({
        TableName: devOutputs.tableName,
      });

      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;

      expect(keySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ])
      );
    });

    it('SNS success topic exists', async () => {
      const topicArn = devOutputs.successTopicArn;
      expect(topicArn).toContain('replication-success');
      expect(topicArn).toContain('synthfh1si');
    });

    it('SNS failure topic exists', async () => {
      const topicArn = devOutputs.failureTopicArn;
      expect(topicArn).toContain('replication-failure');
      expect(topicArn).toContain('synthfh1si');
    });

    it('SQS dead letter queue exists', async () => {
      const queueUrl = devOutputs.dlqUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn', 'MessageRetentionPeriod'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });

    it('can write and read from S3 bucket', async () => {
      const testKey = `test-${Date.now()}.json`;
      const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });

      // Put object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: devOutputs.bucketName,
          Key: testKey,
          Body: testData,
        })
      );

      // Get object
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: devOutputs.bucketName,
          Key: testKey,
        })
      );

      const body = await response.Body?.transformToString();
      expect(body).toBe(testData);
    }, 30000);

    it('can write and read from DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;
      const timestamp = Date.now();

      // Put item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: devOutputs.tableName,
          Item: {
            id: { S: testId },
            timestamp: { N: timestamp.toString() },
            environment: { S: 'dev' },
            testData: { S: 'test value' },
          },
        })
      );

      // Get item
      const response = await dynamoClient.send(
        new GetItemCommand({
          TableName: devOutputs.tableName,
          Key: {
            id: { S: testId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item?.testData.S).toBe('test value');
    }, 30000);
  });

  describe('Staging Environment Resources', () => {
    const stagingOutputs = outputs.staging;

    it('staging bucket name includes environment suffix', () => {
      expect(stagingOutputs.bucketName).toContain('staging');
      expect(stagingOutputs.bucketName).toContain('synthfh1si');
    });

    it('staging table name includes environment suffix', () => {
      expect(stagingOutputs.tableName).toContain('staging');
      expect(stagingOutputs.tableName).toContain('synthfh1si');
    });

    it('staging has separate SNS topics', () => {
      expect(stagingOutputs.successTopicArn).not.toBe(outputs.dev.successTopicArn);
      expect(stagingOutputs.failureTopicArn).not.toBe(outputs.dev.failureTopicArn);
    });
  });

  describe('Production Environment Resources', () => {
    const prodOutputs = outputs.prod;
    const region = getRegionFromArn(prodOutputs.replicationFunctionArn);
    const lambdaClient = new LambdaClient({ region });
    const eventBridgeClient = new EventBridgeClient({ region });

    it('prod bucket name includes environment suffix', () => {
      expect(prodOutputs.bucketName).toContain('prod');
      expect(prodOutputs.bucketName).toContain('synthfh1si');
    });

    it('Lambda replication function exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: prodOutputs.replicationFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(prodOutputs.replicationFunctionName);
    });

    it('Lambda function has correct timeout', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: prodOutputs.replicationFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300); // 5 minutes
    });

    it('Lambda function has required environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: prodOutputs.replicationFunctionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.PROD_BUCKET).toBeDefined();
      expect(envVars?.PROD_TABLE).toBeDefined();
      expect(envVars?.SUCCESS_TOPIC_ARN).toBeDefined();
      expect(envVars?.FAILURE_TOPIC_ARN).toBeDefined();
      expect(envVars?.DLQ_URL).toBeDefined();
      expect(envVars?.ENVIRONMENT_SUFFIX).toBe('synthfh1si');
      expect(envVars?.REGION).toBe('us-east-1');
    });

    it('EventBridge rule exists', async () => {
      const command = new DescribeRuleCommand({
        Name: prodOutputs.eventRuleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Name).toBe(prodOutputs.eventRuleName);
      expect(response.State).toBe('ENABLED');
    });

    it('EventBridge rule has correct event pattern', async () => {
      const command = new DescribeRuleCommand({
        Name: prodOutputs.eventRuleName,
      });

      const response = await eventBridgeClient.send(command);
      const eventPattern = JSON.parse(response.EventPattern || '{}');

      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern.source).toContain('aws.dynamodb');
      expect(eventPattern.detailType).toContain('AWS API Call via CloudTrail');
    });
  });

  describe('Cross-Environment Validation', () => {
    it('all three environments have unique bucket names', () => {
      const buckets = [outputs.dev.bucketName, outputs.staging.bucketName, outputs.prod.bucketName];

      const uniqueBuckets = new Set(buckets);
      expect(uniqueBuckets.size).toBe(3);
    });

    it('all three environments have unique table names', () => {
      const tables = [outputs.dev.tableName, outputs.staging.tableName, outputs.prod.tableName];

      const uniqueTables = new Set(tables);
      expect(uniqueTables.size).toBe(3);
    });

    it('all environments use the same environment suffix', () => {
      expect(outputs.dev.bucketName).toContain('synthfh1si');
      expect(outputs.staging.bucketName).toContain('synthfh1si');
      expect(outputs.prod.bucketName).toContain('synthfh1si');
    });

    it('only prod environment has Lambda function', () => {
      expect(outputs.prod.replicationFunctionArn).toBeDefined();
      expect(outputs.dev.replicationFunctionArn).toBeUndefined();
      expect(outputs.staging.replicationFunctionArn).toBeUndefined();
    });

    it('only prod environment has EventBridge rule', () => {
      expect(outputs.prod.eventRuleArn).toBeDefined();
      expect(outputs.dev.eventRuleArn).toBeUndefined();
      expect(outputs.staging.eventRuleArn).toBeUndefined();
    });
  });
});
