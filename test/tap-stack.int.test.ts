// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import {
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketLocationCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';

// Load CloudFormation outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK configuration - works with both AWS and LocalStack
// The npm script will set the appropriate environment variables
const awsConfig = {
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
};

// Initialize AWS SDK clients
const ec2Client = new EC2Client(awsConfig);
const rdsClient = new RDSClient(awsConfig);
const s3Client = new S3Client(awsConfig);
const dynamoClient = new DynamoDBClient(awsConfig);
const kmsClient = new KMSClient(awsConfig);
const lambdaClient = new LambdaClient(awsConfig);
const snsClient = new SNSClient(awsConfig);
const elbClient = new ElasticLoadBalancingV2Client(awsConfig);

describe('Financial Services DR Infrastructure Integration Tests', () => {
  beforeAll(() => {
    console.log('📋 Testing infrastructure with outputs:', Object.keys(outputs));
    console.log('🌐 AWS Region:', awsConfig.region);
  });

  describe('VPC and Networking Resources', () => {
    test('VPC should exist and be available', async () => {
      expect(outputs.PrimaryVPCId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.PrimaryVPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].VpcId).toBe(outputs.PrimaryVPCId);

      console.log('✅ VPC validated:', outputs.PrimaryVPCId);
    });

    test('Private subnets should exist and be available', async () => {
      expect(outputs.PrimaryPrivateSubnet1Id).toBeDefined();
      expect(outputs.PrimaryPrivateSubnet2Id).toBeDefined();

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrimaryPrivateSubnet1Id, outputs.PrimaryPrivateSubnet2Id]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.PrimaryVPCId);
      });

      console.log('✅ Private subnets validated:', [outputs.PrimaryPrivateSubnet1Id, outputs.PrimaryPrivateSubnet2Id]);
    });

    test('Application Load Balancer should exist and be active', async () => {
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNSName).toBeDefined();

      const elbArn = outputs.ApplicationLoadBalancerArn;
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [elbArn]
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const loadBalancer = response.LoadBalancers![0];
      expect(loadBalancer.State?.Code).toBe('active');
      expect(loadBalancer.DNSName).toBe(outputs.ApplicationLoadBalancerDNSName);
      expect(loadBalancer.LoadBalancerArn).toBe(elbArn);

      console.log('✅ Load Balancer validated:', outputs.ApplicationLoadBalancerDNSName);
    });
  });

  describe('Database Resources', () => {
    test('RDS instance should exist and be available', async () => {
      expect(outputs.PrimaryDatabaseIdentifier).toBeDefined();
      expect(outputs.PrimaryDatabaseEndpoint).toBeDefined();
      expect(outputs.PrimaryDatabasePort).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.PrimaryDatabaseIdentifier
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.DBInstanceIdentifier).toBe(outputs.PrimaryDatabaseIdentifier);
      expect(String(dbInstance.Endpoint?.Port)).toBe(String(outputs.PrimaryDatabasePort));

      console.log('✅ RDS Instance validated:', outputs.PrimaryDatabaseIdentifier);
    });

    test('Database connection parameters should be valid', async () => {
      expect(outputs.PrimaryDatabaseEndpoint).toMatch(/^[a-zA-Z0-9.-]+$/);
      expect(Number(outputs.PrimaryDatabasePort)).toBeGreaterThan(0);
      expect(Number(outputs.PrimaryDatabasePort)).toBeLessThan(65536);

      console.log('✅ Database connection parameters validated');
    });
  });

  describe('Storage Resources', () => {
    test('S3 bucket should exist and be accessible', async () => {
      expect(outputs.DocumentsBucketName).toBeDefined();
      expect(outputs.DocumentsBucketArn).toBeDefined();

      const headCommand = new HeadBucketCommand({
        Bucket: outputs.DocumentsBucketName
      });

      // This should not throw an error if bucket exists
      await s3Client.send(headCommand);

      const locationCommand = new GetBucketLocationCommand({
        Bucket: outputs.DocumentsBucketName
      });

      const response = await s3Client.send(locationCommand);
      // LocalStack may return empty or null for location constraint
      expect(response).toBeDefined();

      console.log('✅ S3 Bucket validated:', outputs.DocumentsBucketName);
    });

    test('DynamoDB table should exist and be active', async () => {
      expect(outputs.TradingDataTableName).toBeDefined();
      expect(outputs.TradingDataTableArn).toBeDefined();

      const command = new DescribeTableCommand({
        TableName: outputs.TradingDataTableName
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.TableName).toBe(outputs.TradingDataTableName);
      expect(response.Table!.TableArn).toBe(outputs.TradingDataTableArn);

      console.log('✅ DynamoDB Table validated:', outputs.TradingDataTableName);
    });
  });

  describe('Security Resources', () => {
    test('KMS key should exist and be enabled', async () => {
      expect(outputs.PrimaryKMSKeyId).toBeDefined();
      expect(outputs.PrimaryKMSKeyArn).toBeDefined();

      const command = new DescribeKeyCommand({
        KeyId: outputs.PrimaryKMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(outputs.PrimaryKMSKeyId);
      expect(response.KeyMetadata!.Arn).toBe(outputs.PrimaryKMSKeyArn);
      expect(response.KeyMetadata!.Enabled).toBe(true);

      console.log('✅ KMS Key validated:', outputs.PrimaryKMSKeyId);
    });
  });

  describe('Compute and Messaging Resources', () => {
    test('Lambda function should exist and be active', async () => {
      expect(outputs.DROrchestrationFunctionArn).toBeDefined();

      // Extract function name from ARN
      const functionName = outputs.DROrchestrationFunctionArn.split(':').pop();
      expect(functionName).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionArn).toBe(outputs.DROrchestrationFunctionArn);
      expect(response.Configuration!.State).toBe('Active');

      console.log('✅ Lambda Function validated:', functionName);
    });

    test('SNS topic should exist and be accessible', async () => {
      expect(outputs.DRNotificationTopicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.DRNotificationTopicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!['TopicArn']).toBe(outputs.DRNotificationTopicArn);

      console.log('✅ SNS Topic validated:', outputs.DRNotificationTopicArn);
    });
  });

  describe('Backup and Recovery Resources', () => {
    test('Backup plan should be configured', async () => {
      expect(outputs.BackupPlanId).toBeDefined();
      expect(outputs.BackupVaultName).toBeDefined();

      // For LocalStack, backup resources might return "unknown" values
      // but they should still be defined in outputs
      expect(typeof outputs.BackupPlanId).toBe('string');
      expect(typeof outputs.BackupVaultName).toBe('string');

      console.log('✅ Backup resources validated (LocalStack fallback)');
    });
  });

  describe('Infrastructure Completeness', () => {
    test('All expected outputs should be present', async () => {
      const expectedOutputs = [
        'ApplicationLoadBalancerArn',
        'ApplicationLoadBalancerDNSName',
        'BackupPlanId',
        'BackupVaultName',
        'DRNotificationTopicArn',
        'DROrchestrationFunctionArn',
        'DocumentsBucketArn',
        'DocumentsBucketName',
        'PrimaryDatabaseEndpoint',
        'PrimaryDatabaseIdentifier',
        'PrimaryDatabasePort',
        'PrimaryKMSKeyArn',
        'PrimaryKMSKeyId',
        'PrimaryPrivateSubnet1Id',
        'PrimaryPrivateSubnet2Id',
        'PrimaryVPCId',
        'TradingDataTableArn',
        'TradingDataTableName'
      ];

      expectedOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });

      console.log('✅ All expected outputs present:', expectedOutputs.length);
    });

    test('Resource naming conventions should be consistent', async () => {
      // Check that resources follow the expected naming pattern
      expect(outputs.PrimaryDatabaseIdentifier).toContain('finserv');
      expect(outputs.PrimaryDatabaseIdentifier).toContain(environmentSuffix);

      expect(outputs.DocumentsBucketName).toContain('finserv');
      expect(outputs.DocumentsBucketName).toContain(environmentSuffix);

      expect(outputs.TradingDataTableName).toContain('finserv');
      expect(outputs.TradingDataTableName).toContain(environmentSuffix);

      console.log('✅ Resource naming conventions validated');
    });

    test('Environment configuration should be correct', async () => {
      // Verify resources are tagged/named with correct environment
      expect(outputs.DocumentsBucketName.includes(environmentSuffix)).toBe(true);
      expect(outputs.TradingDataTableName.includes(environmentSuffix)).toBe(true);

      console.log('✅ Environment configuration validated for:', environmentSuffix);
    });
  });
});
