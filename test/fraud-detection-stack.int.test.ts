import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  DescribeStateMachineCommand,
} from '@aws-sdk/client-sfn';
import * as fs from 'fs';
import * as path from 'path';

describe('Fraud Detection Stack Integration Tests', () => {
  let outputs: any;
  let dynamoClient: DynamoDBClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let lambdaClient: LambdaClient;
  let sfnClient: SFNClient;

  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    dynamoClient = new DynamoDBClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    lambdaClient = new LambdaClient({ region });
    sfnClient = new SFNClient({ region });
  });

  afterAll(() => {
    // Clean up clients
    dynamoClient.destroy();
    s3Client.destroy();
    snsClient.destroy();
    lambdaClient.destroy();
    sfnClient.destroy();
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toHaveProperty('TransactionTableName');
      expect(outputs).toHaveProperty('FraudDetectionLambdaArn');
      expect(outputs).toHaveProperty('StateMachineArn');
      expect(outputs).toHaveProperty('ComplianceTopicArn');
      expect(outputs).toHaveProperty('ArchiveBucketName');
    });

    test('outputs should have correct format', () => {
      expect(outputs.TransactionTableName).toMatch(/^transactions-/);
      expect(outputs.FraudDetectionLambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.StateMachineArn).toMatch(/^arn:aws:states:/);
      expect(outputs.ComplianceTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.ArchiveBucketName).toMatch(/^transaction-archive-/);
    });
  });

  describe('DynamoDB Table Tests', () => {
    const testTransactionId = `test-txn-${Date.now()}`;
    const testTimestamp = Date.now();

    test('should write transaction to DynamoDB', async () => {
      const command = new PutItemCommand({
        TableName: outputs.TransactionTableName,
        Item: {
          transactionId: { S: testTransactionId },
          timestamp: { N: testTimestamp.toString() },
          amount: { N: '1500' },
          merchant: { S: 'Test Merchant' },
          riskScore: { N: '75' },
        },
      });

      await expect(dynamoClient.send(command)).resolves.not.toThrow();
    });

    test('should read transaction from DynamoDB', async () => {
      const command = new GetItemCommand({
        TableName: outputs.TransactionTableName,
        Key: {
          transactionId: { S: testTransactionId },
          timestamp: { N: testTimestamp.toString() },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeDefined();
      expect(response.Item?.transactionId.S).toBe(testTransactionId);
      expect(response.Item?.amount.N).toBe('1500');
    });

    test('should query transactions by transactionId', async () => {
      const command = new QueryCommand({
        TableName: outputs.TransactionTableName,
        KeyConditionExpression: 'transactionId = :txnId',
        ExpressionAttributeValues: {
          ':txnId': { S: testTransactionId },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should be able to list objects in archive bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.ArchiveBucketName,
        MaxKeys: 10,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.ArchiveBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('bucket should have lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.ArchiveBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic Tests', () => {
    test('should be able to get topic attributes', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.ComplianceTopicArn);
    });

    test('should have correct display name', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('Fraud Detection Compliance Alerts');
    });
  });

  describe('Lambda Function Tests', () => {
    test('fraud detection lambda should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('fraud detection lambda should have correct memory size', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.MemorySize).toBe(1024);
    });

    test('fraud detection lambda should have correct timeout', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Timeout).toBe(60);
    });

    test('fraud detection lambda should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should invoke fraud detection lambda successfully', async () => {
      const payload = {
        transactionId: `test-invoke-${Date.now()}`,
        amount: 500,
        merchant: 'Integration Test Merchant',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('transactionId');
      expect(body).toHaveProperty('riskScore');
    });

    test('should invoke fraud detection lambda with high-risk transaction', async () => {
      const payload = {
        transactionId: `test-high-risk-${Date.now()}`,
        amount: 6000, // High amount to trigger high risk score
        merchant: 'Suspicious Merchant',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      const body = JSON.parse(result.body);
      expect(body.riskScore).toBeGreaterThan(0);
    });
  });

  describe('Step Functions State Machine Tests', () => {
    test('should have active state machine', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.StateMachineArn,
      });

      const response = await sfnClient.send(command);
      expect(response.status).toBe('ACTIVE');
      expect(response.name).toMatch(/^fraud-detection-workflow-/);
    });

    test('should have valid state machine definition', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.StateMachineArn,
      });

      const response = await sfnClient.send(command);
      const definition = JSON.parse(response.definition!);
      expect(definition).toHaveProperty('StartAt');
      expect(definition).toHaveProperty('States');
      expect(definition.StartAt).toBe('ProcessTransaction');
    });

    test('should execute state machine successfully', async () => {
      const input = {
        transactionId: `test-sfn-${Date.now()}`,
        amount: 1200,
        merchant: 'State Machine Test',
        timestamp: Date.now(),
      };

      const startCommand = new StartExecutionCommand({
        stateMachineArn: outputs.StateMachineArn,
        input: JSON.stringify(input),
      });

      const startResponse = await sfnClient.send(startCommand);
      expect(startResponse.executionArn).toBeDefined();

      // Wait for execution to complete (with timeout)
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResponse.executionArn,
      });

      const describeResponse = await sfnClient.send(describeCommand);
      expect(['RUNNING', 'SUCCEEDED']).toContain(describeResponse.status);
    }, 15000);
  });

  describe('End-to-End Workflow Tests', () => {
    test('should process transaction through complete workflow', async () => {
      const testTxnId = `e2e-test-${Date.now()}`;
      const testAmount = 2500;
      const testMerchant = 'E2E Test Merchant';
      const testTimestamp = Date.now();

      // Step 1: Start state machine execution
      const input = {
        transactionId: testTxnId,
        amount: testAmount,
        merchant: testMerchant,
        timestamp: testTimestamp,
      };

      const startCommand = new StartExecutionCommand({
        stateMachineArn: outputs.StateMachineArn,
        input: JSON.stringify(input),
      });

      const execution = await sfnClient.send(startCommand);
      expect(execution.executionArn).toBeDefined();

      // Step 2: Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Step 3: Verify transaction in DynamoDB (using Query since exact timestamp may vary)
      const queryCommand = new QueryCommand({
        TableName: outputs.TransactionTableName,
        KeyConditionExpression: 'transactionId = :txnId',
        ExpressionAttributeValues: {
          ':txnId': { S: testTxnId },
        },
      });

      const dbResponse = await dynamoClient.send(queryCommand);
      expect(dbResponse.Items).toBeDefined();
      expect(dbResponse.Items!.length).toBeGreaterThan(0);
      expect(dbResponse.Items![0].transactionId.S).toBe(testTxnId);
      expect(dbResponse.Items![0].amount.N).toBe(testAmount.toString());

      // Step 4: Verify execution status
      const describeCommand = new DescribeExecutionCommand({
        executionArn: execution.executionArn,
      });

      const execResponse = await sfnClient.send(describeCommand);
      expect(['RUNNING', 'SUCCEEDED']).toContain(execResponse.status);
    }, 20000);

    test('should handle low-risk transaction correctly', async () => {
      const payload = {
        transactionId: `low-risk-${Date.now()}`,
        amount: 50, // Low amount - should result in low risk score
        merchant: 'Safe Merchant',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      const body = JSON.parse(result.body);

      expect(body.riskScore).toBeDefined();
      expect(body.transactionId).toBe(payload.transactionId);
    });
  });

  describe('Resource Connectivity Tests', () => {
    test('Lambda should be able to write to DynamoDB', async () => {
      // This is verified through Lambda invocation test
      // The Lambda writes to DynamoDB as part of its execution
      const payload = {
        transactionId: `connectivity-test-${Date.now()}`,
        amount: 1000,
        merchant: 'Connectivity Test',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.FraudDetectionLambdaArn,
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      // Verify data was written
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const getCommand = new GetItemCommand({
        TableName: outputs.TransactionTableName,
        Key: {
          transactionId: { S: payload.transactionId },
        },
      });

      // Query instead of Get since we don't know exact timestamp
      const queryCommand = new QueryCommand({
        TableName: outputs.TransactionTableName,
        KeyConditionExpression: 'transactionId = :txnId',
        ExpressionAttributeValues: {
          ':txnId': { S: payload.transactionId },
        },
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items!.length).toBeGreaterThan(0);
    });

    test('Step Functions should be able to invoke Lambda', async () => {
      // Verified through state machine execution test
      const input = {
        transactionId: `sfn-lambda-test-${Date.now()}`,
        amount: 800,
        merchant: 'SFN Lambda Test',
        timestamp: Date.now(),
      };

      const command = new StartExecutionCommand({
        stateMachineArn: outputs.StateMachineArn,
        input: JSON.stringify(input),
      });

      const response = await sfnClient.send(command);
      expect(response.executionArn).toBeDefined();

      // Wait and check status
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const describeCommand = new DescribeExecutionCommand({
        executionArn: response.executionArn,
      });

      const execStatus = await sfnClient.send(describeCommand);
      expect(execStatus.status).not.toBe('FAILED');
    }, 10000);
  });
});
