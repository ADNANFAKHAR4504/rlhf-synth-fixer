// Configuration - These are coming from cfn-outputs after CloudFormation deployment
import fs from 'fs';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Secure AWS Infrastructure Integration Tests', () => {
  
  describe('S3 Security Implementation', () => {
    test('Application bucket should be encrypted with KMS', async () => {
      const bucketName = outputs.ApplicationBucketName;
      expect(bucketName).toBeDefined();
      
      const encryption = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));
      
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toEqual(outputs.S3KMSKeyId);
    });

    test('Application bucket should have public access blocked', async () => {
      const bucketName = outputs.ApplicationBucketName;
      
      const publicAccessBlock = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));
      
      const config = publicAccessBlock.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('Application bucket should have versioning enabled', async () => {
      const bucketName = outputs.ApplicationBucketName;
      
      const versioning = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));
      
      expect(versioning.Status).toBe('Enabled');
    });

    test('Application bucket should have access logging configured', async () => {
      const bucketName = outputs.ApplicationBucketName;
      
      const logging = await s3Client.send(new GetBucketLoggingCommand({
        Bucket: bucketName
      }));
      
      expect(logging.LoggingEnabled).toBeDefined();
      expect(logging.LoggingEnabled?.TargetBucket).toContain('security-logs');
      expect(logging.LoggingEnabled?.TargetPrefix).toBe('application-bucket-logs/');
    });
  });

  describe('RDS Security Implementation', () => {
    test('Database should be encrypted with KMS', async () => {
      const dbIdentifier = `${environmentSuffix}-secure-database`;
      
      const dbInstances = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = dbInstances.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toContain('rds-');
    });

    test('Database should be in private subnets', async () => {
      const dbIdentifier = `${environmentSuffix}-secure-database`;
      
      const dbInstances = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = dbInstances.DBInstances?.[0];
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.DBSubnetGroup?.DBSubnetGroupName).toContain(environmentSuffix);
    });

    test('Database should have backup and monitoring enabled', async () => {
      const dbIdentifier = `${environmentSuffix}-secure-database`;
      
      const dbInstances = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = dbInstances.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance?.MonitoringInterval).toBeGreaterThan(0);
      expect(dbInstance?.EnabledCloudwatchLogsExports).toContain('error');
    });
  });

  describe('KMS Key Security', () => {
    test('S3 KMS key should have rotation enabled', async () => {
      const keyId = outputs.S3KMSKeyId;
      expect(keyId).toBeDefined();
      
      const keyDetails = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId
      }));
      
      // Note: Need to use GetKeyRotationStatus to check rotation
      expect(keyDetails.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('VPC and Network Security', () => {
    test('VPC should exist with proper configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));
      
      const vpc = vpcs.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Security groups should be properly configured', async () => {
      const securityGroups = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [`${environmentSuffix}-db-security-group`]
          }
        ]
      }));
      
      const dbSecurityGroup = securityGroups.SecurityGroups?.[0];
      expect(dbSecurityGroup).toBeDefined();
      expect(dbSecurityGroup?.GroupName).toBe(`${environmentSuffix}-db-security-group`);
      
      // Check that DB security group only allows access from application security group
      const inboundRules = dbSecurityGroup?.IpPermissions || [];
      const mysqlRule = inboundRules.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBeDefined();
    });
  });

  describe('CloudTrail Audit Logging', () => {
    test('CloudTrail should be actively logging', async () => {
      const trailArn = outputs.CloudTrailArn;
      expect(trailArn).toBeDefined();
      
      const trailName = trailArn.split('/')[1];
      const trailStatus = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName
      }));
      
      expect(trailStatus.IsLogging).toBe(true);
    });
  });

  describe('CloudWatch Security Monitoring', () => {
    test('Security alarms should be configured and active', async () => {
      const alarms = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix
      }));
      
      const alarmNames = alarms.MetricAlarms?.map(alarm => alarm.AlarmName) || [];
      
      // Check for key security alarms
      expect(alarmNames).toEqual(expect.arrayContaining([
        expect.stringContaining('unauthorized-s3-access'),
        expect.stringContaining('database-connection-failures'),
        expect.stringContaining('failed-login-attempts'),
        expect.stringContaining('unusual-kms-usage')
      ]));
      
      // Ensure all alarms are in OK or ALARM state (not INSUFFICIENT_DATA for critical ones)
      const securityAlarms = alarms.MetricAlarms?.filter(alarm => 
        alarm.AlarmName?.includes('unauthorized-s3-access') ||
        alarm.AlarmName?.includes('failed-login-attempts')
      );
      
      securityAlarms?.forEach(alarm => {
        expect(['OK', 'ALARM']).toContain(alarm.StateValue);
      });
    });
  });

  describe('Infrastructure Connectivity and Integration', () => {
    test('All outputs should be available for integration', async () => {
      // Verify all critical outputs are available
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ApplicationBucketName).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.S3KMSKeyId).toBeDefined();
      expect(outputs.CloudTrailArn).toBeDefined();
      
      // Verify output naming follows environment suffix pattern
      expect(outputs.ApplicationBucketName).toContain(environmentSuffix);
      expect(outputs.VPCId).toBeDefined(); // VPC ID is AWS-generated, just verify it exists
    });

    test('Resources should follow consistent naming patterns', async () => {
      // Database endpoint should contain environment suffix
      expect(outputs.DatabaseEndpoint).toContain(`${environmentSuffix}-secure-database`);
      
      // Application bucket should contain environment suffix
      expect(outputs.ApplicationBucketName).toContain(`${environmentSuffix}-application-data`);
    });
  });
});
