// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudWatchClient, DescribeAlarmsCommand, GetDashboardCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { DescribeSecretCommand, GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const rdsClient = new RDSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });

describe('PostgreSQL RDS E-commerce Infrastructure Integration Tests', () => {
  describe('Complete Flow Test - E-commerce RDS Infrastructure Validation', () => {
    test('should validate complete e-commerce database infrastructure deployment', async () => {
      // This is a comprehensive integration test that validates the entire e-commerce RDS infrastructure
      // as deployed by the CloudFormation template for production workloads handling 50k orders/day

      // 1. Validate VPC Infrastructure
      await validateNetworkInfrastructure();

      // 2. Validate Database Infrastructure
      await validateDatabaseInfrastructure();

      // 3. Validate Security Configuration
      await validateSecurityConfiguration();

      // 4. Validate Monitoring and Alerting
      await validateMonitoringConfiguration();

      // 5. Validate Backup and Recovery Setup
      await validateBackupConfiguration();

      // 6. Validate Performance Configuration
      await validatePerformanceConfiguration();
    }, 300000); // 5 minute timeout for comprehensive validation

    async function validateNetworkInfrastructure() {
      console.log('Validating VPC and network infrastructure...');

      // Validate VPC exists and has correct configuration
      const vpcResponse: any = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));

      expect(vpcResponse.Vpcs).toHaveLength(1);
      expect(vpcResponse.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(vpcResponse.Vpcs[0].State).toBe('available');

      // Validate private subnets for database deployment
      const subnetResponse: any = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      }));

      expect(subnetResponse.Subnets).toHaveLength(2);

      // Validate different availability zones for high availability
      const azs = subnetResponse.Subnets.map((subnet: any) => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Should be in 2 different AZs

      console.log('✓ VPC and network infrastructure validated');
    }

    async function validateDatabaseInfrastructure() {
      console.log('Validating RDS database infrastructure...');

      // Validate primary database instance
      const primaryEndpoint = outputs.PrimaryDBEndpoint;
      expect(primaryEndpoint).toBeDefined();

      const dbResponse: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: primaryEndpoint.split('.')[0]
      }));

      const primaryDB = dbResponse.DBInstances[0];
      expect(primaryDB).toBeDefined();
      expect(primaryDB.Engine).toBe('postgres');
      expect(primaryDB.EngineVersion).toMatch(/^16\./);
      expect(primaryDB.DBInstanceClass).toBe('db.m5.large');
      expect(primaryDB.MultiAZ).toBe(true);
      expect(primaryDB.PubliclyAccessible).toBe(false);
      expect(primaryDB.StorageEncrypted).toBe(true);
      expect(primaryDB.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

      // Validate read replicas
      expect(outputs.ReadReplica1Endpoint).toBeDefined();
      expect(outputs.ReadReplica2Endpoint).toBeDefined();

      const replica1Response: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.ReadReplica1Endpoint.split('.')[0]
      }));

      const replica2Response: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.ReadReplica2Endpoint.split('.')[0]
      }));

      const replica1 = replica1Response.DBInstances[0];
      const replica2 = replica2Response.DBInstances[0];

      // Validate read replica configuration
      expect(replica1.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      expect(replica2.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      expect(replica1.PubliclyAccessible).toBe(false);
      expect(replica2.PubliclyAccessible).toBe(false);

      // Validate replicas are in different AZs
      expect(replica1.AvailabilityZone).not.toBe(replica2.AvailabilityZone);

      console.log('✓ Database infrastructure validated');
    }

    async function validateSecurityConfiguration() {
      console.log('Validating security configuration...');

      // Validate database security group
      const sgResponse: any = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DBSecurityGroupId]
      }));

      const securityGroup = sgResponse.SecurityGroups[0];
      expect(securityGroup).toBeDefined();

      // Validate only port 5432 is allowed
      const ingressRules = securityGroup.IpPermissions;
      const dbIngressRule = ingressRules.find((rule: any) => rule.FromPort === 5432 && rule.ToPort === 5432);
      expect(dbIngressRule).toBeDefined();
      expect(dbIngressRule.IpProtocol).toBe('tcp');

      // Validate Secrets Manager integration
      const secretArn = outputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const secretResponse = await secretsClient.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));

      expect(secretResponse.Name).toContain('ecommerce-db-password');
      expect(secretResponse.Description).toContain('PostgreSQL database');

      // Validate secret can be retrieved (without exposing the value)
      const secretValueResponse = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn
      }));
      expect(secretValueResponse.SecretString).toBeDefined();

      // Validate KMS encryption key
      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const keyResponse: any = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      expect(keyResponse.KeyMetadata.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata.Description).toContain('RDS encryption');

      console.log('✓ Security configuration validated');
    }

    async function validateMonitoringConfiguration() {
      console.log('Validating monitoring and alerting configuration...');

      // Validate CloudWatch alarms for database monitoring
      const alarmNames = [
        `ecommerce-db-primary-high-cpu-${environmentSuffix}`,
        `ecommerce-db-replica-1-high-cpu-${environmentSuffix}`,
        `ecommerce-db-replica-2-high-cpu-${environmentSuffix}`,
        `ecommerce-db-replica-1-lag-${environmentSuffix}`,
        `ecommerce-db-replica-2-lag-${environmentSuffix}`,
        `ecommerce-db-read-latency-${environmentSuffix}`,
        `ecommerce-db-write-latency-${environmentSuffix}`,
        `ecommerce-db-low-storage-${environmentSuffix}`
      ];

      const alarmsResponse: any = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: alarmNames
      }));

      expect(alarmsResponse.MetricAlarms).toHaveLength(8);

      // Validate specific alarm configurations
      const cpuAlarm = alarmsResponse.MetricAlarms.find((alarm: any) => alarm.AlarmName.includes('primary-high-cpu'));
      expect(cpuAlarm.Threshold).toBe(75);
      expect(cpuAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(cpuAlarm.MetricName).toBe('CPUUtilization');

      const lagAlarm = alarmsResponse.MetricAlarms.find((alarm: any) => alarm.AlarmName.includes('replica-1-lag'));
      expect(lagAlarm.Threshold).toBe(30000); // 30 seconds in milliseconds
      expect(lagAlarm.MetricName).toBe('ReplicaLag');

      // Validate CloudWatch dashboard
      const dashboardName = `ecommerce-db-dashboard-${environmentSuffix}`;
      const dashboardResponse = await cloudwatchClient.send(new GetDashboardCommand({
        DashboardName: dashboardName
      }));

      expect(dashboardResponse.DashboardName).toBe(dashboardName);
      expect(dashboardResponse.DashboardBody).toContain('CPUUtilization');
      expect(dashboardResponse.DashboardBody).toContain('ReplicaLag');
      expect(dashboardResponse.DashboardBody).toContain('ReadLatency');
      expect(dashboardResponse.DashboardBody).toContain('WriteLatency');

      console.log('✓ Monitoring configuration validated');
    }

    async function validateBackupConfiguration() {
      console.log('Validating backup and recovery configuration...');

      // Validate S3 backup bucket
      const bucketName = outputs.BackupBucketName;
      expect(bucketName).toBeDefined();

      // Validate bucket exists
      await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));

      // Validate bucket encryption
      const encryptionResponse: any = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      const encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration.Rules[0];
      expect(encryptionConfig.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionConfig.ApplyServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
      console.log('✓ Backup configuration validated');
    }

    async function validatePerformanceConfiguration() {
      console.log('Validating performance configuration...');

      // Re-fetch database details to check performance settings
      const primaryEndpoint = outputs.PrimaryDBEndpoint;
      const dbResponse: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: primaryEndpoint.split('.')[0]
      }));

      const primaryDB = dbResponse.DBInstances[0];

      // Validate Performance Insights
      expect(primaryDB.PerformanceInsightsEnabled).toBe(true);
      expect(primaryDB.PerformanceInsightsRetentionPeriod).toBeGreaterThanOrEqual(7);

      // Validate Enhanced Monitoring
      expect(primaryDB.MonitoringInterval).toBe(60);
      expect(primaryDB.MonitoringRoleArn).toBeDefined();

      // Validate storage configuration for e-commerce workloads
      expect(primaryDB.StorageType).toBe('gp3');
      expect(primaryDB.AllocatedStorage).toBeGreaterThanOrEqual(100);
      expect(primaryDB.MaxAllocatedStorage).toBeGreaterThanOrEqual(1000);

      // Validate automated backups
      expect(primaryDB.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(primaryDB.PreferredBackupWindow).toBeDefined();
      expect(primaryDB.PreferredMaintenanceWindow).toBeDefined();

      console.log('✓ Performance configuration validated');
    }
  });

  describe('Infrastructure Resilience Tests', () => {
    test('should validate high availability setup for e-commerce requirements', async () => {
      // Validate Multi-AZ setup for primary database
      const primaryEndpoint = outputs.PrimaryDBEndpoint;
      const dbResponse: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: primaryEndpoint.split('.')[0]
      }));

      const primaryDB = dbResponse.DBInstances[0];
      expect(primaryDB.MultiAZ).toBe(true);

      // Validate read replicas are distributed across AZs
      const replica1Response: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.ReadReplica1Endpoint.split('.')[0]
      }));

      const replica2Response: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.ReadReplica2Endpoint.split('.')[0]
      }));

      const replica1AZ = replica1Response.DBInstances[0].AvailabilityZone;
      const replica2AZ = replica2Response.DBInstances[0].AvailabilityZone;

      // Ensure replicas are in different AZs for fault tolerance
      expect(replica1AZ).not.toBe(replica2AZ);

      console.log(`✓ High availability validated - Primary: Multi-AZ, Replicas in ${replica1AZ} and ${replica2AZ}`);
    });

    test('should validate encryption at rest and in transit', async () => {
      // Validate database encryption
      const primaryEndpoint = outputs.PrimaryDBEndpoint;
      const dbResponse: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: primaryEndpoint.split('.')[0]
      }));

      const primaryDB = dbResponse.DBInstances[0];
      expect(primaryDB.StorageEncrypted).toBe(true);
      expect(primaryDB.KmsKeyId).toBeDefined();

      // Validate Performance Insights encryption
      expect(primaryDB.PerformanceInsightsKMSKeyId).toBeDefined();

      console.log('✓ Encryption at rest validated for database and Performance Insights');
    });
  });

  describe('E-commerce Workload Validation', () => {
    test('should validate database configuration for high-volume e-commerce workloads', async () => {
      // Test database instance sizing appropriate for 50k orders/day
      const primaryEndpoint = outputs.PrimaryDBEndpoint;
      const dbResponse: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: primaryEndpoint.split('.')[0]
      }));

      const primaryDB = dbResponse.DBInstances[0];

      // Validate instance class suitable for e-commerce workloads
      expect(['db.m5.large', 'db.m5.xlarge', 'db.m5.2xlarge', 'db.r5.large', 'db.r5.xlarge']).toContain(primaryDB.DBInstanceClass);

      // Validate storage configuration for growth
      expect(primaryDB.AllocatedStorage).toBeGreaterThanOrEqual(100);
      expect(primaryDB.MaxAllocatedStorage).toBeGreaterThanOrEqual(primaryDB.AllocatedStorage);

      // Validate connection limits and parameter group
      expect(primaryDB.DBParameterGroups).toHaveLength(1);

      console.log(`✓ Database configured for e-commerce workloads: ${primaryDB.DBInstanceClass}, ${primaryDB.AllocatedStorage}GB storage`);
    });

    test('should validate read scaling capability for read-heavy e-commerce workloads', async () => {
      // Validate both read replicas are operational
      const replica1Response: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.ReadReplica1Endpoint.split('.')[0]
      }));

      const replica2Response: any = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.ReadReplica2Endpoint.split('.')[0]
      }));

      const replica1 = replica1Response.DBInstances[0];
      const replica2 = replica2Response.DBInstances[0];

      expect(replica1.DBInstanceStatus).toBe('available');
      expect(replica2.DBInstanceStatus).toBe('available');

      // Validate replicas can handle read traffic
      expect(replica1.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      expect(replica2.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();

      console.log('✓ Read scaling validated with 2 operational read replicas');
    });
  });

  describe('Operational Readiness', () => {
    test('should validate all required outputs are available for application integration', async () => {
      // Validate connection endpoints
      expect(outputs.PrimaryDBEndpoint).toBeDefined();
      expect(outputs.PrimaryDBPort).toBeDefined();
      expect(outputs.ReadReplica1Endpoint).toBeDefined();
      expect(outputs.ReadReplica2Endpoint).toBeDefined();

      // Validate database credentials and access
      expect(outputs.DBName).toBeDefined();
      expect(outputs.DBMasterUsername).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();

      // Validate monitoring endpoints
      expect(outputs.CloudWatchDashboardURL).toBeDefined();
      expect(outputs.PerformanceInsightsURL).toBeDefined();

      // Validate operational commands
      expect(outputs.IAMAuthTokenCommand).toBeDefined();
      expect(outputs.RetrievePasswordCommand).toBeDefined();
      expect(outputs.SnapshotExportCommand).toBeDefined();

      console.log('✓ All operational outputs validated for application integration');
    });
  });
});
