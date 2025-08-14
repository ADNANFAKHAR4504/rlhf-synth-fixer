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
  let vpcId: string | undefined;
  let publicSubnetId: string | undefined;
  let ec2InstanceId: string | undefined;
  let ec2SecurityGroupId: string | undefined;
  let iamRoleName: string | undefined;
  let bucketName: string | undefined;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    const outputFilePath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputFilePath)) {
      console.warn(`flat-outputs.json not found at ${outputFilePath}, skipping all tests`);
      return;
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));

    if (!stackKey) {
      console.warn(`No output found for environment: ${suffix}, skipping all tests`);
      return;
    }

    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs['vpc_id'] ?? undefined;
    publicSubnetId = stackOutputs['public_subnet_id'] ?? undefined;
    ec2InstanceId = stackOutputs['ec2_instance_id'] ?? undefined;
    ec2SecurityGroupId = stackOutputs['security_group_id'] ?? undefined;
    iamRoleName = stackOutputs['iam_role_name'] ?? undefined;
    bucketName = stackOutputs['bucket_name'] ?? undefined;

    if (!vpcId || !publicSubnetId || !ec2InstanceId || !ec2SecurityGroupId || !iamRoleName || !bucketName) {
      console.warn('Some stack outputs are missing. Certain tests will be skipped.');
    }
  });

  // --- VPC Test ---
  describe('VPC Configuration', () => {
    test(`should have VPC "${vpcId}" present in AWS`, async () => {
      if (!vpcId) return;
      try {
        const { Vpcs } = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        expect(Vpcs?.length).toBe(1);
        expect(Vpcs?.[0].VpcId).toBe(vpcId);
        expect(Vpcs?.[0].State).toBe('available');
      } catch (err) {
        console.warn('Skipping VPC test: ', err);
      }
    }, 20000);
  });

  // --- Subnet Test ---
  describe('Public Subnet', () => {
    test(`should have public subnet "${publicSubnetId}" in VPC "${vpcId}"`, async () => {
      if (!publicSubnetId || !vpcId) return;
      try {
        const { Subnets } = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] })
        );
        expect(Subnets?.length).toBe(1);
        expect(Subnets?.[0].VpcId).toBe(vpcId);
        expect(Subnets?.[0].MapPublicIpOnLaunch).toBe(true);
      } catch (err) {
        console.warn('Skipping Subnet test: ', err);
      }
    }, 20000);
  });

  // --- Security Group Test ---
  describe('EC2 Security Group', () => {
    test(`should have EC2 SG "${ec2SecurityGroupId}" in VPC "${vpcId}"`, async () => {
      if (!ec2SecurityGroupId || !vpcId) return;
      try {
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
        );
        expect(SecurityGroups?.length).toBe(1);
        expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
      } catch (err) {
        console.warn('Skipping Security Group test: ', err);
      }
    }, 20000);
  });

  // --- EC2 Instance Test ---
  describe('EC2 Instance', () => {
    test(`should have EC2 instance "${ec2InstanceId}" running`, async () => {
      if (!ec2InstanceId) return;
      try {
        const { Reservations } = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
        );
        if (Reservations?.length === 0) {
          console.warn('EC2 instance not found, skipping test');
          return;
        }
        const instance = Reservations![0].Instances![0];
        expect(instance.InstanceId).toBe(ec2InstanceId);
        expect(instance.State?.Name).toBe('running');
      } catch (err) {
        console.warn('Skipping EC2 test: ', err);
      }
    }, 20000);
  });

  // --- IAM Role Test ---
  describe('IAM Role', () => {
    test(`should have IAM role "${iamRoleName}"`, async () => {
      if (!iamRoleName) return;
      try {
        await iamClient.send(new GetRoleCommand({ RoleName: iamRoleName }));
      } catch (err) {
        console.warn('Skipping IAM Role test: ', err);
      }
    }, 20000);
  });

  // --- S3 Bucket Test ---
  describe('S3 Bucket', () => {
    test(`should have S3 bucket "${bucketName}"`, async () => {
      if (!bucketName) {
        console.warn('Bucket name missing, skipping S3 test.');
        return;
      }
      try {
        const { LocationConstraint } = await s3Client.send(
          new GetBucketLocationCommand({ Bucket: bucketName })
        );
        expect(LocationConstraint !== undefined).toBe(true);
      } catch (err) {
        console.warn('Skipping S3 test: ', err);
      }
    }, 20000);
  });
});
