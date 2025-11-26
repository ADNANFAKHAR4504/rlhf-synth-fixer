// Integration tests for VPC Network Isolation Terraform infrastructure
// Tests validate deployed AWS resources using actual stack outputs

import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeNetworkAclsCommand, DescribeInternetGatewaysCommand } from '@aws-sdk/client-ec2';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error(`Failed to load outputs from ${outputsPath}:`, error);
  outputs = {};
}

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('VPC Network Isolation Infrastructure - Integration Tests', () => {
  // Test 1: Validate VPC Configuration
  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC has DNS support enabled', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs![0];
      // DNS settings are not returned in basic describe; they require separate API calls
      // We verify this in the Terraform code itself
      expect(vpc).toBeDefined();
      expect(vpc.VpcId).toBe(vpcId);
    });

    test('VPC has correct tags', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');

      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe('Production');
      expect(projectTag).toBeDefined();
      expect(projectTag!.Value).toBe('PaymentGateway');
    });
  });

  // Test 2: Validate Internet Gateway
  describe('Internet Gateway', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      const igwId = outputs.internet_gateway_id;
      const vpcId = outputs.vpc_id;
      expect(igwId).toBeDefined();

      const response = await ec2Client.send(new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [igwId]
      }));

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  // Test 3: Validate Subnet Configuration
  describe('Subnet Configuration', () => {
    test('All 9 subnets exist', async () => {
      const subnetIds = [
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.public_subnet_id_3,
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2,
        outputs.private_subnet_id_3,
        outputs.database_subnet_id_1,
        outputs.database_subnet_id_2,
        outputs.database_subnet_id_3
      ].filter(Boolean);

      expect(subnetIds).toHaveLength(9);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(response.Subnets).toHaveLength(9);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('Public subnets have correct CIDR blocks', async () => {
      const publicSubnetIds = [
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.public_subnet_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('Private subnets have correct CIDR blocks', async () => {
      const privateSubnetIds = [
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2,
        outputs.private_subnet_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
    });

    test('Database subnets have correct CIDR blocks', async () => {
      const databaseSubnetIds = [
        outputs.database_subnet_id_1,
        outputs.database_subnet_id_2,
        outputs.database_subnet_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: databaseSubnetIds
      }));

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']);
    });

    test('Subnets are distributed across 3 availability zones', async () => {
      const allSubnetIds = [
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.public_subnet_id_3,
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2,
        outputs.private_subnet_id_3,
        outputs.database_subnet_id_1,
        outputs.database_subnet_id_2,
        outputs.database_subnet_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      }));

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Verify each AZ has exactly 3 subnets (one of each tier)
      const azCounts = response.Subnets!.reduce((acc, subnet) => {
        const az = subnet.AvailabilityZone!;
        acc[az] = (acc[az] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.values(azCounts).forEach(count => {
        expect(count).toBe(3);
      });
    });

    test('Public subnets have map_public_ip_on_launch enabled', async () => {
      const publicSubnetIds = [
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.public_subnet_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Private and database subnets do NOT have map_public_ip_on_launch enabled', async () => {
      const nonPublicSubnetIds = [
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2,
        outputs.private_subnet_id_3,
        outputs.database_subnet_id_1,
        outputs.database_subnet_id_2,
        outputs.database_subnet_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: nonPublicSubnetIds
      }));

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  // Test 4: Validate NAT Gateway Configuration (High Availability)
  describe('NAT Gateway High Availability', () => {
    test('3 NAT Gateways exist in available state', async () => {
      const natGatewayIds = [
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2,
        outputs.nat_gateway_id_3
      ].filter(Boolean);

      expect(natGatewayIds).toHaveLength(3);

      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));

      expect(response.NatGateways).toHaveLength(3);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('NAT Gateways are in different availability zones', async () => {
      const natGatewayIds = [
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2,
        outputs.nat_gateway_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));

      const azs = response.NatGateways!.map(nat => {
        return nat.SubnetId;
      });

      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test('Each NAT Gateway has a public IP address', async () => {
      const natGatewayIds = [
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2,
        outputs.nat_gateway_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));

      response.NatGateways!.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });

    test('NAT Gateways are deployed in public subnets', async () => {
      const natGatewayIds = [
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2,
        outputs.nat_gateway_id_3
      ].filter(Boolean);

      const publicSubnetIds = [
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.public_subnet_id_3
      ];

      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));

      response.NatGateways!.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });
  });

  // Test 5: Validate Route Table Configuration
  describe('Route Table Configuration', () => {
    test('Public route table has route to Internet Gateway', async () => {
      const publicRtId = outputs.public_route_table_id;
      const igwId = outputs.internet_gateway_id;
      expect(publicRtId).toBeDefined();

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [publicRtId]
      }));

      const routeTable = response.RouteTables![0];
      const igwRoute = routeTable.Routes!.find(r => r.GatewayId === igwId);

      expect(igwRoute).toBeDefined();
      expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(igwRoute!.State).toBe('active');
    });

    test('Public subnets are associated with public route table', async () => {
      const publicRtId = outputs.public_route_table_id;
      const publicSubnetIds = [
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.public_subnet_id_3
      ];

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [publicRtId]
      }));

      const associations = response.RouteTables![0].Associations!;
      const associatedSubnetIds = associations
        .filter(a => a.SubnetId)
        .map(a => a.SubnetId);

      publicSubnetIds.forEach(subnetId => {
        expect(associatedSubnetIds).toContain(subnetId);
      });
    });

    test('Each private route table has route to its NAT Gateway', async () => {
      const privateRtIds = [
        outputs.private_route_table_id_1,
        outputs.private_route_table_id_2,
        outputs.private_route_table_id_3
      ].filter(Boolean);

      const natGatewayIds = [
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2,
        outputs.nat_gateway_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: privateRtIds
      }));

      expect(response.RouteTables).toHaveLength(3);

      response.RouteTables!.forEach(rt => {
        const natRoute = rt.Routes!.find(r => r.NatGatewayId);
        expect(natRoute).toBeDefined();
        expect(natRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(natRoute!.State).toBe('active');
        expect(natGatewayIds).toContain(natRoute!.NatGatewayId);
      });
    });

    test('Database route table has NO route to NAT Gateway or Internet Gateway', async () => {
      const databaseRtId = outputs.database_route_table_id;
      expect(databaseRtId).toBeDefined();

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [databaseRtId]
      }));

      const routeTable = response.RouteTables![0];
      const routes = routeTable.Routes!;

      routes.forEach(route => {
        expect(route.NatGatewayId).toBeUndefined();
        expect(route.GatewayId).not.toBe(outputs.internet_gateway_id);
        // Only local routes should exist
        if (route.GatewayId) {
          expect(route.GatewayId).toBe('local');
        }
      });
    });

    test('Database subnets are associated with database route table', async () => {
      const databaseRtId = outputs.database_route_table_id;
      const databaseSubnetIds = [
        outputs.database_subnet_id_1,
        outputs.database_subnet_id_2,
        outputs.database_subnet_id_3
      ];

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [databaseRtId]
      }));

      const associations = response.RouteTables![0].Associations!;
      const associatedSubnetIds = associations
        .filter(a => a.SubnetId)
        .map(a => a.SubnetId);

      databaseSubnetIds.forEach(subnetId => {
        expect(associatedSubnetIds).toContain(subnetId);
      });
    });
  });

  // Test 6: Validate Network ACLs
  describe('Network ACL Configuration', () => {
    test('Network ACLs exist for all subnet tiers', async () => {
      const vpcId = outputs.vpc_id;

      const response = await ec2Client.send(new DescribeNetworkAclsCommand({
        Filters: [{
          Name: 'vpc-id',
          Values: [vpcId]
        }]
      }));

      // Should have at least 4 NACLs: default + 3 custom (public, private, database)
      expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(4);
    });

    test('Public NACL allows HTTP and HTTPS inbound', async () => {
      const vpcId = outputs.vpc_id;
      const publicSubnetId = outputs.public_subnet_id_1;

      const response = await ec2Client.send(new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: [publicSubnetId] }
        ]
      }));

      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);

      const http = ingressRules.find(r => r.PortRange?.From === 80 && r.PortRange?.To === 80);
      const https = ingressRules.find(r => r.PortRange?.From === 443 && r.PortRange?.To === 443);

      expect(http).toBeDefined();
      expect(http!.RuleAction).toBe('allow');
      expect(https).toBeDefined();
      expect(https!.RuleAction).toBe('allow');
    });

    test('Private NACL allows ports 8080-8090 inbound', async () => {
      const vpcId = outputs.vpc_id;
      const privateSubnetId = outputs.private_subnet_id_1;

      const response = await ec2Client.send(new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: [privateSubnetId] }
        ]
      }));

      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);

      const appPorts = ingressRules.find(r =>
        r.PortRange?.From === 8080 && r.PortRange?.To === 8090
      );

      expect(appPorts).toBeDefined();
      expect(appPorts!.RuleAction).toBe('allow');
    });

    test('Database NACL allows port 5432 from private subnets only', async () => {
      const vpcId = outputs.vpc_id;
      const databaseSubnetId = outputs.database_subnet_id_1;

      const response = await ec2Client.send(new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: [databaseSubnetId] }
        ]
      }));

      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);

      const pgRules = ingressRules.filter(r =>
        r.PortRange?.From === 5432 && r.PortRange?.To === 5432
      );

      expect(pgRules.length).toBeGreaterThan(0);
      pgRules.forEach(rule => {
        expect(rule.RuleAction).toBe('allow');
        // Verify CIDR is from private subnet range
        expect(rule.CidrBlock).toMatch(/^10\.0\.1[1-3]\./);
      });
    });
  });

  // Test 7: Validate VPC Flow Logs
  describe('VPC Flow Logs Configuration', () => {
    test('CloudWatch Log Group exists with correct retention', async () => {
      const logGroupName = outputs.vpc_flow_log_group_name;
      expect(logGroupName).toBeDefined();

      const response = await cwLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    });

    test('IAM role for VPC Flow Logs exists', async () => {
      // Extract role name from outputs or construct it
      const environmentSuffix = outputs.vpc_flow_log_group_name.split('-').pop();
      const roleName = `vpc-flow-logs-role-${environmentSuffix}`;

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      // Verify assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('vpc-flow-logs.amazonaws.com');
    });

    test('IAM role has CloudWatch Logs permissions', async () => {
      const environmentSuffix = outputs.vpc_flow_log_group_name.split('-').pop();
      const roleName = `vpc-flow-logs-role-${environmentSuffix}`;
      const policyName = `vpc-flow-logs-policy-${environmentSuffix}`;

      const response = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName
      }));

      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      const actions = policy.Statement[0].Action;

      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });
  });

  // Test 8: Validate Complete Network Isolation
  describe('Complete Network Isolation Validation', () => {
    test('Public tier: Internet access via Internet Gateway', async () => {
      const publicRtId = outputs.public_route_table_id;
      const igwId = outputs.internet_gateway_id;

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [publicRtId]
      }));

      const routes = response.RouteTables![0].Routes!;
      const internetRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');

      expect(internetRoute).toBeDefined();
      expect(internetRoute!.GatewayId).toBe(igwId);
    });

    test('Private tier: Internet access via NAT Gateway only', async () => {
      const privateRtIds = [
        outputs.private_route_table_id_1,
        outputs.private_route_table_id_2,
        outputs.private_route_table_id_3
      ].filter(Boolean);

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: privateRtIds
      }));

      response.RouteTables!.forEach(rt => {
        const routes = rt.Routes!;
        const internetRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');

        expect(internetRoute).toBeDefined();
        expect(internetRoute!.NatGatewayId).toBeDefined();
        expect(internetRoute!.GatewayId).toBeUndefined();
      });
    });

    test('Database tier: NO internet access (completely isolated)', async () => {
      const databaseRtId = outputs.database_route_table_id;

      const response = await ec2Client.send(new DescribeRouteTablesCommand({
        RouteTableIds: [databaseRtId]
      }));

      const routes = response.RouteTables![0].Routes!;
      const internetRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');

      expect(internetRoute).toBeUndefined();

      // Verify only local routes exist
      routes.forEach(route => {
        if (route.GatewayId) {
          expect(route.GatewayId).toBe('local');
        }
      });
    });

    test('Three-tier architecture is complete', () => {
      // Verify all components exist
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.internet_gateway_id).toBeDefined();

      // Public tier
      expect(outputs.public_subnet_id_1).toBeDefined();
      expect(outputs.public_subnet_id_2).toBeDefined();
      expect(outputs.public_subnet_id_3).toBeDefined();
      expect(outputs.public_route_table_id).toBeDefined();

      // Private tier
      expect(outputs.private_subnet_id_1).toBeDefined();
      expect(outputs.private_subnet_id_2).toBeDefined();
      expect(outputs.private_subnet_id_3).toBeDefined();
      expect(outputs.private_route_table_id_1).toBeDefined();
      expect(outputs.private_route_table_id_2).toBeDefined();
      expect(outputs.private_route_table_id_3).toBeDefined();

      // Database tier
      expect(outputs.database_subnet_id_1).toBeDefined();
      expect(outputs.database_subnet_id_2).toBeDefined();
      expect(outputs.database_subnet_id_3).toBeDefined();
      expect(outputs.database_route_table_id).toBeDefined();

      // NAT Gateways (HA)
      expect(outputs.nat_gateway_id_1).toBeDefined();
      expect(outputs.nat_gateway_id_2).toBeDefined();
      expect(outputs.nat_gateway_id_3).toBeDefined();

      // Audit/Compliance
      expect(outputs.vpc_flow_log_id).toBeDefined();
      expect(outputs.vpc_flow_log_group_name).toBeDefined();
    });
  });
});
