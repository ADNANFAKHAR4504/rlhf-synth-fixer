import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('TAP Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Deployment outputs not found. Run deployment first: npx cdktf deploy --auto-approve'
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('VPC and Networking', () => {
    const ec2Client = new EC2Client({ region });

    test('VPC exists and is available', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Public subnets exist and are correctly configured', async () => {
      const publicSubnet1Id = outputs.PublicSubnet1Id;
      const publicSubnet2Id = outputs.PublicSubnet2Id;

      expect(publicSubnet1Id).toBeDefined();
      expect(publicSubnet2Id).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [publicSubnet1Id, publicSubnet2Id],
        })
      );

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Private subnets exist and are correctly configured', async () => {
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;

      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [privateSubnet1Id, privateSubnet2Id],
        })
      );

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Security Groups', () => {
    const ec2Client = new EC2Client({ region });

    test('ECS security group exists with correct rules', async () => {
      const securityGroupId = outputs.EcsSecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('ecs');
    });

    test('RDS security group exists', async () => {
      const securityGroupId = outputs.RdsSecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('Redis security group exists', async () => {
      const securityGroupId = outputs.RedisSecurityGroupId;
      expect(securityGroupId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
    });
  });

  describe('KMS and Secrets', () => {
    const kmsClient = new KMSClient({ region });
    const secretsClient = new SecretsManagerClient({ region });

    test('KMS key exists and is enabled', async () => {
      const keyId = outputs.KmsKeyId;
      expect(keyId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('Database secret exists', async () => {
      const secretArn = outputs.DbSecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('db-secret');
    });
  });

  describe('CloudWatch Log Groups', () => {
    const logsClient = new CloudWatchLogsClient({ region });

    test('ECS log group exists', async () => {
      const logGroupName = outputs.EcsLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });

    test('Audit log group exists', async () => {
      const logGroupName = outputs.AuditLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });
  });

  describe('RDS Aurora Serverless v2', () => {
    const rdsClient = new RDSClient({ region });

    test('Aurora cluster exists and is available', async () => {
      const clusterId = outputs.RdsClusterId;
      expect(clusterId).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineMode).toBe('provisioned');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster has correct serverless v2 configuration', async () => {
      const clusterId = outputs.RdsClusterId;

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(
        cluster.ServerlessV2ScalingConfiguration!.MinCapacity
      ).toBeGreaterThanOrEqual(0.5);
      expect(
        cluster.ServerlessV2ScalingConfiguration!.MaxCapacity
      ).toBeLessThanOrEqual(1);
    });
  });

  describe('ElastiCache Redis', () => {
    const elasticacheClient = new ElastiCacheClient({ region });

    test('Redis replication group exists and is available', async () => {
      const replicationGroupId = outputs.RedisReplicationGroupId;
      expect(replicationGroupId).toBeDefined();

      const response = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      expect(response.ReplicationGroups).toHaveLength(1);
      const rg = response.ReplicationGroups![0];
      expect(rg.Status).toBe('available');
      expect(rg.AtRestEncryptionEnabled).toBe(true);
      expect(rg.TransitEncryptionEnabled).toBe(true);
    });

    test('Redis has correct configuration', async () => {
      const replicationGroupId = outputs.RedisReplicationGroupId;

      const response = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const rg = response.ReplicationGroups![0];
      expect(rg.CacheNodeType).toBe('cache.t4g.micro');
      expect(rg.AutomaticFailover).toBe('enabled');
    });
  });

  describe('ECS Fargate', () => {
    const ecsClient = new ECSClient({ region });

    test('ECS cluster exists and is active', async () => {
      const clusterArn = outputs.EcsClusterArn;
      expect(clusterArn).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({ clusters: [clusterArn] })
      );

      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    test('ECS service exists and is running', async () => {
      const clusterArn = outputs.EcsClusterArn;
      const serviceArn = outputs.EcsServiceArn;
      expect(serviceArn).toBeDefined();

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterArn,
          services: [serviceArn],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThan(0);
    });
  });

  describe('Resource Integration', () => {
    test('All critical outputs are present', () => {
      const requiredOutputs = [
        'VpcId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'EcsSecurityGroupId',
        'RdsSecurityGroupId',
        'RedisSecurityGroupId',
        'KmsKeyId',
        'DbSecretArn',
        'EcsLogGroupName',
        'AuditLogGroupName',
        'RdsClusterId',
        'RdsClusterEndpoint',
        'RedisReplicationGroupId',
        'RedisEndpoint',
        'EcsClusterArn',
        'EcsServiceArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Environment suffix is used consistently', () => {
      const suffix = process.env.ENVIRONMENT_SUFFIX || 'synthd3l0d4k9';

      // Check that resource names include the environment suffix
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.RdsClusterId).toContain(suffix);
      expect(outputs.RedisReplicationGroupId).toContain(suffix);
      expect(outputs.EcsClusterArn).toContain(suffix);
    });
  });
});
