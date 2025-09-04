import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetDetectorCommand, GuardDutyClient } from '@aws-sdk/client-guardduty';
import { GetInstanceProfileCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetBucketLocationCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const cloudtrail = new CloudTrailClient({ region });
const iam = new IAMClient({ region });
const guardduty = new GuardDutyClient({ region });
const kms = new KMSClient({ region });

describe('TapStack Security Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'CloudTrailArn',
        'EC2InstanceProfileArn',
        'GuardDutyDetectorId',
        'KMSKeyId',
        'PrivateSubnetId',
        'PublicSubnetId',
        'SecurityGroupId',
        'SecurityLogsBucketName',
        'VPCId',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('VPC and Subnets', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VPCId;
      const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = resp.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe('available');
    });
    test('Public and Private subnets should exist in the VPC', async () => {
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnetId = outputs.PrivateSubnetId;
      const resp = await ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: [publicSubnetId, privateSubnetId],
        })
      );
      const subnets = resp.Subnets || [];
      expect(subnets.length).toBe(2);
      subnets.forEach(sub => expect(sub.VpcId).toBe(vpcId));
    });
  });

  describe('Security Group', () => {
    test('Restricted security group should exist in the VPC', async () => {
      const sgId = outputs.SecurityGroupId;
      const vpcId = outputs.VPCId;
      const resp = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      const sg = resp.SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(sgId);
      expect(sg?.VpcId).toBe(vpcId);
    });
  });

  describe('S3 Security Logs Bucket', () => {
    test('Security logs bucket should exist in correct region', async () => {
      const bucket = outputs.SecurityLogsBucketName;
      const res = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      // For ap-northeast-1, LocationConstraint may be 'ap-northeast-1' or '' (for us-east-1)
      expect([null, '', region]).toContain(res.LocationConstraint);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should exist and match ARN', async () => {
      const arn = outputs.CloudTrailArn;
      const res = await cloudtrail.send(new GetTrailCommand({ Name: arn }));
      expect(res.Trail?.TrailARN).toBe(arn);
      expect(res.Trail?.IsMultiRegionTrail).toBe(true);
    });
  });

  describe('EC2 Instance Profile', () => {
    test('EC2 instance profile should exist and match ARN', async () => {
      const arn = outputs.EC2InstanceProfileArn;
      const name = arn.split('/').pop();
      const res = await iam.send(
        new GetInstanceProfileCommand({ InstanceProfileName: name! })
      );
      expect(res.InstanceProfile?.Arn).toBe(arn);
    });
  });

  describe('GuardDuty', () => {
    test('GuardDuty detector should exist and be enabled', async () => {
      const detectorId = outputs.GuardDutyDetectorId;
      const res = await guardduty.send(
        new GetDetectorCommand({ DetectorId: detectorId })
      );
      expect(res.Status).toBe('ENABLED');
    });
  });

  describe('KMS Key', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      const res = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(res.KeyMetadata?.KeyId).toBe(keyId);
      expect(res.KeyMetadata?.Enabled).toBe(true);
    });
  });
});
