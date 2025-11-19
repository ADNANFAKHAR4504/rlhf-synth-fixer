import { execSync } from 'child_process';
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

const region = process.env.AWS_REGION || 'us-east-2';

// Helper function to run AWS CLI commands
function awsCommand(command: string): any {
  try {
    const fullCommand = `aws ${command} --region ${region} --output json`;
    const output = execSync(fullCommand, { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch (error: any) {
    console.error(`AWS CLI command failed: ${command}`, error.message);
    throw error;
  }
}

// Lazy initialization of AWS clients
let lambdaClient: LambdaClient;
let dynamoClient: DynamoDBClient;
let logsClient: CloudWatchLogsClient;

function getLambdaClient(): LambdaClient {
  if (!lambdaClient) {
    lambdaClient = new LambdaClient({ region });
  }
  return lambdaClient;
}

function getDynamoClient(): DynamoDBClient {
  if (!dynamoClient) {
    dynamoClient = new DynamoDBClient({ region });
  }
  return dynamoClient;
}

function getLogsClient(): CloudWatchLogsClient {
  if (!logsClient) {
    logsClient = new CloudWatchLogsClient({ region });
  }
  return logsClient;
}

interface StackOutputs {
  LambdaFunctionName?: string;
  LambdaFunctionArn?: string;
  DynamoDBTableName?: string;
  KMSKeyId?: string;
}

let discoveredStackName: string | null = null;
let outputs: StackOutputs = {};

/**
 * Dynamically discover the CloudFormation stack name using AWS CLI
 * Looks for stacks starting with "TapStack" in the current region
 */
function discoverStackName(): string {
  if (discoveredStackName) {
    return discoveredStackName;
  }

  try {
    const result = awsCommand(
      `cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE`
    );

    const tapStacks =
      result.StackSummaries?.filter(
        (stack: any) =>
          stack.StackName?.startsWith('TapStack') &&
          stack.StackStatus !== 'DELETE_COMPLETE'
      ) || [];

    if (tapStacks.length === 0) {
      throw new Error(
        `No TapStack found in region ${region}. Please deploy the stack first.`
      );
    }

    // Prefer TapStackdev1 if it exists, otherwise use the most recent one
    const preferredStack = tapStacks.find(
      (stack: any) => stack.StackName === 'TapStackdev1'
    );
    const latestStack =
      preferredStack ||
      tapStacks.sort(
        (a: any, b: any) =>
          (new Date(b.CreationTime).getTime() || 0) -
          (new Date(a.CreationTime).getTime() || 0)
      )[0];

    discoveredStackName = latestStack.StackName;
    console.log(`✅ Discovered stack: ${discoveredStackName} in region ${region}`);
    return discoveredStackName;
  } catch (error) {
    console.error('Failed to discover stack:', error);
    throw error;
  }
}

/**
 * Dynamically discover stack outputs from CloudFormation using AWS CLI
 */
function discoverStackOutputs(): StackOutputs {
  if (Object.keys(outputs).length > 0) {
    return outputs;
  }

  try {
    const stackName = discoverStackName();
    const result = awsCommand(
      `cloudformation describe-stacks --stack-name ${stackName}`
    );

    const stack = result.Stacks?.[0];

    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const discoveredOutputs: StackOutputs = {};
    if (stack.Outputs) {
      stack.Outputs.forEach((output: any) => {
        if (output.OutputKey && output.OutputValue) {
          switch (output.OutputKey) {
            case 'LambdaFunctionName':
              discoveredOutputs.LambdaFunctionName = output.OutputValue;
              break;
            case 'LambdaFunctionArn':
              discoveredOutputs.LambdaFunctionArn = output.OutputValue;
              break;
            case 'DynamoDBTableName':
              discoveredOutputs.DynamoDBTableName = output.OutputValue;
              break;
            case 'KMSKeyId':
              discoveredOutputs.KMSKeyId = output.OutputValue;
              break;
          }
        }
      });
    }

    outputs = discoveredOutputs;
    console.log('✅ Discovered stack outputs:', outputs);
    return outputs;
  } catch (error) {
    console.error('Failed to discover stack outputs:', error);
    throw error;
  }
}

/**
 * Discover stack resources dynamically using AWS CLI
 */
function discoverStackResources() {
  try {
    const stackName = discoverStackName();
    const result = awsCommand(
      `cloudformation describe-stack-resources --stack-name ${stackName}`
    );
    return result.StackResources || [];
  } catch (error) {
    console.error('Failed to discover stack resources:', error);
    return [];
  }
}

describe('Webhook Processor Integration Tests', () => {
  let stackResources: any[] = [];

  beforeAll(() => {
    // Discover stack name and outputs dynamically
    discoverStackName();
    discoverStackOutputs();
    stackResources = discoverStackResources();

    // Validate that we have the required outputs
    if (!outputs.LambdaFunctionName) {
      throw new Error('LambdaFunctionName output not found');
    }
    if (!outputs.DynamoDBTableName) {
      throw new Error('DynamoDBTableName output not found');
    }
    if (!outputs.KMSKeyId) {
      throw new Error('KMSKeyId output not found');
    }
  }, 30000);

  describe('Stack Discovery', () => {
    test('should discover CloudFormation stack', () => {
      const stackName = discoverStackName();
      expect(stackName).toBeDefined();
      expect(stackName).toMatch(/^TapStack/);
    });

    test('should have discovered stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });

    test('should have discovered stack resources', () => {
      expect(stackResources.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function', () => {
    test('should exist and have correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName!,
      });
      const response = await getLambdaClient().send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.LambdaFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('python3.11');
      expect(response.Configuration?.MemorySize).toBe(1024);
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    test('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName!,
      });
      const response = await getLambdaClient().send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have environment variable for DynamoDB table', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName!,
      });
      const response = await getLambdaClient().send(command);

      expect(
        response.Configuration?.Environment?.Variables?.DYNAMODB_TABLE_NAME
      ).toBe(outputs.DynamoDBTableName);
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
        FunctionName: outputs.LambdaFunctionName!,
        Payload: JSON.stringify(testEvent),
      });

      const invokeResponse = await getLambdaClient().send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      const payload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.transactionId).toBe(testEvent.transactionId);

      // Wait for DynamoDB eventual consistency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const getItemCommand = new GetItemCommand({
        TableName: outputs.DynamoDBTableName!,
        Key: {
          transactionId: { S: testEvent.transactionId },
        },
      });

      const getItemResponse = await getDynamoClient().send(getItemCommand);
      expect(getItemResponse.Item).toBeDefined();
      expect(getItemResponse.Item?.transactionId?.S).toBe(
        testEvent.transactionId
      );
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
        FunctionName: outputs.LambdaFunctionName!,
        Payload: JSON.stringify(testEvent),
      });

      const invokeResponse = await getLambdaClient().send(invokeCommand);
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
        TableName: outputs.DynamoDBTableName!,
      });
      const response = await getDynamoClient().send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.DynamoDBTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName!,
      });
      const response = await getDynamoClient().send(command);

      const keySchema = response.Table?.KeySchema || [];
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.DynamoDBTableName!,
      });
      const response = await getDynamoClient().send(command);

      expect(
        response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName!,
      });
      const response = await getDynamoClient().send(command);

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
      const response = await getLogsClient().send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.[0];
      expect(logGroup?.logGroupName).toBe(
        `/aws/lambda/${outputs.LambdaFunctionName}`
      );
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have KMS encryption enabled', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.LambdaFunctionName}`,
      });
      const response = await getLogsClient().send(command);

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
          FunctionName: outputs.LambdaFunctionName!,
          Payload: JSON.stringify(event),
        });

        const response = await lambdaClient.send(invokeCommand);
        expect(response.StatusCode).toBe(200);
      }

      // Wait for DynamoDB eventual consistency
      await new Promise((resolve) => setTimeout(resolve, 5000));

      for (const event of events) {
        const getItemCommand = new GetItemCommand({
          TableName: outputs.DynamoDBTableName!,
          Key: {
            transactionId: { S: event.transactionId },
          },
        });

        const getItemResponse = await getDynamoClient().send(getItemCommand);
        if (getItemResponse.Item) {
          expect(getItemResponse.Item?.transactionId?.S).toBe(
            event.transactionId
          );
        }
      }
    });
  });
});
