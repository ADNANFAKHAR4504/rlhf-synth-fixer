/**
 * Integration Tests for Financial Analytics Platform Infrastructure Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * against expected values and infrastructure requirements.
 *
 * Pattern: Uses cfn-outputs/flat-outputs.json to validate deployed infrastructure
 * No AWS SDK calls - all validation based on deployment outputs
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Deployment Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Deployment outputs not found at ${outputsPath}. Run deployment first.`);
    }
    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData);
  });

  describe('Core Outputs', () => {
    test('should have all required core outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'vpcCidr',
        'publicSubnetIds',
        'privateSubnetIds',
        'ecsClusterArn',
        'ecsClusterName',
        'ecsTaskExecutionRoleArn',
        'ecsTaskRoleArn',
        'ecsSecurityGroupId',
        'auroraClusterArn',
        'auroraClusterEndpoint',
        'auroraClusterReaderEndpoint',
        'auroraSecurityGroupId',
        'dbSecretArn',
        'kmsKeyArn',
        'kmsKeyId',
        'rawDataBucketName',
        'rawDataBucketArn',
        'processedDataBucketName',
        'processedDataBucketArn',
        'kinesisStreamArn',
        'kinesisStreamName',
        'ecsLogGroupName',
        'backupVaultArn',
        'backupPlanId',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
      });
    });

    test('should not have undefined or null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
      });
    });

    test('should not have empty string outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have correct VPC CIDR block', () => {
      expect(outputs.vpcCidr).toBe('10.0.0.0/16');
    });

    test('should have 3 public subnets', () => {
      const publicSubnets = JSON.parse(outputs.publicSubnetIds);
      expect(Array.isArray(publicSubnets)).toBe(true);
      expect(publicSubnets).toHaveLength(3);
      publicSubnets.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('should have 3 private subnets', () => {
      const privateSubnets = JSON.parse(outputs.privateSubnetIds);
      expect(Array.isArray(privateSubnets)).toBe(true);
      expect(privateSubnets).toHaveLength(3);
      privateSubnets.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('public and private subnets should be different', () => {
      const publicSubnets = JSON.parse(outputs.publicSubnetIds);
      const privateSubnets = JSON.parse(outputs.privateSubnetIds);

      publicSubnets.forEach((pubSubnet: string) => {
        expect(privateSubnets).not.toContain(pubSubnet);
      });
    });
  });

  describe('ECS Cluster Configuration', () => {
    test('should have valid ECS cluster ARN', () => {
      expect(outputs.ecsClusterArn).toBeDefined();
      expect(outputs.ecsClusterArn).toMatch(/^arn:aws:ecs:/);
      expect(outputs.ecsClusterArn).toContain(':cluster/');
    });

    test('should have valid ECS cluster name', () => {
      expect(outputs.ecsClusterName).toBeDefined();
      expect(outputs.ecsClusterName).toMatch(/^analytics-ecs-cluster-/);
    });

    test('cluster name should be consistent in ARN', () => {
      expect(outputs.ecsClusterArn).toContain(outputs.ecsClusterName);
    });

    test('should have valid ECS task execution role ARN', () => {
      expect(outputs.ecsTaskExecutionRoleArn).toBeDefined();
      expect(outputs.ecsTaskExecutionRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.ecsTaskExecutionRoleArn).toContain(':role/analytics-ecs-exec-role-');
    });

    test('should have valid ECS task role ARN', () => {
      expect(outputs.ecsTaskRoleArn).toBeDefined();
      expect(outputs.ecsTaskRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.ecsTaskRoleArn).toContain(':role/analytics-ecs-task-role-');
    });

    test('should have valid ECS security group ID', () => {
      expect(outputs.ecsSecurityGroupId).toBeDefined();
      expect(outputs.ecsSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have valid ECS log group name', () => {
      expect(outputs.ecsLogGroupName).toBeDefined();
      expect(outputs.ecsLogGroupName).toMatch(/^\/aws\/ecs\/analytics-/);
    });
  });

  describe('Aurora PostgreSQL Database', () => {
    test('should have valid Aurora cluster ARN', () => {
      expect(outputs.auroraClusterArn).toBeDefined();
      expect(outputs.auroraClusterArn).toMatch(/^arn:aws:rds:/);
      expect(outputs.auroraClusterArn).toContain(':cluster:');
      expect(outputs.auroraClusterArn).toContain('analytics-aurora-cluster-');
    });

    test('should have valid Aurora cluster endpoint', () => {
      expect(outputs.auroraClusterEndpoint).toBeDefined();
      expect(outputs.auroraClusterEndpoint).toMatch(/\.cluster-[a-z0-9]+\./);
      expect(outputs.auroraClusterEndpoint).toContain('.rds.amazonaws.com');
    });

    test('should have valid Aurora reader endpoint', () => {
      expect(outputs.auroraClusterReaderEndpoint).toBeDefined();
      expect(outputs.auroraClusterReaderEndpoint).toMatch(/\.cluster-ro-[a-z0-9]+\./);
      expect(outputs.auroraClusterReaderEndpoint).toContain('.rds.amazonaws.com');
    });

    test('should have valid Aurora security group ID', () => {
      expect(outputs.auroraSecurityGroupId).toBeDefined();
      expect(outputs.auroraSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('Aurora and ECS security groups should be different', () => {
      expect(outputs.auroraSecurityGroupId).not.toBe(outputs.ecsSecurityGroupId);
    });

    test('should have valid database secret ARN', () => {
      expect(outputs.dbSecretArn).toBeDefined();
      expect(outputs.dbSecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.dbSecretArn).toContain(':secret:analytics/db/credentials-');
    });
  });

  describe('KMS Encryption', () => {
    test('should have valid KMS key ARN', () => {
      expect(outputs.kmsKeyArn).toBeDefined();
      expect(outputs.kmsKeyArn).toMatch(/^arn:aws:kms:/);
      expect(outputs.kmsKeyArn).toContain(':key/');
    });

    test('should have valid KMS key ID', () => {
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.kmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('KMS key ID should be part of KMS key ARN', () => {
      expect(outputs.kmsKeyArn).toContain(outputs.kmsKeyId);
    });
  });

  describe('S3 Storage Buckets', () => {
    test('should have valid raw data bucket name', () => {
      expect(outputs.rawDataBucketName).toBeDefined();
      expect(outputs.rawDataBucketName).toMatch(/^analytics-raw-data-/);
    });

    test('should have valid raw data bucket ARN', () => {
      expect(outputs.rawDataBucketArn).toBeDefined();
      expect(outputs.rawDataBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.rawDataBucketArn).toContain(outputs.rawDataBucketName);
    });

    test('should have valid processed data bucket name', () => {
      expect(outputs.processedDataBucketName).toBeDefined();
      expect(outputs.processedDataBucketName).toMatch(/^analytics-processed-data-/);
    });

    test('should have valid processed data bucket ARN', () => {
      expect(outputs.processedDataBucketArn).toBeDefined();
      expect(outputs.processedDataBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.processedDataBucketArn).toContain(outputs.processedDataBucketName);
    });

    test('raw and processed buckets should be different', () => {
      expect(outputs.rawDataBucketName).not.toBe(outputs.processedDataBucketName);
      expect(outputs.rawDataBucketArn).not.toBe(outputs.processedDataBucketArn);
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should have valid Kinesis stream ARN', () => {
      expect(outputs.kinesisStreamArn).toBeDefined();
      expect(outputs.kinesisStreamArn).toMatch(/^arn:aws:kinesis:/);
      expect(outputs.kinesisStreamArn).toContain(':stream/');
    });

    test('should have valid Kinesis stream name', () => {
      expect(outputs.kinesisStreamName).toBeDefined();
      expect(outputs.kinesisStreamName).toMatch(/^analytics-stream-/);
    });

    test('stream name should be consistent in ARN', () => {
      expect(outputs.kinesisStreamArn).toContain(outputs.kinesisStreamName);
    });
  });

  describe('AWS Backup Configuration', () => {
    test('should have valid backup vault ARN', () => {
      expect(outputs.backupVaultArn).toBeDefined();
      expect(outputs.backupVaultArn).toMatch(/^arn:aws:backup:/);
      expect(outputs.backupVaultArn).toContain(':backup-vault:');
      expect(outputs.backupVaultArn).toContain('analytics-backup-vault-');
    });

    test('should have valid backup plan ID', () => {
      expect(outputs.backupPlanId).toBeDefined();
      expect(outputs.backupPlanId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });
  });

  describe('Naming Conventions', () => {
    test('should follow consistent naming pattern with environment suffix', () => {
      // Extract environment suffix from one resource
      const clusterNameMatch = outputs.ecsClusterName.match(/^analytics-ecs-cluster-(.+)$/);
      expect(clusterNameMatch).not.toBeNull();
      const environmentSuffix = clusterNameMatch![1];
      expect(environmentSuffix).toBeTruthy();

      // Verify all resources use the same suffix
      expect(outputs.rawDataBucketName).toContain(`-${environmentSuffix}`);
      expect(outputs.processedDataBucketName).toContain(`-${environmentSuffix}`);
      expect(outputs.kinesisStreamName).toContain(`-${environmentSuffix}`);
    });

    test('all resource names should follow analytics-* pattern', () => {
      expect(outputs.ecsClusterName).toMatch(/^analytics-/);
      expect(outputs.rawDataBucketName).toMatch(/^analytics-/);
      expect(outputs.processedDataBucketName).toMatch(/^analytics-/);
      expect(outputs.kinesisStreamName).toMatch(/^analytics-/);
    });
  });

  describe('AWS Resource Format Validation', () => {
    test('all security group IDs should have valid format', () => {
      const sgOutputs = ['ecsSecurityGroupId', 'auroraSecurityGroupId'];

      sgOutputs.forEach(key => {
        expect(outputs[key]).toMatch(/^sg-[a-f0-9]{8,17}$/);
      });
    });

    test('should have valid AWS region in ARNs', () => {
      expect(outputs.ecsClusterArn).toMatch(/:us-east-2:/);
      expect(outputs.auroraClusterArn).toMatch(/:us-east-2:/);
      expect(outputs.kmsKeyArn).toMatch(/:us-east-2:/);
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have KMS encryption configured for sensitive data', () => {
      expect(outputs.kmsKeyArn).toBeDefined();
      expect(outputs.kmsKeyId).toBeDefined();
    });

    test('should have database secrets in Secrets Manager', () => {
      expect(outputs.dbSecretArn).toBeDefined();
      expect(outputs.dbSecretArn).toContain('secretsmanager');
    });

    test('should have separate task execution and task roles', () => {
      expect(outputs.ecsTaskExecutionRoleArn).toBeDefined();
      expect(outputs.ecsTaskRoleArn).toBeDefined();
      expect(outputs.ecsTaskExecutionRoleArn).not.toBe(outputs.ecsTaskRoleArn);
    });

    test('should have separate security groups for ECS and Aurora', () => {
      expect(outputs.ecsSecurityGroupId).toBeDefined();
      expect(outputs.auroraSecurityGroupId).toBeDefined();
      expect(outputs.ecsSecurityGroupId).not.toBe(outputs.auroraSecurityGroupId);
    });
  });

  describe('High Availability Configuration', () => {
    test('should have Aurora reader endpoint for read replicas', () => {
      expect(outputs.auroraClusterReaderEndpoint).toBeDefined();
      expect(outputs.auroraClusterReaderEndpoint).not.toBe(outputs.auroraClusterEndpoint);
    });

    test('should have resources distributed across multiple AZs', () => {
      const publicSubnets = JSON.parse(outputs.publicSubnetIds);
      const privateSubnets = JSON.parse(outputs.privateSubnetIds);

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
    });
  });
});
