// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand, GetFunctionCommand, GetFunctionConcurrencyCommand } from '@aws-sdk/client-lambda';
import { SNSClient, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-2';
const dynamoDBClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const sqsClient = new SQSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('Serverless Cryptocurrency Alert System - Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.AlertIngestionFunctionArn).toBeDefined();
      expect(outputs.AlertProcessingFunctionArn).toBeDefined();
      expect(outputs.AlertsTableName).toBeDefined();
      expect(outputs.CriticalAlertsTopicArn).toBeDefined();
      expect(outputs.IngestionDLQUrl).toBeDefined();
      expect(outputs.ProcessingDLQUrl).toBeDefined();
    });

    test('Lambda function ARNs should be valid', () => {
      expect(outputs.AlertIngestionFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:alert-ingestion-.+$/);
      expect(outputs.AlertProcessingFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:alert-processing-.+$/);
    });

    test('SNS topic ARN should be valid', () => {
      expect(outputs.CriticalAlertsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:critical-alerts-.+$/);
    });

    test('DLQ URLs should be valid', () => {
      expect(outputs.IngestionDLQUrl).toMatch(/^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/alert-ingestion-dlq-.+$/);
      expect(outputs.ProcessingDLQUrl).toMatch(/^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/alert-processing-dlq-.+$/);
    });
  });

  describe('DynamoDB Table', () => {
    test('should be able to write and read alert data', async () => {
      const alertId = `test-alert-${Date.now()}`;
      const timestamp = Date.now();

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.AlertsTableName,
          Item: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
            cryptocurrency: { S: 'BTC' },
            price: { N: '50000' },
            status: { S: 'test' },
          },
        })
      );

      const result = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.AlertsTableName,
          Key: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(result.Item).toBeDefined();
      expect(result.Item?.AlertId.S).toBe(alertId);
      expect(result.Item?.cryptocurrency.S).toBe('BTC');
    }, 30000);

    test('should be able to query alerts by AlertId', async () => {
      const alertId = `query-test-${Date.now()}`;
      const timestamp = Date.now();

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.AlertsTableName,
          Item: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
            cryptocurrency: { S: 'ETH' },
            price: { N: '3000' },
            status: { S: 'test' },
          },
        })
      );

      const queryResult = await dynamoDBClient.send(
        new QueryCommand({
          TableName: outputs.AlertsTableName,
          KeyConditionExpression: 'AlertId = :alertId',
          ExpressionAttributeValues: {
            ':alertId': { S: alertId },
          },
        })
      );

      expect(queryResult.Items).toBeDefined();
      expect(queryResult.Items?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('AlertIngestionFunction should have correct configuration', async () => {
      const functionName = outputs.AlertIngestionFunctionArn.split(':').pop();
      const result = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Architectures).toContain('arm64');
      expect(result.Concurrency?.ReservedConcurrentExecutions).toBe(100);
      expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.AlertsTableName);
      expect(result.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();
    }, 30000);

    test('AlertProcessingFunction should have correct configuration', async () => {
      const functionName = outputs.AlertProcessingFunctionArn.split(':').pop();
      const result = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Architectures).toContain('arm64');
      expect(result.Concurrency?.ReservedConcurrentExecutions).toBe(100);
      expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.AlertsTableName);
      expect(result.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBe(outputs.CriticalAlertsTopicArn);
      expect(result.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();
    }, 30000);

    test('AlertIngestionFunction should successfully ingest alerts', async () => {
      const testAlert = {
        body: JSON.stringify({
          alertId: `lambda-test-${Date.now()}`,
          cryptocurrency: 'BTC',
          price: 45000,
          threshold: 40000,
        }),
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertIngestionFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('ingested successfully');
    }, 30000);

    test('AlertProcessingFunction should process alerts below $1000', async () => {
      const testAlert = {
        alertId: `process-test-low-${Date.now()}`,
        cryptocurrency: 'ETH',
        price: 500,
        timestamp: Date.now(),
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertProcessingFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('processed successfully');
    }, 30000);

    test('AlertProcessingFunction should process high-value alerts above $1000', async () => {
      const testAlert = {
        alertId: `process-test-high-${Date.now()}`,
        cryptocurrency: 'BTC',
        price: 55000,
        timestamp: Date.now(),
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertProcessingFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(response.statusCode).toBe(200);
    }, 30000);
  });

  describe('SNS Topic', () => {
    test('should have email subscription', async () => {
      const result = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: outputs.CriticalAlertsTopicArn,
        })
      );

      expect(result.Subscriptions).toBeDefined();
      expect(result.Subscriptions?.length).toBeGreaterThan(0);
      expect(result.Subscriptions?.[0].Protocol).toBe('email');
    }, 30000);
  });

  describe('Dead Letter Queues', () => {
    test('IngestionDLQ should have correct retention period', async () => {
      const result = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.IngestionDLQUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        })
      );

      expect(result.Attributes?.MessageRetentionPeriod).toBe('1209600');
    }, 30000);

    test('ProcessingDLQ should have correct retention period', async () => {
      const result = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.ProcessingDLQUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        })
      );

      expect(result.Attributes?.MessageRetentionPeriod).toBe('1209600');
    }, 30000);
  });

  describe('CloudWatch Log Groups', () => {
    test('should have log groups for both Lambda functions', async () => {
      const environmentSuffix = outputs.AlertIngestionFunctionArn.split('-').pop()?.split(':')[0] || 'dev';
      const ingestionLogGroupName = `/aws/lambda/alert-ingestion-${environmentSuffix}`;
      const processingLogGroupName = `/aws/lambda/alert-processing-${environmentSuffix}`;

      const result = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/alert-',
        })
      );

      const logGroupNames = result.logGroups?.map(lg => lg.logGroupName) || [];
      expect(logGroupNames).toContain(ingestionLogGroupName);
      expect(logGroupNames).toContain(processingLogGroupName);

      const ingestionLogGroup = result.logGroups?.find(lg => lg.logGroupName === ingestionLogGroupName);
      const processingLogGroup = result.logGroups?.find(lg => lg.logGroupName === processingLogGroupName);

      expect(ingestionLogGroup?.retentionInDays).toBe(3);
      expect(processingLogGroup?.retentionInDays).toBe(3);
    }, 30000);
  });

  describe('End-to-End Alert Processing Flow', () => {
    test('should process alert from ingestion to storage', async () => {
      const alertId = `e2e-test-${Date.now()}`;
      const testAlert = {
        body: JSON.stringify({
          alertId: alertId,
          cryptocurrency: 'BTC',
          price: 48000,
          threshold: 45000,
        }),
      };

      const ingestionResult = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertIngestionFunctionArn,
          Payload: JSON.stringify(testAlert),
        })
      );

      const ingestionResponse = JSON.parse(new TextDecoder().decode(ingestionResult.Payload));
      expect(ingestionResponse.statusCode).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const queryResult = await dynamoDBClient.send(
        new QueryCommand({
          TableName: outputs.AlertsTableName,
          KeyConditionExpression: 'AlertId = :alertId',
          ExpressionAttributeValues: {
            ':alertId': { S: alertId },
          },
        })
      );

      expect(queryResult.Items?.length).toBeGreaterThan(0);
      expect(queryResult.Items?.[0].AlertId.S).toBe(alertId);
    }, 30000);

    test('should handle complete workflow for high-value alerts', async () => {
      const alertId = `e2e-high-value-${Date.now()}`;
      const timestamp = Date.now();

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.AlertsTableName,
          Item: {
            AlertId: { S: alertId },
            Timestamp: { N: timestamp.toString() },
            cryptocurrency: { S: 'BTC' },
            price: { N: '60000' },
            status: { S: 'ingested' },
          },
        })
      );

      const processingAlert = {
        alertId: alertId,
        AlertId: alertId,
        timestamp: timestamp,
        Timestamp: timestamp,
        cryptocurrency: 'BTC',
        price: 60000,
      };

      const processingResult = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.AlertProcessingFunctionArn,
          Payload: JSON.stringify(processingAlert),
        })
      );

      const processingResponse = JSON.parse(new TextDecoder().decode(processingResult.Payload));
      expect(processingResponse.statusCode).toBe(200);
    }, 30000);
  });

  describe('Resource Isolation and Naming', () => {
    test('all resources should use unique environment suffix', () => {
      const extractSuffix = (arn: string) => {
        const parts = arn.split(/[-:]/);
        return parts[parts.length - 1];
      };

      const ingestionSuffix = extractSuffix(outputs.AlertIngestionFunctionArn);
      const processingSuffix = extractSuffix(outputs.AlertProcessingFunctionArn);

      expect(ingestionSuffix).toBeTruthy();
      expect(processingSuffix).toBeTruthy();
      expect(outputs.AlertsTableName).toContain(ingestionSuffix);
      expect(outputs.CriticalAlertsTopicArn).toContain(ingestionSuffix);
    });
  });
});
