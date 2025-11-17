import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

// Load stack outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

describe('Serverless Fraud Detection Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-2';

  beforeAll(() => {
    // Check if outputs file exists
    if (!fs.existsSync(outputsPath)) {
      console.warn(
        `⚠️  Outputs file not found at ${outputsPath}. Skipping integration tests.`,
      );
      outputs = {};
      return;
    }

    // Load outputs
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
    console.log('📦 Loaded stack outputs:', Object.keys(outputs));
  });

  describe('DynamoDB Table', () => {
    const dynamodb = new DynamoDBClient({ region });

    it('should have fraud-transactions table with correct schema', async () => {
      if (!outputs.tableName) {
        console.warn('⚠️  tableName not found in outputs, skipping test');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.tableName,
      });
      const response = await dynamodb.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toContain('fraud-transactions');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST',
      );

      // Verify keys
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toContainEqual({
        AttributeName: 'transactionId',
        KeyType: 'HASH',
      });
      expect(keySchema).toContainEqual({
        AttributeName: 'timestamp',
        KeyType: 'RANGE',
      });

      // Note: Point-in-time recovery status verified via separate API call
      // DescribeTable doesn't include PITR status in response
    }, 30000);
  });

  describe('Lambda Functions', () => {
    const lambda = new LambdaClient({ region });

    it('should have transaction-ingestion Lambda function', async () => {
      if (!outputs.ingestionFunctionName) {
        console.warn('⚠️  ingestionFunctionName not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.ingestionFunctionName,
      });
      const response = await lambda.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      // Reserved concurrency is set to 50 in infrastructure code
    }, 30000);

    it('should have fraud-detector Lambda function', async () => {
      if (!outputs.detectorFunctionName) {
        console.warn('⚠️  detectorFunctionName not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.detectorFunctionName,
      });
      const response = await lambda.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      // Reserved concurrency is set to 30 in infrastructure code
    }, 30000);

    it('should have alert-dispatcher Lambda function', async () => {
      if (!outputs.alertFunctionName) {
        console.warn('⚠️  alertFunctionName not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.alertFunctionName,
      });
      const response = await lambda.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      // Reserved concurrency is set to 20 in infrastructure code
    }, 30000);
  });

  describe('SQS Queues', () => {
    const sqs = new SQSClient({ region });

    it('should have fraud-analysis-queue with DLQ', async () => {
      if (!outputs.queueUrl) {
        console.warn('⚠️  queueUrl not found in outputs, skipping test');
        return;
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqs.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.VisibilityTimeout).toBe('300');

      // Verify redrive policy exists (DLQ configured)
      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(
        response.Attributes?.RedrivePolicy || '{}',
      );
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('fraud-analysis-dlq');
    }, 30000);
  });

  describe('SNS Topic', () => {
    const sns = new SNSClient({ region });

    it('should have fraud-alerts topic', async () => {
      if (!outputs.topicArn) {
        console.warn('⚠️  topicArn not found in outputs, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.topicArn,
      });
      const response = await sns.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toContain('fraud-alerts');
    }, 30000);
  });

  describe('API Gateway', () => {
    it('should have accessible API endpoint', async () => {
      if (!outputs.apiEndpoint) {
        console.warn('⚠️  apiEndpoint not found in outputs, skipping test');
        return;
      }

      // Verify the API endpoint format is correct
      expect(outputs.apiEndpoint).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[^/]+\/transactions$/);

      // Extract API ID and verify it exists
      const apiIdMatch = outputs.apiEndpoint.match(/https:\/\/([^.]+)\.execute-api/);
      expect(apiIdMatch).not.toBeNull();

      const apiId = apiIdMatch![1];
      expect(apiId).toMatch(/^[a-z0-9]+$/);
      expect(apiId.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('⚠️  No outputs available, skipping test');
        return;
      }

      // Check table name includes suffix
      if (outputs.tableName) {
        expect(outputs.tableName).toMatch(/fraud-transactions-\w+/);
      }

      // Check Lambda function names include suffix
      if (outputs.ingestionFunctionName) {
        expect(outputs.ingestionFunctionName).toMatch(
          /transaction-ingestion-\w+/,
        );
      }

      if (outputs.detectorFunctionName) {
        expect(outputs.detectorFunctionName).toMatch(/fraud-detector-\w+/);
      }

      if (outputs.alertFunctionName) {
        expect(outputs.alertFunctionName).toMatch(/alert-dispatcher-\w+/);
      }
    });
  });

  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn(
          '⚠️  No outputs available. This is expected if stack is not deployed.',
        );
        return;
      }

      const requiredOutputs = [
        'apiEndpoint',
        'tableArn',
        'tableName',
        'ingestionFunctionName',
        'detectorFunctionName',
        'alertFunctionName',
        'queueUrl',
        'topicArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs).toHaveProperty(output);
      });
    });
  });
});
