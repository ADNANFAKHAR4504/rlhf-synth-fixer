import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeReplicationTasksCommand,
} from '@aws-sdk/client-database-migration-service';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let region: string;
  let outputs: Record<string, string>;
  let environmentSuffix: string;

  let rdsClient: RDSClient;
  let dmsClient: DatabaseMigrationServiceClient;
  let lambdaClient: LambdaClient;
  let cloudwatchClient: CloudWatchClient;
  let ec2Client: EC2Client;
  let secretsClient: SecretsManagerClient;

  beforeAll(() => {
    // Load outputs from CloudFormation deployment
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Get region and environment suffix from outputs
    region = outputs.Region || 'eu-west-2';
    environmentSuffix = outputs.EnvironmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Initialize AWS SDK clients with the deployed region
    rdsClient = new RDSClient({ region });
    dmsClient = new DatabaseMigrationServiceClient({ region });
    lambdaClient = new LambdaClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    ec2Client = new EC2Client({ region });
    secretsClient = new SecretsManagerClient({ region });

    console.log('Loaded stack outputs:', Object.keys(outputs));
    console.log(`Testing in region: ${region}, environment: ${environmentSuffix}`);
  });

  describe('Aurora MySQL Cluster', () => {
    test('Aurora cluster endpoint is valid', async () => {
      const writerEndpoint = outputs.AuroraClusterEndpoint;
      expect(writerEndpoint).toBeDefined();
      expect(writerEndpoint).toMatch(/^aurora-mysql-.*\.cluster-.*\.eu-west-2\.rds\.amazonaws\.com$/);
      expect(writerEndpoint).toContain(environmentSuffix);
    });

    test('Aurora cluster is running and accessible', async () => {
      const writerEndpoint = outputs.AuroraClusterEndpoint;
      // Extract cluster identifier from endpoint (e.g., aurora-mysql-pr6190)
      const clusterIdentifier = `aurora-mysql-${environmentSuffix}`;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toMatch(/^8\.0/);
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.EnabledCloudwatchLogsExports).toContain('error');
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.Endpoint).toBe(writerEndpoint);
    }, 30000);

    test('Aurora cluster has writer and reader instances', async () => {
      const clusterIdentifier = `aurora-mysql-${environmentSuffix}`;

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier],
          },
        ],
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(2);

      const instances = response.DBInstances!;
      const writerCount = instances.filter(
        (i) => i.DBInstanceIdentifier?.includes('writer')
      ).length;
      const readerCount = instances.filter(
        (i) => i.DBInstanceIdentifier?.includes('reader')
      ).length;

      expect(writerCount).toBe(1);
      expect(readerCount).toBe(1);

      instances.forEach((instance) => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.PerformanceInsightsEnabled).toBe(true);
      });
    }, 30000);
  });

  describe('DMS Replication', () => {
    test('DMS replication instance is available', async () => {
      const replicationInstanceId = `dms-replication-${environmentSuffix}`;

      const command = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-id',
            Values: [replicationInstanceId],
          },
        ],
      });

      const response = await dmsClient.send(command);
      expect(response.ReplicationInstances).toBeDefined();
      expect(response.ReplicationInstances!.length).toBe(1);

      const instance = response.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toBe('available');
      expect(instance.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(instance.MultiAZ).toBe(false);
      expect(instance.PubliclyAccessible).toBe(false);
      expect(instance.ReplicationInstanceIdentifier).toBe(replicationInstanceId);
    }, 30000);

    test('DMS migration task is configured for full-load-and-cdc', async () => {
      const taskArn = outputs.DmsTaskArn;
      expect(taskArn).toBeDefined();

      const command = new DescribeReplicationTasksCommand({
        Filters: [
          {
            Name: 'replication-task-arn',
            Values: [taskArn],
          },
        ],
      });

      const response = await dmsClient.send(command);
      expect(response.ReplicationTasks).toBeDefined();
      expect(response.ReplicationTasks!.length).toBe(1);

      const task = response.ReplicationTasks![0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
      expect(task.TableMappings).toBeDefined();

      const tableMappings = JSON.parse(task.TableMappings!);
      expect(tableMappings.rules).toBeDefined();
      expect(tableMappings.rules.length).toBeGreaterThan(0);

      const selectionRule = tableMappings.rules.find(
        (r: any) => r['rule-type'] === 'selection'
      );
      expect(selectionRule).toBeDefined();
      expect(selectionRule['rule-action']).toBe('include');
    }, 30000);
  });

  describe('Lambda Validation Function', () => {
    test('Validation Lambda function exists and is configured', async () => {
      const functionArn = outputs.ValidationLambdaArn;
      expect(functionArn).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();

      const config = response.Configuration!;
      expect(config.Runtime).toBe('python3.11');
      expect(config.Handler).toBe('index.handler');
      expect(config.Timeout).toBe(300);
      expect(config.MemorySize).toBe(512);

      expect(config.VpcConfig).toBeDefined();
      expect(config.VpcConfig!.SubnetIds).toBeDefined();
      expect(config.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(config.VpcConfig!.SecurityGroupIds).toBeDefined();

      expect(config.Environment).toBeDefined();
      expect(config.Environment!.Variables).toBeDefined();
      expect(config.Environment!.Variables!.SOURCE_SECRET_ARN).toBeDefined();
      expect(config.Environment!.Variables!.TARGET_SECRET_ARN).toBeDefined();
      expect(config.Environment!.Variables!.SOURCE_HOST).toBeDefined();
      expect(config.Environment!.Variables!.TARGET_HOST).toBeDefined();
    }, 30000);

  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms are configured for DMS', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `dms-task-failure-${environmentSuffix}`,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();

      const dmsAlarm = response.MetricAlarms!.find((a) =>
        a.AlarmName?.includes('dms-task-failure')
      );
      expect(dmsAlarm).toBeDefined();
      expect(dmsAlarm!.Namespace).toBe('AWS/DMS');
    }, 30000);

    test('Aurora replication lag alarm is configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-replication-lag-${environmentSuffix}`,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();

      const lagAlarm = response.MetricAlarms!.find((a) =>
        a.AlarmName?.includes('aurora-replication-lag')
      );
      expect(lagAlarm).toBeDefined();
      expect(lagAlarm!.EvaluationPeriods).toBe(2);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('Database secrets exist and are accessible', async () => {
      // Target secret name from the stack configuration
      const targetSecretName = `prod/aurora/mysql/credentials-${environmentSuffix}`;

      const command = new GetSecretValueCommand({
        SecretId: targetSecretName,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.username).toBe('admin');
      expect(secret.password.length).toBeGreaterThan(20);
    }, 30000);

    test('Source database secret exists', async () => {
      const sourceSecretName = `dev/rds/mysql/credentials-${environmentSuffix}`;

      const command = new GetSecretValueCommand({
        SecretId: sourceSecretName,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBe('admin');
      expect(secret.password).toBeDefined();
    }, 30000);
  });

  describe('VPC Configuration', () => {
    test('VPCs are created and configured', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThanOrEqual(2);

      response.Vpcs!.forEach((vpc) => {
        expect(vpc.State).toBe('available');
        expect(vpc.CidrBlock).toBeDefined();
      });
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('DMS VPC Role exists', () => {
      expect(outputs.DmsVpcRoleArn).toBeDefined();
      expect(outputs.DmsVpcRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.DmsVpcRoleArn).toContain(`dms-vpc-role-${environmentSuffix}`);
    });

    test('Rotation Lambda exists', () => {
      expect(outputs.RotationLambdaARN).toBeDefined();
      expect(outputs.RotationLambdaARN).toMatch(/^arn:aws:lambda:/);
      expect(outputs.RotationLambdaARN).toContain(region);
      expect(outputs.RotationLambdaARN).toContain('MySQLSingleUser');
    });
  });

  describe('End-to-End Migration Workflow', () => {
    test('All components are ready for migration', async () => {
      // Aurora cluster available
      const clusterIdentifier = `aurora-mysql-${environmentSuffix}`;
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      expect(clusterResponse.DBClusters![0].Status).toBe('available');

      // DMS instance available
      const replicationInstanceId = `dms-replication-${environmentSuffix}`;
      const instanceCommand = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-id',
            Values: [replicationInstanceId],
          },
        ],
      });
      const instanceResponse = await dmsClient.send(instanceCommand);
      expect(
        instanceResponse.ReplicationInstances![0].ReplicationInstanceStatus
      ).toBe('available');

      // DMS task exists (from outputs)
      const taskArn = outputs.DmsTaskArn;
      const taskCommand = new DescribeReplicationTasksCommand({
        Filters: [
          {
            Name: 'replication-task-arn',
            Values: [taskArn],
          },
        ],
      });
      const taskResponse = await dmsClient.send(taskCommand);
      expect(taskResponse.ReplicationTasks![0]).toBeDefined();

      // Validation Lambda ready (from outputs)
      const functionArn = outputs.ValidationLambdaArn;
      const functionCommand = new GetFunctionCommand({
        FunctionName: functionArn,
      });
      const functionResponse = await lambdaClient.send(functionCommand);
      expect(functionResponse.Configuration!.State).toBe('Active');
    }, 60000);

    test('Stack outputs are complete and valid', () => {
      // Validate all required outputs exist
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.DmsTaskArn).toBeDefined();
      expect(outputs.ValidationLambdaArn).toBeDefined();
      expect(outputs.DmsVpcRoleArn).toBeDefined();
      expect(outputs.RotationLambdaARN).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.Region).toBe(region);

      // Validate output formats
      expect(outputs.AuroraClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.DmsTaskArn).toMatch(/^arn:aws:dms:/);
      expect(outputs.ValidationLambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.DmsVpcRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.RotationLambdaARN).toMatch(/^arn:aws:lambda:/);
    });
  });
});
