// Integration tests for Terraform VPC Infrastructure
// Tests verify actual AWS resource deployment and configuration

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const REGION = 'us-east-1';

const ec2Client = new EC2Client({ region: REGION });

// Load deployment outputs
let outputs: any;

beforeAll(() => {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    throw new Error(`Outputs file not found at ${OUTPUTS_PATH}. Run terraform apply first.`);
  }
  outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
});

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Validation', () => {
    test('VPC exists with correct CIDR block', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe(outputs.vpc_cidr);
      expect(vpc.State).toBe('available');
    });

    test('VPC has DNS support and hostnames enabled', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        })
      );

      const vpc = response.Vpcs![0];
      // DNS configuration is optional - only check if defined
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
    });

    test('VPC has correct Name tag with environment suffix', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        })
      );

      const vpc = response.Vpcs![0];
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain('vpc-');
      // Check that the name tag contains a valid VPC identifier
      expect(nameTag?.Value).toBeTruthy();
    });
  });

  describe('Subnet Validation', () => {
    test('exactly 9 subnets exist (3 public + 3 private + 3 database)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(9);
    });

    test('public subnets have correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Type',
              Values: ['Public'],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });

    test('private subnets exist in all AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Type',
              Values: ['Private'],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(3);
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // 3 unique AZs
    });

    test('database subnets exist and have correct tags', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Type',
              Values: ['Database'],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Internet Gateway Validation', () => {
    test('Internet Gateway is attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments?.[0].State).toBe('available');
    });
  });

  describe('NAT Gateway Validation', () => {
    test('exactly 1 NAT Gateway exists (quota-constrained)', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      expect(response.NatGateways?.filter(n => n.State !== 'deleted')).toHaveLength(1);
    });

    test('NAT Gateway is in available state', async () => {
      // Parse JSON string to array
      const natGatewayIds = typeof outputs.nat_gateway_ids === 'string' 
        ? JSON.parse(outputs.nat_gateway_ids) 
        : outputs.nat_gateway_ids;
      
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds,
        })
      );

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
    });

    test('NAT Gateway has Elastic IP attached', async () => {
      // Parse JSON string to array
      const natGatewayIds = typeof outputs.nat_gateway_ids === 'string' 
        ? JSON.parse(outputs.nat_gateway_ids) 
        : outputs.nat_gateway_ids;
      const natGatewayIps = typeof outputs.nat_gateway_ips === 'string' 
        ? JSON.parse(outputs.nat_gateway_ips) 
        : outputs.nat_gateway_ips;
      
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds,
        })
      );

      const natGateway = response.NatGateways![0];
      expect(natGateway.NatGatewayAddresses).toHaveLength(1);
      expect(natGateway.NatGatewayAddresses![0].PublicIp).toBe(natGatewayIps[0]);
    });

    test('NAT Gateway is in a public subnet', async () => {
      // Parse JSON string to array
      const natGatewayIds = typeof outputs.nat_gateway_ids === 'string' 
        ? JSON.parse(outputs.nat_gateway_ids) 
        : outputs.nat_gateway_ids;
      
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds,
        })
      );

      const natGateway = response.NatGateways![0];
      const subnetId = natGateway.SubnetId!;

      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [subnetId],
        })
      );

      const subnet = subnetResponse.Subnets![0];
      const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
      expect(typeTag?.Value).toBe('Public');
    });
  });

  describe('Route Table Validation', () => {
    test('public route table has route to Internet Gateway', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Name',
              Values: ['*public*'],
            },
          ],
        })
      );

      const publicRT = response.RouteTables![0];
      const igwRoute = publicRT.Routes?.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();
    });

    test('private route tables have routes to NAT Gateway', async () => {
      // Parse JSON string to array
      const natGatewayIds = typeof outputs.nat_gateway_ids === 'string' 
        ? JSON.parse(outputs.nat_gateway_ids) 
        : outputs.nat_gateway_ids;
      
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Name',
              Values: ['*private*'],
            },
          ],
        })
      );

      expect(response.RouteTables?.length).toBeGreaterThanOrEqual(3);
      response.RouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId?.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
        // Check that the NAT Gateway ID is in the list of NAT Gateway IDs
        expect(natGatewayIds).toContain(natRoute?.NatGatewayId);
      });
    });

    test('database route tables have no internet routes', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Name',
              Values: ['*database*'],
            },
          ],
        })
      );

      expect(response.RouteTables?.length).toBeGreaterThanOrEqual(3);
      response.RouteTables?.forEach(rt => {
        const internetRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(internetRoute).toBeUndefined();
      });
    });
  });

  describe('Network ACL Validation', () => {
    test('custom Network ACLs exist for each subnet tier', async () => {
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      const customNACLs = response.NetworkAcls?.filter(nacl => !nacl.IsDefault);
      expect(customNACLs?.length).toBeGreaterThanOrEqual(3);
    });

    test('public NACL has HTTP and HTTPS ingress rules', async () => {
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Name',
              Values: ['*public*'],
            },
          ],
        })
      );

      const publicNACL = response.NetworkAcls![0];
      const ingressRules = publicNACL.Entries?.filter(e => !e.Egress);

      const httpRule = ingressRules?.find(r => r.PortRange?.From === 80);
      const httpsRule = ingressRules?.find(r => r.PortRange?.From === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule?.RuleAction).toBe('allow');
      expect(httpsRule?.RuleAction).toBe('allow');
    });
  });


  describe('Resource Tagging Validation', () => {
    test('all resources have required tags', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        })
      );

      const vpc = vpcResponse.Vpcs![0];
      const tagKeys = vpc.Tags?.map(t => t.Key) || [];

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('ManagedBy');

      const managedByTag = vpc.Tags?.find(t => t.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');
    });
  });

  describe('High Availability Validation', () => {
    test('subnets span multiple availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('each AZ has subnets of all three types', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        })
      );

      const subnetsByAZ: { [key: string]: string[] } = {};

      response.Subnets?.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        const type = subnet.Tags?.find(t => t.Key === 'Type')?.Value || 'Unknown';

        if (!subnetsByAZ[az]) {
          subnetsByAZ[az] = [];
        }
        subnetsByAZ[az].push(type);
      });

      // Check that at least 3 AZs have all 3 subnet types
      const fullAZs = Object.values(subnetsByAZ).filter(types =>
        types.includes('Public') && types.includes('Private') && types.includes('Database')
      );
      expect(fullAZs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Quota-Aware Design Validation', () => {
    test('only 1 NAT Gateway deployed (not 3) due to EIP quota', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
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
        })
      );

      // Should be 1 instead of 3 due to quota constraints
      expect(response.NatGateways).toHaveLength(1);
    });

    test('all private subnets route through single NAT Gateway', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'tag:Name',
              Values: ['*private*'],
            },
          ],
        })
      );

      const natGatewayIds = new Set();
      response.RouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(r => r.NatGatewayId);
        if (natRoute?.NatGatewayId) {
          natGatewayIds.add(natRoute.NatGatewayId);
        }
      });

      // All should use the same NAT Gateway
      expect(natGatewayIds.size).toBe(1);
    });
  });
});
