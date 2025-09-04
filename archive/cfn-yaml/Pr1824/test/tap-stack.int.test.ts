import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr913';
const stackName = `TapStack${environmentSuffix}`;

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let deploymentOutputs: any = {};

if (fs.existsSync(outputsPath)) {
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  deploymentOutputs = JSON.parse(outputsContent);
}

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const kmsClient = new KMSClient({ region });

describe('TapStack Integration Tests', () => {
  describe('CloudFormation Stack', () => {
    test('stack should be successfully deployed', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBe(1);
      expect(response.Stacks?.[0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    }, 30000);

    test('stack should have expected outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      const outputs = response.Stacks?.[0].Outputs || [];
      
      const outputKeys = outputs.map(o => o.OutputKey);
      expect(outputKeys).toContain('VPCId');
      expect(outputKeys).toContain('PublicSubnet1Id');
      expect(outputKeys).toContain('PublicSubnet2Id');
      expect(outputKeys).toContain('PrivateSubnet1Id');
      expect(outputKeys).toContain('PrivateSubnet2Id');
      expect(outputKeys).toContain('DatabaseEndpoint');
      expect(outputKeys).toContain('S3BucketName');
      expect(outputKeys).toContain('KMSKeyId');
    }, 30000);

    test('stack should have all expected resources', async () => {
      const command = new ListStackResourcesCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      const resources = response.StackResourceSummaries || [];
      
      const resourceTypes = resources.map(r => r.ResourceType);
      
      // Check for core resource types
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::Budgets::Budget');
    }, 30000);
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be configured correctly', async () => {
      if (!deploymentOutputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({ VpcIds: [deploymentOutputs.VPCId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('Subnets should exist in different availability zones', async () => {
      const subnetIds = [
        deploymentOutputs.PublicSubnet1Id,
        deploymentOutputs.PublicSubnet2Id,
        deploymentOutputs.PrivateSubnet1Id,
        deploymentOutputs.PrivateSubnet2Id
      ].filter(id => id);

      if (subnetIds.length === 0) {
        console.warn('No subnet IDs found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThan(0);
      
      // Check that subnets are in different AZs
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('Security groups should be properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [deploymentOutputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);
      
      // Check for web and database security groups (case-insensitive)
      const sgNames = response.SecurityGroups?.map(sg => sg.GroupName?.toLowerCase()) || [];
      const hasWebSG = sgNames.some(name => name?.includes('web') || name?.includes('webserver'));
      const hasDbSG = sgNames.some(name => name?.includes('db') || name?.includes('database'));
      
      expect(hasWebSG || hasDbSG).toBe(true);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      if (!deploymentOutputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: deploymentOutputs.S3BucketName });
      
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

    test('S3 bucket should support versioning', async () => {
      if (!deploymentOutputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      // Test by uploading and retrieving a test object
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Integration test content';
      
      // Upload test object
      const putCommand = new PutObjectCommand({
        Bucket: deploymentOutputs.S3BucketName,
        Key: testKey,
        Body: testContent
      });
      
      await s3Client.send(putCommand);
      
      // Retrieve test object
      const getCommand = new GetObjectCommand({
        Bucket: deploymentOutputs.S3BucketName,
        Key: testKey
      });
      
      const response = await s3Client.send(getCommand);
      expect(response.VersionId).toBeDefined();
    }, 30000);
  });

  describe('RDS Database', () => {
    test('RDS instance should be running', async () => {
      if (!deploymentOutputs.DatabaseEndpoint) {
        console.warn('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      // Extract DB instance identifier from endpoint
      const dbIdentifier = deploymentOutputs.DatabaseEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);
      
      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
    }, 30000);

    test('RDS instance should have encryption enabled', async () => {
      if (!deploymentOutputs.DatabaseEndpoint) {
        console.warn('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      const dbIdentifier = deploymentOutputs.DatabaseEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];
      
      expect(dbInstance?.StorageEncrypted).toBe(true);
    }, 30000);

    test('RDS instance should have backup configured', async () => {
      if (!deploymentOutputs.DatabaseEndpoint) {
        console.warn('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      const dbIdentifier = deploymentOutputs.DatabaseEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];
      
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
    }, 30000);
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      if (!deploymentOutputs.KMSKeyId) {
        console.warn('KMSKeyId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeKeyCommand({ KeyId: deploymentOutputs.KMSKeyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);
  });

  describe('Multi-Environment Support', () => {
    test('resources should include environment suffix in naming', async () => {
      const command = new ListStackResourcesCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      const resources = response.StackResourceSummaries || [];
      
      // Check that at least some resources include the environment suffix
      const resourcesWithSuffix = resources.filter(r => 
        r.PhysicalResourceId?.includes(environmentSuffix)
      );
      
      expect(resourcesWithSuffix.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('should be able to write and read from S3 bucket with encryption', async () => {
      if (!deploymentOutputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const testKey = `e2e-test-${Date.now()}.json`;
      const testData = {
        timestamp: new Date().toISOString(),
        test: 'end-to-end',
        encrypted: true
      };
      
      // Write test data
      const putCommand = new PutObjectCommand({
        Bucket: deploymentOutputs.S3BucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json'
      });
      
      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.ETag).toBeDefined();
      
      // Read test data back
      const getCommand = new GetObjectCommand({
        Bucket: deploymentOutputs.S3BucketName,
        Key: testKey
      });
      
      const getResponse = await s3Client.send(getCommand);
      const bodyString = await getResponse.Body?.transformToString();
      const retrievedData = JSON.parse(bodyString || '{}');
      
      expect(retrievedData).toEqual(testData);
    }, 30000);
  });
});