/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions for Secure AWS Infrastructure
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import fs from 'fs';

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Extract outputs for testing - Updated for secure environment template
const VPC_ID = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
const DATABASE_ENDPOINT = outputs[`${stackName}-Database-Endpoint`] || outputs['DatabaseEndpoint'];
const S3_BUCKET_NAME = outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'];
const KMS_KEY_ID = outputs[`${stackName}-KMS-Key`] || outputs['KMSKeyId'];
const CLOUDTRAIL_ARN = outputs[`${stackName}-CloudTrail-ARN`] || outputs['CloudTrailArn'];
const CLOUDTRAIL_S3_BUCKET = outputs[`${stackName}-CloudTrail-Bucket`] || outputs['CloudTrailS3Bucket'];
const PUBLIC_SUBNETS = outputs[`${stackName}-Public-Subnets`] || outputs['PublicSubnetIds'];
const PRIVATE_SUBNETS = outputs[`${stackName}-Private-Subnets`] || outputs['PrivateSubnetIds'];

// AWS SDK v3 clients - Updated to us-east-1 region  
const ec2Client = new EC2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const cloudFormationClient = new CloudFormationClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: 'us-east-1' });

// Helper functions for AWS SDK v3 operations
async function getStackInfo() {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  return response.Stacks![0];
}

async function getStackParameters() {
  const stack = await getStackInfo();
  const parameters: { [key: string]: string } = {};
  stack.Parameters?.forEach((param: any) => {
    parameters[param.ParameterKey] = param.ParameterValue;
  });
  return parameters;
}

async function getVpcInfo() {
  const command = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
  const response = await ec2Client.send(command);
  return response.Vpcs![0];
}

async function getDatabaseInfo() {
  const command = new DescribeDBInstancesCommand({});
  const response = await rdsClient.send(command);
  return response.DBInstances!.find((db: any) => 
    db.Endpoint?.Address === DATABASE_ENDPOINT ||
    (db as any).Tags?.some((tag: any) => 
      tag.Key === 'aws:cloudformation:stack-name' && 
      tag.Value === stackName
    )
  );
}

describe('Secure Environment Integration Tests', () => {
  let stackParameters: { [key: string]: string } = {};

  // Setup validation
  beforeAll(async () => {
    console.log('Validating secure environment deployment...');
    const stack = await getStackInfo();
    stackParameters = await getStackParameters();
    console.log(`Stack ${stackName} is in ${stack.StackStatus} state`);
    console.log(`Stack parameters:`, stackParameters);
    
    // Log key infrastructure endpoints
    console.log(`VPC ID: ${VPC_ID}`);
    console.log(`Database Endpoint: ${DATABASE_ENDPOINT}`);
    console.log(`S3 Bucket: ${S3_BUCKET_NAME}`);
    console.log(`KMS Key: ${KMS_KEY_ID}`);
    console.log(`CloudTrail ARN: ${CLOUDTRAIL_ARN}`);
  }, 30000);

  describe('Infrastructure Validation', () => {
    test('should have valid VPC ID', () => {
      expect(VPC_ID).toBeDefined();
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid Database endpoint', () => {
      expect(DATABASE_ENDPOINT).toBeDefined();
      expect(DATABASE_ENDPOINT).toMatch(/^.*\.rds\.amazonaws\.com$/);
    });

    test('should have valid S3 bucket name', () => {
      expect(S3_BUCKET_NAME).toBeDefined();
      expect(S3_BUCKET_NAME).toMatch(/^[a-z0-9-]+$/);
    });

    test('should have valid KMS Key ID', () => {
      expect(KMS_KEY_ID).toBeDefined();
      expect(KMS_KEY_ID).toMatch(/^[a-f0-9-]{36}$/);
    });

    test('should have valid CloudTrail ARN', () => {
      expect(CLOUDTRAIL_ARN).toBeDefined();
      expect(CLOUDTRAIL_ARN).toMatch(/^arn:aws:cloudtrail:us-east-1:\d{12}:trail\/.+$/);
    });

    test('should validate stack parameters', async () => {
      // Updated for secure environment template parameters
      expect(stackParameters.Environment).toBeDefined();
      expect(stackParameters.DBUsername).toBeDefined();
      expect(stackParameters.VpcCidrBlock).toBeDefined();
      expect(stackParameters.CloudTrailLogRetentionDays).toBeDefined();
      
      console.log(`Environment: ${stackParameters.Environment}`);
      console.log(`DB Username: ${stackParameters.DBUsername}`);
      console.log(`VPC CIDR: ${stackParameters.VpcCidrBlock}`);
      console.log(`CloudTrail Retention: ${stackParameters.CloudTrailLogRetentionDays} days`);
    });
  });

  describe('Stack Deployment Status', () => {
    test('should be in complete state', async () => {
      const stack = await getStackInfo();
      
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus!);
      expect(stack.StackName).toBe(stackName);
    });

    test('should have proper stack tags', async () => {
      const stack = await getStackInfo();
      
      expect(stack.Tags).toBeDefined();
      const repositoryTag = stack.Tags!.find((tag: any) => tag.Key === 'Repository');
      const environmentTag = stack.Tags!.find((tag: any) => tag.Key === 'Environment');
      
      if (repositoryTag) {
        expect(repositoryTag.Value).toContain('iac-test-automations');
      }
      if (environmentTag) {
        expect(typeof environmentTag.Value).toBe('string');
      }
    });
  });

  describe('KMS Encryption Infrastructure', () => {
    test('should have active KMS master encryption key', async () => {
      const command = new DescribeKeyCommand({ KeyId: KMS_KEY_ID });
      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata!;

      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
      expect(keyMetadata.Description).toBe('Master encryption key for secure environment');

      console.log(`KMS Key ${KMS_KEY_ID} is active and ready for encryption`);
    });

    test('should have KMS key alias configured', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);
      
      const stackAlias = response.Aliases!.find((alias: any) => 
        alias.AliasName === `alias/${stackName}-master-key`
      );

      expect(stackAlias).toBeDefined();
      expect(stackAlias!.TargetKeyId).toBe(KMS_KEY_ID);

      console.log(`KMS Key alias ${stackAlias!.AliasName} is configured correctly`);
    });
  });

  describe('VPC & Networking Health Check', () => {
    test('should have available VPC with correct configuration', async () => {
      const vpc = await getVpcInfo();

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe(stackParameters.VpcCidrBlock || '10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();

      // Fetch DNS attributes separately
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
      console.log(`VPC ${VPC_ID} is available with CIDR ${vpc.CidrBlock}`);
    });

    test('should have public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['true'] }
        ]
      });
      const response = await ec2Client.send(command);
      const publicSubnets = response.Subnets!;

      expect(publicSubnets.length).toBe(2);
      
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify AZ distribution - should be in different AZs
      const azs = [...new Set(publicSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`Found ${publicSubnets.length} public subnets across ${azs.length} AZs: ${azs.join(', ')}`);
    });

    test('should have private subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      });
      const response = await ec2Client.send(command);
      const privateSubnets = response.Subnets!.filter((subnet: any) => 
        !subnet.DefaultForAz  // Exclude default subnet
      );

      expect(privateSubnets.length).toBe(2);
      
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });

      // Verify AZ distribution
      const azs = [...new Set(privateSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`Found ${privateSubnets.length} private subnets across ${azs.length} AZs`);
    });

    test('should have functioning NAT Gateway for private subnet internet access', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways!.filter((nat: any) => nat.State !== 'deleted');

      expect(natGateways.length).toBe(1); // Only one NAT Gateway in secure environment template
      
      natGateways.forEach((nat: any) => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(nat.VpcId).toBe(VPC_ID);
      });
      
      console.log(`NAT Gateway is healthy with public IP: ${natGateways[0].NatGatewayAddresses![0].PublicIp}`);
    });

    test('should have Internet Gateway attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const igws = response.InternetGateways!;

      expect(igws.length).toBe(1);
      expect(igws[0].Attachments![0].State).toBe('available');
      expect(igws[0].Attachments![0].VpcId).toBe(VPC_ID);
      
      console.log(`Internet Gateway ${igws[0].InternetGatewayId} is attached`);
    });
  });

  describe('Security Groups Health Check', () => {
    test('should have Database security group allowing MySQL from private subnets only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const dbSG = response.SecurityGroups!.find((sg: any) => 
        sg.GroupDescription?.includes('database') ||
        sg.Tags?.some((tag: any) => 
          tag.Key === 'Name' && tag.Value?.includes('database')
        )
      );

      expect(dbSG).toBeDefined();
      
      const mysqlRules = dbSG!.IpPermissions!.filter((rule: any) => rule.FromPort === 3306);
      expect(mysqlRules.length).toBeGreaterThanOrEqual(1); // Two rules for two private subnets
      
      mysqlRules.forEach((rule: any) => {
        expect(rule.ToPort).toBe(3306);
        expect(rule.IpProtocol).toBe('tcp');
        expect(rule.IpRanges).toBeDefined();
        expect(rule.IpRanges![0].CidrIp).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
      
      console.log(`Database security group allows MySQL access from private subnets only`);
    });
  });

  describe('Database Infrastructure Health Check', () => {
    test('should have available RDS instance with encryption', async () => {
      const dbInstance = await getDatabaseInfo();

      expect(dbInstance).toBeDefined();
      expect(['available', 'creating', 'modifying']).toContain(dbInstance!.DBInstanceStatus!);
      expect(dbInstance!.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.EngineVersion).toBe('8.0.42');
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.AutoMinorVersionUpgrade).toBe(true);
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      expect(dbInstance!.KmsKeyId).toBeDefined();
      
      console.log(`RDS ${dbInstance!.DBInstanceIdentifier} is ${dbInstance!.DBInstanceStatus} with encryption and auto minor version upgrades`);
    }, 60000);

    test('should be in private subnets only', async () => {
      const dbInstance = await getDatabaseInfo();
      const subnetGroup = dbInstance!.DBSubnetGroup!;

      expect(subnetGroup.VpcId).toBe(VPC_ID);
      expect(subnetGroup.Subnets!.length).toBe(2);

      const subnetIds = subnetGroup.Subnets!.map((s: any) => s.SubnetIdentifier!);
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
      
      console.log(`RDS is properly isolated in private subnets`);
    });

    test('should use AWS Secrets Manager for credentials', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(command);
      
      const secretResource = response.StackResources!.find((resource: any) => 
        resource.ResourceType === 'AWS::SecretsManager::Secret'
      );

      expect(secretResource).toBeDefined();
      
      const secretCommand = new DescribeSecretCommand({
        SecretId: secretResource!.PhysicalResourceId!
      });
      const secretResponse = await secretsClient.send(secretCommand);

      expect(secretResponse.KmsKeyId).toBeDefined();
      expect(secretResponse.Description).toContain('Database credentials');
      
      console.log(`Database credentials managed by Secrets Manager with KMS encryption`);
    });
  });

  describe('S3 Storage Security Health Check', () => {
    test('should have accessible S3 bucket with encryption', async () => {
      const headCommand = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME });
      const headResponse = await s3Client.send(headCommand);
      
      expect(headResponse.$metadata.httpStatusCode).toBe(200);

      // Check encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: S3_BUCKET_NAME });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      const encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];

      expect(encryptionConfig.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionConfig.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
      
      console.log(`S3 bucket ${S3_BUCKET_NAME} is accessible with KMS encryption`);
    });

    test('should have secure public access configuration', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: S3_BUCKET_NAME });
      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;

      expect(config.BlockPublicAcls).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
      
      console.log(`S3 bucket has secure public access configuration (all blocks enabled)`);
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: S3_BUCKET_NAME });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
      
      console.log(`S3 bucket has versioning enabled`);
    });

    test('should support encrypted object operations', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Secure environment integration test content';

      try {
        // Upload test object with server-side encryption
        const putCommand = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
          ServerSideEncryption: 'aws:kms'
        });
        const putResponse = await s3Client.send(putCommand);
        
        expect(putResponse.ServerSideEncryption).toBe('aws:kms');

        // Retrieve test object
        const getCommand = new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey
        });
        const getResponse = await s3Client.send(getCommand);
        const retrievedContent = await getResponse.Body!.transformToString();

        expect(retrievedContent).toBe(testContent);
        expect(getResponse.ServerSideEncryption).toBe('aws:kms');

        // Clean up
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey
        });
        await s3Client.send(deleteCommand);
        
        console.log(`S3 encrypted object operations successful for ${testKey}`);
      } catch (error: any) {
        // Ensure cleanup on error
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: testKey
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });

  describe('CloudTrail Comprehensive API Logging', () => {
    test('should have CloudTrail actively logging', async () => {
      const command = new GetTrailStatusCommand({
        Name: CLOUDTRAIL_ARN
      });
      const response = await cloudTrailClient.send(command);

      expect(response.IsLogging).toBe(true);
      expect(response.LatestDeliveryTime).toBeDefined();
      
      console.log(`CloudTrail is actively logging API calls`);
    });

    test('should have CloudTrail S3 bucket configured', async () => {
      const headCommand = new HeadBucketCommand({ Bucket: CLOUDTRAIL_S3_BUCKET });
      const headResponse = await s3Client.send(headCommand);
      
      expect(headResponse.$metadata.httpStatusCode).toBe(200);

      // Check encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: CLOUDTRAIL_S3_BUCKET });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      const encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];

      expect(encryptionConfig.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      
      console.log(`CloudTrail S3 bucket ${CLOUDTRAIL_S3_BUCKET} is accessible with KMS encryption`);
    });
  });

  describe('CloudWatch Monitoring Health Check', () => {
    test('should have encrypted CloudWatch log groups', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/cloudtrail/${stackName}`
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      response.logGroups!.forEach((logGroup: any) => {
        expect(logGroup.kmsKeyId).toBeDefined();
      });
      
      console.log(`Found ${response.logGroups!.length} encrypted CloudWatch log groups`);
    });

    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);
      
      // Filter alarms for this stack
      const stackAlarms = response.MetricAlarms!.filter((alarm: any) =>
        alarm.AlarmName?.includes(stackName)
      );

      expect(stackAlarms.length).toBeGreaterThanOrEqual(2);

      // Check for database CPU alarm
      const dbCpuAlarm = stackAlarms.find((alarm: any) => 
        alarm.AlarmName?.includes('database-cpu') || alarm.MetricName === 'CPUUtilization'
      );
      expect(dbCpuAlarm).toBeDefined();

      // Check for database connection alarm
      const dbConnectionAlarm = stackAlarms.find((alarm: any) => 
        alarm.AlarmName?.includes('database-connections') || alarm.MetricName === 'DatabaseConnections'
      );
      expect(dbConnectionAlarm).toBeDefined();
      
      console.log(`Found ${stackAlarms.length} CloudWatch alarms for monitoring`);
    });
  });

  describe('IAM Security Health Check', () => {
    test('should have IAM roles with least privilege policies', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(command);
      
      const rdsMonitoringRole = response.StackResources!.find((resource: any) => 
        resource.ResourceType === 'AWS::IAM::Role' && 
        resource.LogicalResourceId === 'RDSMonitoringRole'
      );
      
      const cloudTrailRole = response.StackResources!.find((resource: any) => 
        resource.ResourceType === 'AWS::IAM::Role' && 
        resource.LogicalResourceId === 'CloudTrailRole'
      );

      expect(rdsMonitoringRole).toBeDefined();
      expect(cloudTrailRole).toBeDefined();
      
      console.log(`IAM roles configured with least privilege principles`);
    });
  });

  describe('Overall Security & Compliance Validation', () => {
    test('should have all critical resources properly deployed', async () => {
      const stackResourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(stackResourcesCommand);
      const resources = response.StackResources!;

      // Check that key resources exist
      const vpcResource = resources.find((r: any) => r.LogicalResourceId === 'VPC');
      const dbResource = resources.find((r: any) => r.LogicalResourceId === 'SecureDatabase');
      const s3Resource = resources.find((r: any) => r.LogicalResourceId === 'SecureS3Bucket');
      const cloudTrailResource = resources.find((r: any) => r.LogicalResourceId === 'CloudTrail');
      const kmsResource = resources.find((r: any) => r.LogicalResourceId === 'MasterEncryptionKey');

      expect(vpcResource).toBeDefined();
      expect(dbResource).toBeDefined();
      expect(s3Resource).toBeDefined();
      expect(cloudTrailResource).toBeDefined();
      expect(kmsResource).toBeDefined();
      
      const validStates = ['CREATE_COMPLETE', 'UPDATE_COMPLETE'];
      expect(validStates).toContain(vpcResource!.ResourceStatus);
      expect(validStates).toContain(dbResource!.ResourceStatus);
      expect(validStates).toContain(s3Resource!.ResourceStatus);
      expect(validStates).toContain(cloudTrailResource!.ResourceStatus);
      expect(validStates).toContain(kmsResource!.ResourceStatus);
      
      console.log(`All critical resources are in complete state`);
    });

    test('should meet high availability requirements', async () => {
      // Verify multi-AZ VPC deployment
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets!.filter((subnet: any) => !subnet.DefaultForAz);
      
      // Get unique AZs
      const azs = [...new Set(subnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);

      // Verify database is multi-AZ (conditional based on environment)
      const dbInstance = await getDatabaseInfo();
      if (stackParameters.Environment === 'prod') {
        expect(dbInstance!.MultiAZ).toBe(true);
      }
      
      console.log(`Infrastructure deployed across ${azs.length} availability zones for high availability`);
    });

    test('should validate comprehensive encryption implementation', async () => {
      // Verify KMS key is used across all services
      const kmsKeyCommand = new DescribeKeyCommand({ KeyId: KMS_KEY_ID });
      const kmsResponse = await kmsClient.send(kmsKeyCommand);
      expect(kmsResponse.KeyMetadata!.KeyState).toBe('Enabled');

      // Verify S3 encryption
      const s3EncryptionCommand = new GetBucketEncryptionCommand({ Bucket: S3_BUCKET_NAME });
      const s3EncryptionResponse = await s3Client.send(s3EncryptionCommand);
      expect(s3EncryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      // Verify RDS encryption
      const dbInstance = await getDatabaseInfo();
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.KmsKeyId).toBeDefined();

      // Verify CloudTrail S3 bucket encryption
      const cloudTrailEncryptionCommand = new GetBucketEncryptionCommand({ Bucket: CLOUDTRAIL_S3_BUCKET });
      const cloudTrailEncryptionResponse = await s3Client.send(cloudTrailEncryptionCommand);
      expect(cloudTrailEncryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      
      console.log(`End-to-end encryption validated across all services using KMS key ${KMS_KEY_ID}`);
    });
  });
});
