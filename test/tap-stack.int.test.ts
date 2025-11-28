// TAP Stack Integration tests for Database Migration Infrastructure
// These tests verify deployed AWS resources using AWS SDK v3

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeEndpointsCommand,
  DescribeReplicationTasksCommand,
} from '@aws-sdk/client-database-migration-service';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const dmsClient = new DatabaseMigrationServiceClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const cloudwatchClient = new CloudWatchClient({ region: REGION });

describe('TAP Stack - Database Migration Integration Tests', () => {
  describe('Network Infrastructure', () => {
    test('migration VPC should be created', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`migration-vpc-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('public subnets should be available across AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Type',
              Values: ['public'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      const migrationSubnets = response.Subnets!.filter(
        (s) => s.Tags?.some((t) => t.Value?.includes(ENVIRONMENT_SUFFIX))
      );
      expect(migrationSubnets.length).toBeGreaterThanOrEqual(2);

      // Check subnets are in different AZs
      const azs = new Set(migrationSubnets.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('private subnets should exist for Aurora', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Type',
              Values: ['private'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      const migrationSubnets = response.Subnets!.filter(
        (s) => s.Tags?.some((t) => t.Value?.includes(ENVIRONMENT_SUFFIX))
      );
      expect(migrationSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('Aurora security group should allow PostgreSQL traffic', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`aurora-sg-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const hasPostgresIngress = sg.IpPermissions?.some(
        (rule) => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(hasPostgresIngress).toBe(true);
    });

    test('DMS security group should exist', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`dms-sg-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
    });

    test('route tables should have internet gateway route', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`migration-public-rt-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(1);

      const routes = response.RouteTables![0].Routes;
      const igwRoute = routes?.find((r) => r.GatewayId?.startsWith('igw-'));
      expect(igwRoute).toBeDefined();
    });
  });

  describe('Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should be running', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
    });

    test('Aurora cluster should use aurora-postgresql engine', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toMatch(/^13\./);
    });

    test('Aurora cluster should have encryption enabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    test('Aurora cluster should have multiple instances', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    });

    test('Aurora cluster deletion protection should be disabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.DeletionProtection).toBe(false);
    });
  });

  describe('DMS Migration Resources', () => {
    test('DMS replication instance should be running', async () => {
      const response = await dmsClient.send(
        new DescribeReplicationInstancesCommand({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [`dms-instance-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.ReplicationInstances).toBeDefined();
      expect(response.ReplicationInstances!.length).toBe(1);

      const instance = response.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toBe('available');
    });

    test('DMS replication instance should be Multi-AZ', async () => {
      const response = await dmsClient.send(
        new DescribeReplicationInstancesCommand({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [`dms-instance-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      const instance = response.ReplicationInstances![0];
      expect(instance.MultiAZ).toBe(true);
    });

    test('DMS replication instance should not be publicly accessible', async () => {
      const response = await dmsClient.send(
        new DescribeReplicationInstancesCommand({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [`dms-instance-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      const instance = response.ReplicationInstances![0];
      expect(instance.PubliclyAccessible).toBe(false);
    });

    test('DMS source endpoint should be configured', async () => {
      const response = await dmsClient.send(
        new DescribeEndpointsCommand({
          Filters: [
            {
              Name: 'endpoint-id',
              Values: [`source-endpoint-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.Endpoints).toBeDefined();
      expect(response.Endpoints!.length).toBe(1);

      const endpoint = response.Endpoints![0];
      expect(endpoint.EndpointType).toBe('SOURCE');
      expect(endpoint.EngineName).toBe('postgres');
    });

    test('DMS target endpoint should be configured for Aurora', async () => {
      const response = await dmsClient.send(
        new DescribeEndpointsCommand({
          Filters: [
            {
              Name: 'endpoint-id',
              Values: [`target-endpoint-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.Endpoints).toBeDefined();
      expect(response.Endpoints!.length).toBe(1);

      const endpoint = response.Endpoints![0];
      expect(endpoint.EndpointType).toBe('TARGET');
      expect(endpoint.EngineName).toBe('aurora-postgresql');
    });

    test('DMS endpoints should use SSL', async () => {
      const sourceResponse = await dmsClient.send(
        new DescribeEndpointsCommand({
          Filters: [
            {
              Name: 'endpoint-id',
              Values: [`source-endpoint-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      const targetResponse = await dmsClient.send(
        new DescribeEndpointsCommand({
          Filters: [
            {
              Name: 'endpoint-id',
              Values: [`target-endpoint-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(sourceResponse.Endpoints![0].SslMode).toBe('require');
      expect(targetResponse.Endpoints![0].SslMode).toBe('require');
    });

    test('DMS replication task should use full-load-and-cdc', async () => {
      const response = await dmsClient.send(
        new DescribeReplicationTasksCommand({
          Filters: [
            {
              Name: 'replication-task-id',
              Values: [`migration-task-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.ReplicationTasks).toBeDefined();
      expect(response.ReplicationTasks!.length).toBe(1);

      const task = response.ReplicationTasks![0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('S3 Migration Bucket', () => {
    test('migration bucket should exist', async () => {
      const bucketName = `inventory-migration-${ENVIRONMENT_SUFFIX}`;

      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('bucket versioning should be enabled', async () => {
      const bucketName = `inventory-migration-${ENVIRONMENT_SUFFIX}`;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('KMS Encryption', () => {
    test('RDS KMS key should exist', async () => {
      const response = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const rdsAlias = response.Aliases?.find(
        (alias) => alias.AliasName === `alias/rds-aurora-${ENVIRONMENT_SUFFIX}`
      );

      expect(rdsAlias).toBeDefined();
      expect(rdsAlias!.TargetKeyId).toBeDefined();
    });

    test('S3 KMS key should exist', async () => {
      const response = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const s3Alias = response.Aliases?.find(
        (alias) => alias.AliasName === `alias/s3-migration-${ENVIRONMENT_SUFFIX}`
      );

      expect(s3Alias).toBeDefined();
      expect(s3Alias!.TargetKeyId).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('DMS replication lag alarm should be configured', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`dms-replication-lag-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Namespace).toBe('AWS/DMS');
      expect(alarm.MetricName).toBe('CDCLatencyTarget');
    });

    test('Aurora CPU alarm should be configured', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`aurora-cpu-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Namespace).toBe('AWS/RDS');
    });

    test('Aurora connections alarm should be configured', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`aurora-connections-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    });

    test('Aurora storage alarm should be configured', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`aurora-storage-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    });
  });
});
