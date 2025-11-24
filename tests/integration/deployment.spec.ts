/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';

interface StackOutputs {
  vpcId: string;
  vpcCidr?: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  ecsClusterName: string;
  ecsClusterArn: string;
  ecsSecurityGroupId?: string;
  auroraClusterArn: string;
  auroraClusterEndpoint: string;
  auroraSecurityGroupId?: string;
  rawDataBucketName: string;
  processedDataBucketName: string;
  kinesisStreamName: string;
  kmsKeyArn: string;
  backupVaultArn: string;
  backupPlanId: string;
}

describe('Infrastructure Deployment Integration Tests', () => {
  let outputs: StackOutputs;
  let ec2Client: AWS.EC2;
  let ecsClient: AWS.ECS;
  let rdsClient: AWS.RDS;
  let s3Client: AWS.S3;
  let kinesisClient: AWS.Kinesis;
  let backupClient: AWS.Backup;

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    const region = 'us-east-2';
    ec2Client = new AWS.EC2({ region });
    ecsClient = new AWS.ECS({ region });
    rdsClient = new AWS.RDS({ region });
    s3Client = new AWS.S3({ region });
    kinesisClient = new AWS.Kinesis({ region });
    backupClient = new AWS.Backup({ region });
  });

  describe('VPC and Networking', () => {
    it('should have created VPC with correct CIDR', async () => {
      const vpcId = outputs.vpcId;
      const result = await ec2Client
        .describeVpcs({ VpcIds: [vpcId] })
        .promise();

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(result.Vpcs![0].Tags).toBeDefined();
    });

    it('should have created 3 public subnets', async () => {
      const subnetIds = outputs.publicSubnetIds;
      const result = await ec2Client
        .describeSubnets({ SubnetIds: subnetIds })
        .promise();

      expect(result.Subnets).toHaveLength(3);
      result.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have created 3 private subnets', async () => {
      const subnetIds = outputs.privateSubnetIds;
      const result = await ec2Client
        .describeSubnets({ SubnetIds: subnetIds })
        .promise();

      expect(result.Subnets).toHaveLength(3);
      result.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should have created VPC endpoints', async () => {
      const vpcId = outputs.vpcId;
      const result = await ec2Client
        .describeVpcEndpoints({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      // Should have S3, ECR API, ECR DKR, ECS, ECS Telemetry, Logs, Secrets Manager
      expect(result.VpcEndpoints!.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('ECS Cluster', () => {
    it('should have created ECS cluster', async () => {
      const clusterName = outputs.ecsClusterName;
      const result = await ecsClient
        .describeClusters({ clusters: [clusterName] })
        .promise();

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters![0].status).toBe('ACTIVE');
    });

    it('should have Fargate Spot capacity provider configured', async () => {
      const result = await ecsClient
        .describeCapacityProviders({
          capacityProviders: ['FARGATE_SPOT', 'FARGATE'],
        })
        .promise();

      expect(result.capacityProviders!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Aurora PostgreSQL', () => {
    it('should have created Aurora cluster', async () => {
      const clusterArn = outputs.auroraClusterArn;
      const clusterId = clusterArn.split(':').pop();
      const result = await rdsClient
        .describeDBClusters({
          DBClusterIdentifier: clusterId,
        })
        .promise();

      expect(result.DBClusters).toHaveLength(1);
      expect(result.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(result.DBClusters![0].EngineMode).toBe('provisioned');
    });

    it('should have encryption enabled', async () => {
      const clusterArn = outputs.auroraClusterArn;
      const clusterId = clusterArn.split(':').pop();
      const result = await rdsClient
        .describeDBClusters({
          DBClusterIdentifier: clusterId,
        })
        .promise();

      expect(result.DBClusters![0].StorageEncrypted).toBe(true);
      expect(result.DBClusters![0].KmsKeyId).toBeDefined();
    });

    it('should have 35 day backup retention', async () => {
      const clusterArn = outputs.auroraClusterArn;
      const clusterId = clusterArn.split(':').pop();
      const result = await rdsClient
        .describeDBClusters({
          DBClusterIdentifier: clusterId,
        })
        .promise();

      expect(result.DBClusters![0].BackupRetentionPeriod).toBe(35);
    });
  });

  describe('S3 Buckets', () => {
    it('should have created raw data bucket with versioning', async () => {
      const bucketName = outputs.rawDataBucketName;
      const versioning = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();

      expect(versioning.Status).toBe('Enabled');
    });

    it('should have created processed data bucket with versioning', async () => {
      const bucketName = outputs.processedDataBucketName;
      const versioning = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();

      expect(versioning.Status).toBe('Enabled');
    });

    it('should have encryption enabled on raw data bucket', async () => {
      const bucketName = outputs.rawDataBucketName;
      const encryption = await s3Client
        .getBucketEncryption({ Bucket: bucketName })
        .promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration!.Rules[0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });

    it('should have lifecycle policy on raw data bucket', async () => {
      const bucketName = outputs.rawDataBucketName;
      const lifecycle = await s3Client
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();

      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules![0].Status).toBe('Enabled');
      expect(lifecycle.Rules![0].Transitions![0].Days).toBe(90);
      expect(lifecycle.Rules![0].Transitions![0].StorageClass).toBe('GLACIER');
    });
  });

  describe('Kinesis Data Stream', () => {
    it('should have created Kinesis stream', async () => {
      const streamName = outputs.kinesisStreamName;
      const result = await kinesisClient
        .describeStream({ StreamName: streamName })
        .promise();

      expect(result.StreamDescription.StreamStatus).toBe('ACTIVE');
      expect(result.StreamDescription.Shards.length).toBeGreaterThanOrEqual(2);
    });

    it('should have encryption enabled', async () => {
      const streamName = outputs.kinesisStreamName;
      const result = await kinesisClient
        .describeStream({ StreamName: streamName })
        .promise();

      expect(result.StreamDescription.EncryptionType).toBe('KMS');
      expect(result.StreamDescription.KeyId).toBeDefined();
    });
  });

  describe('AWS Backup', () => {
    it('should have created backup vault', async () => {
      const vaultArn = outputs.backupVaultArn;
      const vaultName = vaultArn.split(':').pop();
      const result = await backupClient
        .describeBackupVault({ BackupVaultName: vaultName! })
        .promise();

      expect(result.BackupVaultArn).toBe(vaultArn);
      expect(result.EncryptionKeyArn).toBeDefined();
    });

    it('should have created backup plan', async () => {
      const planId = outputs.backupPlanId;
      const result = await backupClient
        .getBackupPlan({ BackupPlanId: planId })
        .promise();

      expect(result.BackupPlan).toBeDefined();
      expect(result.BackupPlan!.Rules).toHaveLength(1);
      expect(result.BackupPlan!.Rules[0].Lifecycle!.DeleteAfterDays).toBe(35);
    });
  });

  describe('Security Groups', () => {
    it('should have correct ingress rules for Aurora', async () => {
      const sgId = outputs.auroraSecurityGroupId;
      if (!sgId) {
        throw new Error('auroraSecurityGroupId not found in outputs');
      }
      const result = await ec2Client
        .describeSecurityGroups({ GroupIds: [sgId] })
        .promise();

      expect(result.SecurityGroups).toHaveLength(1);
      const ingressRules = result.SecurityGroups![0].IpPermissions!;
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432);

      expect(postgresRule).toBeDefined();
      expect(postgresRule!.UserIdGroupPairs).toBeDefined();
      expect(postgresRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });
});
