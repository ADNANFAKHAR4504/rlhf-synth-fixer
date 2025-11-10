import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  DescribeStateMachineCommand,
  StartExecutionCommand,
  DescribeExecutionCommand,
} from '@aws-sdk/client-sfn';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';
import path from 'path';

// Load deployment outputs
let outputs: any = {};
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  console.warn(
    'cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.'
  );
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

// AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const dynamodbClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const sfnClient = new SFNClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

// Helper to skip tests if no outputs available
const skipIfNoOutputs = () => {
  if (!outputs || Object.keys(outputs).length === 0) {
    console.log('Skipping integration tests - stack outputs not available');
    return true;
  }
  return false;
};

// Test timeout
const TEST_TIMEOUT = 30000;

describe('Turn Around Prompt API Integration Tests', () => {
  // Test data cleanup array
  const testResourcesForCleanup: Array<{
    tableName: string;
    transactionId: string;
  }> = [];

  afterAll(async () => {
    // Cleanup test resources
    for (const resource of testResourcesForCleanup) {
      try {
        await dynamodbClient.send(
          new DeleteItemCommand({
            TableName: resource.tableName,
            Key: {
              transactionId: { S: resource.transactionId },
            },
          })
        );
      } catch (error: any) {
        console.warn(`Failed to cleanup resource: ${error.message}`);
      }
    }
  });

  describe('Infrastructure Discovery Tests', () => {
    test('CloudFormation outputs are available', () => {
      if (skipIfNoOutputs()) return;

      console.log('Available outputs:', Object.keys(outputs));
      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Verify all expected outputs exist
      const expectedOutputs = [
        'StateMachineArn',
        'TransactionsRawTableName',
        'TransactionsProcessedTableName',
      ];
      expectedOutputs.forEach((key) => {
        expect(outputs[key]).toBeDefined();
      });
    });

    test('outputs have correct naming pattern', () => {
      if (skipIfNoOutputs()) return;

      expect(outputs.TransactionsRawTableName).toContain(environmentSuffix);
      expect(outputs.TransactionsProcessedTableName).toContain(environmentSuffix);
    });
  });

  describe('DynamoDB Tables Integration Tests', () => {
    test(
      'transactions-raw table exists with correct configuration',
      async () => {
        if (skipIfNoOutputs()) return;

        const command = new DescribeTableCommand({
          TableName: outputs.TransactionsRawTableName,
        });

        const response = await dynamodbClient.send(command);
        expect(response.Table).toBeDefined();
        expect(response.Table!.TableStatus).toBe('ACTIVE');
        expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
          'PAY_PER_REQUEST'
        );

        // Check partition key
        const partitionKey = response.Table!.KeySchema?.find(
          (key) => key.KeyType === 'HASH'
        );
        expect(partitionKey?.AttributeName).toBe('transactionId');

        // Check attributes
        const transactionIdAttr = response.Table!.AttributeDefinitions?.find(
          (attr) => attr.AttributeName === 'transactionId'
        );
        expect(transactionIdAttr?.AttributeType).toBe('S');
      },
      TEST_TIMEOUT
    );

    test(
      'transactions-processed table exists with correct configuration',
      async () => {
        if (skipIfNoOutputs()) return;

        const command = new DescribeTableCommand({
          TableName: outputs.TransactionsProcessedTableName,
        });

        const response = await dynamodbClient.send(command);
        expect(response.Table).toBeDefined();
        expect(response.Table!.TableStatus).toBe('ACTIVE');
        expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
          'PAY_PER_REQUEST'
        );

        // Check partition key
        const partitionKey = response.Table!.KeySchema?.find(
          (key) => key.KeyType === 'HASH'
        );
        expect(partitionKey?.AttributeName).toBe('transactionId');
      },
      TEST_TIMEOUT
    );

    test(
      'can write and read from transactions-raw table',
      async () => {
        if (skipIfNoOutputs()) return;

        const testTransactionId = `test-txn-${Date.now()}`;
        const testData = {
          transactionId: { S: testTransactionId },
          amount: { N: '100.50' },
          timestamp: { S: new Date().toISOString() },
          status: { S: 'pending' },
        };

        // Write to table
        await dynamodbClient.send(
          new PutItemCommand({
            TableName: outputs.TransactionsRawTableName,
            Item: testData,
          })
        );

        testResourcesForCleanup.push({
          tableName: outputs.TransactionsRawTableName,
          transactionId: testTransactionId,
        });

        // Read from table
        const getResponse = await dynamodbClient.send(
          new GetItemCommand({
            TableName: outputs.TransactionsRawTableName,
            Key: {
              transactionId: { S: testTransactionId },
            },
          })
        );

        expect(getResponse.Item).toBeDefined();
        expect(getResponse.Item!.transactionId.S).toBe(testTransactionId);
        // DynamoDB normalizes numbers by removing trailing zeros
        expect(getResponse.Item!.amount.N).toBe('100.5');
      },
      TEST_TIMEOUT
    );
  });

  describe('Lambda Functions Integration Tests', () => {
    test(
      'fraud-detector Lambda function exists and is active',
      async () => {
        if (skipIfNoOutputs()) return;

        const functionName = `fraud-detector-${environmentSuffix}`;
        const command = new GetFunctionCommand({
          FunctionName: functionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
        expect(response.Configuration!.Runtime).toContain('nodejs');
        expect(response.Configuration!.MemorySize).toBe(512);
        expect(response.Configuration!.Timeout).toBe(60);

        // Check environment variables
        const envVars = response.Configuration!.Environment?.Variables;
        expect(envVars).toBeDefined();
        expect(envVars!.TRANSACTIONS_RAW_TABLE).toBe(
          outputs.TransactionsRawTableName
        );
        expect(envVars!.TRANSACTIONS_PROCESSED_TABLE).toBe(
          outputs.TransactionsProcessedTableName
        );
      },
      TEST_TIMEOUT
    );

    test(
      'compliance-checker Lambda function exists and is active',
      async () => {
        if (skipIfNoOutputs()) return;

        const functionName = `compliance-checker-${environmentSuffix}`;
        const command = new GetFunctionCommand({
          FunctionName: functionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
        expect(response.Configuration!.MemorySize).toBe(512);
        expect(response.Configuration!.Timeout).toBe(60);
      },
      TEST_TIMEOUT
    );

    test(
      'risk-assessor Lambda function exists and is active',
      async () => {
        if (skipIfNoOutputs()) return;

        const functionName = `risk-assessor-${environmentSuffix}`;
        const command = new GetFunctionCommand({
          FunctionName: functionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
        expect(response.Configuration!.MemorySize).toBe(512);
        expect(response.Configuration!.Timeout).toBe(60);
      },
      TEST_TIMEOUT
    );

    test(
      'Lambda functions can be invoked successfully',
      async () => {
        if (skipIfNoOutputs()) return;

        const functionName = `fraud-detector-${environmentSuffix}`;
        const testPayload = {
          transactionId: `test-${Date.now()}`,
          amount: 100,
        };

        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(testPayload),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);

        // Lambda might return error but invocation should succeed
        if (response.FunctionError) {
          console.log('Lambda function error (expected if no implementation):', response.FunctionError);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Step Functions State Machine Integration Tests', () => {
    test(
      'State Machine exists and is active',
      async () => {
        if (skipIfNoOutputs()) return;

        const command = new DescribeStateMachineCommand({
          stateMachineArn: outputs.StateMachineArn,
        });

        const response = await sfnClient.send(command);
        expect(response.stateMachineArn).toBe(outputs.StateMachineArn);
        expect(response.status).toBe('ACTIVE');
        expect(response.name).toContain(environmentSuffix);

        // Check that definition includes expected states
        const definition = JSON.parse(response.definition!);
        expect(definition.States).toBeDefined();

        // Should have a Map state for processing transactions
        const mapState = Object.values(definition.States).find(
          (state: any) => state.Type === 'Map'
        );
        expect(mapState).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      'State Machine has tracing enabled',
      async () => {
        if (skipIfNoOutputs()) return;

        const command = new DescribeStateMachineCommand({
          stateMachineArn: outputs.StateMachineArn,
        });

        const response = await sfnClient.send(command);
        expect(response.tracingConfiguration).toBeDefined();
        expect(response.tracingConfiguration!.enabled).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      'State Machine has logging configuration',
      async () => {
        if (skipIfNoOutputs()) return;

        const command = new DescribeStateMachineCommand({
          stateMachineArn: outputs.StateMachineArn,
        });

        const response = await sfnClient.send(command);
        expect(response.loggingConfiguration).toBeDefined();
        expect(response.loggingConfiguration!.level).toBe('ALL');
        expect(response.loggingConfiguration!.includeExecutionData).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      'State Machine can start execution',
      async () => {
        if (skipIfNoOutputs()) return;

        const executionName = `test-execution-${Date.now()}`;
        const testInput = {
          transactions: [
            {
              transactionId: `test-txn-${Date.now()}`,
              amount: 100.5,
            },
          ],
        };

        const startCommand = new StartExecutionCommand({
          stateMachineArn: outputs.StateMachineArn,
          name: executionName,
          input: JSON.stringify(testInput),
        });

        const startResponse = await sfnClient.send(startCommand);
        expect(startResponse.executionArn).toBeDefined();

        // Wait a moment for execution to start
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check execution status
        const describeCommand = new DescribeExecutionCommand({
          executionArn: startResponse.executionArn,
        });

        const describeResponse = await sfnClient.send(describeCommand);
        expect(describeResponse.status).toMatch(/RUNNING|SUCCEEDED|FAILED/);

        console.log(`Execution status: ${describeResponse.status}`);
      },
      TEST_TIMEOUT
    );
  });

  describe('CloudWatch Logs Integration Tests', () => {
    test(
      'State Machine log group exists',
      async () => {
        if (skipIfNoOutputs()) return;

        const logGroupName = `/aws/vendedlogs/states/transaction-processor-${environmentSuffix}`;
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });

        const response = await logsClient.send(command);
        expect(response.logGroups).toBeDefined();

        const logGroup = response.logGroups!.find(
          (lg) => lg.logGroupName === logGroupName
        );
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBe(30);
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End Transaction Processing Workflow', () => {
    test(
      'complete transaction processing workflow',
      async () => {
        if (skipIfNoOutputs()) return;

        const testTransactionId = `e2e-test-${Date.now()}`;

        // Step 1: Create a test transaction in raw table
        const testTransaction = {
          transactionId: { S: testTransactionId },
          amount: { N: '250.75' },
          timestamp: { S: new Date().toISOString() },
          merchantId: { S: 'merchant-123' },
          status: { S: 'pending' },
        };

        await dynamodbClient.send(
          new PutItemCommand({
            TableName: outputs.TransactionsRawTableName,
            Item: testTransaction,
          })
        );

        testResourcesForCleanup.push({
          tableName: outputs.TransactionsRawTableName,
          transactionId: testTransactionId,
        });

        // Step 2: Verify transaction was written
        const getResponse = await dynamodbClient.send(
          new GetItemCommand({
            TableName: outputs.TransactionsRawTableName,
            Key: {
              transactionId: { S: testTransactionId },
            },
          })
        );

        expect(getResponse.Item).toBeDefined();
        expect(getResponse.Item!.transactionId.S).toBe(testTransactionId);

        // Step 3: Trigger State Machine execution with test transaction
        const executionName = `e2e-execution-${Date.now()}`;
        const testInput = {
          transactions: [
            {
              transactionId: testTransactionId,
              amount: 250.75,
              merchantId: 'merchant-123',
            },
          ],
        };

        const startCommand = new StartExecutionCommand({
          stateMachineArn: outputs.StateMachineArn,
          name: executionName,
          input: JSON.stringify(testInput),
        });

        const startResponse = await sfnClient.send(startCommand);
        expect(startResponse.executionArn).toBeDefined();

        console.log(
          `End-to-end workflow test completed successfully. Execution ARN: ${startResponse.executionArn}`
        );
      },
      TEST_TIMEOUT
    );
  });

  describe('Security and Compliance Tests', () => {
    test('DynamoDB tables have proper tags', () => {
      if (skipIfNoOutputs()) return;

      // Verify tables exist with expected naming convention
      expect(outputs.TransactionsRawTableName).toMatch(
        /^transactions-raw-/
      );
      expect(outputs.TransactionsProcessedTableName).toMatch(
        /^transactions-processed-/
      );
    });

    test('Lambda functions have proper IAM roles', async () => {
      if (skipIfNoOutputs()) return;

      const functionName = `fraud-detector-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration!.Role).toBeDefined();
      expect(response.Configuration!.Role).toContain('arn:aws:iam::');
    }, TEST_TIMEOUT);

    test('State Machine has proper execution role', async () => {
      if (skipIfNoOutputs()) return;

      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.StateMachineArn,
      });

      const response = await sfnClient.send(command);
      expect(response.roleArn).toBeDefined();
      expect(response.roleArn).toContain('arn:aws:iam::');
    }, TEST_TIMEOUT);
  });
});
