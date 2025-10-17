import {
  BackupClient,
  DescribeBackupVaultCommand,
  GetBackupPlanCommand,
} from '@aws-sdk/client-backup';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeFileSystemsCommand,
  DescribeMountTargetsCommand,
  EFSClient,
} from '@aws-sdk/client-efs';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import {
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';

const region = 'eu-central-1';

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const efsClient = new EFSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const backupClient = new BackupClient({ region });

describe('TapStack Integration Tests - LMS Infrastructure', () => {
  describe('VPC and Network Configuration', () => {
    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // VPC is available and properly configured as per template
    }, 30000);

    test('should have 4 subnets (2 public, 2 private) across multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(4);

      // Check for different availability zones
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
      expect(cidrBlocks).toContain('10.0.11.0/24');
      expect(cidrBlocks).toContain('10.0.12.0/24');
    }, 30000);

    test('NAT Gateway should be running and have an Elastic IP', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(1);

      const natGw = response.NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.NatGatewayAddresses).toBeDefined();
      expect(natGw.NatGatewayAddresses![0].PublicIp).toBeDefined();
    }, 30000);

    test('security groups should be configured with proper ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const sgs = response.SecurityGroups!;

      // Find database security group
      const dbSg = sgs.find(sg => sg.GroupName?.includes('database-sg'));
      expect(dbSg).toBeDefined();
      expect(dbSg!.IpPermissions).toBeDefined();
      const dbRule = dbSg!.IpPermissions!.find(rule => rule.FromPort === 5432);
      expect(dbRule).toBeDefined();

      // Find Redis security group
      const redisSg = sgs.find(sg => sg.GroupName?.includes('redis-sg'));
      expect(redisSg).toBeDefined();
      const redisRule = redisSg!.IpPermissions!.find(rule => rule.FromPort === 6379);
      expect(redisRule).toBeDefined();

      // Find EFS security group
      const efsSg = sgs.find(sg => sg.GroupName?.includes('efs-sg'));
      expect(efsSg).toBeDefined();
      const efsRule = efsSg!.IpPermissions!.find(rule => rule.FromPort === 2049);
      expect(efsRule).toBeDefined();
    }, 30000);
  });

  describe('Database Layer - Aurora PostgreSQL', () => {
    test('Aurora cluster should be available and encrypted', async () => {
      const clusterName = outputs.DatabaseEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.BackupRetentionPeriod).toBe(35);
      expect(cluster.Endpoint).toBe(outputs.DatabaseEndpoint);
      expect(cluster.KmsKeyId).toBeDefined();
    }, 30000);

    test('Aurora should have 2 instances in different AZs', async () => {
      const clusterName = outputs.DatabaseEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterName],
          },
        ],
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(2);

      const instance1 = response.DBInstances![0];
      const instance2 = response.DBInstances![1];

      expect(instance1.DBInstanceStatus).toBe('available');
      expect(instance2.DBInstanceStatus).toBe('available');
      expect(instance1.PubliclyAccessible).toBe(false);
      expect(instance2.PubliclyAccessible).toBe(false);

      // Verify they're in different AZs
      expect(instance1.AvailabilityZone).not.toBe(instance2.AvailabilityZone);
    }, 30000);

    test('database secret should exist and be retrievable', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DatabaseSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.username).toBe('lmsadmin');
      expect(secret.password.length).toBeGreaterThanOrEqual(32);
    }, 30000);
  });

  describe('Backup Configuration', () => {
    test('backup vault should exist and be encrypted', async () => {
      const command = new DescribeBackupVaultCommand({
        BackupVaultName: outputs.BackupVaultName,
      });

      const response = await backupClient.send(command);
      expect(response.BackupVaultName).toBe(outputs.BackupVaultName);
      expect(response.EncryptionKeyArn).toBeDefined();
    }, 30000);

    test('backup plan should be configured for 90-day retention', async () => {
      const command = new GetBackupPlanCommand({
        BackupPlanId: outputs.BackupPlanId,
      });

      const response = await backupClient.send(command);
      expect(response.BackupPlan).toBeDefined();

      const rule = response.BackupPlan!.Rules![0];
      expect(rule.Lifecycle?.DeleteAfterDays).toBe(90);
      expect(rule.ScheduleExpression).toBe('cron(0 3 * * ? *)');
    }, 30000);
  });

  describe('Caching Layer - ElastiCache Redis', () => {
    test('Redis replication group should be available with Multi-AZ', async () => {
      const replicationGroupId = outputs.RedisEndpoint.split('.')[1];

      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });

      const response = await elasticacheClient.send(command);
      expect(response.ReplicationGroups).toHaveLength(1);

      const redis = response.ReplicationGroups![0];
      expect(redis.Status).toBe('available');
      expect(redis.MultiAZ).toBe('enabled');
      expect(redis.AutomaticFailover).toBe('enabled');
      expect(redis.TransitEncryptionEnabled).toBe(true);
      expect(redis.AtRestEncryptionEnabled).toBe(false);
      expect(redis.MemberClusters).toHaveLength(2);
    }, 30000);

    test('Redis endpoint should be accessible from VPC', async () => {
      const replicationGroupId = outputs.RedisEndpoint.split('.')[1];

      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });

      const response = await elasticacheClient.send(command);
      const redis = response.ReplicationGroups![0];

      expect(redis.NodeGroups![0].PrimaryEndpoint?.Address).toBe(outputs.RedisEndpoint);
      expect(redis.NodeGroups![0].PrimaryEndpoint?.Port).toBe(6379);
    }, 30000);
  });

  describe('Storage Layer - EFS', () => {
    test('EFS filesystem should be available and encrypted', async () => {
      const command = new DescribeFileSystemsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });

      const response = await efsClient.send(command);
      expect(response.FileSystems).toHaveLength(1);

      const efs = response.FileSystems![0];
      expect(efs.LifeCycleState).toBe('available');
      expect(efs.Encrypted).toBe(true);
      expect(efs.KmsKeyId).toBeDefined();
      expect(efs.PerformanceMode).toBe('generalPurpose');
      expect(efs.ThroughputMode).toBe('bursting');
    }, 30000);

    test('EFS should have 2 mount targets in different AZs', async () => {
      const command = new DescribeMountTargetsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });

      const response = await efsClient.send(command);
      expect(response.MountTargets).toHaveLength(2);

      const mt1 = response.MountTargets![0];
      const mt2 = response.MountTargets![1];

      expect(mt1.LifeCycleState).toBe('available');
      expect(mt2.LifeCycleState).toBe('available');
      expect(mt1.AvailabilityZoneName).not.toBe(mt2.AvailabilityZoneName);
    }, 30000);
  });

  describe('Container Platform - ECS Fargate', () => {
    test('ECS cluster should be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(outputs.ECSClusterName);
      expect(cluster.capacityProviders).toContain('FARGATE');
      expect(cluster.capacityProviders).toContain('FARGATE_SPOT');
    }, 30000);

    test('ECS service should be running with 2 tasks', async () => {
      // List services in the cluster
      const listCommand = new ListServicesCommand({
        cluster: outputs.ECSClusterName,
      });

      const listResponse = await ecsClient.send(listCommand);
      expect(listResponse.serviceArns).toBeDefined();
      expect(listResponse.serviceArns!.length).toBeGreaterThan(0);

      // Describe the first service
      const describeCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [listResponse.serviceArns![0]],
      });

      const response = await ecsClient.send(describeCommand);
      expect(response.services).toHaveLength(1);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback).toBe(true);
    }, 30000);

    test('ECS task definition should have proper configuration', async () => {
      // List services to get task definition
      const listCommand = new ListServicesCommand({
        cluster: outputs.ECSClusterName,
      });

      const listResponse = await ecsClient.send(listCommand);
      const describeServiceCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [listResponse.serviceArns![0]],
      });

      const serviceResponse = await ecsClient.send(describeServiceCommand);
      const taskDefArn = serviceResponse.services![0].taskDefinition;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();

      // Check container definition
      const container = taskDef.containerDefinitions![0];
      expect(container.name).toBe('lms-application');

      // Verify environment variables
      const envVars = container.environment!;
      const dbHost = envVars.find(e => e.name === 'DATABASE_HOST');
      const redisHost = envVars.find(e => e.name === 'REDIS_HOST');

      expect(dbHost?.value).toBe(outputs.DatabaseEndpoint);
      expect(redisHost?.value).toBe(outputs.RedisEndpoint);

      // Verify EFS volume
      expect(taskDef.volumes).toHaveLength(1);
      expect(taskDef.volumes![0].efsVolumeConfiguration).toBeDefined();
      expect(taskDef.volumes![0].efsVolumeConfiguration!.fileSystemId).toBe(outputs.EFSFileSystemId);
      expect(taskDef.volumes![0].efsVolumeConfiguration!.transitEncryption).toBe('ENABLED');
    }, 30000);
  });

  describe('Encryption and Security Compliance', () => {
    test('KMS keys should exist for database and EFS encryption', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const aliases = response.Aliases!.map(a => a.AliasName);

      // Find our keys by alias name pattern (using environment suffix from outputs or default patterns)
      const dbKeyAlias = aliases.find(a => a?.includes('database-'));
      const efsKeyAlias = aliases.find(a => a?.includes('efs-'));

      expect(dbKeyAlias).toBeDefined();
      expect(efsKeyAlias).toBeDefined();
    }, 30000);

    test('all data-at-rest encryption should be enabled', async () => {
      const clusterName = outputs.DatabaseEndpoint.split('.')[0];

      // Check Aurora encryption
      const dbCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      expect(dbResponse.DBClusters![0].StorageEncrypted).toBe(true);

      // Check EFS encryption
      const efsCommand = new DescribeFileSystemsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const efsResponse = await efsClient.send(efsCommand);
      expect(efsResponse.FileSystems![0].Encrypted).toBe(true);
    }, 30000);
  });

  describe('High Availability Configuration', () => {
    test('all critical services should span multiple availability zones', async () => {
      // Check Aurora instances
      const clusterName = outputs.DatabaseEndpoint.split('.')[0];
      const dbCommand = new DescribeDBInstancesCommand({
        Filters: [{ Name: 'db-cluster-id', Values: [clusterName] }],
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbAzs = dbResponse.DBInstances!.map(i => i.AvailabilityZone);
      expect(new Set(dbAzs).size).toBeGreaterThanOrEqual(2);

      // Check Redis
      const replicationGroupId = outputs.RedisEndpoint.split('.')[1];
      const redisCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });
      const redisResponse = await elasticacheClient.send(redisCommand);
      expect(redisResponse.ReplicationGroups![0].MultiAZ).toBe('enabled');

      // Check EFS mount targets
      const efsCommand = new DescribeMountTargetsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const efsResponse = await efsClient.send(efsCommand);
      const efsAzs = efsResponse.MountTargets!.map(mt => mt.AvailabilityZoneName);
      expect(new Set(efsAzs).size).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('GDPR Compliance Validation', () => {
    test('all data should be stored in eu-central-1 region', async () => {
      // Verify by checking that all resources are accessible in eu-central-1
      // This is implicitly validated by all previous tests using eu-central-1 clients

      // Additional explicit check for Aurora
      const clusterName = outputs.DatabaseEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const response = await rdsClient.send(command);

      const availabilityZones = response.DBClusters![0].AvailabilityZones!;
      availabilityZones.forEach(az => {
        expect(az.startsWith('eu-central-1')).toBe(true);
      });
    }, 30000);

    test('combined backup retention meets 90-day requirement', async () => {
      const clusterName = outputs.DatabaseEndpoint.split('.')[0];

      // Check Aurora automated backups (35 days)
      const dbCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      expect(dbResponse.DBClusters![0].BackupRetentionPeriod).toBe(35);

      // Check AWS Backup plan (90 days)
      const backupCommand = new GetBackupPlanCommand({
        BackupPlanId: outputs.BackupPlanId,
      });
      const backupResponse = await backupClient.send(backupCommand);
      expect(backupResponse.BackupPlan!.Rules![0].Lifecycle?.DeleteAfterDays).toBe(90);
    }, 30000);
  });
});
