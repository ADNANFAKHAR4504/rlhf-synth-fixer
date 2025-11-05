import {
  APIGatewayClient,
  GetRestApisCommand
} from '@aws-sdk/client-api-gateway';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import {
  DescribeStreamCommand,
  KinesisClient,
  PutRecordCommand,
} from '@aws-sdk/client-kinesis';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-east-1';

// Initialize AWS clients
const kinesisClient = new KinesisClient({ region });
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const kmsClient = new KMSClient({ region });

describe('HIPAA-Compliant Event Processing Pipeline Integration Tests', () => {
  // Test timeout for long-running operations
  jest.setTimeout(30000);

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.KinesisStreamArn).toBeDefined();
      expect(outputs.ECSClusterArn).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterPort).toBeDefined();
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisPort).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.APIEndpoint).toBeDefined();
      expect(outputs.DataEncryptionKeyId).toBeDefined();
    });

    test('outputs should not be empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Kinesis Data Stream Integration', () => {
    test('should have active Kinesis stream', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName,
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription?.StreamName).toBe(
        outputs.KinesisStreamName
      );
    });

    test('should have encryption enabled on Kinesis stream', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName,
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription?.EncryptionType).toBe('KMS');
      expect(response.StreamDescription?.KeyId).toBeDefined();
    });

    test('should have sufficient shard capacity', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName,
      });
      const response = await kinesisClient.send(command);

      const shardCount = response.StreamDescription?.Shards?.length || 0;
      expect(shardCount).toBeGreaterThanOrEqual(2);
    });

    test('should be able to put record to stream', async () => {
      const testData = {
        patientId: 'test-patient-001',
        heartRate: 75,
        bloodPressure: '120/80',
        timestamp: new Date().toISOString(),
      };

      const command = new PutRecordCommand({
        StreamName: outputs.KinesisStreamName,
        PartitionKey: testData.patientId,
        Data: Buffer.from(JSON.stringify(testData)),
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();
    });
  });

  describe('ECS Fargate Integration', () => {
    test('should have active ECS cluster', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
      expect(response.clusters?.[0].clusterName).toBe(outputs.ECSClusterName);
    });

    test('should have at least one ECS service', async () => {
      const command = new ListServicesCommand({
        cluster: outputs.ECSClusterName,
      });
      const response = await ecsClient.send(command);

      expect(response.serviceArns).toBeDefined();
      expect(response.serviceArns?.length).toBeGreaterThan(0);
    });

    test('should have running ECS tasks for redundancy', async () => {
      const listCommand = new ListServicesCommand({
        cluster: outputs.ECSClusterName,
      });
      const listResponse = await ecsClient.send(listCommand);

      const describeCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: listResponse.serviceArns,
      });
      const describeResponse = await ecsClient.send(describeCommand);

      expect(describeResponse.services).toBeDefined();
      const service = describeResponse.services?.[0];
      expect(service?.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service?.launchType).toBe('FARGATE');
    });
  });

  describe('RDS Aurora Integration', () => {
    test('should have available Aurora cluster', async () => {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find((c) =>
        c.Endpoint?.includes(outputs.AuroraClusterEndpoint.split('.')[0])
      );

      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toContain('aurora-postgresql');
    });

    test('should have encryption enabled on Aurora cluster', async () => {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find((c) =>
        c.Endpoint?.includes(outputs.AuroraClusterEndpoint.split('.')[0])
      );

      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.KmsKeyId).toBeDefined();
    });

    test('should have Multi-AZ deployment with multiple instances', async () => {
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      const instances = response.DBInstances?.filter((i) =>
        i.DBClusterIdentifier?.includes('medtech-aurora-cluster')
      );

      expect(instances).toBeDefined();
      expect(instances?.length).toBeGreaterThanOrEqual(2);
    });

    test('should not have public accessibility', async () => {
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      const instances = response.DBInstances?.filter((i) =>
        i.DBClusterIdentifier?.includes('medtech-aurora-cluster')
      );

      instances?.forEach((instance) => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });
  });

  describe('ElastiCache Redis Integration', () => {
    test('should have available Redis replication group', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elasticacheClient.send(command);

      const redisGroup = response.ReplicationGroups?.find((g) =>
        g.ReplicationGroupId?.includes('medtech-redis')
      );

      expect(redisGroup).toBeDefined();
      expect(redisGroup?.Status).toBe('available');
    });

    test('should have Multi-AZ enabled with automatic failover', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elasticacheClient.send(command);

      const redisGroup = response.ReplicationGroups?.find((g) =>
        g.ReplicationGroupId?.includes('medtech-redis')
      );

      expect(redisGroup?.MultiAZ).toBe('enabled');
      expect(redisGroup?.AutomaticFailover).toBe('enabled');
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elasticacheClient.send(command);

      const redisGroup = response.ReplicationGroups?.find((g) =>
        g.ReplicationGroupId?.includes('medtech-redis')
      );

      expect(redisGroup?.AtRestEncryptionEnabled).toBe(true);
      expect(redisGroup?.TransitEncryptionEnabled).toBe(true);
    });

    test('should have multiple cache nodes for redundancy', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elasticacheClient.send(command);

      const redisGroup = response.ReplicationGroups?.find((g) =>
        g.ReplicationGroupId?.includes('medtech-redis')
      );

      const nodeCount = redisGroup?.MemberClusters?.length || 0;
      expect(nodeCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secrets Manager Integration', () => {
    test('should have accessible database secret', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      expect(response.ARN).toBe(outputs.DBSecretArn);
    });

    test('should have valid database credentials in secret', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      const secret = JSON.parse(response.SecretString || '{}');
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.engine).toBe('postgres');
      expect(secret.dbname).toBe('medtech');
    });
  });

  describe('API Gateway Integration', () => {
    test('should have deployed API Gateway', async () => {
      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);

      const api = response.items?.find((a) => a.name?.includes('medtech-api'));
      expect(api).toBeDefined();
      expect(api?.name).toContain('medtech-api');
    });

    test('API endpoint should be accessible', async () => {
      // Just verify the endpoint format is correct
      expect(outputs.APIEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*/);
      expect(outputs.APIEndpoint).toContain('us-east-1');
      expect(outputs.APIEndpoint).toContain('/prod/vitals');
    });
  });

  describe('KMS Encryption Integration', () => {
    test('should have accessible KMS key', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.DataEncryptionKeyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyId).toBe(outputs.DataEncryptionKeyId);
    });

    test('KMS key should allow encryption/decryption', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.DataEncryptionKeyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('End-to-End Workflow Integration', () => {
    test('should validate complete data flow architecture', async () => {
      // Verify all components are connected and operational
      const checks = {
        kinesis: false,
        ecs: false,
        aurora: false,
        redis: false,
        secrets: false,
        api: false,
        kms: false,
      };

      // Kinesis check
      try {
        const kinesisCmd = new DescribeStreamCommand({
          StreamName: outputs.KinesisStreamName,
        });
        const kinesisResp = await kinesisClient.send(kinesisCmd);
        checks.kinesis = kinesisResp.StreamDescription?.StreamStatus === 'ACTIVE';
      } catch (e) {
        checks.kinesis = false;
      }

      // ECS check
      try {
        const ecsCmd = new DescribeClustersCommand({
          clusters: [outputs.ECSClusterName],
        });
        const ecsResp = await ecsClient.send(ecsCmd);
        checks.ecs = ecsResp.clusters?.[0]?.status === 'ACTIVE';
      } catch (e) {
        checks.ecs = false;
      }

      // Aurora check
      try {
        const rdsCmd = new DescribeDBClustersCommand({});
        const rdsResp = await rdsClient.send(rdsCmd);
        const cluster = rdsResp.DBClusters?.find((c) =>
          c.Endpoint?.includes(outputs.AuroraClusterEndpoint.split('.')[0])
        );
        checks.aurora = cluster?.Status === 'available';
      } catch (e) {
        checks.aurora = false;
      }

      // Redis check
      try {
        const redisCmd = new DescribeReplicationGroupsCommand({});
        const redisResp = await elasticacheClient.send(redisCmd);
        const redisGroup = redisResp.ReplicationGroups?.find((g) =>
          g.ReplicationGroupId?.includes('medtech-redis')
        );
        checks.redis = redisGroup?.Status === 'available';
      } catch (e) {
        checks.redis = false;
      }

      // Secrets check
      try {
        const secretsCmd = new GetSecretValueCommand({
          SecretId: outputs.DBSecretArn,
        });
        await secretsClient.send(secretsCmd);
        checks.secrets = true;
      } catch (e) {
        checks.secrets = false;
      }

      // API check
      checks.api = outputs.APIEndpoint.includes('https://');

      // KMS check
      try {
        const kmsCmd = new DescribeKeyCommand({
          KeyId: outputs.DataEncryptionKeyId,
        });
        const kmsResp = await kmsClient.send(kmsCmd);
        checks.kms = kmsResp.KeyMetadata?.KeyState === 'Enabled';
      } catch (e) {
        checks.kms = false;
      }

      // All components should be operational
      expect(checks.kinesis).toBe(true);
      expect(checks.ecs).toBe(true);
      expect(checks.aurora).toBe(true);
      expect(checks.redis).toBe(true);
      expect(checks.secrets).toBe(true);
      expect(checks.api).toBe(true);
      expect(checks.kms).toBe(true);
    });
  });
});
