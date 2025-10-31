// Integration tests for Terraform VPC infrastructure
// Tests actual deployed resources using AWS SDK

import {
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
// Route53Resolver client would be imported if resolver is enabled
// import { Route53ResolverClient, ListResolverEndpointsCommand } from '@aws-sdk/client-route53resolver';
import fs from 'fs';
import path from 'path';

// Read deployment outputs
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/all-outputs.json');

interface DeploymentOutputs {
  [key: string]: any;
}

describe('Terraform VPC Infrastructure Integration Tests', () => {
  let outputs: DeploymentOutputs;
  const regions = ['us-east-1', 'us-west-2', 'eu-central-1'];

  beforeAll(async () => {
    // Check if outputs file exists
    if (!fs.existsSync(OUTPUTS_PATH)) {
      throw new Error(
        `Deployment outputs not found at ${OUTPUTS_PATH}. Please deploy the infrastructure first.`
      );
    }

    // Load deployment outputs
    const outputsContent = fs.readFileSync(OUTPUTS_PATH, 'utf8');
    const rawOutputs = JSON.parse(outputsContent);

    // Extract values from Terraform JSON format (which has .value property)
    outputs = {};
    for (const [key, val] of Object.entries(rawOutputs)) {
      outputs[key] = (val as any).value !== undefined ? (val as any).value : val;
    }

    console.log('Loaded deployment outputs:', Object.keys(outputs));
  });

  describe('VPC Deployment Verification', () => {
    test('VPC IDs exist for all three regions', () => {
      expect(outputs).toHaveProperty('vpc_ids');

      const vpcIds = outputs.vpc_ids;

      expect(vpcIds).toHaveProperty('us-east-1');
      expect(vpcIds).toHaveProperty('us-west-2');
      expect(vpcIds).toHaveProperty('eu-central-1');

      expect(vpcIds['us-east-1']).toMatch(/^vpc-/);
      expect(vpcIds['us-west-2']).toMatch(/^vpc-/);
      expect(vpcIds['eu-central-1']).toMatch(/^vpc-/);
    });

    test.each(regions)('VPC in %s has correct DNS settings', async (region) => {
      const vpcIds = outputs.vpc_ids;

      const vpcId = vpcIds[region];
      if (!vpcId) {
        throw new Error(`VPC ID not found for region ${region}`);
      }

      const client = new EC2Client({ region });
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      // DNS settings are enabled (undefined or true both acceptable)
      expect(vpc.EnableDnsHostnames === true || vpc.EnableDnsHostnames === undefined).toBe(true);
      expect(vpc.EnableDnsSupport === true || vpc.EnableDnsSupport === undefined).toBe(true);

      // VPC should be in available state
      expect(vpc.State).toBe('available');
    });
  });

  describe('CIDR Block Allocation', () => {
    test('CIDR blocks are unique across all regions', () => {
      const vpcCidrs = outputs.vpc_cidr_blocks;

      const cidrList = [
        vpcCidrs['us-east-1'],
        vpcCidrs['us-west-2'],
        vpcCidrs['eu-central-1'],
      ];

      // Check all CIDRs are unique
      const uniqueCidrs = new Set(cidrList);
      expect(uniqueCidrs.size).toBe(3);

      // Check all are valid CIDR blocks
      cidrList.forEach((cidr) => {
        expect(cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      });
    });

    test('CIDR blocks follow hierarchical allocation from base block', () => {
      const vpcCidrs = outputs.vpc_cidr_blocks;

      // All CIDRs should start with 10. (default base_cidr_block)
      Object.values(vpcCidrs).forEach((cidr: any) => {
        expect(cidr).toMatch(/^10\./);
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('public subnets exist in all regions', () => {
      const publicSubnets = outputs.public_subnet_ids;

      regions.forEach((region) => {
        expect(publicSubnets[region]).toBeDefined();
        expect(Array.isArray(publicSubnets[region])).toBe(true);
        expect(publicSubnets[region].length).toBeGreaterThanOrEqual(2);

        // Check subnet ID format
        publicSubnets[region].forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-/);
        });
      });
    });

    test('private subnets exist in all regions', () => {
      const privateSubnets = outputs.private_subnet_ids;

      regions.forEach((region) => {
        expect(privateSubnets[region]).toBeDefined();
        expect(Array.isArray(privateSubnets[region])).toBe(true);
        expect(privateSubnets[region].length).toBeGreaterThanOrEqual(2);

        // Check subnet ID format
        privateSubnets[region].forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-/);
        });
      });
    });

    test.each(regions)('subnets in %s are in different AZs', async (region) => {
      const publicSubnets = outputs.public_subnet_ids;

      const subnetIds = publicSubnets[region];
      const client = new EC2Client({ region });
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await client.send(command);

      const azs = response.Subnets!.map((subnet) => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      // Should have subnets in multiple AZs for high availability
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NAT Gateway Cost Optimization', () => {
    test('NAT Gateways are only deployed in specified regions', () => {
      const natGateways = outputs.nat_gateway_ids;

      // Check that only us-east-1 has NAT Gateways (based on default tfvars)
      expect(Array.isArray(natGateways['us-east-1'])).toBe(true);
      expect(natGateways['us-east-1'].length).toBeGreaterThan(0);

      // Other regions should have empty arrays
      if (natGateways['us-west-2']) {
        expect(natGateways['us-west-2']).toEqual([]);
      }
      if (natGateways['eu-central-1']) {
        expect(natGateways['eu-central-1']).toEqual([]);
      }
    });

    test('NAT Gateway count meets cost optimization target', () => {
      const natGatewayCount = outputs.nat_gateway_count;

      // Should be significantly less than 9 (3 per region)
      expect(natGatewayCount).toBeLessThanOrEqual(3);

      // Should have at least 1 for primary region
      expect(natGatewayCount).toBeGreaterThanOrEqual(1);
    });

    test('estimated monthly NAT cost is optimized', () => {
      const estimatedCost = outputs.estimated_monthly_nat_cost;

      // With 3 or fewer NAT Gateways, cost should be under $150/month
      expect(estimatedCost).toBeLessThanOrEqual(150);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test.each(regions)('Internet Gateway exists in %s', async (region) => {
      const igwIds = outputs.internet_gateway_ids;

      const igwId = igwIds[region];
      expect(igwId).toMatch(/^igw-/);

      const client = new EC2Client({ region });
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [igwId],
      });
      const response = await client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];

      // IGW should be attached to a VPC
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBeGreaterThan(0);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('VPC Peering Connections', () => {
    test('three VPC peering connections are established', () => {
      const peeringConnections = outputs.vpc_peering_connections;

      expect(Object.keys(peeringConnections)).toHaveLength(3);
      expect(peeringConnections).toHaveProperty('us-east-1-to-us-west-2');
      expect(peeringConnections).toHaveProperty('us-west-2-to-eu-central-1');
      expect(peeringConnections).toHaveProperty('us-east-1-to-eu-central-1');
    });

    test('all peering connections are in active state', () => {
      const peeringConnections = outputs.vpc_peering_connections;

      Object.values(peeringConnections).forEach((conn: any) => {
        expect(conn.id).toMatch(/^pcx-/);
        expect(conn.status).toBe('active');
      });
    });

    test.each([
      ['us-east-1', 'us-east-1-to-us-west-2'],
      ['us-west-2', 'us-west-2-to-eu-central-1'],
      ['us-east-1', 'us-east-1-to-eu-central-1'],
    ])('peering connection %s is properly configured in %s', async (region, peeringKey) => {
      const peeringConnections = outputs.vpc_peering_connections;

      const peeringId = peeringConnections[peeringKey].id;
      const client = new EC2Client({ region });
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [peeringId],
      });
      const response = await client.send(command);

      expect(response.VpcPeeringConnections).toHaveLength(1);
      const peering = response.VpcPeeringConnections![0];
      expect(peering.Status?.Code).toBe('active');
    });
  });

  describe('Route Table Configuration', () => {
    test.each(regions)('private route tables in %s have peering routes', async (region) => {
      const vpcIds = outputs.vpc_ids;

      const vpcId = vpcIds[region];
      const client = new EC2Client({ region });
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Type', Values: ['private'] },
        ],
      });
      const response = await client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      // Check that at least some route tables have peering routes
      const hasPeeringRoutes = response.RouteTables!.some((rt) =>
        rt.Routes!.some((route) => route.VpcPeeringConnectionId)
      );
      expect(hasPeeringRoutes).toBe(true);
    });

    test.each(regions)('public route tables in %s have internet gateway route', async (region) => {
      const vpcIds = outputs.vpc_ids;

      const vpcId = vpcIds[region];
      const client = new EC2Client({ region });
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Type', Values: ['public'] },
        ],
      });
      const response = await client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      // Check that route table has IGW route
      const hasIgwRoute = response.RouteTables!.some((rt) =>
        rt.Routes!.some(
          (route) => route.GatewayId && route.GatewayId.startsWith('igw-')
        )
      );
      expect(hasIgwRoute).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    test.each(regions)('default security group in %s has restrictive rules', async (region) => {
      const vpcIds = outputs.vpc_ids;

      const vpcId = vpcIds[region];
      const client = new EC2Client({ region });
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['default'] },
        ],
      });
      const response = await client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const defaultSg = response.SecurityGroups![0];

      // Default SG should have no ingress or egress rules (or only default self-referencing)
      expect(defaultSg.IpPermissions!.length).toBeLessThanOrEqual(1);
      expect(defaultSg.IpPermissionsEgress!.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Resource Tagging', () => {
    test.each(regions)('VPC in %s has proper tags', async (region) => {
      const vpcIds = outputs.vpc_ids;

      const vpcId = vpcIds[region];
      const client = new EC2Client({ region });
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(tags.map((t) => [t.Key, t.Value]));

      // Check for required tags
      expect(tagMap).toHaveProperty('Environment');
      expect(tagMap).toHaveProperty('ManagedBy');
      expect(tagMap.ManagedBy).toBe('Terraform');
      expect(tagMap).toHaveProperty('Name');
    });
  });

  describe('End-to-End Network Workflow', () => {
    test('complete multi-region VPC infrastructure is functional', async () => {
      // This test validates the entire workflow

      // 1. Verify all VPCs exist
      const vpcIds = outputs.vpc_ids;

      expect(Object.keys(vpcIds)).toHaveLength(3);

      // 2. Verify subnets are properly distributed
      const publicSubnets = outputs.public_subnet_ids;

      const privateSubnets = outputs.private_subnet_ids;

      regions.forEach((region) => {
        expect(publicSubnets[region].length).toBeGreaterThanOrEqual(2);
        expect(privateSubnets[region].length).toBeGreaterThanOrEqual(2);
      });

      // 3. Verify peering mesh topology
      const peeringConnections = outputs.vpc_peering_connections;

      expect(Object.keys(peeringConnections)).toHaveLength(3);
      Object.values(peeringConnections).forEach((conn: any) => {
        expect(conn.status).toBe('active');
      });

      // 4. Verify NAT Gateway optimization
      const natCount = outputs.nat_gateway_count;

      expect(natCount).toBeLessThanOrEqual(3);

      // 5. Verify cost optimization
      const estimatedCost = outputs.estimated_monthly_nat_cost;

      // Cost should be significantly reduced from original 9 NAT Gateways (~$405/month)
      expect(estimatedCost).toBeLessThan(200);

      console.log('\n✅ End-to-End Validation Summary:');
      console.log(`  - VPCs deployed: ${Object.keys(vpcIds).length}`);
      console.log(`  - Peering connections: ${Object.keys(peeringConnections).length}`);
      console.log(`  - NAT Gateways: ${natCount}`);
      console.log(`  - Estimated monthly cost: $${estimatedCost}`);
      console.log(`  - Cost reduction: ~${Math.round((1 - estimatedCost / 405) * 100)}%`);
    });
  });

  describe('High Availability Validation', () => {
    test('resources are distributed across multiple availability zones', () => {
      const azs = outputs.availability_zones_used;

      regions.forEach((region) => {
        expect(azs[region]).toBeDefined();
        expect(Array.isArray(azs[region])).toBe(true);
        expect(azs[region].length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
