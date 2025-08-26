import {
  CloudTrailClient,
  GetTrailCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';

import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Environment setup
const environment = process.env.ENVIRONMENT || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });

const cloudWatchClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const s3Client = new S3Client({ region });

describe('Security and Compliance Integration Tests', () => {

  describe('Infrastructure Outputs Validation', () => {
    test('should have all required security-related outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.MainKMSKeyId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
    });
  });

  describe('VPC and Network Security', () => {
    test('should validate VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test('should validate subnets are in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id
        ]
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);

      // Get unique AZs
      const uniqueAZs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CloudTrail S3 Bucket Security', () => {
    const bucketName = `myapp-cloudtrail-logs-${region}-${process.env.AWS_ACCOUNT_ID}-${environment}`;

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      const rules = response.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules).toHaveLength(1);

      const defaultEncryption = rules![0].ApplyServerSideEncryptionByDefault;
      expect(defaultEncryption).toBeDefined();
      expect(defaultEncryption!.SSEAlgorithm).toBe('aws:kms');
      expect(defaultEncryption!.KMSMasterKeyID).toBeDefined();
    });

    test('should have correct bucket policy', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);

      expect(policy.Statement).toHaveLength(2);

      const getAclStatement = policy.Statement.find((s: any) => s.Action === 's3:GetBucketAcl');
      expect(getAclStatement).toBeDefined();
      expect(getAclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');

      const putObjectStatement = policy.Statement.find((s: any) => s.Action === 's3:PutObject');
      expect(putObjectStatement).toBeDefined();
      expect(putObjectStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(putObjectStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });
  });

  describe('KMS and Encryption', () => {
    test('should validate KMS key configuration', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.MainKMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      // Check key status
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    // EBS volume tests removed as we don't have EC2 instances anymore
  });

  describe('IAM and Access Controls', () => {
    test('should validate CloudTrail role permissions', async () => {
      const command = new GetRoleCommand({
        RoleName: `${outputs.StackName}-CloudTrailRole`
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();

      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
    });


  });

  describe('Monitoring and Logging', () => {
    test('should validate CloudWatch alarms', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.CPUAlarmName]
      });

      const response = await cloudWatchClient.send(command);
      const alarm = response.MetricAlarms![0];

      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.MetricName).toBe('CPUUtilization');
    });


    test('should validate CloudTrail configuration', async () => {
      const command = new GetTrailCommand({
        Name: outputs.CloudTrailName
      });

      const response = await cloudTrailClient.send(command);
      const trail = response.Trail!;

      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.HasCustomEventSelectors).toBe(true);
    });
  });

  // EC2 Instance Security tests removed as we don't have EC2 instances anymore
});
