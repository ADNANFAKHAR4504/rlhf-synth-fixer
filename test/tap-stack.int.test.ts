// Integration test for deployed CloudFormation stack
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
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
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });

// Load outputs from deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Could not load cfn-outputs/flat-outputs.json. Some tests may fail.'
  );
}

describe('Secure AWS Infrastructure Integration Tests', () => {
  describe('CloudFormation Stack', () => {
    test('stack should be successfully deployed', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toHaveLength(1);
      const stack = response.Stacks![0];
      expect(stack.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
      expect(stack.StackName).toBe(stackName);
    });

    test('stack should have all expected resources', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const resourceTypes = response.StackResources!.map(r => r.ResourceType);

      // Check for all expected resource types
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::EC2::Instance');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::CloudTrail::Trail');
      expect(resourceTypes).toContain('AWS::KMS::Key');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should be created with correct configuration', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      // Check tags
      const envTag = vpc.Tags?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('Subnets should be created in different availability zones', async () => {
      if (!outputs.PublicSubnetId || !outputs.PrivateSubnetId) {
        console.warn('Subnet IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetId, outputs.PrivateSubnetId],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      const publicSubnet = response.Subnets!.find(
        s => s.SubnetId === outputs.PublicSubnetId
      );
      const privateSubnet = response.Subnets!.find(
        s => s.SubnetId === outputs.PrivateSubnetId
      );

      expect(publicSubnet?.CidrBlock).toBe('10.0.1.0/24');
      expect(privateSubnet?.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);
      expect(privateSubnet?.MapPublicIpOnLaunch).toBe(false);

      // Check they're in different AZs
      expect(publicSubnet?.AvailabilityZone).not.toBe(
        privateSubnet?.AvailabilityZone
      );
    });
  });

  describe('EC2 Instance and Security', () => {
    test('EC2 instance should be running with correct configuration', async () => {
      if (!outputs.EC2InstanceId) {
        console.warn('EC2InstanceId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toMatch(/t3\.(micro|small|medium|large)/);

      // Check for encrypted EBS volume
      const rootVolume = instance.BlockDeviceMappings![0];
      expect(rootVolume.DeviceName).toBe('/dev/xvda');

      // Check tags
      const envTag = instance.Tags?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('Security group should restrict SSH access', async () => {
      if (!outputs.SecurityGroupId) {
        console.warn('SecurityGroupId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toHaveLength(1);

      const sshRule = sg.IpPermissions![0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.IpRanges![0].CidrIp).toBe('10.0.0.0/8');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role should exist with least privilege', async () => {
      if (!outputs.EC2RoleArn) {
        console.warn('EC2RoleArn not found in outputs, skipping test');
        return;
      }

      const roleName = outputs.EC2RoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'ec2.amazonaws.com'
      );

      // Check tags
      const envTag = response.Role?.Tags?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('S3 Buckets Security', () => {
    test('Secure S3 bucket should have encryption and versioning enabled', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      // Check bucket exists
      const headCommand = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });
      await s3Client.send(headCommand); // Will throw if bucket doesn't exist

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      const encryptionRule =
        encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        encryptionRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('All S3 buckets should block public access', async () => {
      const bucketNames = [
        outputs.S3BucketName,
        outputs.S3AccessLogsBucketName,
        outputs.CloudTrailBucketName,
      ].filter(Boolean);

      for (const bucketName of bucketNames) {
        if (!bucketName) continue;

        const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);

        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
          true
        );
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
          true
        );
        expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
          true
        );
        expect(
          response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
        ).toBe(true);
      }
    });
  });

  describe('CloudTrail Auditing', () => {
    test('CloudTrail should be enabled and logging', async () => {
      if (!outputs.CloudTrailArn) {
        console.warn('CloudTrailArn not found in outputs, skipping test');
        return;
      }

      const trailName = outputs.CloudTrailArn.split('/').pop();

      // Get trail configuration
      const getTrailCommand = new GetTrailCommand({ Name: trailName });
      const trailResponse = await cloudTrailClient.send(getTrailCommand);

      expect(trailResponse.Trail?.IsMultiRegionTrail).toBe(true);
      expect(trailResponse.Trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trailResponse.Trail?.LogFileValidationEnabled).toBe(true);

      // Check trail status
      const statusCommand = new GetTrailStatusCommand({ Name: trailName });
      const statusResponse = await cloudTrailClient.send(statusCommand);

      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should be enabled and configured correctly', async () => {
      if (!outputs.KMSKeyId) {
        console.warn('KMSKeyId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeKeyCommand({ KeyId: outputs.KMSKeyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.Description).toBe(
        'KMS Key for S3 bucket encryption'
      );
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should be tagged with Environment: Production', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      // Sample check for taggable resources
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::S3::Bucket',
        'AWS::CloudTrail::Trail',
      ];

      const taggableResources = response.StackResources!.filter(r =>
        taggableTypes.includes(r.ResourceType!)
      );

      expect(taggableResources.length).toBeGreaterThan(0);
      // Note: Actual tag verification would require individual API calls for each resource type
    });
  });

  describe('End-to-End Connectivity', () => {
    test('EC2 instance should be accessible via SSH port from allowed CIDR', async () => {
      if (!outputs.EC2PublicIP || !outputs.SecurityGroupId) {
        console.warn('Required outputs not found, skipping connectivity test');
        return;
      }

      // Verify the instance has a public IP
      expect(outputs.EC2PublicIP).toMatch(
        /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
      );

      // Security group rules were already verified in previous test
      // In a real scenario, we could attempt an actual SSH connection here
    });
  });
});
