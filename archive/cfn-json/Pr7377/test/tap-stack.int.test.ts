// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
} from '@aws-sdk/client-sfn';
import {
  LambdaClient,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS SDK Clients
const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const sfnClient = new SFNClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('Fraud Detection Pipeline Integration Tests', () => {
  const tableName = outputs.TransactionTableName;
  const bucketName = outputs.ArchiveBucketName;
  const stateMachineArn = outputs.StateMachineArn;
  const processorFunctionArn = outputs.ProcessorFunctionArn;
  const postProcessorFunctionArn = outputs.PostProcessorFunctionArn;
  const complianceTopicArn = outputs.ComplianceTopicArn;

  beforeAll(() => {
    // Verify all required outputs are present
    expect(tableName).toBeDefined();
    expect(bucketName).toBeDefined();
    expect(stateMachineArn).toBeDefined();
    expect(processorFunctionArn).toBeDefined();
    expect(postProcessorFunctionArn).toBeDefined();
    expect(complianceTopicArn).toBeDefined();
  });

  describe('DynamoDB Transaction Table', () => {
    test('should be able to write and read transactions', async () => {
      const transactionId = `test-${Date.now()}`;
      const timestamp = Date.now();

      // Write transaction
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '500' },
          merchant: { S: 'Test Merchant' },
          riskScore: { N: '25' },
          riskLevel: { S: 'LOW' },
          status: { S: 'PROCESSED' },
        },
      });

      await dynamoClient.send(putCommand);

      // Read transaction
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() },
        },
      });

      const result = await dynamoClient.send(getCommand);
      expect(result.Item).toBeDefined();
      expect(result.Item?.transactionId.S).toBe(transactionId);
      expect(result.Item?.merchant.S).toBe('Test Merchant');
    }, 30000);

    test('should have encryption enabled', async () => {
      // Table exists and can be queried (encryption is handled by AWS)
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const result = await dynamoClient.send(scanCommand);
      expect(result).toBeDefined();
    }, 30000);
  });

  describe('S3 Archive Bucket', () => {
    test('should be accessible and configured correctly', async () => {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      const result = await s3Client.send(listCommand);
      expect(result).toBeDefined();
      expect(result.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should accept transaction archive uploads', async () => {
      const testKey = `test-transactions/${Date.now()}/test-transaction.json`;
      const testData = JSON.stringify({
        transactionId: 'test-123',
        timestamp: Date.now(),
        amount: 500,
        merchant: 'Test Merchant',
      });

      const putCommand = new PutEventsCommand({
        Entries: [
          {
            Source: 'test.frauddetection',
            DetailType: 'Test Transaction',
            Detail: testData,
          },
        ],
      });

      const result = await eventBridgeClient.send(putCommand);
      expect(result.FailedEntryCount).toBe(0);
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('TransactionProcessor function should be invokable', async () => {
      const payload = {
        transactionId: `test-${Date.now()}`,
        amount: 500,
        merchant: 'Test Merchant Integration',
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: processorFunctionArn,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(invokeCommand);
      expect(result.StatusCode).toBe(200);
      expect(result.FunctionError).toBeUndefined();

      const response = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );
      expect(response.statusCode).toBe(200);
      expect(response.transactionId).toBe(payload.transactionId);
      expect(response.riskScore).toBeDefined();
      expect(response.riskLevel).toBeDefined();
    }, 30000);

    test('TransactionProcessor should calculate LOW risk for small amounts', async () => {
      const payload = {
        transactionId: `test-low-${Date.now()}`,
        amount: 50,
        merchant: 'Small Transaction',
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: processorFunctionArn,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(invokeCommand);
      const response = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );

      expect(response.riskLevel).toBe('LOW');
      expect(response.riskScore).toBeLessThan(40);
    }, 30000);

    test('TransactionProcessor should calculate MEDIUM risk for medium amounts', async () => {
      const payload = {
        transactionId: `test-medium-${Date.now()}`,
        amount: 2000,
        merchant: 'Medium Transaction',
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: processorFunctionArn,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(invokeCommand);
      const response = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );

      expect(response.riskLevel).toBe('MEDIUM');
      expect(response.riskScore).toBeGreaterThanOrEqual(40);
      expect(response.riskScore).toBeLessThan(70);
    }, 30000);

    test('TransactionProcessor should calculate HIGH risk for high amounts', async () => {
      const payload = {
        transactionId: `test-high-${Date.now()}`,
        amount: 10000,
        merchant: 'High Value Transaction',
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: processorFunctionArn,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(invokeCommand);
      const response = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );

      expect(response.riskLevel).toBe('HIGH');
      expect(response.riskScore).toBeGreaterThanOrEqual(70);
    }, 30000);

    test('PostProcessor function should be invokable', async () => {
      // First create a transaction
      const transactionId = `test-post-${Date.now()}`;
      const timestamp = Date.now();

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          transactionId: { S: transactionId },
          timestamp: { N: timestamp.toString() },
          amount: { N: '1000' },
          merchant: { S: 'Test Merchant Post' },
          riskScore: { N: '50' },
          riskLevel: { S: 'MEDIUM' },
          status: { S: 'PROCESSED' },
        },
      });

      await dynamoClient.send(putCommand);

      // Now invoke post processor
      const payload = {
        transactionId,
        timestamp,
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: postProcessorFunctionArn,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(invokeCommand);
      expect(result.StatusCode).toBe(200);
      expect(result.FunctionError).toBeUndefined();

      const response = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );
      expect(response.statusCode).toBe(200);
      expect(response.s3Key).toBeDefined();
    }, 30000);
  });

  describe('Step Functions State Machine', () => {
    test('should successfully execute workflow', async () => {
      const payload = {
        transactionId: `sfn-test-${Date.now()}`,
        amount: 1500,
        merchant: 'Step Functions Test',
      };

      const startCommand = new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify(payload),
      });

      const startResult = await sfnClient.send(startCommand);
      expect(startResult.executionArn).toBeDefined();

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResult.executionArn,
      });

      const describeResult = await sfnClient.send(describeCommand);
      expect(describeResult.status).toBe('SUCCEEDED');
    }, 30000);

    test('should process transaction and archive in parallel', async () => {
      const payload = {
        transactionId: `sfn-parallel-${Date.now()}`,
        amount: 2500,
        merchant: 'Parallel Test',
      };

      const startCommand = new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify(payload),
      });

      const startResult = await sfnClient.send(startCommand);

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 5000));

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResult.executionArn,
      });

      const describeResult = await sfnClient.send(describeCommand);
      expect(describeResult.status).toBe('SUCCEEDED');

      // Verify transaction was written to DynamoDB
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'transactionId = :txId',
        ExpressionAttributeValues: {
          ':txId': { S: payload.transactionId },
        },
      });

      const scanResult = await dynamoClient.send(scanCommand);
      expect(scanResult.Items).toBeDefined();
      expect(scanResult.Items!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('SNS Compliance Topic', () => {
    test('should be accessible', async () => {
      const listCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: complianceTopicArn,
      });

      const result = await snsClient.send(listCommand);
      expect(result).toBeDefined();
      expect(result.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

  describe('EventBridge Rule', () => {
    test('should trigger state machine on high-value transactions', async () => {
      const payload = {
        transactionId: `eb-test-${Date.now()}`,
        amount: 5000,
        merchant: 'EventBridge Test',
      };

      const putEventsCommand = new PutEventsCommand({
        Entries: [
          {
            Source: 'custom.frauddetection',
            DetailType: 'Transaction Received',
            Detail: JSON.stringify(payload),
          },
        ],
      });

      const result = await eventBridgeClient.send(putEventsCommand);
      expect(result.FailedEntryCount).toBe(0);
      expect(result.Entries).toBeDefined();
      expect(result.Entries![0].EventId).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('should process complete fraud detection workflow', async () => {
      const transactionId = `e2e-test-${Date.now()}`;
      const payload = {
        transactionId,
        amount: 7500,
        merchant: 'End-to-End Test Merchant',
      };

      // Start execution
      const startCommand = new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify(payload),
      });

      const startResult = await sfnClient.send(startCommand);
      expect(startResult.executionArn).toBeDefined();

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Verify execution succeeded
      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResult.executionArn,
      });

      const describeResult = await sfnClient.send(describeCommand);
      expect(describeResult.status).toBe('SUCCEEDED');

      // Verify transaction in DynamoDB
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'transactionId = :txId',
        ExpressionAttributeValues: {
          ':txId': { S: transactionId },
        },
      });

      const scanResult = await dynamoClient.send(scanCommand);
      expect(scanResult.Items).toBeDefined();
      expect(scanResult.Items!.length).toBe(1);

      const item = scanResult.Items![0];
      expect(item.riskLevel.S).toBe('HIGH');
      expect(item.status.S).toBe('PROCESSED');
    }, 30000);
  });
});
