import fs from 'fs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'eu-west-1';

const rdsClient = new RDSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cacheClient = new ElastiCacheClient({ region });
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });

describe('Payment Processing Database Infrastructure - Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    test('VPC should exist and be properly configured', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      // DNS support is enabled, but API may not return these attributes
      expect(vpc.VpcId).toBe(outputs.VPCId);
    });

    test('private subnets should exist in different availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
        })
      );

      expect(response.Subnets).toHaveLength(2);
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Different AZs

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('security groups should exist and be properly configured', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.DBSecurityGroupId, outputs.CacheSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(2);

      const dbSg = response.SecurityGroups!.find(sg => sg.GroupId === outputs.DBSecurityGroupId);
      const cacheSg = response.SecurityGroups!.find(sg => sg.GroupId === outputs.CacheSecurityGroupId);

      expect(dbSg).toBeDefined();
      expect(cacheSg).toBeDefined();
      expect(dbSg!.VpcId).toBe(outputs.VPCId);
      expect(cacheSg!.VpcId).toBe(outputs.VPCId);
    });

    test('database security group should allow PostgreSQL traffic', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.DBSecurityGroupId],
        })
      );

      const dbSg = response.SecurityGroups![0];
      const postgresRule = dbSg.IpPermissions!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(postgresRule).toBeDefined();
      expect(postgresRule!.IpProtocol).toBe('tcp');
    });

    test('cache security group should allow Redis traffic', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.CacheSecurityGroupId],
        })
      );

      const cacheSg = response.SecurityGroups![0];
      const redisRule = cacheSg.IpPermissions!.find(rule =>
        rule.FromPort === 6379 && rule.ToPort === 6379
      );

      expect(redisRule).toBeDefined();
      expect(redisRule!.IpProtocol).toBe('tcp');
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.KMSKeyId,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    test('KMS key rotation should be enabled', async () => {
      const response = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: outputs.KMSKeyId,
        })
      );

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('database secret should exist with proper configuration', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      expect(response.ARN).toBe(outputs.DBSecretArn);
      expect(response.KmsKeyId).toBeDefined();
      expect(response.RotationEnabled).toBe(true);
    });

    test('secret rotation should be configured for 30 days', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules!.AutomaticallyAfterDays).toBe(30);
    });

    test('secret should contain valid credentials', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBe('dbadmin');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('Aurora cluster should be available', async () => {
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );

      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );

      expect(cluster).toBeDefined();
      expect(cluster!.Status).toBe('available');
      expect(cluster!.Engine).toBe('aurora-postgresql');
      expect(cluster!.EngineMode).toBe('provisioned');
    });

    test('Aurora cluster should have encryption enabled', async () => {
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );

      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );

      expect(cluster!.StorageEncrypted).toBe(true);
      expect(cluster!.KmsKeyId).toContain(outputs.KMSKeyId);
    });

    test('Aurora cluster should have proper backup configuration', async () => {
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );

      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );

      expect(cluster!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(cluster!.PreferredBackupWindow).toBeDefined();
    });

    test('Aurora cluster should span multiple availability zones', async () => {
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );

      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );

      // Aurora Serverless v2 reports differently than traditional clusters
      expect(cluster!.AvailabilityZones).toBeDefined();
      expect(cluster!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });

    test('Aurora instance should be available and not publicly accessible', async () => {
      const instanceResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const instance = instanceResponse.DBInstances!.find(i =>
        i.DBClusterIdentifier?.includes('payment-db-cluster')
      );

      expect(instance).toBeDefined();
      expect(instance!.DBInstanceStatus).toBe('available');
      expect(instance!.PubliclyAccessible).toBe(false);
    });

    test('Aurora cluster endpoint should be accessible via correct port', async () => {
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).toMatch(/.*\.rds\.amazonaws\.com$/);

      // PostgreSQL default port or custom port
      expect(outputs.DBClusterPort).toBeDefined();
      expect(typeof outputs.DBClusterPort).toBe('string');
      const port = parseInt(outputs.DBClusterPort);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });
  });

  describe('ElastiCache Redis', () => {
    test('Redis replication group should be available', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );

      const replicationGroup = response.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );

      expect(replicationGroup).toBeDefined();
      expect(replicationGroup!.Status).toBe('available');
      expect(replicationGroup!.Description).toContain('payment');
    });

    test('Redis should have automatic failover enabled', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );

      const replicationGroup = response.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );

      expect(replicationGroup!.AutomaticFailover).toBe('enabled');
      expect(replicationGroup!.MultiAZ).toBe('enabled');
    });

    test('Redis should have encryption enabled', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );

      const replicationGroup = response.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );

      expect(replicationGroup!.AtRestEncryptionEnabled).toBe(true);
      expect(replicationGroup!.TransitEncryptionEnabled).toBe(true);
      expect(replicationGroup!.KmsKeyId).toContain(outputs.KMSKeyId);
    });

    test('Redis should have multiple nodes for high availability', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );

      const replicationGroup = response.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );

      expect(replicationGroup!.MemberClusters).toBeDefined();
      expect(replicationGroup!.MemberClusters!.length).toBeGreaterThanOrEqual(2);
    });

    test('Redis endpoint should use correct port', async () => {
      expect(outputs.CacheEndpoint).toBeDefined();
      expect(outputs.CacheEndpoint).toMatch(/.*\.cache\.amazonaws\.com$/);
      expect(outputs.CachePort).toBe('6379');
    });

    test('Redis should have snapshot retention configured', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );

      const replicationGroup = response.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );

      expect(replicationGroup!.SnapshotRetentionLimit).toBeGreaterThanOrEqual(5);
      expect(replicationGroup!.SnapshotWindow).toBeDefined();
    });
  });

  describe('PCI-DSS Compliance Validation', () => {
    test('all encryption requirements should be met', async () => {
      // Verify RDS encryption
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );
      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );
      expect(cluster!.StorageEncrypted).toBe(true);

      // Verify ElastiCache encryption
      const cacheResponse = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );
      const cache = cacheResponse.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );
      expect(cache!.AtRestEncryptionEnabled).toBe(true);
      expect(cache!.TransitEncryptionEnabled).toBe(true);

      // Verify Secrets Manager encryption
      const secretResponse = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );
      expect(secretResponse.KmsKeyId).toBeDefined();
    });

    test('automatic credential rotation should be configured', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules!.AutomaticallyAfterDays).toBe(30);
      expect(response.RotationLambdaARN).toBeDefined();
    });

    test('customer-managed KMS key should be used for all encryption', async () => {
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.KMSKeyId,
        })
      );

      expect(keyResponse.KeyMetadata!.KeyManager).toBe('CUSTOMER');
      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
    });

    test('database should not be publicly accessible', async () => {
      const instanceResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const instance = instanceResponse.DBInstances!.find(i =>
        i.DBClusterIdentifier?.includes('payment-db-cluster')
      );

      expect(instance!.PubliclyAccessible).toBe(false);
      expect(instance!.DBSubnetGroup!.SubnetGroupStatus).toBe('Complete');
    });
  });

  describe('High Availability Configuration', () => {
    test('resources should be deployed across multiple AZs', async () => {
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );
      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );
      // Aurora Serverless v2 spans multiple AZs
      expect(cluster!.AvailabilityZones).toBeDefined();
      expect(cluster!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);

      const cacheResponse = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );
      const cache = cacheResponse.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );
      expect(cache!.MultiAZ).toBe('enabled');
    });

    test('automatic failover should be enabled for all critical services', async () => {
      const cacheResponse = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );
      const cache = cacheResponse.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );
      expect(cache!.AutomaticFailover).toBe('enabled');
    });

    test('backup and snapshot retention should be configured', async () => {
      const clusterResponse = await rdsClient.send(
        new DescribeDBClustersCommand({})
      );
      const cluster = clusterResponse.DBClusters!.find(c =>
        c.Endpoint === outputs.DBClusterEndpoint
      );
      expect(cluster!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

      const cacheResponse = await cacheClient.send(
        new DescribeReplicationGroupsCommand({})
      );
      const cache = cacheResponse.ReplicationGroups!.find(rg =>
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.CacheEndpoint
      );
      expect(cache!.SnapshotRetentionLimit).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Resource Outputs Validation', () => {
    test('all critical outputs should be defined and valid', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-/);

      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-/);

      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-/);

      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).toMatch(/.*\.rds\.amazonaws\.com$/);

      expect(outputs.DBClusterPort).toBeDefined();

      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);

      expect(outputs.KMSKeyId).toBeDefined();

      expect(outputs.CacheEndpoint).toBeDefined();
      expect(outputs.CacheEndpoint).toMatch(/.*\.cache\.amazonaws\.com$/);

      expect(outputs.CachePort).toBe('6379');

      expect(outputs.DBSecurityGroupId).toBeDefined();
      expect(outputs.DBSecurityGroupId).toMatch(/^sg-/);

      expect(outputs.CacheSecurityGroupId).toBeDefined();
      expect(outputs.CacheSecurityGroupId).toMatch(/^sg-/);
    });
  });
});
