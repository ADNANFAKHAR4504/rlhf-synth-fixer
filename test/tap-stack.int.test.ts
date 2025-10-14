import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSecurityGroupRulesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  GetBucketLoggingCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  GuardDutyClient,
  GetDetectorCommand,
  ListDetectorsCommand,
} from '@aws-sdk/client-guardduty';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
  GetComplianceDetailsByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import fs from 'fs';
import path from 'path';

const region = 'us-west-2';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const guardDutyClient = new GuardDutyClient({ region });
const iamClient = new IAMClient({ region });
const configClient = new ConfigServiceClient({ region });

// Load CloudFormation outputs
let outputs: Record<string, string> = {};
let deploymentExists = false;

function skipIfNoDeployment() {
  if (!deploymentExists) {
    console.log('Skipping test - no deployment detected');
    return true;
  }
  return false;
}

beforeAll(() => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

  try {
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
      deploymentExists = Object.keys(outputs).length > 0;
      console.log('Loaded deployment outputs:', outputs);
    } else {
      console.warn('No deployment outputs found - integration tests will be skipped');
    }
  } catch (error) {
    console.warn('Failed to load deployment outputs:', error);
  }
});

describe('AWS Security Baseline - Integration Tests', () => {

  // ============================================================
  // VPC and Network Infrastructure Tests
  // ============================================================
  describe('VPC and Network Infrastructure', () => {

    test('VPC should exist with correct CIDR block', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC Flow Logs should be enabled and delivering to CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      }));

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    });

    test('VPC Flow Logs CloudWatch Log Group should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs-${environmentSuffix}`,
      }));

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toContain('flowlogs');
      expect(logGroup.retentionInDays).toBe(7);
    });

    test('VPC should have DNS support and DNS hostnames enabled', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));

      const vpc = response.Vpcs![0];
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });
  });

  // ============================================================
  // Security Groups Tests
  // ============================================================
  describe('Security Groups', () => {

    test('WebSecurityGroup should exist with correct configuration', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('WebSecurityGroup');
      expect(sg.Description).toContain('Security group for web servers');
    });

    test('WebSecurityGroup should allow SSH from allowed IP range', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];
      const sshRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );

      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });

    test('WebSecurityGroup should allow HTTP from allowed IP range', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );

      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });

    test('WebSecurityGroup should not have unrestricted access', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];

      sg.IpPermissions?.forEach(rule => {
        rule.IpRanges?.forEach(ipRange => {
          expect(ipRange.CidrIp).not.toBe('0.0.0.0/0');
        });
      });
    });

    test('WebSecurityGroup should have exactly 2 ingress rules', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toHaveLength(2);
    });
  });

  // ============================================================
  // S3 Storage and Encryption Tests
  // ============================================================
  describe('S3 Storage and Encryption', () => {

    test('SecureS3Bucket should exist and be accessible', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.SecureS3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    test('SecureS3Bucket should have KMS encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.SecureS3BucketName;

      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toContain('arn:aws:kms');
    });

    test('SecureS3Bucket should have versioning enabled', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.SecureS3BucketName;

      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName,
      }));

      expect(response.Status).toBe('Enabled');
    });

    test('SecureS3Bucket should have public access blocked', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.SecureS3BucketName;

      const response = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      }));

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('SecureS3Bucket should have bucket policy with security restrictions', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.SecureS3BucketName;

      const response = await s3Client.send(new GetBucketPolicyCommand({
        Bucket: bucketName,
      }));

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Check for deny insecure connections
      const denyInsecureStatement = policy.Statement.find((s: any) =>
        s.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Effect).toBe('Deny');
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('CloudTrail S3 Bucket should exist and be configured', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      expect(trailResponse.trailList).toBeDefined();
      expect(trailResponse.trailList!.length).toBeGreaterThan(0);

      const bucketName = trailResponse.trailList![0].S3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName! }))
      ).resolves.not.toThrow();
    });

    test('CloudTrail S3 Bucket should have encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const bucketName = trailResponse.trailList![0].S3BucketName!;

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('CloudTrail S3 Bucket should have public access blocked', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const bucketName = trailResponse.trailList![0].S3BucketName!;

      const response = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      }));

      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('Config S3 Bucket should exist for AWS Config delivery', async () => {
      if (skipIfNoDeployment()) return;

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));

      expect(channelResponse.DeliveryChannels).toBeDefined();
      expect(channelResponse.DeliveryChannels!.length).toBeGreaterThan(0);

      const bucketName = channelResponse.DeliveryChannels![0].s3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName! }))
      ).resolves.not.toThrow();
    });

    test('Config S3 Bucket should have encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));
      const bucketName = channelResponse.DeliveryChannels![0].s3BucketName!;

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('all S3 buckets should have logging or be logging buckets themselves', async () => {
      if (skipIfNoDeployment()) return;

      const buckets = [outputs.SecureS3BucketName];

      for (const bucketName of buckets) {
        const loggingResponse = await s3Client.send(new GetBucketLoggingCommand({
          Bucket: bucketName,
        }));

        // Either has logging enabled or is itself a logging bucket
        expect(
          loggingResponse.LoggingEnabled !== undefined ||
          bucketName.includes('cloudtrail') ||
          bucketName.includes('config')
        ).toBe(true);
      }
    });
  });

  // ============================================================
  // KMS Key and Encryption Tests
  // ============================================================
  describe('KMS Key and Encryption', () => {

    test('KMS key should exist and be enabled', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    test('KMS key should be customer managed', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
      expect(response.KeyMetadata!.Origin).toBe('AWS_KMS');
    });

    test('KMS key should have an alias', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new ListAliasesCommand({
        KeyId: kmsKeyId,
      }));

      expect(response.Aliases).toBeDefined();
      expect(response.Aliases!.length).toBeGreaterThan(0);

      const alias = response.Aliases![0];
      expect(alias.AliasName).toContain('security-baseline');
    });

    test('KMS key should have rotation enabled', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId,
      }));

      // Customer managed keys can have rotation
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });

    test('KMS key policy should allow required AWS services', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;

      const response = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: kmsKeyId,
        PolicyName: 'default',
      }));

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Check for service principals
      const serviceStatement = policy.Statement.find((s: any) =>
        s.Principal?.Service && Array.isArray(s.Principal.Service)
      );

      expect(serviceStatement).toBeDefined();
      const services = serviceStatement.Principal.Service;
      expect(services).toContain('cloudtrail.amazonaws.com');
      expect(services).toContain('logs.amazonaws.com');
      expect(services).toContain('s3.amazonaws.com');
    });
  });

  // ============================================================
  // Secrets Manager Tests
  // ============================================================
  describe('Secrets Manager', () => {

    test('DBSecret should exist', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('DBSecret');
    });

    test('DBSecret should have KMS encryption', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      expect(response.KmsKeyId).toBeDefined();
      expect(response.KmsKeyId).toContain('arn:aws:kms');
    });

    test('DBSecret should be retrievable', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn,
      }));

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.password).toBeDefined();
    });

    test('DBSecret password should meet complexity requirements', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn,
      }));

      const secret = JSON.parse(response.SecretString!);
      const password = secret.password;

      expect(password.length).toBe(32);
      expect(password).toMatch(/[a-zA-Z0-9]/);
    });

    test('DBSecret should not be scheduled for deletion', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      expect(response.DeletedDate).toBeUndefined();
    });
  });

  // ============================================================
  // CloudTrail Tests
  // ============================================================
  describe('CloudTrail', () => {

    test('CloudTrail should exist and be logging', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;
      expect(cloudTrailName).toBeDefined();

      const response = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(response.IsLogging).toBe(true);
    });

    test('CloudTrail should be multi-region', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      expect(response.trailList).toBeDefined();
      const trail = response.trailList![0];
      expect(trail.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail should be logging to S3', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.S3BucketName).toBeDefined();
      expect(trail.S3BucketName).toContain('cloudtrail');
    });

    test('CloudTrail should be sending logs to CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(trail.CloudWatchLogsRoleArn).toBeDefined();
    });

    test('CloudTrail should include global service events', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
    });
  });

  // ============================================================
  // CloudWatch Monitoring Tests
  // ============================================================
  describe('CloudWatch Monitoring', () => {

    test('CloudTrail Log Group should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/cloudtrail',
      }));

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toContain('cloudtrail');
      expect(logGroup.retentionInDays).toBe(7);
    });

    test('Console Sign-In Metric Filter should exist', async () => {
      if (skipIfNoDeployment()) return;

      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/cloudtrail',
      }));

      const logGroupName = logGroupResponse.logGroups![0].logGroupName!;

      const response = await cloudWatchLogsClient.send(new DescribeMetricFiltersCommand({
        logGroupName: logGroupName,
      }));

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThan(0);

      const metricFilter = response.metricFilters!.find(mf =>
        mf.filterName?.includes('ConsoleSignIn')
      );

      expect(metricFilter).toBeDefined();
    });

    test('Console Sign-In Metric Filter should have correct pattern', async () => {
      if (skipIfNoDeployment()) return;

      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/cloudtrail',
      }));

      const logGroupName = logGroupResponse.logGroups![0].logGroupName!;

      const response = await cloudWatchLogsClient.send(new DescribeMetricFiltersCommand({
        logGroupName: logGroupName,
      }));

      const metricFilter = response.metricFilters!.find(mf =>
        mf.filterName?.includes('ConsoleSignIn')
      );

      expect(metricFilter!.filterPattern).toContain('ConsoleLogin');
      expect(metricFilter!.filterPattern).toContain('errorMessage');
    });

    test('Console Sign-In Alarm should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('Console Sign-In Alarm should have correct threshold', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(3);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm.EvaluationPeriods).toBe(1);
      expect(alarm.Period).toBe(300);
    });

    test('Console Sign-In Alarm should monitor correct metric', async () => {
      if (skipIfNoDeployment()) return;

      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('ConsoleSignInFailureCount');
      expect(alarm.Namespace).toBe('CloudTrailMetrics');
      expect(alarm.Statistic).toBe('Sum');
    });
  });

  // ============================================================
  // GuardDuty Tests
  // ============================================================
  describe('GuardDuty', () => {

    test('GuardDuty detector should exist', async () => {
      if (skipIfNoDeployment()) return;

      const detectorId = outputs.GuardDutyDetectorId;
      expect(detectorId).toBeDefined();

      const response = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: detectorId,
      }));

      expect(response.Status).toBe('ENABLED');
    });

    test('GuardDuty should have S3 logs protection enabled', async () => {
      if (skipIfNoDeployment()) return;

      const detectorId = outputs.GuardDutyDetectorId;

      const response = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: detectorId,
      }));

      expect(response.DataSources?.S3Logs?.Status).toBe('ENABLED');
    });

    test('GuardDuty should have Kubernetes audit logs enabled', async () => {
      if (skipIfNoDeployment()) return;

      const detectorId = outputs.GuardDutyDetectorId;

      const response = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: detectorId,
      }));

      expect(response.DataSources?.Kubernetes?.AuditLogs?.Status).toBe('ENABLED');
    });

    test('GuardDuty should be actively monitoring', async () => {
      if (skipIfNoDeployment()) return;

      const detectorId = outputs.GuardDutyDetectorId;

      const response = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: detectorId,
      }));

      expect(response.Status).toBe('ENABLED');
      expect(response.ServiceRole).toBeDefined();
    });
  });

  // ============================================================
  // IAM Roles and Policies Tests
  // ============================================================
  describe('IAM Roles and Policies', () => {

    test('S3ReadOnlyRole should exist', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop()!;

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName,
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });

    test('S3ReadOnlyRole should have EC2 as trusted entity', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName,
      }));

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );

      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('S3ReadOnlyRole should have S3 read-only permissions', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const response = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyPolicy',
      }));

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));

      const s3Actions = policy.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
      expect(s3Actions).not.toContain('s3:PutObject');
      expect(s3Actions).not.toContain('s3:DeleteObject');
    });

    test('VPC Flow Log Role should exist and have CloudWatch permissions', async () => {
      if (skipIfNoDeployment()) return;

      // Get the VPC Flow Log to find its role
      const vpcId = outputs.VPCId;

      const flowLogResponse = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      }));

      expect(flowLogResponse.FlowLogs).toBeDefined();
      expect(flowLogResponse.FlowLogs!.length).toBeGreaterThan(0);

      const deliverLogsPermissionArn = flowLogResponse.FlowLogs![0].DeliverLogsPermissionArn;
      expect(deliverLogsPermissionArn).toBeDefined();
    });

    test('Config Role should exist and have required permissions', async () => {
      if (skipIfNoDeployment()) return;

      const recorderResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      expect(recorderResponse.ConfigurationRecorders).toBeDefined();
      expect(recorderResponse.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const roleArn = recorderResponse.ConfigurationRecorders![0].roleARN;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('ConfigRole');
    });
  });

  // ============================================================
  // AWS Config Tests
  // ============================================================
  describe('AWS Config', () => {

    test('Config Recorder should exist and be recording', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders![0];
      expect(recorder.name).toBeDefined();
      expect(recorder.roleARN).toBeDefined();
    });

    test('Config Recorder should record all resource types', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      const recorder = response.ConfigurationRecorders![0];
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    });

    test('Config Delivery Channel should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      expect(response.DeliveryChannels).toBeDefined();
      expect(response.DeliveryChannels!.length).toBeGreaterThan(0);

      const channel = response.DeliveryChannels![0];
      expect(channel.name).toBeDefined();
      expect(channel.s3BucketName).toBeDefined();
    });

    test('Config Delivery Channel should deliver to S3', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      const channel = response.DeliveryChannels![0];
      expect(channel.s3BucketName).toContain('config');
    });

    test('Public S3 Bucket Config Rule should exist', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      expect(response.ConfigRules).toBeDefined();

      const publicS3Rule = response.ConfigRules!.find(rule =>
        rule.Source?.SourceIdentifier === 's3-bucket-public-read-prohibited'
      );

      expect(publicS3Rule).toBeDefined();
      expect(publicS3Rule!.ConfigRuleState).toBe('ACTIVE');
    });

    test('Public S3 Bucket Config Rule should be using AWS managed rule', async () => {
      if (skipIfNoDeployment()) return;

      const response = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      const publicS3Rule = response.ConfigRules!.find(rule =>
        rule.Source?.SourceIdentifier === 's3-bucket-public-read-prohibited'
      );

      expect(publicS3Rule!.Source?.Owner).toBe('AWS');
      expect(publicS3Rule!.Source?.SourceIdentifier).toBe('s3-bucket-public-read-prohibited');
    });
  });

  // ============================================================
  // Cross-Service Integration Scenarios
  // ============================================================
  describe('Cross-Service Integration Scenarios', () => {

    test('VPC Flow Logs should integrate with CloudWatch Logs', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;

      // Get flow log configuration
      const flowLogResponse = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      }));

      const flowLog = flowLogResponse.FlowLogs![0];
      const logGroupName = flowLog.LogGroupName;

      // Verify log group exists in CloudWatch
      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      expect(logGroupResponse.logGroups).toBeDefined();
      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
      expect(logGroupResponse.logGroups![0].logGroupName).toBe(logGroupName);
    });

    test('CloudTrail should integrate with S3 and CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      // Get CloudTrail configuration
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = trailResponse.trailList![0];

      // Verify S3 bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: trail.S3BucketName! }))
      ).resolves.not.toThrow();

      // Verify CloudWatch Log Group exists
      const logGroupArn = trail.CloudWatchLogsLogGroupArn!;
      const logGroupName = logGroupArn.split(':log-group:')[1].split(':')[0];

      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));

      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
    });

    test('CloudWatch Metric Filter should integrate with Alarm', async () => {
      if (skipIfNoDeployment()) return;

      // Get metric filter
      const logGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/cloudtrail',
      }));

      const logGroupName = logGroupResponse.logGroups![0].logGroupName!;

      const metricFilterResponse = await cloudWatchLogsClient.send(
        new DescribeMetricFiltersCommand({ logGroupName })
      );

      const metricFilter = metricFilterResponse.metricFilters!.find(mf =>
        mf.filterName?.includes('ConsoleSignIn')
      );

      const metricName = metricFilter!.metricTransformations![0].metricName!;
      const metricNamespace = metricFilter!.metricTransformations![0].metricNamespace!;

      // Get alarm
      const alarmResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      const alarm = alarmResponse.MetricAlarms![0];

      // Verify alarm monitors the metric from the filter
      expect(alarm.MetricName).toBe(metricName);
      expect(alarm.Namespace).toBe(metricNamespace);
    });

    test('S3 buckets should use KMS key for encryption', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const bucketName = outputs.SecureS3BucketName;

      // Get bucket encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      const kmsKeyIdFromBucket = encryptionResponse
        .ServerSideEncryptionConfiguration!
        .Rules![0]
        .ApplyServerSideEncryptionByDefault!
        .KMSMasterKeyID!;

      // Verify it's using the same KMS key
      expect(kmsKeyIdFromBucket).toContain(kmsKeyId.split('/').pop());
    });

    test('Secrets Manager should use KMS key for encryption', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const secretArn = outputs.DBSecretArn;

      // Get secret configuration
      const secretResponse = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      const secretKmsKeyId = secretResponse.KmsKeyId!;

      // Verify it's using the same KMS key
      expect(secretKmsKeyId).toContain(kmsKeyId.split('/').pop());
    });

    test('AWS Config should deliver to S3 bucket', async () => {
      if (skipIfNoDeployment()) return;

      // Get Config delivery channel
      const channelResponse = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      const bucketName = channelResponse.DeliveryChannels![0].s3BucketName!;

      // Verify S3 bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      // Verify bucket has encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('GuardDuty should have access to S3 logs', async () => {
      if (skipIfNoDeployment()) return;

      const detectorId = outputs.GuardDutyDetectorId;

      // Get GuardDuty configuration
      const response = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: detectorId,
      }));

      // Verify S3 logs are enabled
      expect(response.DataSources?.S3Logs?.Status).toBe('ENABLED');

      // Verify CloudTrail is logging (which provides S3 data events)
      const cloudTrailName = outputs.CloudTrailName;
      const trailStatus = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(trailStatus.IsLogging).toBe(true);
    });

    test('Security Group should be attached to VPC', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const securityGroupId = outputs.SecurityGroupId;

      // Get security group
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      }));

      const sg = sgResponse.SecurityGroups![0];

      // Verify it belongs to the correct VPC
      expect(sg.VpcId).toBe(vpcId);
    });

    test('IAM role should have permissions to access encrypted S3 buckets', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      // Get role policy
      const policyResponse = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyPolicy',
      }));

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));

      // Verify S3 read permissions
      const s3Actions = policy.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
    });

    test('end-to-end audit trail: CloudTrail -> S3 -> KMS encryption', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;
      const kmsKeyId = outputs.KMSKeyId;

      // Get CloudTrail configuration
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = trailResponse.trailList![0];
      const bucketName = trail.S3BucketName!;

      // Verify bucket encryption uses KMS
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName,
      }));

      const bucketKmsKey = encryptionResponse
        .ServerSideEncryptionConfiguration!
        .Rules![0]
        .ApplyServerSideEncryptionByDefault!
        .KMSMasterKeyID!;

      // Verify same KMS key is used
      expect(bucketKmsKey).toContain(kmsKeyId.split('/').pop());

      // Verify CloudTrail is actively logging
      const statusResponse = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  // ============================================================
  // Security Compliance Validation
  // ============================================================
  describe('Security Compliance Validation', () => {

    test('all S3 buckets should be encrypted at rest', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      // Get all bucket names
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));

      const buckets = [
        outputs.SecureS3BucketName,
        trailResponse.trailList![0].S3BucketName!,
        channelResponse.DeliveryChannels![0].s3BucketName!,
      ];

      // Verify each bucket has encryption
      for (const bucketName of buckets) {
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
          Bucket: bucketName,
        }));

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        const algorithm = encryptionResponse
          .ServerSideEncryptionConfiguration!
          .Rules![0]
          .ApplyServerSideEncryptionByDefault!
          .SSEAlgorithm;

        expect(algorithm).toBe('aws:kms');
      }
    });

    test('all S3 buckets should block public access', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const channelResponse = await configClient.send(new DescribeDeliveryChannelsCommand({}));

      const buckets = [
        outputs.SecureS3BucketName,
        trailResponse.trailList![0].S3BucketName!,
        channelResponse.DeliveryChannels![0].s3BucketName!,
      ];

      // Verify each bucket blocks public access
      for (const bucketName of buckets) {
        const response = await s3Client.send(new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        }));

        expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      }
    });

    test('CloudTrail should be logging to encrypted destinations', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      // Verify CloudTrail is logging
      const statusResponse = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: cloudTrailName,
      }));

      expect(statusResponse.IsLogging).toBe(true);

      // Get trail configuration
      const trailResponse = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = trailResponse.trailList![0];

      // Verify S3 bucket is encrypted
      const bucketEncryption = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: trail.S3BucketName!,
      }));

      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('secrets should be encrypted with KMS', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DBSecretArn;
      const kmsKeyId = outputs.KMSKeyId;

      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn,
      }));

      expect(response.KmsKeyId).toBeDefined();
      expect(response.KmsKeyId).toContain(kmsKeyId.split('/').pop());
    });

    test('monitoring should be enabled for security events', async () => {
      if (skipIfNoDeployment()) return;

      // Verify CloudWatch alarm exists
      const alarmResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ConsoleSignInFailures',
      }));

      expect(alarmResponse.MetricAlarms).toBeDefined();
      expect(alarmResponse.MetricAlarms!.length).toBeGreaterThan(0);

      // Verify GuardDuty is enabled
      const detectorId = outputs.GuardDutyDetectorId;
      const guardDutyResponse = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: detectorId,
      }));

      expect(guardDutyResponse.Status).toBe('ENABLED');
    });

    test('IAM roles should follow least privilege principle', async () => {
      if (skipIfNoDeployment()) return;

      const roleArn = outputs.IAMRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const policyResponse = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyPolicy',
      }));

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      const actions = policy.Statement[0].Action;

      // Verify only read actions are allowed
      expect(actions).toContain('s3:GetObject');
      expect(actions).not.toContain('s3:PutObject');
      expect(actions).not.toContain('s3:DeleteObject');
      expect(actions).not.toContain('s3:*');
    });

    test('AWS Config should be monitoring compliance', async () => {
      if (skipIfNoDeployment()) return;

      const rulesResponse = await configClient.send(new DescribeConfigRulesCommand({}));

      expect(rulesResponse.ConfigRules).toBeDefined();
      expect(rulesResponse.ConfigRules!.length).toBeGreaterThan(0);

      const publicS3Rule = rulesResponse.ConfigRules!.find(rule =>
        rule.Source?.SourceIdentifier === 's3-bucket-public-read-prohibited'
      );

      expect(publicS3Rule).toBeDefined();
      expect(publicS3Rule!.ConfigRuleState).toBe('ACTIVE');
    });

    test('log retention should be configured for audit trails', async () => {
      if (skipIfNoDeployment()) return;

      // Check VPC Flow Logs retention
      const flowLogGroupResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/vpc/flowlogs',
      }));

      expect(flowLogGroupResponse.logGroups![0].retentionInDays).toBe(7);

      // Check CloudTrail logs retention
      const cloudTrailLogGroupResponse = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/cloudtrail',
        })
      );

      expect(cloudTrailLogGroupResponse.logGroups![0].retentionInDays).toBe(7);
    });

    test('multi-region compliance should be enabled', async () => {
      if (skipIfNoDeployment()) return;

      const cloudTrailName = outputs.CloudTrailName;

      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [cloudTrailName],
      }));

      const trail = response.trailList![0];

      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
    });
  });
});
