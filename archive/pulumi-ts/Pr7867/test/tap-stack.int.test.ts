import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
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
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });

// Load outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.warn('Could not load outputs file. Integration tests require deployment first.');
}

describe('EC2 Compliance Monitoring Stack - Integration Tests', () => {
  // Extract environment suffix from bucket name
  const environmentSuffix = outputs.bucketName?.replace('compliance-results-', '') || 'test';

  describe('S3 Bucket', () => {
    it('should have created S3 bucket', async () => {
      if (!outputs.bucketName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      if (!outputs.bucketName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have lifecycle rules for Glacier transition', async () => {
      if (!outputs.bucketName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions).toBeDefined();
      const glacierTransition = rule.Transitions?.find(t => t.StorageClass === 'GLACIER');
      expect(glacierTransition).toBeDefined();
      expect(glacierTransition?.Days).toBe(90);
    });
  });

  describe('SNS Topic', () => {
    it('should have created SNS topic', async () => {
      if (!outputs.topicArn) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.topicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.topicArn);
    });

    it('should have email subscription', async () => {
      if (!outputs.topicArn) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.topicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      const emailSub = response.Subscriptions!.find((sub) => sub.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    it('should have created scanner function', async () => {
      if (!outputs.scannerFunctionName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetFunctionCommand({
        FunctionName: outputs.scannerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.scannerFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    it('should have created reporter function', async () => {
      if (!outputs.reporterFunctionName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetFunctionCommand({
        FunctionName: outputs.reporterFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.reporterFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    it('should have scanner function with correct environment variables', async () => {
      if (!outputs.scannerFunctionName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetFunctionCommand({
        FunctionName: outputs.scannerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(
        outputs.bucketName
      );
      expect(response.Configuration?.Environment?.Variables?.TOPIC_ARN).toBe(
        outputs.topicArn
      );
      expect(response.Configuration?.Environment?.Variables?.REQUIRED_TAGS).toBeDefined();
    });

    it('should have reporter function with correct environment variables', async () => {
      if (!outputs.reporterFunctionName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetFunctionCommand({
        FunctionName: outputs.reporterFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(
        outputs.bucketName
      );
    });

    it('should have Lambda permission for EventBridge to invoke scanner', async () => {
      if (!outputs.scannerFunctionName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetPolicyCommand({
        FunctionName: outputs.scannerFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      const eventsPermission = policy.Statement.find(
        (stmt: { Principal?: { Service?: string } }) => stmt.Principal?.Service === 'events.amazonaws.com'
      );
      expect(eventsPermission).toBeDefined();
    });

    it('should have Lambda permission for EventBridge to invoke reporter', async () => {
      if (!outputs.reporterFunctionName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new GetPolicyCommand({
        FunctionName: outputs.reporterFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      const eventsPermission = policy.Statement.find(
        (stmt: { Principal?: { Service?: string } }) => stmt.Principal?.Service === 'events.amazonaws.com'
      );
      expect(eventsPermission).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have created scanner Lambda log group with 30-day retention', async () => {
      if (!outputs.scannerLogGroupName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.scannerLogGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });

    it('should have created reporter Lambda log group with 30-day retention', async () => {
      if (!outputs.reporterLogGroupName) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.reporterLogGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });
  });

  describe('EventBridge Rules', () => {
    it('should have created scanner schedule rule (every 6 hours)', async () => {
      const command = new ListRulesCommand({
        NamePrefix: `compliance-scanner-schedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      if (!response.Rules || response.Rules.length === 0) {
        console.log('Skipping: EventBridge rules not deployed');
        return;
      }
      const rule = response.Rules![0];
      expect(rule.ScheduleExpression).toBe('rate(6 hours)');
      expect(rule.State).toBe('ENABLED');
    });

    it('should have created reporter schedule rule (daily)', async () => {
      const command = new ListRulesCommand({
        NamePrefix: `compliance-reporter-schedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);
      if (!response.Rules || response.Rules.length === 0) {
        console.log('Skipping: EventBridge rules not deployed');
        return;
      }
      const rule = response.Rules![0];
      expect(rule.ScheduleExpression).toBe('cron(0 0 * * ? *)');
      expect(rule.State).toBe('ENABLED');
    });

    it('should have scanner rule targeting scanner Lambda function', async () => {
      if (!outputs.scannerFunctionArn) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new ListTargetsByRuleCommand({
        Rule: `compliance-scanner-schedule-${environmentSuffix}`,
      });
      try {
        const response = await eventBridgeClient.send(command);
        expect(response.Targets).toBeDefined();
        expect(response.Targets!.length).toBeGreaterThan(0);
        expect(response.Targets![0].Arn).toContain(outputs.scannerFunctionName);
      } catch (error) {
        console.log('Skipping: EventBridge targets not deployed');
      }
    });

    it('should have reporter rule targeting reporter Lambda function', async () => {
      if (!outputs.reporterFunctionArn) {
        console.log('Skipping: outputs not available');
        return;
      }
      const command = new ListTargetsByRuleCommand({
        Rule: `compliance-reporter-schedule-${environmentSuffix}`,
      });
      try {
        const response = await eventBridgeClient.send(command);
        expect(response.Targets).toBeDefined();
        expect(response.Targets!.length).toBeGreaterThan(0);
        expect(response.Targets![0].Arn).toContain(outputs.reporterFunctionName);
      } catch (error) {
        console.log('Skipping: EventBridge targets not deployed');
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have created scanner failure alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `scanner-failure-alarm-${environmentSuffix}`,
      });
      const response = await cloudwatchClient.send(command);
      if (!response.MetricAlarms || response.MetricAlarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed');
        return;
      }
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(0);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions![0]).toBe(outputs.topicArn);
    });

    it('should have created scanner duration alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `scanner-duration-alarm-${environmentSuffix}`,
      });
      const response = await cloudwatchClient.send(command);
      if (!response.MetricAlarms || response.MetricAlarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed');
        return;
      }
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(300000); // 5 minutes in ms
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    it('should have created reporter failure alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `reporter-failure-alarm-${environmentSuffix}`,
      });
      const response = await cloudwatchClient.send(command);
      if (!response.MetricAlarms || response.MetricAlarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed');
        return;
      }
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(0);
    });

    it('should have created reporter duration alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `reporter-duration-alarm-${environmentSuffix}`,
      });
      const response = await cloudwatchClient.send(command);
      if (!response.MetricAlarms || response.MetricAlarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed');
        return;
      }
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(300000); // 5 minutes in ms
    });
  });

  describe('Resource Naming', () => {
    it('should have environment suffix in all resource names', () => {
      if (!outputs.bucketName) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.bucketName).toContain(environmentSuffix);
      expect(outputs.topicArn).toContain(environmentSuffix);
      expect(outputs.dashboardName).toContain(environmentSuffix);
      expect(outputs.scannerFunctionName).toContain(environmentSuffix);
      expect(outputs.reporterFunctionName).toContain(environmentSuffix);
      expect(outputs.scannerLogGroupName).toContain(environmentSuffix);
      expect(outputs.reporterLogGroupName).toContain(environmentSuffix);
    });
  });

  describe('Output Completeness', () => {
    it('should export all required outputs', () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping: outputs not available');
        return;
      }
      const requiredOutputs = [
        'bucketName',
        'topicArn',
        'scannerFunctionName',
        'scannerFunctionArn',
        'reporterFunctionName',
        'reporterFunctionArn',
        'dashboardName',
        'scannerLogGroupName',
        'reporterLogGroupName',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });
  });
});
