/**
 * Integration Tests for Terraform Infrastructure Drift Detection System
 *
 * These tests validate deployed AWS resources against actual deployment outputs.
 * Tests use real AWS SDK calls with outputs from cfn-outputs/flat-outputs.json
 */

import fs from 'fs';
import path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';

// Initialize AWS clients with us-east-1 region
const AWS_REGION = 'us-east-1';
const dynamodbClient = new DynamoDBClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const eventsClient = new EventBridgeClient({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
const configClient = new ConfigServiceClient({ region: AWS_REGION });

// Load deployment outputs
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};
let outputsLoaded = false;

// Helper to load outputs
function loadOutputs(): boolean {
  if (outputsLoaded) return true;

  if (!fs.existsSync(OUTPUTS_PATH)) {
    console.warn(`Outputs file not found at: ${OUTPUTS_PATH}`);
    return false;
  }

  try {
    outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf-8'));
    outputsLoaded = true;
    console.log('Loaded deployment outputs:', Object.keys(outputs));
    return true;
  } catch (error) {
    console.error('Failed to load outputs:', error);
    return false;
  }
}

describe('Terraform Infrastructure Drift Detection System - Integration Tests', () => {

  beforeAll(() => {
    const loaded = loadOutputs();
    if (!loaded) {
      console.warn('Integration tests will be skipped - no deployment outputs found');
    }
  });

  describe('Deployment Outputs', () => {
    test('outputs file exists', () => {
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
    });

    test('outputs are loaded successfully', () => {
      expect(outputsLoaded).toBe(true);
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table - State Lock', () => {
    test('table exists with correct configuration', async () => {
      if (!outputsLoaded) return;

      const tableName = outputs.state_lock_table;
      expect(tableName).toBeTruthy();

      const result = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(result.Table).toBeDefined();
      expect(result.Table?.TableName).toBe(tableName);
      expect(result.Table?.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('uses on-demand billing mode', async () => {
      if (!outputsLoaded) return;

      const tableName = outputs.state_lock_table;
      const result = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    test('has LockID as hash key', async () => {
      if (!outputsLoaded) return;

      const tableName = outputs.state_lock_table;
      const result = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const keySchema = result.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(1);
      expect(keySchema?.[0]?.AttributeName).toBe('LockID');
      expect(keySchema?.[0]?.KeyType).toBe('HASH');
    }, 30000);

    test('point-in-time recovery is enabled', async () => {
      if (!outputsLoaded) return;

      const tableName = outputs.state_lock_table;
      const result = await dynamodbClient.send(
        new DescribeContinuousBackupsCommand({ TableName: tableName })
      );

      expect(result.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    }, 30000);
  });

  describe('Lambda Function', () => {
    test('function exists and is active', async () => {
      if (!outputsLoaded) return;

      const functionName = outputs.lambda_function_name;
      expect(functionName).toBeTruthy();

      const result = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.State).toBe('Active');
    }, 30000);

    test('uses Python 3.11 runtime', async () => {
      if (!outputsLoaded) return;

      const functionName = outputs.lambda_function_name;
      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(result.Runtime).toBe('python3.11');
    }, 30000);

    test('has correct timeout and memory configuration', async () => {
      if (!outputsLoaded) return;

      const functionName = outputs.lambda_function_name;
      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(result.Timeout).toBe(300);
      expect(result.MemorySize).toBe(512);
    }, 30000);

    test('has required environment variables', async () => {
      if (!outputsLoaded) return;

      const functionName = outputs.lambda_function_name;
      const result = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(result.Environment?.Variables).toBeDefined();
      expect(result.Environment?.Variables).toHaveProperty('DRIFT_REPORTS_BUCKET');
      expect(result.Environment?.Variables).toHaveProperty('SNS_TOPIC_ARN');
      expect(result.Environment?.Variables).toHaveProperty('ENVIRONMENT_SUFFIX');
      expect(result.Environment?.Variables).toHaveProperty('STATE_LOCK_TABLE');
    }, 30000);
  });

  describe('CloudWatch Log Group', () => {
    test('log group exists', async () => {
      if (!outputsLoaded) return;

      const logGroupName = outputs.cloudwatch_log_group;
      expect(logGroupName).toBeTruthy();

      const result = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);
      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    }, 30000);

    test('log retention is set to 7 days', async () => {
      if (!outputsLoaded) return;

      const logGroupName = outputs.cloudwatch_log_group;
      const result = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('SNS Topic', () => {
    test('topic exists', async () => {
      if (!outputsLoaded) return;

      const topicArn = outputs.sns_topic_arn;
      expect(topicArn).toBeTruthy();

      const result = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(result.Attributes).toBeDefined();
    }, 30000);

    test('has email subscription', async () => {
      if (!outputsLoaded) return;

      const topicArn = outputs.sns_topic_arn;
      const result = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );

      expect(result.Subscriptions).toBeDefined();
      expect(result.Subscriptions?.length).toBeGreaterThan(0);

      const emailSub = result.Subscriptions?.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    }, 30000);
  });

  describe('EventBridge Rule', () => {
    test('rule exists', async () => {
      if (!outputsLoaded) return;

      const ruleName = outputs.eventbridge_rule_name;
      expect(ruleName).toBeTruthy();

      const result = await eventsClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(result.Name).toBe(ruleName);
      expect(result.State).toBe('ENABLED');
    }, 30000);

    test('has 6-hour schedule expression', async () => {
      if (!outputsLoaded) return;

      const ruleName = outputs.eventbridge_rule_name;
      const result = await eventsClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(result.ScheduleExpression).toBe('rate(6 hours)');
    }, 30000);
  });

  describe('CloudWatch Dashboard', () => {
    test('dashboard exists', async () => {
      if (!outputsLoaded) return;

      const dashboardName = outputs.dashboard_name;
      expect(dashboardName).toBeTruthy();

      const result = await cloudwatchClient.send(
        new GetDashboardCommand({ DashboardName: dashboardName })
      );

      expect(result.DashboardName).toBe(dashboardName);
      expect(result.DashboardBody).toBeDefined();
    }, 30000);

    test('dashboard includes metrics widgets', async () => {
      if (!outputsLoaded) return;

      const dashboardName = outputs.dashboard_name;
      const result = await cloudwatchClient.send(
        new GetDashboardCommand({ DashboardName: dashboardName })
      );

      const dashboardBody = JSON.parse(result.DashboardBody || '{}');
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);

      const hasMetricWidget = dashboardBody.widgets.some((w: any) => w.type === 'metric');
      expect(hasMetricWidget).toBe(true);
    }, 30000);
  });

  describe('AWS Config Resources', () => {
    test('config rules are created', async () => {
      if (!outputsLoaded) return;

      const result = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      expect(result.ConfigRules).toBeDefined();
      expect(result.ConfigRules?.length).toBeGreaterThan(0);
    }, 30000);
  });
});
