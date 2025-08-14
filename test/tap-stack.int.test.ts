import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';

const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe('TAP Stack AWS Infrastructure', () => {
  let vpcId: string;
  let publicSubnetId: string;
  let bucketName: string;
  let iamRoleName: string;
  let securityGroupId: string;
  let ec2InstanceId: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) throw new Error(`flat-outputs.json not found at ${outputFilePath}`);

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) throw new Error(`No output found for environment: ${suffix}`);

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs['vpc_id'];
    publicSubnetId = stackOutputs['public_subnet_id'];
    bucketName = stackOutputs['bucket_name'];
    iamRoleName = stackOutputs['iam_role_name'];
    securityGroupId = stackOutputs['security_group_id'];
    ec2InstanceId = stackOutputs['ec2_instance_id'];

    if (!vpcId || !publicSubnetId || !bucketName || !iamRoleName || !securityGroupId || !ec2InstanceId) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // VPC Test
  describe('VPC Configuration', () => {
    test(`VPC "${vpcId}" should exist in AWS`, async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 20000);
  });

  // Subnet Test
  describe('Subnet Configuration', () => {
    test(`Public subnet "${publicSubnetId}" should exist and map public IPs`, async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
      expect(Subnets?.length).toBe(1);
      expect(Subnets?.[0].VpcId).toBe(vpcId);
      expect(Subnets?.[0].MapPublicIpOnLaunch).toBe(true);
    }, 20000);
  });

  // S3 Bucket Test
  describe('S3 Bucket', () => {
    test(`Bucket "${bucketName}" should exist in correct region`, async () => {
      const { LocationConstraint } = await s3Client.send(new GetBucketLocationCommand({ Bucket: bucketName }));
      const bucketRegion = LocationConstraint || 'us-east-1';
      expect(bucketRegion).toBe(awsRegion);
    }, 20000);

    test(`Bucket "${bucketName}" should have versioning enabled`, async () => {
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(Status).toBe('Enabled');
    }, 20000);
  });

  // IAM Role Test
  describe('IAM Role', () => {
    test(`IAM Role "${iamRoleName}" should exist`, async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: iamRoleName }));
      expect(Role?.RoleName).toBe(iamRoleName);
    }, 20000);
  });

  // Security Group Test
  describe('Security Group', () => {
    test(`Security Group "${securityGroupId}" should exist in the VPC`, async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      expect(SecurityGroups?.length).toBe(1);
      expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
    }, 20000);
  });

  // EC2 Instance Test
  describe('EC2 Instance', () => {
    test(`EC2 Instance "${ec2InstanceId}" should exist and be running`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
      expect(Reservations?.length).toBeGreaterThan(0);
      const instance = Reservations?.[0].Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.State?.Name).toBe('running');
    }, 30000);
  });
});
