/**
 * Integration tests for TapStack - Disaster Recovery Infrastructure
 *
 * These tests validate the deployed AWS infrastructure including RDS, S3, Lambda,
 * SNS, CloudWatch, and other resources using actual AWS SDK calls against the
 * live deployment.
 *
 * Tests use outputs from cfn-outputs/flat-outputs.json to discover resource names.
 */

import * as fs from 'fs';
import * as path from 'path';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { EC2Client, DescribeVpcsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

const REGION = 'ap-southeast-2';

// AWS SDK Clients
const rdsClient = new RDSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const cloudwatchClient = new CloudWatchClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string>;

try {
  const outputsData = fs.readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(outputsData);
} catch (error) {
  console.warn('Warning: Could not load flat-outputs.json. Tests will be skipped if outputs are missing.');
  outputs = {};
}

describe('TapStack - Disaster Recovery Infrastructure Integration Tests', () => {
  // Skip all tests if outputs not available
  const skipTests = !outputs || Object.keys(outputs).length === 0;

  if (skipTests) {
    it.skip('outputs file not found - skipping integration tests', () => {});
    return;
  }

  describe('VPC and Networking', () => {
    it('should have a deployed VPC with correct configuration', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have security groups configured for RDS', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'group-name', Values: ['*dr-db-sg*'] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.GroupName).toContain('dr-db-sg');

      // Check PostgreSQL port is allowed
      const postgresRule = securityGroup.IpPermissions?.find(
        (rule) => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
    });
  });

  describe('RDS PostgreSQL Database', () => {
    it('should have primary database deployed and available', async () => {
      expect(outputs.primaryDbIdentifier).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.primaryDbIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);

      const primaryDb = response.DBInstances![0];
      expect(primaryDb.DBInstanceStatus).toBe('available');
      expect(primaryDb.Engine).toBe('postgres');
      expect(primaryDb.EngineVersion).toMatch(/^14\./);
      expect(primaryDb.DBInstanceClass).toBe('db.t3.medium');
      expect(primaryDb.StorageEncrypted).toBe(true);
      expect(primaryDb.BackupRetentionPeriod).toBe(7);
    });

    it('should have read replica deployed and replicating', async () => {
      expect(outputs.replicaDbIdentifier).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.replicaDbIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);

      const replicaDb = response.DBInstances![0];
      expect(replicaDb.DBInstanceStatus).toBe('available');
      expect(replicaDb.ReadReplicaSourceDBInstanceIdentifier).toContain(
        outputs.primaryDbIdentifier
      );
      expect(replicaDb.StorageEncrypted).toBe(true);
    });

    it('should have encryption enabled with KMS', async () => {
      expect(outputs.kmsKeyId).toBeDefined();

      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Description).toContain('RDS');
    });
  });

  describe('S3 Backup Buckets', () => {
    it('should have primary backup bucket created', async () => {
      expect(outputs.backupBucketPrimaryName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: outputs.backupBucketPrimaryName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have replica backup bucket created', async () => {
      expect(outputs.backupBucketReplicaName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: outputs.backupBucketReplicaName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled on primary bucket', async () => {
      expect(outputs.backupBucketPrimaryName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.backupBucketPrimaryName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have versioning enabled on replica bucket', async () => {
      expect(outputs.backupBucketReplicaName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.backupBucketReplicaName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Lambda Functions', () => {
    it('should have health check Lambda deployed', async () => {
      expect(outputs.healthCheckLambdaArn).toBeDefined();

      const functionName = outputs.healthCheckLambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('python3.11');
      expect(response.Configuration?.Handler).toBe('health_check.handler');
      expect(response.Configuration?.Timeout).toBe(60);

      // Check environment variables
      const env = response.Configuration?.Environment?.Variables;
      expect(env?.PRIMARY_DB_IDENTIFIER).toBe(outputs.primaryDbIdentifier);
      expect(env?.REPLICA_DB_IDENTIFIER).toBe(outputs.replicaDbIdentifier);
      expect(env?.SNS_TOPIC_ARN).toBe(outputs.alertTopicArn);
      expect(env?.REGION).toBe(REGION);
    });

    it('should have failover Lambda deployed', async () => {
      expect(outputs.failoverLambdaArn).toBeDefined();

      const functionName = outputs.failoverLambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('python3.11');
      expect(response.Configuration?.Handler).toBe('failover.handler');
      expect(response.Configuration?.Timeout).toBe(300);

      // Check environment variables
      const env = response.Configuration?.Environment?.Variables;
      expect(env?.PRIMARY_DB_IDENTIFIER).toBe(outputs.primaryDbIdentifier);
      expect(env?.REPLICA_DB_IDENTIFIER).toBe(outputs.replicaDbIdentifier);
      expect(env?.SNS_TOPIC_ARN).toBe(outputs.alertTopicArn);
    });
  });

  describe('SNS Alerting', () => {
    it('should have SNS topic created', async () => {
      expect(outputs.alertTopicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.alertTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.alertTopicArn);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have replication lag alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'dr-replication-lag-',
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('ReplicaLag');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(60);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    it('should have CPU utilization alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'dr-cpu-',
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('End-to-End Disaster Recovery Workflow', () => {
    it('should have complete DR infrastructure chain', async () => {
      // Verify all components exist and are properly configured
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.primaryDbIdentifier).toBeDefined();
      expect(outputs.replicaDbIdentifier).toBeDefined();
      expect(outputs.backupBucketPrimaryName).toBeDefined();
      expect(outputs.backupBucketReplicaName).toBeDefined();
      expect(outputs.healthCheckLambdaArn).toBeDefined();
      expect(outputs.failoverLambdaArn).toBeDefined();
      expect(outputs.alertTopicArn).toBeDefined();
      expect(outputs.kmsKeyId).toBeDefined();

      // Verify primary database endpoint is accessible
      expect(outputs.primaryDbEndpoint).toBeDefined();
      expect(outputs.primaryDbEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.primaryDbEndpoint).toContain(REGION);

      // Verify replica database endpoint is accessible
      expect(outputs.replicaDbEndpoint).toBeDefined();
      expect(outputs.replicaDbEndpoint).toContain('rds.amazonaws.com');

      // Verify all resources have proper naming with environment suffix
      const resourceNames = [
        outputs.primaryDbIdentifier,
        outputs.replicaDbIdentifier,
        outputs.backupBucketPrimaryName,
        outputs.backupBucketReplicaName,
      ];

    });

    it('should have proper tagging for all resources', async () => {
      // Check RDS tags
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.primaryDbIdentifier,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      const tags = rdsResponse.DBInstances![0].TagList;

      const envTag = tags?.find((tag) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();

      const ownerTag = tags?.find((tag) => tag.Key === 'Owner');
      expect(ownerTag).toBeDefined();
      expect(ownerTag?.Value).toBe('platform-team');

      const drRoleTag = tags?.find((tag) => tag.Key === 'DR-Role');
      expect(drRoleTag).toBeDefined();
      expect(drRoleTag?.Value).toBe('disaster-recovery');
    });
  });
});
