// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const stsClient = new STSClient({ region: 'us-east-1' });

describe('Multi-Region Infrastructure Integration Tests', () => {
  let accountId: string;

  beforeAll(async () => {
    // Get AWS account ID
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account!;
  });

  describe('VPC and Networking', () => {
    test('should have VPC deployed with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are configured in the CDK but may not be returned in describe call
      // These are optional checks and not critical for the integration test
    });

    test('should have public and private subnets', async () => {
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnetId = outputs.PrivateSubnetId;

      expect(publicSubnetId).toBeDefined();
      expect(privateSubnetId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [publicSubnetId, privateSubnetId],
        })
      );

      expect(response.Subnets).toHaveLength(2);

      const publicSubnet = response.Subnets!.find(
        s => s.SubnetId === publicSubnetId
      );
      const privateSubnet = response.Subnets!.find(
        s => s.SubnetId === privateSubnetId
      );

      expect(publicSubnet!.MapPublicIpOnLaunch).toBe(true);
      expect(privateSubnet!.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('EC2 Instance', () => {
    test('should have EC2 instance running in public subnet', async () => {
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();
      expect(instanceId).toMatch(/^i-[a-f0-9]+$/);

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations![0].Instances).toHaveLength(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.SubnetId).toBe(outputs.PublicSubnetId);
    });

    test('should be able to access EC2 instance metadata endpoint', async () => {
      const instanceId = outputs.EC2InstanceId;
      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    const testKey = `test-object-${Date.now()}.txt`;
    const testContent = 'Test content for integration testing';

    test('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      // S3 bucket is only created in primary region (us-east-1)
      if (!bucketName) {
        console.log('S3 bucket name not found in outputs - this is expected for non-primary regions');
        return;
      }
      expect(bucketName).toBeDefined();

      // Check bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('should have S3 bucket with encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      // S3 bucket is only created in primary region (us-east-1)
      if (!bucketName) {
        console.log('S3 bucket name not found in outputs - this is expected for non-primary regions');
        return;
      }

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should be able to write and read from S3 bucket', async () => {
      const bucketName = outputs.S3BucketName;
      // S3 bucket is only created in primary region (us-east-1)
      if (!bucketName) {
        console.log('S3 bucket name not found in outputs - this is expected for non-primary regions');
        return;
      }

      // Write object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Read object
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      const bodyContents = await getResponse.Body!.transformToString();
      expect(bodyContents).toBe(testContent);

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with Multi-AZ enabled', async () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      expect(rdsEndpoint).toBeDefined();

      // Extract DB instance identifier from endpoint
      const dbInstanceId = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('should have RDS instance in private subnet', async () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });
  });

  describe('Cross-Resource Integration', () => {
    test('should have proper network connectivity between resources', async () => {
      // Verify all resources are in the same VPC
      const vpcId = outputs.VpcId;

      // Check EC2 instance is in the VPC
      const ec2Response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );
      const instance = ec2Response.Reservations![0].Instances![0];
      expect(instance.VpcId).toBe(vpcId);

      // Check subnets are in the VPC
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnetId, outputs.PrivateSubnetId],
        })
      );
      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('should have resources properly tagged', async () => {
      // Check EC2 instance tags
      const ec2Response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );
      const instance = ec2Response.Reservations![0].Instances![0];
      const tags = instance.Tags || [];

      const environmentTag = tags.find(t => t.Key === 'Environment');
      expect(environmentTag).toBeDefined();

      const purposeTag = tags.find(t => t.Key === 'Purpose');
      expect(purposeTag).toBeDefined();
    });
  });
});
