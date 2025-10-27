import * as fs from 'fs';
import { execSync } from 'child_process';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'eu-central-1';

// Helper function to run AWS CLI commands
function runAwsCli(command: string): any {
  try {
    const result = execSync(`aws ${command} --region ${region} --output json`, {
      encoding: 'utf8',
    });
    return JSON.parse(result);
  } catch (error) {
    console.error(`Error running command: ${command}`);
    throw error;
  }
}

describe('HIPAA Pipeline Integration Tests (CLI-based)', () => {
  jest.setTimeout(30000);

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.APIEndpoint).toBeDefined();
      expect(outputs.DataEncryptionKeyId).toBeDefined();
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should be active with encryption', () => {
      const result = runAwsCli(
        `kinesis describe-stream --stream-name ${outputs.KinesisStreamName}`
      );

      expect(result.StreamDescription.StreamStatus).toBe('ACTIVE');
      expect(result.StreamDescription.EncryptionType).toBe('KMS');
      expect(result.StreamDescription.Shards.length).toBeGreaterThanOrEqual(2);
    });

    test('should accept records', () => {
      const testData = JSON.stringify({
        patientId: 'test-001',
        heartRate: 75,
        timestamp: new Date().toISOString(),
      });

      const result = runAwsCli(
        `kinesis put-record --stream-name ${outputs.KinesisStreamName} --partition-key test-001 --data "${Buffer.from(testData).toString('base64')}"`
      );

      expect(result.SequenceNumber).toBeDefined();
      expect(result.ShardId).toBeDefined();
    });
  });

  describe('ECS Fargate Cluster', () => {
    test('should be active', () => {
      const result = runAwsCli(
        `ecs describe-clusters --clusters ${outputs.ECSClusterName}`
      );

      expect(result.clusters[0].status).toBe('ACTIVE');
      expect(result.clusters[0].clusterName).toBe(outputs.ECSClusterName);
    });

    test('should have services running', () => {
      const result = runAwsCli(
        `ecs list-services --cluster ${outputs.ECSClusterName}`
      );

      expect(result.serviceArns.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should be available with encryption', () => {
      const result = runAwsCli('rds describe-db-clusters');

      const cluster = result.DBClusters.find((c: any) =>
        c.Endpoint.includes(outputs.AuroraClusterEndpoint.split('.')[0])
      );

      expect(cluster).toBeDefined();
      expect(cluster.Status).toBe('available');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.Engine).toContain('aurora-postgresql');
    });

    test('should have multiple instances (Multi-AZ)', () => {
      const result = runAwsCli('rds describe-db-instances');

      const instances = result.DBInstances.filter((i: any) =>
        i.DBClusterIdentifier?.includes('medtech-aurora-cluster')
      );

      expect(instances.length).toBeGreaterThanOrEqual(2);
      instances.forEach((instance: any) => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });
  });

  describe('ElastiCache Redis', () => {
    test('should be available with Multi-AZ', () => {
      const result = runAwsCli('elasticache describe-replication-groups');

      const redisGroup = result.ReplicationGroups.find((g: any) =>
        g.ReplicationGroupId.includes('medtech-redis')
      );

      expect(redisGroup).toBeDefined();
      expect(redisGroup.Status).toBe('available');
      expect(redisGroup.MultiAZ).toBe('enabled');
      expect(redisGroup.AutomaticFailover).toBe('enabled');
    });

    test('should have encryption enabled', () => {
      const result = runAwsCli('elasticache describe-replication-groups');

      const redisGroup = result.ReplicationGroups.find((g: any) =>
        g.ReplicationGroupId.includes('medtech-redis')
      );

      expect(redisGroup.AtRestEncryptionEnabled).toBe(true);
      expect(redisGroup.TransitEncryptionEnabled).toBe(true);
    });

    test('should have multiple cache nodes', () => {
      const result = runAwsCli('elasticache describe-replication-groups');

      const redisGroup = result.ReplicationGroups.find((g: any) =>
        g.ReplicationGroupId.includes('medtech-redis')
      );

      expect(redisGroup.MemberClusters.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secrets Manager', () => {
    test('should have accessible secret with database credentials', () => {
      const result = runAwsCli(
        `secretsmanager get-secret-value --secret-id ${outputs.DBSecretArn}`
      );

      expect(result.SecretString).toBeDefined();
      const secret = JSON.parse(result.SecretString);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.engine).toBe('postgres');
      expect(secret.dbname).toBe('medtech');
    });
  });

  describe('KMS Encryption', () => {
    test('should have enabled KMS key', () => {
      const result = runAwsCli(
        `kms describe-key --key-id ${outputs.DataEncryptionKeyId}`
      );

      expect(result.KeyMetadata.KeyState).toBe('Enabled');
      expect(result.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('API Gateway', () => {
    test('should have deployed API', () => {
      const result = runAwsCli('apigateway get-rest-apis');

      const api = result.items.find((a: any) => a.name.includes('medtech-api'));
      expect(api).toBeDefined();
    });

    test('should have valid endpoint URL', () => {
      expect(outputs.APIEndpoint).toMatch(/^https:\/\/.+\.execute-api\..+/);
      expect(outputs.APIEndpoint).toContain('eu-central-1');
      expect(outputs.APIEndpoint).toContain('/prod/vitals');
    });
  });

  describe('End-to-End Integration', () => {
    test('all 6 required services should be operational', () => {
      // Kinesis
      const kinesis = runAwsCli(
        `kinesis describe-stream --stream-name ${outputs.KinesisStreamName}`
      );
      expect(kinesis.StreamDescription.StreamStatus).toBe('ACTIVE');

      // ECS
      const ecs = runAwsCli(
        `ecs describe-clusters --clusters ${outputs.ECSClusterName}`
      );
      expect(ecs.clusters[0].status).toBe('ACTIVE');

      // RDS
      const rds = runAwsCli('rds describe-db-clusters');
      const cluster = rds.DBClusters.find((c: any) =>
        c.Endpoint.includes(outputs.AuroraClusterEndpoint.split('.')[0])
      );
      expect(cluster.Status).toBe('available');

      // Redis
      const redis = runAwsCli('elasticache describe-replication-groups');
      const redisGroup = redis.ReplicationGroups.find((g: any) =>
        g.ReplicationGroupId.includes('medtech-redis')
      );
      expect(redisGroup.Status).toBe('available');

      // Secrets Manager
      const secrets = runAwsCli(
        `secretsmanager get-secret-value --secret-id ${outputs.DBSecretArn}`
      );
      expect(secrets.SecretString).toBeDefined();

      // API Gateway
      const api = runAwsCli('apigateway get-rest-apis');
      const apiGw = api.items.find((a: any) => a.name.includes('medtech-api'));
      expect(apiGw).toBeDefined();

      console.log('✓ All 6 required services are operational');
    });

    test('security configurations should be HIPAA-compliant', () => {
      // Verify encryption is enabled everywhere
      const kinesis = runAwsCli(
        `kinesis describe-stream --stream-name ${outputs.KinesisStreamName}`
      );
      expect(kinesis.StreamDescription.EncryptionType).toBe('KMS');

      const rds = runAwsCli('rds describe-db-clusters');
      const cluster = rds.DBClusters.find((c: any) =>
        c.Endpoint.includes(outputs.AuroraClusterEndpoint.split('.')[0])
      );
      expect(cluster.StorageEncrypted).toBe(true);

      const redis = runAwsCli('elasticache describe-replication-groups');
      const redisGroup = redis.ReplicationGroups.find((g: any) =>
        g.ReplicationGroupId.includes('medtech-redis')
      );
      expect(redisGroup.AtRestEncryptionEnabled).toBe(true);
      expect(redisGroup.TransitEncryptionEnabled).toBe(true);

      console.log('✓ All security configurations are HIPAA-compliant');
    });
  });
});
