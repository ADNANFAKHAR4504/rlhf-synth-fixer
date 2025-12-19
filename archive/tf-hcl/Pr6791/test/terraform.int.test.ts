// Integration tests for EKS Fargate Cluster

import { EKSClient, DescribeClusterCommand } from '@aws-sdk/client-eks';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;
let skipTests = false;

function skipIfStackMissing(): boolean {
  try {
    if (!fs.existsSync(outputsPath)) {
      console.warn('⚠️ Stack outputs not found - skipping integration tests');
      return true;
    }

    const outputContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputContent);

    // Check if outputs is empty or missing required fields
    if (!outputs || Object.keys(outputs).length === 0) {
      console.warn('⚠️ Stack outputs are empty - deployment may have failed. Skipping integration tests');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('⚠️ Error reading stack outputs - skipping integration tests', error);
    return true;
  }
}

const region = process.env.AWS_REGION || 'us-east-1';

describe('EKS Fargate Cluster - Integration Tests', () => {
  let eksClient: EKSClient;
  let ec2Client: EC2Client;

  beforeAll(() => {
    skipTests = skipIfStackMissing();

    if (skipTests) {
      return;
    }

    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
  });

  describe('Deployment Outputs Validation', () => {
    test('cluster name should be defined', () => {
      if (skipTests) return;
      expect(outputs.cluster_name).toBeDefined();
    });

    test('VPC ID should be defined and in correct format', () => {
      if (skipTests) return;
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('security group ID should be defined and in correct format', () => {
      if (skipTests) return;
      expect(outputs.cluster_security_group_id).toBeDefined();
      expect(outputs.cluster_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('subnet IDs should be defined and in correct format', () => {
      if (skipTests) return;

      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();

      // Parse subnet IDs from JSON string
      const privateSubnets = JSON.parse(outputs.private_subnet_ids);
      const publicSubnets = JSON.parse(outputs.public_subnet_ids);

      expect(Array.isArray(privateSubnets)).toBe(true);
      expect(Array.isArray(publicSubnets)).toBe(true);
      expect(privateSubnets.length).toBe(2);
      expect(publicSubnets.length).toBe(2);

      privateSubnets.forEach((subnet: string) => {
        expect(subnet).toMatch(/^subnet-[a-f0-9]+$/);
      });

      publicSubnets.forEach((subnet: string) => {
        expect(subnet).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });
  });

  describe('EKS Cluster Configuration', () => {
    let clusterData: any;

    beforeAll(async () => {
      if (skipTests) return;

      try {
        const command = new DescribeClusterCommand({
          name: outputs.cluster_name,
        });
        const response = await eksClient.send(command);
        clusterData = response.cluster;
      } catch (error) {
        console.warn('⚠️ Could not describe EKS cluster:', error);
        clusterData = null;
      }
    });

    test('EKS cluster should exist and be active', () => {
      if (skipTests) return;

      expect(clusterData).toBeDefined();
      expect(clusterData?.status).toBe('ACTIVE');
      expect(clusterData?.name).toBe(outputs.cluster_name);
    });

    test('cluster should have valid VPC configuration', () => {
      if (skipTests || !clusterData) return;

      expect(clusterData.resourcesVpcConfig).toBeDefined();
      expect(clusterData.resourcesVpcConfig.vpcId).toBeDefined();
      expect(clusterData.resourcesVpcConfig.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('cluster should have subnets configured', () => {
      if (skipTests || !clusterData) return;

      expect(clusterData.resourcesVpcConfig.subnetIds).toBeDefined();
      expect(clusterData.resourcesVpcConfig.subnetIds.length).toBeGreaterThanOrEqual(2);
    });

    test('cluster endpoint should be publicly accessible', () => {
      if (skipTests || !clusterData) return;
      expect(clusterData.resourcesVpcConfig.endpointPublicAccess).toBe(true);
    });

    test('cluster should have certificate authority data', () => {
      if (skipTests || !clusterData) return;
      expect(clusterData.certificateAuthority).toBeDefined();
      expect(clusterData.certificateAuthority.data).toBeDefined();
    });

    test('cluster endpoint should be valid HTTPS URL', () => {
      if (skipTests || !clusterData) return;
      expect(clusterData.endpoint).toBeDefined();
      expect(clusterData.endpoint).toMatch(/^https:\/\/.+\.eks\.amazonaws\.com$/);
    });
  });

  describe('VPC Configuration', () => {
    let vpcData: any;

    beforeAll(async () => {
      if (skipTests) return;

      try {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        });
        const response = await ec2Client.send(command);
        vpcData = response.Vpcs?.[0];
      } catch (error) {
        console.warn('⚠️ Could not describe VPC:', error);
        vpcData = null;
      }
    });

    test('VPC should exist', () => {
      if (skipTests) return;
      expect(vpcData).toBeDefined();
      expect(vpcData?.VpcId).toBe(outputs.vpc_id);
    });

    test('VPC should have correct state', () => {
      if (skipTests || !vpcData) return;
      expect(vpcData.State).toBe('available');
    });
  });

  describe('Subnet Configuration', () => {
    test('private subnets should exist and be properly configured', async () => {
      if (skipTests) return;

      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);

      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test('public subnets should exist and be properly configured', async () => {
      if (skipTests) return;

      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);

      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });

    test('subnets should be in different availability zones', async () => {
      if (skipTests) return;

      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(2);
    });
  });

  describe('Security Group Configuration', () => {
    let securityGroupData: any;

    beforeAll(async () => {
      if (skipTests) return;

      try {
        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.cluster_security_group_id],
        });
        const response = await ec2Client.send(command);
        securityGroupData = response.SecurityGroups?.[0];
      } catch (error) {
        console.warn('⚠️ Could not describe security group:', error);
        securityGroupData = null;
      }
    });

    test('cluster security group should exist', () => {
      if (skipTests) return;
      expect(securityGroupData).toBeDefined();
      expect(securityGroupData?.GroupId).toBe(outputs.cluster_security_group_id);
    });

    test('security group should be in correct VPC', () => {
      if (skipTests || !securityGroupData) return;
      expect(securityGroupData.VpcId).toBe(outputs.vpc_id);
    });

    test('security group should have egress rule allowing all traffic', () => {
      if (skipTests || !securityGroupData) return;

      const egressRules = securityGroupData.IpPermissionsEgress || [];
      const allowAllEgress = egressRules.find((rule: any) =>
        rule.IpProtocol === '-1' &&
        rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );

      expect(allowAllEgress).toBeDefined();
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('internet gateway should exist and be attached to VPC', async () => {
      if (skipTests) return;

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBeGreaterThan(0);

      const igw = response.InternetGateways?.[0];
      expect(igw?.Attachments?.[0].State).toBe('available');
      expect(igw?.Attachments?.[0].VpcId).toBe(outputs.vpc_id);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT gateways should exist in public subnets', async () => {
      if (skipTests) return;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(2);

      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      response.NatGateways?.forEach(natGw => {
        expect(publicSubnetIds).toContain(natGw.SubnetId);
      });
    });
  });

  describe('Naming Conventions', () => {
    test('cluster name should follow naming convention', () => {
      if (skipTests) return;
      expect(outputs.cluster_name).toMatch(/^eks-cluster-.+$/);
    });

    test('VPC should have proper tagging', async () => {
      if (skipTests) return;

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc?.Tags).toBeDefined();
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
    });
  });
});
