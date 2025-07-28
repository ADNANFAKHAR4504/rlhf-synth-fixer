// Configuration - These are coming from cfn-outputs after cfn deploy
import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeInternetGatewaysCommand, 
  DescribeNatGatewaysCommand, 
  DescribeRouteTablesCommand,
  DescribeAddressesCommand,
  VpcState,
  SubnetState,
  NatGatewayState,
  InternetGatewayState
} from '@aws-sdk/client-ec2';

// Initialize EC2 client
const ec2Client = new EC2Client({ 
  region: process.env.AWS_REGION || 'us-east-1'
});

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

let outputs: any = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found. Integration tests will fail if outputs are not available.');
}

describe('VPC Infrastructure Integration Tests', () => {
  
  describe('VPC Component Validation', () => {
    test('should have VPC deployed with correct CIDR block', async () => {
      expect(outputs.VPCId).toBeDefined();
      
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe(VpcState.available);
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.DhcpOptionsId).toBeDefined();
      expect(vpc?.InstanceTenancy).toBe('default');
    });

    test('should have Internet Gateway attached to VPC', async () => {
      expect(outputs.InternetGatewayId).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      });
      
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways?.[0];
      
      expect(igw).toBeDefined();
      expect(igw?.State).toBe(InternetGatewayState.available);
      expect(igw?.Attachments).toHaveLength(1);
      expect(igw?.Attachments?.[0].VpcId).toBe(outputs.VPCId);
      expect(igw?.Attachments?.[0].State).toBe('available');
    });
  });

  describe('Subnet Configuration', () => {
    test('should have two public subnets in different AZs', async () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      const subnet1 = subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id);
      const subnet2 = subnets.find(s => s.SubnetId === outputs.PublicSubnet2Id);
      
      expect(subnet1?.State).toBe(SubnetState.available);
      expect(subnet2?.State).toBe(SubnetState.available);
      
      expect(subnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2?.CidrBlock).toBe('10.0.2.0/24');
      
      expect(subnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2?.MapPublicIpOnLaunch).toBe(true);
      
      // Verify they are in different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
    });

    test('should have two private subnets in different AZs', async () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      const subnet1 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      const subnet2 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet2Id);
      
      expect(subnet1?.State).toBe(SubnetState.available);
      expect(subnet2?.State).toBe(SubnetState.available);
      
      expect(subnet1?.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet2?.CidrBlock).toBe('10.0.12.0/24');
      
      expect(subnet1?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2?.MapPublicIpOnLaunch).toBe(false);
      
      // Verify they are in different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
    });

    test('private and public subnets should be paired in same AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id, 
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id, 
          outputs.PrivateSubnet2Id
        ]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      const publicSubnet1 = subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id);
      const publicSubnet2 = subnets.find(s => s.SubnetId === outputs.PublicSubnet2Id);
      const privateSubnet1 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      const privateSubnet2 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet2Id);
      
      // Public subnet 1 and private subnet 1 should be in the same AZ
      expect(publicSubnet1?.AvailabilityZone).toBe(privateSubnet1?.AvailabilityZone);
      // Public subnet 2 and private subnet 2 should be in the same AZ
      expect(publicSubnet2?.AvailabilityZone).toBe(privateSubnet2?.AvailabilityZone);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should have two NAT Gateways in available state', async () => {
      expect(outputs.NatGateway1Id).toBeDefined();
      expect(outputs.NatGateway2Id).toBeDefined();
      
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });
      
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];
      
      expect(natGateways).toHaveLength(2);
      
      natGateways.forEach(natGw => {
        expect(natGw.State).toBe(NatGatewayState.available);
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
        expect(natGw.NatGatewayAddresses?.[0].AllocationId).toBeDefined();
        expect(natGw.NatGatewayAddresses?.[0].PublicIp).toBeDefined();
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });
      
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];
      
      const natGw1 = natGateways.find(ng => ng.NatGatewayId === outputs.NatGateway1Id);
      const natGw2 = natGateways.find(ng => ng.NatGatewayId === outputs.NatGateway2Id);
      
      expect(natGw1?.SubnetId).toBe(outputs.PublicSubnet1Id);
      expect(natGw2?.SubnetId).toBe(outputs.PublicSubnet2Id);
    });

    test('should have Elastic IPs allocated for NAT Gateways', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });
      
      const natResponse = await ec2Client.send(natCommand);
      const natGateways = natResponse.NatGateways || [];
      
      const allocationIds = natGateways.map(ng => 
        ng.NatGatewayAddresses?.[0].AllocationId
      ).filter(Boolean);
      
      expect(allocationIds).toHaveLength(2);
      
      const eipCommand = new DescribeAddressesCommand({
        AllocationIds: allocationIds as string[]
      });
      
      const eipResponse = await ec2Client.send(eipCommand);
      const addresses = eipResponse.Addresses || [];
      
      expect(addresses).toHaveLength(2);
      addresses.forEach(address => {
        expect(address.Domain).toBe('vpc');
        expect(address.PublicIp).toBeDefined();
        expect(address.AssociationId).toBeDefined();
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should have proper route tables with correct routes', async () => {
      expect(outputs.PublicRouteTableId).toBeDefined();
      expect(outputs.PrivateRouteTable1Id).toBeDefined();
      expect(outputs.PrivateRouteTable2Id).toBeDefined();
      
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [
          outputs.PublicRouteTableId, 
          outputs.PrivateRouteTable1Id, 
          outputs.PrivateRouteTable2Id
        ]
      });
      
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables || [];
      
      expect(routeTables).toHaveLength(3);
      
      const publicRT = routeTables.find(rt => rt.RouteTableId === outputs.PublicRouteTableId);
      const privateRT1 = routeTables.find(rt => rt.RouteTableId === outputs.PrivateRouteTable1Id);
      const privateRT2 = routeTables.find(rt => rt.RouteTableId === outputs.PrivateRouteTable2Id);
      
      // Check public route table has route to Internet Gateway
      const publicRoutes = publicRT?.Routes || [];
      const igwRoute = publicRoutes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.GatewayId).toBe(outputs.InternetGatewayId);
      expect(igwRoute?.State).toBe('active');
      
      // Check private route tables have routes to NAT Gateways
      const privateRoutes1 = privateRT1?.Routes || [];
      const natRoute1 = privateRoutes1.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(natRoute1).toBeDefined();
      expect(natRoute1?.NatGatewayId).toBe(outputs.NatGateway1Id);
      expect(natRoute1?.State).toBe('active');
      
      const privateRoutes2 = privateRT2?.Routes || [];
      const natRoute2 = privateRoutes2.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(natRoute2).toBeDefined();
      expect(natRoute2?.NatGatewayId).toBe(outputs.NatGateway2Id);
      expect(natRoute2?.State).toBe('active');
    });

    test('should have correct subnet associations', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [
          outputs.PublicRouteTableId, 
          outputs.PrivateRouteTable1Id, 
          outputs.PrivateRouteTable2Id
        ]
      });
      
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables || [];
      
      const publicRT = routeTables.find(rt => rt.RouteTableId === outputs.PublicRouteTableId);
      const privateRT1 = routeTables.find(rt => rt.RouteTableId === outputs.PrivateRouteTable1Id);
      const privateRT2 = routeTables.find(rt => rt.RouteTableId === outputs.PrivateRouteTable2Id);
      
      // Check public route table associations
      const publicAssociations = publicRT?.Associations || [];
      const publicSubnetIds = publicAssociations
        .filter(a => a.SubnetId)
        .map(a => a.SubnetId);
      expect(publicSubnetIds).toContain(outputs.PublicSubnet1Id);
      expect(publicSubnetIds).toContain(outputs.PublicSubnet2Id);
      
      // Check private route table associations
      const privateAssociations1 = privateRT1?.Associations || [];
      const privateSubnetIds1 = privateAssociations1
        .filter(a => a.SubnetId)
        .map(a => a.SubnetId);
      expect(privateSubnetIds1).toContain(outputs.PrivateSubnet1Id);
      
      const privateAssociations2 = privateRT2?.Associations || [];
      const privateSubnetIds2 = privateAssociations2
        .filter(a => a.SubnetId)
        .map(a => a.SubnetId);
      expect(privateSubnetIds2).toContain(outputs.PrivateSubnet2Id);
    });
  });

  describe('End-to-end Connectivity', () => {
    test('should validate network connectivity requirements', async () => {
      // This test validates that the infrastructure is set up correctly for connectivity
      // In a real scenario, you might test actual connectivity by launching test instances
      
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.InternetGatewayId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.NatGateway1Id).toBeDefined();
      expect(outputs.NatGateway2Id).toBeDefined();
      
      // All components are available - connectivity should work as designed:
      // - Public subnets can reach internet via IGW
      // - Private subnets can reach internet via NAT Gateways
      // - Resources in same VPC can communicate internally
    });
  });

  describe('Tagging and Cost Optimization', () => {
    test('should have proper tags on all resources for cost tracking', async () => {
      const expectedTags = [
        { Key: 'Environment', Value: environmentSuffix },
        { Key: 'Project', Value: 'VPC-Infrastructure' },
        { Key: 'Owner', Value: 'DevOps-Team' },
        { Key: 'BillingCode', Value: 'INFRA-001' }
      ];
      
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs?.[0];
      
      expectedTags.forEach(expectedTag => {
        const tag = vpc?.Tags?.find(t => t.Key === expectedTag.Key);
        expect(tag).toBeDefined();
        expect(tag?.Value).toBe(expectedTag.Value);
      });
      
      // Check subnet tags
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PrivateSubnet1Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnets = subnetResponse.Subnets || [];
      
      subnets.forEach(subnet => {
        expectedTags.forEach(expectedTag => {
          const tag = subnet.Tags?.find(t => t.Key === expectedTag.Key);
          expect(tag).toBeDefined();
          expect(tag?.Value).toBe(expectedTag.Value);
        });
      });
    });
  });

  describe('High Availability and Multi-AZ', () => {
    test('should validate multi-AZ deployment', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id, 
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id, 
          outputs.PrivateSubnet2Id
        ]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      
      // Should have exactly 2 AZs
      expect(availabilityZones.size).toBe(2);
      
      // Each AZ should have one public and one private subnet
      const azArray = Array.from(availabilityZones);
      
      azArray.forEach(az => {
        const subnetsInAZ = subnets.filter(s => s.AvailabilityZone === az);
        expect(subnetsInAZ).toHaveLength(2); // One public, one private
        
        const publicSubnet = subnetsInAZ.find(s => s.MapPublicIpOnLaunch === true);
        const privateSubnet = subnetsInAZ.find(s => s.MapPublicIpOnLaunch === false);
        
        expect(publicSubnet).toBeDefined();
        expect(privateSubnet).toBeDefined();
      });
    });

    test('should have NAT Gateways distributed across AZs for high availability', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });
      
      const natResponse = await ec2Client.send(natCommand);
      const natGateways = natResponse.NatGateways || [];
      
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: natGateways.map(ng => ng.SubnetId).filter(Boolean) as string[]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnets = subnetResponse.Subnets || [];
      
      const natGatewayAZs = new Set(subnets.map(s => s.AvailabilityZone));
      
      // NAT Gateways should be in different AZs
      expect(natGatewayAZs.size).toBe(2);
    });
  });
});