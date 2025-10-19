import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  EFSClient,
  DescribeFileSystemsCommand,
} from '@aws-sdk/client-efs';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  KinesisClient,
  DescribeStreamCommand,
} from '@aws-sdk/client-kinesis';
import {
  APIGatewayClient,
  GetRestApisCommand,
} from '@aws-sdk/client-api-gateway';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const efsClient = new EFSClient({ region });
const ecsClient = new ECSClient({ region });
const kinesisClient = new KinesisClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });

describe('TapStack Integration Tests - PCI-DSS Transaction Processing Infrastructure', () => {
  describe('CloudFormation Stack', () => {
    test('CloudFormation stack should exist and be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const stackName = outputs.StackName;
      expect(stackName).toBeDefined();

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      expect(response.Stacks).toHaveLength(1);

      const stack = response.Stacks![0];
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus);
      expect(stack.StackName).toBe(stackName);
    }, 30000);

    test('stack should have correct outputs', async () => {
      const stackName = outputs.StackName;

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      const stack = response.Stacks![0];

      expect(stack.Outputs).toBeDefined();
      expect(stack.Outputs!.length).toBeGreaterThanOrEqual(11);

      const expectedOutputKeys = [
        'VPCId',
        'DatabaseEndpoint',
        'DatabasePort',
        'RedisEndpoint',
        'RedisPort',
        'KinesisStreamName',
        'EFSFileSystemId',
        'LoadBalancerDNS',
        'APIGatewayURL',
        'ECSClusterName',
        'DatabaseSecretArn',
      ];

      expectedOutputKeys.forEach(key => {
        const output = stack.Outputs?.find(o => o.OutputKey === key);
        expect(output).toBeDefined();
        expect(output?.OutputValue).toBeDefined();
      });
    }, 30000);
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.VpcId).toBe(vpcId);
    }, 30000);

    test('VPC should have subnets across multiple availability zones', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3); // Minimum 3 AZs
    }, 30000);

    test('VPC should have NAT Gateway for private subnet connectivity', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('Security groups should be properly configured', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(1); // Multiple security groups for different services
    }, 30000);
  });

  describe('RDS Aurora PostgreSQL Database', () => {
    test('RDS Aurora cluster should exist and be available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      // Extract cluster identifier from endpoint
      const clusterId = dbEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    }, 30000);

    test('RDS cluster should have encryption enabled', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterId = dbEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    }, 30000);

    test('RDS cluster should be multi-AZ for high availability', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterId = dbEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.MultiAZ).toBe(true);
      expect(cluster.AvailabilityZones).toBeDefined();
      expect(cluster.AvailabilityZones!.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('RDS cluster should have multiple instances', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterId = dbEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(2); // Writer + Reader
    }, 30000);

    test('Database port should be correct', () => {
      const dbPort = outputs.DatabasePort;
      expect(dbPort).toBeDefined();
      expect(dbPort).toBe('3306'); // Aurora PostgreSQL compatible with MySQL port
    });
  });

  describe('ElastiCache Redis Cluster', () => {
    test('ElastiCache Redis cluster should exist and be available', async () => {
      const redisEndpoint = outputs.RedisEndpoint;
      expect(redisEndpoint).toBeDefined();

      // Extract replication group ID from endpoint
      const replicationGroupId = redisEndpoint.split('.')[0].replace('master.', '');

      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });

      const response = await elasticacheClient.send(command);
      expect(response.ReplicationGroups).toHaveLength(1);

      const cluster = response.ReplicationGroups![0];
      expect(cluster.Status).toBe('available');
    }, 30000);

    test('Redis cluster should have encryption enabled', async () => {
      const redisEndpoint = outputs.RedisEndpoint;
      const replicationGroupId = redisEndpoint.split('.')[0].replace('master.', '');

      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });

      const response = await elasticacheClient.send(command);
      const cluster = response.ReplicationGroups![0];

      expect(cluster.AtRestEncryptionEnabled).toBe(true);
      expect(cluster.TransitEncryptionEnabled).toBe(true);
    }, 30000);

    test('Redis cluster should have automatic failover enabled', async () => {
      const redisEndpoint = outputs.RedisEndpoint;
      const replicationGroupId = redisEndpoint.split('.')[0].replace('master.', '');

      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      });

      const response = await elasticacheClient.send(command);
      const cluster = response.ReplicationGroups![0];

      expect(cluster.AutomaticFailover).toBe('enabled');
      expect(cluster.MultiAZ).toBe('enabled');
    }, 30000);

    test('Redis port should be correct', () => {
      const redisPort = outputs.RedisPort;
      expect(redisPort).toBeDefined();
      expect(redisPort).toBe('6379');
    });
  });

  describe('EFS File System', () => {
    test('EFS file system should exist and be available', async () => {
      const fileSystemId = outputs.EFSFileSystemId;
      expect(fileSystemId).toBeDefined();

      const command = new DescribeFileSystemsCommand({
        FileSystemId: fileSystemId,
      });

      const response = await efsClient.send(command);
      expect(response.FileSystems).toHaveLength(1);

      const fs = response.FileSystems![0];
      expect(fs.LifeCycleState).toBe('available');
      expect(fs.FileSystemId).toBe(fileSystemId);
    }, 30000);

    test('EFS file system should have encryption enabled', async () => {
      const fileSystemId = outputs.EFSFileSystemId;

      const command = new DescribeFileSystemsCommand({
        FileSystemId: fileSystemId,
      });

      const response = await efsClient.send(command);
      const fs = response.FileSystems![0];

      expect(fs.Encrypted).toBe(true);
      expect(fs.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('ECS Fargate Cluster', () => {
    test('ECS cluster should exist and be active', async () => {
      const clusterName = outputs.ECSClusterName;
      expect(clusterName).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(clusterName);
    }, 30000);

    test('ECS cluster should have active services', async () => {
      const clusterName = outputs.ECSClusterName;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [`service-transaction-${clusterName.split('-').pop()}`],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toBeDefined();
      expect(response.services!.length).toBeGreaterThan(0);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
    }, 30000);
  });

  describe('Kinesis Data Stream', () => {
    test('Kinesis stream should exist and be active', async () => {
      const streamName = outputs.KinesisStreamName;
      expect(streamName).toBeDefined();

      const command = new DescribeStreamCommand({
        StreamName: streamName,
      });

      const response = await kinesisClient.send(command);
      expect(response.StreamDescription).toBeDefined();

      const stream = response.StreamDescription!;
      expect(stream.StreamStatus).toBe('ACTIVE');
      expect(stream.StreamName).toBe(streamName);
    }, 30000);

    test('Kinesis stream should have encryption enabled', async () => {
      const streamName = outputs.KinesisStreamName;

      const command = new DescribeStreamCommand({
        StreamName: streamName,
      });

      const response = await kinesisClient.send(command);
      const stream = response.StreamDescription!;

      expect(stream.EncryptionType).toBe('KMS');
      expect(stream.KeyId).toBeDefined();
    }, 30000);
  });

  describe('API Gateway', () => {
    test('API Gateway should be accessible', async () => {
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+$/);
    }, 30000);

    test('API Gateway REST API should exist', async () => {
      const apiUrl = outputs.APIGatewayURL;
      const apiId = apiUrl.split('.')[0].split('//')[1];

      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);

      const api = response.items?.find(item => item.id === apiId);
      expect(api).toBeDefined();
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('Load Balancer should exist and be active', async () => {
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/^alb-.+\.elb\.amazonaws\.com$/);

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
    }, 30000);

    test('Load Balancer should have target groups', async () => {
      const albDns = outputs.LoadBalancerDNS;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find(lb => lb.DNSName === albDns);

      expect(alb?.LoadBalancerArn).toBeDefined();

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });

      const tgResponse = await elbClient.send(tgCommand);
      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('Database secret should exist', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({
        SecretId: secretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toBeDefined();
    }, 30000);

    test('Database secret should have KMS encryption', async () => {
      const secretArn = outputs.DatabaseSecretArn;

      const command = new DescribeSecretCommand({
        SecretId: secretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('PCI-DSS Compliance Validation', () => {
    test('All data stores should have encryption at rest', async () => {
      // RDS encryption
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterId = dbEndpoint.split('.')[0];
      const rdsResponse = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
      );
      expect(rdsResponse.DBClusters![0].StorageEncrypted).toBe(true);

      // ElastiCache encryption
      const redisEndpoint = outputs.RedisEndpoint;
      const replicationGroupId = redisEndpoint.split('.')[0].replace('master.', '');
      const redisResponse = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({ ReplicationGroupId: replicationGroupId })
      );
      expect(redisResponse.ReplicationGroups![0].AtRestEncryptionEnabled).toBe(true);

      // EFS encryption
      const fileSystemId = outputs.EFSFileSystemId;
      const efsResponse = await efsClient.send(
        new DescribeFileSystemsCommand({ FileSystemId: fileSystemId })
      );
      expect(efsResponse.FileSystems![0].Encrypted).toBe(true);

      // Kinesis encryption
      const streamName = outputs.KinesisStreamName;
      const kinesisResponse = await kinesisClient.send(
        new DescribeStreamCommand({ StreamName: streamName })
      );
      expect(kinesisResponse.StreamDescription!.EncryptionType).toBe('KMS');
    }, 60000);

    test('All data in transit should use encryption', async () => {
      // ElastiCache transit encryption
      const redisEndpoint = outputs.RedisEndpoint;
      const replicationGroupId = redisEndpoint.split('.')[0].replace('master.', '');
      const redisResponse = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({ ReplicationGroupId: replicationGroupId })
      );
      expect(redisResponse.ReplicationGroups![0].TransitEncryptionEnabled).toBe(true);

      // API Gateway uses HTTPS
      const apiUrl = outputs.APIGatewayURL;
      expect(apiUrl).toMatch(/^https:\/\//);
    }, 30000);

    test('High availability should be configured', async () => {
      // RDS Multi-AZ
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterId = dbEndpoint.split('.')[0];
      const rdsResponse = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
      );
      expect(rdsResponse.DBClusters![0].MultiAZ).toBe(true);

      // ElastiCache automatic failover
      const redisEndpoint = outputs.RedisEndpoint;
      const replicationGroupId = redisEndpoint.split('.')[0].replace('master.', '');
      const redisResponse = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({ ReplicationGroupId: replicationGroupId })
      );
      expect(redisResponse.ReplicationGroups![0].AutomaticFailover).toBe('enabled');
    }, 30000);
  });

  describe('Output Validation', () => {
    test('all required outputs should be present and valid', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toMatch(/\.rds\.amazonaws\.com$/);

      expect(outputs.DatabasePort).toBeDefined();

      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toMatch(/\.cache\.amazonaws\.com$/);

      expect(outputs.RedisPort).toBeDefined();

      expect(outputs.KinesisStreamName).toBeDefined();

      expect(outputs.EFSFileSystemId).toBeDefined();
      expect(outputs.EFSFileSystemId).toMatch(/^fs-[a-f0-9]+$/);

      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toMatch(/\.elb\.amazonaws\.com$/);

      expect(outputs.APIGatewayURL).toBeDefined();
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+$/);

      expect(outputs.ECSClusterName).toBeDefined();

      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });
  });
});
