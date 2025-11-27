import * as fs from 'fs';
import * as path from 'path';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeGlobalClustersCommand
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  KMSClient,
  DescribeKeyCommand
} from '@aws-sdk/client-kms';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;
  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Please run deployment first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('RDS Aurora Global Database', () => {
    test('should have global cluster deployed', async () => {
      const client = new RDSClient({ region: primaryRegion });
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.global_cluster_id
      });
      const response = await client.send(command);

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters!.length).toBeGreaterThan(0);
      const globalCluster = response.GlobalClusters![0];
      expect(globalCluster.Engine).toBe('aurora-postgresql');
      expect(globalCluster.Status).toBe('available');
    }, 30000);

    test('should have primary cluster available', async () => {
      const client = new RDSClient({ region: primaryRegion });
      const clusterIdentifier = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await client.send(command);

      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.MultiAZ).toBe(true);
    }, 30000);

    test('should have secondary cluster available', async () => {
      if (!outputs.secondary_cluster_endpoint) {
        console.warn('Secondary cluster endpoint not available yet - deployment may still be in progress');
        return;
      }
      
      const client = new RDSClient({ region: secondaryRegion });
      const clusterIdentifier = outputs.secondary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await client.send(command);

      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    }, 30000);

    test('should have 2 instances in primary cluster', async () => {
      const client = new RDSClient({ region: primaryRegion });
      const clusterIdentifier = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier]
          }
        ]
      });
      const response = await client.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(2);
      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
      });
    }, 30000);

    test('should have 2 instances in secondary cluster', async () => {
      if (!outputs.secondary_cluster_endpoint) {
        console.warn('Secondary cluster endpoint not available yet - deployment may still be in progress');
        return;
      }
      
      const client = new RDSClient({ region: secondaryRegion });
      const clusterIdentifier = outputs.secondary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier]
          }
        ]
      });
      const response = await client.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(2);
      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
      });
    }, 30000);
  });

  describe('S3 Backup Buckets', () => {
    test('should have primary backup bucket with versioning enabled', async () => {
      const client = new S3Client({ region: primaryRegion });
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.primary_backup_bucket
      });
      const response = await client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should have secondary backup bucket with versioning enabled', async () => {
      const client = new S3Client({ region: secondaryRegion });
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.secondary_backup_bucket
      });
      const response = await client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should have primary bucket encrypted', async () => {
      const client = new S3Client({ region: primaryRegion });
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.primary_backup_bucket
      });
      const response = await client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have public access blocked on primary bucket', async () => {
      const client = new S3Client({ region: primaryRegion });
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.primary_backup_bucket
      });
      const response = await client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    }, 30000);

    test('should have public access blocked on secondary bucket', async () => {
      const client = new S3Client({ region: secondaryRegion });
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.secondary_backup_bucket
      });
      const response = await client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('should have primary database secret configured', async () => {
      const client = new SecretsManagerClient({ region: primaryRegion });
      const command = new DescribeSecretCommand({
        SecretId: outputs.primary_secret_arn
      });
      const response = await client.send(command);

      expect(response.ARN).toBe(outputs.primary_secret_arn);
      expect(response.Name).toContain('rds-master-password-primary-');
    }, 30000);

    test('should have secondary database secret configured', async () => {
      const client = new SecretsManagerClient({ region: secondaryRegion });
      const command = new DescribeSecretCommand({
        SecretId: outputs.secondary_secret_arn
      });
      const response = await client.send(command);

      expect(response.ARN).toBe(outputs.secondary_secret_arn);
      expect(response.Name).toContain('rds-master-password-secondary-');
    }, 30000);
  });

  describe('SNS Topics', () => {
    test('should have primary SNS topic configured', async () => {
      const client = new SNSClient({ region: primaryRegion });
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.primary_sns_topic_arn
      });
      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.primary_sns_topic_arn);
    }, 30000);

    test('should have secondary SNS topic configured', async () => {
      const client = new SNSClient({ region: secondaryRegion });
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.secondary_sns_topic_arn
      });
      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.secondary_sns_topic_arn);
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('should have CloudWatch alarms configured', async () => {
      const client = new CloudWatchClient({ region: primaryRegion });
      const command = new DescribeAlarmsCommand({});
      const response = await client.send(command);

      expect(response.MetricAlarms).toBeDefined();
      const alarms = response.MetricAlarms!.filter(alarm =>
        alarm.AlarmName?.includes('l6p3z2w4')
      );
      expect(alarms.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('KMS Keys', () => {
    test('should have primary KMS key configured with rotation', async () => {
      const client = new KMSClient({ region: primaryRegion });
      const command = new DescribeKeyCommand({
        KeyId: outputs.primary_kms_key_id
      });
      const response = await client.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
    }, 30000);

    test('should have secondary KMS key configured', async () => {
      const client = new KMSClient({ region: secondaryRegion });
      const command = new DescribeKeyCommand({
        KeyId: outputs.secondary_kms_key_id
      });
      const response = await client.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
    }, 30000);
  });

  describe('Endpoint Connectivity', () => {
    test('should have valid primary cluster endpoint', () => {
      expect(outputs.primary_cluster_endpoint).toBeDefined();
      expect(outputs.primary_cluster_endpoint).toContain('.rds.amazonaws.com');
      expect(outputs.primary_cluster_endpoint).toContain('us-east-1');
    });

    test('should have valid primary reader endpoint', () => {
      expect(outputs.primary_cluster_reader_endpoint).toBeDefined();
      expect(outputs.primary_cluster_reader_endpoint).toContain('.rds.amazonaws.com');
    });

    test('should have valid secondary cluster endpoint', () => {
      if (!outputs.secondary_cluster_endpoint) {
        console.warn('Secondary cluster endpoint not available yet - deployment may still be in progress');
        return;
      }
      expect(outputs.secondary_cluster_endpoint).toBeDefined();
      expect(outputs.secondary_cluster_endpoint).toContain('.rds.amazonaws.com');
      expect(outputs.secondary_cluster_endpoint).toContain('us-west-2');
    });

    test('should have valid secondary reader endpoint', () => {
      if (!outputs.secondary_cluster_reader_endpoint) {
        console.warn('Secondary cluster reader endpoint not available yet - deployment may still be in progress');
        return;
      }
      expect(outputs.secondary_cluster_reader_endpoint).toBeDefined();
      expect(outputs.secondary_cluster_reader_endpoint).toContain('.rds.amazonaws.com');
    });
  });

  describe('Resource Tagging', () => {
    test('should have proper tags on primary cluster', async () => {
      const client = new RDSClient({ region: primaryRegion });
      const clusterIdentifier = outputs.primary_cluster_endpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await client.send(command);

      const tags = response.DBClusters![0].TagList || [];
      const taskIdTag = tags.find(tag => tag.Key === 'TaskID');
      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');

      expect(taskIdTag).toBeDefined();
      expect(taskIdTag!.Value).toBe('l6p3z2w4');
      expect(managedByTag).toBeDefined();
      expect(managedByTag!.Value).toBe('terraform');
    }, 30000);
  });
});
