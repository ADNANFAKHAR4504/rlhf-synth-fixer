import fs from 'fs';
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { EC2Client, DescribeSecurityGroupsCommand, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { CloudTrailClient, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const s3 = new S3Client({});
const iam = new IAMClient({});
const ec2 = new EC2Client({});
const cloudtrail = new CloudTrailClient({});

// Outputs
const {
  LogBucketName,
  EC2RoleArn,
  VPCId,
  RestrictedSecurityGroupId,
} = outputs;

describe('Security CIS Benchmark Integration Tests', () => {
  describe('S3 Log Bucket', () => {
    test('should have versioning enabled', async () => {
      const result = await s3.send(new GetBucketVersioningCommand({ Bucket: LogBucketName }));
      expect(result.Status).toBe('Enabled');
    });

    test('should have default encryption enabled (AES256)', async () => {
      const result = await s3.send(new GetBucketEncryptionCommand({ Bucket: LogBucketName }));
      const rules = result.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      const defaultAlgo = rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(defaultAlgo).toBe('AES256');
    });
  });

  describe('IAM Role for EC2', () => {
    test('should exist and be assumable by EC2', async () => {
      const roleName = EC2RoleArn.split('/').pop();
      const role = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
      const trustPolicy = JSON.stringify(role.Role.AssumeRolePolicyDocument);
      expect(trustPolicy).toContain('ec2.amazonaws.com');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should exist in the region', async () => {
      const result = await ec2.send(new DescribeVpcsCommand({ VpcIds: [VPCId] }));
      expect(result.Vpcs?.length).toBe(1);
    });
  });

  describe('Restricted Security Group', () => {
    test('should allow only SSH from a specific IP range', async () => {
      const result = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [RestrictedSecurityGroupId] }));
      const sg = result.SecurityGroups?.[0];
      expect(sg).toBeDefined();

      const sshRule = sg.IpPermissions?.find(
        perm => perm.FromPort === 22 && perm.ToPort === 22 && perm.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should have a multi-region trail with log validation', async () => {
      const result = await cloudtrail.send(new DescribeTrailsCommand({}));
      const trail = result.trailList?.find(t => t.S3BucketName === LogBucketName);
      expect(trail).toBeDefined();
      expect(trail!.IsMultiRegionTrail).toBe(true);
      expect(trail!.LogFileValidationEnabled).toBe(true);
    });
  });
});
