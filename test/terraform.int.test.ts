// Integration tests for Database Migration Infrastructure
// These tests verify deployed AWS resources using AWS SDK v3

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBSubnetGroupsCommand,
  DescribeDBClusterParameterGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeEndpointsCommand,
  DescribeReplicationTasksCommand,
  DescribeReplicationSubnetGroupsCommand,
} from '@aws-sdk/client-database-migration-service';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const dmsClient = new DatabaseMigrationServiceClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const cloudwatchClient = new CloudWatchClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });

describe('Database Migration Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist with correct configuration', async () => {
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
      expect(response.Vpcs!.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBeDefined();
      expect(vpc.State).toBe('available');
    });

    test('public subnets should exist', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Type',
              Values: ['public'],
            },
            {
              Name: 'tag:Name',
              Values: [`migration-public-subnet-*-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should exist', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Type',
              Values: ['private'],
            },
            {
              Name: 'tag:Name',
              Values: [`migration-private-subnet-*-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('internet gateway should exist', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`migration-igw-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments).toBeDefined();
      expect(response.InternetGateways![0].Attachments!.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups', () => {
    test('Aurora security group should exist', async () => {
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
      const postgresRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
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
  });

  describe('Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should exist with correct engine', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DeletionProtection).toBe(false);
    });

    test('Aurora cluster should have Multi-AZ instances', async () => {
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    });

    test('Aurora subnet group should exist', async () => {
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `aurora-subnet-group-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups!.length).toBe(1);
      expect(response.DBSubnetGroups![0].Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('Aurora parameter group should exist with PostgreSQL 13 family', async () => {
      const response = await rdsClient.send(
        new DescribeDBClusterParameterGroupsCommand({
          DBClusterParameterGroupName: `aurora-pg13-params-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.DBClusterParameterGroups).toBeDefined();
      expect(response.DBClusterParameterGroups!.length).toBe(1);
      expect(response.DBClusterParameterGroups![0].DBParameterGroupFamily).toBe(
        'aurora-postgresql13'
      );
    });
  });

  describe('DMS Resources', () => {
    test('DMS replication instance should exist with Multi-AZ', async () => {
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
      expect(instance.MultiAZ).toBe(true);
      expect(instance.PubliclyAccessible).toBe(false);
    });

    test('DMS source endpoint should exist', async () => {
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
      expect(endpoint.SslMode).toBe('require');
    });

    test('DMS target endpoint should exist for Aurora', async () => {
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

    test('DMS replication task should exist with full-load-and-cdc', async () => {
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

    test('DMS subnet group should exist', async () => {
      const response = await dmsClient.send(
        new DescribeReplicationSubnetGroupsCommand({
          Filters: [
            {
              Name: 'replication-subnet-group-id',
              Values: [`dms-subnet-group-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.ReplicationSubnetGroups).toBeDefined();
      expect(response.ReplicationSubnetGroups!.length).toBe(1);
    });
  });

  describe('S3 Bucket', () => {
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

    test('bucket encryption should be enabled with KMS', async () => {
      const bucketName = `inventory-migration-${ENVIRONMENT_SUFFIX}`;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('bucket public access should be blocked', async () => {
      const bucketName = `inventory-migration-${ENVIRONMENT_SUFFIX}`;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('KMS Keys', () => {
    test('RDS KMS key alias should exist', async () => {
      const response = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const rdsAlias = response.Aliases?.find(
        (alias) => alias.AliasName === `alias/rds-aurora-${ENVIRONMENT_SUFFIX}`
      );

      expect(rdsAlias).toBeDefined();
    });

    test('S3 KMS key alias should exist', async () => {
      const response = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const s3Alias = response.Aliases?.find(
        (alias) => alias.AliasName === `alias/s3-migration-${ENVIRONMENT_SUFFIX}`
      );

      expect(s3Alias).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('migration alerts topic should exist', async () => {
      const response = await snsClient.send(
        new ListTopicsCommand({})
      );

      const alertsTopic = response.Topics?.find(
        (topic) => topic.TopicArn?.includes(`migration-alerts-${ENVIRONMENT_SUFFIX}`)
      );

      expect(alertsTopic).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('DMS replication lag alarm should exist', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`dms-replication-lag-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CDCLatencyTarget');
      expect(alarm.Namespace).toBe('AWS/DMS');
    });

    test('Aurora CPU alarm should exist', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`aurora-cpu-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
    });

    test('Aurora connections alarm should exist', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`aurora-connections-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    });

    test('Aurora storage alarm should exist', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`aurora-storage-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    });

    test('migration dashboard should exist', async () => {
      const response = await cloudwatchClient.send(
        new ListDashboardsCommand({
          DashboardNamePrefix: `migration-dashboard-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBe(1);
    });
  });

  describe('IAM Roles', () => {
    test('DMS VPC role should exist with correct policy', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `dms-vpc-role-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: `dms-vpc-role-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const vpcPolicy = policiesResponse.AttachedPolicies?.find(
        (policy) => policy.PolicyName === 'AmazonDMSVPCManagementRole'
      );
      expect(vpcPolicy).toBeDefined();
    });

    test('DMS CloudWatch role should exist with correct policy', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `dms-cloudwatch-role-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: `dms-cloudwatch-role-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const cwPolicy = policiesResponse.AttachedPolicies?.find(
        (policy) => policy.PolicyName === 'AmazonDMSCloudWatchLogsRole'
      );
      expect(cwPolicy).toBeDefined();
    });

    test('RDS monitoring role should exist', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: `rds-monitoring-role-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: `rds-monitoring-role-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const monitoringPolicy = policiesResponse.AttachedPolicies?.find(
        (policy) => policy.PolicyName === 'AmazonRDSEnhancedMonitoringRole'
      );
      expect(monitoringPolicy).toBeDefined();
    });
  });
});
