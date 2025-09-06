import { beforeAll, describe, expect, test } from '@jest/globals';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// Read outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs = {};

try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    // Set environment variables from outputs
    Object.entries(outputs).forEach(([key, value]) => {
      process.env[key.toUpperCase()] = value as string;
    });
    console.log('Loaded outputs from flat-outputs.json:', outputs);
  } else {
    console.warn('Warning: flat-outputs.json not found. Will try to get outputs from CloudFormation stack.');
  }
} catch (error) {
  console.error('Error reading flat-outputs.json:', error);
}

// Initialize AWS clients
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const cloudwatch = new AWS.CloudWatch();
const configService = new AWS.ConfigService();
const sns = new AWS.SNS();
const iam = new AWS.IAM();

// Required environment variables
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

// Type assertions to handle AWS SDK v2 type issues
const assertDefined = <T>(value: T | undefined, message?: string): T => {
  if (value === undefined) {
    throw new Error(message || 'Value must be defined');
  }
  return value;
};

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    // Set default environment variables
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
    process.env.ENVIRONMENT = process.env.ENVIRONMENT_SUFFIX || 'pr2519';

    // Get stack outputs
    const stackName = `TapStack${process.env.ENVIRONMENT}`;
    const cloudformation = new AWS.CloudFormation();

    try {
      console.log(`Getting outputs for stack: ${stackName}`);
      const { Stacks } = await cloudformation.describeStacks({
        StackName: stackName
      }).promise();

      if (!Stacks || Stacks.length === 0) {
        throw new Error(`Stack ${stackName} not found`);
      }

      const outputs = Stacks[0].Outputs;
      if (!outputs) {
        throw new Error(`No outputs found for stack ${stackName}`);
      }

      console.log('Stack outputs found:', outputs.length);

      // Map outputs to environment variables
      for (const output of outputs) {
        if (output.OutputValue) {
          switch (output.OutputKey) {
            case 'VpcId':
              process.env.VPC_ID = output.OutputValue;
              break;
            case 'PublicSubnet1':
              process.env.PUBLIC_SUBNET_1_ID = output.OutputValue;
              break;
            case 'PublicSubnet2':
              process.env.PUBLIC_SUBNET_2_ID = output.OutputValue;
              break;
            case 'PrivateSubnet1':
              process.env.PRIVATE_SUBNET_1_ID = output.OutputValue;
              break;
            case 'PrivateSubnet2':
              process.env.PRIVATE_SUBNET_2_ID = output.OutputValue;
              break;
            case 'RDSEndpoint':
              process.env.RDS_ENDPOINT = output.OutputValue;
              break;
            case 'LoggingBucketName':
              process.env.LOGGING_BUCKET_NAME = output.OutputValue;
              break;
            case 'RDSBackupBucketName':
              process.env.RDS_BACKUP_BUCKET_NAME = output.OutputValue;
              break;
            case 'KMSKeyAliasEBS':
              process.env.KMS_KEY_ALIAS_EBS = output.OutputValue;
              break;
            case 'KMSKeyAliasRDS':
              process.env.KMS_KEY_ALIAS_RDS = output.OutputValue;
              break;
          }
        }
      }

      // Check if all required variables are set
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting stack outputs:', error);
      throw error;
    }
  });

  describe('Network Infrastructure', () => {
    test('VPC should exist and have correct configuration', async () => {
      const vpcId = assertDefined(process.env.VPC_ID, 'VPC_ID environment variable must be defined');
      const { Vpcs } = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();

      expect(Vpcs).toBeDefined();
      expect(Vpcs?.length).toBe(1);
      const vpc = assertDefined(Vpcs?.[0], 'VPC not found');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      const vpcAttrs = vpc as AWS.EC2.Vpc & {
        EnableDnsHostnames: boolean;
        EnableDnsSupport: boolean;
      };
      expect(vpcAttrs.EnableDnsHostnames).toBe(true);
      expect(vpcAttrs.EnableDnsSupport).toBe(true);
    });

    test('Subnets should exist in different AZs', async () => {
      const publicSubnet1 = assertDefined(process.env.PUBLIC_SUBNET_1_ID, 'PUBLIC_SUBNET_1_ID must be defined');
      const publicSubnet2 = assertDefined(process.env.PUBLIC_SUBNET_2_ID, 'PUBLIC_SUBNET_2_ID must be defined');
      const privateSubnet1 = assertDefined(process.env.PRIVATE_SUBNET_1_ID, 'PRIVATE_SUBNET_1_ID must be defined');
      const privateSubnet2 = assertDefined(process.env.PRIVATE_SUBNET_2_ID, 'PRIVATE_SUBNET_2_ID must be defined');

      const { Subnets } = await ec2.describeSubnets({
        SubnetIds: [
          publicSubnet1,
          publicSubnet2,
          privateSubnet1,
          privateSubnet2
        ]
      }).promise();

      expect(Subnets).toHaveLength(4);

      // Verify public subnets
      const publicSubnets = assertDefined(Subnets, 'No subnets found').filter(subnet =>
        [publicSubnet1, publicSubnet2].includes(assertDefined(subnet.SubnetId))
      );
      expect(publicSubnets).toHaveLength(2);
      const publicAzs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      expect(publicAzs.size).toBe(2);
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify private subnets
      const privateSubnets = assertDefined(Subnets, 'No subnets found').filter(subnet =>
        [privateSubnet1, privateSubnet2].includes(assertDefined(subnet.SubnetId))
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
      const ebsKeyId = assertDefined(process.env.KMS_KEY_ALIAS_EBS, 'KMS_KEY_ALIAS_EBS must be defined');
      const ebsKeyAlias = await kms.describeKey({
        KeyId: ebsKeyId
      }).promise();
      const ebsKeyMeta = assertDefined(ebsKeyAlias.KeyMetadata, 'EBS key metadata not found');
      expect(ebsKeyMeta.Enabled).toBe(true);
      expect(ebsKeyMeta.KeyUsage).toBe('ENCRYPT_DECRYPT');

      // Test RDS KMS Key
      const rdsKeyId = assertDefined(process.env.KMS_KEY_ALIAS_RDS, 'KMS_KEY_ALIAS_RDS must be defined');
      const rdsKeyAlias = await kms.describeKey({
        KeyId: rdsKeyId
      }).promise();
      const rdsKeyMeta = assertDefined(rdsKeyAlias.KeyMetadata, 'RDS key metadata not found');
      expect(rdsKeyMeta.Enabled).toBe(true);
      expect(rdsKeyMeta.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('Security groups should have correct rules', async () => {
      const vpcId = assertDefined(process.env.VPC_ID, 'VPC_ID must be defined');
      const { SecurityGroups } = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
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
      const endpoint = assertDefined(process.env.RDS_ENDPOINT, 'RDS_ENDPOINT must be defined');
      const { DBInstances } = await rds.describeDBInstances({
        Filters: [
          {
            Name: 'endpoint',
            Values: [endpoint]
          }
        ]
      }).promise();

      expect(DBInstances).toHaveLength(1);
      const dbInstance = assertDefined(DBInstances?.[0], 'RDS instance not found');

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
      const loggingBucketName = assertDefined(process.env.LOGGING_BUCKET_NAME, 'LOGGING_BUCKET_NAME must be defined');
      const backupBucketName = assertDefined(process.env.RDS_BACKUP_BUCKET_NAME, 'RDS_BACKUP_BUCKET_NAME must be defined');

      const loggingBucketEncryption = await s3.getBucketEncryption({
        Bucket: loggingBucketName
      }).promise();
      expect(loggingBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const loggingBucketVersioning = await s3.getBucketVersioning({
        Bucket: loggingBucketName
      }).promise();
      expect(loggingBucketVersioning.Status).toBe('Enabled');

      // Test RDS Backup Bucket
      const backupBucketEncryption = await s3.getBucketEncryption({
        Bucket: backupBucketName
      }).promise();
      expect(backupBucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const backupBucketLogging = await s3.getBucketLogging({
        Bucket: backupBucketName
      }).promise();
      expect(backupBucketLogging.LoggingEnabled).toBeDefined();
      expect(backupBucketLogging.LoggingEnabled?.TargetBucket).toBe(loggingBucketName);
    });
  });

  describe('Monitoring Configuration', () => {
    test('CloudWatch alarms should be properly set', async () => {
      const environment = assertDefined(process.env.ENVIRONMENT, 'ENVIRONMENT must be defined');
      const { MetricAlarms } = await cloudwatch.describeAlarms({
        AlarmNamePrefix: `${environment}-`
      }).promise();

      const cpuAlarm = assertDefined(MetricAlarms?.find(alarm => alarm.MetricName === 'CPUUtilization'), 'CPU alarm not found');
      expect(cpuAlarm.Namespace).toBe('AWS/RDS');
      expect(cpuAlarm.Period).toBe(300);
      expect(cpuAlarm.EvaluationPeriods).toBe(2);
      expect(cpuAlarm.Threshold).toBe(75);
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
      const publicSubnet1 = assertDefined(process.env.PUBLIC_SUBNET_1_ID, 'PUBLIC_SUBNET_1_ID must be defined');
      const publicSubnet2 = assertDefined(process.env.PUBLIC_SUBNET_2_ID, 'PUBLIC_SUBNET_2_ID must be defined');
      const privateSubnet1 = assertDefined(process.env.PRIVATE_SUBNET_1_ID, 'PRIVATE_SUBNET_1_ID must be defined');
      const privateSubnet2 = assertDefined(process.env.PRIVATE_SUBNET_2_ID, 'PRIVATE_SUBNET_2_ID must be defined');
      const endpoint = assertDefined(process.env.RDS_ENDPOINT, 'RDS_ENDPOINT must be defined');

      // Get all AZs used by our subnets
      const { Subnets } = await ec2.describeSubnets({
        SubnetIds: [
          publicSubnet1,
          publicSubnet2,
          privateSubnet1,
          privateSubnet2
        ]
      }).promise();

      const subnetsFound = assertDefined(Subnets, 'No subnets found');
      const azs = new Set(subnetsFound.map(subnet => assertDefined(subnet.AvailabilityZone)));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify RDS Multi-AZ
      const { DBInstances } = await rds.describeDBInstances({
        Filters: [
          {
            Name: 'endpoint',
            Values: [endpoint]
          }
        ]
      }).promise();

      const rdsInstance = assertDefined(DBInstances?.[0], 'RDS instance not found');
      expect(rdsInstance.MultiAZ).toBe(true);
    });
  });

  describe('SNS Configuration', () => {
    test('SNS topic should be properly configured', async () => {
      const environment = assertDefined(process.env.ENVIRONMENT, 'ENVIRONMENT must be defined');
      const { Topics } = await sns.listTopics().promise();
      const topicArn = assertDefined(
        Topics?.find(topic => topic.TopicArn?.includes(`${environment}-infrastructure-alarms`))?.TopicArn,
        'SNS topic not found'
      );

      const topicAttributes = await sns.getTopicAttributes({
        TopicArn: topicArn
      }).promise();
      expect(topicAttributes.Attributes?.DisplayName).toBe(`${environment}-infrastructure-alarms`);
    });
  });
});
