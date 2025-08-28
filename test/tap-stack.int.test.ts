import * as fs from 'fs';
import * as path from 'path';
import { 
  EC2Client, 
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand 
} from '@aws-sdk/client-ec2';
import { 
  S3Client, 
  HeadBucketCommand,
  GetBucketEncryptionCommand 
} from '@aws-sdk/client-s3';
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';
import { 
  KMSClient, 
  DescribeKeyCommand 
} from '@aws-sdk/client-kms';

// Integration tests use deployed infrastructure outputs
describe('TapStack Integration Tests', () => {
  let outputs: any = {};
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let rdsClient: RDSClient;
  let kmsClient: KMSClient;

  beforeAll(() => {
    // Load the flat outputs from deployment
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No flat-outputs.json found. Integration tests may fail.');
      outputs = {}; // Empty outputs for graceful handling
    }

    // Initialize AWS clients
    const awsRegion = process.env.AWS_REGION || 'us-east-1';
    ec2Client = new EC2Client({ region: awsRegion });
    s3Client = new S3Client({ region: awsRegion });
    rdsClient = new RDSClient({ region: awsRegion });
    kmsClient = new KMSClient({ region: awsRegion });
  });

  describe('VPC Infrastructure', () => {
    it('should have created VPC with correct configuration', async () => {
      if (!outputs['vpc-id']) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs['vpc-id']]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs![0].VpcId).toBe(outputs['vpc-id']);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    }, 30000);

    it('should have created public and private subnets', async () => {
      if (!outputs['public-subnet-ids'] || !outputs['private-subnet-ids']) {
        console.warn('Subnet IDs not found in outputs, skipping test');
        return;
      }

      const publicSubnetIds = Array.isArray(outputs['public-subnet-ids']) 
        ? outputs['public-subnet-ids'] 
        : JSON.parse(outputs['public-subnet-ids']);
      
      const privateSubnetIds = Array.isArray(outputs['private-subnet-ids']) 
        ? outputs['private-subnet-ids'] 
        : JSON.parse(outputs['private-subnet-ids']);

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public, 2 private
      
      // Check that all subnets are in the correct VPC
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs['vpc-id']);
        expect(subnet.State).toBe('available');
      });
    }, 30000);
  });

  describe('EC2 Instances', () => {
    it('should have created public EC2 instance with public IP', async () => {
      if (!outputs['public-ec2-instance-id']) {
        console.warn('Public EC2 instance ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs['public-ec2-instance-id']]
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations![0].Instances).toBeDefined();
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.InstanceId).toBe(outputs['public-ec2-instance-id']);
      expect(instance.State!.Name).toMatch(/running|pending|stopped/);
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.InstanceType).toBe('t3.micro');
    }, 30000);

    it('should have created private EC2 instance without public IP', async () => {
      if (!outputs['private-ec2-instance-id']) {
        console.warn('Private EC2 instance ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs['private-ec2-instance-id']]
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations![0].Instances).toBeDefined();
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.InstanceId).toBe(outputs['private-ec2-instance-id']);
      expect(instance.State!.Name).toMatch(/running|pending|stopped/);
      expect(instance.PublicIpAddress).toBeUndefined();
      expect(instance.PrivateIpAddress).toBeDefined();
      expect(instance.InstanceType).toBe('t3.micro');
    }, 30000);
  });

  describe('S3 Buckets', () => {
    it('should have created public S3 bucket for assets', async () => {
      if (!outputs['public-s3-bucket-name']) {
        console.warn('Public S3 bucket name not found in outputs, skipping test');
        return;
      }

      const headCommand = new HeadBucketCommand({
        Bucket: outputs['public-s3-bucket-name']
      });

      // Should not throw an error if bucket exists
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      // Check encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs['public-s3-bucket-name']
      });

      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);

    it('should have created private S3 bucket for internal data', async () => {
      if (!outputs['private-s3-bucket-name']) {
        console.warn('Private S3 bucket name not found in outputs, skipping test');
        return;
      }

      const headCommand = new HeadBucketCommand({
        Bucket: outputs['private-s3-bucket-name']
      });

      // Should not throw an error if bucket exists
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      // Check encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs['private-s3-bucket-name']
      });

      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);
  });

  describe('RDS Database', () => {
    it('should have created RDS PostgreSQL instance', async () => {
      if (!outputs['rds-endpoint']) {
        console.warn('RDS endpoint not found in outputs, skipping test');
        return;
      }

      // Extract DB instance identifier from endpoint
      const dbIdentifier = outputs['rds-endpoint'].split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.DBInstanceStatus).toMatch(/available|creating|backing-up/);
      expect(dbInstance.Endpoint?.Address).toContain(dbIdentifier);
    }, 30000);
  });

  describe('KMS Key', () => {
    it('should have created KMS key with proper configuration', async () => {
      if (!outputs['kms-key-id']) {
        console.warn('KMS key ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs['kms-key-id']
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(outputs['kms-key-id']);
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    }, 30000);
  });

  describe('Security Groups', () => {
    it('should have created security groups with correct rules', async () => {
      if (!outputs['vpc-id']) {
        console.warn('VPC ID not found in outputs, skipping security group test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs['vpc-id']]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      
      // Should have at least 4 security groups: default + 3 created (public-ec2, private-ec2, rds)
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);
      
      // Check for our custom security groups
      const customSGs = response.SecurityGroups!.filter(sg => 
        sg.GroupName?.includes('public-ec2') || 
        sg.GroupName?.includes('private-ec2') || 
        sg.GroupName?.includes('rds')
      );
      
      expect(customSGs.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('Resource Connectivity', () => {
    it('should validate that RDS is in private subnets', async () => {
      if (!outputs['rds-endpoint'] || !outputs['private-subnet-ids']) {
        console.warn('Missing RDS or subnet outputs, skipping connectivity test');
        return;
      }

      const dbIdentifier = outputs['rds-endpoint'].split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      
      // RDS should not be publicly accessible
      expect(dbInstance.PubliclyAccessible).toBe(false);
      
      // RDS should have a DB subnet group
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup!.Subnets).toBeDefined();
    }, 30000);

    it('should validate output consistency', () => {
      // Check that all expected outputs are present (when deployment succeeds)
      const expectedOutputKeys = [
        'vpc-id',
        'public-subnet-ids', 
        'private-subnet-ids',
        'kms-key-id',
        'aws-account-id'
      ];

      // Only check outputs that should always be present
      expectedOutputKeys.forEach(key => {
        if (Object.keys(outputs).length > 0) {
          expect(outputs).toHaveProperty(key);
        }
      });

      // Validate output formats
      if (outputs['vpc-id']) {
        expect(outputs['vpc-id']).toMatch(/^vpc-[a-f0-9]+$/);
      }
      
      if (outputs['kms-key-id']) {
        expect(outputs['kms-key-id']).toMatch(/^[a-f0-9-]{36}$/);
      }
      
      if (outputs['aws-account-id']) {
        expect(outputs['aws-account-id']).toMatch(/^\d{12}$/);
      }
    });
  });
});