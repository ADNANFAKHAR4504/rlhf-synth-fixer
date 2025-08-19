import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });

describe('TAP Stack AWS Infrastructure', () => {
  let vpcId: string;
  let logBucketName: string;
  let ec2InstanceId: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs['VpcId'];
    logBucketName = stackOutputs['LoggingBucketName'];
    ec2InstanceId = stackOutputs['Ec2InstanceId'];

    if (!vpcId || !logBucketName || !ec2InstanceId) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // VPC Test
  describe('VPC Configuration', () => {
    test(`should have VPC "${vpcId}" present in AWS`, async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 20000);
  });

  // S3 Logging Bucket Test
  describe('S3 Logging Bucket', () => {
    test(`should have logging bucket "${logBucketName}" in correct region`, async () => {
      const { LocationConstraint } = await s3Client.send(new GetBucketLocationCommand({ Bucket: logBucketName }));
      const expectedRegion = LocationConstraint || 'us-east-1';
      expect(expectedRegion).toBe(awsRegion);
    }, 20000);
  });

  // EC2 Instance Test
  describe('EC2 Instance', () => {
    test(`should have EC2 instance "${ec2InstanceId}" running in the VPC`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.VpcId).toBe(vpcId);
      expect(instance?.State?.Name).toBe('running');
    }, 30000);
  });
});