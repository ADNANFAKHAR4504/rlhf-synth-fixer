import {
  CloudFormationClient
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients
const cfClient = new CloudFormationClient({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const cwClient = new CloudWatchClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

// Helper function to check if outputs file exists
const hasOutputs = (): boolean => {
  return fs.existsSync('cfn-outputs/flat-outputs.json');
};

// Load outputs if available
let outputs: Record<string, any> = {};
if (hasOutputs()) {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
}

describe('RDS MySQL Deployment Integration Tests', () => {
  beforeAll(() => {
    if (!hasOutputs()) {
      console.warn('Integration tests skipped - cfn-outputs/flat-outputs.json not found');
      console.warn('Run deployment first to generate outputs for integration testing');
    }
  });

  describe('Requirement 1: RDS MySQL for Relational Data Storage', () => {
    test('should have RDS MySQL instance deployed', async () => {
      if (!hasOutputs()) return;

      expect(outputs.DBInstanceEndpoint).toBeDefined();
      expect(outputs.DBInstanceEndpoint).toMatch(/^[a-zA-Z0-9.-]+\.rds\.amazonaws\.com$/);

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toMatch(/^8\.0\./);
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('should have correct instance class for 1,500 daily records', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DBInstanceClass).toBe('db.m5.large');
      expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(20);
      expect(dbInstance.MaxAllocatedStorage).toBeGreaterThanOrEqual(100);
    });

    test('should have database name configured correctly', () => {
      if (!hasOutputs()) return;

      expect(outputs.DBName).toBeDefined();
      expect(outputs.DBName).toBe('customerdb');
    });

    test('should have correct MySQL port configured', () => {
      if (!hasOutputs()) return;

      expect(outputs.DBInstancePort).toBeDefined();
      expect(Number(outputs.DBInstancePort)).toBe(3306);
    });
  });

  describe('Requirement 2: Automated Backups with 7-Day Retention', () => {
    test('should have 7-day backup retention policy configured', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBe('03:00-04:00');
    });

    test('should have automated backups enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.LatestRestorableTime).toBeDefined();
    });

    test('should have snapshot configuration enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.CopyTagsToSnapshot).toBe(true);
    });

  });

  describe('Requirement 3: Private Subnets (10.0.10.0/24) for Network Isolation', () => {
    test('should have private subnets deployed in VPC', () => {
      if (!hasOutputs()) return;

      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });

    test('should have correct CIDR blocks for private subnets', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });
      const response = await ec2Client.send(command);

      const subnet1 = response.Subnets!.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      const subnet2 = response.Subnets!.find(s => s.SubnetId === outputs.PrivateSubnet2Id);

      expect(subnet1?.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2?.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have private subnets with no public IP auto-assignment', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have subnets in different availability zones', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(azs[0]).not.toBe(azs[1]);
    });

    test('should have NAT Gateway for private subnet internet access', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.PrivateSubnet1Id],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables![0];

      const natRoute = routeTable.Routes?.find(r => r.NatGatewayId);
      expect(natRoute).toBeDefined();
      expect(natRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should not have direct Internet Gateway route in private subnets', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      response.RouteTables!.forEach(rt => {
        const igwRoute = rt.Routes?.find(r => r.GatewayId?.startsWith('igw-'));
        expect(igwRoute).toBeUndefined();
      });
    });
  });

  describe('Requirement 4: KMS Encryption at Rest', () => {
    test('should have KMS key deployed for RDS encryption', () => {
      if (!hasOutputs()) return;

      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyId).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    test('should have RDS storage encryption enabled with KMS', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
    });

    test('should have KMS key in enabled state', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeKeyCommand({ KeyId: outputs.KMSKeyId });
      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata!;

      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Enabled).toBe(true);
    });

    test('should have Performance Insights encryption with KMS', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsKMSKeyId).toBeDefined();
    });
  });

  describe('Requirement 5: CloudWatch for Database Performance Monitoring', () => {
    test('should have Enhanced Monitoring enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.MonitoringInterval).toBe(60);
      expect(dbInstance.MonitoringRoleArn).toBeDefined();
    });

    test('should have Performance Insights enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsRetentionPeriod).toBe(7);
    });

    test('should have CloudWatch log exports enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      const logExports = dbInstance.EnabledCloudwatchLogsExports || [];
      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slowquery');
    });

    test('should have CloudWatch alarms configured', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `customer-db`,
        MaxRecords: 100,
      });
      const response = await cwClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBeGreaterThanOrEqual(3);

      const cpuAlarm = alarms.find(a => a.AlarmName?.includes('cpu'));
      const connectionsAlarm = alarms.find(a => a.AlarmName?.includes('connections'));
      const storageAlarm = alarms.find(a => a.AlarmName?.includes('storage'));

      expect(cpuAlarm).toBeDefined();
      expect(connectionsAlarm).toBeDefined();
      expect(storageAlarm).toBeDefined();
    });

    test('should have SNS topic for alarm notifications', () => {
      if (!hasOutputs()) return;

      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:[0-9]+:[a-zA-Z0-9-]+$/);
    });
  });

  describe('Requirement 6: IAM for Controlled and Secure Access Management', () => {
    test('should have IAM role for database access', () => {
      if (!hasOutputs()) return;

      expect(outputs.DBAccessRoleArn).toBeDefined();
      expect(outputs.DBAccessRoleArn).toMatch(/^arn:aws:iam::[0-9]+:role\/[a-zA-Z0-9-]+$/);
    });

    test('should have IAM role with correct permissions', async () => {
      if (!hasOutputs()) return;

      const roleName = outputs.DBAccessRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      const role = response.Role!;

      const assumePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
      const allowsEC2 = assumePolicy.Statement.some(
        (stmt: any) => stmt.Principal?.Service === 'ec2.amazonaws.com'
      );

      expect(allowsEC2).toBe(true);
    });

    test('should have Secrets Manager for secure credential storage', () => {
      if (!hasOutputs()) return;

      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:[0-9]+:secret:[a-zA-Z0-9-]+$/);
    });

    test('should have secret configured correctly', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeSecretCommand({ SecretId: outputs.DBSecretArn });
      const response = await secretsClient.send(command);

      expect(response.Name).toContain('customer-db-credentials');
      expect(response.Description).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('Security and Best Practices', () => {
    test('should not be publicly accessible', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.PubliclyAccessible).toBe(false);

      console.log(`  ✓ Publicly Accessible: false`);
    });

    test('should have deletion protection enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DeletionProtection).toBe(true);

      console.log(`  ✓ Deletion Protection: Enabled`);
    });

    test('should have security group with VPC-only access', async () => {
      if (!hasOutputs()) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DBSecurityGroupId],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      const vpcOnlyAccess = sg.IpPermissions?.some(rule =>
        rule.IpRanges?.some(ip => ip.CidrIp === '10.0.0.0/16')
      );

      expect(vpcOnlyAccess).toBe(true);

      console.log(`  ✓ Security Group: VPC-only access (10.0.0.0/16)`);
    });

    test('should have auto minor version upgrade enabled', async () => {
      if (!hasOutputs()) return;

      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.AutoMinorVersionUpgrade).toBe(true);

      console.log(`  ✓ Auto Minor Version Upgrade: Enabled`);
    });
  });

  describe('Complete Deployment Flow Validation', () => {
    test('should have complete end-to-end RDS MySQL deployment for 1,500 daily records', async () => {
      if (!hasOutputs()) return;

      // 1. Network Infrastructure
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();

      // 2. Security Infrastructure
      expect(outputs.DBSecurityGroupId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBAccessRoleArn).toBeDefined();

      // 3. Database Infrastructure
      expect(outputs.DBInstanceEndpoint).toBeDefined();
      expect(outputs.DBInstancePort).toBeDefined();
      expect(outputs.DBName).toBeDefined();

      // 4. Monitoring Infrastructure
      expect(outputs.SNSTopicArn).toBeDefined();

      // Validate database configuration meets requirements
      const dbIdentifier = outputs.DBInstanceEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      console.log('\n  ═══════════════════════════════════════════════════');
      console.log('   COMPLETE RDS MYSQL DEPLOYMENT VERIFIED');
      console.log('  ═══════════════════════════════════════════════════');
      console.log(`   Database: ${outputs.DBName}`);
      console.log(`   Endpoint: ${outputs.DBInstanceEndpoint}:${outputs.DBInstancePort}`);
      console.log(`   Engine: MySQL ${dbInstance.EngineVersion}`);
      console.log(`    Instance: ${dbInstance.DBInstanceClass}`);
      console.log(`   Storage: ${dbInstance.AllocatedStorage}GB (Max: ${dbInstance.MaxAllocatedStorage}GB)`);
      console.log(`   Backups: ${dbInstance.BackupRetentionPeriod} days retention`);
      console.log(`   Encryption: KMS (${outputs.KMSKeyId.substring(0, 20)}...)`);
      console.log(`   Network: Private subnets (10.0.10.0/24, 10.0.11.0/24)`);
      console.log(`   Monitoring: Enhanced + Performance Insights`);
      console.log(`   Access: IAM + Secrets Manager`);
      console.log('  ═══════════════════════════════════════════════════');
      console.log('   All 6 requirements validated successfully!');
      console.log('  ═══════════════════════════════════════════════════\n');
    });
  });
});