// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
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
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
console.log('CFN Outputs:', outputs);
// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('VPC Resources', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.IsDefault).toBe(false);
    });

    test('Public subnets should exist and be configured correctly', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1, outputs.PublicSubnet2],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
      });
    });

    test('Private subnets should exist and be configured correctly', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1, outputs.PrivateSubnet2],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.11.0/24', '10.0.12.0/24']).toContain(subnet.CidrBlock);
      });
    });

    test('NAT Gateway should exist', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const natGateway = response.NatGateways!.find(ng =>
        ng.NatGatewayAddresses!.some(addr => addr.PublicIp === outputs.NATGateway1EIP)
      );
      expect(natGateway).toBeDefined();
      expect(natGateway!.State).toBe('available');
    });
  });

  describe('Database Resources', () => {
    test('RDS Aurora cluster should exist with correct configuration', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `loan-aurora-cluster-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
      expect(cluster.MasterUsername).toBe('loanadmin');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.DeletionProtection).toBe(false);
    });

    test('DB instances should exist', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [`loan-aurora-cluster-${environmentSuffix}`],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);
      response.DBInstances!.forEach(instance => {
        expect(instance.Engine).toBe('aurora-mysql');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('DB subnet group should exist', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `loan-db-subnet-group-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toHaveLength(2);
      expect(subnetGroup.Subnets!.map(s => s.SubnetIdentifier)).toEqual(
        expect.arrayContaining([outputs.PrivateSubnet1, outputs.PrivateSubnet2])
      );
    });

    test('Database secret should exist', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(outputs.DBSecretArn);
      expect(response.Name).toBe(`loan-db-credentials-${environmentSuffix}`);
    });
  });

  describe('Lambda Resources', () => {
    test('Loan validation Lambda function should exist with correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LoanValidationFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration!.FunctionName).toBe(outputs.LoanValidationFunctionName);
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('index.lambda_handler');
      expect(response.Configuration!.MemorySize).toBe(1024);
      expect(response.Configuration!.Timeout).toBe(300);
    });
  });

  describe('S3 Resources', () => {
    test('Loan documents S3 bucket should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.LoanDocumentsBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });

  describe('KMS Resources', () => {
    test('KMS key should exist with correct configuration', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata!.KeyId).toBe(outputs.KMSKeyId);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('Security Groups', () => {
    test('Lambda security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [`loan-lambda-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCId);
      expect(sg.GroupName).toBe(`loan-lambda-sg-${environmentSuffix}`);
    });

    test('Database security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [`loan-db-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCId);
      expect(sg.GroupName).toBe(`loan-db-sg-${environmentSuffix}`);
    });
  });

  describe('CloudFormation Outputs Validation', () => {
    test('All flat outputs should be defined', () => {
      expect(outputs.LoanDocumentsBucketName).toBeDefined();
      expect(outputs.LoanValidationFunctionArn).toBeDefined();
      expect(outputs.PrivateSubnet1).toBeDefined();
      expect(outputs.PrivateSubnet2).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.NATGateway1EIP).toBeDefined();
      expect(outputs.PublicSubnet2).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.LoanValidationFunctionName).toBeDefined();
      expect(outputs.PublicSubnet1).toBeDefined();
    });

    test('Bucket name should match expected pattern', () => {
      expect(outputs.LoanDocumentsBucketName).toMatch(/^loan-documents-pr\d+-/);
    });

    test('Lambda function ARN should be valid', () => {
      expect(outputs.LoanValidationFunctionArn).toMatch(/^arn:aws:lambda:us-east-1:\d+:function:loan-validation-pr\d+$/);
    });

    test('Lambda function name should match expected pattern', () => {
      expect(outputs.LoanValidationFunctionName).toMatch(/^loan-validation-pr\d+$/);
    });

    test('Subnet IDs should be valid AWS subnet IDs', () => {
      expect(outputs.PrivateSubnet1).toMatch(/^subnet-[0-9a-f]{17}$/);
      expect(outputs.PrivateSubnet2).toMatch(/^subnet-[0-9a-f]{17}$/);
      expect(outputs.PublicSubnet1).toMatch(/^subnet-[0-9a-f]{17}$/);
      expect(outputs.PublicSubnet2).toMatch(/^subnet-[0-9a-f]{17}$/);
    });

    test('VPC ID should be valid AWS VPC ID', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[0-9a-f]{17}$/);
    });

    test('KMS Key ID should be valid UUID', () => {
      expect(outputs.KMSKeyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('DB Secret ARN should be valid', () => {
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:us-east-1:\d+:secret:loan-db-credentials-pr\d+-/);
    });

    test('DB Cluster Endpoint should be valid hostname', () => {
      expect(outputs.DBClusterEndpoint).toMatch(/^loan-aurora-cluster-pr\d+\.cluster-[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('NAT Gateway EIP should be valid IP address', () => {
      expect(outputs.NATGateway1EIP).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });
});

