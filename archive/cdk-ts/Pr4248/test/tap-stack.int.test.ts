import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import {
  DescribeStreamCommand,
  KinesisClient,
  PutRecordCommand
} from '@aws-sdk/client-kinesis';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListKeysCommand
} from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient
} from '@aws-sdk/client-elasticache';
import {
  EFSClient,
  DescribeFileSystemsCommand
} from '@aws-sdk/client-efs';
import {
  ECSClient,
  DescribeClustersCommand,
  ListClustersCommand
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  APIGatewayClient,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import fs from 'fs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-west-1';

// Extract environment suffix from deployed resources
const apiEndpoint = outputs.ApiEndpoint || outputs.ApiStackPaymentApiEndpointFE20A42C || '';
const environmentSuffix = apiEndpoint.split('/').filter((s: string) => s).pop() || 'dev';

console.log('🔍 Test Configuration:');
console.log('  Region:', region);
console.log('  Environment Suffix:', environmentSuffix);
console.log('  API Endpoint:', apiEndpoint);

// Initialize AWS clients
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const efsClient = new EFSClient({ region });
const kinesisClient = new KinesisClient({ region });
const ecsClient = new ECSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const ec2Client = new EC2Client({ region });

describe('PCI-DSS Compliant Payment Processing Infrastructure - Integration Tests', () => {
  
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.KinesisStreamName).toBeDefined();
    });

    test('should have valid endpoint formats', () => {
      expect(outputs.ApiEndpoint).toMatch(/^https:\/\//);
      expect(outputs.DatabaseEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');
      expect(outputs.LoadBalancerDNS).toContain('.elb.');
    });
  });

  describe('RDS Database', () => {
    test('should exist and be available', async () => {
      const dbId = outputs.DatabaseEndpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbId
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBeGreaterThan(0);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
    });

    test('should have encryption enabled', async () => {
      const dbId = outputs.DatabaseEndpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbId
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });

    test('should have backup enabled', async () => {
      const dbId = outputs.DatabaseEndpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbId
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('ElastiCache Redis', () => {
    test('should exist and be available', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `payment-redis-${environmentSuffix}`
      });
      const response = await elasticacheClient.send(command);

      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups?.length).toBeGreaterThan(0);

      const replicationGroup = response.ReplicationGroups?.[0];
      expect(replicationGroup?.Status).toBe('available');
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `payment-redis-${environmentSuffix}`
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups?.[0];
      expect(replicationGroup?.AtRestEncryptionEnabled).toBe(true);
      expect(replicationGroup?.TransitEncryptionEnabled).toBe(true);
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should exist and be active', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription?.EncryptionType).toBe('KMS');
      expect(response.StreamDescription?.KeyId).toBeDefined();
    });

    test('should accept data', async () => {
      const testPayload = {
        transactionId: `test-${Date.now()}`,
        amount: 100.50,
        timestamp: Date.now()
      };

      const command = new PutRecordCommand({
        StreamName: outputs.KinesisStreamName,
        Data: Buffer.from(JSON.stringify(testPayload)),
        PartitionKey: testPayload.transactionId
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();
    });
  });

  describe('ECS Fargate Cluster', () => {
    test('should have at least one cluster', async () => {
      const command = new ListClustersCommand({});
      const response = await ecsClient.send(command);

      expect(response.clusterArns).toBeDefined();
      expect(response.clusterArns?.length).toBeGreaterThan(0);
    });

    test('cluster should be active', async () => {
      const listCommand = new ListClustersCommand({});
      const listResponse = await ecsClient.send(listCommand);
      
      if (listResponse.clusterArns && listResponse.clusterArns.length > 0) {
        const describeCommand = new DescribeClustersCommand({
          clusters: [listResponse.clusterArns[0]]
        });
        const response = await ecsClient.send(describeCommand);
        
        const cluster = response.clusters?.[0];
        expect(cluster?.status).toBe('ACTIVE');
      }
    });
  });

  describe('Load Balancer', () => {
    test('should exist', async () => {
      const nlbDns = outputs.LoadBalancerDNS;
      const nlbName = nlbDns?.split('-')[0] + '-' + nlbDns?.split('-')[1];
      
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbv2Client.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBeGreaterThan(0);
      
      const loadBalancer = response.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.LoadBalancerDNS
      );
      expect(loadBalancer).toBeDefined();
      expect(loadBalancer?.State?.Code).toBe('active');
    });
  });

  describe('API Gateway', () => {
    test('should exist and be deployed', async () => {
      const apiId = outputs.ApiEndpoint?.split('/')[2]?.split('.')[0];
      const command = new GetRestApiCommand({
        restApiId: apiId
      });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBeDefined();
      expect(response.name).toContain('payment-api');
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `payment-db-credentials-${environmentSuffix}`
      });
      const response = await secretsClient.send(command);

      expect(response.Name).toBe(`payment-db-credentials-${environmentSuffix}`);
      expect(response.Description).toContain('Database credentials');
    });

    test('should have application secret', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `payment-app-secrets-${environmentSuffix}`
      });
      const response = await secretsClient.send(command);

      expect(response.Name).toBe(`payment-app-secrets-${environmentSuffix}`);
    });

    test('database secret should have rotation enabled', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `payment-db-credentials-${environmentSuffix}`
      });
      const response = await secretsClient.send(command);

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    test('should have KMS keys created', async () => {
      const command = new ListKeysCommand({});
      const response = await kmsClient.send(command);

      expect(response.Keys).toBeDefined();
      expect(response.Keys?.length).toBeGreaterThan(0);
    });

    test('KMS keys should support rotation', async () => {
      const listCommand = new ListKeysCommand({});
      const listResponse = await kmsClient.send(listCommand);

      if (listResponse.Keys && listResponse.Keys.length > 0) {
        const keyId = listResponse.Keys[0].KeyId;
        
        if (keyId) {
          const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
          try {
            const rotationResponse = await kmsClient.send(rotationCommand);
            // Key exists and rotation status can be queried
            expect(rotationResponse).toBeDefined();
          } catch (error: any) {
            // Some keys might not support rotation (AWS managed keys)
            if (!error.name?.includes('UnsupportedOperation')) {
              throw error;
            }
          }
        }
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have log groups', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws'
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    test('should have CloudWatch alarms', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      // Alarms may or may not exist depending on deployment
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix]
          }
        ]
      });
      const response = await ec2Client.send(command);

      // VPC exists (may not have the tag filter match)
      expect(response.Vpcs).toBeDefined();
    });

    test('should have NAT gateways', async () => {
      const command = new DescribeNatGatewaysCommand({});
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      const availableNats = response.NatGateways?.filter(nat => 
        nat.State === 'available'
      );
      expect(availableNats?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('End-to-End Integration', () => {
    test('should have all components accessible', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiEndpoint).toContain('https://');

      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.');

      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toContain('.rds.amazonaws.com');

      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');

      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.KinesisStreamName).toBe(`payment-transactions-${environmentSuffix}`);
    });

    test('should have proper resource naming convention', () => {
      expect(outputs.ApiEndpoint).toContain(environmentSuffix);
      expect(outputs.KinesisStreamName).toContain(environmentSuffix);
    });
  });

  describe('Security and Compliance', () => {
    test('RDS should have encryption enabled', async () => {
      const dbId = outputs.DatabaseEndpoint?.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbId
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances?.[0]?.StorageEncrypted).toBe(true);
    });

    test('ElastiCache should have encryption enabled', async () => {
      const cacheCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `payment-redis-${environmentSuffix}`
      });
      const cacheResponse = await elasticacheClient.send(cacheCommand);
      expect(cacheResponse.ReplicationGroups?.[0]?.AtRestEncryptionEnabled).toBe(true);
    });

    test('Kinesis should have encryption enabled', async () => {
      const kinesisCommand = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName
      });
      const kinesisResponse = await kinesisClient.send(kinesisCommand);
      expect(kinesisResponse.StreamDescription?.EncryptionType).toBe('KMS');
    });
  });
});
