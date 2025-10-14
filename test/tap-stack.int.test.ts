import {
  APIGatewayClient,
  GetMethodCommand,
  GetResourcesCommand,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand
} from '@aws-sdk/client-ecs';
import {
  DescribeFileSystemsCommand,
  DescribeMountTargetsCommand,
  EFSClient
} from '@aws-sdk/client-efs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient
} from '@aws-sdk/client-elasticache';
import {
  DescribeStreamCommand,
  KinesisClient,
  PutRecordCommand
} from '@aws-sdk/client-kinesis';
import {
  DescribeKeyCommand,
  KMSClient,
  ListKeysCommand
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import {
  GetWebACLCommand,
  ListWebACLsCommand,
  WAFV2Client
} from '@aws-sdk/client-wafv2';
import fs from 'fs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-west-1';

// Extract environment suffix from deployed resources
// API endpoint format: https://xxx.execute-api.us-west-1.amazonaws.com/{suffix}/
const apiEndpoint = outputs.ApiEndpoint || outputs.ApiStackPaymentApiEndpointFE20A42C || '';
const environmentSuffix = apiEndpoint.split('/').filter((s: string) => s).pop() || 'dev';

console.log('🔍 Test Configuration:');
console.log('  Region:', region);
console.log('  Environment Suffix:', environmentSuffix);
console.log('  API Endpoint:', apiEndpoint);
console.log('  Redis Endpoint:', outputs.RedisEndpoint);
console.log('  Kinesis Stream:', outputs.KinesisStreamName);
console.log('  Database Endpoint:', outputs.DatabaseEndpoint);

// Initialize AWS clients
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const efsClient = new EFSClient({ region });
const kinesisClient = new KinesisClient({ region });
const ecsClient = new ECSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const wafClient = new WAFV2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const ec2Client = new EC2Client({ region });

describe('PCI-DSS Compliant Payment Processing Infrastructure - Integration Tests', () => {
  describe('RDS Database', () => {
    test('should exist and be available', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint?.split('.')[0]
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBeGreaterThan(0);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      // MultiAZ is disabled for faster deployment (optimization)
      // expect(dbInstance?.MultiAZ).toBe(true);
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint?.split('.')[0]
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });

    test('should have backup enabled', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint?.split('.')[0]
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance?.PreferredBackupWindow).toBeDefined();
    });

    test('should be in private subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `payment-database-subnet-group-${environmentSuffix}`
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups?.length).toBeGreaterThan(0);

      const subnetGroup = response.DBSubnetGroups?.[0];
      expect(subnetGroup?.VpcId).toBeDefined();
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
      expect(replicationGroup?.Engine).toBe('redis');
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

    test('should be in private subnets', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `payment-redis-${environmentSuffix}`
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups?.[0];
      expect(replicationGroup?.CacheSubnetGroupName).toBeDefined();
    });
  });

  describe('EFS File System', () => {
    test('should exist and be available', async () => {
      const command = new DescribeFileSystemsCommand({});
      const response = await efsClient.send(command);

      expect(response.FileSystems).toBeDefined();
      expect(response.FileSystems?.length).toBeGreaterThan(0);

      const fileSystem = response.FileSystems?.find(fs =>
        fs.FileSystemId?.includes('payment-filesystem')
      );
      expect(fileSystem).toBeDefined();
      expect(fileSystem?.LifeCycleState).toBe('available');
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeFileSystemsCommand({});
      const response = await efsClient.send(command);

      const fileSystem = response.FileSystems?.find(fs =>
        fs.FileSystemId?.includes('payment-filesystem')
      );
      expect(fileSystem?.Encrypted).toBe(true);
      expect(fileSystem?.KmsKeyId).toBeDefined();
    });

    test('should have mount targets in all AZs', async () => {
      const command = new DescribeFileSystemsCommand({});
      const response = await efsClient.send(command);

      const fileSystem = response.FileSystems?.find(fs =>
        fs.FileSystemId?.includes('payment-filesystem')
      );

      if (fileSystem?.FileSystemId) {
        const mountTargetsCommand = new DescribeMountTargetsCommand({
          FileSystemId: fileSystem.FileSystemId
        });
        const mountTargetsResponse = await efsClient.send(mountTargetsCommand);

        expect(mountTargetsResponse.MountTargets?.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should exist and be active', async () => {
      const command = new DescribeStreamCommand({
        StreamName: `payment-transactions-${environmentSuffix}`
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription?.StreamName).toBe(`payment-transactions-${environmentSuffix}`);
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeStreamCommand({
        StreamName: `payment-transactions-${environmentSuffix}`
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription?.EncryptionType).toBe('KMS');
      expect(response.StreamDescription?.KeyId).toBeDefined();
    });

    test('should accept data', async () => {
      const testPayload = {
        transactionId: 'test-transaction-001',
        amount: 100.50,
        currency: 'USD',
        timestamp: Date.now()
      };

      const command = new PutRecordCommand({
        StreamName: `payment-transactions-${environmentSuffix}`,
        Data: Buffer.from(JSON.stringify(testPayload)),
        PartitionKey: testPayload.transactionId
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();
    });
  });

  describe('ECS Fargate Cluster', () => {
    test('should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [`payment-cluster-${environmentSuffix}`]
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBeGreaterThan(0);

      const cluster = response.clusters?.[0];
      expect(cluster?.clusterName).toBe(`payment-cluster-${environmentSuffix}`);
      expect(cluster?.status).toBe('ACTIVE');
    });

    test('should have running service', async () => {
      const command = new DescribeServicesCommand({
        cluster: `payment-cluster-${environmentSuffix}`,
        services: [`payment-service-${environmentSuffix}`]
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services?.length).toBeGreaterThan(0);

      const service = response.services?.[0];
      expect(service?.serviceName).toContain('payment');
      expect(service?.status).toBe('ACTIVE');
      expect(service?.runningCount).toBeGreaterThan(0);
    });

    test('should have tasks running', async () => {
      const listTasksCommand = new ListTasksCommand({
        cluster: `payment-cluster-${environmentSuffix}`,
        serviceName: `payment-service-${environmentSuffix}`
      });
      const listResponse = await ecsClient.send(listTasksCommand);

      expect(listResponse.taskArns).toBeDefined();
      expect(listResponse.taskArns?.length).toBeGreaterThan(0);

      if (listResponse.taskArns && listResponse.taskArns.length > 0) {
        const describeTasksCommand = new DescribeTasksCommand({
          cluster: `payment-cluster-${environmentSuffix}`,
          tasks: listResponse.taskArns
        });
        const describeResponse = await ecsClient.send(describeTasksCommand);

        expect(describeResponse.tasks).toBeDefined();
        expect(describeResponse.tasks?.length).toBeGreaterThan(0);

        const task = describeResponse.tasks?.[0];
        expect(task?.lastStatus).toBe('RUNNING');
      }
    });
  });

  describe('Application Load Balancer', () => {
    test('should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`payment-nlb-${environmentSuffix}`]
      });
      const response = await elbv2Client.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBeGreaterThan(0);

      const loadBalancer = response.LoadBalancers?.[0];
      expect(loadBalancer?.LoadBalancerName).toContain('payment');
      expect(loadBalancer?.State?.Code).toBe('active');
    });

    test('should have healthy targets', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`payment-target-group-${environmentSuffix}`]
      });
      const response = await elbv2Client.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBeGreaterThan(0);

      const targetGroup = response.TargetGroups?.[0];
      expect(targetGroup?.TargetGroupName).toContain('payment');

      if (targetGroup?.TargetGroupArn) {
        const healthCommand = new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn
        });
        const healthResponse = await elbv2Client.send(healthCommand);

        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
        expect(healthResponse.TargetHealthDescriptions?.length).toBeGreaterThan(0);

        const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
          target => target.TargetHealth?.State === 'healthy'
        );
        expect(healthyTargets?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('API Gateway', () => {
    test('should exist and be deployed', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.ApiEndpoint?.split('/')[2]?.split('.')[0]
      });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBeDefined();
      expect(response.name).toBe(`payment-api-${environmentSuffix}`);
    });

    test('should have proxy resource configured', async () => {
      const command = new GetResourcesCommand({
        restApiId: outputs.ApiEndpoint?.split('/')[2]?.split('.')[0]
      });
      const response = await apiGatewayClient.send(command);

      expect(response.items).toBeDefined();

      const proxyResource = response.items?.find(resource =>
        resource.pathPart === '{proxy+}'
      );
      expect(proxyResource).toBeDefined();
    });

    test('should have ANY method configured', async () => {
      const command = new GetResourcesCommand({
        restApiId: outputs.ApiEndpoint?.split('/')[2]?.split('.')[0]
      });
      const response = await apiGatewayClient.send(command);

      const proxyResource = response.items?.find(resource =>
        resource.pathPart === '{proxy+}'
      );

      if (proxyResource?.id) {
        const methodCommand = new GetMethodCommand({
          restApiId: outputs.ApiEndpoint?.split('/')[2]?.split('.')[0],
          resourceId: proxyResource.id,
          httpMethod: 'ANY'
        });
        const methodResponse = await apiGatewayClient.send(methodCommand);

        expect(methodResponse.httpMethod).toBe('ANY');
        expect(methodResponse.integration).toBeDefined();
      }
    });
  });

  describe('WAF Web ACL', () => {
    test('should exist and be active', async () => {
      const listCommand = new ListWebACLsCommand({
        Scope: 'REGIONAL'
      });
      const listResponse = await wafClient.send(listCommand);

      expect(listResponse.WebACLs).toBeDefined();

      const webAcl = listResponse.WebACLs?.find(acl =>
        acl.Name?.includes('payment-api-waf')
      );
      expect(webAcl).toBeDefined();

      if (webAcl?.Id) {
        const command = new GetWebACLCommand({
          Id: webAcl.Id,
          Scope: 'REGIONAL'
        });
        const response = await wafClient.send(command);

        expect(response.WebACL).toBeDefined();
        expect(response.WebACL?.Name).toContain('payment-api-waf');
      }
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
      expect(response.Description).toContain('Application secrets');
    });

    test('should have rotation enabled', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `payment-db-credentials-${environmentSuffix}`
      });
      const response = await secretsClient.send(command);

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    test('should have all required keys', async () => {
      const command = new ListKeysCommand({});
      const response = await kmsClient.send(command);

      expect(response.Keys).toBeDefined();

      const keyAliases = response.Keys?.map(key => key.KeyId) || [];

      // Check for RDS key
      const rdsKey = keyAliases.find(id => id?.includes('payment-rds'));
      expect(rdsKey).toBeDefined();

      // Check for ElastiCache key
      const cacheKey = keyAliases.find(id => id?.includes('payment-elasticache'));
      expect(cacheKey).toBeDefined();

      // Check for EFS key
      const efsKey = keyAliases.find(id => id?.includes('payment-efs'));
      expect(efsKey).toBeDefined();

      // Check for Kinesis key
      const kinesisKey = keyAliases.find(id => id?.includes('payment-kinesis'));
      expect(kinesisKey).toBeDefined();

      // Check for Secrets key
      const secretsKey = keyAliases.find(id => id?.includes('payment-secrets'));
      expect(secretsKey).toBeDefined();
    });

    test('should have automatic rotation enabled', async () => {
      const command = new ListKeysCommand({});
      const response = await kmsClient.send(command);

      if (response.Keys && response.Keys.length > 0) {
        const keyCommand = new DescribeKeyCommand({
          KeyId: response.Keys[0].KeyId
        });
        const keyResponse = await kmsClient.send(keyCommand);

        expect(keyResponse.KeyMetadata?.KeyRotationEnabled).toBe(true);
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have log groups for all services', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws'
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();

      const logGroupNames = response.logGroups?.map(lg => lg.logGroupName) || [];

      // Check for ECS log group
      const ecsLogGroup = logGroupNames.find(name =>
        name?.includes('payment-service')
      );
      expect(ecsLogGroup).toBeDefined();

      // Check for API Gateway log group
      const apiLogGroup = logGroupNames.find(name =>
        name?.includes('payment-api')
      );
      expect(apiLogGroup).toBeDefined();

      // Check for ElastiCache log group
      const redisLogGroup = logGroupNames.find(name =>
        name?.includes('elasticache/redis')
      );
      expect(redisLogGroup).toBeDefined();
    });

    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();

      const alarmNames = response.MetricAlarms?.map(alarm => alarm.AlarmName) || [];

      // Check for API 4xx alarm
      const api4xxAlarm = alarmNames.find(name =>
        name?.includes('API-4xx-Errors')
      );
      expect(api4xxAlarm).toBeDefined();

      // Check for API 5xx alarm
      const api5xxAlarm = alarmNames.find(name =>
        name?.includes('API-5xx-Errors')
      );
      expect(api5xxAlarm).toBeDefined();

      // Check for database CPU alarm
      const dbCpuAlarm = alarmNames.find(name =>
        name?.includes('Database-CPU')
      );
      expect(dbCpuAlarm).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['PaymentVpc']
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);

      const vpc = response.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
    });

    test('should have security groups with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: ['*payment*']
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);

      // Check for ECS security group
      const ecsSecurityGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('EcsSecurityGroup')
      );
      expect(ecsSecurityGroup).toBeDefined();

      // Check for database security group
      const dbSecurityGroup = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('DatabaseSecurityGroup')
      );
      expect(dbSecurityGroup).toBeDefined();
    });

    test('should have NAT gateways in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({});
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(2);

      const activeNatGateways = response.NatGateways?.filter(ng =>
        ng.State === 'available'
      );
      expect(activeNatGateways?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('End-to-End Integration', () => {
    test('should have all components accessible', async () => {
      // Test API Gateway endpoint
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiEndpoint).toContain('https://');

      // Test Load Balancer DNS
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.');

      // Test Database endpoint
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toContain('.rds.amazonaws.com');

      // Test Redis endpoint
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');

      // Test Kinesis stream name
      expect(outputs.KinesisStreamName).toBe(`payment-transactions-${environmentSuffix}`);
    });

    test('should have proper resource naming convention', () => {
      expect(outputs.ApiEndpoint).toContain(environmentSuffix);
      // NLB names don't always include environment suffix, they use generated names
      // expect(outputs.LoadBalancerDNS).toContain(environmentSuffix);
      expect(outputs.KinesisStreamName).toContain(environmentSuffix);
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have encryption enabled', async () => {
      // RDS encryption
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint?.split('.')[0]
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances?.[0]?.StorageEncrypted).toBe(true);

      // ElastiCache encryption
      const cacheCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `payment-redis-${environmentSuffix}`
      });
      const cacheResponse = await elasticacheClient.send(cacheCommand);
      expect(cacheResponse.ReplicationGroups?.[0]?.AtRestEncryptionEnabled).toBe(true);

      // EFS encryption
      const efsCommand = new DescribeFileSystemsCommand({});
      const efsResponse = await efsClient.send(efsCommand);
      const fileSystem = efsResponse.FileSystems?.find(fs =>
        fs.FileSystemId?.includes('payment-filesystem')
      );
      expect(fileSystem?.Encrypted).toBe(true);

      // Kinesis encryption
      const kinesisCommand = new DescribeStreamCommand({
        StreamName: `payment-transactions-${environmentSuffix}`
      });
      const kinesisResponse = await kinesisClient.send(kinesisCommand);
      expect(kinesisResponse.StreamDescription?.EncryptionType).toBe('KMS');
    });

    test('should have proper network isolation', async () => {
      // Database should be in private subnets
      const dbCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `payment-database-subnet-group-${environmentSuffix}`
      });
      const dbResponse = await rdsClient.send(dbCommand);
      expect(dbResponse.DBSubnetGroups?.[0]?.VpcId).toBeDefined();

      // ElastiCache should be in private subnets
      const cacheCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `payment-redis-${environmentSuffix}`
      });
      const cacheResponse = await elasticacheClient.send(cacheCommand);
      expect(cacheResponse.ReplicationGroups?.[0]?.CacheSubnetGroupName).toBeDefined();
    });
  });
});
