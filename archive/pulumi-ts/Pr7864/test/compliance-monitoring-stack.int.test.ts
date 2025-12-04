import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeSubscriptionFiltersCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';

const s3Client = new S3Client({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });

// Load outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

describe('Compliance Monitoring Stack - Integration Tests', () => {
  const environmentSuffix = 'synthm3k8m5k8';

  describe('S3 Bucket', () => {
    it('should have created S3 bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.reportBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.reportBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.reportBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.reportBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration?.Days).toBe(90);
    });

    it('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.reportBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    it('should have created SNS topic', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.complianceTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.complianceTopicArn);
    });

    it('should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.complianceTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      const emailSub = response.Subscriptions!.find((sub) => sub.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    it('should have created analyzer function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.analyzerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.analyzerFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    it('should have created report generator function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.reportGeneratorFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.reportGeneratorFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(120);
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    it('should have created deep scanner function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.deepScannerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.deepScannerFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(1024);
    });

    it('should have analyzer function with correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.analyzerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.complianceTopicArn
      );
      expect(response.Configuration?.Environment?.Variables?.LOG_GROUP_NAME).toContain(
        environmentSuffix
      );
    });

    it('should have report generator function with correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.reportGeneratorFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(
        outputs.reportBucketName
      );
    });

    it('should have deep scanner function with correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.deepScannerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(
        outputs.reportBucketName
      );
      expect(response.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.complianceTopicArn
      );
    });

    it('should have Lambda permission for CloudWatch Logs to invoke analyzer', async () => {
      const command = new GetPolicyCommand({
        FunctionName: outputs.analyzerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      const logsPermission = policy.Statement.find(
        (stmt: any) => stmt.Principal?.Service === 'logs.amazonaws.com'
      );
      expect(logsPermission).toBeDefined();
    });

    it('should have Lambda permission for EventBridge to invoke report generator', async () => {
      const command = new GetPolicyCommand({
        FunctionName: outputs.reportGeneratorFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      const eventsPermission = policy.Statement.find(
        (stmt: any) => stmt.Principal?.Service === 'events.amazonaws.com'
      );
      expect(eventsPermission).toBeDefined();
    });

    it('should have Lambda permission for EventBridge to invoke deep scanner', async () => {
      const command = new GetPolicyCommand({
        FunctionName: outputs.deepScannerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      const eventsPermission = policy.Statement.find(
        (stmt: any) => stmt.Principal?.Service === 'events.amazonaws.com'
      );
      expect(eventsPermission).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have created config events log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/config/events-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    });

    it('should have created analyzer Lambda log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/compliance-analyzer-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    it('should have created report generator Lambda log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/compliance-report-generator-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    it('should have created deep scanner Lambda log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/compliance-deep-scanner-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    it('should have subscription filter on config log group', async () => {
      const command = new DescribeSubscriptionFiltersCommand({
        logGroupName: `/aws/config/events-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.subscriptionFilters).toBeDefined();
      expect(response.subscriptionFilters!.length).toBeGreaterThan(0);
      const filter = response.subscriptionFilters![0];
      expect(filter.destinationArn).toContain(outputs.analyzerFunctionName);
    });

    it('should have metric filter on config log group', async () => {
      const command = new DescribeMetricFiltersCommand({
        logGroupName: `/aws/config/events-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThan(0);
      const filter = response.metricFilters![0];
      expect(filter.metricTransformations).toBeDefined();
      expect(filter.metricTransformations![0].metricName).toBe('ComplianceViolationCount');
      expect(filter.metricTransformations![0].metricNamespace).toBe('ComplianceMonitoring');
    });
  });

  describe('EventBridge Rules', () => {
    it('should have created daily report rule', async () => {
      const command = new ListRulesCommand({
        NamePrefix: `daily-compliance-report-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      const rule = response.Rules![0];
      expect(rule.ScheduleExpression).toBe('cron(0 8 * * ? *)');
      expect(rule.State).toBe('ENABLED');
    });

    it('should have created weekly scan rule', async () => {
      const command = new ListRulesCommand({
        NamePrefix: `weekly-compliance-scan-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      const rule = response.Rules![0];
      expect(rule.ScheduleExpression).toBe('cron(0 9 ? * MON *)');
      expect(rule.State).toBe('ENABLED');
    });

    it('should have daily rule targeting report generator function', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: `daily-compliance-report-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      expect(response.Targets![0].Arn).toContain(outputs.reportGeneratorFunctionName);
    });

    it('should have weekly rule targeting deep scanner function', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: `weekly-compliance-scan-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      expect(response.Targets![0].Arn).toContain(outputs.deepScannerFunctionName);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have created compliance violation alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `compliance-violations-threshold-${environmentSuffix}`,
      });
      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('ComplianceViolations');
      expect(alarm.Namespace).toBe('ComplianceMonitoring');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions![0]).toBe(outputs.complianceTopicArn);
    });
  });

  describe('Resource Naming', () => {
    it('should have environment suffix in all resource names', () => {
      expect(outputs.reportBucketName).toContain(environmentSuffix);
      expect(outputs.complianceTopicArn).toContain(environmentSuffix);
      expect(outputs.dashboardName).toContain(environmentSuffix);
      expect(outputs.analyzerFunctionName).toContain(environmentSuffix);
      expect(outputs.reportGeneratorFunctionName).toContain(environmentSuffix);
      expect(outputs.deepScannerFunctionName).toContain(environmentSuffix);
    });
  });
});
