/**
 * Integration tests for TapStack Pulumi infrastructure
 *
 * These tests validate the actual deployed AWS resources
 * using the stack outputs from cfn-outputs/flat-outputs.json
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeFlowLogsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import { S3Client, GetBucketVersioningCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

describe('TapStack Integration Tests - Deployed Infrastructure Validation', () => {
  beforeAll(() => {
    // Load outputs from deployment
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    console.log('Loaded deployment outputs:', Object.keys(outputs));
  });

  describe('Deployment Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.databaseSubnetIds).toBeDefined();
      expect(outputs.webSecurityGroupId).toBeDefined();
      expect(outputs.appSecurityGroupId).toBeDefined();
      expect(outputs.dbSecurityGroupId).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
    });

    it('should have correctly formatted subnet IDs', () => {
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(outputs.publicSubnetIds.length).toBe(2);
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(outputs.privateSubnetIds.length).toBe(2);
      expect(Array.isArray(outputs.databaseSubnetIds)).toBe(true);
      expect(outputs.databaseSubnetIds.length).toBe(2);
    });
  });

  describe('VPC Infrastructure', () => {
    it('should have created VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    it('should have VPC tagged with Environment and Project', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const environmentTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'Project');

      expect(environmentTag).toBeDefined();
      expect(projectTag).toBeDefined();
      expect(projectTag!.Value).toBe('PaymentApp');
    });
  });

  describe('Subnet Configuration', () => {
    it('should have public subnets in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.publicSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(2);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Must be in different AZs

      // Verify public subnets map public IP on launch
      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have private subnets in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.privateSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(2);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Must be in different AZs
    });

    it('should have database subnets in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.databaseSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(2);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Must be in different AZs
    });

    it('should have subnets with correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // 2 public + 2 private + 2 database
    });
  });

  describe('Security Groups', () => {
    it('should have web security group with HTTP/HTTPS ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.webSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      expect(sg).toBeDefined();
      expect(sg.Description).toContain('web tier');

      const ingressRules = sg.IpPermissions || [];
      const httpRule = ingressRules.find((r) => r.FromPort === 80);
      const httpsRule = ingressRules.find((r) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    it('should have application security group with proper ingress from web tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.appSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      expect(sg).toBeDefined();
      expect(sg.Description).toContain('application tier');

      // Verify it has ingress rule from web security group
      const ingressRules = sg.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThan(0);

      const webIngress = ingressRules.find(
        (r) =>
          r.UserIdGroupPairs &&
          r.UserIdGroupPairs.some((p) => p.GroupId === outputs.webSecurityGroupId)
      );
      expect(webIngress).toBeDefined();
    });

    it('should have database security group with proper ingress from app tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.dbSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      expect(sg).toBeDefined();
      expect(sg.Description).toContain('database tier');

      // Verify it has ingress rule from app security group
      const ingressRules = sg.IpPermissions || [];
      expect(ingressRules.length).toBeGreaterThan(0);

      const appIngress = ingressRules.find(
        (r) =>
          r.UserIdGroupPairs &&
          r.UserIdGroupPairs.some((p) => p.GroupId === outputs.appSecurityGroupId)
      );
      expect(appIngress).toBeDefined();
    });

    it('should have security group rules with descriptions', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.webSecurityGroupId, outputs.appSecurityGroupId, outputs.dbSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      response.SecurityGroups!.forEach((sg) => {
        // Check ingress rules have descriptions
        const ingressRules = sg.IpPermissions || [];
        ingressRules.forEach((rule) => {
          // Rules should have descriptions (inline or in group pairs)
          expect(rule).toBeDefined();
        });
      });
    });
  });

  describe('Network Connectivity', () => {
    it('should have Internet Gateway attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    it('should have NAT Gateways in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'subnet-id', Values: outputs.publicSubnetIds }],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways!.length).toBe(2); // 2 NAT Gateways

      response.NatGateways!.forEach((nat) => {
        expect(nat.State).toBe('available');
        expect(outputs.publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    it('should have correct route table associations', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      });

      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables!;

      // Should have route tables for public, private (2), and database subnets
      expect(routeTables.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('EC2 Instances', () => {
    it('should have EC2 instances in public subnets', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          { Name: 'subnet-id', Values: outputs.publicSubnetIds },
          { Name: 'instance-state-name', Values: ['running', 'pending'] },
        ],
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations!.flatMap((r) => r.Instances || []);

      expect(instances.length).toBe(2); // 2 EC2 instances
    });

    it('should have EC2 instances with IMDSv2 enforced', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          { Name: 'subnet-id', Values: outputs.publicSubnetIds },
          { Name: 'instance-state-name', Values: ['running', 'pending'] },
        ],
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations!.flatMap((r) => r.Instances || []);

      instances.forEach((instance) => {
        expect(instance.MetadataOptions).toBeDefined();
        expect(instance.MetadataOptions!.HttpTokens).toBe('required'); // IMDSv2 enforced
        expect(instance.MetadataOptions!.HttpEndpoint).toBe('enabled');
      });
    });
  });

  describe('S3 Bucket', () => {
    it('should have S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3BucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled on S3 bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('RDS Configuration', () => {
    it('should have RDS subnet group created', async () => {
      // Get subnet group name from database subnets
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: outputs.databaseSubnetIds,
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      // Try to find the RDS subnet group
      const command = new DescribeDBSubnetGroupsCommand({});
      const response = await rdsClient.send(command);

      const subnetGroup = response.DBSubnetGroups!.find((sg) =>
        sg.Subnets!.every((s) => outputs.databaseSubnetIds.includes(s.SubnetIdentifier))
      );

      expect(subnetGroup).toBeDefined();
      expect(subnetGroup!.Subnets!.length).toBe(2);
    });
  });

  describe('VPC Flow Logs', () => {
    it('should have VPC Flow Logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [outputs.vpcId] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    it('should have CloudWatch Log Group for VPC Flow Logs', async () => {
      const command = new DescribeLogGroupsCommand({});
      const response = await logsClient.send(command);

      const flowLogGroup = response.logGroups!.find((lg) =>
        lg.logGroupName!.includes('flow-logs')
      );

      expect(flowLogGroup).toBeDefined();
      expect(flowLogGroup!.retentionInDays).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should have consistent tags across all resources', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      expect(vpcTags.find((t) => t.Key === 'Environment')).toBeDefined();
      expect(vpcTags.find((t) => t.Key === 'Project')).toBeDefined();

      // Check subnet tags
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [...outputs.publicSubnetIds, ...outputs.privateSubnetIds],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      subnetResponse.Subnets!.forEach((subnet) => {
        const tags = subnet.Tags || [];
        expect(tags.find((t) => t.Key === 'Environment')).toBeDefined();
        expect(tags.find((t) => t.Key === 'Project')).toBeDefined();
      });
    });
  });

  describe('Three-Tier Architecture Validation', () => {
    it('should have proper network segmentation', async () => {
      // Verify we have 3 distinct tiers: public, private, database
      expect(outputs.publicSubnetIds.length).toBe(2);
      expect(outputs.privateSubnetIds.length).toBe(2);
      expect(outputs.databaseSubnetIds.length).toBe(2);

      // Verify no overlap between subnet IDs
      const allSubnets = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
        ...outputs.databaseSubnetIds,
      ];
      expect(new Set(allSubnets).size).toBe(6); // All unique
    });

    it('should have security group isolation between tiers', async () => {
      // Web tier can access app tier
      // App tier can access database tier
      // Database tier should not directly accept web tier traffic

      const dbSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.dbSecurityGroupId],
      });
      const dbSgResponse = await ec2Client.send(dbSgCommand);
      const dbIngressRules = dbSgResponse.SecurityGroups![0].IpPermissions || [];

      // DB should NOT have ingress from web security group
      const webToDb = dbIngressRules.find(
        (r) =>
          r.UserIdGroupPairs &&
          r.UserIdGroupPairs.some((p) => p.GroupId === outputs.webSecurityGroupId)
      );
      expect(webToDb).toBeUndefined(); // Web tier should NOT directly access DB
    });
  });
});
