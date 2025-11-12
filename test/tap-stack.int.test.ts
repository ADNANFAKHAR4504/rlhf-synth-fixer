/**
 * Integration tests for deployed VPC infrastructure
 * Tests live AWS resources using actual deployment outputs
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
  DescribeNetworkAclsCommand,
} from '@aws-sdk/client-ec2';
import { S3Client, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  throw new Error(
    `Failed to load deployment outputs from ${outputsPath}: ${error}`
  );
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    it('should have a VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
    });

    it('should have correct VPC tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');
      const costCenterTag = tags.find(t => t.Key === 'CostCenter');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('payment-platform');
      expect(costCenterTag?.Value).toBe('engineering');
    });
  });

  describe('Subnet Configuration', () => {
    it('should have 3 public subnets with correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);

      // Public subnets should map public IPs
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have 3 private subnets with correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.10.0/23', '10.0.12.0/23', '10.0.14.0/23']);
    });

    it('should have 3 database subnets with correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.databaseSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.20.0/24', '10.0.21.0/24', '10.0.22.0/24']);
    });

    it('should span 3 different availability zones', async () => {
      const allSubnetIds = [
        ...outputs.publicSubnetIds,
        ...outputs.privateSubnetIds,
        ...outputs.databaseSubnetIds,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Verify each subnet type has one subnet per AZ
      const publicAzs = response.Subnets!
        .filter(s => outputs.publicSubnetIds.includes(s.SubnetId!))
        .map(s => s.AvailabilityZone);
      expect(new Set(publicAzs).size).toBe(3);
    });
  });

  describe('NAT Instance Configuration', () => {
    it('should have 3 NAT instances running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.natInstanceIds,
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      expect(instances).toHaveLength(3);

      instances.forEach(instance => {
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.State?.Name).toMatch(/running|pending/);
      });
    });

    it('should have source/destination check disabled', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.natInstanceIds,
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      instances.forEach(instance => {
        expect(instance.SourceDestCheck).toBe(false);
      });
    });

    it('should be placed in public subnets', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.natInstanceIds,
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      instances.forEach(instance => {
        expect(outputs.publicSubnetIds).toContain(instance.SubnetId);
      });
    });
  });

  describe('Security Group Configuration', () => {
    it('should have web security group with HTTP/HTTPS access', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.webSgId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      // Check HTTP ingress
      const httpRule = sg.IpPermissions!.find(
        p => p.FromPort === 80 && p.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges).toEqual(
        expect.arrayContaining([expect.objectContaining({ CidrIp: '0.0.0.0/0' })])
      );

      // Check HTTPS ingress
      const httpsRule = sg.IpPermissions!.find(
        p => p.FromPort === 443 && p.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges).toEqual(
        expect.arrayContaining([expect.objectContaining({ CidrIp: '0.0.0.0/0' })])
      );
    });

    it('should have app security group with restricted access from web tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.appSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const appRule = sg.IpPermissions!.find(
        p => p.FromPort === 8080 && p.ToPort === 8080
      );

      expect(appRule).toBeDefined();
      expect(appRule?.UserIdGroupPairs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ GroupId: outputs.webSgId }),
        ])
      );
    });

    it('should have database security group with restricted access from app tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.dbSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const dbRule = sg.IpPermissions!.find(
        p => p.FromPort === 5432 && p.ToPort === 5432
      );

      expect(dbRule).toBeDefined();
      expect(dbRule?.UserIdGroupPairs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ GroupId: outputs.appSgId }),
        ])
      );
    });
  });

  describe('Route Table Configuration', () => {
    it('should have route tables for all subnet types', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Expecting: 1 public + 3 private + 3 database = 7 route tables (excluding default)
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(7);
    });

    it('should have private subnets routing through NAT instances', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: outputs.privateSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(3);

      response.RouteTables!.forEach(rt => {
        const defaultRoute = rt.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute?.NetworkInterfaceId).toBeDefined();
      });
    });

    it('should have database subnets with no internet gateway routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: outputs.databaseSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      response.RouteTables!.forEach(rt => {
        const hasIgwRoute = rt.Routes!.some(
          r => r.GatewayId && r.GatewayId.startsWith('igw-')
        );
        const hasNatRoute = rt.Routes!.some(r => r.NetworkInterfaceId);

        expect(hasIgwRoute).toBe(false);
        expect(hasNatRoute).toBe(false);
      });
    });
  });

  describe('Network ACL Configuration', () => {
    it('should have Network ACLs configured for all subnet types', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Expecting at least 3 custom NACLs (public, private, database) + default
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(4);
    });

    it('should have ephemeral port restrictions in NACLs', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Check for ephemeral port range 32768-65535
      const hasEphemeralRules = response.NetworkAcls!.some(nacl =>
        nacl.Entries!.some(
          entry =>
            entry.PortRange &&
            entry.PortRange.From === 32768 &&
            entry.PortRange.To === 65535
        )
      );

      expect(hasEphemeralRules).toBe(true);
    });
  });

  describe('VPC Flow Logs', () => {
    it('should have VPC Flow Logs enabled', async () => {
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

      const flowLog = response.FlowLogs![0];
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.TrafficType).toBe('ALL');
    });

    it('should have S3 bucket with encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.flowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules
      ).toBeDefined();
    });

    it('should have S3 bucket with 7-day lifecycle policy', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.flowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find(
        r => r.Expiration?.Days === 7
      );
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Status).toBe('Enabled');
    });
  });

  describe('S3 VPC Endpoint', () => {
    it('should have S3 gateway endpoint attached to private route tables', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${AWS_REGION}.s3`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);

      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.RouteTableIds).toBeDefined();
      expect(endpoint.RouteTableIds!.length).toBe(3);
    });
  });

  describe('End-to-End Validation', () => {
    it('should have all resources properly tagged', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);

      const tags = vpcResponse.Vpcs![0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
    });

    it('should have all outputs defined and non-empty', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.publicSubnetIds).toHaveLength(3);
      expect(outputs.privateSubnetIds).toHaveLength(3);
      expect(outputs.databaseSubnetIds).toHaveLength(3);
      expect(outputs.natInstanceIds).toHaveLength(3);
      expect(outputs.webSgId).toBeDefined();
      expect(outputs.appSgId).toBeDefined();
      expect(outputs.dbSgId).toBeDefined();
      expect(outputs.flowLogsBucketName).toBeDefined();
    });
  });
});
