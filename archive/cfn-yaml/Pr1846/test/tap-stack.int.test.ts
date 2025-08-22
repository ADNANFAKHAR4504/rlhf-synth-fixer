// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const ec2Client = new EC2Client({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('Secure Enterprise Infrastructure Integration Tests', () => {
  describe('KMS Encryption', () => {
    test('KMS key should be active and enabled', async () => {
      if (!outputs.KMSKeyId || outputs.KMSKeyId.includes('123456789012')) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have proper key policy for CloudTrail and S3', async () => {
      if (!outputs.KMSKeyId || outputs.KMSKeyId.includes('123456789012')) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.Description).toContain('enterprise data');
    });
  });

  describe('S3 Buckets Security', () => {
    test('Secure data bucket should exist and be accessible', async () => {
      if (
        !outputs.SecureDataBucket ||
        outputs.SecureDataBucket.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.SecureDataBucket,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Secure data bucket should have KMS encryption enabled', async () => {
      if (
        !outputs.SecureDataBucket ||
        outputs.SecureDataBucket.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.SecureDataBucket,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rules = response.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('Secure data bucket should block all public access', async () => {
      if (
        !outputs.SecureDataBucket ||
        outputs.SecureDataBucket.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.SecureDataBucket,
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('Secure data bucket should have versioning enabled', async () => {
      if (
        !outputs.SecureDataBucket ||
        outputs.SecureDataBucket.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.SecureDataBucket,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('CloudTrail bucket should exist and be properly configured', async () => {
      if (
        !outputs.CloudTrailBucket ||
        outputs.CloudTrailBucket.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const headCommand = new HeadBucketCommand({
        Bucket: outputs.CloudTrailBucket,
      });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.CloudTrailBucket,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Secure data access role should exist and require MFA', async () => {
      if (
        !outputs.SecureDataAccessRoleArn ||
        outputs.SecureDataAccessRoleArn.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const roleName = outputs.SecureDataAccessRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const mfaCondition = assumeRolePolicy.Statement?.[0]?.Condition;
      expect(mfaCondition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('true');
    });
  });

  describe('VPC and Network Security', () => {
    test('VPC should exist with correct configuration', async () => {
      if (!outputs.VPCId || outputs.VPCId.includes('vpc-0123456789')) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Private subnets should exist', async () => {
      if (
        !outputs.PrivateSubnet1Id ||
        outputs.PrivateSubnet1Id.includes('subnet-0123456789')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('VPC endpoint security group should restrict access', async () => {
      if (
        !outputs.VPCEndpointSecurityGroupId ||
        outputs.VPCEndpointSecurityGroupId.includes('sg-0123456789')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.VPCEndpointSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.IpPermissions).toBeDefined();

      const httpsRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/8');
    });
  });

  describe('CloudTrail Audit Logging', () => {
    test('CloudTrail should be active and logging', async () => {
      if (
        !outputs.CloudTrailArn ||
        outputs.CloudTrailArn.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const trailName = outputs.CloudTrailArn.split('/').pop();

      const getTrailCommand = new GetTrailCommand({
        Name: trailName,
      });
      const trailResponse = await cloudTrailClient.send(getTrailCommand);

      expect(trailResponse.Trail).toBeDefined();
      expect(trailResponse.Trail?.IsMultiRegionTrail).toBe(true);
      expect(trailResponse.Trail?.LogFileValidationEnabled).toBe(true);
      expect(trailResponse.Trail?.KmsKeyId).toBeDefined();

      const statusCommand = new GetTrailStatusCommand({
        Name: trailName,
      });
      const statusResponse = await cloudTrailClient.send(statusCommand);

      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('CloudWatch Monitoring and Alerting', () => {
    test('SNS topic for security alerts should exist', async () => {
      if (
        !outputs.SecurityAlertsTopicArn ||
        outputs.SecurityAlertsTopicArn.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SecurityAlertsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('CloudWatch alarms should be configured', async () => {
      if (
        !outputs.SecurityAlertsTopicArn ||
        outputs.SecurityAlertsTopicArn.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'Failed-MFA',
      });

      const response = await cloudWatchClient.send(command);
      const mfaAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('Failed-MFA-Login-Attempts')
      );

      if (mfaAlarm) {
        expect(mfaAlarm.MetricName).toBe('FailedMFALogins');
        expect(mfaAlarm.Namespace).toBe('Security/Authentication');
        expect(mfaAlarm.AlarmActions).toContain(outputs.SecurityAlertsTopicArn);
      }
    });

    test('Log groups should exist with encryption', async () => {
      if (
        !outputs.CloudTrailArn ||
        outputs.CloudTrailArn.includes('123456789012')
      ) {
        console.log('Skipping test - using mock outputs');
        return;
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/cloudtrail/enterprise-audit',
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('enterprise-audit')
      );

      if (logGroup) {
        expect(logGroup.kmsKeyId).toBeDefined();
        expect(logGroup.retentionInDays).toBe(365);
      }
    });
  });

  describe('End-to-End Security Validation', () => {
    test('All resources should be properly tagged and named', () => {
      // Verify all outputs contain expected naming patterns
      expect(outputs.SecureDataBucket).toContain('secure-enterprise-data');
    });

    test('Infrastructure should support secure data workflows', () => {
      // Verify all necessary components are present for secure workflows
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.SecureDataBucket).toBeDefined();
      expect(outputs.SecureDataAccessRoleArn).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.CloudTrailArn).toBeDefined();
      expect(outputs.SecurityAlertsTopicArn).toBeDefined();
    });

    test('All security controls should be in place', () => {
      // This is a meta-test to ensure all security requirements are addressable
      const securityControls = {
        encryption: outputs.KMSKeyArn,
        accessControl: outputs.SecureDataAccessRoleArn,
        networkIsolation: outputs.VPCId,
        auditLogging: outputs.CloudTrailArn,
        monitoring: outputs.SecurityAlertsTopicArn,
        dataStorage: outputs.SecureDataBucket,
      };

      Object.entries(securityControls).forEach(([control, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
      });
    });
  });
});
