/**
 * Integration tests for deployed Payment Processing Infrastructure
 * Uses actual stack outputs from cfn-outputs/flat-outputs.json
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
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
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

const REGION = process.env.AWS_REGION || 'us-east-2';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synthd4w8c1';

// Load outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string>;

beforeAll(() => {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found: ${outputsPath}`);
  }
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
});

describe('Payment Processing Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    const ec2Client = new EC2Client({ region: REGION });

    it('should have VPC with correct CIDR', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      }));
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    it('should have 6 subnets across 3 AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      }));
      expect(response.Subnets).toHaveLength(6);
    }, 30000);

    it('should have 3 NAT Gateways for HA', async () => {
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      }));
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('S3 Storage', () => {
    const s3Client = new S3Client({ region: REGION });

    it('should have flow logs bucket accessible', async () => {
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: outputs.flowLogsBucketName,
      }))).resolves.not.toThrow();
    }, 30000);

    it('should have versioning enabled', async () => {
      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: outputs.flowLogsBucketName,
      }));
      expect(response.Status).toBe('Enabled');
    }, 30000);

    it('should have encryption enabled', async () => {
      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: outputs.flowLogsBucketName,
      }));
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);
  });

  describe('RDS Aurora', () => {
    const rdsClient = new RDSClient({ region: REGION });

    it('should have Aurora cluster available', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `payment-aurora-${ENVIRONMENT_SUFFIX}`,
      }));
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters![0].Status).toBe('available');
    }, 30000);

    it('should have encryption enabled', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `payment-aurora-${ENVIRONMENT_SUFFIX}`,
      }));
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    }, 30000);

    it('should have 35-day backup retention', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `payment-aurora-${ENVIRONMENT_SUFFIX}`,
      }));
      expect(response.DBClusters![0].BackupRetentionPeriod).toBe(35);
    }, 30000);
  });

  describe('ECS Fargate', () => {
    const ecsClient = new ECSClient({ region: REGION });

    it('should have ECS cluster active', async () => {
      const response = await ecsClient.send(new DescribeClustersCommand({
        clusters: [`payment-cluster-${ENVIRONMENT_SUFFIX}`],
      }));
      expect(response.clusters![0].status).toBe('ACTIVE');
    }, 30000);

    it('should have service running with 2 tasks', async () => {
      const response = await ecsClient.send(new DescribeServicesCommand({
        cluster: `payment-cluster-${ENVIRONMENT_SUFFIX}`,
        services: [`payment-service-${ENVIRONMENT_SUFFIX}`],
      }));
      expect(response.services![0].desiredCount).toBe(2);
      expect(response.services![0].launchType).toBe('FARGATE');
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });

    it('should have ALB active', async () => {
      const response = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: [`payment-alb-${ENVIRONMENT_SUFFIX}`],
      }));
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].DNSName).toBe(outputs.albDnsName);
    }, 30000);

    it('should have target group configured', async () => {
      const response = await elbClient.send(new DescribeTargetGroupsCommand({
        Names: [`payment-tg-${ENVIRONMENT_SUFFIX}`],
      }));
      expect(response.TargetGroups![0].Port).toBe(8080);
      expect(response.TargetGroups![0].TargetType).toBe('ip');
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    const cwLogsClient = new CloudWatchLogsClient({ region: REGION });

    it('should have ECS log group with 7-year retention', async () => {
      const response = await cwLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/payment-processor-${ENVIRONMENT_SUFFIX}`,
      }));
      expect(response.logGroups![0].retentionInDays).toBe(2557);
    }, 30000);

    it('should have RDS log group with 7-year retention', async () => {
      const response = await cwLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/rds/cluster/payment-aurora-${ENVIRONMENT_SUFFIX}`,
      }));
      expect(response.logGroups![0].retentionInDays).toBe(2557);
    }, 30000);
  });

  describe('Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.rdsClusterEndpoint).toBeDefined();
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
    });

    it('should have environment suffix in resource names', () => {
      expect(outputs.flowLogsBucketName).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.albDnsName).toContain(ENVIRONMENT_SUFFIX);
    });
  });
});
