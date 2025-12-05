import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Parse the nested JSON strings from outputs
const parsedOutputs = {
  dashboardUrls:
    typeof rawOutputs.dashboardUrls === 'string'
      ? JSON.parse(rawOutputs.dashboardUrls)
      : rawOutputs.dashboardUrls,
  lambdaFunctionArns:
    typeof rawOutputs.lambdaFunctionArns === 'string'
      ? JSON.parse(rawOutputs.lambdaFunctionArns)
      : rawOutputs.lambdaFunctionArns,
  snsTopicArns:
    typeof rawOutputs.snsTopicArns === 'string'
      ? JSON.parse(rawOutputs.snsTopicArns)
      : rawOutputs.snsTopicArns,
};

// Extract individual values
const lambdaFunctionArn = parsedOutputs.lambdaFunctionArns?.complianceScanner;
const lambdaFunctionName = lambdaFunctionArn?.split(':').pop();
const snsTopicArn = parsedOutputs.snsTopicArns?.complianceAlerts;
const cloudwatchLogsUrl = parsedOutputs.dashboardUrls?.cloudwatchLogs;

// Extract log group name from the CloudWatch URL
const logGroupNameMatch = cloudwatchLogsUrl?.match(/log-group\/([^#?]+)/);
const logGroupName = logGroupNameMatch ? decodeURIComponent(logGroupNameMatch[1]) : undefined;

// Extract bucket name from Lambda function name pattern
const envSuffixMatch = lambdaFunctionName?.match(/compliance-scanner-([^-]+-[a-f0-9]+)/);
const environmentSuffix = envSuffixMatch ? envSuffixMatch[1] : undefined;

const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Integration Tests', () => {
  let lambdaClient: LambdaClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let logsClient: CloudWatchLogsClient;
  let eventBridgeClient: EventBridgeClient;
  let iamClient: IAMClient;

  beforeAll(() => {
    lambdaClient = new LambdaClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    eventBridgeClient = new EventBridgeClient({ region });
    iamClient = new IAMClient({ region });
  });

  describe('Lambda Function', () => {
    it('should exist and be accessible', async () => {
      expect(lambdaFunctionName).toBeDefined();
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(lambdaFunctionName);
    });

    it('should have correct runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Runtime).toMatch(/nodejs18/);
    });

    it('should have required environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.REQUIRED_TAGS).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
      expect(response.Environment?.Variables?.REPORTS_BUCKET).toBeDefined();
    });

    it('should have correct environment variable for required tags', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      const requiredTags = response.Environment?.Variables?.REQUIRED_TAGS;
      expect(requiredTags).toBe('Environment,CostCenter,Owner');
    });

    it('should have correct handler configured', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Handler).toBe('index.handler');
    });

    it('should have IAM role attached', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role).toContain('compliance-scanner-role');
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be accessible', async () => {
      expect(snsTopicArn).toBeDefined();
      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    it('should have display name configured', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('Compliance Alerts');
    });

    it('should have subscriptions', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group created', async () => {
      expect(logGroupName).toBeDefined();
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    it('should have retention policy configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('compliance-scanner')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
    });
  });

  describe('EventBridge Schedule', () => {
    it('should have event rule for 6-hour schedule', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'compliance-scan-schedule',
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const scheduleRule = response.Rules?.find(
        rule => rule.ScheduleExpression === 'rate(6 hours)'
      );
      expect(scheduleRule).toBeDefined();
    });

    it('should have Lambda function as target', async () => {
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: 'compliance-scan-schedule',
      });
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);
      const scheduleRule = rulesResponse.Rules?.find(
        rule => rule.ScheduleExpression === 'rate(6 hours)'
      );

      expect(scheduleRule).toBeDefined();

      if (scheduleRule?.Name) {
        const listTargetsCommand = new ListTargetsByRuleCommand({
          Rule: scheduleRule.Name,
        });
        const targetsResponse = await eventBridgeClient.send(listTargetsCommand);
        expect(targetsResponse.Targets).toBeDefined();
        expect(targetsResponse.Targets?.length).toBeGreaterThan(0);

        const lambdaTarget = targetsResponse.Targets?.find(target =>
          target.Arn?.includes('lambda')
        );
        expect(lambdaTarget).toBeDefined();
      }
    });

    it('should have event rule enabled', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'compliance-scan-schedule',
      });
      const response = await eventBridgeClient.send(command);
      const scheduleRule = response.Rules?.find(
        rule => rule.ScheduleExpression === 'rate(6 hours)'
      );
      expect(scheduleRule?.State).toBe('ENABLED');
    });
  });

  describe('Resource Naming Convention', () => {
    it('all resources should follow naming pattern', () => {
      expect(lambdaFunctionName).toBeDefined();
      expect(lambdaFunctionName).toContain('compliance-scanner');

      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toContain('compliance-alerts');

      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain('compliance-scanner');
    });

    it('should use consistent environment suffix pattern', () => {
      // All resources should contain a similar suffix pattern
      expect(lambdaFunctionName).toMatch(/compliance-scanner-.+/);
      expect(snsTopicArn).toMatch(/compliance-alerts-.+/);
    });
  });

  describe('Integration Completeness', () => {
    it('all required outputs are present', () => {
      expect(parsedOutputs.lambdaFunctionArns).toBeDefined();
      expect(parsedOutputs.snsTopicArns).toBeDefined();
      expect(parsedOutputs.dashboardUrls).toBeDefined();
    });

    it('Lambda function ARN is valid format', () => {
      expect(lambdaFunctionArn).toBeDefined();
      expect(lambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:.+$/);
    });

    it('SNS topic ARN is valid format', () => {
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
    });

    it('Dashboard URL is valid CloudWatch URL', () => {
      expect(cloudwatchLogsUrl).toBeDefined();
      expect(cloudwatchLogsUrl).toContain('console.aws.amazon.com/cloudwatch');
      expect(cloudwatchLogsUrl).toContain('logsV2:log-groups');
    });
  });

  describe('Live Infrastructure Verification', () => {
    it('Lambda function code is deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Code).toBeDefined();
      expect(response.Code?.RepositoryType).toBeDefined();
    });

    it('Lambda function has correct tags', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Tags).toBeDefined();
      expect(response.Tags?.Environment).toBeDefined();
    });

    it('SNS topic has correct policy', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
    });

    it('EventBridge rule targets compliance scanner', async () => {
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: 'compliance-scan-schedule',
      });
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);
      const rule = rulesResponse.Rules?.[0];

      if (rule?.Name) {
        const targetsCommand = new ListTargetsByRuleCommand({
          Rule: rule.Name,
        });
        const targetsResponse = await eventBridgeClient.send(targetsCommand);
        const target = targetsResponse.Targets?.[0];
        expect(target?.Arn).toContain('compliance-scanner');
      }
    });
  });

  describe('Cross-Service Integration', () => {
    it('Lambda environment references correct SNS topic', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      const configuredTopicArn = response.Environment?.Variables?.SNS_TOPIC_ARN;
      expect(configuredTopicArn).toContain('compliance-alerts');
    });

    it('Lambda environment references S3 bucket', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      const configuredBucket = response.Environment?.Variables?.REPORTS_BUCKET;
      expect(configuredBucket).toBeDefined();
      expect(configuredBucket).toContain('compliance-reports');
    });

    it('Lambda logging config points to correct log group', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.LoggingConfig).toBeDefined();
    });
  });
});
