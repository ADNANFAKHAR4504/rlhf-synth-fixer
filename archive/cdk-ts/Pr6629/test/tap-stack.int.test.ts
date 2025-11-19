import fs from 'fs';
import path from 'path';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';

const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = outputs.DbEndpoint.split('.')[2];

const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const kmsClient = new KMSClient({ region });
const ec2Client = new EC2Client({ region });

describe('Single-Region High Availability Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists and is configured correctly', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe(outputs.VpcCidr);
    }, 30000);

    test('Subnets are distributed across multiple AZs', async () => {
      const vpcId = outputs.VpcId;

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(4);

      const availabilityZones = new Set(
        subnets.map((subnet) => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('NAT Gateway is provisioned and available', async () => {
      const vpcId = outputs.VpcId;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      expect(natGateways.length).toBe(1);
      expect(natGateways[0].State).toBe('available');
    }, 30000);

    test('VPC endpoints for AWS services are configured', async () => {
      const vpcId = outputs.VpcId;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const endpoints = response.VpcEndpoints || [];

      expect(endpoints.length).toBeGreaterThanOrEqual(4);

      const endpointServices = endpoints.map((ep) => ep.ServiceName);
      expect(endpointServices.some((svc) => svc?.includes('rds'))).toBe(true);
      expect(endpointServices.some((svc) => svc?.includes('sns'))).toBe(true);
      expect(endpointServices.some((svc) => svc?.includes('logs'))).toBe(true);
      expect(endpointServices.some((svc) => svc?.includes('events'))).toBe(
        true
      );
    }, 30000);
  });

  describe('Security Groups', () => {
    test('Database security group exists and is properly configured', async () => {
      const sgId = outputs.DbSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      expect(securityGroup).toBeDefined();
      expect(securityGroup?.GroupId).toBe(sgId);
      expect(securityGroup?.VpcId).toBe(outputs.VpcId);
      expect(securityGroup?.GroupName).toContain('DbSecurityGroup');

      const ingressRules = securityGroup?.IpPermissions || [];
      const hasPostgresRule = ingressRules.some(
        (rule) =>
          rule.FromPort === 5432 &&
          rule.ToPort === 5432 &&
          rule.IpProtocol === 'tcp'
      );
      expect(hasPostgresRule).toBe(true);
    }, 30000);

    test('Lambda security group exists and allows outbound traffic', async () => {
      const sgId = outputs.LambdaSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      expect(securityGroup).toBeDefined();
      expect(securityGroup?.GroupId).toBe(sgId);
      expect(securityGroup?.VpcId).toBe(outputs.VpcId);
      expect(securityGroup?.GroupName).toContain('LambdaSecurityGroup');

      const egressRules = securityGroup?.IpPermissionsEgress || [];
      expect(egressRules.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('RDS PostgreSQL Database', () => {
    test('RDS instance is running with Multi-AZ configuration', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;
      expect(dbIdentifier).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.EngineVersion).toMatch(/^14\./);
      expect(dbInstance?.DBInstanceClass).toBe('db.r6g.xlarge');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
    }, 30000);

    test('RDS instance has correct endpoint and port', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.Endpoint?.Address).toBe(outputs.DbEndpoint);
      expect(dbInstance?.Endpoint?.Port?.toString()).toBe(outputs.DbPort);
    }, 30000);

    test('RDS instance has correct storage configuration', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.AllocatedStorage).toBe(100);
      expect(dbInstance?.MaxAllocatedStorage).toBe(500);
      expect(dbInstance?.StorageType).toBe('gp3');
    }, 30000);

    test('RDS instance has backup retention configured', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    }, 30000);

    test('RDS instance has Performance Insights enabled', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.PerformanceInsightsEnabled).toBe(true);
    }, 30000);

    test('RDS instance is in private subnets', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.PubliclyAccessible).toBe(false);
    }, 30000);

    test('RDS instance has CloudWatch logs enabled', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
      expect(enabledLogs).toContain('postgresql');
      expect(enabledLogs).toContain('upgrade');
    }, 30000);
  });

  describe('S3 Backup Bucket', () => {
    test('S3 bucket exists with versioning enabled', async () => {
      const bucketName = outputs.BackupBucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket has KMS encryption configured', async () => {
      const bucketName = outputs.BackupBucketName;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      const rules =
        response.ServerSideEncryptionConfiguration?.Rules || [];

      expect(rules.length).toBeGreaterThan(0);
      const kmsRule = rules.find(
        (rule) =>
          rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
      );
      expect(kmsRule).toBeDefined();
    }, 30000);

    test('S3 bucket blocks all public access', async () => {
      const bucketName = outputs.BackupBucketName;

      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('S3 bucket has lifecycle policy configured', async () => {
      const bucketName = outputs.BackupBucketName;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      const rules = response.Rules || [];

      expect(rules.length).toBeGreaterThan(0);
      const versionRule = rules.find(
        (rule) =>
          rule.NoncurrentVersionExpiration?.NoncurrentDays === 30
      );
      expect(versionRule).toBeDefined();
    }, 30000);
  });

  describe('KMS Encryption Key', () => {
    test('KMS key exists and is enabled', async () => {
      const keyId = outputs.KmsKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });

      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata;

      expect(keyMetadata).toBeDefined();
      expect(keyMetadata?.KeyId).toBe(keyId);
      expect(keyMetadata?.Enabled).toBe(true);
      expect(keyMetadata?.KeyState).toBe('Enabled');
    }, 30000);

    test('KMS key ARN matches the output', async () => {
      const keyId = outputs.KmsKeyId;
      const expectedArn = outputs.KmsKeyArn;

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });

      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata;

      expect(keyMetadata?.Arn).toBe(expectedArn);
    }, 30000);
  });

  describe('SNS Monitoring Topic', () => {
    test('SNS topic exists and is configured', async () => {
      const topicArn = outputs.MonitoringTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      const attributes = response.Attributes;

      expect(attributes).toBeDefined();
      expect(attributes?.TopicArn).toBe(topicArn);
      expect(attributes?.DisplayName).toBe('Monitoring Alerts');
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('CPU alarm is configured and monitoring RDS', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'db-cpu-alarm',
      });

      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      const cpuAlarm = alarms.find((alarm) =>
        alarm.AlarmName?.includes('cpu-alarm')
      );
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.EvaluationPeriods).toBe(2);
      expect(cpuAlarm?.DatapointsToAlarm).toBe(2);
      expect(cpuAlarm?.ActionsEnabled).toBe(true);
    }, 30000);

    test('Database connections alarm is configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'db-connections-alarm',
      });

      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      const connectionsAlarm = alarms.find((alarm) =>
        alarm.AlarmName?.includes('connections-alarm')
      );
      expect(connectionsAlarm).toBeDefined();
      expect(connectionsAlarm?.MetricName).toBe('DatabaseConnections');
      expect(connectionsAlarm?.Threshold).toBe(80);
      expect(connectionsAlarm?.EvaluationPeriods).toBe(2);
      expect(connectionsAlarm?.DatapointsToAlarm).toBe(2);
    }, 30000);

    test('Alarms are configured to send notifications to SNS', async () => {
      const topicArn = outputs.MonitoringTopicArn;

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'db-',
      });

      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      alarms.forEach((alarm) => {
        const alarmActions = alarm.AlarmActions || [];
        expect(alarmActions).toContain(topicArn);
      });
    }, 30000);
  });

  describe('High Availability Validation', () => {
    test('RDS Multi-AZ has primary and secondary availability zones', async () => {
      const dbIdentifier = outputs.DbInstanceIdentifier;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.AvailabilityZone).toBeDefined();
      expect(dbInstance?.SecondaryAvailabilityZone).toBeDefined();
      expect(dbInstance?.AvailabilityZone).not.toBe(
        dbInstance?.SecondaryAvailabilityZone
      );
    }, 30000);

    test('All critical resources are in the same region', () => {
      const dbEndpoint = outputs.DbEndpoint;
      const bucketArn = outputs.BackupBucketArn;
      const kmsArn = outputs.KmsKeyArn;
      const topicArn = outputs.MonitoringTopicArn;

      const dbRegion = dbEndpoint.split('.')[2];
      const arnParts = bucketArn.split(':');
      const bucketRegion = arnParts.length > 3 ? arnParts[3] : '';
      const kmsRegion = kmsArn.split(':')[3];
      const snsRegion = topicArn.split(':')[3];

      expect(dbRegion).toBe(bucketRegion || dbRegion);
      expect(dbRegion).toBe(kmsRegion);
      expect(dbRegion).toBe(snsRegion);
    });
  });
});
