import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const region = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const kmsClient = new KMSClient({ region });

describe('TapStack Integration Tests', () => {
  
  describe('Infrastructure Validation', () => {
    test('should validate outputs are present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnetAId).toBeDefined();
      expect(outputs.PublicSubnetBId).toBeDefined();
      expect(outputs.PrivateSubnetAId).toBeDefined();
      expect(outputs.PrivateSubnetBId).toBeDefined();
      expect(outputs.ApplicationDataBucketName).toBeDefined();
      expect(outputs.LoggingBucketName).toBeDefined();
      expect(outputs.S3KMSKeyId).toBeDefined();
      expect(outputs.S3KMSKeyArn).toBeDefined();
      expect(outputs.WebServerInstanceId).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSPort).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should validate VPC exists and has correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test('should validate public subnets exist and have correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetAId, outputs.PublicSubnetBId]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should validate private subnets exist and have correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnetAId, outputs.PrivateSubnetBId]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('EC2 Instance', () => {
    test('should validate web server instance exists and is running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.InstanceId).toBe(outputs.WebServerInstanceId);
      expect(instance.State!.Name).toBe('running');
      expect(instance.InstanceType).toMatch(/^t3\.|^m5\./);
    });

    test('should validate security groups are properly configured', async () => {
      // First get the instance to find its security groups
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const securityGroupIds = instance.SecurityGroups!.map(sg => sg.GroupId!);

      // Describe the security groups
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      
      expect(sgResponse.SecurityGroups!.length).toBeGreaterThan(0);
      
      // Check if there's a web server security group with HTTP/HTTPS rules
      const webServerSG = sgResponse.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('WebServer') || 
        sg.Description?.includes('web server')
      );
      
      if (webServerSG) {
        const httpRule = webServerSG.IpPermissions!.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        const httpsRule = webServerSG.IpPermissions!.find(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      }
    });
  });

  describe('S3 Buckets', () => {
    test('should validate application data bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ApplicationDataBucketName
      });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should validate application data bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ApplicationDataBucketName
      });
      
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
    });

    test('should validate logging bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.LoggingBucketName
      });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should validate buckets have versioning enabled', async () => {
      const buckets = [outputs.ApplicationDataBucketName, outputs.LoggingBucketName];
      
      for (const bucket of buckets) {
        const command = new GetBucketVersioningCommand({
          Bucket: bucket
        });
        
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      }
    });
  });

  describe('KMS Key', () => {
    test('should validate KMS key exists and is enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.S3KMSKeyId
      });
      
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(outputs.S3KMSKeyId);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('should validate KMS key ARN matches expected format', () => {
      expect(outputs.S3KMSKeyArn).toMatch(
        /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]{36}$/
      );
      expect(outputs.S3KMSKeyArn).toContain(outputs.S3KMSKeyId);
    });
  });

  describe('Lambda Function', () => {
    test('should validate Lambda function exists and is active', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await lambdaClient.send(command);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionArn).toBe(outputs.LambdaFunctionArn);
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toMatch(/^python3\.|^nodejs/);
    });

    test('should validate Lambda function has correct environment variables', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await lambdaClient.send(command);
      
      expect(response.Configuration!.Environment).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('should validate RDS instance exists and is available', async () => {
      const dbInstanceId = outputs.RDSEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('should validate RDS endpoint and port are correct', async () => {
      const dbInstanceId = outputs.RDSEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Endpoint!.Address).toBe(outputs.RDSEndpoint);
      expect(dbInstance.Endpoint!.Port!.toString()).toBe(outputs.RDSPort);
    });

    test('should validate RDS security and backup configuration', async () => {
      const dbInstanceId = outputs.RDSEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.VpcSecurityGroups).toBeDefined();
      expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    test('should validate resources have proper tags', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);
    });
  });

  describe('Cross-Resource Connectivity', () => {
    test('should validate resources are in the same VPC', async () => {
      // Check subnets are in the correct VPC
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnetAId,
          outputs.PublicSubnetBId,
          outputs.PrivateSubnetAId,
          outputs.PrivateSubnetBId
        ]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });

      // Check EC2 instance is in the correct VPC
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId]
      });
      
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      
      expect(instance.VpcId).toBe(outputs.VPCId);
    });
  });
});
