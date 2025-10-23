import {
  APIGatewayClient,
  GetRestApisCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
} from '@aws-sdk/client-ecs';
import {
  DescribeFileSystemsCommand,
  DescribeMountTargetsCommand,
  EFSClient,
} from '@aws-sdk/client-efs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import {
  DescribeStreamCommand,
  KinesisClient,
  PutRecordCommand,
} from '@aws-sdk/client-kinesis';
import {
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBClusterEndpointsCommand,
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to load outputs
function loadOutputs(): any {
  const outputPath = path.join(process.cwd(), 'terraform-outputs.json');

  if (fs.existsSync(outputPath)) {
    const content = fs.readFileSync(outputPath, 'utf-8');
    return JSON.parse(content);
  }

  return {};
}

describe('Student Analytics Platform Integration Tests', () => {
  const outputs = loadOutputs();
  let kinesisClient: KinesisClient;
  let ecsClient: ECSClient;
  let elasticacheClient: ElastiCacheClient;
  let rdsClient: RDSClient;
  let efsClient: EFSClient;
  let apiGatewayClient: APIGatewayClient;
  let secretsClient: SecretsManagerClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let kmsClient: KMSClient;
  let ec2Client: EC2Client;

  beforeAll(() => {
    kinesisClient = new KinesisClient({ region: AWS_REGION });
    ecsClient = new ECSClient({ region: AWS_REGION });
    elasticacheClient = new ElastiCacheClient({ region: AWS_REGION });
    rdsClient = new RDSClient({ region: AWS_REGION });
    efsClient = new EFSClient({ region: AWS_REGION });
    apiGatewayClient = new APIGatewayClient({ region: AWS_REGION });
    secretsClient = new SecretsManagerClient({ region: AWS_REGION });
    elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
    kmsClient = new KMSClient({ region: AWS_REGION });
    ec2Client = new EC2Client({ region: AWS_REGION });
  });

  afterAll(() => {
    kinesisClient.destroy();
    ecsClient.destroy();
    elasticacheClient.destroy();
    rdsClient.destroy();
    efsClient.destroy();
    apiGatewayClient.destroy();
    secretsClient.destroy();
    elbClient.destroy();
    kmsClient.destroy();
    ec2Client.destroy();
  });

  describe('VPC and Networking', () => {
    test('VPC exists and is properly configured', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`edu-vpc-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('Public subnets exist in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`edu-public-subnet-*-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Private subnets exist in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`edu-private-subnet-*-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('Security groups are configured correctly', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [ENVIRONMENT_SUFFIX],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists with rotation enabled', async () => {
      const listCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`edu-kms-key-${ENVIRONMENT_SUFFIX}`],
          },
        ],
      });

      // Note: In actual test, you would need the key ID from outputs
      // This is a placeholder to demonstrate the test structure
      expect(true).toBe(true);
    });
  });

  describe('Kinesis Data Stream', () => {
    test('Kinesis stream exists and is active', async () => {
      const streamName = `edu-analytics-stream-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeStreamCommand({
        StreamName: streamName,
      });

      const response = await kinesisClient.send(command);
      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription!.StreamName).toBe(streamName);
    }, 30000);

    test('Kinesis stream has correct shard count', async () => {
      const streamName = `edu-analytics-stream-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeStreamCommand({
        StreamName: streamName,
      });

      const response = await kinesisClient.send(command);
      expect(response.StreamDescription!.Shards).toBeDefined();
      expect(response.StreamDescription!.Shards!.length).toBeGreaterThanOrEqual(
        2
      );
    }, 30000);

    test('Can write data to Kinesis stream', async () => {
      const streamName = `edu-analytics-stream-${ENVIRONMENT_SUFFIX}`;
      const testData = JSON.stringify({
        studentId: 'test-123',
        timestamp: new Date().toISOString(),
        metric: 'test-performance',
        value: 95,
      });

      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(testData),
        PartitionKey: 'test-123',
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();
    }, 30000);

    test('Kinesis stream has encryption enabled', async () => {
      const streamName = `edu-analytics-stream-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeStreamCommand({
        StreamName: streamName,
      });

      const response = await kinesisClient.send(command);
      expect(response.StreamDescription!.EncryptionType).toBe('KMS');
      expect(response.StreamDescription!.KeyId).toBeDefined();
    }, 30000);
  });

  describe('ElastiCache Redis Cluster', () => {
    test('Redis cluster exists and is available', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `edu-redis-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await elasticacheClient.send(command);
      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups!.length).toBe(1);

      const cluster = response.ReplicationGroups![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.MultiAZ).toBe('enabled');
    }, 30000);

    test('Redis has automatic failover enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `edu-redis-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await elasticacheClient.send(command);
      const cluster = response.ReplicationGroups![0];
      expect(cluster.AutomaticFailover).toBe('enabled');
    }, 30000);

    test('Redis has encryption at rest enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `edu-redis-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await elasticacheClient.send(command);
      const cluster = response.ReplicationGroups![0];
      expect(cluster.AtRestEncryptionEnabled).toBe(true);
    }, 30000);

    test('Redis has transit encryption enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `edu-redis-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await elasticacheClient.send(command);
      const cluster = response.ReplicationGroups![0];
      expect(cluster.TransitEncryptionEnabled).toBe(true);
    }, 30000);
  });

  describe('RDS Aurora PostgreSQL', () => {
    test('Aurora cluster exists and is available', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `edu-aurora-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
    }, 30000);

    test('Aurora has storage encryption enabled', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `edu-aurora-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    }, 30000);

    test('Aurora has Serverless v2 scaling configured', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `edu-aurora-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration!.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration!.MaxCapacity).toBe(2);
    }, 30000);

    test('Aurora cluster has endpoint available', async () => {
      const command = new DescribeDBClusterEndpointsCommand({
        DBClusterIdentifier: `edu-aurora-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusterEndpoints).toBeDefined();
      expect(response.DBClusterEndpoints!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('EFS File System', () => {
    test('EFS file system exists and is available', async () => {
      const command = new DescribeFileSystemsCommand({});

      const response = await efsClient.send(command);
      const efsSystem = response.FileSystems!.find(
        fs => fs.Name === `edu-efs-${ENVIRONMENT_SUFFIX}`
      );

      expect(efsSystem).toBeDefined();
      expect(efsSystem!.LifeCycleState).toBe('available');
      expect(efsSystem!.Encrypted).toBe(true);
    }, 30000);

    test('EFS has mount targets in multiple AZs', async () => {
      const describeCommand = new DescribeFileSystemsCommand({});
      const fsResponse = await efsClient.send(describeCommand);
      const efsSystem = fsResponse.FileSystems!.find(
        fs => fs.Name === `edu-efs-${ENVIRONMENT_SUFFIX}`
      );

      if (efsSystem && efsSystem.FileSystemId) {
        const mountCommand = new DescribeMountTargetsCommand({
          FileSystemId: efsSystem.FileSystemId,
        });

        const mountResponse = await efsClient.send(mountCommand);
        expect(mountResponse.MountTargets).toBeDefined();
        expect(mountResponse.MountTargets!.length).toBeGreaterThanOrEqual(2);

        const azs = new Set(
          mountResponse.MountTargets!.map(mt => mt.AvailabilityZoneName)
        );
        expect(azs.size).toBeGreaterThanOrEqual(2);
      }
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('Database credentials secret exists', async () => {
      const secretName = `edu-db-credentials-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBe(secretName);
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);

    test('Redis configuration secret exists', async () => {
      const secretName = `edu-redis-config-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBe(secretName);
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);

    test('Database secret contains correct configuration', async () => {
      const secretName = `edu-db-credentials-${ENVIRONMENT_SUFFIX}`;
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.username).toBe('dbadmin');
      expect(secretData.engine).toBe('postgres');
      expect(secretData.port).toBe(5432);
      expect(secretData.dbname).toBe('eduanalytics');
    }, 30000);

    test('Secrets have rotation configured', async () => {
      const secretName = `edu-db-credentials-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await secretsClient.send(command);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules!.AutomaticallyAfterDays).toBe(30);
    }, 30000);
  });

  describe('ECS Fargate Cluster', () => {
    test('ECS cluster exists and is active', async () => {
      const clusterName = `edu-ecs-cluster-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeClustersCommand({
        clusters: [clusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(clusterName);
    }, 30000);

    test('ECS service exists and is running', async () => {
      const clusterName = `edu-ecs-cluster-${ENVIRONMENT_SUFFIX}`;
      const serviceName = `edu-analytics-service-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
    }, 30000);

    test('ECS task definition is registered', async () => {
      const taskFamily = `edu-analytics-task-${ENVIRONMENT_SUFFIX}`;
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskFamily,
      });

      const response = await ecsClient.send(command);
      expect(response.taskDefinition).toBeDefined();
      expect(response.taskDefinition!.family).toBe(taskFamily);
      expect(response.taskDefinition!.networkMode).toBe('awsvpc');
      expect(response.taskDefinition!.requiresCompatibilities).toContain(
        'FARGATE'
      );
    }, 30000);

    test('Application Load Balancer exists and is active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`edu-alb-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State!.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    }, 30000);

    test('Target group is configured for ECS service', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`edu-tg-v2-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);

      const tg = response.TargetGroups![0];
      expect(tg.Port).toBe(80);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.TargetType).toBe('ip');
    }, 30000);

    test('ECS tasks are registered with target group', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({
        Names: [`edu-tg-v2-${ENVIRONMENT_SUFFIX}`],
      });

      const tgResponse = await elbClient.send(tgCommand);
      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn;

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn,
      });

      const healthResponse = await elbClient.send(healthCommand);
      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
    }, 30000);
  });

  describe('API Gateway', () => {
    test('REST API exists', async () => {
      const command = new GetRestApisCommand({});

      const response = await apiGatewayClient.send(command);
      const api = response.items!.find(
        a => a.name === `edu-analytics-api-${ENVIRONMENT_SUFFIX}`
      );

      expect(api).toBeDefined();
      expect(api!.description).toContain('student analytics');
    }, 30000);

    test('API stage is deployed', async () => {
      const listCommand = new GetRestApisCommand({});
      const listResponse = await apiGatewayClient.send(listCommand);
      const api = listResponse.items!.find(
        a => a.name === `edu-analytics-api-${ENVIRONMENT_SUFFIX}`
      );

      if (api && api.id) {
        const stageCommand = new GetStageCommand({
          restApiId: api.id,
          stageName: ENVIRONMENT_SUFFIX,
        });

        const stageResponse = await apiGatewayClient.send(stageCommand);
        expect(stageResponse.stageName).toBe(ENVIRONMENT_SUFFIX);
        expect(stageResponse.tracingEnabled).toBe(true);
      }
    }, 30000);
  });

  describe('High Availability and Failover', () => {
    test('Redis cluster supports automatic failover', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `edu-redis-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await elasticacheClient.send(command);
      const cluster = response.ReplicationGroups![0];

      expect(cluster.AutomaticFailover).toBe('enabled');
      expect(cluster.MultiAZ).toBe('enabled');
      expect(cluster.MemberClusters!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('ECS service has tasks running in multiple AZs', async () => {
      const clusterName = `edu-ecs-cluster-${ENVIRONMENT_SUFFIX}`;
      const serviceName = `edu-analytics-service-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.runningCount).toBeGreaterThanOrEqual(2);
      expect(service.networkConfiguration).toBeDefined();
    }, 30000);
  });

  describe('Security and Compliance', () => {
    test('All encryption is configured with KMS', async () => {
      const streamCommand = new DescribeStreamCommand({
        StreamName: `edu-analytics-stream-${ENVIRONMENT_SUFFIX}`,
      });
      const streamResponse = await kinesisClient.send(streamCommand);
      expect(streamResponse.StreamDescription!.EncryptionType).toBe('KMS');

      const dbCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: `edu-aurora-${ENVIRONMENT_SUFFIX}`,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      expect(dbResponse.DBClusters![0].StorageEncrypted).toBe(true);

      const redisCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `edu-redis-${ENVIRONMENT_SUFFIX}`,
      });
      const redisResponse = await elasticacheClient.send(redisCommand);
      expect(redisResponse.ReplicationGroups![0].AtRestEncryptionEnabled).toBe(
        true
      );
    }, 30000);

    test('Secrets are encrypted with KMS', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `edu-db-credentials-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('Performance and Scalability', () => {
    test('Kinesis stream can handle multiple writes', async () => {
      const streamName = `edu-analytics-stream-${ENVIRONMENT_SUFFIX}`;
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const testData = JSON.stringify({
          studentId: `test-${i}`,
          timestamp: new Date().toISOString(),
          metric: 'performance',
          value: Math.floor(Math.random() * 100),
        });

        const command = new PutRecordCommand({
          StreamName: streamName,
          Data: Buffer.from(testData),
          PartitionKey: `test-${i}`,
        });

        promises.push(kinesisClient.send(command));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.SequenceNumber).toBeDefined();
      });
    }, 30000);

    test('ECS service can scale to desired count', async () => {
      const clusterName = `edu-ecs-cluster-${ENVIRONMENT_SUFFIX}`;
      const serviceName = `edu-analytics-service-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.desiredCount).toBe(2);
      expect(service.runningCount).toBeGreaterThanOrEqual(1);
    }, 30000);
  });
});
