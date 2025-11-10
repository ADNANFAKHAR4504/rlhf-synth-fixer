import * as fs from 'fs';
import * as path from 'path';
import {
  APIGatewayClient,
  GetRestApisCommand,
} from '@aws-sdk/client-api-gateway';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  const region = 'ap-southeast-1';

  beforeAll(() => {
    // Read deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('API Gateway', () => {
    it('should have API Gateway REST API deployed', async () => {
      const client = new APIGatewayClient({ region });
      const command = new GetRestApisCommand({});
      const response = await client.send(command);

      const api = response.items?.find((item) => item.id === outputs.ApiId);
      expect(api).toBeDefined();
      expect(api?.name).toContain(outputs.EnvironmentSuffix);
    });

    it('should have API endpoint accessible', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiEndpoint).toContain('execute-api');
      expect(outputs.ApiEndpoint).toContain(region);
      expect(outputs.ApiEndpoint).toContain('/prod/transactions');
    });
  });

  describe('SQS Queue', () => {
    it('should have SQS queue deployed with correct attributes', async () => {
      const client = new SQSClient({ region });
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.QueueUrl,
        AttributeNames: [
          'VisibilityTimeout',
          'MessageRetentionPeriod',
          'ReceiveMessageWaitTimeSeconds',
        ],
      });

      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.VisibilityTimeout).toBe('300');
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600');
      expect(response.Attributes?.ReceiveMessageWaitTimeSeconds).toBe('20');
    });

    it('should have queue URL with correct naming', () => {
      expect(outputs.QueueUrl).toContain('transaction-queue');
      expect(outputs.QueueUrl).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('DynamoDB Table', () => {
    it('should have DynamoDB table deployed with correct schema', async () => {
      const client = new DynamoDBClient({ region });
      const command = new DescribeTableCommand({
        TableName: outputs.TableName,
      });

      const response = await client.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(response.Table?.KeySchema).toHaveLength(2);

      const hashKey = response.Table?.KeySchema?.find(
        (k) => k.KeyType === 'HASH'
      );
      const rangeKey = response.Table?.KeySchema?.find(
        (k) => k.KeyType === 'RANGE'
      );

      expect(hashKey?.AttributeName).toBe('transactionId');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    it('should have encryption enabled', async () => {
      const client = new DynamoDBClient({ region });
      const command = new DescribeTableCommand({
        TableName: outputs.TableName,
      });

      const response = await client.send(command);

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    it('should be able to write and read data', async () => {
      const client = new DynamoDBClient({ region });
      const testId = `test-${Date.now()}`;
      const timestamp = Date.now();

      // Write test data
      await client.send(
        new PutItemCommand({
          TableName: outputs.TableName,
          Item: {
            transactionId: { S: testId },
            timestamp: { N: timestamp.toString() },
            amount: { N: '100' },
            status: { S: 'test' },
          },
        })
      );

      // Read test data
      const getResponse = await client.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: testId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.transactionId.S).toBe(testId);
      expect(getResponse.Item?.amount.N).toBe('100');
    });
  });

  describe('SNS Topic', () => {
    it('should have SNS topic deployed', async () => {
      const client = new SNSClient({ region });
      const command = new ListTopicsCommand({});
      const response = await client.send(command);

      const topic = response.Topics?.find(
        (t) => t.TopicArn === outputs.TopicArn
      );
      expect(topic).toBeDefined();
      expect(outputs.TopicArn).toContain('transaction-notifications');
      expect(outputs.TopicArn).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('Lambda Functions', () => {
    it('should have receiver Lambda function deployed', async () => {
      const client = new LambdaClient({ region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.ReceiverFunctionName,
      });

      const response = await client.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have processor Lambda function deployed', async () => {
      const client = new LambdaClient({ region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.ProcessorFunctionName,
      });

      const response = await client.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have validator Lambda function deployed', async () => {
      const client = new LambdaClient({ region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.ValidatorFunctionName,
      });

      const response = await client.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have event source mapping for processor', async () => {
      const client = new LambdaClient({ region });
      const command = new ListEventSourceMappingsCommand({
        FunctionName: outputs.ProcessorFunctionName,
      });

      const response = await client.send(command);

      expect(response.EventSourceMappings).toBeDefined();
      expect(response.EventSourceMappings?.length).toBeGreaterThan(0);

      const mapping = response.EventSourceMappings?.[0];
      expect(mapping?.State).toBe('Enabled');
      expect(mapping?.BatchSize).toBe(10);
      expect(mapping?.MaximumBatchingWindowInSeconds).toBe(5);
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have log groups for all Lambda functions', async () => {
      const client = new CloudWatchLogsClient({ region });
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/',
      });

      const response = await client.send(command);

      const receiverLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(outputs.ReceiverFunctionName)
      );
      const processorLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(outputs.ProcessorFunctionName)
      );
      const validatorLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(outputs.ValidatorFunctionName)
      );

      expect(receiverLogGroup).toBeDefined();
      expect(processorLogGroup).toBeDefined();
      expect(validatorLogGroup).toBeDefined();

      expect(receiverLogGroup?.retentionInDays).toBe(30);
      expect(processorLogGroup?.retentionInDays).toBe(30);
      expect(validatorLogGroup?.retentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have CloudWatch alarms deployed', async () => {
      const client = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({});

      const response = await client.send(command);

      const alarmNames = response.MetricAlarms?.map((a) => a.AlarmName) || [];

      const queueDepthAlarm = alarmNames.find(
        (name) =>
          name?.includes('queue-depth') &&
          name?.includes(outputs.EnvironmentSuffix)
      );
      const receiverErrorAlarm = alarmNames.find(
        (name) =>
          name?.includes('receiver-error') &&
          name?.includes(outputs.EnvironmentSuffix)
      );
      const processorErrorAlarm = alarmNames.find(
        (name) =>
          name?.includes('processor-error') &&
          name?.includes(outputs.EnvironmentSuffix)
      );
      const api4xxAlarm = alarmNames.find(
        (name) =>
          name?.includes('api-4xx') && name?.includes(outputs.EnvironmentSuffix)
      );
      const api5xxAlarm = alarmNames.find(
        (name) =>
          name?.includes('api-5xx') && name?.includes(outputs.EnvironmentSuffix)
      );

      expect(queueDepthAlarm).toBeDefined();
      expect(receiverErrorAlarm).toBeDefined();
      expect(processorErrorAlarm).toBeDefined();
      expect(api4xxAlarm).toBeDefined();
      expect(api5xxAlarm).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should have environmentSuffix in all resource names', () => {
      expect(outputs.TableName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.QueueUrl).toContain(outputs.EnvironmentSuffix);
      expect(outputs.TopicArn).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ReceiverFunctionName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ProcessorFunctionName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ValidatorFunctionName).toContain(outputs.EnvironmentSuffix);
    });

    it('should have consistent naming pattern', () => {
      const suffix = outputs.EnvironmentSuffix;
      expect(outputs.TableName).toBe(`transactions-${suffix}`);
      expect(outputs.ReceiverFunctionName).toBe(`transaction-receiver-${suffix}`);
      expect(outputs.ProcessorFunctionName).toBe(
        `transaction-processor-${suffix}`
      );
      expect(outputs.ValidatorFunctionName).toBe(
        `transaction-validator-${suffix}`
      );
    });
  });

  describe('End-to-End Integration', () => {
    it('should have all components connected correctly', async () => {
      // Verify API Gateway exists
      expect(outputs.ApiEndpoint).toBeDefined();

      // Verify SQS queue exists and is accessible
      const sqsClient = new SQSClient({ region });
      const queueAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.QueueUrl,
          AttributeNames: ['All'],
        })
      );
      expect(queueAttrs.Attributes).toBeDefined();

      // Verify Lambda processor has event source mapping to SQS
      const lambdaClient = new LambdaClient({ region });
      const eventMappings = await lambdaClient.send(
        new ListEventSourceMappingsCommand({
          FunctionName: outputs.ProcessorFunctionName,
        })
      );
      expect(eventMappings.EventSourceMappings?.length).toBeGreaterThan(0);
      expect(eventMappings.EventSourceMappings?.[0].EventSourceArn).toContain(
        'sqs'
      );

      // Verify DynamoDB table is accessible
      const dynamoClient = new DynamoDBClient({ region });
      const tableDesc = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.TableName,
        })
      );
      expect(tableDesc.Table?.TableStatus).toBe('ACTIVE');
    });
  });
});
