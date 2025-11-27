import fs from 'fs';
import path from 'path';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeGlobalClustersCommand,
} from '@aws-sdk/client-rds';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  Route53Client,
  ListHealthChecksCommand,
  GetHealthCheckCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

describe('Aurora Global Database Integration Tests', () => {
  let outputs: any;
  let rdsClient: RDSClient;
  let kmsClient: KMSClient;
  let lambdaClient: LambdaClient;
  let route53Client: Route53Client;
  let cloudwatchClient: CloudWatchClient;

  beforeAll(() => {
    // Initialize AWS SDK clients
    rdsClient = new RDSClient({ region });
    kmsClient = new KMSClient({ region });
    lambdaClient = new LambdaClient({ region });
    route53Client = new Route53Client({ region });
    cloudwatchClient = new CloudWatchClient({ region });

    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      console.warn('⚠️  Warning: cfn-outputs/flat-outputs.json not found. Skipping integration tests that require deployment outputs.');
      outputs = {};
    }
  });

  describe('Deployment Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('⚠️  Skipping: No deployment outputs available');
        return;
      }

      const requiredOutputs = [
        'GlobalClusterId',
        'PrimaryClusterId',
        'PrimaryClusterEndpoint',
        'PrimaryClusterReaderEndpoint',
        'PrimaryClusterPort',
        'PrimaryKMSKeyId',
        'PrimaryKMSKeyArn',
        'HealthCheckFunctionArn',
        'AuroraSecurityGroupId',
        'DBClusterParameterGroupName',
        'DNSEndpoint',
        'ReaderDNSEndpoint',
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs).toHaveProperty(outputKey);
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('stack outputs should include environmentSuffix', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('⚠️  Skipping: No deployment outputs available');
        return;
      }

      const outputsStr = JSON.stringify(outputs);
      expect(outputsStr).toMatch(new RegExp(environmentSuffix, 'i'));
    });
  });

  describe('Global Cluster Validation', () => {
    test('should have a valid Global Cluster', async () => {
      if (!outputs.GlobalClusterId) {
        console.warn('⚠️  Skipping: Global Cluster ID not available');
        return;
      }

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterId,
      });

      const response = await rdsClient.send(command);
      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters).toHaveLength(1);

      const globalCluster = response.GlobalClusters![0];
      expect(globalCluster.GlobalClusterIdentifier).toBe(outputs.GlobalClusterId);
      expect(globalCluster.Engine).toBe('aurora-mysql');
      expect(globalCluster.StorageEncrypted).toBe(true);
    }, 30000);

    test('Global Cluster should have at least one primary region', async () => {
      if (!outputs.GlobalClusterId) {
        console.warn('⚠️  Skipping: Global Cluster ID not available');
        return;
      }

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterId,
      });

      const response = await rdsClient.send(command);
      const globalCluster = response.GlobalClusters![0];

      expect(globalCluster.GlobalClusterMembers).toBeDefined();
      expect(globalCluster.GlobalClusterMembers!.length).toBeGreaterThanOrEqual(1);

      const primaryMembers = globalCluster.GlobalClusterMembers!.filter(
        (member: any) => member.IsWriter
      );
      expect(primaryMembers.length).toBe(1);
    }, 30000);
  });

  describe('Primary Cluster Validation', () => {
    test('should have a valid Primary Cluster', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterId,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.DBClusterIdentifier).toBe(outputs.PrimaryClusterId);
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.Status).toBe('available');
    }, 30000);

    test('Primary Cluster should have correct configuration', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      // Check encryption
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();

      // Check backup retention (7 days as per template)
      expect(cluster.BackupRetentionPeriod).toBe(7);

      // Check CloudWatch logs
      expect(cluster.EnabledCloudwatchLogsExports).toContain('slowquery');
      expect(cluster.EnabledCloudwatchLogsExports).toContain('error');

      // Check IAM authentication
      expect(cluster.IAMDatabaseAuthenticationEnabled).toBe(true);
    }, 30000);

    test('Primary Cluster should have valid endpoints', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.Endpoint).toBeDefined();
      expect(cluster.Endpoint).toBe(outputs.PrimaryClusterEndpoint);

      expect(cluster.ReaderEndpoint).toBeDefined();
      expect(cluster.ReaderEndpoint).toBe(outputs.PrimaryClusterReaderEndpoint);

      expect(cluster.Port).toBeDefined();
      expect(cluster.Port).toBe(parseInt(outputs.PrimaryClusterPort));
    }, 30000);
  });

  describe('DB Instances Validation', () => {
    test('should have at least 2 DB instances in primary cluster', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.PrimaryClusterId],
          },
        ],
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('DB instances should have correct configuration', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.PrimaryClusterId],
          },
        ],
      });

      const response = await rdsClient.send(command);
      const instances = response.DBInstances!;

      instances.forEach(instance => {
        expect(instance.Engine).toBe('aurora-mysql');
        expect(instance.DBInstanceClass).toBe('db.r5.large');
        expect(instance.PubliclyAccessible).toBe(false);
        expect(instance.PerformanceInsightsEnabled).toBe(true);
        expect(instance.MonitoringInterval).toBe(60);
      });
    }, 30000);
  });

  describe('KMS Key Validation', () => {
    test('should have a valid KMS key for primary region', async () => {
      if (!outputs.PrimaryKMSKeyId) {
        console.warn('⚠️  Skipping: KMS Key ID not available');
        return;
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.PrimaryKMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    }, 30000);

    test('KMS key should have rotation enabled', async () => {
      if (!outputs.PrimaryKMSKeyId) {
        console.warn('⚠️  Skipping: KMS Key ID not available');
        return;
      }

      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.PrimaryKMSKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('Lambda Health Check Validation', () => {
    test('should have a valid health check Lambda function', async () => {
      if (!outputs.HealthCheckFunctionArn) {
        console.warn('⚠️  Skipping: Health Check Function ARN not available');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.HealthCheckFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Timeout).toBe(5);
      expect(response.Configuration!.MemorySize).toBe(256);
    }, 30000);

    test('Lambda function should have correct environment variables', async () => {
      if (!outputs.HealthCheckFunctionArn) {
        console.warn('⚠️  Skipping: Health Check Function ARN not available');
        return;
      }

      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.HealthCheckFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();

      const envVars = response.Environment!.Variables!;
      expect(envVars).toHaveProperty('CLUSTER_ID');
      expect(envVars).toHaveProperty('REGION');
      expect(envVars).toHaveProperty('ENVIRONMENT_SUFFIX');

      expect(envVars.CLUSTER_ID).toBe(outputs.PrimaryClusterId);
      expect(envVars.REGION).toBe(region);
    }, 30000);

    test('Lambda function should be in VPC', async () => {
      if (!outputs.HealthCheckFunctionArn) {
        console.warn('⚠️  Skipping: Health Check Function ARN not available');
        return;
      }

      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.HealthCheckFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBeDefined();
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('CloudWatch Alarms Validation', () => {
    test('should have replication lag alarm', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-replication-lag-${environmentSuffix}`,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('AuroraGlobalDBReplicationLag');
      expect(alarm.Threshold).toBe(1000);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);

    test('should have cluster health alarm', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-cluster-health-primary-${environmentSuffix}`,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('ClusterHealth');
      expect(alarm.Namespace).toBe('Aurora/HealthCheck');
      expect(alarm.Threshold).toBe(0.5);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    }, 30000);
  });

  describe('DNS Endpoints Validation', () => {
    test('should have DNS endpoint outputs', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('⚠️  Skipping: No deployment outputs available');
        return;
      }

      expect(outputs.DNSEndpoint).toBeDefined();
      expect(outputs.ReaderDNSEndpoint).toBeDefined();
      expect(outputs.ReaderDNSEndpoint).toContain('reader.');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource identifiers should include environmentSuffix', async () => {
      if (!outputs.PrimaryClusterId) {
        console.warn('⚠️  Skipping: Primary Cluster ID not available');
        return;
      }

      // Check cluster ID includes suffix
      expect(outputs.PrimaryClusterId).toContain(environmentSuffix);

      // Check global cluster ID includes suffix
      if (outputs.GlobalClusterId) {
        expect(outputs.GlobalClusterId).toContain(environmentSuffix);
      }

      // Check parameter group name includes suffix
      if (outputs.DBClusterParameterGroupName) {
        expect(outputs.DBClusterParameterGroupName).toContain(environmentSuffix);
      }
    });

    test('Lambda function name should include environmentSuffix', async () => {
      if (!outputs.HealthCheckFunctionArn) {
        console.warn('⚠️  Skipping: Health Check Function ARN not available');
        return;
      }

      expect(outputs.HealthCheckFunctionArn).toContain(environmentSuffix);
    });
  });
});
