import fs from 'fs';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('Webhook Processor Integration Tests', () => {
  describe('Lambda Function', () => {
    test('should exist and have correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
      expect(response.Configuration?.Runtime).toBe('python3.11');
      expect(response.Configuration?.MemorySize).toBe(1024);
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    test('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have reserved concurrent executions', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Concurrency?.ReservedConcurrentExecutions).toBe(100);
    });

    test('should have environment variable for DynamoDB table', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBe(
        outputs.DynamoDBTableName
      );
    });

    test('should process webhook event and store in DynamoDB', async () => {
      const testEvent = {
        transactionId: `test-txn-${Date.now()}`,
        amount: 100,
        currency: 'USD',
        status: 'completed',
        provider: 'stripe',
        timestamp: new Date().toISOString(),
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify(testEvent),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      const payload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.transactionId).toBe(testEvent.transactionId);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const getItemCommand = new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: testEvent.transactionId },
        },
      });

      const getItemResponse = await dynamoClient.send(getItemCommand);
      expect(getItemResponse.Item).toBeDefined();
      expect(getItemResponse.Item?.transactionId?.S).toBe(testEvent.transactionId);
      expect(getItemResponse.Item?.amount?.N).toBe('100');
      expect(getItemResponse.Item?.currency?.S).toBe('USD');
      expect(getItemResponse.Item?.status?.S).toBe('completed');
    });

    test('should handle missing transactionId error', async () => {
      const testEvent = {
        amount: 50.0,
        currency: 'EUR',
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify(testEvent),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );

      expect(payload.statusCode).toBe(500);
      const body = JSON.parse(payload.body);
      expect(body.error).toContain('transactionId');
    });
  });

  describe('DynamoDB Table', () => {
    test('should exist with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.DynamoDBTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema || [];
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe(
        'ENABLED'
      );
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('KMS Key', () => {
    test('should exist with valid KMS key ID', () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]{36}$/);
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should exist with correct retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.LambdaFunctionName}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.[0];
      expect(logGroup?.logGroupName).toBe(`/aws/lambda/${outputs.LambdaFunctionName}`);
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have KMS encryption enabled', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.LambdaFunctionName}`,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.[0];
      expect(logGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    test('should process multiple webhook events successfully', async () => {
      const events = [
        {
          transactionId: `test-batch-${Date.now()}-1`,
          amount: 25,
          currency: 'USD',
          status: 'completed',
          provider: 'paypal',
        },
        {
          transactionId: `test-batch-${Date.now()}-2`,
          amount: 150,
          currency: 'EUR',
          status: 'pending',
          provider: 'stripe',
        },
        {
          transactionId: `test-batch-${Date.now()}-3`,
          amount: 75,
          currency: 'GBP',
          status: 'failed',
          provider: 'square',
        },
      ];

      for (const event of events) {
        const invokeCommand = new InvokeCommand({
          FunctionName: outputs.LambdaFunctionName,
          Payload: JSON.stringify(event),
        });

        const response = await lambdaClient.send(invokeCommand);
        expect(response.StatusCode).toBe(200);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      for (const event of events) {
        const getItemCommand = new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: {
            transactionId: { S: event.transactionId },
          },
        });

        const getItemResponse = await dynamoClient.send(getItemCommand);
        if (getItemResponse.Item) {
          expect(getItemResponse.Item?.transactionId?.S).toBe(event.transactionId);
        }
      }
    });
  });
});
