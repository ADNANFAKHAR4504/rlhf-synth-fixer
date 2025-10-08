// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SFNClient, DescribeStateMachineCommand } from '@aws-sdk/client-sfn';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const AWS_REGION = process.env.AWS_REGION || 'us-west-1';

const s3Client = new S3Client({ region: AWS_REGION });
const dynamoDBClient = new DynamoDBClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const sfnClient = new SFNClient({ region: AWS_REGION });
const sqsClient = new SQSClient({ region: AWS_REGION });

describe('Document Conversion Service Integration Tests', () => {
  describe('S3 Buckets', () => {
    test('should verify document upload bucket exists and is accessible', async () => {
      const bucketName = outputs.DocumentBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should verify output bucket exists and is accessible', async () => {
      const bucketName = outputs.OutputBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should be able to upload a file to document bucket', async () => {
      const bucketName = outputs.DocumentBucketName;
      const testKey = 'test-integration/sample.txt';

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'Test file content for integration testing',
      });

      const putResult = await s3Client.send(putCommand);
      expect(putResult.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('DynamoDB Table', () => {
    test('should verify job tracking table exists', async () => {
      const tableName = outputs.JobTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should verify table has correct key schema', async () => {
      const tableName = outputs.JobTableName;

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const hashKey = keySchema?.find((key) => key.KeyType === 'HASH');
      const rangeKey = keySchema?.find((key) => key.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('jobId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('should verify table has Global Secondary Index for status queries', async () => {
      const tableName = outputs.JobTableName;

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoDBClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi?.length).toBeGreaterThan(0);

      const statusIndex = gsi?.find((index) => index.IndexName === 'StatusIndex');
      expect(statusIndex).toBeDefined();
      expect(statusIndex?.IndexStatus).toBe('ACTIVE');
    });

    test('should be able to scan the table', async () => {
      const tableName = outputs.JobTableName;

      const command = new ScanCommand({
        TableName: tableName,
        Limit: 10,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('SNS Topic', () => {
    test('should verify notification topic exists', async () => {
      const topicArn = outputs.NotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('should verify topic display name is set correctly', async () => {
      const topicArn = outputs.NotificationTopicArn;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toBe(
        'Document Conversion Notifications'
      );
    });
  });

  describe('Step Functions State Machine', () => {
    test('should verify state machine exists and is active', async () => {
      const stateMachineArn = outputs.StateMachineArn;
      expect(stateMachineArn).toBeDefined();

      const command = new DescribeStateMachineCommand({
        stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.stateMachineArn).toBe(stateMachineArn);
      expect(response.status).toBe('ACTIVE');
    });

    test('should verify state machine has logging enabled', async () => {
      const stateMachineArn = outputs.StateMachineArn;

      const command = new DescribeStateMachineCommand({
        stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.loggingConfiguration).toBeDefined();
      expect(response.loggingConfiguration?.level).toBe('ALL');
    });

    test('should verify state machine has tracing enabled', async () => {
      const stateMachineArn = outputs.StateMachineArn;

      const command = new DescribeStateMachineCommand({
        stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.tracingConfiguration).toBeDefined();
      expect(response.tracingConfiguration?.enabled).toBe(true);
    });

    test('should verify state machine definition is valid', async () => {
      const stateMachineArn = outputs.StateMachineArn;

      const command = new DescribeStateMachineCommand({
        stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.definition).toBeDefined();
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.StartAt).toBeDefined();
      expect(definition.States).toBeDefined();
    });
  });

  describe('Resource Integration', () => {
    test('should verify all outputs are defined', () => {
      expect(outputs.DocumentBucketName).toBeDefined();
      expect(outputs.OutputBucketName).toBeDefined();
      expect(outputs.JobTableName).toBeDefined();
      expect(outputs.StateMachineArn).toBeDefined();
      expect(outputs.NotificationTopicArn).toBeDefined();
    });

    test('should verify output values follow expected naming pattern', () => {
      expect(outputs.DocumentBucketName).toContain('document-uploads-');
      expect(outputs.OutputBucketName).toContain('document-output-');
      expect(outputs.JobTableName).toContain('document-jobs-');
      expect(outputs.StateMachineArn).toContain(':stateMachine:document-conversion-');
      expect(outputs.NotificationTopicArn).toContain(':document-conversion-notifications-');
    });

    test('should verify resources are in the correct region', () => {
      expect(outputs.StateMachineArn).toContain(AWS_REGION);
      expect(outputs.NotificationTopicArn).toContain(AWS_REGION);
    });
  });
});
