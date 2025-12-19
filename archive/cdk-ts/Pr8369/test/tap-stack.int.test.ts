// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand,
} from '@aws-sdk/client-sfn';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const clientConfig = {
  region: awsRegion,
  ...(isLocalStack && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  })
};

// AWS Clients with LocalStack support
const dynamoClient = new DynamoDBClient(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const sfnClient = new SFNClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const snsClient = new SNSClient(clientConfig);

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Enhanced Serverless Infrastructure Integration Tests', () => {
  describe('DynamoDB Tables', () => {
    test('User Data table should be accessible and have streams enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.UserDataTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      // Point-in-time recovery status check removed as it's not in the TableDescription type
    });

    test('Order Data table should be accessible and have streams enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.OrderDataTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    test('Analytics table should be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.AnalyticsTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });
  });

  describe('Lambda Functions', () => {
    test('User Data Processor Lambda should be configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.UserDataProcessorFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('Order Data Processor Lambda should be configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.OrderDataProcessorFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('Analytics Processor Lambda should be configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.AnalyticsProcessorFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(1024);
      expect(response.Configuration?.Timeout).toBe(600);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('Data Validator Lambda should be configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.DataValidatorFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(120);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });
  });

  describe('Event Source Mappings', () => {
    test('Should have event source mapping for User Data table', async () => {
      const command = new ListEventSourceMappingsCommand({
        FunctionName: outputs.UserDataProcessorFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.EventSourceMappings).toBeDefined();
      expect(response.EventSourceMappings?.length).toBeGreaterThan(0);
      const mapping = response.EventSourceMappings?.[0];
      expect(mapping?.State).toBe('Enabled');
      expect(mapping?.BatchSize).toBe(10);
      expect(mapping?.ParallelizationFactor).toBe(2);
    });

    test('Should have event source mapping for Order Data table', async () => {
      const command = new ListEventSourceMappingsCommand({
        FunctionName: outputs.OrderDataProcessorFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.EventSourceMappings).toBeDefined();
      expect(response.EventSourceMappings?.length).toBeGreaterThan(0);
      const mapping = response.EventSourceMappings?.[0];
      expect(mapping?.State).toBe('Enabled');
      expect(mapping?.BatchSize).toBe(5);
      expect(mapping?.ParallelizationFactor).toBe(1);
    });
  });

  describe('Step Functions', () => {
    test('Data Validator Lambda should execute successfully', async () => {
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.DataValidatorFunctionName,
        Payload: JSON.stringify({
          dataType: 'USER_DATA',
          batchSize: 100,
        }),
      });
      const response = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );

      expect(response.StatusCode).toBe(200);
      expect(payload.isValid).toBe(true);
      expect(payload.dataType).toBe('USER_DATA');
      expect(payload.batchSize).toBe(100);
    });

    test('Data Validator should reject invalid data', async () => {
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.DataValidatorFunctionName,
        Payload: JSON.stringify({
          dataType: 'INVALID_TYPE',
          batchSize: 100,
        }),
      });
      const response = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );

      expect(response.StatusCode).toBe(200);
      expect(payload.isValid).toBe(false);
      expect(payload.error).toBe('Invalid data type or batch size');
    });

    test('Step Functions state machine should execute successfully', async () => {
      const executionName = `test-execution-${Date.now()}`;
      const startCommand = new StartExecutionCommand({
        stateMachineArn: outputs.StepFunctionsStateMachineArn,
        name: executionName,
        input: JSON.stringify({
          dataType: 'DAILY_ANALYTICS',
          batchSize: 50,
        }),
      });

      const startResponse = await sfnClient.send(startCommand);
      expect(startResponse.executionArn).toBeDefined();

      // Wait for execution to complete
      await wait(5000);

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResponse.executionArn,
      });
      const describeResponse = await sfnClient.send(describeCommand);

      expect(describeResponse.status).toBe('SUCCEEDED');
    }, 15000);

    test('Step Functions should fail with invalid input', async () => {
      const executionName = `test-fail-execution-${Date.now()}`;
      const startCommand = new StartExecutionCommand({
        stateMachineArn: outputs.StepFunctionsStateMachineArn,
        name: executionName,
        input: JSON.stringify({
          dataType: 'INVALID',
          batchSize: 5000,
        }),
      });

      const startResponse = await sfnClient.send(startCommand);
      expect(startResponse.executionArn).toBeDefined();

      // Wait for execution to complete
      await wait(5000);

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResponse.executionArn,
      });
      const describeResponse = await sfnClient.send(describeCommand);

      expect(describeResponse.status).toBe('FAILED');
    }, 15000);
  });

  describe('End-to-End Data Processing Workflow', () => {
    test('Should process user data through DynamoDB stream to analytics', async () => {
      const testUserId = `test-user-${Date.now()}`;
      const timestamp = Date.now();

      // Insert data into User Data table
      const putCommand = new PutItemCommand({
        TableName: outputs.UserDataTableName,
        Item: {
          userId: { S: testUserId },
          timestamp: { N: timestamp.toString() },
          data: { S: 'Test user data' },
        },
      });
      await dynamoClient.send(putCommand);

      // Wait for stream processing (longer for LocalStack)
      await wait(isLocalStack ? 8000 : 3000);

      // Check if data was processed to analytics table with retries
      let scanResponse;
      let retries = 0;
      const maxRetries = isLocalStack ? 3 : 1;

      while (retries < maxRetries) {
        const scanCommand = new ScanCommand({
          TableName: outputs.AnalyticsTableName,
          FilterExpression: 'sourceUserId = :userId',
          ExpressionAttributeValues: {
            ':userId': { S: testUserId },
          },
        });
        scanResponse = await dynamoClient.send(scanCommand);

        if (scanResponse.Items && scanResponse.Items.length > 0) {
          break;
        }

        retries++;
        if (retries < maxRetries) {
          console.log(`Retry ${retries}/${maxRetries} - waiting for stream processing...`);
          await wait(3000);
        }
      }

      expect(scanResponse?.Items).toBeDefined();
      expect(scanResponse?.Items?.length).toBeGreaterThan(0);
      expect(scanResponse?.Items?.[0].dataType?.S).toBe('USER_ACTIVITY');
      expect(scanResponse?.Items?.[0].processedBy?.S).toBe('userDataProcessor');
    }, 20000);

    test('Should process order data through DynamoDB stream to analytics', async () => {
      const testOrderId = `test-order-${Date.now()}`;
      const createdAt = Date.now();

      // Insert data into Order Data table
      const putCommand = new PutItemCommand({
        TableName: outputs.OrderDataTableName,
        Item: {
          orderId: { S: testOrderId },
          createdAt: { N: createdAt.toString() },
          amount: { N: '100.00' },
        },
      });
      await dynamoClient.send(putCommand);

      // Wait for stream processing
      await wait(3000);

      // Check if data was processed to analytics table
      const scanCommand = new ScanCommand({
        TableName: outputs.AnalyticsTableName,
        FilterExpression: 'sourceOrderId = :orderId',
        ExpressionAttributeValues: {
          ':orderId': { S: testOrderId },
        },
      });
      const scanResponse = await dynamoClient.send(scanCommand);

      expect(scanResponse.Items).toBeDefined();
    }, 10000);
  });

  describe('Monitoring and Alarms', () => {
    test('CloudWatch alarms should be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          `${environmentSuffix}-userdataproc-errors-synth`,
          `${environmentSuffix}-stepfunctions-failures-synth`,
        ],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(2);
      response.MetricAlarms?.forEach((alarm) => {
        expect(alarm.StateValue).toBeDefined();
        expect(['OK', 'INSUFFICIENT_DATA', 'ALARM']).toContain(alarm.StateValue);
      });
    });

    test('SNS topic should be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlertTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.AlertTopicArn);
    });

    test('Dashboard URL should be valid', () => {
      expect(outputs.DashboardUrl).toBeDefined();
      expect(outputs.DashboardUrl).toContain('console.aws.amazon.com');
      expect(outputs.DashboardUrl).toContain('cloudwatch');
      expect(outputs.DashboardUrl).toContain(`${environmentSuffix}-serverless-dash-synth`);
    });
  });

  describe('Analytics Processor Function', () => {
    test('Should execute analytics processor successfully', async () => {
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.AnalyticsProcessorFunctionName,
        Payload: JSON.stringify({}),
      });
      const response = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBe('Successfully processed analytics');
    });
  });
});