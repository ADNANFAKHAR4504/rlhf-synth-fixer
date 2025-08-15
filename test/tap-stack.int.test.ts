// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const awsRegion = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const stackName = 'TestIntegrationStack'; // Should match the stack name used for deployment

describe('TapStack Infrastructure Integration Tests', () => {
  let outputs: any;

  // --- Test Setup: Read Deployed Stack Outputs ---
  beforeAll(() => {
    // This test expects that `cdktf deploy` has been run and the outputs are available.
    const outputFilePath = path.join(
      __dirname,
      '..',
      'cdktf.out',
      'stacks',
      stackName,
      'outputs.json'
    );

    if (!fs.existsSync(outputFilePath)) {
      throw new Error(
        `CDKTF output file not found at ${outputFilePath}. Please run 'cdktf deploy'.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));

    // Verify that all required output keys are present
    const requiredKeys = ['VpcId', 'PublicSubnetIds', 'PrivateSubnetIds', 'Ec2InstanceId', 'S3BucketName'];
    for (const key of requiredKeys) {
      if (!outputs[key]) {
        throw new Error(`Missing required stack output: ${key}`);
      }
    }
  });

  // --- VPC and EC2 Resource Verification ---
  describe('VPC and EC2 Resources', () => {
    test('VPC should exist and have correct tags', async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VpcId.value] }));
      expect(Vpcs?.length).toBe(1);
      const vpc = Vpcs?.[0];
      const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('should have two public subnets', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: outputs.PublicSubnetIds.value }));
      expect(Subnets?.length).toBe(2);
    });

    test('should have two private subnets', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: outputs.PrivateSubnetIds.value }));
      expect(Subnets?.length).toBe(2);
    });

    test('EC2 instance should exist and be in a valid state', async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [outputs.Ec2InstanceId.value] }));
      expect(Reservations?.length).toBeGreaterThan(0);
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      // A running instance is ideal, but pending is also a valid state during provisioning.
      expect(['pending', 'running']).toContain(instance?.State?.Name);
    }, 30000); // Increased timeout for instance state check

    test('Security group should have correct ingress rules', async () => {
        const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [outputs.Ec2InstanceId.value] }));
        const securityGroupIds = Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.map(sg => sg.GroupId as string);
        expect(securityGroupIds?.length).toBe(1);
  
        const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: securityGroupIds }));
        const sg = SecurityGroups?.[0];
        expect(sg).toBeDefined();
        expect(sg?.IpPermissions?.length).toBe(3); // HTTP, HTTPS, SSH
  
        // Verify SSH rule is restricted
        const sshRule = sg?.IpPermissions?.find(rule => rule.FromPort === 22);
        expect(sshRule).toBeDefined();
        expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('203.0.113.0/24');
  
        // Verify HTTP rule is open
        const httpRule = sg?.IpPermissions?.find(rule => rule.FromPort === 80);
        expect(httpRule).toBeDefined();
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      });
  });

  // --- S3 Resource Verification ---
  describe('S3 Bucket', () => {
    test('S3 bucket should exist', async () => {
      // HeadBucket will throw an error if the bucket doesn't exist
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName.value }))).resolves.toBeDefined();
    });

    test('S3 bucket should have public access blocked', async () => {
      const { PublicAccessBlockConfiguration } = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: outputs.S3BucketName.value }));
      expect(PublicAccessBlockConfiguration).toBeDefined();
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });
});
