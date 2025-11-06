import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const rdsClient = new RDSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const ec2Client = new EC2Client({ region });
const cwClient = new CloudWatchClient({ region });

describe('RDS PostgreSQL Stack Integration Tests', () => {
  describe('Deployment Outputs', () => {
    test('should have all required outputs', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabasePort).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.DatabaseInstanceIdentifier).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseEncryptionKeyId).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('database port should be PostgreSQL default', () => {
      expect(outputs.DatabasePort).toBe('5432');
    });

    test('database endpoint should be valid format', () => {
      expect(outputs.DatabaseEndpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.[a-z-]+-[0-9]+\.rds\.amazonaws\.com$/);
    });
  });

  describe('RDS Database Instance', () => {
    let dbInstance: any;

    beforeAll(async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.DatabaseInstanceIdentifier
        })
      );
      dbInstance = response.DBInstances![0];
    });

    test('should exist and be available', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('should be PostgreSQL 14', () => {
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toMatch(/^14\./);
    });

    test('should use correct instance class', () => {
      expect(dbInstance.DBInstanceClass).toBe('db.r6g.xlarge');
    });

    test('should have Multi-AZ enabled', () => {
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('should use gp3 storage', () => {
      expect(dbInstance.StorageType).toBe('gp3');
    });

    test('should have 100GB allocated storage', () => {
      expect(dbInstance.AllocatedStorage).toBe(100);
    });

    test('should have storage encryption enabled', () => {
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
      expect(dbInstance.KmsKeyId).toContain(outputs.DatabaseEncryptionKeyId);
    });

    test('should not be publicly accessible', () => {
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('should have 7-day backup retention', () => {
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    });

    test('should have correct backup window', () => {
      expect(dbInstance.PreferredBackupWindow).toBe('03:00-04:00');
    });

    test('should have Performance Insights enabled', () => {
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsRetentionPeriod).toBe(7);
      expect(dbInstance.PerformanceInsightsKMSKeyId).toBeDefined();
    });

    test('should have CloudWatch logs enabled', () => {
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('upgrade');
    });

    test('should not have deletion protection', () => {
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('should have correct endpoint', () => {
      expect(dbInstance.Endpoint.Address).toBe(outputs.DatabaseEndpoint);
      expect(dbInstance.Endpoint.Port).toBe(5432);
    });
  });

  describe('RDS Parameter Group', () => {
    let parameterGroup: any;

    beforeAll(async () => {
      const dbInstance = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.DatabaseInstanceIdentifier
        })
      );

      const pgName = dbInstance.DBInstances![0].DBParameterGroups![0].DBParameterGroupName;
      const response = await rdsClient.send(
        new DescribeDBParameterGroupsCommand({
          DBParameterGroupName: pgName
        })
      );
      parameterGroup = response.DBParameterGroups![0];
    });

    test('should exist', () => {
      expect(parameterGroup).toBeDefined();
    });

    test('should be for PostgreSQL 14 family', () => {
      expect(parameterGroup.DBParameterGroupFamily).toBe('postgres14');
    });

    test('should have descriptive name', () => {
      expect(parameterGroup.DBParameterGroupName).toBeDefined();
      expect(parameterGroup.Description).toContain('PostgreSQL 14');
    });
  });

  describe('RDS Subnet Group', () => {
    let subnetGroup: any;

    beforeAll(async () => {
      const dbInstance = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.DatabaseInstanceIdentifier
        })
      );

      const sgName = dbInstance.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName;
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: sgName
        })
      );
      subnetGroup = response.DBSubnetGroups![0];
    });

    test('should exist', () => {
      expect(subnetGroup).toBeDefined();
    });

    test('should have 3 subnets', () => {
      expect(subnetGroup.Subnets).toHaveLength(3);
    });

    test('subnets should be in different availability zones', () => {
      const azs = subnetGroup.Subnets.map((s: any) => s.SubnetAvailabilityZone.Name);
      const uniqueAZs = new Set(azs);
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Group', () => {
    let securityGroup: any;

    beforeAll(async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.DatabaseSecurityGroupId]
        })
      );
      securityGroup = response.SecurityGroups![0];
    });

    test('should exist', () => {
      expect(securityGroup).toBeDefined();
    });

    test('should allow PostgreSQL traffic on port 5432', () => {
      const ingressRules = securityGroup.IpPermissions || [];
      const postgresRules = ingressRules.filter((rule: any) =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRules.length).toBeGreaterThan(0);
    });

    test('should have descriptive group name', () => {
      expect(securityGroup.GroupName).toContain('rds-postgres');
    });
  });

  describe('KMS Encryption Key', () => {
    let keyMetadata: any;
    let rotationStatus: any;

    beforeAll(async () => {
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.DatabaseEncryptionKeyId
        })
      );
      keyMetadata = keyResponse.KeyMetadata;

      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: outputs.DatabaseEncryptionKeyId
        })
      );
      rotationStatus = rotationResponse.KeyRotationEnabled;
    });

    test('should exist', () => {
      expect(keyMetadata).toBeDefined();
    });

    test('should be enabled', () => {
      expect(keyMetadata.KeyState).toBe('Enabled');
    });

    test('should have key rotation enabled', () => {
      expect(rotationStatus).toBe(true);
    });

    test('should be a customer managed key', () => {
      expect(keyMetadata.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('Secrets Manager Secret', () => {
    let secret: any;
    let secretValue: any;

    beforeAll(async () => {
      const describeResponse = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DatabaseSecretArn
        })
      );
      secret = describeResponse;

      const valueResponse = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.DatabaseSecretArn
        })
      );
      secretValue = JSON.parse(valueResponse.SecretString!);
    });

    test('should exist', () => {
      expect(secret).toBeDefined();
    });

    test('should be encrypted with KMS', () => {
      expect(secret.KmsKeyId).toBeDefined();
      expect(secret.KmsKeyId).toContain(outputs.DatabaseEncryptionKeyId);
    });

    test('should contain username and password', () => {
      expect(secretValue.username).toBeDefined();
      expect(secretValue.password).toBeDefined();
    });

    test('password should meet length requirements', () => {
      expect(secretValue.password.length).toBeGreaterThanOrEqual(32);
    });

    test('should have RDS metadata attached', () => {
      expect(secret.Name).toContain('rds-postgres-credentials');
    });
  });

  describe('CloudWatch Alarms', () => {
    let alarms: any[];

    beforeAll(async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `rds-postgres-`
        })
      );
      alarms = response.MetricAlarms || [];

      // Filter to only alarms for this environment
      alarms = alarms.filter(alarm =>
        alarm.AlarmName?.includes(outputs.EnvironmentSuffix)
      );
    });

    test('should have CPU alarm', () => {
      const cpuAlarm = alarms.find(a =>
        a.MetricName === 'CPUUtilization' && a.AlarmName?.includes('cpu')
      );
      expect(cpuAlarm).toBeDefined();
    });

    test('CPU alarm should have correct configuration', () => {
      const cpuAlarm = alarms.find(a => a.MetricName === 'CPUUtilization');
      if (cpuAlarm) {
        expect(cpuAlarm.Threshold).toBe(80);
        expect(cpuAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(cpuAlarm.Namespace).toBe('AWS/RDS');
      }
    });

    test('should have storage alarm', () => {
      const storageAlarm = alarms.find(a =>
        a.MetricName === 'FreeStorageSpace' && a.AlarmName?.includes('storage')
      );
      expect(storageAlarm).toBeDefined();
    });

    test('storage alarm should have correct configuration', () => {
      const storageAlarm = alarms.find(a => a.MetricName === 'FreeStorageSpace');
      if (storageAlarm) {
        expect(storageAlarm.Threshold).toBe(10737418240); // 10GB in bytes
        expect(storageAlarm.ComparisonOperator).toBe('LessThanThreshold');
        expect(storageAlarm.Namespace).toBe('AWS/RDS');
      }
    });
  });

  describe('Resource Naming Convention', () => {
    test('database instance should include environment suffix', () => {
      expect(outputs.DatabaseInstanceIdentifier).toContain(outputs.EnvironmentSuffix);
    });

    test('security group should include environment suffix', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.DatabaseSecurityGroupId]
        })
      );
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain(outputs.EnvironmentSuffix);
    });

    test('secret should include environment suffix', () => {
      expect(outputs.DatabaseSecretArn).toContain(outputs.EnvironmentSuffix);
    });
  });
});
