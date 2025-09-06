import { beforeAll, describe, expect, test } from '@jest/globals';
import * as AWS from 'aws-sdk';

// Environment variables are set in GitHub Actions workflow
// Type augmentations for better type safety
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION: string;
      ENVIRONMENT: string;
      VPC_ID: string;
      PUBLIC_SUBNET_1_ID: string;
      PUBLIC_SUBNET_2_ID: string;
      PRIVATE_SUBNET_1_ID: string;
      PRIVATE_SUBNET_2_ID: string;
      RDS_ENDPOINT: string;
      LOGGING_BUCKET_NAME: string;
      RDS_BACKUP_BUCKET_NAME: string;
      KMS_KEY_ALIAS_EBS: string;
      KMS_KEY_ALIAS_RDS: string;
    }
  }

  namespace jest {
    interface Matchers<R> {
      toHaveSize(size: number): R;
    }
  }
}

// Type assertions to handle AWS SDK v2 type issues
const assertDefined = <T>(value: T | undefined, message?: string): T => {
  if (value === undefined) {
    throw new Error(message || 'Value must be defined');
  }
  return value;
};

// Verify required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'ENVIRONMENT',
  'VPC_ID',
  'PUBLIC_SUBNET_1_ID',
  'PUBLIC_SUBNET_2_ID',
  'PRIVATE_SUBNET_1_ID',
  'PRIVATE_SUBNET_2_ID',
  'RDS_ENDPOINT',
  'LOGGING_BUCKET_NAME',
  'RDS_BACKUP_BUCKET_NAME',
  'KMS_KEY_ALIAS_EBS',
  'KMS_KEY_ALIAS_RDS'
];

// Initialize AWS clients
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const cloudwatch = new AWS.CloudWatch();
const configService = new AWS.ConfigService();
const sns = new AWS.SNS();
const iam = new AWS.IAM();

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Verify all required environment variables are set
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  });

  describe('Network Infrastructure', () => {
    test('VPC should exist and have correct configuration', async () => {
      const { Vpcs } = await ec2.describeVpcs({
        VpcIds: [process.env.VPC_ID]
      }).promise();

      expect(Vpcs).toBeDefined();
      expect(Vpcs?.length).toBe(1);
      const vpc = assertDefined(Vpcs?.[0], 'VPC not found');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // Type assertion for AWS SDK v2 properties
      const vpcAttrs = vpc as AWS.EC2.Vpc & {
        EnableDnsHostnames: boolean;
        EnableDnsSupport: boolean;
      };
      expect(vpcAttrs.EnableDnsHostnames).toBe(true);
      expect(vpcAttrs.EnableDnsSupport).toBe(true);
    });

    test('Subnets should exist in different AZs', async () => {
      const { Subnets } = await ec2.describeSubnets({
        SubnetIds: [
          process.env.PUBLIC_SUBNET_1_ID!,
          process.env.PUBLIC_SUBNET_2_ID!,
          process.env.PRIVATE_SUBNET_1_ID!,
          process.env.PRIVATE_SUBNET_2_ID!
        ]
      }).promise();

      expect(Subnets).toHaveLength(4);

      // Verify public subnets
      const publicSubnets = assertDefined(Subnets, 'No subnets found').filter(subnet =>
        [process.env.PUBLIC_SUBNET_1_ID, process.env.PUBLIC_SUBNET_2_ID].includes(assertDefined(subnet.SubnetId))
      );
      expect(publicSubnets).toHaveLength(2);
      const publicAzs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      expect(publicAzs.size).toBe(2);
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify private subnets
      const privateSubnets = assertDefined(Subnets, 'No subnets found').filter(subnet =>
        [process.env.PRIVATE_SUBNET_1_ID, process.env.PRIVATE_SUBNET_2_ID].includes(assertDefined(subnet.SubnetId))
      );
      expect(privateSubnets).toHaveLength(2);
      const privateAzs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(privateAzs.size).toBe(2);
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Security Configuration', () => {
    test('KMS keys should be properly configured', async () => {
      // Test EBS KMS Key
      const ebsKeyAlias = await kms.describeKey({
        KeyId: process.env.KMS_KEY_ALIAS_EBS
      }).promise();
      const ebsKeyMeta = assertDefined(ebsKeyAlias.KeyMetadata, 'EBS key metadata not found');
      expect(ebsKeyMeta.Enabled).toBe(true);
      expect(ebsKeyMeta.KeyUsage).toBe('ENCRYPT_DECRYPT');

      // Test RDS KMS Key
      const rdsKeyAlias = await kms.describeKey({
        KeyId: process.env.KMS_KEY_ALIAS_RDS
      }).promise();
      const rdsKeyMeta = assertDefined(rdsKeyAlias.KeyMetadata, 'RDS key metadata not found');
      expect(rdsKeyMeta.Enabled).toBe(true);
      expect(rdsKeyMeta.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('Security groups should have correct rules', async () => {
      const { SecurityGroups } = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [process.env.VPC_ID]
          }
        ]
      }).promise();

      const groups = assertDefined(SecurityGroups, 'No security groups found');

      // Test Bastion Security Group
      const bastionSG = groups.find(sg => sg.GroupName && sg.GroupName.includes('bastion'));
      expect(bastionSG).toBeDefined();
      const bastionPerms = assertDefined(bastionSG?.IpPermissions, 'No bastion permissions found');
      expect(bastionPerms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp'
          })
        ])
      );

      // Test Web Server Security Group
      const webSG = groups.find(sg => sg.GroupName && sg.GroupName.includes('webserver'));
      expect(webSG).toBeDefined();
      const webPerms = assertDefined(webSG?.IpPermissions, 'No webserver permissions found');
      expect(webPerms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
          }),
          expect.objectContaining({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          })
        ])
      );
    });
  });

  describe('Database Infrastructure', () => {
    test('RDS instance should be properly configured', async () => {
      const { DBInstances } = await rds.describeDBInstances({
        Filters: [
          {
            Name: 'endpoint',
            Values: [process.env.RDS_ENDPOINT!]
          }
        ]
      }).promise();

      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];

      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.StorageType).toBe('gp2');
    });
  });

  describe('Storage Configuration', () => {
    test('S3 buckets should have proper configuration', async () => {
      // Test Logging Bucket
      const loggingBucketEncryption = await s3.getBucketEncryption({
        Bucket: process.env.LOGGING_BUCKET_NAME!
      }).promise();
      expect(loggingBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const loggingBucketVersioning = await s3.getBucketVersioning({
        Bucket: process.env.LOGGING_BUCKET_NAME!
      }).promise();
      expect(loggingBucketVersioning.Status).toBe('Enabled');

      // Test RDS Backup Bucket
      const backupBucketEncryption = await s3.getBucketEncryption({
        Bucket: process.env.RDS_BACKUP_BUCKET_NAME!
      }).promise();
      expect(backupBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const backupBucketLogging = await s3.getBucketLogging({
        Bucket: process.env.RDS_BACKUP_BUCKET_NAME!
      }).promise();
      expect(backupBucketLogging.LoggingEnabled).toBeDefined();
      expect(backupBucketLogging.LoggingEnabled!.TargetBucket).toBe(process.env.LOGGING_BUCKET_NAME);
    });
  });

  describe('Monitoring Configuration', () => {
    test('CloudWatch alarms should be properly set', async () => {
      const { MetricAlarms } = await cloudwatch.describeAlarms({
        AlarmNamePrefix: `${process.env.ENVIRONMENT}-`
      }).promise();

      const cpuAlarm = MetricAlarms!.find(alarm => alarm.MetricName === 'CPUUtilization');
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.Namespace).toBe('AWS/RDS');
      expect(cpuAlarm!.Period).toBe(300);
      expect(cpuAlarm!.EvaluationPeriods).toBe(2);
      expect(cpuAlarm!.Threshold).toBe(75);
    });

    test('AWS Config should be recording', async () => {
      const { ConfigurationRecorders } = await configService.describeConfigurationRecorders().promise();
      const recorders = assertDefined(ConfigurationRecorders, 'No configuration recorders found');
      expect(recorders).toHaveLength(1);

      const recorder = assertDefined(recorders[0], 'Configuration recorder not found');
      const recordingGroup = assertDefined(recorder.recordingGroup, 'Recording group not found');
      expect(recordingGroup.allSupported).toBe(true);
      expect(recordingGroup.includeGlobalResourceTypes).toBe(true);

      const { ConfigurationRecordersStatus } = await configService.describeConfigurationRecorderStatus().promise();
      const recorderStatus = assertDefined(ConfigurationRecordersStatus, 'No recorder status found');
      expect(recorderStatus[0]?.recording).toBe(true);
    });
  });

  describe('High Availability', () => {
    test('Resources should be distributed across AZs', async () => {
      // Get all AZs used by our subnets
      const { Subnets } = await ec2.describeSubnets({
        SubnetIds: [
          process.env.PUBLIC_SUBNET_1_ID!,
          process.env.PUBLIC_SUBNET_2_ID!,
          process.env.PRIVATE_SUBNET_1_ID!,
          process.env.PRIVATE_SUBNET_2_ID!
        ]
      }).promise();

      const azs = new Set(Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify RDS Multi-AZ
      const { DBInstances } = await rds.describeDBInstances({
        Filters: [
          {
            Name: 'endpoint',
            Values: [process.env.RDS_ENDPOINT!]
          }
        ]
      }).promise();

      expect(DBInstances![0].MultiAZ).toBe(true);
    });
  });

  describe('SNS Configuration', () => {
    test('SNS topic should be properly configured', async () => {
      const { Topics } = await sns.listTopics().promise();
      const topicArn = Topics!.find(topic =>
        topic.TopicArn!.includes(`${process.env.ENVIRONMENT}-infrastructure-alarms`))?.TopicArn;
      expect(topicArn).toBeDefined();

      const topicAttributes = await sns.getTopicAttributes({
        TopicArn: topicArn!
      }).promise();
      expect(topicAttributes.Attributes!.DisplayName).toBe(`${process.env.ENVIRONMENT}-infrastructure-alarms`);
    });
  });
});
