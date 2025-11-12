import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
} from '@aws-sdk/client-ecs';
import {
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    const outputsData = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsData);
  } else {
    throw new Error(`Outputs file not found at ${outputsPath}`);
  }
});

const region = 'eu-central-2';

describe('Payment Processing Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    const ec2Client = new EC2Client({ region });

    it('should have VPC created with correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have 6 subnets (3 public, 3 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(6);
    });

    it('should have VPC flow logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Cluster and Service', () => {
    const ecsClient = new ECSClient({ region });

    it('should have ECS cluster created', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecsClusterName],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have ECS service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.ecsServiceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe('ACTIVE');
    });

    it('should have desired task count of 2', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.ecsServiceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services![0].desiredCount).toBe(2);
    });
  });

  describe('RDS Aurora Cluster', () => {
    const rdsClient = new RDSClient({ region });

    it('should have RDS cluster created', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);
      expect(response.DBClusters![0].Status).toBe('available');
    });

    it('should have encryption enabled', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    it('should have multi-AZ enabled', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters![0].MultiAZ).toBe(true);
    });

    it('should have backup retention of 35 days', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters![0].BackupRetentionPeriod).toBe(35);
    });
  });

  describe('Application Load Balancer', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region });

    it('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);

      const targetGroup = response.TargetGroups!.find((tg) =>
        tg.TargetGroupName?.includes('payment')
      );

      expect(targetGroup).toBeDefined();
      expect(targetGroup!.HealthCheckEnabled).toBe(true);
    });
  });

  describe('S3 Bucket for Flow Logs', () => {
    const s3Client = new S3Client({ region });

    it('should have flow logs bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.flowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    it('should have lifecycle policy for Glacier transition', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.flowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const glacierRule = response.Rules!.find((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'GLACIER')
      );

      expect(glacierRule).toBeDefined();
      expect(glacierRule!.Transitions![0].Days).toBe(90);
    });
  });

  describe('CloudWatch Log Groups', () => {
    const cwLogsClient = new CloudWatchLogsClient({ region });

    it('should have ECS log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/payment`,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    it('should have 7-year retention (2557 days)', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/payment`,
      });
      const response = await cwLogsClient.send(command);

      const ecsLogGroup = response.logGroups!.find((lg) =>
        lg.logGroupName?.includes('/ecs/payment')
      );

      expect(ecsLogGroup).toBeDefined();
      expect(ecsLogGroup!.retentionInDays).toBe(2557);
    });

    it('should have RDS slow query log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/rds/cluster/payment-aurora`,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance and Security', () => {
    it('should have all required outputs for audit trail', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.ecsClusterName).toBeDefined();
      expect(outputs.ecsServiceName).toBeDefined();
      expect(outputs.rdsClusterEndpoint).toBeDefined();
      expect(outputs.rdsClusterReadEndpoint).toBeDefined();
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(outputs.rdsPasswordSecret).toBeDefined();
    });

    it('should have RDS password marked as secret', () => {
      expect(outputs.rdsPasswordSecret).toBe('[secret]');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include application identifier in names', () => {
      expect(outputs.ecsClusterName).toContain('payment');
      expect(outputs.ecsServiceName).toContain('payment');
      expect(outputs.flowLogsBucketName).toContain('payment');
    });
  });
});
