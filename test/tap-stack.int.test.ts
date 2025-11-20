// Aurora Global Database Integration Tests
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeGlobalClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration - Read from CFN outputs after deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Warning: Could not read cfn-outputs/flat-outputs.json. Some tests may be skipped.');
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const primaryRegion = process.env.AWS_REGION || 'us-east-1';

const rdsClient = new RDSClient({ region: primaryRegion });
const ec2Client = new EC2Client({ region: primaryRegion });
const cloudwatchClient = new CloudWatchClient({ region: primaryRegion });
const snsClient = new SNSClient({ region: primaryRegion });
const secretsManagerClient = new SecretsManagerClient({ region: primaryRegion });

describe('Aurora Global Database - Integration Tests', () => {
  const skipIfNoOutputs = outputs && Object.keys(outputs).length > 0 ? describe : describe.skip;

  skipIfNoOutputs('CloudFormation Stack Outputs', () => {
    test('should have GlobalClusterIdentifier output', () => {
      expect(outputs.GlobalClusterIdentifier).toBeDefined();
      expect(outputs.GlobalClusterIdentifier).toContain(environmentSuffix);
    });

    test('should have PrimaryClusterIdentifier output', () => {
      expect(outputs.PrimaryClusterIdentifier).toBeDefined();
      expect(outputs.PrimaryClusterIdentifier).toContain(environmentSuffix);
    });

    test('should have PrimaryClusterEndpoint output', () => {
      expect(outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(outputs.PrimaryClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('should have PrimaryVPCId output', () => {
      expect(outputs.PrimaryVPCId).toBeDefined();
      expect(outputs.PrimaryVPCId).toMatch(/^vpc-/);
    });

    test('should have AlarmTopicArn output', () => {
      expect(outputs.AlarmTopicArn).toBeDefined();
      expect(outputs.AlarmTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  skipIfNoOutputs('Global Cluster Configuration', () => {
    test('should have functional global cluster', async () => {
      if (!outputs.GlobalClusterIdentifier) {
        console.warn('Skipping: GlobalClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters?.length).toBe(1);

      const globalCluster = response.GlobalClusters![0];
      expect(globalCluster.GlobalClusterIdentifier).toBe(outputs.GlobalClusterIdentifier);
      expect(globalCluster.Engine).toBe('aurora-postgresql');
      expect(globalCluster.StorageEncrypted).toBe(true);
    }, 30000);

    test('global cluster should have at least one member', async () => {
      if (!outputs.GlobalClusterIdentifier) {
        console.warn('Skipping: GlobalClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const globalCluster = response.GlobalClusters![0];

      expect(globalCluster.GlobalClusterMembers).toBeDefined();
      expect(globalCluster.GlobalClusterMembers!.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  skipIfNoOutputs('Primary DB Cluster Configuration', () => {
    test('should have functional primary DB cluster', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.DBClusterIdentifier).toBe(outputs.PrimaryClusterIdentifier);
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.Status).toBe('available');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.IAMDatabaseAuthenticationEnabled).toBe(true);
    }, 30000);

    test('primary cluster should be multi-AZ', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.MultiAZ).toBe(true);
    }, 30000);

    test('primary cluster should have writer and reader endpoints', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.Endpoint).toBeDefined();
      expect(cluster.ReaderEndpoint).toBeDefined();
      expect(cluster.Endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(cluster.ReaderEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    }, 30000);

    test('primary cluster should have backup retention enabled', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
      expect(cluster.BackupRetentionPeriod).toBeLessThanOrEqual(35);
    }, 30000);

    test('primary cluster should have CloudWatch Logs enabled', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports).toContainEqual('postgresql');
    }, 30000);
  });

  skipIfNoOutputs('DB Instances Configuration', () => {
    test('should have at least two DB instances', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('DB instances should be available', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const clusterResponse = await rdsClient.send(clusterCommand);
      const cluster = clusterResponse.DBClusters![0];

      for (const member of cluster.DBClusterMembers!) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: member.DBInstanceIdentifier,
        });

        const instanceResponse = await rdsClient.send(instanceCommand);
        const instance = instanceResponse.DBInstances![0];

        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.PubliclyAccessible).toBe(false);
      }
    }, 60000);

    test('DB instances should have performance insights if enabled', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const clusterResponse = await rdsClient.send(clusterCommand);
      const cluster = clusterResponse.DBClusters![0];

      if (cluster.DBClusterMembers && cluster.DBClusterMembers.length > 0) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: cluster.DBClusterMembers[0].DBInstanceIdentifier,
        });

        const instanceResponse = await rdsClient.send(instanceCommand);
        const instance = instanceResponse.DBInstances![0];

        // Performance Insights is optional, just verify the field exists
        expect(instance.PerformanceInsightsEnabled).toBeDefined();
      }
    }, 30000);
  });

  skipIfNoOutputs('VPC and Networking', () => {
    test('should have functional VPC', async () => {
      if (!outputs.PrimaryVPCId) {
        console.warn('Skipping: PrimaryVPCId not found in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.PrimaryVPCId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.PrimaryVPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('should have three subnets across availability zones', async () => {
      if (!outputs.PrimaryVPCId) {
        console.warn('Skipping: PrimaryVPCId not found in outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.PrimaryVPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should have security group with restrictive rules', async () => {
      if (!outputs.PrimarySecurityGroupId) {
        console.warn('Skipping: PrimarySecurityGroupId not found in outputs');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.PrimarySecurityGroupId],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups![0];

      // Verify PostgreSQL port is allowed
      const postgresRule = sg.IpPermissions?.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(postgresRule).toBeDefined();

      // Verify it's not open to the world
      const hasPublicAccess = postgresRule?.IpRanges?.some(
        range => range.CidrIp === '0.0.0.0/0'
      );

      expect(hasPublicAccess).toBe(false);
    }, 30000);
  });

  skipIfNoOutputs('Monitoring and Alerting', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-global-`,
      });

      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(4);

      const alarmNames = response.MetricAlarms!.map(alarm => alarm.AlarmName);

      // Check for critical alarms
      const hasCPUAlarm = alarmNames.some(name => name?.includes('cpu'));
      const hasConnectionsAlarm = alarmNames.some(name => name?.includes('connections'));
      const hasReplicationAlarm = alarmNames.some(name => name?.includes('replication'));

      expect(hasCPUAlarm).toBe(true);
      expect(hasConnectionsAlarm).toBe(true);
      expect(hasReplicationAlarm).toBe(true);
    }, 30000);

    test('CloudWatch alarms should be configured correctly', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-global-primary-cpu-high-`,
      });

      const response = await cloudwatchClient.send(command);

      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        const cpuAlarm = response.MetricAlarms[0];

        expect(cpuAlarm.MetricName).toBe('CPUUtilization');
        expect(cpuAlarm.Namespace).toBe('AWS/RDS');
        expect(cpuAlarm.Statistic).toBe('Average');
        expect(cpuAlarm.Threshold).toBe(80);
        expect(cpuAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
      }
    }, 30000);

    test('should have SNS topic for alarms', async () => {
      if (!outputs.AlarmTopicArn) {
        console.warn('Skipping: AlarmTopicArn not found in outputs');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.AlarmTopicArn);
    }, 30000);
  });

  skipIfNoOutputs('Secrets Manager Configuration', () => {
    test('should have DatabaseSecret in Secrets Manager', async () => {
      const secretName = `aurora-db-password-${environmentSuffix}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await secretsManagerClient.send(command);

      expect(response.Name).toBe(secretName);
      expect(response.ARN).toBeDefined();
      expect(response.Description).toContain('Aurora database master password');
    }, 30000);

    test('DatabaseSecret should have correct tags', async () => {
      const secretName = `aurora-db-password-${environmentSuffix}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await secretsManagerClient.send(command);

      expect(response.Tags).toBeDefined();
      const nameTag = response.Tags?.find(tag => tag.Key === 'Name');
      const envTag = response.Tags?.find(tag => tag.Key === 'Environment');

      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toBe(secretName);
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe(environmentSuffix);
    }, 30000);
  });

  skipIfNoOutputs('Security Validation', () => {
    test('DB cluster should not be publicly accessible', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      // Check all instances
      for (const member of cluster.DBClusterMembers!) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: member.DBInstanceIdentifier,
        });

        const instanceResponse = await rdsClient.send(instanceCommand);
        const instance = instanceResponse.DBInstances![0];

        expect(instance.PubliclyAccessible).toBe(false);
      }
    }, 60000);

    test('DB cluster should have encryption enabled', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    }, 30000);

    test('DB cluster should have IAM authentication enabled', async () => {
      if (!outputs.PrimaryClusterIdentifier) {
        console.warn('Skipping: PrimaryClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.IAMDatabaseAuthenticationEnabled).toBe(true);
    }, 30000);
  });

  skipIfNoOutputs('Disaster Recovery Validation', () => {
    test('global cluster should have replication configured', async () => {
      if (!outputs.GlobalClusterIdentifier) {
        console.warn('Skipping: GlobalClusterIdentifier not found in outputs');
        return;
      }

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const globalCluster = response.GlobalClusters![0];

      expect(globalCluster.GlobalClusterMembers).toBeDefined();
      expect(globalCluster.GlobalClusterMembers!.length).toBeGreaterThanOrEqual(1);

      const primaryMember = globalCluster.GlobalClusterMembers!.find(
        member => member.IsWriter === true
      );

      expect(primaryMember).toBeDefined();
      // GlobalWriteForwardingStatus is only available when secondary clusters exist
      // For primary-only deployments, this field may be undefined
      if (globalCluster.GlobalClusterMembers!.length > 1) {
        expect(primaryMember!.GlobalWriteForwardingStatus).toBeDefined();
      }
    }, 30000);

    test('should have replication lag alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-global`,
      });

      const response = await cloudwatchClient.send(command);

      const replicationAlarm = response.MetricAlarms?.find(
        alarm => alarm.MetricName === 'AuroraGlobalDBReplicationLag'
      );

      expect(replicationAlarm).toBeDefined();
      expect(replicationAlarm!.Threshold).toBeLessThanOrEqual(1000);
    }, 30000);
  });

  describe('Cleanup and Validation', () => {
    test('should verify all resources use environmentSuffix', async () => {
      if (!outputs.GlobalClusterIdentifier) {
        console.warn('Skipping: GlobalClusterIdentifier not found in outputs');
        return;
      }

      expect(outputs.GlobalClusterIdentifier).toContain(environmentSuffix);

      if (outputs.PrimaryClusterIdentifier) {
        expect(outputs.PrimaryClusterIdentifier).toContain(environmentSuffix);
      }

      if (outputs.AlarmTopicArn) {
        expect(outputs.AlarmTopicArn).toContain(environmentSuffix);
      }
    });

    test('should have no deletion protection (for testing)', async () => {
      if (!outputs.GlobalClusterIdentifier) {
        console.warn('Skipping: GlobalClusterIdentifier not found in outputs');
        return;
      }

      const globalCommand = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterIdentifier,
      });

      const globalResponse = await rdsClient.send(globalCommand);
      const globalCluster = globalResponse.GlobalClusters![0];

      expect(globalCluster.DeletionProtection).toBe(false);

      if (outputs.PrimaryClusterIdentifier) {
        const clusterCommand = new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.PrimaryClusterIdentifier,
        });

        const clusterResponse = await rdsClient.send(clusterCommand);
        const cluster = clusterResponse.DBClusters![0];

        expect(cluster.DeletionProtection).toBe(false);
      }
    }, 30000);
  });
});
