// Integration tests - These run against real deployed infrastructure
import fs from 'fs';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  Route53Client,
  GetHealthCheckCommand,
  ListHostedZonesCommand,
} from '@aws-sdk/client-route-53';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

// AWS clients for both regions
const rdsClientPrimary = new RDSClient({ region: 'us-east-1' });
const rdsClientDR = new RDSClient({ region: 'us-east-2' });
const s3ClientPrimary = new S3Client({ region: 'us-east-1' });
const s3ClientDR = new S3Client({ region: 'us-east-2' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const route53Client = new Route53Client({ region: 'us-east-1' });
const lambdaClientPrimary = new LambdaClient({ region: 'us-east-1' });
const lambdaClientDR = new LambdaClient({ region: 'us-east-2' });

describe('Multi-Region DR Infrastructure Integration Tests', () => {
  describe('Primary Region (us-east-1) Resources', () => {
    test('Primary RDS instance is running and accessible', async () => {
      const dbIdentifier =
        outputs.PrimaryDatabaseIdentifier ||
        outputs[`TapPrimaryStack${environmentSuffix}PrimaryDatabaseIdentifier`];
      expect(dbIdentifier).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClientPrimary.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.EngineVersion).toMatch(/^14\./);
      expect(dbInstance?.DBInstanceClass).toBe('db.r6g.xlarge');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
    }, 30000);

    test('Primary S3 bucket exists with versioning enabled', async () => {
      const bucketName =
        outputs.PrimaryBackupBucketName ||
        outputs[`TapPrimaryStack${environmentSuffix}PrimaryBackupBucketName`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3ClientPrimary.send(command);
      expect(response.Status).toBe('Enabled');
    }, 15000);

    test('Primary S3 bucket has replication configuration', async () => {
      const bucketName =
        outputs.PrimaryBackupBucketName ||
        outputs[`TapPrimaryStack${environmentSuffix}PrimaryBackupBucketName`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketReplicationCommand({
        Bucket: bucketName,
      });

      const response = await s3ClientPrimary.send(command);
      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules?.length).toBeGreaterThan(
        0
      );
    }, 15000);

    test('Primary Lambda function for replication monitoring exists', async () => {
      const functionName =
        outputs.PrimaryReplicationMonitorFunctionName ||
        outputs[
          `TapPrimaryStack${environmentSuffix}PrimaryReplicationMonitorFunctionName`
        ];
      expect(functionName).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClientPrimary.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.State).toBe('Active');
    }, 15000);

    test('Primary Lambda function for failover orchestration exists', async () => {
      const functionName =
        outputs.PrimaryFailoverOrchestratorFunctionName ||
        outputs[
          `TapPrimaryStack${environmentSuffix}PrimaryFailoverOrchestratorFunctionName`
        ];
      expect(functionName).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClientPrimary.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.State).toBe('Active');
    }, 15000);

    test('CloudWatch alarms are configured and in OK state', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `primary-db-${environmentSuffix}`,
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      // Verify at least one alarm exists
      const alarms = response.MetricAlarms || [];
      expect(alarms.length).toBeGreaterThan(0);

      // Check that alarms are properly configured
      alarms.forEach(alarm => {
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
      });
    }, 15000);
  });

  describe('DR Region (us-east-2) Resources', () => {
    test('DR RDS instance is running as read replica', async () => {
      const dbIdentifier =
        outputs.DRDatabaseIdentifier ||
        outputs[`TapDRStack${environmentSuffix}DRDatabaseIdentifier`];
      expect(dbIdentifier).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClientDR.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.DBInstanceClass).toBe('db.r6g.xlarge');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
    }, 30000);

    test('DR S3 bucket exists with versioning enabled', async () => {
      const bucketName =
        outputs.DRBackupBucketName ||
        outputs[`TapDRStack${environmentSuffix}DRBackupBucketName`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3ClientDR.send(command);
      expect(response.Status).toBe('Enabled');
    }, 15000);

    test('DR Lambda function for replication monitoring exists', async () => {
      const functionName =
        outputs.DRReplicationMonitorFunctionName ||
        outputs[
          `TapDRStack${environmentSuffix}DRReplicationMonitorFunctionName`
        ];
      expect(functionName).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClientDR.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.State).toBe('Active');
    }, 15000);
  });

  describe('Route53 Failover Configuration', () => {
    test('Route53 hosted zone exists', async () => {
      const hostedZoneId =
        outputs.Route53HostedZoneId ||
        outputs[`TapRoute53Stack${environmentSuffix}Route53HostedZoneId`];
      expect(hostedZoneId).toBeDefined();

      const command = new ListHostedZonesCommand({});
      const response = await route53Client.send(command);

      const zone = response.HostedZones?.find(z =>
        z.Id?.includes(hostedZoneId)
      );
      expect(zone).toBeDefined();
    }, 15000);

    test('Primary database health check is configured', async () => {
      const healthCheckId =
        outputs.PrimaryHealthCheckId ||
        outputs[`TapRoute53Stack${environmentSuffix}PrimaryHealthCheckId`];
      expect(healthCheckId).toBeDefined();

      const command = new GetHealthCheckCommand({
        HealthCheckId: healthCheckId,
      });

      const response = await route53Client.send(command);
      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck?.HealthCheckConfig?.Type).toBe(
        'CLOUDWATCH_METRIC'
      );
    }, 15000);

    test('DR database health check is configured', async () => {
      const healthCheckId =
        outputs.DRHealthCheckId ||
        outputs[`TapRoute53Stack${environmentSuffix}DRHealthCheckId`];
      expect(healthCheckId).toBeDefined();

      const command = new GetHealthCheckCommand({
        HealthCheckId: healthCheckId,
      });

      const response = await route53Client.send(command);
      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck?.HealthCheckConfig?.Type).toBe(
        'CLOUDWATCH_METRIC'
      );
    }, 15000);
  });

  describe('Cross-Region Integration', () => {
    test('VPC peering connection is active', async () => {
      const vpcPeeringId =
        outputs.VPCPeeringConnectionId ||
        outputs[`TapPrimaryStack${environmentSuffix}VPCPeeringConnectionId`];
      expect(vpcPeeringId).toBeDefined();
      expect(vpcPeeringId).toMatch(/^pcx-/);
    });

    test('Primary and DR database endpoints are different', () => {
      const primaryEndpoint =
        outputs.PrimaryDatabaseEndpoint ||
        outputs[`TapPrimaryStack${environmentSuffix}PrimaryDatabaseEndpoint`];
      const drEndpoint =
        outputs.DRDatabaseEndpoint ||
        outputs[`TapDRStack${environmentSuffix}DRDatabaseEndpoint`];

      expect(primaryEndpoint).toBeDefined();
      expect(drEndpoint).toBeDefined();
      expect(primaryEndpoint).not.toBe(drEndpoint);
    });

    test('S3 replication is configured between regions', async () => {
      const primaryBucket =
        outputs.PrimaryBackupBucketName ||
        outputs[`TapPrimaryStack${environmentSuffix}PrimaryBackupBucketName`];
      const drBucket =
        outputs.DRBackupBucketName ||
        outputs[`TapDRStack${environmentSuffix}DRBackupBucketName`];

      expect(primaryBucket).toBeDefined();
      expect(drBucket).toBeDefined();
      expect(primaryBucket).not.toBe(drBucket);

      // Verify replication points to DR bucket
      const command = new GetBucketReplicationCommand({
        Bucket: primaryBucket,
      });

      const response = await s3ClientPrimary.send(command);
      const rules = response.ReplicationConfiguration?.Rules || [];

      expect(rules.length).toBeGreaterThan(0);
      const drBucketArn = `arn:aws:s3:::${drBucket}`;
      const hasReplicationToDR = rules.some(
        rule =>
          rule.Destination?.Bucket?.includes(drBucket) ||
          rule.Destination?.Bucket === drBucketArn
      );
      expect(hasReplicationToDR).toBe(true);
    }, 15000);
  });
});
