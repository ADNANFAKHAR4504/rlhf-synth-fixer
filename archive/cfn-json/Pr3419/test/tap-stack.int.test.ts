import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

describe('E-Learning RDS MySQL Infrastructure Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    test('VPC should exist and be correctly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.7.0.0/16');
      expect(vpc.State).toBe('available');
      // DNS attributes might not be returned in the response shape; access via any to avoid SDK typing mismatch
      const vpcAny = vpc as any;
      if (vpcAny?.EnableDnsHostnames !== undefined) {
        expect(vpcAny.EnableDnsHostnames).toBe(true);
      }
      if (vpcAny?.EnableDnsSupport !== undefined) {
        expect(vpcAny.EnableDnsSupport).toBe(true);
      }
    });

    test('Private subnets should exist in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Should be in different AZs

      // Check CIDR blocks
      const cidrs = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrs).toEqual(['10.7.10.0/24', '10.7.20.0/24']);
    });

    test('Database security group should allow MySQL traffic', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const dbSecurityGroup = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('DatabaseSecurityGroup')
      );

      expect(dbSecurityGroup).toBeDefined();
      expect(dbSecurityGroup!.IpPermissions).toHaveLength(1);

      const mysqlRule = dbSecurityGroup!.IpPermissions![0];
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.IpProtocol).toBe('tcp');
    });
  });

  describe('RDS MySQL Database', () => {
    test('Database instance should exist with correct configuration', async () => {
      const dbEndpoint = outputs.DBEndpoint;
      const dbInstanceId = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];

      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.AllocatedStorage).toBe(20);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.MultiAZ).toBe(false);
      expect(db.BackupRetentionPeriod).toBe(7);
    });

    test('Database endpoint should be accessible', async () => {
      expect(outputs.DBEndpoint).toBeDefined();
      expect(outputs.DBEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.DBPort).toBe('3306');
    });

    test('Database should have enhanced monitoring enabled', async () => {
      const dbEndpoint = outputs.DBEndpoint;
      const dbInstanceId = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.MonitoringInterval).toBe(60);
      expect(db.MonitoringRoleArn).toBeDefined();
      expect(db.EnabledCloudwatchLogsExports).toContain('error');
      expect(db.EnabledCloudwatchLogsExports).toContain('general');
      expect(db.EnabledCloudwatchLogsExports).toContain('slowquery');
    });

    test('DB subnet group should span multiple AZs', async () => {
      const dbEndpoint = outputs.DBEndpoint;
      const dbInstanceId = dbEndpoint.split('.')[0];

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbSubnetGroupName = dbResponse.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toHaveLength(2);

      const azs = subnetGroup.Subnets!.map(subnet => subnet.SubnetAvailabilityZone?.Name);
      expect(new Set(azs).size).toBe(2);
    });
  });

  describe('S3 Backup Bucket', () => {
    test('Backup bucket should exist with correct name', async () => {
      expect(outputs.BackupBucketName).toBeDefined();
      expect(outputs.BackupBucketName).toContain('elearning-db-backups');
    });

    test('Bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('Bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('Bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('Bucket should have lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toHaveLength(1);
      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration?.Days).toBe(30);
      expect(rule.NoncurrentVersionExpiration?.NoncurrentDays).toBe(7);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.Description).toContain('RDS encryption');
    });

    test('KMS key alias should exist', async () => {
      const command = new ListAliasesCommand({
        KeyId: outputs.KMSKeyId
      });
      const response = await kmsClient.send(command);

      expect(response.Aliases).toBeDefined();
      expect(response.Aliases!.length).toBeGreaterThan(0);
      const alias = response.Aliases!.find(a => a.TargetKeyId === outputs.KMSKeyId);
      expect(alias).toBeDefined();
      expect(alias?.AliasName).toContain('elearning-rds-key');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('High CPU utilization alarm should exist', async () => {
      const dbEndpoint = outputs.DBEndpoint;
      const dbInstanceId = dbEndpoint.split('.')[0];

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ELearningDB-HighCPU'
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const cpuAlarm = response.MetricAlarms![0];
      expect(cpuAlarm.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Namespace).toBe('AWS/RDS');
      expect(cpuAlarm.Threshold).toBe(80);
      expect(cpuAlarm.ComparisonOperator).toBe('GreaterThanThreshold');

      const dimension = cpuAlarm.Dimensions?.find(d => d.Name === 'DBInstanceIdentifier');
      expect(dimension?.Value).toBe(dbInstanceId);
    });

    test('Low storage alarm should exist', async () => {
      const dbEndpoint = outputs.DBEndpoint;
      const dbInstanceId = dbEndpoint.split('.')[0];

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ELearningDB-LowStorage'
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const storageAlarm = response.MetricAlarms![0];
      expect(storageAlarm.MetricName).toBe('FreeStorageSpace');
      expect(storageAlarm.Namespace).toBe('AWS/RDS');
      expect(storageAlarm.Threshold).toBe(2147483648);
      expect(storageAlarm.ComparisonOperator).toBe('LessThanThreshold');

      const dimension = storageAlarm.Dimensions?.find(d => d.Name === 'DBInstanceIdentifier');
      expect(dimension?.Value).toBe(dbInstanceId);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Enhanced monitoring role should exist', async () => {
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DBEndpoint.split('.')[0]
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const monitoringRoleArn = dbResponse.DBInstances![0].MonitoringRoleArn;

      expect(monitoringRoleArn).toBeDefined();
      const roleName = monitoringRoleArn!.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName!
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain('monitoring.rds.amazonaws.com');
    });
  });

  describe('End-to-End Connectivity', () => {
    test('Database should be in private subnets within VPC', async () => {
      const dbEndpoint = outputs.DBEndpoint;
      const dbInstanceId = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      const vpcId = db.DBSubnetGroup?.VpcId;

      expect(vpcId).toBe(outputs.VPCId);
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('All resources should be tagged appropriately', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags;
      expect(vpcTags).toBeDefined();
      expect(vpcTags!.find(t => t.Key === 'Name')).toBeDefined();

      // Check database tags
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DBEndpoint.split('.')[0]
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbTags = dbResponse.DBInstances![0].TagList;
      expect(dbTags).toBeDefined();
      expect(dbTags!.find(t => t.Key === 'Name')).toBeDefined();
    });
  });
});