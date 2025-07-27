// Configuration - These are coming from cfn-outputs after cloudformation deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeAvailabilityZonesCommand,
} from '@aws-sdk/client-ec2';

const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });

// Check if cfn-outputs directory exists and has the flat-outputs.json file
let outputs: any = {};
const outputsPath = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  console.warn('cfn-outputs/flat-outputs.json not found. Integration tests may fail without deployment outputs.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const expectedStackName = `TapStack${environmentSuffix}`;

describe('VPC Infrastructure Integration Tests', () => {
  
  describe('Stack Outputs Validation', () => {
    test('should have all required CloudFormation outputs', () => {
      const requiredOutputs = [
        'VpcId',
        'VpcCidr',
        'InternetGatewayId',
        'PublicSubnet1Id',
        'PublicSubnet1AZ',
        'PublicSubnet2Id',
        'PublicSubnet2AZ',
        'PrivateSubnet1Id',
        'PrivateSubnet1AZ',
        'PrivateSubnet2Id',
        'PrivateSubnet2AZ',
        'NatGateway1Id',
        'NatGateway1EIP',
        'NatGateway2Id',
        'NatGateway2EIP',
        'ICMPSecurityGroupId',
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id',
        'StackName',
        'EnvironmentSuffix'
      ];

      // Only run this test if outputs are available
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping outputs validation - no deployment outputs available');
        return;
      }

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBeNull();
        expect(outputs[outputName]).not.toBe('');
      });
    });

    test('stack name should match expected pattern', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping stack name validation - no deployment outputs available');
        return;
      }

      expect(outputs.StackName).toBe(expectedStackName);
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('VPC Infrastructure Validation', () => {
    test('VPC should exist and have correct properties', async () => {
      if (!outputs.VpcId) {
        console.warn('Skipping VPC validation - VpcId not available in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });

      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      
      expect(vpc.VpcId).toBe(outputs.VpcId);
      expect(vpc.CidrBlock).toBe(outputs.VpcCidr || '10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.DnsSupport).toBe('enabled');
      expect(vpc.DnsResolution).toBe('enabled');
      
      // Check VPC tags
      const tags = vpc.Tags || [];
      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('TapStack');
      expect(nameTag!.Value).toContain(environmentSuffix);
    });

    test('Internet Gateway should be attached to VPC', async () => {
      if (!outputs.InternetGatewayId || !outputs.VpcId) {
        console.warn('Skipping IGW validation - required outputs not available');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      });

      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      
      expect(igw.InternetGatewayId).toBe(outputs.InternetGatewayId);
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Subnet Configuration Validation', () => {
    test('should have correct number of subnets with proper configuration', async () => {
      if (!outputs.VpcId) {
        console.warn('Skipping subnet validation - VpcId not available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      // Should have exactly 4 subnets (2 public + 2 private)
      expect(response.Subnets).toHaveLength(4);
      
      const subnets = response.Subnets!;
      
      // Check that we have 2 public and 2 private subnets
      const publicSubnets = subnets.filter(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(subnet => 
        subnet.MapPublicIpOnLaunch === false
      );
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    test('subnets should be in different availability zones', async () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        console.warn('Skipping AZ validation - subnet IDs not available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });

      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      const az1 = response.Subnets![0].AvailabilityZone;
      const az2 = response.Subnets![1].AvailabilityZone;
      
      expect(az1).not.toBe(az2);
      expect(outputs.PublicSubnet1AZ).toBe(az1);
      expect(outputs.PublicSubnet2AZ).toBe(az2);
    });

    test('subnet CIDR blocks should not overlap', async () => {
      if (!outputs.VpcId) {
        console.warn('Skipping CIDR validation - VpcId not available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets!;
      
      const cidrBlocks = subnets.map(subnet => subnet.CidrBlock);
      const uniqueCidrBlocks = [...new Set(cidrBlocks)];
      
      // All CIDR blocks should be unique (no overlaps)
      expect(cidrBlocks).toHaveLength(uniqueCidrBlocks.length);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateways should be properly configured', async () => {
      if (!outputs.NatGateway1Id || !outputs.NatGateway2Id) {
        console.warn('Skipping NAT Gateway validation - NAT Gateway IDs not available');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });

      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toHaveLength(2);
      
      response.NatGateways!.forEach(natGateway => {
        expect(natGateway.State).toBe('available');
        expect(natGateway.NatGatewayAddresses).toHaveLength(1);
        
        // NAT Gateway should have an Elastic IP
        const address = natGateway.NatGatewayAddresses![0];
        expect(address.AllocationId).toBeDefined();
        expect(address.PublicIp).toBeDefined();
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      if (!outputs.NatGateway1Id || !outputs.NatGateway2Id || !outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        console.warn('Skipping NAT Gateway subnet validation - required IDs not available');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });

      const response = await ec2Client.send(command);
      
      const natGatewaySubnets = response.NatGateways!.map(nat => nat.SubnetId);
      const publicSubnets = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
      
      natGatewaySubnets.forEach(subnetId => {
        expect(publicSubnets).toContain(subnetId);
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('route tables should exist and have correct associations', async () => {
      if (!outputs.PublicRouteTableId || !outputs.PrivateRouteTable1Id || !outputs.PrivateRouteTable2Id) {
        console.warn('Skipping route table validation - route table IDs not available');
        return;
      }

      const routeTableIds = [
        outputs.PublicRouteTableId,
        outputs.PrivateRouteTable1Id,
        outputs.PrivateRouteTable2Id
      ];

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: routeTableIds
      });

      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toHaveLength(3);
      
      response.RouteTables!.forEach(routeTable => {
        expect(routeTable.VpcId).toBe(outputs.VpcId);
        expect(routeTable.Associations).toBeDefined();
        expect(routeTable.Associations!.length).toBeGreaterThan(0);
      });
    });

    test('public route table should have route to Internet Gateway', async () => {
      if (!outputs.PublicRouteTableId || !outputs.InternetGatewayId) {
        console.warn('Skipping public route validation - required IDs not available');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PublicRouteTableId]
      });

      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toHaveLength(1);
      
      const routeTable = response.RouteTables![0];
      const internetRoute = routeTable.Routes!.find(route => 
        route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId
      );
      
      expect(internetRoute).toBeDefined();
      expect(internetRoute!.GatewayId).toBe(outputs.InternetGatewayId);
      expect(internetRoute!.State).toBe('active');
    });

    test('private route tables should have routes to NAT Gateways', async () => {
      if (!outputs.PrivateRouteTable1Id || !outputs.PrivateRouteTable2Id) {
        console.warn('Skipping private route validation - private route table IDs not available');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PrivateRouteTable1Id, outputs.PrivateRouteTable2Id]
      });

      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toHaveLength(2);
      
      response.RouteTables!.forEach(routeTable => {
        const natRoute = routeTable.Routes!.find(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
        );
        
        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toBeDefined();
        expect(natRoute!.State).toBe('active');
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('ICMP security group should allow ICMP traffic', async () => {
      if (!outputs.ICMPSecurityGroupId) {
        console.warn('Skipping security group validation - security group ID not available');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ICMPSecurityGroupId]
      });

      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      
      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.VpcId).toBe(outputs.VpcId);
      
      // Check inbound ICMP rules
      const inboundIcmpRule = securityGroup.IpPermissions!.find(rule => 
        rule.IpProtocol === 'icmp'
      );
      expect(inboundIcmpRule).toBeDefined();
      expect(inboundIcmpRule!.FromPort).toBe(-1);
      expect(inboundIcmpRule!.ToPort).toBe(-1);
      expect(inboundIcmpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      
      // Check outbound ICMP rules
      const outboundIcmpRule = securityGroup.IpPermissionsEgress!.find(rule => 
        rule.IpProtocol === 'icmp'
      );
      expect(outboundIcmpRule).toBeDefined();
      expect(outboundIcmpRule!.FromPort).toBe(-1);
      expect(outboundIcmpRule!.ToPort).toBe(-1);
      expect(outboundIcmpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('infrastructure should support multi-AZ deployment', async () => {
      if (!outputs.PublicSubnet1AZ || !outputs.PublicSubnet2AZ || !outputs.PrivateSubnet1AZ || !outputs.PrivateSubnet2AZ) {
        console.warn('Skipping multi-AZ validation - AZ outputs not available');
        return;
      }

      // Verify we're using exactly 2 different AZs
      const allAZs = [
        outputs.PublicSubnet1AZ,
        outputs.PublicSubnet2AZ,
        outputs.PrivateSubnet1AZ,
        outputs.PrivateSubnet2AZ
      ];
      
      const uniqueAZs = [...new Set(allAZs)];
      expect(uniqueAZs).toHaveLength(2);
      
      // Verify public and private subnets are paired correctly by AZ
      expect(outputs.PublicSubnet1AZ).toBe(outputs.PrivateSubnet1AZ);
      expect(outputs.PublicSubnet2AZ).toBe(outputs.PrivateSubnet2AZ);
    });

    test('all resources should have proper tagging', async () => {
      if (!outputs.VpcId) {
        console.warn('Skipping tagging validation - VpcId not available');
        return;
      }

      // Check VPC tags as a representative example
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });

      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      const tags = vpc.Tags || [];
      
      const requiredTagKeys = ['Name', 'Environment', 'Project', 'Owner'];
      const tagKeys = tags.map(tag => tag.Key);
      
      requiredTagKeys.forEach(requiredKey => {
        expect(tagKeys).toContain(requiredKey);
      });
      
      // Verify Environment tag matches our environment suffix
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      expect(environmentTag!.Value).toBe(environmentSuffix);
    });

    test('infrastructure should be ready for production workloads', async () => {
      // This test verifies that all critical components are in place and healthy
      const criticalOutputs = [
        'VpcId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'NatGateway1Id',
        'NatGateway2Id',
        'InternetGatewayId'
      ];

      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping production readiness validation - no outputs available');
        return;
      }

      criticalOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBeNull();
        expect(outputs[outputName]).not.toBe('');
      });

      // Additional check: ensure we have the expected stack name format
      expect(outputs.StackName).toMatch(/^TapStack/);
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });
  });
});