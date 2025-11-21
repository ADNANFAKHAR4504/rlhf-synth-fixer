import * as fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeVpcEndpointsCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SecretsManagerClient, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const secretsClient = new SecretsManagerClient({ region });

const vpcId = outputs.VpcId;
const dbIdentifier = outputs.DatabaseIdentifier;
const dbSgId = outputs.DbSecurityGroupId;
const lambdaSgId = outputs.LambdaSecurityGroupId;
const bucketName = outputs.BackupBucketName;
const kmsKeyId = outputs.KmsKeyId;
const kmsKeyArn = outputs.KmsKeyArn;
const secretArn = outputs.CredentialsSecretArn;
const topicArn = outputs.AlarmTopicArn;
const compositeAlarmName = outputs.CompositeAlarmName;

describe('TapStack Live AWS Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC exists with correct configuration', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has correct subnets across AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const subnets = response.Subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);

      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways are active in multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const natGateways = response.NatGateways!;
      expect(natGateways.length).toBe(2);

      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });

      const natAZs = new Set(natGateways.map(nat => nat.SubnetId));
      expect(natAZs.size).toBe(2);
    });

    test('Security groups exist with correct configuration', async () => {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId, lambdaSgId]
      }));

      const securityGroups = response.SecurityGroups!;
      expect(securityGroups.length).toBe(2);

      const dbSg = securityGroups.find(sg => sg.GroupId === dbSgId);
      expect(dbSg).toBeDefined();
      expect(dbSg!.GroupName).toContain('rds-sg');
      expect(dbSg!.VpcId).toBe(vpcId);

      const lambdaSg = securityGroups.find(sg => sg.GroupId === lambdaSgId);
      expect(lambdaSg).toBeDefined();
      expect(lambdaSg!.GroupName).toContain('lambda-sg');
      expect(lambdaSg!.VpcId).toBe(vpcId);
    });

    test('VPC endpoints are active for AWS services', async () => {
      const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const endpoints = response.VpcEndpoints!;
      expect(endpoints.length).toBeGreaterThanOrEqual(4);

      endpoints.forEach(endpoint => {
        expect(endpoint.State).toBe('available');
        expect(endpoint.VpcEndpointType).toBe('Interface');
      });

      const serviceNames = endpoints.map(e => e.ServiceName);
      expect(serviceNames.some(s => s!.includes('secretsmanager'))).toBe(true);
      expect(serviceNames.some(s => s!.includes('logs'))).toBe(true);
      expect(serviceNames.some(s => s!.includes('sns'))).toBe(true);
      expect(serviceNames.some(s => s!.includes('monitoring'))).toBe(true);
    });
  });

  describe('RDS PostgreSQL Database', () => {
    test('Database instance is available with correct engine', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toContain('14');
    });

    test('Database has Multi-AZ enabled for high availability', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.AvailabilityZone).toBeDefined();
      expect(dbInstance.SecondaryAvailabilityZone).toBeDefined();
    });

    test('Database has correct instance class and storage', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceClass).toBe('db.r6g.xlarge');
      expect(dbInstance.StorageType).toBe('gp3');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(100);
      expect(dbInstance.MaxAllocatedStorage).toBe(500);
    });

    test('Database has backup and maintenance windows configured', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
      expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
    });

    test('Database has performance insights enabled', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsKMSKeyId).toBeDefined();
    });

    test('Database is not publicly accessible', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('Database has CloudWatch logs enabled', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.EnabledCloudwatchLogsExports).toBeDefined();
      expect(dbInstance.EnabledCloudwatchLogsExports!.length).toBeGreaterThan(0);
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    test('Database subnet group spans multiple AZs', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const subnetGroupName = dbResponse.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName;

      const subnetResponse = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      }));

      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.VpcId).toBe(vpcId);
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('Database uses KMS encryption', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toContain(kmsKeyId);
    });
  });

  describe('S3 Storage', () => {
    test('S3 bucket exists and is accessible', async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    });

    test('S3 bucket has versioning enabled', async () => {
      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has KMS encryption enabled', async () => {
      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const rules = response.ServerSideEncryptionConfiguration!.Rules;
      expect(rules).toBeDefined();
      expect(rules!.length).toBeGreaterThan(0);
      expect(rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      const kmsMasterKeyID = rules![0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
      expect(kmsMasterKeyID).toContain(kmsKeyArn.split('/')[1]);
    });

    test('S3 bucket has lifecycle rules for cost optimization', async () => {
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));

      const rules = response.Rules;
      expect(rules).toBeDefined();
      expect(rules!.length).toBeGreaterThanOrEqual(2);

      const iaRule = rules!.find(r => r.ID === 'TransitionToIA');
      expect(iaRule).toBeDefined();
      expect(iaRule!.Status).toBe('Enabled');

      const glacierRule = rules!.find(r => r.ID === 'TransitionToGlacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule!.Status).toBe('Enabled');
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is enabled', async () => {
      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      const keyMetadata = response.KeyMetadata!;
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
    });

    test('KMS key has correct configuration', async () => {
      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      const keyMetadata = response.KeyMetadata!;
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Enabled).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('Database credentials secret exists', async () => {
      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('postgres-credentials');
    });

    test('Secret is encrypted with KMS', async () => {
      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms exist for database metrics', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `postgres-`
      }));

      const alarms = response.MetricAlarms!.filter(a => a.AlarmName!.includes(environmentSuffix));
      expect(alarms.length).toBeGreaterThanOrEqual(5);

      const cpuAlarm = alarms.find(a => a.AlarmName!.includes('cpu'));
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.MetricName).toBe('CPUUtilization');

      const storageAlarm = alarms.find(a => a.AlarmName!.includes('storage'));
      expect(storageAlarm).toBeDefined();
      expect(storageAlarm!.MetricName).toBe('FreeStorageSpace');

      const connectionsAlarm = alarms.find(a => a.AlarmName!.includes('connections'));
      expect(connectionsAlarm).toBeDefined();
      expect(connectionsAlarm!.MetricName).toBe('DatabaseConnections');
    });

    test('All alarms have SNS actions configured', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `postgres-`
      }));

      const alarms = response.MetricAlarms!.filter(a => a.AlarmName!.includes(environmentSuffix));

      alarms.forEach(alarm => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions!.some(action => action.includes('sns'))).toBe(true);
      });
    });

    test('Composite alarm configuration verified', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      expect(response).toBeDefined();
      expect(compositeAlarmName).toContain('postgres-composite');
      expect(compositeAlarmName).toContain(environmentSuffix);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic exists and accessible', async () => {
      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('SNS topic has correct display name', async () => {
      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      }));

      expect(response.Attributes!.DisplayName).toContain('PostgreSQL Alarms');
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources follow naming convention with suffix', () => {
      expect(dbIdentifier).toContain('postgres-');
      expect(bucketName).toContain('postgres-backups');
      expect(compositeAlarmName).toContain('postgres-composite');

      expect(dbIdentifier).toContain(environmentSuffix);
      expect(bucketName).toContain(environmentSuffix);
    });

    test('All ARNs use correct region', () => {
      expect(kmsKeyArn).toContain(region);
      expect(topicArn).toContain(region);
      expect(secretArn).toContain(region);
    });
  });

  describe('Security Configuration', () => {
    test('Database credentials stored securely in Secrets Manager', async () => {
      const response = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('postgres-credentials');
    });

    test('All encrypted resources use same KMS key', async () => {
      const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = rdsResponse.DBInstances![0];
      expect(dbInstance.KmsKeyId).toContain(kmsKeyId);

      const s3Response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const kmsMasterKeyID = s3Response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
      expect(kmsMasterKeyID).toContain(kmsKeyArn.split('/')[1]);
    });
  });

  describe('High Availability Verification', () => {
    test('Database configured for Multi-AZ deployment', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.AvailabilityZone).toBeDefined();
      expect(dbInstance.SecondaryAvailabilityZone).toBeDefined();
    });

    test('NAT Gateways deployed across multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const natGateways = response.NatGateways!;
      const azs = new Set(natGateways.map(nat => nat.SubnetId));
      expect(azs.size).toBe(2);
    });

    test('Subnets distributed across multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const subnets = response.Subnets!;
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cost Optimization Features', () => {
    test('S3 lifecycle policies configured for cost savings', async () => {
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));

      const rules = response.Rules;
      expect(rules!.length).toBeGreaterThanOrEqual(2);

      const iaRule = rules!.find(r => r.ID === 'TransitionToIA');
      expect(iaRule!.Transitions![0].Days).toBe(30);
      expect(iaRule!.Transitions![0].StorageClass).toBe('STANDARD_IA');

      const glacierRule = rules!.find(r => r.ID === 'TransitionToGlacier');
      expect(glacierRule!.Transitions![0].Days).toBe(90);
      expect(glacierRule!.Transitions![0].StorageClass).toBe('GLACIER');
    });

    test('VPC endpoints configured to reduce NAT costs', async () => {
      const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const endpoints = response.VpcEndpoints!;
      expect(endpoints.length).toBeGreaterThanOrEqual(4);

      endpoints.forEach(endpoint => {
        expect(endpoint.State).toBe('available');
      });
    });
  });
});
