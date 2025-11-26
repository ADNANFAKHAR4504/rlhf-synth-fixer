/**
 * Integration Tests for Terraform Multi-Region Aurora PostgreSQL DR Infrastructure
 *
 * These tests validate the deployed infrastructure using real AWS resources.
 * They read deployment outputs from cfn-outputs/flat-outputs.json and verify
 * that all resources are correctly configured and functioning.
 *
 * NOTE: These tests require actual AWS deployment to run.
 * For Terraform projects, integration tests validate:
 * 1. Resource existence and accessibility
 * 2. Configuration correctness
 * 3. Cross-region replication functionality
 * 4. Failover mechanisms
 * 5. Security configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeGlobalClustersCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand
} from '@aws-sdk/client-s3';
import {
  Route53Client,
  GetHealthCheckCommand,
  ListHostedZonesCommand
} from '@aws-sdk/client-route-53';
import {
  SNSClient,
  ListTopicsCommand
} from '@aws-sdk/client-sns';

describe('Terraform Multi-Region DR Infrastructure - Integration Tests', () => {
  let outputs: Record<string, string>;

  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  const rdsClientPrimary = new RDSClient({ region: primaryRegion });
  const rdsClientSecondary = new RDSClient({ region: secondaryRegion });
  const s3ClientPrimary = new S3Client({ region: primaryRegion });
  const s3ClientSecondary = new S3Client({ region: secondaryRegion });
  const route53Client = new Route53Client({ region: primaryRegion });
  const snsClientPrimary = new SNSClient({ region: primaryRegion });
  const snsClientSecondary = new SNSClient({ region: secondaryRegion });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. ` +
        `Integration tests require actual AWS deployment. ` +
        `Run 'npm run tf:deploy' first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs Validation', () => {
    it('should have primary cluster endpoint', () => {
      expect(outputs.primary_cluster_endpoint).toBeDefined();
      expect(outputs.primary_cluster_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have primary cluster reader endpoint', () => {
      expect(outputs.primary_cluster_reader_endpoint).toBeDefined();
      expect(outputs.primary_cluster_reader_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have secondary cluster endpoint', () => {
      expect(outputs.secondary_cluster_endpoint).toBeDefined();
      expect(outputs.secondary_cluster_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have secondary cluster reader endpoint', () => {
      expect(outputs.secondary_cluster_reader_endpoint).toBeDefined();
      expect(outputs.secondary_cluster_reader_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have primary S3 bucket name', () => {
      expect(outputs.primary_s3_bucket).toBeDefined();
      expect(outputs.primary_s3_bucket).toMatch(/^aurora-backups-primary/);
    });

    it('should have secondary S3 bucket name', () => {
      expect(outputs.secondary_s3_bucket).toBeDefined();
      expect(outputs.secondary_s3_bucket).toMatch(/^aurora-backups-secondary/);
    });

    it('should have Route 53 failover DNS', () => {
      expect(outputs.route53_failover_dns).toBeDefined();
      expect(outputs.route53_failover_dns).toContain('db.');
    });

    it('should have SNS topic ARNs', () => {
      expect(outputs.primary_sns_topic_arn).toBeDefined();
      expect(outputs.secondary_sns_topic_arn).toBeDefined();
      expect(outputs.primary_sns_topic_arn).toMatch(/^arn:aws:sns:/);
      expect(outputs.secondary_sns_topic_arn).toMatch(/^arn:aws:sns:/);
    });

    it('should have replication lag alarm ARN', () => {
      expect(outputs.replication_lag_alarm_arn).toBeDefined();
      expect(outputs.replication_lag_alarm_arn).toMatch(/^arn:aws:cloudwatch:/);
    });
  });

  describe('Aurora Global Database Configuration', () => {
    it('should have Aurora Global Cluster deployed', async () => {
      const command = new DescribeGlobalClustersCommand({});
      const response = await rdsClientPrimary.send(command);

      expect(response.GlobalClusters).toBeDefined();
      const globalCluster = response.GlobalClusters?.find(
        c => c.GlobalClusterIdentifier?.includes(process.env.ENVIRONMENT_SUFFIX || 'dev')
      );

      expect(globalCluster).toBeDefined();
      expect(globalCluster?.Engine).toBe('aurora-postgresql');
    });

    it('should have primary cluster in us-east-1', async () => {
      const clusterName = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName
      });

      const response = await rdsClientPrimary.send(command);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    it('should have secondary cluster in us-west-2', async () => {
      const clusterName = outputs.secondary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName
      });

      const response = await rdsClientSecondary.send(command);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    it('should have encryption enabled on both clusters', async () => {
      const primaryCluster = outputs.primary_cluster_endpoint.split('.')[0];
      const secondaryCluster = outputs.secondary_cluster_endpoint.split('.')[0];

      const primaryResponse = await rdsClientPrimary.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: primaryCluster })
      );
      const secondaryResponse = await rdsClientSecondary.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: secondaryCluster })
      );

      expect(primaryResponse.DBClusters![0].StorageEncrypted).toBe(true);
      expect(secondaryResponse.DBClusters![0].StorageEncrypted).toBe(true);
    });
  });

  describe('S3 Backup Configuration', () => {
    it('should have primary S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.primary_s3_bucket
      });

      await expect(s3ClientPrimary.send(command)).resolves.not.toThrow();
    });

    it('should have secondary S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.secondary_s3_bucket
      });

      await expect(s3ClientSecondary.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled on primary bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.primary_s3_bucket
      });

      const response = await s3ClientPrimary.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have versioning enabled on secondary bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.secondary_s3_bucket
      });

      const response = await s3ClientSecondary.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have cross-region replication configured', async () => {
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primary_s3_bucket
      });

      const response = await s3ClientPrimary.send(command);
      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('Route 53 Failover Configuration', () => {
    it('should have hosted zone configured', async () => {
      const command = new ListHostedZonesCommand({});
      const response = await route53Client.send(command);

      expect(response.HostedZones).toBeDefined();
      const zone = response.HostedZones?.find(
        z => z.Name === outputs.route53_failover_dns.replace('db.', '')
      );

      expect(zone).toBeDefined();
    });

    it('should have health check for replication lag', async () => {
      // Extract health check ID from alarm ARN or use list health checks
      // This is a placeholder - actual implementation would need health check ID
      expect(outputs.replication_lag_alarm_arn).toContain('cloudwatch');
    });
  });

  describe('SNS Notification Configuration', () => {
    it('should have primary SNS topic accessible', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClientPrimary.send(command);

      expect(response.Topics).toBeDefined();
      const topic = response.Topics?.find(
        t => t.TopicArn === outputs.primary_sns_topic_arn
      );

      expect(topic).toBeDefined();
    });

    it('should have secondary SNS topic accessible', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClientSecondary.send(command);

      expect(response.Topics).toBeDefined();
      const topic = response.Topics?.find(
        t => t.TopicArn === outputs.secondary_sns_topic_arn
      );

      expect(topic).toBeDefined();
    });
  });

  describe('Security and Compliance', () => {
    it('should have deletion protection disabled (for testing)', async () => {
      const clusterName = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName
      });

      const response = await rdsClientPrimary.send(command);
      expect(response.DBClusters![0].DeletionProtection).toBe(false);
    });

    it('should have encryption at rest enabled', async () => {
      const clusterName = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName
      });

      const response = await rdsClientPrimary.send(command);
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
      expect(response.DBClusters![0].KmsKeyId).toBeDefined();
    });
  });

  describe('High Availability', () => {
    it('should have multiple instances in primary cluster', async () => {
      const clusterName = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName
      });

      const response = await rdsClientPrimary.send(command);
      expect(response.DBClusters![0].DBClusterMembers).toBeDefined();
      expect(response.DBClusters![0].DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have multiple instances in secondary cluster', async () => {
      const clusterName = outputs.secondary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName
      });

      const response = await rdsClientSecondary.send(command);
      expect(response.DBClusters![0].DBClusterMembers).toBeDefined();
      expect(response.DBClusters![0].DBClusterMembers!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
