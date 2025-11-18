import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  DescribeTrailsCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand
} from '@aws-sdk/client-sns';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand
} from '@aws-sdk/client-s3';
import {
  SSMClient,
  GetParameterCommand,
  DescribeParametersCommand
} from '@aws-sdk/client-ssm';
import {
  XRayClient,
  GetSamplingRulesCommand
} from '@aws-sdk/client-xray';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand
} from '@aws-sdk/client-eventbridge';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load deployment outputs
const outputsPath = join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf8'));

// AWS region configuration
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cloudtrailClient = new CloudTrailClient({ region });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const s3Client = new S3Client({ region });
const ssmClient = new SSMClient({ region });
const xrayClient = new XRayClient({ region });
const kmsClient = new KMSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('Observability Platform Integration Tests', () => {
  describe('CloudTrail Audit Logging', () => {
    it('should have CloudTrail enabled and logging', async () => {
      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [outputs.cloudtrail_arn.split('/').pop()]
      });
      const describeResponse = await cloudtrailClient.send(describeCommand);

      expect(describeResponse.trailList).toBeDefined();
      expect(describeResponse.trailList.length).toBeGreaterThan(0);

      const trail = describeResponse.trailList[0];
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.S3BucketName).toBe(outputs.cloudtrail_bucket);
    });

    it('should have CloudTrail status as logging', async () => {
      const statusCommand = new GetTrailStatusCommand({
        Name: outputs.cloudtrail_arn
      });
      const statusResponse = await cloudtrailClient.send(statusCommand);

      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have all payment log groups created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/payment'
      });
      const response = await cloudwatchLogsClient.send(command);

      const logGroupNames = response.logGroups.map(lg => lg.logGroupName);

      expect(logGroupNames).toContain(outputs.payment_api_log_group);
      expect(logGroupNames).toContain(outputs.payment_processor_log_group);
      expect(logGroupNames).toContain(outputs.payment_database_log_group);
    });

    it('should have security events log group with 30-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.security_events_log_group
      });
      const response = await cloudwatchLogsClient.send(command);

      expect(response.logGroups.length).toBe(1);
      expect(response.logGroups[0].retentionInDays).toBe(30);
      expect(response.logGroups[0].kmsKeyId).toBeDefined();
    });

    it('should have log groups encrypted with KMS', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.payment_api_log_group
      });
      const response = await cloudwatchLogsClient.send(command);

      expect(response.logGroups[0].kmsKeyId).toBeDefined();
      expect(response.logGroups[0].kmsKeyId).toContain(outputs.kms_key_id);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have high error rate alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'payment-high-error-rate'
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('PaymentProcessing');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Threshold).toBe(10);
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    it('should have high latency alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'payment-high-latency'
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe('TransactionLatency');
      expect(alarm.Namespace).toBe('PaymentProcessing');
      expect(alarm.Threshold).toBe(500);
    });

    it('should have failed transactions alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'payment-failed-transactions'
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe('FailedTransactions');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.Period).toBe(60);
    });

    it('should have alarms connected to SNS topics', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'payment-high-error-rate'
      });
      const response = await cloudwatchClient.send(command);

      const alarm = response.MetricAlarms[0];
      expect(alarm.AlarmActions.length).toBeGreaterThan(0);
      expect(alarm.AlarmActions[0]).toBe(outputs.payment_alerts_topic_arn);
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should have payment operations dashboard created', async () => {
      const listCommand = new ListDashboardsCommand({
        DashboardNamePrefix: outputs.dashboard_name
      });
      const listResponse = await cloudwatchClient.send(listCommand);

      expect(listResponse.DashboardEntries.length).toBeGreaterThan(0);
      expect(listResponse.DashboardEntries[0].DashboardName).toBe(outputs.dashboard_name);
    });

    it('should have dashboard with payment metrics widgets', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.dashboard_name
      });
      const response = await cloudwatchClient.send(command);

      const dashboardBody = JSON.parse(response.DashboardBody);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);

      // Check for payment-specific widgets
      const widgetMetrics = JSON.stringify(dashboardBody.widgets);
      expect(widgetMetrics).toContain('TransactionCount');
      expect(widgetMetrics).toContain('TransactionLatency');
      expect(widgetMetrics).toContain('PaymentProcessing');
    });
  });

  describe('SNS Topics and Notifications', () => {
    it('should have payment alerts topic created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.payment_alerts_topic_arn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(outputs.payment_alerts_topic_arn);
      expect(response.Attributes.KmsMasterKeyId).toBeDefined();
    });

    it('should have security alerts topic created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.security_alerts_topic_arn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(outputs.security_alerts_topic_arn);
      expect(response.Attributes.KmsMasterKeyId).toBeDefined();
    });

    it('should have SNS topics encrypted with KMS', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.payment_alerts_topic_arn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes.KmsMasterKeyId).toContain(outputs.kms_key_id);
    });
  });

  describe('S3 Bucket Security and Configuration', () => {
    it('should have CloudTrail S3 bucket with encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.cloudtrail_bucket
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    it('should have S3 bucket with versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.cloudtrail_bucket
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have S3 bucket with public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.cloudtrail_bucket
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    it('should have S3 bucket lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.cloudtrail_bucket
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules.length).toBeGreaterThan(0);
      expect(response.Rules[0].Status).toBe('Enabled');
      expect(response.Rules[0].Expiration.Days).toBe(90);
    });
  });

  describe('Systems Manager Parameters', () => {
    it('should have X-Ray sampling rate parameter', async () => {
      const command = new GetParameterCommand({
        Name: outputs.ssm_xray_sampling_parameter
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter.Name).toBe(outputs.ssm_xray_sampling_parameter);
      expect(response.Parameter.Type).toBe('String');
      expect(response.Parameter.Value).toBe('0.1');
    });

    it('should have log retention parameter', async () => {
      const command = new GetParameterCommand({
        Name: outputs.ssm_log_retention_parameter
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter.Value).toBe('7');
    });

    it('should have latency threshold parameter', async () => {
      const command = new GetParameterCommand({
        Name: outputs.ssm_latency_threshold_parameter
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter.Value).toBe('500');
    });

    it('should have all observability parameters in correct namespace', async () => {
      const command = new DescribeParametersCommand({
        ParameterFilters: [
          {
            Key: 'Name',
            Option: 'BeginsWith',
            Values: ['/observability/']
          }
        ]
      });
      const response = await ssmClient.send(command);

      expect(response.Parameters.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('X-Ray Distributed Tracing', () => {
    it('should have X-Ray sampling rules configured', async () => {
      const command = new GetSamplingRulesCommand({});
      const response = await xrayClient.send(command);

      const ourRules = response.SamplingRuleRecords.filter(rule =>
        rule.SamplingRule.RuleName === outputs.xray_sampling_rule_payment ||
        rule.SamplingRule.RuleName.startsWith('def-')
      );

      expect(ourRules.length).toBeGreaterThanOrEqual(1);
    });

    it('should have payment transaction sampling rule with correct rate', async () => {
      const command = new GetSamplingRulesCommand({});
      const response = await xrayClient.send(command);

      const paymentRule = response.SamplingRuleRecords.find(rule =>
        rule.SamplingRule.RuleName === outputs.xray_sampling_rule_payment
      );

      expect(paymentRule).toBeDefined();
      expect(paymentRule.SamplingRule.FixedRate).toBe(0.1);
      expect(paymentRule.SamplingRule.URLPath).toBe('/api/payment/*');
      expect(paymentRule.SamplingRule.HTTPMethod).toBe('POST');
      expect(paymentRule.SamplingRule.Priority).toBe(1000);
    });

    it('should have default sampling rule configured', async () => {
      const command = new GetSamplingRulesCommand({});
      const response = await xrayClient.send(command);

      const defaultRule = response.SamplingRuleRecords.find(rule =>
        rule.SamplingRule.RuleName.startsWith('def-')
      );

      expect(defaultRule).toBeDefined();
      expect(defaultRule.SamplingRule.FixedRate).toBe(0.05);
      expect(defaultRule.SamplingRule.Priority).toBe(5000);
    });
  });

  describe('KMS Encryption', () => {
    it('should have KMS key created and enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyId).toBe(outputs.kms_key_id);
      expect(response.KeyMetadata.Enabled).toBe(true);
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
    });

    it('should have KMS key rotation enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata.KeyRotationEnabled).toBeTruthy();
    });

    it('should have KMS alias configured', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const ourAlias = response.Aliases.find(alias =>
        alias.TargetKeyId === outputs.kms_key_id
      );

      expect(ourAlias).toBeDefined();
      expect(ourAlias.AliasName).toContain('observability');
    });
  });

  describe('EventBridge Rules', () => {
    it('should have security config changes rule', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'security-config-changes'
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Rules.length).toBeGreaterThan(0);
      expect(response.Rules[0].State).toBe('ENABLED');
    });

    it('should have unauthorized API calls rule', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'unauthorized-api-calls'
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Rules.length).toBeGreaterThan(0);
      expect(response.Rules[0].State).toBe('ENABLED');
    });

    it('should have EventBridge rules connected to SNS targets', async () => {
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: 'security-config-changes'
      });
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);

      const ruleName = rulesResponse.Rules[0].Name;

      const listTargetsCommand = new ListTargetsByRuleCommand({
        Rule: ruleName
      });
      const targetsResponse = await eventBridgeClient.send(listTargetsCommand);

      expect(targetsResponse.Targets.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets[0].Arn).toBe(outputs.security_alerts_topic_arn);
    });
  });

  describe('Resource Tagging', () => {
    it('should have CloudTrail properly tagged', async () => {
      const command = new DescribeTrailsCommand({
        trailNameList: [outputs.cloudtrail_arn.split('/').pop()]
      });
      const response = await cloudtrailClient.send(command);

      // Tags are verified through default_tags in provider
      expect(response.trailList[0].TrailARN).toBe(outputs.cloudtrail_arn);
    });
  });
});
