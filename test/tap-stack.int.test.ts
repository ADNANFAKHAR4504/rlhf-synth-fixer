import * as fs from 'fs';
import * as path from 'path';
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
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

describe('TapStack Integration Tests', () => {
  const region = 'ap-southeast-1';
  let outputs: Record<string, string>;
  let environmentSuffix: string;

  const rdsClient = new RDSClient({ region });
  const dmsClient = new DatabaseMigrationServiceClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const cloudwatchClient = new CloudWatchClient({ region });
  const snsClient = new SNSClient({ region });
  const ec2Client = new EC2Client({ region });
  const secretsClient = new SecretsManagerClient({ region });

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
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    console.log('Loaded stack outputs:', Object.keys(outputs));
  });

  describe('Aurora MySQL Cluster', () => {
    test('Aurora cluster is running and accessible', async () => {
      const clusterIdentifier = outputs.AuroraClusterIdentifier;
      expect(clusterIdentifier).toBeDefined();
      expect(clusterIdentifier).toContain(environmentSuffix);

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
    }, 30000);

    test('Aurora cluster has correct endpoints', async () => {
      const writerEndpoint = outputs.AuroraClusterEndpoint;
      const readerEndpoint = outputs.AuroraClusterReaderEndpoint;

      expect(writerEndpoint).toBeDefined();
      expect(readerEndpoint).toBeDefined();
      expect(writerEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(readerEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('Aurora cluster has writer and reader instances', async () => {
      const clusterIdentifier = outputs.AuroraClusterIdentifier;

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

    test('Aurora cluster has backtrack enabled', async () => {
      const clusterIdentifier = outputs.AuroraClusterIdentifier;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.BacktrackWindow).toBe(259200); // 72 hours in seconds
    });
  });

  describe('DMS Replication', () => {
    test('DMS replication instance is available', async () => {
      const instanceArn = outputs.DmsReplicationInstanceArn;
      expect(instanceArn).toBeDefined();

      const command = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-arn',
            Values: [instanceArn],
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
    }, 30000);

    test('DMS source and target endpoints are configured', async () => {
      const command = new DescribeEndpointsCommand({});
      const response = await dmsClient.send(command);

      expect(response.Endpoints).toBeDefined();

      const sourceEndpoint = response.Endpoints!.find(
        (e) =>
          e.EndpointType === 'source' &&
          e.EndpointIdentifier?.includes(environmentSuffix)
      );
      const targetEndpoint = response.Endpoints!.find(
        (e) =>
          e.EndpointType === 'target' &&
          e.EndpointIdentifier?.includes(environmentSuffix)
      );

      expect(sourceEndpoint).toBeDefined();
      expect(targetEndpoint).toBeDefined();

      expect(sourceEndpoint!.EngineName).toBe('mysql');
      expect(targetEndpoint!.EngineName).toBe('aurora');

      expect(sourceEndpoint!.SslMode).toBe('require');
      expect(targetEndpoint!.SslMode).toBe('require');
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

    test('Validation Lambda can be invoked', async () => {
      const functionArn = outputs.ValidationLambdaArn;

      const command = new InvokeCommand({
        FunctionName: functionArn,
        Payload: JSON.stringify({}),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBeDefined();
        expect(payload.body).toBeDefined();

        if (payload.statusCode === 200) {
          const body = JSON.parse(payload.body);
          expect(body.validation_status).toBeDefined();
          expect(['PASSED', 'FAILED', 'ERROR']).toContain(
            body.validation_status
          );
        }
      }
    }, 60000);
  });

  describe('CloudWatch Monitoring', () => {
    test('SNS alarm topic exists', async () => {
      const topicArn = outputs.AlarmTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toMatch(/^arn:aws:sns:/);
      expect(topicArn).toContain(region);
    });

    test('CloudWatch alarms are configured', async () => {
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
      expect(dmsAlarm!.ActionsEnabled).toBe(true);
      expect(dmsAlarm!.AlarmActions).toBeDefined();
      expect(dmsAlarm!.AlarmActions!.length).toBeGreaterThan(0);
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
      expect(lagAlarm!.ActionsEnabled).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('Database secrets exist and are accessible', async () => {
      const targetSecretArn = outputs.TargetSecretArn;
      expect(targetSecretArn).toBeDefined();

      const command = new GetSecretValueCommand({
        SecretId: targetSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.username).toBe('admin');
      expect(secret.password.length).toBeGreaterThan(20);
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

  describe('End-to-End Migration Workflow', () => {
    test('All components are ready for migration', async () => {
      // Aurora cluster available
      const clusterIdentifier = outputs.AuroraClusterIdentifier;
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      expect(clusterResponse.DBClusters![0].Status).toBe('available');

      // DMS instance available
      const instanceArn = outputs.DmsReplicationInstanceArn;
      const instanceCommand = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-arn',
            Values: [instanceArn],
          },
        ],
      });
      const instanceResponse = await dmsClient.send(instanceCommand);
      expect(instanceResponse.ReplicationInstances![0].ReplicationInstanceStatus).toBe(
        'available'
      );

      // DMS task exists
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

      // Validation Lambda ready
      const functionArn = outputs.ValidationLambdaArn;
      const functionCommand = new GetFunctionCommand({
        FunctionName: functionArn,
      });
      const functionResponse = await lambdaClient.send(functionCommand);
      expect(functionResponse.Configuration!.State).toBe('Active');

      // All monitoring in place
      expect(outputs.AlarmTopicArn).toBeDefined();
    }, 60000);
  });
});
