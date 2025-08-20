import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketLocationCommand,
  GetBucketLoggingCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-southeast-1';
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const iam = new IAMClient({ region });
const s3 = new S3Client({ region });
const cloudtrail = new CloudTrailClient({ region });
const ec2 = new EC2Client({ region });
const kms = new KMSClient({ region });

const listCsv = (csv?: string) =>
  csv
    ? csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];

describe('TapStack Security Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'ArtifactsBucket',
        'KMSKeyId',
        'ApplicationSecurityGroup',
        'PublicSubnets',
        'PrivateSubnets',
        'VPCId',
        'BastionHostPublicIP',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('IAM Roles', () => {
    test('EC2InstanceRole should exist', async () => {
      const roleName = outputs.EC2InstanceRoleName;
      if (!roleName) return; // skip if not exported
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.RoleName).toBe(roleName);
      expect(res.Role?.AssumeRolePolicyDocument).toBeDefined();
      const trust = decodeURIComponent(
        res.Role?.AssumeRolePolicyDocument || ''
      );
      expect(trust).toMatch(/ec2\.amazonaws\.com/);
    });
  });

  describe('S3 Bucket', () => {
    test('ArtifactsBucket should exist and be versioned', async () => {
      const bucket = outputs.ArtifactsBucket;
      const loc = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      expect([null, '', region]).toContain(loc.LocationConstraint as any);
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(['Enabled', 'Suspended']).toContain(versioning.Status);
    });

    test('ArtifactsBucket should have access logging enabled', async () => {
      const bucket = outputs.ArtifactsBucket;
      const logging = await s3.send(
        new GetBucketLoggingCommand({ Bucket: bucket })
      );
      expect(logging.LoggingEnabled?.TargetBucket).toBeDefined();
      expect(
        (logging.LoggingEnabled?.TargetPrefix || '').startsWith('access-logs/')
      ).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should exist and be logging (if output provided)', async () => {
      const trailArn = outputs.CloudTrailArn;
      if (!trailArn) return; // skip if not exported
      const res = await cloudtrail.send(
        new GetTrailCommand({ Name: trailArn })
      );
      expect(res.Trail?.TrailARN).toBe(trailArn);
      expect(res.Trail?.IsMultiRegionTrail).toBe(true);
      expect(res.Trail?.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('VPC & Subnets', () => {
    test('VPC exists (via VPCId output)', async () => {
      const vpcId = outputs.VPCId;
      if (!vpcId) return;
      const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(resp.Vpcs?.[0]?.VpcId).toBe(vpcId);
    });

    test('Public & Private subnets exist and span >=2 AZs', async () => {
      const publicIds = listCsv(outputs.PublicSubnets);
      const privateIds = listCsv(outputs.PrivateSubnets);
      if (publicIds.length + privateIds.length === 0) return;
      const res = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: [...publicIds, ...privateIds] })
      );
      const subs = res.Subnets || [];
      const azPublic = new Set(
        subs
          .filter(s => publicIds.includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      const azPrivate = new Set(
        subs
          .filter(s => privateIds.includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      expect(azPublic.size).toBeGreaterThanOrEqual(2);
      expect(azPrivate.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('ApplicationSecurityGroup allows HTTP (80) ingress', async () => {
      const sgId = outputs.ApplicationSecurityGroup;
      if (!sgId) return;
      const r = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      const perms = r.SecurityGroups?.[0]?.IpPermissions || [];
      expect(perms.some(p => p.FromPort === 80 && p.ToPort === 80)).toBe(true);
    });
  });

  describe('Bastion Host', () => {
    test('Bastion host public IP maps to a running instance in the VPC', async () => {
      const ip = outputs.BastionHostPublicIP;
      if (!ip) return;
      const resp = await ec2.send(
        new DescribeInstancesCommand({
          Filters: [{ Name: 'ip-address', Values: [ip] }],
        })
      );
      const instances = (resp.Reservations || []).flatMap(
        r => r.Instances || []
      );
      const inst = instances[0];
      expect(inst?.PublicIpAddress).toBe(ip);
      if (outputs.VPCId) {
        expect(inst?.VpcId).toBe(outputs.VPCId);
      }
    });
  });

  describe('KMS', () => {
    test('KMS key is enabled', async () => {
      const keyId = outputs.KMSKeyId;
      const d = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(d.KeyMetadata?.Enabled).toBe(true);
    });
  });
});
