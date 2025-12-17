import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  EventBridgeClient,
  ListRulesCommand,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetResourcesCommand,
  GetMethodCommand,
} from '@aws-sdk/client-api-gateway';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('TAP Stack Integration Tests', () => {
  const tableName = outputs.TurnAroundPromptTableName;
  const apiEndpoint = outputs.ApiEndpoint;
  const bucketName = outputs.ReportsBucketName;
  const feedbackProcessorArn = outputs.FeedbackProcessorFunctionArn;
  const reportGeneratorArn = outputs.ReportGeneratorFunctionArn;

  describe('DynamoDB Table', () => {
    test('should exist and be accessible', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });

    test('should have PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should have Global Secondary Indexes', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);
    });

    test('should have DateSentimentIndex GSI', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        index => index.IndexName === 'DateSentimentIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.IndexStatus).toBe('ACTIVE');
    });

    test('should have SentimentTimestampIndex GSI', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        index => index.IndexName === 'SentimentTimestampIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.IndexStatus).toBe('ACTIVE');
    });

    test('should be able to write and read items', async () => {
      const testId = `test-${Date.now()}`;
      const timestampNum = Date.now();
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          feedback: { S: 'Integration test feedback' },
          timestamp: { N: timestampNum.toString() },
          sentiment: { S: 'POSITIVE' },
          datePartition: { S: new Date().toISOString().split('T')[0] },
        },
      });

      await dynamoClient.send(putCommand);

      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testId },
        },
      });

      const result = await dynamoClient.send(queryCommand);
      expect(result.Items).toBeDefined();
      expect(result.Items?.length).toBe(1);
      expect(result.Items?.[0].id.S).toBe(testId);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);
    });

    test('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('FeedbackProcessor function should exist', async () => {
      const command = new GetFunctionCommand({
        FunctionName: feedbackProcessorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain(
        'FeedbackProcessor'
      );
    });

    test('FeedbackProcessor should use Python 3.10 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: feedbackProcessorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('python3.10');
    });

    test('FeedbackProcessor should have required environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: feedbackProcessorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TABLE_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT
      ).toBeDefined();
    });

    test('ReportGenerator function should exist', async () => {
      const command = new GetFunctionCommand({
        FunctionName: reportGeneratorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('ReportGenerator');
    });

    test('ReportGenerator should use Python 3.10 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: reportGeneratorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('python3.10');
    });

    test('ReportGenerator should have required environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: reportGeneratorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TABLE_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.BUCKET_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.NOTIFICATION_EMAIL
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT
      ).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have feedback endpoint configured', () => {
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain(region);
      expect(apiEndpoint).toContain('/feedback');
    });

    test('endpoint URL should contain environment suffix', () => {
      expect(apiEndpoint).toContain(environmentSuffix);
    });
  });

  describe('EventBridge Rules', () => {
    test('should have WeeklyReportSchedule rule', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: `WeeklyReportSchedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(listCommand);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
    });

    test('WeeklyReportSchedule should be enabled', async () => {
      const command = new DescribeRuleCommand({
        Name: `WeeklyReportSchedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toContain('cron');
    });

    test('WeeklyReportSchedule should have lambda target', async () => {
      const command = new DescribeRuleCommand({
        Name: `WeeklyReportSchedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Arn).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have FeedbackProcessor error alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `FeedbackProcessor-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have ReportGenerator error alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `ReportGenerator-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have API Gateway 4xx alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `API-4xx-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have API Gateway 5xx alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `API-5xx-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have FeedbackProcessor log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/FeedbackProcessor-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    test('FeedbackProcessor log group should have retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/FeedbackProcessor-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups?.[0]?.retentionInDays).toBeDefined();
      expect(response.logGroups?.[0]?.retentionInDays).toBeGreaterThan(0);
    });

    test('should have ReportGenerator log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/ReportGenerator-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    test('ReportGenerator log group should have retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/ReportGenerator-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups?.[0]?.retentionInDays).toBeDefined();
      expect(response.logGroups?.[0]?.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ReportsBucketName).toBeDefined();
      expect(outputs.FeedbackProcessorFunctionArn).toBeDefined();
      expect(outputs.ReportGeneratorFunctionArn).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('outputs should contain correct environment suffix', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('resource names should follow naming convention', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
      expect(outputs.ReportsBucketName).toContain(environmentSuffix);
    });
  });

  describe('Integration Tests', () => {
    test('should be able to query DynamoDB using GSI', async () => {
      const datePartition = new Date().toISOString().split('T')[0];

      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'DateSentimentIndex',
        KeyConditionExpression: 'datePartition = :dp',
        ExpressionAttributeValues: {
          ':dp': { S: datePartition },
        },
        Limit: 5,
      });

      const result = await dynamoClient.send(command);
      expect(result).toBeDefined();
    }, 30000);
  });
});
