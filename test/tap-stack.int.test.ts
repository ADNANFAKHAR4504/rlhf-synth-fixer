import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { S3Client, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'us-east-1';

const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });

describe('TAP Stack Core AWS Infrastructure', () => {
  let vpcId: string;
  let publicSubnetId: string;
  let ec2InstanceId: string;
  let ec2SecurityGroupId: string;
  let iamRoleName: string;
  let bucketName: string;

  beforeAll(() => {
  const suffix = process.env.ENVIRONMENT_SUFFIX;
  if (!suffix) {
    throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
  }

  const outputFilePath = path.join(
    __dirname,
    '..',
    'cfn-outputs',
    'flat-outputs.json'
  );
  if (!fs.existsSync(outputFilePath)) {
    throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
  }

  const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
  const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
  if (!stackKey) {
    throw new Error(`No output found for environment: ${suffix}`);
  }

  const stackOutputs = outputs[stackKey];
  vpcId = stackOutputs['vpc_id'];
  publicSubnetId = stackOutputs['public_subnet_id'];
  ec2InstanceId = stackOutputs['ec2_instance_id'];
  ec2SecurityGroupId = stackOutputs['security_group_id'];
  iamRoleName = stackOutputs['iam_role_name'];
  bucketName = stackOutputs['bucket_name'];

  if (!vpcId || !publicSubnetId || !ec2InstanceId || !ec2SecurityGroupId || !iamRoleName || !bucketName) {
    throw new Error('Missing one or more required stack outputs.');
  }
});

  // --- VPC Test ---
  describe('VPC Configuration', () => {
    test(`should have VPC "${vpcId}" present in AWS`, async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 20000);
  });

  // --- Subnet Test ---
  describe('Public Subnet', () => {
    test(`should have public subnet "${publicSubnetId}" in VPC "${vpcId}"`, async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] })
      );
      expect(Subnets?.length).toBe(1);
      expect(Subnets?.[0].VpcId).toBe(vpcId);
      expect(Subnets?.[0].MapPublicIpOnLaunch).toBe(true);
    }, 20000);
  });

  // --- Security Group Test ---
  describe('EC2 Security Group', () => {
    test(`should have EC2 SG "${ec2SecurityGroupId}" in VPC "${vpcId}"`, async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);
      expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
    }, 20000);
  });

  // --- EC2 Instance Test ---
  describe('EC2 Instance', () => {
    test(`should have EC2 instance "${ec2InstanceId}" running`, async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      expect(Reservations?.length).toBe(1);
      const instance = Reservations![0].Instances![0];
      expect(instance.InstanceId).toBe(ec2InstanceId);
      expect(instance.State?.Name).toBe('running');
    }, 20000);
  });

  // --- IAM Role Test ---
  describe('IAM Role', () => {
    test(`should have IAM role "${iamRoleName}"`, async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: iamRoleName })
      );
    }, 20000);
  });

  // --- S3 Bucket Test ---
  describe('S3 Bucket', () => {
    test(`should have S3 bucket "${bucketName}"`, async () => {
      const { LocationConstraint } = await s3Client.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect(LocationConstraint !== undefined).toBe(true);
    }, 20000);
  });
});
