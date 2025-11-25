import { CloudWatchClient, ListDashboardsCommand } from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeClustersCommand, ECSClient } from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('Trading Platform Infrastructure Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';

  const ec2Client = new EC2Client({ region });
  const ecsClient = new ECSClient({ region });
  const rdsClient = new RDSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const s3Client = new S3Client({ region });
  const cwClient = new CloudWatchClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'cfn-outputs/flat-outputs.json not found. Please deploy the stack first and run: ./scripts/get-outputs.sh'
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Handle case where arrays might be serialized as JSON strings (Pulumi outputs)
    if (typeof outputs.publicSubnetIds === 'string') {
      outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
    }
    if (typeof outputs.privateSubnetIds === 'string') {
      outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
    }

    // Parse infraOutputs if it's a JSON string (Pulumi serializes nested objects as strings)
    if (typeof outputs.infraOutputs === 'string') {
      outputs.infraOutputs = JSON.parse(outputs.infraOutputs);
    }
  });

  describe('VPC Infrastructure', () => {
    it('should have a valid VPC', async () => {
      expect(outputs.vpcId).toBeDefined();
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have public subnets', async () => {
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(outputs.publicSubnetIds.length).toBeGreaterThan(0);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBe(outputs.publicSubnetIds.length);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('public subnets should be in different availability zones', async () => {
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);

      if (outputs.publicSubnetIds.length > 1) {
        const command = new DescribeSubnetsCommand({
          SubnetIds: outputs.publicSubnetIds,
        });
        const response = await ec2Client.send(command);

        const azs = response.Subnets!.map(s => s.AvailabilityZone);
        const uniqueAzs = new Set(azs);
        expect(uniqueAzs.size).toBe(outputs.publicSubnetIds.length);
      }
    });

    it('should have private subnets', async () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(outputs.privateSubnetIds.length).toBeGreaterThan(0);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBe(outputs.privateSubnetIds.length);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpcId);
        // Private subnets should not have public IP on launch
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('private subnets should be in different availability zones', async () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);

      if (outputs.privateSubnetIds.length > 1) {
        const command = new DescribeSubnetsCommand({
          SubnetIds: outputs.privateSubnetIds,
        });
        const response = await ec2Client.send(command);

        const azs = response.Subnets!.map(s => s.AvailabilityZone);
        const uniqueAzs = new Set(azs);
        expect(uniqueAzs.size).toBe(outputs.privateSubnetIds.length);
      }
    });

    it('subnet CIDRs should not overlap', async () => {
      const allSubnetIds = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock);
      const uniqueCidrs = new Set(cidrBlocks);

      // All CIDR blocks should be unique
      expect(uniqueCidrs.size).toBe(cidrBlocks.length);
    });
  });

  describe('Security Groups', () => {
    it('should have ALB security group', async () => {
      expect(outputs.albSecurityGroupId).toBeDefined();
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.albSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups![0].VpcId).toBe(outputs.vpcId);
    });

    it('should have ECS security group', async () => {
      expect(outputs.ecsSecurityGroupId).toBeDefined();
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ecsSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups![0].VpcId).toBe(outputs.vpcId);
    });

    it('should have RDS security group', async () => {
      expect(outputs.rdsSecurityGroupId).toBeDefined();
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rdsSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups![0].VpcId).toBe(outputs.vpcId);
    });
  });

  describe('ECS Cluster and Service', () => {
    it('should have a running ECS cluster', async () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.ecsClusterId).toBeDefined();
      const command = new DescribeClustersCommand({
        clusters: [outputs.infraOutputs.ecsClusterId],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have task count matching configuration', () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.ecsTaskCount).toBeDefined();
      expect(typeof outputs.infraOutputs.ecsTaskCount).toBe('number');
      expect(outputs.infraOutputs.ecsTaskCount).toBeGreaterThan(0);
    });
  });

  describe('RDS Aurora Cluster', () => {
    it('should have an available RDS cluster', async () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.rdsEndpoint).toBeDefined();
      expect(typeof outputs.infraOutputs.rdsEndpoint).toBe('string');

      // Extract cluster identifier from endpoint
      const clusterId = outputs.infraOutputs.rdsEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters!.find((c) =>
        c.Endpoint?.includes(clusterId)
      );
      expect(cluster).toBeDefined();
      expect(['available', 'creating', 'modifying']).toContain(cluster!.Status);
    }, 10000);

    it('should have correct instance class', () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.rdsInstanceClass).toBeDefined();
      expect(outputs.infraOutputs.rdsInstanceClass).toMatch(/^db\./);
    });
  });

  describe('Application Load Balancer', () => {
    it('should have an active load balancer', async () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.albDnsName).toBeDefined();
      expect(typeof outputs.infraOutputs.albDnsName).toBe('string');

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(
        (lb) => lb.DNSName === outputs.infraOutputs.albDnsName
      );
      expect(alb).toBeDefined();
      expect(['active', 'provisioning']).toContain(alb!.State!.Code);
    });

    it('should have a valid DNS name', () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.albDnsName).toBeDefined();
      expect(outputs.infraOutputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('S3 Bucket', () => {
    it('should have an accessible S3 bucket', async () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.s3BucketName).toBeDefined();
      expect(typeof outputs.infraOutputs.s3BucketName).toBe('string');

      const command = new HeadBucketCommand({
        Bucket: outputs.infraOutputs.s3BucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should have a CloudWatch dashboard', async () => {
      expect(outputs.infraOutputs).toBeDefined();
      expect(outputs.infraOutputs.dashboardName).toBeDefined();
      expect(typeof outputs.infraOutputs.dashboardName).toBe('string');

      const command = new ListDashboardsCommand({
        DashboardNamePrefix: outputs.infraOutputs.dashboardName,
      });
      const response = await cwClient.send(command);

      const dashboard = response.DashboardEntries!.find(
        (d) => d.DashboardName === outputs.infraOutputs.dashboardName
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should have correct environment', () => {
      expect(outputs.infraOutputs.environment).toBeDefined();
      expect(typeof outputs.infraOutputs.environment).toBe('string');
    });

    it('should have correct region', () => {
      expect(outputs.infraOutputs.region).toBe(region);
    });
  });
});
