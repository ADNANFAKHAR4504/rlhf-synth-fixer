import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { CloudTrailClient, GetTrailCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand, GetDashboardCommand } from '@aws-sdk/client-cloudwatch';
import { XRayClient, GetSamplingRulesCommand } from '@aws-sdk/client-xray';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { EventBridgeClient, DescribeRuleCommand, ListTargetsByRuleCommand } from '@aws-sdk/client-eventbridge';
import fs from 'fs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = outputs.cloudtrail_bucket.split('-').pop() || 'synth101912462';

describe('Terraform Observability Stack - Integration Tests', () => {
  let s3Client: S3Client;
  let cloudTrailClient: CloudTrailClient;
  let cwLogsClient: CloudWatchLogsClient;
  let kmsClient: KMSClient;
  let snsClient: SNSClient;
  let cloudWatchClient: CloudWatchClient;
  let xrayClient: XRayClient;
  let ssmClient: SSMClient;
  let eventBridgeClient: EventBridgeClient;

  beforeAll(() => {
    s3Client = new S3Client({ region });
    cloudTrailClient = new CloudTrailClient({ region });
    cwLogsClient = new CloudWatchLogsClient({ region });
    kmsClient = new KMSClient({ region });
    snsClient = new SNSClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    xrayClient = new XRayClient({ region });
    ssmClient = new SSMClient({ region });
    eventBridgeClient = new EventBridgeClient({ region });
  });

  describe('Deployment Outputs Validation', () => {
    test('all required outputs should be properly set', () => {
      expect(outputs.cloudtrail_arn).toBeDefined();
      expect(outputs.cloudtrail_bucket).toBeDefined();
      expect(outputs.dashboard_name).toBeDefined();
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.payment_alerts_topic_arn).toBeDefined();
      expect(outputs.payment_api_log_group).toBeDefined();
      expect(outputs.payment_database_log_group).toBeDefined();
      expect(outputs.payment_processor_log_group).toBeDefined();
      expect(outputs.security_alerts_topic_arn).toBeDefined();
      expect(outputs.security_events_log_group).toBeDefined();
      expect(outputs.ssm_latency_threshold_parameter).toBeDefined();
      expect(outputs.ssm_log_retention_parameter).toBeDefined();
      expect(outputs.ssm_xray_sampling_parameter).toBeDefined();
      expect(outputs.xray_sampling_rule_payment).toBeDefined();
    });

    test('CloudTrail ARN should be in correct format', () => {
      expect(outputs.cloudtrail_arn).toMatch(/^arn:aws:cloudtrail:[a-z0-9-]+:\d+:trail\/.+$/);
    });

    test('SNS topic ARNs should be in correct format', () => {
      expect(outputs.payment_alerts_topic_arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
      expect(outputs.security_alerts_topic_arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
    });

    test('KMS key ARN should be in correct format', () => {
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-f0-9-]+$/);
      expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]+$/);
    });

    test('all resource names should include environmentSuffix', () => {
      expect(outputs.cloudtrail_bucket).toContain(environmentSuffix);
      expect(outputs.dashboard_name).toContain(environmentSuffix);
      expect(outputs.payment_api_log_group).toContain(environmentSuffix);
      expect(outputs.xray_sampling_rule_payment).toContain(environmentSuffix);
    });

    test('all ARNs should be in correct region', () => {
      expect(outputs.cloudtrail_arn).toContain(`arn:aws:cloudtrail:${region}:`);
      expect(outputs.kms_key_arn).toContain(`arn:aws:kms:${region}:`);
      expect(outputs.payment_alerts_topic_arn).toContain(`arn:aws:sns:${region}:`);
      expect(outputs.security_alerts_topic_arn).toContain(`arn:aws:sns:${region}:`);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('CloudTrail S3 bucket should exist and have correct name', () => {
      expect(outputs.cloudtrail_bucket).toMatch(/^cloudtrail-logs-.+$/);
      expect(outputs.cloudtrail_bucket).toContain(environmentSuffix);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.cloudtrail_bucket,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.cloudtrail_bucket,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.cloudtrail_bucket,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have lifecycle configuration with 90-day expiration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.cloudtrail_bucket,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      const expirationRule = response.Rules?.find(rule => rule.ID === 'expire-old-logs');
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Status).toBe('Enabled');
      expect(expirationRule?.Expiration?.Days).toBe(90);
      expect(expirationRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);
    });
  });

  describe('CloudTrail Configuration', () => {
    let trailData: any;

    beforeAll(async () => {
      const trailName = outputs.cloudtrail_arn.split('/').pop();
      const command = new GetTrailCommand({
        Name: trailName,
      });
      const response = await cloudTrailClient.send(command);
      trailData = response.Trail;
    });

    test('CloudTrail should exist and be active', async () => {
      expect(trailData).toBeDefined();

      const trailName = outputs.cloudtrail_arn.split('/').pop();
      const statusCommand = new GetTrailStatusCommand({
        Name: trailName,
      });
      const statusResponse = await cloudTrailClient.send(statusCommand);
      expect(statusResponse.IsLogging).toBe(true);
    });

    test('CloudTrail should use correct S3 bucket', () => {
      expect(trailData.S3BucketName).toBe(outputs.cloudtrail_bucket);
    });

    test('CloudTrail should have log file validation enabled', () => {
      expect(trailData.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail should include global service events', () => {
      expect(trailData.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should be single region trail', () => {
      expect(trailData.IsMultiRegionTrail).toBe(false);
    });
  });

  describe('CloudWatch Log Groups Configuration', () => {
    test('payment API log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.payment_api_log_group,
      });
      const response = await cwLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.payment_api_log_group);

      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(outputs.payment_api_log_group);
    });

    test('payment processor log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.payment_processor_log_group,
      });
      const response = await cwLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.payment_processor_log_group);

      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(outputs.payment_processor_log_group);
    });

    test('payment database log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.payment_database_log_group,
      });
      const response = await cwLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.payment_database_log_group);

      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(outputs.payment_database_log_group);
    });

    test('security events log group should exist with 30-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.security_events_log_group,
      });
      const response = await cwLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.security_events_log_group);

      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(outputs.security_events_log_group);
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('all log groups should be encrypted with KMS', async () => {
      const logGroups = [
        outputs.payment_api_log_group,
        outputs.payment_processor_log_group,
        outputs.payment_database_log_group,
        outputs.security_events_log_group,
      ];

      for (const logGroupName of logGroups) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });
        const response = await cwLogsClient.send(command);
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);

        expect(logGroup?.kmsKeyId).toBeDefined();
        expect(logGroup?.kmsKeyId).toBe(outputs.kms_key_arn);
      }
    });
  });

  describe('KMS Key Configuration', () => {
    let keyMetadata: any;

    beforeAll(async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });
      const response = await kmsClient.send(command);
      keyMetadata = response.KeyMetadata;
    });

    test('KMS key should exist and be enabled', () => {
      expect(keyMetadata).toBeDefined();
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Enabled).toBe(true);
    });

    test('KMS key should have rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('KMS key ARN should match output', () => {
      expect(keyMetadata.Arn).toBe(outputs.kms_key_arn);
    });

    test('KMS key should have correct description', () => {
      expect(keyMetadata.Description).toBe('KMS key for observability platform encryption');
    });
  });

  describe('SNS Topics Configuration', () => {
    test('payment alerts topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.payment_alerts_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.payment_alerts_topic_arn);
    });

    test('security alerts topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.security_alerts_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.security_alerts_topic_arn);
    });

    test('payment alerts topic should be encrypted with KMS', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.payment_alerts_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toContain(outputs.kms_key_id);
    });

    test('security alerts topic should be encrypted with KMS', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.security_alerts_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toContain(outputs.kms_key_id);
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    let alarms: any[];

    beforeAll(async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-`,
      });
      const response = await cloudWatchClient.send(command);
      alarms = response.MetricAlarms || [];
    });

    test('high error rate alarm should exist with correct configuration', () => {
      const alarm = alarms.find(a => a.AlarmName === `payment-high-error-rate-${environmentSuffix}`);

      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('PaymentProcessing');
      expect(alarm?.Statistic).toBe('Sum');
      expect(alarm?.Threshold).toBe(10);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm?.EvaluationPeriods).toBe(2);
    });

    test('high latency alarm should exist with 500ms threshold', () => {
      const alarm = alarms.find(a => a.AlarmName === `payment-high-latency-${environmentSuffix}`);

      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('TransactionLatency');
      expect(alarm?.Namespace).toBe('PaymentProcessing');
      expect(alarm?.Statistic).toBe('Average');
      expect(alarm?.Threshold).toBe(500);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('failed transactions alarm should exist with threshold of 5', () => {
      const alarm = alarms.find(a => a.AlarmName === `payment-failed-transactions-${environmentSuffix}`);

      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('FailedTransactions');
      expect(alarm?.Namespace).toBe('PaymentProcessing');
      expect(alarm?.Statistic).toBe('Sum');
      expect(alarm?.Threshold).toBe(5);
      expect(alarm?.TreatMissingData).toBe('notBreaching');
    });

  });

  describe('CloudWatch Dashboard Configuration', () => {
    test('payment operations dashboard should exist', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.dashboard_name,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardName).toBe(outputs.dashboard_name);
      expect(response.DashboardBody).toBeDefined();
    });

    test('dashboard should contain payment metrics widgets', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.dashboard_name,
      });
      const response = await cloudWatchClient.send(command);
      const dashboardBody = JSON.parse(response.DashboardBody || '{}');

      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);

      const widgetTitles = dashboardBody.widgets.map((w: any) => w.properties?.title);
      expect(widgetTitles).toContain('Payment Transaction Volume');
      expect(widgetTitles).toContain('Transaction Latency Distribution (ms)');
      expect(widgetTitles).toContain('Error Metrics');
      expect(widgetTitles).toContain('Recent Errors');
    });
  });

  describe('X-Ray Sampling Rules Configuration', () => {
    let samplingRules: any[];

    beforeAll(async () => {
      const command = new GetSamplingRulesCommand({});
      const response = await xrayClient.send(command);
      samplingRules = response.SamplingRuleRecords || [];
    });

    test('payment transactions sampling rule should exist', () => {
      const rule = samplingRules.find(r => r.SamplingRule?.RuleName === outputs.xray_sampling_rule_payment);

      expect(rule).toBeDefined();
      expect(rule?.SamplingRule?.RuleName).toBe(outputs.xray_sampling_rule_payment);
    });

    test('payment transactions rule should target payment API', () => {
      const rule = samplingRules.find(r => r.SamplingRule?.RuleName === outputs.xray_sampling_rule_payment);

      expect(rule?.SamplingRule?.URLPath).toBe('/api/payment/*');
      expect(rule?.SamplingRule?.HTTPMethod).toBe('POST');
      expect(rule?.SamplingRule?.Priority).toBe(1000);
    });

    test('default sampling rule should exist', () => {
      const rule = samplingRules.find(r => r.SamplingRule?.RuleName === `def-${environmentSuffix}`);

      expect(rule).toBeDefined();
      expect(rule?.SamplingRule?.Priority).toBe(5000);
      expect(rule?.SamplingRule?.FixedRate).toBe(0.05);
    });
  });

  describe('SSM Parameters Configuration', () => {
    test('X-Ray sampling rate parameter should exist', async () => {
      const command = new GetParameterCommand({
        Name: outputs.ssm_xray_sampling_parameter,
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Name).toBe(outputs.ssm_xray_sampling_parameter);
      expect(response.Parameter?.Type).toBe('String');
    });

    test('log retention parameter should exist', async () => {
      const command = new GetParameterCommand({
        Name: outputs.ssm_log_retention_parameter,
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Name).toBe(outputs.ssm_log_retention_parameter);
      expect(response.Parameter?.Type).toBe('String');
    });

    test('latency threshold parameter should exist with value 500', async () => {
      const command = new GetParameterCommand({
        Name: outputs.ssm_latency_threshold_parameter,
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Name).toBe(outputs.ssm_latency_threshold_parameter);
      expect(response.Parameter?.Value).toBe('500');
    });
  });

  describe('EventBridge Rules Configuration', () => {
    test('security config changes rule should exist', async () => {
      const command = new DescribeRuleCommand({
        Name: `security-config-changes-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(`security-config-changes-${environmentSuffix}`);
      expect(response.State).toBe('ENABLED');

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.config');
    });

    test('unauthorized API calls rule should exist', async () => {
      const command = new DescribeRuleCommand({
        Name: `unauthorized-api-calls-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(`unauthorized-api-calls-${environmentSuffix}`);
      expect(response.State).toBe('ENABLED');

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.cloudtrail');
      expect(eventPattern.detail.errorCode).toContain('AccessDenied');
      expect(eventPattern.detail.errorCode).toContain('UnauthorizedOperation');
    });

    test('security config changes rule should target security alerts SNS', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: `security-config-changes-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      const snsTarget = response.Targets?.find(t => t.Arn === outputs.security_alerts_topic_arn);
      expect(snsTarget).toBeDefined();
    });

    test('unauthorized API calls rule should target security alerts SNS', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: `unauthorized-api-calls-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      const snsTarget = response.Targets?.find(t => t.Arn === outputs.security_alerts_topic_arn);
      expect(snsTarget).toBeDefined();
    });
  });

  describe('Security Hub Configuration', () => {
    test('security hub should be disabled by default for cost optimization', () => {
      expect(outputs.security_hub_enabled).toBe('false');
    });
  });

  describe('Compliance and Standards', () => {
    test('all log groups should follow naming convention', () => {
      expect(outputs.payment_api_log_group).toMatch(/^\/aws\/payment-api-.+$/);
      expect(outputs.payment_processor_log_group).toMatch(/^\/aws\/payment-processor-.+$/);
      expect(outputs.payment_database_log_group).toMatch(/^\/aws\/payment-database-.+$/);
      expect(outputs.security_events_log_group).toMatch(/^\/aws\/security-events-.+$/);
    });

    test('all SSM parameters should follow naming convention', () => {
      expect(outputs.ssm_xray_sampling_parameter).toMatch(/^\/observability\/.+\/xray\/sampling-rate$/);
      expect(outputs.ssm_log_retention_parameter).toMatch(/^\/observability\/.+\/logs\/retention-days$/);
      expect(outputs.ssm_latency_threshold_parameter).toMatch(/^\/observability\/.+\/alerts\/latency-threshold-ms$/);
    });

    test('dashboard name should follow naming convention', () => {
      expect(outputs.dashboard_name).toMatch(/^payment-operations-.+$/);
    });
  });

  describe('Integration and Connectivity', () => {
    test('CloudTrail should be writing to correct S3 bucket', async () => {
      const trailName = outputs.cloudtrail_arn.split('/').pop();
      const command = new GetTrailCommand({
        Name: trailName,
      });
      const response = await cloudTrailClient.send(command);

      expect(response.Trail?.S3BucketName).toBe(outputs.cloudtrail_bucket);
    });
  });
});
