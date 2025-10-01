import * as fs from 'fs';
import * as path from 'path';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';

// Load the deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

// Configure AWS SDK clients
const region = 'us-west-2';
const secretsClient = new SecretsManagerClient({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const snsClient = new SNSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

describe('Infrastructure Integration Tests', () => {
  const testTimeout = 30000;

  describe('VPC and Networking', () => {
    test('VPC exists and is accessible', async () => {
      expect(outputs.VpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.30.0.0/16');
    }, testTimeout);

    test('Private subnets are configured correctly', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] }
        ]
      }));

      expect(response.Subnets).toHaveLength(2);
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock);
      expect(cidrBlocks).toContain('10.30.10.0/24');
      expect(cidrBlocks).toContain('10.30.20.0/24');

      // Verify subnets are private (no public IP assignment)
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBeFalsy();
      });
    }, testTimeout);

    test('Security group is configured for MySQL traffic', async () => {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
          { Name: 'group-name', Values: ['*DatabaseSecurityGroup*'] }
        ]
      }));

      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      const sg = response.SecurityGroups![0];

      // Check ingress rules
      const mysqlRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.IpProtocol).toBe('tcp');
    }, testTimeout);
  });

  describe('RDS Aurora Cluster', () => {
    test('Aurora cluster is running and accessible', async () => {
      expect(outputs.ClusterEndpoint).toBeDefined();

      const clusterIdentifier = outputs.ClusterEndpoint.split('.')[0];
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];

      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DeletionProtection).toBe(false);
      expect(cluster.BackupRetentionPeriod).toBe(5);
      expect(cluster.DatabaseName).toBe('saasdb');
    }, testTimeout);

    test('Aurora Serverless v2 scaling is configured', async () => {
      const clusterIdentifier = outputs.ClusterEndpoint.split('.')[0];
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration!.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration!.MaxCapacity).toBe(2);
    }, testTimeout);

    test('Writer and reader instances are running', async () => {
      const clusterIdentifier = outputs.ClusterEndpoint.split('.')[0];
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterIdentifier] }
        ]
      }));

      expect(response.DBInstances).toHaveLength(2);

      // Both instances should be available
      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.PerformanceInsightsEnabled).toBe(true);
        expect(instance.DBInstanceClass).toBe('db.serverless');
      });
    }, testTimeout);

    test('Database endpoints are accessible', async () => {
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.ClusterReadEndpoint).toBeDefined();

      expect(outputs.ClusterEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.ClusterReadEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.ClusterReadEndpoint).toContain('cluster-ro');
    }, testTimeout);
  });

  describe('Secrets Management', () => {
    test('Database credentials are stored in Secrets Manager', async () => {
      expect(outputs.SecretArn).toBeDefined();

      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: outputs.SecretArn
      }));

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);

      expect(secret.username).toBe('admin');
      expect(secret.password).toBeDefined();
      expect(secret.engine).toBe('mysql');
      expect(secret.host).toBe(outputs.ClusterEndpoint);
      expect(secret.port).toBe(3306);
      expect(secret.dbname).toBe('saasdb');
    }, testTimeout);
  });

  describe('Backup and Storage', () => {
    test('S3 backup bucket exists and is accessible', async () => {
      expect(outputs.BackupBucketName).toBeDefined();

      const response = await s3Client.send(new HeadBucketCommand({
        Bucket: outputs.BackupBucketName
      }));

      // If no error is thrown, bucket exists
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, testTimeout);

    test('S3 bucket name follows naming convention', async () => {
      expect(outputs.BackupBucketName).toMatch(/aurora-backups-\d+-synth\d+/);
    }, testTimeout);
  });

  describe('Monitoring and Alarms', () => {
    test('SNS topic for alarms exists', async () => {
      expect(outputs.AlarmTopicArn).toBeDefined();

      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('Aurora Database Alarms');
    }, testTimeout);

    test('CloudWatch alarms are configured', async () => {
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStacksynth81350627'
      }));

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(4);

      const alarmNames = response.MetricAlarms!.map(alarm => alarm.MetricName);
      expect(alarmNames).toContain('ServerlessDatabaseCapacity');
      expect(alarmNames).toContain('ACUUtilization');
      expect(alarmNames).toContain('DatabaseConnections');
      expect(alarmNames).toContain('CPUUtilization');

      // Verify all alarms are connected to SNS topic
      response.MetricAlarms!.forEach(alarm => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions![0]).toContain(outputs.AlarmTopicArn);
      });
    }, testTimeout);
  });

  describe('Infrastructure Requirements Validation', () => {
    test('meets Aurora Serverless v2 requirements', async () => {
      const clusterIdentifier = outputs.ClusterEndpoint.split('.')[0];
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.ServerlessV2ScalingConfiguration!.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration!.MaxCapacity).toBe(2);
    }, testTimeout);

    test('meets security and encryption requirements', async () => {
      const clusterIdentifier = outputs.ClusterEndpoint.split('.')[0];
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    }, testTimeout);

    test('meets backup retention requirements', async () => {
      const clusterIdentifier = outputs.ClusterEndpoint.split('.')[0];
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBe(5);
      expect(cluster.PreferredBackupWindow).toBe('03:00-04:00');
    }, testTimeout);
  });
});