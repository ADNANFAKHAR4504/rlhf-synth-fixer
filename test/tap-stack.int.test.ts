import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeAddressesCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-west-2';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });

describe('Basic Dev Environment Integration Tests', () => {
  test('S3 Bucket should exist and have encryption enabled', async () => {
    const bucketName = outputs.S3BucketName;
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));

    const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
  });

  test('EC2 Instance should exist and be running', async () => {
    const res = await ec2.send(new DescribeInstancesCommand({
      InstanceIds: [outputs.EC2InstanceId],
    }));

    const instance = res.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe('running');
    expect(instance?.KeyName).toBe(outputs.KeyPairName);
  });

  test('Security Group should allow SSH (port 22) and HTTP (port 80) from 0.0.0.0/0', async () => {
    const res = await ec2.send(new DescribeSecurityGroupsCommand({
      GroupIds: [outputs.WebSecurityGroupId],
    }));

    const group = res.SecurityGroups?.[0];
    expect(group).toBeDefined();

    if (!group) throw new Error('Security Group not found');

    const sshRule = group.IpPermissions?.find(
      (p) => p?.FromPort === 22 && p?.ToPort === 22 && p?.IpProtocol === 'tcp'
    );

    const httpRule = group.IpPermissions?.find(
      (p) => p?.FromPort === 80 && p?.ToPort === 80 && p?.IpProtocol === 'tcp'
    );

    expect(sshRule?.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0')).toBe(true);
    expect(httpRule?.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0')).toBe(true);
  });

  test('Elastic IP should be associated with the EC2 instance', async () => {
    const res = await ec2.send(new DescribeAddressesCommand({
      AllocationIds: [outputs.ElasticIPAllocationId],
    }));

    const address = res.Addresses?.[0];
    expect(address?.InstanceId).toBe(outputs.EC2InstanceId);
    expect(address?.PublicIp).toBe(outputs.EC2InstancePublicIP);
  });

  test('All required outputs are present', () => {
    const requiredKeys = [
      'S3BucketName',
      'EC2InstanceId',
      'EC2InstancePublicIP',
      'ElasticIPAllocationId',
      'WebSecurityGroupId',
      'KeyPairName',
    ];

    requiredKeys.forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('S3 bucket name should follow naming pattern', () => {
    expect(outputs.S3BucketName).toMatch(/^sample-bucket-dev-\d{12}$/);
  });
});
