import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeComplianceByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let configClient: ConfigServiceClient;
  let logsClient: CloudWatchLogsClient;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Read deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS clients
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    configClient = new ConfigServiceClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
  });

  describe('Stack Outputs', () => {
    test('should have ConfigBucketName output', () => {
      expect(outputs.ConfigBucketName).toBeDefined();
      expect(outputs.ConfigBucketName).toMatch(/compliance-config-/);
    });

    test('should have ConfigBucketArn output', () => {
      expect(outputs.ConfigBucketArn).toBeDefined();
      expect(outputs.ConfigBucketArn).toMatch(/^arn:aws:s3:::/);
    });

    test('should have ComplianceNotificationTopicArn output', () => {
      expect(outputs.ComplianceNotificationTopicArn).toBeDefined();
      expect(outputs.ComplianceNotificationTopicArn).toMatch(/^arn:aws:sns:/);
    });

    test('should have ComplianceRulesDeployed output', () => {
      expect(outputs.ComplianceRulesDeployed).toBe('10');
    });

    test('should have ComplianceDashboardLogGroup output', () => {
      expect(outputs.ComplianceDashboardLogGroup).toBeDefined();
      expect(outputs.ComplianceDashboardLogGroup).toMatch(/\/aws\/compliance\//);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ConfigBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.ConfigBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.ConfigBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('should have lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.ConfigBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Expiration?.Days).toBe(90);
    });

    test('bucket should exist and be accessible', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.ConfigBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('SNS Topic Configuration', () => {
    test('should have valid topic attributes', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceNotificationTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.ComplianceNotificationTopicArn);
      expect(response.Attributes?.DisplayName).toBe('Compliance Violation Notifications');
    });

    test('should have subscriptions configured', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.ComplianceNotificationTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);

      const emailSubscription = response.Subscriptions?.find(
        (sub) => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
    });

    test('topic should be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.ComplianceNotificationTopicArn,
      });

      await expect(snsClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('AWS Config Rules', () => {
    const expectedRulePatterns = [
      's3-bucket-public-read-prohibited',
      's3-bucket-public-write-prohibited',
      's3-bucket-encryption-enabled',
      's3-bucket-versioning-enabled',
      'ec2-volume-encryption',
      'rds-encryption-enabled',
      'iam-password-policy',
      'iam-root-access-key-check',
      'vpc-flow-logs-enabled',
      'cloudtrail-enabled',
    ];


    test('all Config Rules should have correct source identifiers', async () => {
      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      const deployedRules = response.ConfigRules?.filter((rule) =>
        rule.ConfigRuleName?.includes('synth101912507')
      );

      deployedRules?.forEach((rule) => {
        expect(rule.Source).toBeDefined();
        expect(rule.Source?.Owner).toBe('AWS');
        expect(rule.Source?.SourceIdentifier).toBeDefined();
      });
    });






  });

  describe('CloudWatch Logs', () => {
    test('should have log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ComplianceDashboardLogGroup,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.[0];
      expect(logGroup?.logGroupName).toBe(outputs.ComplianceDashboardLogGroup);
    });

    test('log group should have 30 day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ComplianceDashboardLogGroup,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.[0];
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('log group should be accessible', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ComplianceDashboardLogGroup,
      });

      await expect(logsClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {

    test('all resource names should be unique', () => {
      const names = [
        outputs.ConfigBucketName,
        outputs.ComplianceNotificationTopicArn,
        outputs.ComplianceDashboardLogGroup,
      ];

      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('End-to-End Compliance Monitoring', () => {

    test('deployed S3 bucket should pass its own compliance checks', async () => {
      // The deployed Config bucket should be compliant with S3 Config Rules
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.ConfigBucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.ConfigBucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: outputs.ConfigBucketName,
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });
  });
});
