import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetBucketLocationCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

import { GetBucketVersioningCommand } from '@aws-sdk/client-s3';

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe('TAP Stack Core AWS Infrastructure', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let stateBucketName: string;
  let ec2RoleName: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error(
        'ENVIRONMENT_SUFFIX environment variable is not set.'
      );
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
    publicSubnetIds = stackOutputs['public_subnet_ids'];
    privateSubnetIds = stackOutputs['private_subnet_ids'];
    stateBucketName = stackOutputs['state_bucket_name'];
    ec2RoleName = stackOutputs['ec2_role_name'];

    if (
      !vpcId ||
      !publicSubnetIds ||
      !privateSubnetIds ||
      !stateBucketName ||
      !ec2RoleName
    ) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // VPC Test
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

  // Subnets Test
  describe('Subnets Configuration', () => {
    test('public subnets should exist in the VPC', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(publicSubnetIds.length);
      Subnets?.forEach(sn => {
        expect(sn.VpcId).toBe(vpcId);
        expect(sn.MapPublicIpOnLaunch).toBe(true);
      });
    }, 20000);

    test('private subnets should exist in the VPC', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(Subnets?.length).toBe(privateSubnetIds.length);
      Subnets?.forEach(sn => {
        expect(sn.VpcId).toBe(vpcId);
        expect(sn.MapPublicIpOnLaunch).toBe(false);
      });
    }, 20000);
  });

  // S3 Bucket Test
  describe('S3 State Bucket', () => {
    test(`should have state bucket "${stateBucketName}" in correct region`, async () => {
      const { LocationConstraint } = await s3Client.send(
        new GetBucketLocationCommand({ Bucket: stateBucketName })
      );
      const expectedRegion = LocationConstraint || 'us-east-1';
      expect(expectedRegion).toBe(awsRegion);
    }, 20000);

    test(`should have versioning enabled on "${stateBucketName}"`, async () => {
    const { Status } = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: stateBucketName })
    );
    expect(Status).toBe('Enabled');
  }, 20000);
});
  });

