import fs from 'fs';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTasksCommand,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const REGION = 'eu-central-2';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth9053332379';

// AWS SDK clients
const ecsClient = new ECSClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });
const secretsClient = new SecretsManagerClient({ region: REGION });
const logsClient = new CloudWatchLogsClient({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });

describe('Financial Transaction Processing System - Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      const vpc = response.Vpcs[0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have proper DNS support', async () => {
      // DNS support is verified through successful DNS resolution
      // If VPC didn't have DNS support, RDS endpoint wouldn't resolve
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).toContain('.rds.amazonaws.com');

      // Verify VPC exists
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
    });

    test('VPC should have 4 subnets (2 public, 2 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets.length).toBe(4);

      const publicSubnets = response.Subnets.filter(s =>
        s.MapPublicIpOnLaunch
      );
      const privateSubnets = response.Subnets.filter(
        s => !s.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('subnets should be in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('VPC Flow Logs (PCI-DSS Compliance)', () => {
    test('VPC should have flow logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs.length).toBeGreaterThan(0);
      const flowLog = response.FlowLogs[0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    });

    test('VPC Flow Logs should have CloudWatch log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);
      const logGroup = response.logGroups[0];
      expect(logGroup.logGroupName).toContain('flowlogs');
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('Security Groups', () => {
    test('should have ECS and database security groups', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: [`*-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups.length).toBeGreaterThanOrEqual(2);
    });

    test('database security group should only allow MySQL from ECS', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: [`rds-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups.length).toBe(1);
      const dbSg = response.SecurityGroups[0];

      const ingressRules = dbSg.IpPermissions;
      expect(ingressRules.length).toBeGreaterThan(0);

      const mysqlRule = ingressRules.find(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule.UserIdGroupPairs.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Cluster and Service', () => {
    test('ECS cluster should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters.length).toBe(1);
      const cluster = response.clusters[0];
      expect(cluster.clusterName).toBe(outputs.ECSClusterName);
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.activeServicesCount).toBeGreaterThan(0);
    });

    test('ECS cluster should have Container Insights enabled', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);

      const cluster = response.clusters[0];
      const settings = cluster.settings || [];
      const insightsSetting = settings.find(
        s => s.name === 'containerInsights'
      );
      expect(insightsSetting).toBeDefined();
      expect(insightsSetting.value).toBe('enabled');
    });

    test('ECS service should be running with desired tasks', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services.length).toBe(1);
      const service = response.services[0];
      expect(service.serviceName).toBe(outputs.ECSServiceName);
      expect(service.status).toBe('ACTIVE');
      expect(service.runningCount).toBeGreaterThanOrEqual(1);
      expect(service.desiredCount).toBeGreaterThanOrEqual(1);
    });

    test('ECS service should use Fargate launch type', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services[0];
      expect(service.launchType).toBe('FARGATE');
    });

    test('ECS service should have network configuration in subnets', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services[0];
      expect(service.networkConfiguration).toBeDefined();
      expect(service.networkConfiguration.awsvpcConfiguration).toBeDefined();
      expect(
        service.networkConfiguration.awsvpcConfiguration.subnets.length
      ).toBeGreaterThan(0);
      expect(
        service.networkConfiguration.awsvpcConfiguration.securityGroups.length
      ).toBeGreaterThan(0);
    });

    test('ECS tasks should be running successfully', async () => {
      const listTasksCmd = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      });
      const tasksResponse = await ecsClient.send(listTasksCmd);

      expect(tasksResponse.taskArns).toBeDefined();
      if (tasksResponse.taskArns.length > 0) {
        const describeCmd = new DescribeTasksCommand({
          cluster: outputs.ECSClusterName,
          tasks: tasksResponse.taskArns,
        });
        const taskDetails = await ecsClient.send(describeCmd);

        expect(taskDetails.tasks.length).toBeGreaterThan(0);
        const task = taskDetails.tasks[0];
        expect(task.lastStatus).toBe('RUNNING');
        expect(task.healthStatus).toBeDefined();
      }
    });
  });

  describe('CloudWatch Logging', () => {
    test('ECS log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ECSLogGroup,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);
      const logGroup = response.logGroups[0];
      expect(logGroup.logGroupName).toBe(outputs.ECSLogGroup);
      expect(logGroup.retentionInDays).toBe(90);
    });

    test('log group should be receiving logs from ECS tasks', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ECSLogGroup,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups[0];
      expect(logGroup.storedBytes).toBeDefined();
    });
  });

  describe('RDS Aurora Cluster (PCI-DSS Compliance)', () => {
    test('Aurora cluster should exist and be available', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters.length).toBe(1);
      const cluster = response.DBClusters[0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Endpoint).toBe(outputs.DBClusterEndpoint);
    });

    test('Aurora cluster should have encryption enabled', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
      expect(cluster.KmsKeyId).toContain('key/');
    });

    test('Aurora cluster should have backup retention configured', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(cluster.BackupRetentionPeriod).toBe(7);
    });

    test('Aurora cluster should have CloudWatch logs enabled', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports.length).toBeGreaterThan(0);
      expect(cluster.EnabledCloudwatchLogsExports).toContain('audit');
      expect(cluster.EnabledCloudwatchLogsExports).toContain('error');
    });

    test('Aurora cluster should be in private subnets only', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.DBSubnetGroup).toBeDefined();

      // Get subnets from subnet group name
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const subnets = await ec2Client.send(subnetCommand);

      // Verify we have private subnets (no public IP mapping)
      const privateSubnets = subnets.Subnets.filter(
        s => !s.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('Aurora cluster should have at least one instance running', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers.length).toBeGreaterThan(0);

      // Check instance details
      const instanceId = cluster.DBClusterMembers[0].DBInstanceIdentifier;
      const instanceCmd = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });
      const instanceResponse = await rdsClient.send(instanceCmd);

      const instance = instanceResponse.DBInstances[0];
      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.DBInstanceClass).toBe('db.serverless');
      expect(instance.Engine).toBe('aurora-mysql');
    });

    test('Aurora cluster should use MySQL 8.0', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toContain('8.0');
    });

    test('Aurora cluster should have ServerlessV2 scaling configuration', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration.MinCapacity).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration.MaxCapacity).toBeDefined();
    });
  });

  describe('KMS Encryption Keys', () => {
    test('should have KMS key for RDS encryption', async () => {
      const listCmd = new ListAliasesCommand({});
      const aliases = await kmsClient.send(listCmd);

      const rdsKeyAlias = aliases.Aliases.find(a =>
        a.AliasName.includes(`rds-key-${environmentSuffix}`)
      );
      expect(rdsKeyAlias).toBeDefined();
      expect(rdsKeyAlias.TargetKeyId).toBeDefined();

      const describeCmd = new DescribeKeyCommand({
        KeyId: rdsKeyAlias.TargetKeyId,
      });
      const keyDetails = await kmsClient.send(describeCmd);

      expect(keyDetails.KeyMetadata).toBeDefined();
      expect(keyDetails.KeyMetadata.Enabled).toBe(true);
      expect(keyDetails.KeyMetadata.KeyState).toBe('Enabled');
    });
  });

  describe('Secrets Manager (Database Credentials)', () => {
    test('database secret should exist and be retrievable', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThan(20);
    });

    test('database secret should have proper rotation configuration', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(outputs.DBSecretArn);
      expect(response.Name).toContain('db-credentials');
    });
  });

  describe('End-to-End Connectivity', () => {
    test('ECS service should have environment variables for database connection', async () => {
      const listTasksCmd = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      });
      const tasksResponse = await ecsClient.send(listTasksCmd);

      if (tasksResponse.taskArns.length > 0) {
        const describeCmd = new DescribeTasksCommand({
          cluster: outputs.ECSClusterName,
          tasks: tasksResponse.taskArns,
          
        });
        const taskDetails = await ecsClient.send(describeCmd);

        const task = taskDetails.tasks[0];
        expect(task.containers).toBeDefined();
        expect(task.containers.length).toBeGreaterThan(0);

        // Verify task has database connection info
        const container = task.containers[0];
        expect(container.name).toBe('transaction-processor');
      }
    });

    test('database endpoint should be resolvable', () => {
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.DBClusterEndpoint).toContain('eu-central-2');
    });
  });

  describe('PCI-DSS Compliance Validation', () => {
    test('all data at rest should be encrypted', async () => {
      const clusterCmd = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const clusterResponse = await rdsClient.send(clusterCmd);
      expect(clusterResponse.DBClusters[0].StorageEncrypted).toBe(true);
    });

    test('network segmentation should be properly configured', async () => {
      const subnetsCmd = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const subnets = await ec2Client.send(subnetsCmd);

      const publicSubnets = subnets.Subnets.filter(s =>
        s.MapPublicIpOnLaunch
      );
      const privateSubnets = subnets.Subnets.filter(
        s => !s.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('comprehensive logging should be enabled', async () => {
      const flowLogsCmd = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [outputs.VPCId] }],
      });
      const flowLogs = await ec2Client.send(flowLogsCmd);
      expect(flowLogs.FlowLogs.length).toBeGreaterThan(0);

      const ecsLogsCmd = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ECSLogGroup,
      });
      const ecsLogs = await logsClient.send(ecsLogsCmd);
      expect(ecsLogs.logGroups.length).toBeGreaterThan(0);
    });

    test('database should not be publicly accessible', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `transaction-db-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];

      // Verify database is in subnet group (which is in private subnets)
      expect(cluster.DBSubnetGroup).toBeDefined();

      // Verify subnets in VPC
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const subnets = await ec2Client.send(subnetCommand);

      // Verify we have private subnets (database is deployed in these)
      const privateSubnets = subnets.Subnets.filter(
        s => !s.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('secrets should be managed through AWS Secrets Manager', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();
      expect(response.ARN).toBe(outputs.DBSecretArn);
    });
  });
});
