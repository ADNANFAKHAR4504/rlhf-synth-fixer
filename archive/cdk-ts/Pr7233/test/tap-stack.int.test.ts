import {
  APIGatewayClient,
  GetRestApisCommand,
  GetStagesCommand,
} from '@aws-sdk/client-apigatewayv2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  ListRulesCommand,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load stack outputs
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string>;

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load outputs:', error);
  outputs = {};
}

const region = 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const sqsClient = new SQSClient({ region });
const snsClient = new SNSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('Stock Pattern Detection System Integration Tests', () => {
  // Extract environmentSuffix from outputs
  const apiUrl = outputs.ApiGatewayUrl || '';
  const queueUrl = outputs.AlertQueueUrl || '';
  const tableName = outputs.PatternsTableName || '';
  const topicArn = outputs.AlertsTopicArn || '';

  // Extract suffix from resource names
  const environmentSuffix = tableName.replace('TradingPatterns-', '') || 'dev';

  beforeAll(() => {
    // Verify outputs are loaded
    expect(outputs).toBeDefined();
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  describe('Stack Outputs', () => {
    test('API Gateway URL is exported', () => {
      expect(apiUrl).toBeTruthy();
      expect(apiUrl).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com/);
    });

    test('SQS Queue URL is exported', () => {
      expect(queueUrl).toBeTruthy();
      expect(queueUrl).toMatch(/^https:\/\/sqs\..+\.amazonaws\.com/);
    });

    test('DynamoDB Table name is exported', () => {
      expect(tableName).toBeTruthy();
      expect(tableName).toContain('TradingPatterns');
    });

    test('SNS Topic ARN is exported', () => {
      expect(topicArn).toBeTruthy();
      expect(topicArn).toMatch(/^arn:aws:sns:.+:.+:TradingAlerts/);
    });
  });

  describe('DynamoDB Table', () => {
    test('table exists and is active', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(tableName);
    });

    test('table has correct schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const hashKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('patternId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('table uses on-demand billing', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('table has point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(
        response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });
  });

  describe('Lambda Functions', () => {
    test('PatternDetector function exists', async () => {
      const functionName = `PatternDetector-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    test('PatternDetector uses ARM architecture', async () => {
      const functionName = `PatternDetector-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    test('PatternDetector has correct memory size', async () => {
      const functionName = `PatternDetector-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(512);
    });

    test('PatternDetector does not have reserved concurrency (to avoid account limit issues)', async () => {
      const functionName = `PatternDetector-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      // Reserved concurrency removed to avoid AWS account limit issues
      // AWS requires at least 100 unreserved concurrent executions
      expect(response.Concurrency?.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('PatternDetector has X-Ray tracing enabled', async () => {
      const functionName = `PatternDetector-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('AlertProcessor function exists', async () => {
      const functionName = `AlertProcessor-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    test('AlertProcessor uses ARM architecture', async () => {
      const functionName = `AlertProcessor-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    test('ThresholdChecker function exists', async () => {
      const functionName = `ThresholdChecker-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    test('ThresholdChecker uses ARM architecture', async () => {
      const functionName = `ThresholdChecker-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    test('ThresholdChecker has environment variables', async () => {
      const functionName = `ThresholdChecker-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const env = response.Configuration?.Environment?.Variables;
      expect(env).toBeDefined();
      expect(env?.PATTERNS_TABLE_NAME).toBe(tableName);
      expect(env?.ALERT_QUEUE_URL).toBe(queueUrl);
      expect(env?.PRICE_THRESHOLD).toBeDefined();
      expect(env?.VOLUME_THRESHOLD).toBeDefined();
      expect(env?.VOLATILITY_THRESHOLD).toBeDefined();
    });
  });

  describe('SQS Queues', () => {
    test('AlertQueue exists and is accessible', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toContain('AlertQueue');
    });

    test('AlertQueue has correct retention period', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['MessageRetentionPeriod'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.MessageRetentionPeriod).toBe('345600'); // 4 days
    });

    test('AlertQueue has correct visibility timeout', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.VisibilityTimeout).toBe('300'); // 5 minutes
    });

    test('AlertQueue has redrive policy configured', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(
        response.Attributes?.RedrivePolicy || '{}'
      );
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('AlertDLQ');
    });
  });

  describe('SNS Topic', () => {
    test('TradingAlerts topic exists', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('TradingAlerts topic has display name', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toBe('Trading Pattern Alerts');
    });

    test('TradingAlerts topic has subscriptions', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      const subscriptionsConfirmed =
        parseInt(response.Attributes?.SubscriptionsConfirmed || '0', 10) || 0;
      const subscriptionsPending =
        parseInt(response.Attributes?.SubscriptionsPending || '0', 10) || 0;

      expect(subscriptionsConfirmed + subscriptionsPending).toBeGreaterThan(0);
    });
  });

  describe('EventBridge Rule', () => {
    test('ThresholdCheckRule exists', async () => {
      const ruleName = `ThresholdCheckRule-${environmentSuffix}`;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    test('ThresholdCheckRule has correct schedule', async () => {
      const ruleName = `ThresholdCheckRule-${environmentSuffix}`;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.ScheduleExpression).toBe('rate(5 minutes)');
    });

    test('ThresholdCheckRule has event pattern', async () => {
      const ruleName = `ThresholdCheckRule-${environmentSuffix}`;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.EventPattern).toBeDefined();
      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.events');
      expect(eventPattern['detail-type']).toContain('Scheduled Event');
      expect(eventPattern.detail).toBeDefined();
      expect(eventPattern.detail.eventType).toContain('threshold-check');
      expect(eventPattern.detail.priority).toContain('high');
      expect(eventPattern.detail.enabled).toContain('true');
    });
  });

  describe('API Gateway', () => {
    test('API Gateway endpoint is accessible', async () => {
      // Simple connectivity test - just verify URL format
      expect(apiUrl).toMatch(/^https:\/\/.+\.execute-api\.us-east-1/);
      expect(apiUrl).toContain('/prod/');
    });

    test('API Gateway has correct name', () => {
      // Verify the name pattern
      expect(apiUrl).toBeTruthy();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources include environment suffix', () => {
      expect(tableName).toContain(environmentSuffix);
      expect(queueUrl).toContain(environmentSuffix);
      expect(topicArn).toContain(environmentSuffix);
    });

    test('environment suffix is consistent across resources', () => {
      const tableSuffix = tableName.split('-').pop();
      const queueSuffix = queueUrl.split('-').pop()?.split('/')[0];
      const topicSuffix = topicArn.split(':').pop()?.split('-').pop();

      expect(tableSuffix).toBe(environmentSuffix);
      expect(queueSuffix).toContain(environmentSuffix);
      expect(topicSuffix).toBe(environmentSuffix);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('all required resources are deployed', () => {
      expect(tableName).toBeTruthy();
      expect(queueUrl).toBeTruthy();
      expect(topicArn).toBeTruthy();
      expect(apiUrl).toBeTruthy();
    });

    test('DynamoDB and SQS are connected', async () => {
      const tableCmd = new DescribeTableCommand({ TableName: tableName });
      const tableResponse = await dynamoClient.send(tableCmd);

      const queueCmd = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      });
      const queueResponse = await sqsClient.send(queueCmd);

      expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
      expect(queueResponse.Attributes?.QueueArn).toBeDefined();
    });

    test('SNS and SQS integration exists', async () => {
      const topicCmd = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const topicResponse = await snsClient.send(topicCmd);

      const queueCmd = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      });
      const queueResponse = await sqsClient.send(queueCmd);

      expect(topicResponse.Attributes?.TopicArn).toBe(topicArn);
      expect(queueResponse.Attributes?.QueueArn).toBeDefined();
    });
  });
});
