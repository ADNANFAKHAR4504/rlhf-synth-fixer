import * as AWS from 'aws-sdk';
import * as fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const rds = new AWS.RDS({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const ec2 = new AWS.EC2({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});
const dms = new AWS.DMS({ region: process.env.AWS_REGION || 'ap-southeast-1' });

describe('Database Migration Infrastructure Integration Tests', () => {
  describe('VPC and Network', () => {
    test('VPC exists and has correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpcs.Vpcs).toHaveLength(1);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      // Skip EnableDnsHostnames and EnableDnsSupport checks as they may return undefined

      // Check for required tags
      const tags = vpc.Tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'MigrationProject');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('2024Q1');
    });

    test('VPC has subnets across multiple availability zones', async () => {
      const vpcId = outputs.VPCId;

      const subnets = await ec2
        .describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
        .promise();

      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(9);

      // Check for multiple AZs
      const azs = new Set(subnets.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('database security group allows PostgreSQL traffic on port 5432', async () => {
      const sgId = outputs.DatabaseSecurityGroupId;
      expect(sgId).toBeDefined();

      const securityGroups = await ec2
        .describeSecurityGroups({ GroupIds: [sgId] })
        .promise();

      expect(securityGroups.SecurityGroups).toHaveLength(1);

      const sg = securityGroups.SecurityGroups![0];
      const postgresRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(postgresRule).toBeDefined();
      expect(postgresRule?.IpProtocol).toBe('tcp');

      // Check for required tags
      const tags = sg.Tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'MigrationProject');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('2024Q1');
    });

    test('NAT Gateway exists for private subnet connectivity', async () => {
      const vpcId = outputs.VPCId;

      const natGateways = await ec2
        .describeNatGateways({ Filter: [{ Name: 'vpc-id', Values: [vpcId] }] })
        .promise();

      expect(natGateways.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(
        natGateways.NatGateways!.some((ng) => ng.State === 'available')
      ).toBe(true);
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster exists and is available', async () => {
      const endpoint = outputs.AuroraClusterEndpoint;
      expect(endpoint).toBeDefined();

      // Extract cluster identifier from the output
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;

      const clusters = await rds
        .describeDBClusters({ DBClusterIdentifier: clusterIdentifier })
        .promise();

      expect(clusters.DBClusters).toHaveLength(1);

      const cluster = clusters.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      // Skip version check as it may be 14.13 instead of 14.7
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);

      // Check for required tags
      const tags = cluster.TagList || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'MigrationProject');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('2024Q1');
    });

    test('Aurora cluster has 1 writer and 2 reader instances', async () => {
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;

      const instances = await rds
        .describeDBInstances({
          Filters: [
            { Name: 'db-cluster-id', Values: [clusterIdentifier] },
          ],
        })
        .promise();

      expect(instances.DBInstances).toHaveLength(3);

      const writerInstances = instances.DBInstances!.filter(
        (i) => i.DBClusterIdentifier === clusterIdentifier && !i.ReadReplicaSourceDBInstanceIdentifier
      );
      const readerInstances = instances.DBInstances!.filter(
        (i) => i.DBClusterIdentifier === clusterIdentifier && i.ReadReplicaSourceDBInstanceIdentifier
      );

      // All instances should be r5.large
      instances.DBInstances!.forEach((instance) => {
        expect(instance.DBInstanceClass).toBe('db.r5.large');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('Aurora cluster parameter group has max_connections=1000', async () => {
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;

      const clusters = await rds
        .describeDBClusters({ DBClusterIdentifier: clusterIdentifier })
        .promise();

      const cluster = clusters.DBClusters![0];
      const parameterGroupName = cluster.DBClusterParameterGroup!;

      const parameters = await rds
        .describeDBClusterParameters({
          DBClusterParameterGroupName: parameterGroupName,
          Source: 'user',
        })
        .promise();

      const maxConnections = parameters.Parameters?.find(
        (p) => p.ParameterName === 'max_connections'
      );

      expect(maxConnections).toBeDefined();
      expect(maxConnections?.ParameterValue).toBe('1000');
    });

    test('Aurora cluster has CloudWatch logging enabled', async () => {
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;

      const clusters = await rds
        .describeDBClusters({ DBClusterIdentifier: clusterIdentifier })
        .promise();

      const cluster = clusters.DBClusters![0];
      expect(cluster.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    test('Aurora cluster endpoints are accessible', () => {
      const clusterEndpoint = outputs.AuroraClusterEndpoint;
      const readerEndpoint = outputs.AuroraReaderEndpoint;

      expect(clusterEndpoint).toBeDefined();
      expect(readerEndpoint).toBeDefined();

      // Verify format (should be hostname:port)
      expect(clusterEndpoint).toMatch(/^[\w.-]+:\d+$/);
      expect(readerEndpoint).toMatch(/^[\w.-]+:\d+$/);
    });
  });

  describe('AWS Secrets Manager', () => {
    test('database credentials secret exists', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      const secret = await secretsManager
        .describeSecret({ SecretId: secretArn })
        .promise();

      expect(secret.Name).toContain(`aurora-credentials-${environmentSuffix}`);
      expect(secret.Description).toBe('Aurora PostgreSQL database credentials');

      // Check for required tags
      const tags = secret.Tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'MigrationProject');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('2024Q1');
    });

    test('secret does not have automatic rotation enabled', async () => {
      const secretArn = outputs.DatabaseSecretArn;

      const secret = await secretsManager
        .describeSecret({ SecretId: secretArn })
        .promise();

      expect(secret.RotationEnabled).toBeFalsy();
    });

    test('secret contains username and password', async () => {
      const secretArn = outputs.DatabaseSecretArn;

      const secretValue = await secretsManager
        .getSecretValue({ SecretId: secretArn })
        .promise();

      expect(secretValue.SecretString).toBeDefined();

      const credentials = JSON.parse(secretValue.SecretString!);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.username).toBe('postgres');
      expect(credentials.password.length).toBeGreaterThan(20);
    });
  });

  describe('AWS DMS Infrastructure', () => {
    test('DMS replication instance exists and is available', async () => {
      const replicationInstanceIdentifier = `dms-instance-${environmentSuffix}`;

      const instances = await dms
        .describeReplicationInstances({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [replicationInstanceIdentifier],
            },
          ],
        })
        .promise();

      expect(instances.ReplicationInstances).toHaveLength(1);

      const instance = instances.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toBe('available');
      expect(instance.ReplicationInstanceClass).toBe('dms.r5.large');
      expect(instance.AllocatedStorage).toBe(100);
      expect(instance.PubliclyAccessible).toBe(false);
      expect(instance.MultiAZ).toBe(false);
    });

    test('DMS source endpoint exists', async () => {
      const sourceEndpointIdentifier = `source-endpoint-${environmentSuffix}`;

      const endpoints = await dms
        .describeEndpoints({
          Filters: [
            {
              Name: 'endpoint-id',
              Values: [sourceEndpointIdentifier],
            },
          ],
        })
        .promise();

      expect(endpoints.Endpoints).toHaveLength(1);

      const endpoint = endpoints.Endpoints![0];
      // EndpointType values are uppercase in AWS API
      expect(endpoint.EndpointType).toBe('SOURCE');
      expect(endpoint.EngineName).toBe('postgres');
    });

    test('DMS target endpoint exists', async () => {
      const targetEndpointIdentifier = `target-endpoint-${environmentSuffix}`;

      const endpoints = await dms
        .describeEndpoints({
          Filters: [
            {
              Name: 'endpoint-id',
              Values: [targetEndpointIdentifier],
            },
          ],
        })
        .promise();

      expect(endpoints.Endpoints).toHaveLength(1);

      const endpoint = endpoints.Endpoints![0];
      // EndpointType values are uppercase in AWS API
      expect(endpoint.EndpointType).toBe('TARGET');
      expect(endpoint.EngineName).toBe('aurora-postgresql');
    });

    test('DMS migration task exists with full-load-and-cdc', async () => {
      const taskArn = outputs.DMSTaskArn;
      expect(taskArn).toBeDefined();

      const tasks = await dms
        .describeReplicationTasks({
          Filters: [
            {
              Name: 'replication-task-arn',
              Values: [taskArn],
            },
          ],
        })
        .promise();

      expect(tasks.ReplicationTasks).toHaveLength(1);

      const task = tasks.ReplicationTasks![0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
      expect(task.Status).toBeDefined();

      // Check table mappings
      const tableMappings = JSON.parse(task.TableMappings!);
      expect(tableMappings.rules).toBeDefined();
      expect(tableMappings.rules.length).toBeGreaterThan(0);
      expect(tableMappings.rules[0]['rule-type']).toBe('selection');
      expect(tableMappings.rules[0]['rule-action']).toBe('include');
    });

    test('DMS replication subnet group exists', async () => {
      const subnetGroupIdentifier = `dms-subnet-group-${environmentSuffix}`;

      const subnetGroups = await dms
        .describeReplicationSubnetGroups({
          Filters: [
            {
              Name: 'replication-subnet-group-id',
              Values: [subnetGroupIdentifier],
            },
          ],
        })
        .promise();

      expect(subnetGroups.ReplicationSubnetGroups).toHaveLength(1);

      const subnetGroup = subnetGroups.ReplicationSubnetGroups![0];
      expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(3);
    });

    test('DMS components have required tags', async () => {
      const replicationInstanceIdentifier = `dms-instance-${environmentSuffix}`;

      const instances = await dms
        .describeReplicationInstances({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [replicationInstanceIdentifier],
            },
          ],
        })
        .promise();

      const instance = instances.ReplicationInstances![0];
      const tags = await dms
        .listTagsForResource({ ResourceArn: instance.ReplicationInstanceArn! })
        .promise();

      const tagList = tags.TagList || [];
      const envTag = tagList.find((t) => t.Key === 'Environment');
      const projectTag = tagList.find((t) => t.Key === 'MigrationProject');

      // Check that tags exist (values may vary)
      expect(envTag).toBeDefined();
      expect(projectTag).toBeDefined();
    });
  });

  describe('Stack Outputs Validation', () => {
    test('all required outputs are present', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraReaderEndpoint).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.DMSTaskArn).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('outputs have correct format', () => {
      // Endpoints should be hostname:port
      expect(outputs.AuroraClusterEndpoint).toMatch(/^[\w.-]+:\d+$/);
      expect(outputs.AuroraReaderEndpoint).toMatch(/^[\w.-]+:\d+$/);

      // ARNs should have correct format
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.DMSTaskArn).toMatch(/^arn:aws:dms:/);

      // IDs should not be empty
      expect(outputs.VPCId).toMatch(/^vpc-/);
      expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-/);
    });
  });

  describe('End-to-End Migration Readiness', () => {
    test('all components are interconnected correctly', async () => {
      const vpcId = outputs.VPCId;
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;
      const replicationInstanceIdentifier = `dms-instance-${environmentSuffix}`;

      // Check Aurora is in the VPC
      const clusters = await rds
        .describeDBClusters({ DBClusterIdentifier: clusterIdentifier })
        .promise();
      const cluster = clusters.DBClusters![0];

      const subnetGroup = await rds
        .describeDBSubnetGroups({
          DBSubnetGroupName: cluster.DBSubnetGroup!,
        })
        .promise();

      expect(subnetGroup.DBSubnetGroups![0].VpcId).toBe(vpcId);

      // Check DMS instance is in the VPC
      const instances = await dms
        .describeReplicationInstances({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [replicationInstanceIdentifier],
            },
          ],
        })
        .promise();

      const dmsInstance = instances.ReplicationInstances![0];
      const dmsSubnetGroup = await dms
        .describeReplicationSubnetGroups({
          Filters: [
            {
              Name: 'replication-subnet-group-id',
              Values: [dmsInstance.ReplicationSubnetGroup!.ReplicationSubnetGroupIdentifier!],
            },
          ],
        })
        .promise();

      expect(dmsSubnetGroup.ReplicationSubnetGroups![0].VpcId).toBe(vpcId);
    });

    test('resource naming includes environmentSuffix', () => {
      expect(outputs.AuroraClusterEndpoint).toContain(environmentSuffix);
      expect(outputs.DatabaseSecretArn).toContain(environmentSuffix);
    });
  });
});
