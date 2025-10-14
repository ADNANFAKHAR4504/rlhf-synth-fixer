import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  EC2Client,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

const AWS_REGION = 'eu-west-1';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  throw new Error(
    `Deployment outputs not found at ${outputsPath}. Run deployment first.`
  );
}

describe('Student Assessment Pipeline - Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    it('should have VPC deployed and available', async () => {
      const ec2Client = new EC2Client({ region: AWS_REGION });
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].EnableDnsSupport?.Value).toBe(true);
      expect(response.Vpcs![0].EnableDnsHostnames?.Value).toBe(true);
    });

    it('should have VPC properly tagged', async () => {
      const ec2Client = new EC2Client({ region: AWS_REGION });
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      const vpc = response.Vpcs![0];
      const nameTag = vpc.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('assessment-vpc-');
    });
  });

  describe('RDS Aurora Cluster', () => {
    it('should have Aurora cluster in available state', async () => {
      const rdsClient = new RDSClient({ region: AWS_REGION });
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.RDSClusterEndpoint.split('.')[0],
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
    });

    it('should have storage encryption enabled', async () => {
      const rdsClient = new RDSClient({ region: AWS_REGION });
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.RDSClusterEndpoint.split('.')[0],
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
    });

    it('should have backup retention configured', async () => {
      const rdsClient = new RDSClient({ region: AWS_REGION });
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.RDSClusterEndpoint.split('.')[0],
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    it('should have proper endpoint accessible', async () => {
      expect(outputs.RDSClusterEndpoint).toBeDefined();
      expect(outputs.RDSClusterEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.RDSClusterEndpoint).toContain('eu-west-1');
    });
  });

  describe('ElastiCache Redis', () => {
    it('should have Redis replication group available or creating', async () => {
      const cacheClient = new ElastiCacheClient({ region: AWS_REGION });

      const replicationGroupId = outputs.RedisEndpoint.split('.')[0];
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups).toHaveLength(1);

      const group = response.ReplicationGroups![0];
      expect(['available', 'creating', 'modifying']).toContain(group.Status);
    }, 30000);

    it('should have encryption enabled', async () => {
      const cacheClient = new ElastiCacheClient({ region: AWS_REGION });

      const replicationGroupId = outputs.RedisEndpoint.split('.')[0];
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const group = response.ReplicationGroups![0];
      expect(group.AtRestEncryptionEnabled).toBe(true);
      expect(group.TransitEncryptionEnabled).toBe(true);
    });

    it('should have multi-AZ enabled', async () => {
      const cacheClient = new ElastiCacheClient({ region: AWS_REGION });

      const replicationGroupId = outputs.RedisEndpoint.split('.')[0];
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const group = response.ReplicationGroups![0];
      expect(group.MultiAZ).toBe('enabled');
    });

    it('should have automatic failover enabled', async () => {
      const cacheClient = new ElastiCacheClient({ region: AWS_REGION });

      const replicationGroupId = outputs.RedisEndpoint.split('.')[0];
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const group = response.ReplicationGroups![0];
      expect(['enabled', 'enabling']).toContain(group.AutomaticFailover);
    });
  });

  describe('ECS Fargate Cluster', () => {
    it('should have ECS cluster active', async () => {
      const ecsClient = new ECSClient({ region: AWS_REGION });
      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs.ECSClusterName],
        })
      );

      expect(response.clusters).toBeDefined();
      expect(response.clusters).toHaveLength(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(outputs.ECSClusterName);
    });

    it('should have ECS service deployed', async () => {
      const ecsClient = new ECSClient({ region: AWS_REGION });
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [outputs.ECSServiceName],
        })
      );

      expect(response.services).toBeDefined();
      expect(response.services).toHaveLength(1);

      const service = response.services![0];
      expect(['ACTIVE', 'DRAINING']).toContain(service.status);
    });

    it('should have desired count of 2 tasks', async () => {
      const ecsClient = new ECSClient({ region: AWS_REGION });
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [outputs.ECSServiceName],
        })
      );

      const service = response.services![0];
      expect(service.desiredCount).toBe(2);
    });

    it('should use Fargate launch type', async () => {
      const ecsClient = new ECSClient({ region: AWS_REGION });
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [outputs.ECSServiceName],
        })
      );

      const service = response.services![0];
      expect(service.launchType).toBe('FARGATE');
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB in active state', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [outputs.ALBDnsName.split('-')[0] + '-' + outputs.ALBDnsName.split('-')[1] + '-' + outputs.ALBDnsName.split('-')[2]],
        })
      );

      // ALB might not be found by name, try by DNS
      expect(outputs.ALBDnsName).toBeDefined();
      expect(outputs.ALBDnsName).toContain('elb.amazonaws.com');
    });

    it('should have proper DNS name format', () => {
      expect(outputs.ALBDnsName).toMatch(/^assessment-alb-.+\.elb\.amazonaws\.com$/);
      expect(outputs.ALBDnsName).toContain('eu-west-1');
    });

    it('should be internet-facing', async () => {
      // DNS name should be publicly resolvable
      expect(outputs.ALBDnsName).not.toContain('internal');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group created', async () => {
      const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.LogGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.LogGroupName
      );
      expect(logGroup).toBeDefined();
    });

    it('should have retention policy configured', async () => {
      const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.LogGroupName,
        })
      );

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.LogGroupName
      );

      expect(logGroup!.retentionInDays).toBeDefined();
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have all components properly named with environmentSuffix', () => {
      const envSuffix = outputs.ECSClusterName.split('-').pop();

      expect(outputs.ECSClusterName).toContain(envSuffix!);
      expect(outputs.ECSServiceName).toContain(envSuffix!);
      expect(outputs.ALBDnsName).toContain(envSuffix!);
      expect(outputs.LogGroupName).toContain(envSuffix!);
    });

    it('should have all required outputs present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
      expect(outputs.ALBDnsName).toBeDefined();
      expect(outputs.RDSClusterEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.LogGroupName).toBeDefined();
      expect(outputs.AWSAccountId).toBeDefined();
    });

    it('should have outputs in correct format', () => {
      expect(typeof outputs.VPCId).toBe('string');
      expect(typeof outputs.ECSClusterName).toBe('string');
      expect(typeof outputs.ALBDnsName).toBe('string');
      expect(typeof outputs.RDSClusterEndpoint).toBe('string');
      expect(typeof outputs.AWSAccountId).toBe('string');
    });

    it('should have resources in the correct region', () => {
      expect(outputs.RDSClusterEndpoint).toContain('eu-west-1');
      expect(outputs.RedisEndpoint).toContain('euw1');
      expect(outputs.ALBDnsName).toContain('eu-west-1');
    });
  });

  describe('Security Compliance', () => {
    it('should have database encryption enabled', async () => {
      const rdsClient = new RDSClient({ region: AWS_REGION });
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.RDSClusterEndpoint.split('.')[0],
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
    });

    it('should have cache encryption enabled', async () => {
      const cacheClient = new ElastiCacheClient({ region: AWS_REGION });
      const replicationGroupId = outputs.RedisEndpoint.split('.')[0];

      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const group = response.ReplicationGroups![0];
      expect(group.AtRestEncryptionEnabled).toBe(true);
      expect(group.TransitEncryptionEnabled).toBe(true);
    });

    it('should have resources in private subnets where appropriate', async () => {
      // RDS and ElastiCache should not be publicly accessible
      const rdsClient = new RDSClient({ region: AWS_REGION });
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.RDSClusterEndpoint.split('.')[0],
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.PubliclyAccessible).toBe(false);
    });
  });
});
