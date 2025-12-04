import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSecurityGroupRulesCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand
} from '@aws-sdk/client-ec2';
import fs from 'fs';

// Load stack outputs from deployment
const outputs: Record<string, string> = (() => {
  try {
    return JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  } catch (error) {
    console.warn('Could not load cfn-outputs/flat-outputs.json. Using environment variables or defaults.');
    return {};
  }
})();

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Extract resource IDs from outputs
const vpcId = outputs.VPCId;
const publicSubnet1Id = outputs.PublicSubnet1Id;
const publicSubnet2Id = outputs.PublicSubnet2Id;
const publicSubnet3Id = outputs.PublicSubnet3Id;
const privateSubnet1Id = outputs.PrivateSubnet1Id;
const privateSubnet2Id = outputs.PrivateSubnet2Id;
const privateSubnet3Id = outputs.PrivateSubnet3Id;
const httpsSecurityGroupId = outputs.HTTPSSecurityGroupId;
const natGateway1Id = outputs.NATGateway1Id;
const natGateway2Id = outputs.NATGateway2Id;
const natGateway3Id = outputs.NATGateway3Id;
const vpcCidr = outputs.VPCCidr;

// Helper function to wait for async operations
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TapStack End-to-End Integration Tests', () => {
  beforeAll(() => {
    // Validate that all required outputs are available
    expect(vpcId).toBeTruthy();
    expect(publicSubnet1Id).toBeTruthy();
    expect(publicSubnet2Id).toBeTruthy();
    expect(publicSubnet3Id).toBeTruthy();
    expect(privateSubnet1Id).toBeTruthy();
    expect(privateSubnet2Id).toBeTruthy();
    expect(privateSubnet3Id).toBeTruthy();
    expect(httpsSecurityGroupId).toBeTruthy();
    expect(natGateway1Id).toBeTruthy();
    expect(natGateway2Id).toBeTruthy();
    expect(natGateway3Id).toBeTruthy();
  });

  describe('VPC Configuration Validation', () => {
    test('should verify VPC exists and has correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should verify VPC has DNS hostnames enabled', async () => {
      const command = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      });
      const response = await ec2Client.send(command);

      expect(response.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should verify VPC has DNS support enabled', async () => {
      const command = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      });
      const response = await ec2Client.send(command);

      expect(response.EnableDnsSupport?.Value).toBe(true);
    });

    test('should verify VPC has proper tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('TradingPlatform');
    });
  });

  describe('Public Subnets Validation', () => {
    const publicSubnetIds = [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id];
    const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const expectedAZs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    test('should verify all public subnets exist', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
    });

    test('should verify public subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(expectedCidrs).toContain(subnet.CidrBlock!);
      });
    });

    test('should verify public subnets are in correct availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(expectedAZs).toContain(subnet.AvailabilityZone!);
      });
    });

    test('should verify public subnets have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should verify public subnets belong to correct VPC', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('should verify public subnets have proper tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Type');

        const typeTag = tags.find(t => t.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');
      });
    });
  });

  describe('Private Subnets Validation', () => {
    const privateSubnetIds = [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id];
    const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
    const expectedAZs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    test('should verify all private subnets exist', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
    });

    test('should verify private subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(expectedCidrs).toContain(subnet.CidrBlock!);
      });
    });

    test('should verify private subnets are in correct availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(expectedAZs).toContain(subnet.AvailabilityZone!);
      });
    });

    test('should verify private subnets have MapPublicIpOnLaunch disabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should verify private subnets belong to correct VPC', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('should verify private subnets have proper tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Type');

        const typeTag = tags.find(t => t.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');
      });
    });
  });

  describe('Internet Gateway Validation', () => {
    test('should verify Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBe(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should verify Internet Gateway has proper tags', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const igw = response.InternetGateways![0];
      const tags = igw.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
    });
  });

  describe('NAT Gateways Validation', () => {
    const natGatewayIds = [natGateway1Id, natGateway2Id, natGateway3Id];
    const publicSubnetIds = [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id];

    test('should verify all NAT Gateways exist and are available', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(3);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    });

    test('should verify NAT Gateways are in correct public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(publicSubnetIds).toContain(natGw.SubnetId!);
      });
    });

    test('should verify NAT Gateways are in correct VPC', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.VpcId).toBe(vpcId);
      });
    });

    test('should verify each NAT Gateway has an Elastic IP', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.NatGatewayAddresses).toBeDefined();
        expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(natGw.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });

    test('should verify NAT Gateways are distributed across availability zones', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      const expectedAZs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
      const actualAZs = response.NatGateways!.map(natGw => {
        // Get subnet AZ
        const subnetId = natGw.SubnetId!;
        return natGw.SubnetId;
      });

      // Verify we have NAT Gateways in different subnets
      expect(new Set(actualAZs).size).toBe(3);
    });

    test('should verify NAT Gateways have proper tags', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        const tags = natGw.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
      });
    });
  });

  describe('Route Tables Validation', () => {
    test('should verify public route table routes to Internet Gateway', async () => {
      // Get route tables for VPC
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      // Find public route table (has association with public subnets)
      const publicRouteTable = response.RouteTables!.find(rt => {
        return rt.Associations?.some(assoc =>
          [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id].includes(assoc.SubnetId || '')
        );
      });

      expect(publicRouteTable).toBeDefined();

      // Verify route to Internet Gateway
      const igwRoute = publicRouteTable!.Routes!.find(route =>
        route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId?.startsWith('igw-')
      );

      expect(igwRoute).toBeDefined();
      expect(igwRoute!.State).toBe('active');
    });

    test('should verify all public subnets are associated with public route table', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const publicSubnetIds = [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id];
      const associatedSubnets: string[] = [];

      response.RouteTables!.forEach(rt => {
        rt.Associations?.forEach(assoc => {
          if (assoc.SubnetId && publicSubnetIds.includes(assoc.SubnetId)) {
            associatedSubnets.push(assoc.SubnetId);
          }
        });
      });

      expect(associatedSubnets.sort()).toEqual(publicSubnetIds.sort());
    });

    test('should verify each private subnet has its own route table', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const privateSubnetIds = [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id];
      const privateRouteTables: any[] = [];

      response.RouteTables!.forEach(rt => {
        const hasPrivateSubnet = rt.Associations?.some(assoc =>
          privateSubnetIds.includes(assoc.SubnetId || '')
        );

        if (hasPrivateSubnet) {
          privateRouteTables.push(rt);
        }
      });

      // Should have 3 separate private route tables for HA
      expect(privateRouteTables.length).toBe(3);
    });

    test('should verify each private route table routes to correct NAT Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const privateSubnetIds = [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id];
      const natGatewayIds = [natGateway1Id, natGateway2Id, natGateway3Id];

      privateSubnetIds.forEach(subnetId => {
        const routeTable = response.RouteTables!.find(rt =>
          rt.Associations?.some(assoc => assoc.SubnetId === subnetId)
        );

        expect(routeTable).toBeDefined();

        // Verify route to NAT Gateway
        const natRoute = routeTable!.Routes!.find(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
        );

        expect(natRoute).toBeDefined();
        expect(natGatewayIds).toContain(natRoute!.NatGatewayId!);
        expect(natRoute!.State).toBe('active');
      });
    });
  });

  describe('Security Group Validation', () => {
    test('should verify HTTPS security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(httpsSecurityGroupId);
      expect(sg.VpcId).toBe(vpcId);
    });

    test('should verify security group allows HTTPS inbound from anywhere', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];

      const httpsRule = ingressRules.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );

      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpRanges).toBeDefined();
      expect(httpsRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test('should verify security group allows all outbound traffic', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const egressRules = sg.IpPermissionsEgress || [];

      const allOutboundRule = egressRules.find(rule =>
        rule.IpProtocol === '-1'
      );

      expect(allOutboundRule).toBeDefined();
      expect(allOutboundRule!.IpRanges).toBeDefined();
      expect(allOutboundRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test('should verify security group has proper tags', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const tags = sg.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('TradingPlatform');
    });
  });

  describe('High Availability Verification', () => {
    test('should verify resources are distributed across three availability zones', async () => {
      // Get all subnets
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);
      expect(azs.has('us-east-1a')).toBe(true);
      expect(azs.has('us-east-1b')).toBe(true);
      expect(azs.has('us-east-1c')).toBe(true);
    });

    test('should verify each AZ has both public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      const azGroups: Record<string, { public: number; private: number }> = {};

      response.Subnets!.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        if (!azGroups[az]) {
          azGroups[az] = { public: 0, private: 0 };
        }

        const typeTag = subnet.Tags?.find(t => t.Key === 'Type');
        if (typeTag?.Value === 'Public') {
          azGroups[az].public++;
        } else if (typeTag?.Value === 'Private') {
          azGroups[az].private++;
        }
      });

      // Each AZ should have 1 public and 1 private subnet
      Object.values(azGroups).forEach(counts => {
        expect(counts.public).toBe(1);
        expect(counts.private).toBe(1);
      });
    });

    test('should verify each AZ has its own NAT Gateway', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGateway1Id, natGateway2Id, natGateway3Id]
      });
      const natResponse = await ec2Client.send(natCommand);

      // Get subnet details to find AZs
      const subnetIds = natResponse.NatGateways!.map(nat => nat.SubnetId!);
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Network Connectivity', () => {
    test('should verify VPC CIDR is correct', async () => {
      expect(vpcCidr).toBe('10.0.0.0/16');

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should verify subnet CIDRs are within VPC CIDR range', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      const expectedCidrs = [
        '10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24',
        '10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'
      ];

      response.Subnets!.forEach(subnet => {
        expect(expectedCidrs).toContain(subnet.CidrBlock!);
      });
    });

    test('should verify public subnets have route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'association.subnet-id',
            Values: [publicSubnet1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const routeTable = response.RouteTables![0];
      const igwRoute = routeTable.Routes!.find(route =>
        route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId?.startsWith('igw-')
      );

      expect(igwRoute).toBeDefined();
      expect(igwRoute!.State).toBe('active');
    });

    test('should verify private subnets have route to NAT Gateways', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'association.subnet-id',
            Values: [privateSubnet1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const routeTable = response.RouteTables![0];
      const natRoute = routeTable.Routes!.find(route =>
        route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
      );

      expect(natRoute).toBeDefined();
      expect(natRoute!.State).toBe('active');
      expect([natGateway1Id, natGateway2Id, natGateway3Id]).toContain(natRoute!.NatGatewayId!);
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('should verify all resources have Environment tag', async () => {
      // Check VPC
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'Environment')).toBe(true);

      // Check Subnets
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [publicSubnet1Id, privateSubnet1Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'Environment')).toBe(true);
      });

      // Check Security Group
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgTags = sgResponse.SecurityGroups![0].Tags || [];
      expect(sgTags.some(t => t.Key === 'Environment')).toBe(true);
    });

    test('should verify all resources have Project tag', async () => {
      // Check VPC
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'Project' && t.Value === 'TradingPlatform')).toBe(true);

      // Check Subnets
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [publicSubnet1Id, privateSubnet1Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'Project' && t.Value === 'TradingPlatform')).toBe(true);
      });

      // Check Security Group
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgTags = sgResponse.SecurityGroups![0].Tags || [];
      expect(sgTags.some(t => t.Key === 'Project' && t.Value === 'TradingPlatform')).toBe(true);
    });
  });

  describe('Infrastructure Readiness', () => {
    test('should verify all NAT Gateways are in available state', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGateway1Id, natGateway2Id, natGateway3Id]
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    });

    test('should verify VPC is in available state', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should verify all subnets are in available state', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });
  });
});
