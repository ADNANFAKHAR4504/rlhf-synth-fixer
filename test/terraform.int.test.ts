// Integration tests for Hub-and-Spoke Network Architecture
// Tests actual AWS resources that have been deployed

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';

// Load Terraform outputs
const outputsPath = path.join(__dirname, '../tf-outputs/flat-outputs.json');
let outputs: any;

try {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  // Parse JSON strings for spoke resources
  outputs = {
    ...rawOutputs,
    spoke_vpc_ids: typeof rawOutputs.spoke_vpc_ids === 'string' 
      ? JSON.parse(rawOutputs.spoke_vpc_ids) 
      : rawOutputs.spoke_vpc_ids,
    spoke_vpc_cidrs: typeof rawOutputs.spoke_vpc_cidrs === 'string' 
      ? JSON.parse(rawOutputs.spoke_vpc_cidrs) 
      : rawOutputs.spoke_vpc_cidrs,
    spoke_security_group_ids: typeof rawOutputs.spoke_security_group_ids === 'string' 
      ? JSON.parse(rawOutputs.spoke_security_group_ids) 
      : rawOutputs.spoke_security_group_ids,
  };
} catch (error) {
  console.error('Failed to load Terraform outputs:', error);
  throw new Error(`Cannot load outputs from ${outputsPath}`);
}

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Hub-and-Spoke Network Architecture - Integration Tests', () => {
  describe('Hub VPC', () => {
    test('Hub VPC exists and has correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.hub_vpc_id],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe(outputs.hub_vpc_cidr);
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('Hub VPC has public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.hub_vpc_id],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private

      const subnets = response.Subnets!;
      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });

    test('Hub VPC has NAT Gateway', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'nat-gateway-id',
            Values: [outputs.nat_gateway_id],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(1);

      const natGw = response.NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.VpcId).toBe(outputs.hub_vpc_id);

      // NAT Gateway should have an Elastic IP
      expect(natGw.NatGatewayAddresses).toBeDefined();
      expect(natGw.NatGatewayAddresses?.length).toBeGreaterThan(0);
      const publicIp = natGw.NatGatewayAddresses![0].PublicIp;
      expect(publicIp).toBe(outputs.nat_gateway_public_ip);
    });

    test('Hub VPC has Internet Gateway', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.hub_vpc_id],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments?.length).toBe(1);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Spoke VPCs', () => {
    test('All spoke VPCs exist and are available', async () => {
      const spokeVpcIds = [
        outputs.spoke_vpc_ids.development,
        outputs.spoke_vpc_ids.production,
        outputs.spoke_vpc_ids.staging,
      ];

      const command = new DescribeVpcsCommand({
        VpcIds: spokeVpcIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(3);

      response.Vpcs!.forEach(vpc => {
        expect(vpc.State).toBe('available');
        expect(vpc.EnableDnsHostnames).toBe(true);
        expect(vpc.EnableDnsSupport).toBe(true);
      });

      // Verify CIDR blocks match
      const vpcCidrMap = new Map(response.Vpcs!.map(v => [v.VpcId, v.CidrBlock]));
      expect(vpcCidrMap.get(outputs.spoke_vpc_ids.development)).toBe(outputs.spoke_vpc_cidrs.development);
      expect(vpcCidrMap.get(outputs.spoke_vpc_ids.production)).toBe(outputs.spoke_vpc_cidrs.production);
      expect(vpcCidrMap.get(outputs.spoke_vpc_ids.staging)).toBe(outputs.spoke_vpc_cidrs.staging);
    });

    test('Spoke VPCs have private subnets', async () => {
      for (const [env, vpcId] of Object.entries(outputs.spoke_vpc_ids)) {
        const command = new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId as string],
            },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.Subnets).toBeDefined();
        expect(response.Subnets?.length).toBeGreaterThanOrEqual(2); // At least 2 AZs

        response.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe('available');
        });
      }
    });

    test('Spoke VPCs do not have Internet Gateways', async () => {
      for (const vpcId of Object.values(outputs.spoke_vpc_ids)) {
        const command = new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId as string],
            },
          ],
        });

        const response = await ec2Client.send(command);
        // Spoke VPCs should NOT have direct internet gateways
        expect(response.InternetGateways?.length || 0).toBe(0);
      }
    });
  });

  describe('Security Groups', () => {
    test('Hub security group exists and is properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.hub_security_group_id],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.hub_vpc_id);

      // Should have ingress rules from spoke VPCs
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions?.length).toBeGreaterThan(0);

      // Should have egress rules
      expect(sg.IpPermissionsEgress).toBeDefined();
      expect(sg.IpPermissionsEgress?.length).toBeGreaterThan(0);
    });

    test('Spoke security groups exist for all environments', async () => {
      const sgIds = Object.values(outputs.spoke_security_group_ids);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds as string[],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(3);

      // Map security groups to their VPCs
      const sgVpcMap = new Map(response.SecurityGroups!.map(sg => [sg.GroupId, sg.VpcId]));

      expect(sgVpcMap.get(outputs.spoke_security_group_ids.development)).toBe(outputs.spoke_vpc_ids.development);
      expect(sgVpcMap.get(outputs.spoke_security_group_ids.production)).toBe(outputs.spoke_vpc_ids.production);
      expect(sgVpcMap.get(outputs.spoke_security_group_ids.staging)).toBe(outputs.spoke_vpc_ids.staging);
    });
  });

  describe('Network ACLs', () => {
    test('Hub network ACL exists and has rules', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.hub_vpc_id],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NetworkAcls).toBeDefined();
      expect(response.NetworkAcls?.length).toBeGreaterThan(0);

      // At least one NACL should have both ingress and egress rules
      const hasIngressAndEgress = response.NetworkAcls!.some(nacl => {
        const hasIngress = nacl.Entries?.some(e => !e.Egress) || false;
        const hasEgress = nacl.Entries?.some(e => e.Egress) || false;
        return hasIngress && hasEgress;
      });

      expect(hasIngressAndEgress).toBe(true);
    });

    test('Spoke network ACLs exist for all VPCs', async () => {
      for (const [env, vpcId] of Object.entries(outputs.spoke_vpc_ids)) {
        const command = new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId as string],
            },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.NetworkAcls).toBeDefined();
        expect(response.NetworkAcls?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Routing', () => {
    test('Hub has route tables for public and private subnets', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.hub_vpc_id],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables?.length).toBeGreaterThanOrEqual(2);

      // Check for routes to IGW and NAT Gateway
      const routeTables = response.RouteTables!;
      const hasIgwRoute = routeTables.some(rt =>
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-'))
      );
      const hasNatRoute = routeTables.some(rt =>
        rt.Routes?.some(r => r.NatGatewayId === outputs.nat_gateway_id)
      );

      expect(hasIgwRoute).toBe(true);
      expect(hasNatRoute).toBe(true);
    });

    test('Spoke VPCs have route tables configured', async () => {
      for (const [env, vpcId] of Object.entries(outputs.spoke_vpc_ids)) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId as string],
            },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.RouteTables).toBeDefined();
        expect(response.RouteTables?.length).toBeGreaterThan(0);

        // Verify route tables exist and are configured
        response.RouteTables!.forEach(rt => {
          expect(rt.Routes).toBeDefined();
          expect(rt.Routes?.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
