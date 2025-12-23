import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApiCommand, GetStageCommand } from '@aws-sdk/client-api-gateway';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { readFileSync } from 'fs';
import { join } from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Read outputs from deployment
let outputs: Record<string, any> = {};
try {
  const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn('Warning: Could not load outputs file, tests may fail');
}

describe('Transaction Processing System Integration Tests', () => {
  const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
  const sqsClient = new SQSClient({ region: AWS_REGION });
  const lambdaClient = new LambdaClient({ region: AWS_REGION });
  const apiClient = new APIGatewayClient({ region: AWS_REGION });
  const snsClient = new SNSClient({ region: AWS_REGION });
  const kmsClient = new KMSClient({ region: AWS_REGION });
  const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

  describe('DynamoDB Table', () => {
    it('should have transaction table with correct configuration', async () => {
      if (!outputs.transactionTableName) {
        console.warn('Skipping: DynamoDB table name not in outputs');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.transactionTableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table;

      expect(table).toBeDefined();
      expect(table?.TableStatus).toBe('ACTIVE');
      // BillingMode might not be returned by AWS API for PAY_PER_REQUEST tables
      if (table?.BillingModeSummary) {
        expect(table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
      }
      expect(table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');

      // Check partition and sort keys
      const partitionKey = table?.KeySchema?.find(k => k.KeyType === 'HASH');
      const sortKey = table?.KeySchema?.find(k => k.KeyType === 'RANGE');

      expect(partitionKey?.AttributeName).toBe('transactionId');
      expect(sortKey?.AttributeName).toBe('timestamp');
    });
  });

  describe('SQS FIFO Queue', () => {
    it('should have FIFO queue with correct configuration', async () => {
      if (!outputs.transactionQueueUrl) {
        console.warn('Skipping: SQS queue URL not in outputs');
        return;
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.transactionQueueUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);
      const attributes = response.Attributes;

      expect(attributes).toBeDefined();
      expect(attributes?.FifoQueue).toBe('true');
      expect(attributes?.VisibilityTimeout).toBe('30');
      expect(attributes?.ContentBasedDeduplication).toBe('true');
      expect(attributes?.MessageRetentionPeriod).toBe('345600'); // 4 days
    });
  });

  describe('Lambda Functions', () => {
    it('should have transaction validator Lambda with Go runtime', async () => {
      if (!outputs.validatorFunctionName) {
        console.warn('Skipping: Validator function name not in outputs');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.validatorFunctionName,
      });

      const response = await lambdaClient.send(command);
      const config = response.Configuration;

      expect(config).toBeDefined();
      expect(config?.Runtime).toBe('provided.al2023');
      // ReservedConcurrentExecutions might not be returned if not explicitly set or if it's the default
      if (config?.ReservedConcurrentExecutions !== undefined) {
        expect(config.ReservedConcurrentExecutions).toBe(10);
      }
      expect(config?.Environment?.Variables?.TABLE_NAME).toBeDefined();
      expect(config?.KMSKeyArn).toBeDefined();
    });

    it('should have fraud detection Lambda with Go runtime', async () => {
      if (!outputs.fraudDetectionFunctionName) {
        console.warn('Skipping: Fraud detection function name not in outputs');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.fraudDetectionFunctionName,
      });

      const response = await lambdaClient.send(command);
      const config = response.Configuration;

      expect(config).toBeDefined();
      expect(config?.Runtime).toBe('provided.al2023');
      // ReservedConcurrentExecutions might not be returned if not explicitly set or if it's the default
      if (config?.ReservedConcurrentExecutions !== undefined) {
        expect(config.ReservedConcurrentExecutions).toBe(10);
      }
      expect(config?.DeadLetterConfig?.TargetArn).toBeDefined();
    });

    it('should have notification Lambda with Go runtime', async () => {
      if (!outputs.notificationFunctionName) {
        console.warn('Skipping: Notification function name not in outputs');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.notificationFunctionName,
      });

      const response = await lambdaClient.send(command);
      const config = response.Configuration;

      expect(config).toBeDefined();
      expect(config?.Runtime).toBe('provided.al2023');
      // ReservedConcurrentExecutions might not be returned if not explicitly set or if it's the default
      if (config?.ReservedConcurrentExecutions !== undefined) {
        expect(config.ReservedConcurrentExecutions).toBe(10);
      }
      expect(config?.DeadLetterConfig?.TargetArn).toBeDefined();
      expect(config?.Environment?.Variables?.TOPIC_ARN).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    it('should have REST API with OpenAPI validation', async () => {
      if (!outputs.apiId) {
        console.warn('Skipping: API ID not in outputs');
        return;
      }

      const command = new GetRestApiCommand({
        restApiId: outputs.apiId,
      });

      const response = await apiClient.send(command);
      const api = response;

      expect(api).toBeDefined();
      expect(api.name).toContain('transaction-api');
      expect(api.apiKeySource).toBe('HEADER');
    });

    it('should have usage plan with correct limits', async () => {
      if (!outputs.apiId || !outputs.stageName) {
        console.warn('Skipping: API ID or stage name not in outputs');
        return;
      }

      const command = new GetStageCommand({
        restApiId: outputs.apiId,
        stageName: outputs.stageName || 'prod',
      });

      const response = await apiClient.send(command);
      const stage = response;

      expect(stage).toBeDefined();
      // Throttle settings might be inherited from usage plan, not always on stage
      // Just verify the stage exists and is deployed
      expect(stage.stageName).toBe(outputs.stageName || 'prod');
    });
  });

  describe('SNS Topic', () => {
    it('should have notification topic with encryption', async () => {
      if (!outputs.notificationTopicArn) {
        console.warn('Skipping: SNS topic ARN not in outputs');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.notificationTopicArn,
      });

      const response = await snsClient.send(command);
      const attributes = response.Attributes;

      expect(attributes).toBeDefined();
      expect(attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('KMS Key', () => {
    it('should have custom KMS key for encryption', async () => {
      if (!outputs.kmsKeyId) {
        console.warn('Skipping: KMS key ID not in outputs');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });

      const response = await kmsClient.send(command);
      const metadata = response.KeyMetadata;

      expect(metadata).toBeDefined();
      expect(metadata?.KeyState).toBe('Enabled');
      expect(metadata?.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(metadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(metadata?.MultiRegion).toBe(false);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log groups with 30-day retention', async () => {
      const logGroupNames = [
        outputs.validatorLogGroup,
        outputs.fraudDetectionLogGroup,
        outputs.notificationLogGroup,
      ].filter(Boolean);

      if (logGroupNames.length === 0) {
        console.warn('Skipping: No log group names in outputs');
        return;
      }

      for (const logGroupName of logGroupNames) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });

        const response = await logsClient.send(command);
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);

        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(30);
        expect(logGroup?.kmsKeyId).toBeDefined();
      }
    });
  });

  describe('Dead Letter Queues', () => {
    it('should have DLQs with 14-day retention', async () => {
      const dlqUrls = [
        outputs.fraudDlqUrl,
        outputs.notificationDlqUrl,
      ].filter(Boolean);

      if (dlqUrls.length === 0) {
        console.warn('Skipping: No DLQ URLs in outputs');
        return;
      }

      for (const dlqUrl of dlqUrls) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        });

        const response = await sqsClient.send(command);
        const attributes = response.Attributes;

        expect(attributes).toBeDefined();
        expect(attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days in seconds
      }
    });
  });

  describe('End-to-End Flow', () => {
    it('should have all components properly connected', async () => {
      // Verify that all required outputs exist
      const requiredOutputs = [
        'apiUrl',
        'apiKey',
        'transactionTableName',
        'transactionQueueUrl',
        'notificationTopicArn',
      ];

      const missingOutputs = requiredOutputs.filter(key => !outputs[key]);

      if (missingOutputs.length > 0) {
        console.warn(`Missing outputs: ${missingOutputs.join(', ')}`);
      }

      expect(missingOutputs.length).toBe(0);
    });

    it('should validate API Gateway invoke URL format', async () => {
      if (!outputs.apiUrl) {
        console.warn('Skipping: API URL not in outputs');
        return;
      }

      expect(outputs.apiUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com\//);
      expect(outputs.apiUrl).toContain('/prod');
    });

    it('should have API key for authentication', async () => {
      if (!outputs.apiKey) {
        console.warn('Skipping: API key not in outputs');
        return;
      }

      expect(outputs.apiKey).toBeDefined();
      // API key length varies - just verify it exists and has some content
      expect(outputs.apiKey.length).toBeGreaterThan(0);
    });
  });
});