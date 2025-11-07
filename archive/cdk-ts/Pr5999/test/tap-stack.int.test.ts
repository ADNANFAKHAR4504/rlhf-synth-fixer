import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  DescribeTableCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  GetFunctionCommand,
  LambdaClient,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  GetQueueAttributesCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Extract environment suffix from outputs
// Outputs have format like "TableNamepr5999", "TopicArnpr5999", etc.
// We need to extract the suffix (e.g., "pr5999") from the keys
const outputKeys = Object.keys(rawOutputs);
let environmentSuffix = 'dev';

// Known base output key patterns
const knownBases = [
  'TableName',
  'TopicArn',
  'ApiEndpoint',
  'ApiKeyId',
  'TransactionQueueUrl',
  'FraudDetectionStack',
];

// Extract suffix by finding a known base pattern
for (const key of outputKeys) {
  for (const base of knownBases) {
    if (key.startsWith(base) && key.length > base.length) {
      environmentSuffix = key.substring(base.length);
      break;
    }
  }
  if (environmentSuffix !== 'dev') break;
}

// Normalize outputs by removing suffix from keys for easier access
const outputs: Record<string, string> = {};
for (const [key, value] of Object.entries(rawOutputs)) {
  // Remove the suffix from the key (e.g., "TableNamepr5999" -> "TableName")
  if (key.endsWith(environmentSuffix)) {
    const baseKey = key.substring(0, key.length - environmentSuffix.length);
    outputs[baseKey] = value as string;
  } else {
    // If suffix extraction failed, use key as-is
    outputs[key] = value as string;
  }
}

// Get region from AWS_REGION file or environment variable
let region = 'us-east-1';
try {
  const regionPath = path.join(__dirname, '../lib/AWS_REGION');
  if (fs.existsSync(regionPath)) {
    region = fs.readFileSync(regionPath, 'utf-8').trim();
  }
} catch (e) {
  // Fallback to environment variable or default
}
region = process.env.AWS_REGION || region;

describe('Fraud Detection System Integration Tests', () => {
  const dynamoClient = new DynamoDBClient({ region });
  const snsClient = new SNSClient({ region });
  const sqsClient = new SQSClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const apiGatewayClient = new APIGatewayClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });

  describe('DynamoDB Table', () => {
    test('Should have TransactionHistory table deployed', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('Should have correct partition and sort keys', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TableName,
      });
      const response = await dynamoClient.send(command);

      const keys = response.Table?.KeySchema;
      expect(keys).toHaveLength(2);
      expect(keys?.find((k) => k.AttributeName === 'transactionId')?.KeyType).toBe(
        'HASH'
      );
      expect(keys?.find((k) => k.AttributeName === 'timestamp')?.KeyType).toBe(
        'RANGE'
      );
    });

    test('Should be able to write and read from table', async () => {
      const testTransactionId = `test-${Date.now()}`;
      const testTimestamp = Date.now();

      // Write test item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.TableName,
          Item: {
            transactionId: { S: testTransactionId },
            timestamp: { N: testTimestamp.toString() },
            amount: { N: '100' },
            currency: { S: 'USD' },
          },
        })
      );

      // Read back to verify
      const scanResponse = await dynamoClient.send(
        new ScanCommand({
          TableName: outputs.TableName,
          FilterExpression: 'transactionId = :txId',
          ExpressionAttributeValues: {
            ':txId': { S: testTransactionId },
          },
        })
      );

      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items?.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic', () => {
    test('Should have FraudAlerts topic deployed', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.TopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.TopicArn);
    });

    test('Should have Lambda subscription to SNS topic', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.TopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);
      expect(
        response.Subscriptions?.some((sub) => sub.Protocol === 'lambda')
      ).toBe(true);
    });
  });

  describe('SQS Queue', () => {
    test('Should have TransactionQueue FIFO queue deployed', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.TransactionQueueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.FifoQueue).toBe('true');
      expect(response.Attributes?.ContentBasedDeduplication).toBe('true');
    });

    test('Should be able to send message to FIFO queue', async () => {
      const testMessage = {
        transactionId: `test-${Date.now()}`,
        amount: 100,
        currency: 'USD',
      };

      const command = new SendMessageCommand({
        QueueUrl: outputs.TransactionQueueUrl,
        MessageBody: JSON.stringify(testMessage),
        MessageGroupId: 'test-group',
        MessageDeduplicationId: `test-dedup-${Date.now()}`,
      });

      const response = await sqsClient.send(command);
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('Should have transaction validator Lambda deployed', async () => {
      const functionName = `transaction-validator-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('Should have FIFO processor Lambda deployed', async () => {
      const functionName = `fifo-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    test('Should have alert handler Lambda deployed', async () => {
      const functionName = `fraud-alert-handler-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    test('Should have batch processor Lambda deployed', async () => {
      const functionName = `batch-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    test('Should have SQS event source mapping for FIFO processor', async () => {
      const functionName = `fifo-processor-${environmentSuffix}`;
      const command = new ListEventSourceMappingsCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.EventSourceMappings).toBeDefined();
      expect(response.EventSourceMappings?.length).toBeGreaterThan(0);
      expect(
        response.EventSourceMappings?.[0]?.EventSourceArn
      ).toContain('sqs');
    });
  });

  describe('API Gateway', () => {
    test('Should have REST API deployed', async () => {
      const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.name).toBeDefined();
      expect(response.name).toContain('fraud-detection-api');
    });

    test('Should have prod stage with correct settings', async () => {
      const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];
      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe('prod');
      expect(response.tracingEnabled).toBe(true);
    });
  });

  describe('EventBridge Rules', () => {
    test('Should have batch processing rule configured', async () => {
      const ruleName = `batch-processing-${environmentSuffix}`;
      const command = new ListRulesCommand({
        NamePrefix: ruleName,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      expect(response.Rules?.[0]?.ScheduleExpression).toContain('cron');
    });

    test('Should have Lambda target for batch processing rule', async () => {
      const ruleName = `batch-processing-${environmentSuffix}`;
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: ruleName,
      });
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);

      expect(rulesResponse.Rules?.[0]?.Name).toBeDefined();

      const listTargetsCommand = new ListTargetsByRuleCommand({
        Rule: rulesResponse.Rules?.[0]?.Name!,
      });
      const targetsResponse = await eventBridgeClient.send(listTargetsCommand);

      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets?.[0]?.Arn).toContain('lambda');
    });
  });

  describe('End-to-End Workflow', () => {
    test('Should have all components integrated correctly', async () => {
      // Verify table exists
      const tableCommand = new DescribeTableCommand({
        TableName: outputs.TableName,
      });
      const tableResponse = await dynamoClient.send(tableCommand);
      expect(tableResponse.Table).toBeDefined();

      // Verify queue exists and accepts messages
      const queueCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.TransactionQueueUrl,
        AttributeNames: ['QueueArn'],
      });
      const queueResponse = await sqsClient.send(queueCommand);
      expect(queueResponse.Attributes?.QueueArn).toBeDefined();

      // Verify SNS topic exists
      const topicCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.TopicArn,
      });
      const topicResponse = await snsClient.send(topicCommand);
      expect(topicResponse.Attributes).toBeDefined();

      // Verify API is accessible
      const apiId = outputs.ApiEndpoint.split('/')[2].split('.')[0];
      const apiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });
      const apiResponse = await apiGatewayClient.send(apiCommand);
      expect(apiResponse.id).toBe(apiId);
    });
  });
});
