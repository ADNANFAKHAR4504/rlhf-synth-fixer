import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import fs from 'fs';
import path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'ca-central-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synth8673793487';

// Load stack outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error('Failed to load cfn-outputs/flat-outputs.json:', error);
  outputs = {};
}

describe('TapStack Integration Tests - Deployed Resources', () => {
  let rdsClient: RDSClient;
  let elastiCacheClient: ElastiCacheClient;
  let secretsClient: SecretsManagerClient;
  let kmsClient: KMSClient;
  let ec2Client: EC2Client;
  let cwLogsClient: CloudWatchLogsClient;
  let cwClient: CloudWatchClient;

  beforeAll(() => {
    rdsClient = new RDSClient({ region: AWS_REGION });
    elastiCacheClient = new ElastiCacheClient({ region: AWS_REGION });
    secretsClient = new SecretsManagerClient({ region: AWS_REGION });
    kmsClient = new KMSClient({ region: AWS_REGION });
    ec2Client = new EC2Client({ region: AWS_REGION });
    cwLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
    cwClient = new CloudWatchClient({ region: AWS_REGION });
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
      expect(outputs.ElastiCacheEndpoint).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.CacheAuthSecretArn).toBeDefined();
      expect(outputs.RDSKMSKeyId).toBeDefined();
      expect(outputs.ElastiCacheKMSKeyId).toBeDefined();
    });

    test('outputs should contain environment suffix', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(ENVIRONMENT_SUFFIX);
    });
  });

  describe('RDS PostgreSQL Instance Validation', () => {
    let dbInstance: any;

    beforeAll(async () => {
      const dbIdentifier = `studentrecords-db-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      dbInstance = response.DBInstances?.[0];
    });

    test('RDS instance should exist and be available', async () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('RDS instance should be Multi-AZ', async () => {
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('RDS instance should have storage encrypted', async () => {
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toContain(outputs.RDSKMSKeyId);
    });

    test('RDS instance should be PostgreSQL', async () => {
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toBeDefined();
    });

    test('RDS endpoint should match stack output', async () => {
      expect(dbInstance.Endpoint.Address).toBe(outputs.RDSInstanceEndpoint);
      expect(dbInstance.Endpoint.Port).toBe(parseInt(outputs.RDSInstancePort));
    });

    test('RDS instance should have CloudWatch logs enabled', async () => {
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('upgrade');
    });

    test('RDS instance should have deletion protection disabled', async () => {
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('RDS instance should have IAM database authentication enabled', async () => {
      expect(dbInstance.IAMDatabaseAuthenticationEnabled).toBe(true);
    });

    test('RDS instance should have automated backups configured', async () => {
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
    });

    test('RDS instance should be in private subnet', async () => {
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ElastiCache Redis Cluster Validation', () => {
    let replicationGroup: any;

    beforeAll(async () => {
      const replicationGroupId = `redis-cluster-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });
      const response = await elastiCacheClient.send(command);
      replicationGroup = response.ReplicationGroups?.[0];
    });

    test('ElastiCache replication group should exist and be available', async () => {
      expect(replicationGroup).toBeDefined();
      expect(replicationGroup.Status).toBe('available');
    });

    test('ElastiCache should have automatic failover enabled', async () => {
      expect(replicationGroup.AutomaticFailover).toBe('enabled');
    });

    test('ElastiCache should be Multi-AZ enabled', async () => {
      expect(replicationGroup.MultiAZ).toBe('enabled');
    });

    test('ElastiCache should have at-rest encryption enabled', async () => {
      expect(replicationGroup.AtRestEncryptionEnabled).toBe(true);
    });

    test('ElastiCache should have transit encryption enabled', async () => {
      expect(replicationGroup.TransitEncryptionEnabled).toBe(true);
    });

    test('ElastiCache should have snapshot retention configured', async () => {
      expect(replicationGroup.SnapshotRetentionLimit).toBeGreaterThan(0);
      expect(replicationGroup.SnapshotWindow).toBeDefined();
    });

    test('ElastiCache endpoint should match stack output', async () => {
      const primaryEndpoint = replicationGroup.NodeGroups?.[0]?.PrimaryEndpoint?.Address;
      expect(primaryEndpoint).toBe(outputs.ElastiCacheEndpoint);
    });

    test('ElastiCache should have at least 2 cache clusters', async () => {
      expect(replicationGroup.MemberClusters).toBeDefined();
      expect(replicationGroup.MemberClusters.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secrets Manager Validation', () => {
    test('RDS database secret should exist and be accessible', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.DBSecretArn);
      expect(response.Name).toContain(ENVIRONMENT_SUFFIX);
    });

    test('RDS secret should have rotation enabled', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    });

    test('RDS secret should contain username and password', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);
      const secretValue = JSON.parse(response.SecretString || '{}');
      expect(secretValue.username).toBeDefined();
      expect(secretValue.password).toBeDefined();
      expect(secretValue.password.length).toBeGreaterThan(0);
    });

    test('ElastiCache auth secret should exist and be accessible', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.CacheAuthSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.CacheAuthSecretArn);
      expect(response.Name).toContain(ENVIRONMENT_SUFFIX);
    });

    test('ElastiCache secret should contain auth token', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.CacheAuthSecretArn,
      });
      const response = await secretsClient.send(command);
      const secretValue = JSON.parse(response.SecretString || '{}');
      expect(secretValue.token).toBeDefined();
      expect(secretValue.token.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Key Validation', () => {
    test('RDS KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.RDSKMSKeyId,
      });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyId).toBe(outputs.RDSKMSKeyId);
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('ElastiCache KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.ElastiCacheKMSKeyId,
      });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyId).toBe(outputs.ElastiCacheKMSKeyId);
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('Security Groups Validation', () => {
    test('app security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppSecurityGroupId],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups?.[0].GroupName).toContain(ENVIRONMENT_SUFFIX);
    });

    test('RDS security group should exist and allow PostgreSQL traffic', async () => {
      const groupName = `rds-sg-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [groupName] }],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const ingress = response.SecurityGroups?.[0].IpPermissions;
      const postgresRule = ingress?.find(rule => rule.FromPort === 5432 && rule.ToPort === 5432);
      expect(postgresRule).toBeDefined();
    });

    test('ElastiCache security group should exist and allow Redis traffic', async () => {
      const groupName = `elasticache-sg-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [groupName] }],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const ingress = response.SecurityGroups?.[0].IpPermissions;
      const redisRule = ingress?.find(rule => rule.FromPort === 6379 && rule.ToPort === 6379);
      expect(redisRule).toBeDefined();
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('RDS log group should exist', async () => {
      const logGroupName = `/aws/rds/studentrecords-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('ElastiCache log group should exist', async () => {
      const logGroupName = `/aws/elasticache/redis-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwLogsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    test('RDS CPU alarm should exist', async () => {
      const alarmName = `rds-high-cpu-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('CPUUtilization');
      expect(response.MetricAlarms?.[0].Threshold).toBe(80);
    });

    test('RDS connections alarm should exist', async () => {
      const alarmName = `rds-high-connections-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('DatabaseConnections');
    });

    test('ElastiCache CPU alarm should exist', async () => {
      const alarmName = `elasticache-high-cpu-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0].Threshold).toBe(75);
    });

    test('ElastiCache memory alarm should exist', async () => {
      const alarmName = `elasticache-high-memory-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0].MetricName).toBe('DatabaseMemoryUsagePercentage');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('database and cache should be accessible from app security group', async () => {
      // Verify that the security group rules allow connectivity
      const appSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppSecurityGroupId],
      });
      const appSgResponse = await ec2Client.send(appSgCommand);
      expect(appSgResponse.SecurityGroups).toHaveLength(1);

      // Verify RDS allows traffic from app SG
      const rdsGroupName = `rds-sg-${ENVIRONMENT_SUFFIX}`;
      const rdsSgCommand = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [rdsGroupName] }],
      });
      const rdsSgResponse = await ec2Client.send(rdsSgCommand);
      const rdsIngress = rdsSgResponse.SecurityGroups?.[0].IpPermissions;
      const rdsFromApp = rdsIngress?.find(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.AppSecurityGroupId)
      );
      expect(rdsFromApp).toBeDefined();

      // Verify ElastiCache allows traffic from app SG
      const cacheGroupName = `elasticache-sg-${ENVIRONMENT_SUFFIX}`;
      const cacheSgCommand = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [cacheGroupName] }],
      });
      const cacheSgResponse = await ec2Client.send(cacheSgCommand);
      const cacheIngress = cacheSgResponse.SecurityGroups?.[0].IpPermissions;
      const cacheFromApp = cacheIngress?.find(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.AppSecurityGroupId)
      );
      expect(cacheFromApp).toBeDefined();
    });

    test('all resources should use consistent environment suffix', async () => {
      // Verify environment suffix is used consistently across all resources
      expect(outputs.EnvironmentSuffix).toBe(ENVIRONMENT_SUFFIX);
      expect(outputs.RDSInstanceEndpoint).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.ElastiCacheEndpoint).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.DBSecretArn).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.CacheAuthSecretArn).toContain(ENVIRONMENT_SUFFIX);
    });
  });
});
