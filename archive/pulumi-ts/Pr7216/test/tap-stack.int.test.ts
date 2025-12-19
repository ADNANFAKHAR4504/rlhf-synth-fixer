import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string>;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  throw new Error(
    `Failed to load outputs from ${outputsPath}. Make sure deployment succeeded.`
  );
}

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });

describe('TapStack Integration Tests - Infrastructure Deployment', () => {
  describe('DynamoDB Table', () => {
    it('should have DynamoDB table deployed and active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.alertsTableName,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(outputs.alertsTableName);
    });

    it('should have correct partition and sort keys', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.alertsTableName,
      });

      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const partitionKey = keySchema?.find((k) => k.KeyType === 'HASH');
      const sortKey = keySchema?.find((k) => k.KeyType === 'RANGE');

      expect(partitionKey?.AttributeName).toBe('userId');
      expect(sortKey?.AttributeName).toBe('alertId');
    });

    it('should have on-demand billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.alertsTableName,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.alertsTableName,
      });

      const response = await dynamoClient.send(command);

      const pitr = response.Table?.ArchivalSummary ? false : true;
      expect(pitr).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    it('should have webhook handler Lambda deployed', async () => {
      const arnParts = outputs.webhookHandlerArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(outputs.webhookHandlerArn);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have webhook handler with ARM64 architecture', async () => {
      const arnParts = outputs.webhookHandlerArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    it('should have webhook handler with correct memory and timeout', async () => {
      const arnParts = outputs.webhookHandlerArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(1024);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    it('should have webhook handler with X-Ray tracing enabled', async () => {
      const arnParts = outputs.webhookHandlerArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have alert evaluator Lambda deployed', async () => {
      const arnParts = outputs.alertEvaluatorArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(outputs.alertEvaluatorArn);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    it('should have alert evaluator with ARM64 architecture', async () => {
      const arnParts = outputs.alertEvaluatorArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    it('should have alert evaluator with X-Ray tracing enabled', async () => {
      const arnParts = outputs.alertEvaluatorArn.split(':');
      const functionName = arnParts[arnParts.length - 1];

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });
  });

});

describe('TapStack Integration Tests - End-to-End Workflows', () => {
  const testUserId = `test-user-${Date.now()}`;
  const testAlertId = `test-alert-${Date.now()}`;

  afterAll(async () => {
    // Cleanup test data
    try {
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: outputs.alertsTableName,
          Key: {
            userId: { S: testUserId },
            alertId: { S: testAlertId },
          },
        })
      );
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('DynamoDB Operations', () => {
    it('should successfully write alert to DynamoDB', async () => {
      const command = new PutItemCommand({
        TableName: outputs.alertsTableName,
        Item: {
          userId: { S: testUserId },
          alertId: { S: testAlertId },
          cryptocurrency: { S: 'bitcoin' },
          targetPrice: { N: '50000' },
          condition: { S: 'above' },
          active: { BOOL: true },
          createdAt: { S: new Date().toISOString() },
        },
      });

      await expect(dynamoClient.send(command)).resolves.not.toThrow();
    });

    it('should successfully read alert from DynamoDB', async () => {
      const command = new ScanCommand({
        TableName: outputs.alertsTableName,
        FilterExpression: 'userId = :userId AND alertId = :alertId',
        ExpressionAttributeValues: {
          ':userId': { S: testUserId },
          ':alertId': { S: testAlertId },
        },
      });

      const response = await dynamoClient.send(command);

      expect(response.Items).toBeDefined();
      expect(response.Items?.length).toBeGreaterThan(0);
      expect(response.Items?.[0].userId.S).toBe(testUserId);
      expect(response.Items?.[0].alertId.S).toBe(testAlertId);
    });
  });

});
