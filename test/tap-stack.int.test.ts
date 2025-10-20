import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EFSClient,
  DescribeFileSystemsCommand,
  DescribeMountTargetsCommand,
} from '@aws-sdk/client-efs';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  WAFV2Client,
  GetWebACLCommand,
  ListWebACLsCommand,
} from '@aws-sdk/client-wafv2';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'eu-central-1';

const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const efsClient = new EFSClient({ region });
const elastiCacheClient = new ElastiCacheClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const wafClient = new WAFV2Client({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('HIPAA-Compliant Healthcare Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.VpcId).toBe(outputs.VPCId);
    });

    test('Should have public and private subnets across multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(4);

      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateway should be active', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      expect(natGateways.length).toBeGreaterThan(0);
      expect(natGateways[0].State).toBe('available');
    });
  });

  describe('ECS Fargate Cluster', () => {
    test('ECS cluster should be active with container insights', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);
      const cluster = response.clusters?.[0];

      expect(cluster).toBeDefined();
      expect(cluster?.status).toBe('ACTIVE');
      expect(cluster?.clusterName).toContain('healthcare-cluster');

      const containerInsightsSetting = cluster?.settings?.find(
        s => s.name === 'containerInsights'
      );
      expect(containerInsightsSetting?.value).toBe('enabled');
    });

    test('ECS service should be running with desired count', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service).toBeDefined();
      expect(service?.status).toBe('ACTIVE');
      expect(service?.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service?.launchType).toBe('FARGATE');
    });

    test('ECS task definition should mount EFS with encryption', async () => {
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services?.[0]?.taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const taskDefResponse = await ecsClient.send(taskDefCommand);
      const taskDef = taskDefResponse.taskDefinition;

      expect(taskDef).toBeDefined();
      expect(taskDef?.volumes).toBeDefined();
      expect(taskDef?.volumes?.length).toBeGreaterThan(0);

      const efsVolume = taskDef?.volumes?.find(v => v.efsVolumeConfiguration);
      expect(efsVolume).toBeDefined();
      expect(efsVolume?.efsVolumeConfiguration?.transitEncryption).toBe('ENABLED');
    });

    test('ECS service should be in private subnets', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      const assignPublicIp = service?.networkConfiguration?.awsvpcConfiguration?.assignPublicIp;
      expect(assignPublicIp).toBe('DISABLED');
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('Aurora cluster should be available and encrypted', async () => {
      const clusterCommand = new DescribeDBClustersCommand({});
      const clusterResponse = await rdsClient.send(clusterCommand);

      const cluster = clusterResponse.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.Engine).toBe('aurora-mysql');
    });

    test('Aurora should have backup retention and CloudWatch logs', async () => {
      const clusterCommand = new DescribeDBClustersCommand({});
      const clusterResponse = await rdsClient.send(clusterCommand);

      const cluster = clusterResponse.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(cluster?.EnabledCloudwatchLogsExports).toContain('audit');
      expect(cluster?.EnabledCloudwatchLogsExports).toContain('error');
    });

    test('Aurora instance should not be publicly accessible', async () => {
      const instanceCommand = new DescribeDBInstancesCommand({});
      const instanceResponse = await rdsClient.send(instanceCommand);

      const instance = instanceResponse.DBInstances?.find(i =>
        i.DBClusterIdentifier?.includes('healthcare-aurora')
      );

      expect(instance).toBeDefined();
      expect(instance?.PubliclyAccessible).toBe(false);
      expect(instance?.DBSubnetGroup?.VpcId).toBe(outputs.VPCId);
    });
  });

  describe('EFS File System', () => {
    test('EFS should be encrypted and available', async () => {
      const command = new DescribeFileSystemsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const response = await efsClient.send(command);
      const fileSystem = response.FileSystems?.[0];

      expect(fileSystem).toBeDefined();
      expect(fileSystem?.LifeCycleState).toBe('available');
      expect(fileSystem?.Encrypted).toBe(true);
      expect(fileSystem?.KmsKeyId).toBeDefined();
    });

    test('EFS should have mount targets in multiple AZs', async () => {
      const command = new DescribeMountTargetsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const response = await efsClient.send(command);
      const mountTargets = response.MountTargets || [];

      expect(mountTargets.length).toBeGreaterThanOrEqual(2);

      const availabilityZones = new Set(mountTargets.map(mt => mt.AvailabilityZoneName));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);

      mountTargets.forEach(mt => {
        expect(mt.LifeCycleState).toBe('available');
      });
    });
  });

  describe('ElastiCache Redis', () => {
    test('Redis replication group should be available with Multi-AZ', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elastiCacheClient.send(command);

      const replicationGroup = response.ReplicationGroups?.find(rg =>
        rg.ConfigurationEndpoint?.Address === outputs.RedisEndpoint ||
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.RedisEndpoint
      );

      expect(replicationGroup).toBeDefined();
      expect(replicationGroup?.Status).toBe('available');
      expect(replicationGroup?.MultiAZ).toBe('enabled');
      expect(replicationGroup?.AutomaticFailover).toBe('enabled');
    });

    test('Redis should have encryption enabled', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elastiCacheClient.send(command);

      const replicationGroup = response.ReplicationGroups?.find(rg =>
        rg.ConfigurationEndpoint?.Address === outputs.RedisEndpoint ||
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.RedisEndpoint
      );

      expect(replicationGroup?.TransitEncryptionEnabled).toBe(true);
      expect(replicationGroup?.AtRestEncryptionEnabled).toBe(true);
    });

    test('Redis should have at least 2 cache clusters', async () => {
      const command = new DescribeReplicationGroupsCommand({});
      const response = await elastiCacheClient.send(command);

      const replicationGroup = response.ReplicationGroups?.find(rg =>
        rg.ConfigurationEndpoint?.Address === outputs.RedisEndpoint ||
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.RedisEndpoint
      );

      expect(replicationGroup?.MemberClusters?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should be active and internet-facing', async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);
      const loadBalancer = response.LoadBalancers?.find(lb =>
        lb.DNSName === outputs.LoadBalancerDNS
      );

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer?.State?.Code).toBe('active');
      expect(loadBalancer?.Scheme).toBe('internet-facing');
      expect(loadBalancer?.VpcId).toBe(outputs.VPCId);
    });

    test('Target group should be healthy', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`healthcare-tg-${outputs.LoadBalancerDNS.split('-').slice(2, 3)[0]}`],
      });
      const response = await elbClient.send(command);
      const targetGroup = response.TargetGroups?.[0];

      expect(targetGroup).toBeDefined();
      expect(targetGroup?.TargetType).toBe('ip');
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
    }, 30000);
  });

  describe('API Gateway and WAF', () => {
    test('API Gateway should be accessible', async () => {
      const apiId = outputs.APIGatewayURL.split('//')[1].split('.')[0];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);

      expect(response.name).toContain('healthcare-api');
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API Gateway stage should have tracing and logging enabled', async () => {
      const apiId = outputs.APIGatewayURL.split('//')[1].split('.')[0];
      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);

      expect(response.tracingEnabled).toBe(true);
      expect(response.methodSettings?.['*/*']?.loggingLevel).toBe('INFO');
      expect(response.methodSettings?.['*/*']?.dataTraceEnabled).toBe(true);
      expect(response.methodSettings?.['*/*']?.metricsEnabled).toBe(true);
    });

    test('WAF Web ACL should exist and be configured', async () => {
      const listCommand = new ListWebACLsCommand({
        Scope: 'REGIONAL',
      });
      const listResponse = await wafClient.send(listCommand);
      const webACL = listResponse.WebACLs?.find(acl => acl.Id === outputs.WAFWebACLId);

      expect(webACL).toBeDefined();
      expect(webACL?.Name).toContain('healthcare-waf');

      const getCommand = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WAFWebACLId,
        Name: webACL?.Name,
      });
      const getResponse = await wafClient.send(getCommand);

      expect(getResponse.WebACL?.Rules?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('CloudWatch Logs', () => {
    test('ECS log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs/healthcare',
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.[0];

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('HIPAA Compliance Validation', () => {
    test('All data at rest should be encrypted', async () => {
      // Check RDS encryption
      const rdsCommand = new DescribeDBClustersCommand({});
      const rdsResponse = await rdsClient.send(rdsCommand);
      const cluster = rdsResponse.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );
      expect(cluster?.StorageEncrypted).toBe(true);

      // Check EFS encryption
      const efsCommand = new DescribeFileSystemsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const efsResponse = await efsClient.send(efsCommand);
      expect(efsResponse.FileSystems?.[0]?.Encrypted).toBe(true);

      // Check ElastiCache encryption
      const cacheCommand = new DescribeReplicationGroupsCommand({});
      const cacheResponse = await elastiCacheClient.send(cacheCommand);
      const replicationGroup = cacheResponse.ReplicationGroups?.find(rg =>
        rg.ConfigurationEndpoint?.Address === outputs.RedisEndpoint ||
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.RedisEndpoint
      );
      expect(replicationGroup?.AtRestEncryptionEnabled).toBe(true);
    }, 30000);

    test('All data in transit should be encrypted', async () => {
      // Check ElastiCache transit encryption
      const cacheCommand = new DescribeReplicationGroupsCommand({});
      const cacheResponse = await elastiCacheClient.send(cacheCommand);
      const replicationGroup = cacheResponse.ReplicationGroups?.find(rg =>
        rg.ConfigurationEndpoint?.Address === outputs.RedisEndpoint ||
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.RedisEndpoint
      );
      expect(replicationGroup?.TransitEncryptionEnabled).toBe(true);

      // Check ECS task EFS encryption in transit
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services?.[0]?.taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const taskDefResponse = await ecsClient.send(taskDefCommand);
      const efsVolume = taskDefResponse.taskDefinition?.volumes?.find(v => v.efsVolumeConfiguration);
      expect(efsVolume?.efsVolumeConfiguration?.transitEncryption).toBe('ENABLED');
    }, 30000);

    test('Network segmentation should be properly implemented', async () => {
      // Check that ECS is in private subnets
      const ecsCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const ecsResponse = await ecsClient.send(ecsCommand);
      const assignPublicIp = ecsResponse.services?.[0]?.networkConfiguration?.awsvpcConfiguration?.assignPublicIp;
      expect(assignPublicIp).toBe('DISABLED');

      // Check that RDS is not publicly accessible
      const rdsCommand = new DescribeDBInstancesCommand({});
      const rdsResponse = await rdsClient.send(rdsCommand);
      const instance = rdsResponse.DBInstances?.find(i =>
        i.DBClusterIdentifier?.includes('healthcare-aurora')
      );
      expect(instance?.PubliclyAccessible).toBe(false);
    }, 30000);

    test('High availability should be configured', async () => {
      // Check ElastiCache Multi-AZ
      const cacheCommand = new DescribeReplicationGroupsCommand({});
      const cacheResponse = await elastiCacheClient.send(cacheCommand);
      const replicationGroup = cacheResponse.ReplicationGroups?.find(rg =>
        rg.ConfigurationEndpoint?.Address === outputs.RedisEndpoint ||
        rg.NodeGroups?.[0]?.PrimaryEndpoint?.Address === outputs.RedisEndpoint
      );
      expect(replicationGroup?.MultiAZ).toBe('enabled');
      expect(replicationGroup?.AutomaticFailover).toBe('enabled');

      // Check EFS mount targets across multiple AZs
      const efsCommand = new DescribeMountTargetsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const efsResponse = await efsClient.send(efsCommand);
      const availabilityZones = new Set(efsResponse.MountTargets?.map(mt => mt.AvailabilityZoneName));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 30000);
  });
});
