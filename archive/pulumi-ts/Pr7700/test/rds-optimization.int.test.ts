import * as fs from 'fs';
import * as path from 'path';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

describe('RDS Optimization Integration Tests', () => {
  let outputs: Record<string, string>;
  let environmentSuffix: string;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load stack outputs from deployment
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. Deploy infrastructure first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    environmentSuffix =
      process.env.ENVIRONMENT_SUFFIX ||
      process.env.environmentSuffix ||
      'test';
  });

  describe('VPC Validation', () => {
    it('should have deployed VPC with correct configuration', async () => {
      const ec2Client = new EC2Client({ region });
      const vpcId = outputs.vpcId;

      expect(vpcId).toBeDefined();
      expect(vpcId).toContain('vpc-');

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });
  });

  describe('RDS Primary Instance Validation', () => {
    it('should have deployed RDS instance with correct configuration', async () => {
      const rdsClient = new RDSClient({ region });
      const dbIdentifier = `rds-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(dbInstance.DBInstanceClass).toBe('db.t3.large');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.StorageType).toBe('gp3');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(true);
    });

    it('should have RDS instance in available state', async () => {
      const rdsClient = new RDSClient({ region });
      const dbIdentifier = `rds-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    it('should export correct RDS endpoint in outputs', async () => {
      const rdsClient = new RDSClient({ region });
      const dbIdentifier = `rds-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(outputs.dbInstanceEndpoint).toContain(
        dbInstance.Endpoint!.Address!
      );
      expect(outputs.dbInstanceAddress).toBe(dbInstance.Endpoint!.Address);
    });
  });

  describe('Read Replica Validation', () => {
    it('should have deployed read replica with correct configuration', async () => {
      const rdsClient = new RDSClient({ region });
      const replicaIdentifier = `replica-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: replicaIdentifier,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const replica = response.DBInstances![0];
      expect(replica.DBInstanceIdentifier).toBe(replicaIdentifier);
      expect(replica.DBInstanceClass).toBe('db.t3.large');
      expect(replica.ReadReplicaSourceDBInstanceIdentifier).toContain(
        `rds-${environmentSuffix}`
      );
      expect(replica.PerformanceInsightsEnabled).toBe(true);
    });

    it('should have read replica in available state', async () => {
      const rdsClient = new RDSClient({ region });
      const replicaIdentifier = `replica-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: replicaIdentifier,
        })
      );

      const replica = response.DBInstances![0];
      expect(replica.DBInstanceStatus).toBe('available');
    });

    it('should export correct replica endpoint in outputs', async () => {
      const rdsClient = new RDSClient({ region });
      const replicaIdentifier = `replica-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: replicaIdentifier,
        })
      );

      const replica = response.DBInstances![0];
      expect(outputs.readReplicaEndpoint).toContain(
        replica.Endpoint!.Address!
      );
      expect(outputs.readReplicaAddress).toBe(replica.Endpoint!.Address);
    });
  });

  describe('Parameter Group Validation', () => {
    it('should have custom parameter group with optimized settings', async () => {
      const rdsClient = new RDSClient({ region });
      // Use actual deployed parameter group name from outputs
      const paramGroupName = outputs.dbParameterGroupName as string;

      const response = await rdsClient.send(
        new DescribeDBParameterGroupsCommand({
          DBParameterGroupName: paramGroupName,
        })
      );

      expect(response.DBParameterGroups).toBeDefined();
      expect(response.DBParameterGroups!.length).toBe(1);

      const paramGroup = response.DBParameterGroups![0];
      expect(paramGroup.DBParameterGroupName).toBe(paramGroupName);
      expect(paramGroup.DBParameterGroupFamily).toBe('postgres15');
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    it('should have CPU alarm configured', async () => {
      const cloudwatchClient = new CloudWatchClient({ region });
      const alarmName = `rds-cpu-alarm-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    it('should have storage alarm configured', async () => {
      const cloudwatchClient = new CloudWatchClient({ region });
      const alarmName = `rds-storage-alarm-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('FreeStorageSpace');
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });

    it('should have replica lag alarm configured', async () => {
      const cloudwatchClient = new CloudWatchClient({ region });
      const alarmName = `replica-lag-alarm-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('ReplicaLag');
      expect(alarm.Threshold).toBe(300);
    });

    it('should have alarms connected to SNS topic', async () => {
      const cloudwatchClient = new CloudWatchClient({ region });
      const alarmName = `rds-cpu-alarm-${environmentSuffix}`;

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      expect(alarm.AlarmActions![0]).toContain('arn:aws:sns:');
    });
  });

  describe('SNS Topic Validation', () => {
    it('should have SNS topic for alarms', async () => {
      const snsClient = new SNSClient({ region });
      const topicArn = outputs.snsTopicArn;

      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('arn:aws:sns:');
      expect(topicArn).toContain(`rds-alarms-${environmentSuffix}`);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should follow naming convention with environmentSuffix', () => {
      // Verify all critical resource identifiers are defined
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.dbInstanceId).toBeDefined();
      expect(outputs.dbSecurityGroupId).toBeDefined();
      expect(outputs.dbParameterGroupName).toBeDefined();

      // Verify parameter group name contains environment suffix
      // (Pulumi may add random suffixes to resource names, which is acceptable)
      expect(outputs.dbParameterGroupName).toContain(environmentSuffix);
    });
  });

  describe('Stack Outputs Completeness', () => {
    it('should export all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.dbInstanceId).toBeDefined();
      expect(outputs.dbInstanceEndpoint).toBeDefined();
      expect(outputs.dbInstanceAddress).toBeDefined();
      expect(outputs.readReplicaEndpoint).toBeDefined();
      expect(outputs.readReplicaAddress).toBeDefined();
      expect(outputs.dbSecurityGroupId).toBeDefined();
      expect(outputs.dbParameterGroupName).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.cpuAlarmName).toBeDefined();
      expect(outputs.storageAlarmName).toBeDefined();
      expect(outputs.replicaLagAlarmName).toBeDefined();
    });
  });
});
