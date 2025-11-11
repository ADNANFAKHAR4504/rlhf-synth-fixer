/**
 * Integration Tests for Payment Processing System Migration Infrastructure (Terraform)
 *
 * These tests validate the deployed infrastructure in AWS, using actual resources
 * and verifying they work correctly together.
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  ECSClient
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ListResourceRecordSetsCommand,
  Route53Client
} from '@aws-sdk/client-route-53';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

  // Flatten Terraform output format: {key: {value: val, sensitive: bool}} -> {key: val}
  outputs = Object.keys(rawOutputs).reduce((acc: any, key: string) => {
    acc[key] = rawOutputs[key].value !== undefined ? rawOutputs[key].value : rawOutputs[key];
    return acc;
  }, {});

  // Parse JSON string outputs into proper types
  if (outputs.public_subnet_ids && typeof outputs.public_subnet_ids === 'string') {
    outputs.public_subnet_ids = JSON.parse(outputs.public_subnet_ids);
  }
  if (outputs.private_app_subnet_ids && typeof outputs.private_app_subnet_ids === 'string') {
    outputs.private_app_subnet_ids = JSON.parse(outputs.private_app_subnet_ids);
  }
  if (outputs.private_db_subnet_ids && typeof outputs.private_db_subnet_ids === 'string') {
    outputs.private_db_subnet_ids = JSON.parse(outputs.private_db_subnet_ids);
  }
  if (outputs.traffic_distribution && typeof outputs.traffic_distribution === 'string') {
    outputs.traffic_distribution = JSON.parse(outputs.traffic_distribution);
  }
}

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const s3Client = new S3Client({ region });
const route53Client = new Route53Client({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

describe('Payment Processing Migration Infrastructure - Integration Tests', () => {
  // Increase timeout for AWS API calls
  jest.setTimeout(30000);

  describe('Deployment Outputs', () => {
    test('should have deployment outputs file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'vpc_id',
        'ecs_cluster_name',
        'ecs_blue_service_name',
        'aurora_cluster_id'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC deployed and available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpc_id);
    });

    test('should have public subnets deployed', async () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(3);

      // All subnets should be in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test('should have private app subnets deployed', async () => {
      expect(outputs.private_app_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_app_subnet_ids)).toBe(true);
      expect(outputs.private_app_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_app_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have private database subnets deployed', async () => {
      expect(outputs.private_db_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_db_subnet_ids)).toBe(true);
      expect(outputs.private_db_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_db_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have NAT gateways deployed and available', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Check if NAT gateways exist (at least 1, ideally 3 for HA)
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      console.log(`Found ${response.NatGateways!.length} NAT Gateway(s)`);
    });

    test('should have security groups created', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Should have at least: default, ALB, ECS, RDS, DMS, VPC endpoints
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster deployed and active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name]
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].clusterName).toBe(outputs.ecs_cluster_name);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have DMS log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.dms_log_group
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const dmsLogGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.dms_log_group);
      expect(dmsLogGroup).toBeDefined();
      expect(dmsLogGroup!.logGroupName).toBe(outputs.dms_log_group);
    });

    test('should have ECS log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ecs_log_group
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const ecsLogGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.ecs_log_group);
      expect(ecsLogGroup).toBeDefined();
      expect(ecsLogGroup!.logGroupName).toBe(outputs.ecs_log_group);
    });
  });

  describe('Route 53 DNS', () => {
    test('should have private hosted zone created', async () => {
      expect(outputs.private_hosted_zone_name).toBe('payment.internal');
    });

    test('should have DNS records for database endpoints', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.private_hosted_zone_id
      });

      const response = await route53Client.send(command);
      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have logs backup bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.logs_backup_bucket
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have encryption enabled on logs backup bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.logs_backup_bucket
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Status and Traffic Distribution', () => {
    test('should have migration phase set', () => {
      expect(outputs.migration_phase).toBeDefined();
      expect(['preparation', 'migration', 'cutover', 'complete']).toContain(
        outputs.migration_phase
      );
    });

    test('should have traffic distribution configured', () => {
      expect(outputs.traffic_distribution).toBeDefined();
      expect(outputs.traffic_distribution.blue_weight).toBeDefined();
      expect(outputs.traffic_distribution.green_weight).toBeDefined();

      const total = outputs.traffic_distribution.blue_weight +
        outputs.traffic_distribution.green_weight;
      expect(total).toBe(100);
    });
  });
});
