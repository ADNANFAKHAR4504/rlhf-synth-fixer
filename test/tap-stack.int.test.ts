// Integration tests for VPC networking infrastructure
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';

// Configuration - These are coming from cfn-outputs after stack deployment
let outputs: any = {};

// Load outputs if they exist
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found. Some tests may fail.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS EC2 client
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('VPC Networking Infrastructure Integration Tests', () => {
  
  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR and DNS settings', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.DhcpOptionsId).toBeDefined();
      expect(vpc?.EnableDnsHostnames).toBe(true);
      expect(vpc?.EnableDnsSupport).toBe(true);
      
      // Check VPC tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toBe(`TAP-VPC-${environmentSuffix}`);
      
      const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('development');
      
      const projectTag = vpc?.Tags?.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('TAP');
    });
  });

  describe('Subnet Configuration', () => {
    test('Public subnets should exist in different AZs with correct CIDR blocks', async () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        console.warn('Public subnet IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      // Check first public subnet
      const subnet1 = subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id);
      expect(subnet1?.State).toBe('available');
      expect(subnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1?.VpcId).toBe(outputs.VPCId);
      
      // Check second public subnet
      const subnet2 = subnets.find(s => s.SubnetId === outputs.PublicSubnet2Id);
      expect(subnet2?.State).toBe('available');
      expect(subnet2?.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2?.VpcId).toBe(outputs.VPCId);
      
      // Ensure subnets are in different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
      
      // Check subnet tags
      const nameTag1 = subnet1?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag1?.Value).toBe(`TAP-Public-Subnet-AZ1-${environmentSuffix}`);
      
      const typeTag1 = subnet1?.Tags?.find(tag => tag.Key === 'Type');
      expect(typeTag1?.Value).toBe('Public');
    });

    test('Private subnets should exist in different AZs with correct CIDR blocks', async () => {
      if (!outputs.PrivateSubnet1Id || !outputs.PrivateSubnet2Id) {
        console.warn('Private subnet IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      // Check first private subnet
      const subnet1 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      expect(subnet1?.State).toBe('available');
      expect(subnet1?.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet1?.VpcId).toBe(outputs.VPCId);
      
      // Check second private subnet
      const subnet2 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet2Id);
      expect(subnet2?.State).toBe('available');
      expect(subnet2?.CidrBlock).toBe('10.0.12.0/24');
      expect(subnet2?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2?.VpcId).toBe(outputs.VPCId);
      
      // Ensure subnets are in different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
      
      // Check subnet tags
      const nameTag1 = subnet1?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag1?.Value).toBe(`TAP-Private-Subnet-AZ1-${environmentSuffix}`);
      
      const typeTag1 = subnet1?.Tags?.find(tag => tag.Key === 'Type');
      expect(typeTag1?.Value).toBe('Private');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway should be attached to VPC', async () => {
      if (!outputs.InternetGatewayId || !outputs.VPCId) {
        console.warn('Internet Gateway or VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      });
      
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways?.[0];
      
      expect(igw).toBeDefined();
      expect(igw?.State).toBe('available');
      
      // Check attachment to VPC
      const attachment = igw?.Attachments?.[0];
      expect(attachment?.State).toBe('attached');
      expect(attachment?.VpcId).toBe(outputs.VPCId);
      
      // Check IGW tags
      const nameTag = igw?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toBe(`TAP-IGW-${environmentSuffix}`);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateways should exist in public subnets with Elastic IPs', async () => {
      if (!outputs.NatGateway1Id || !outputs.NatGateway2Id) {
        console.warn('NAT Gateway IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
      });
      
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];
      
      expect(natGateways).toHaveLength(2);
      
      // Check first NAT Gateway
      const nat1 = natGateways.find(n => n.NatGatewayId === outputs.NatGateway1Id);
      expect(nat1?.State).toBe('available');
      expect(nat1?.SubnetId).toBe(outputs.PublicSubnet1Id);
      expect(nat1?.VpcId).toBe(outputs.VPCId);
      expect(nat1?.NatGatewayAddresses).toHaveLength(1);
      expect(nat1?.NatGatewayAddresses?.[0].AllocationId).toBeDefined();
      
      // Check second NAT Gateway
      const nat2 = natGateways.find(n => n.NatGatewayId === outputs.NatGateway2Id);
      expect(nat2?.State).toBe('available');
      expect(nat2?.SubnetId).toBe(outputs.PublicSubnet2Id);
      expect(nat2?.VpcId).toBe(outputs.VPCId);
      expect(nat2?.NatGatewayAddresses).toHaveLength(1);
      expect(nat2?.NatGatewayAddresses?.[0].AllocationId).toBeDefined();
      
      // Ensure NAT Gateways are in different subnets
      expect(nat1?.SubnetId).not.toBe(nat2?.SubnetId);
    });

    test('Elastic IPs should be allocated for NAT Gateways', async () => {
      if (!outputs.NatGateway1EIP || !outputs.NatGateway2EIP) {
        console.warn('NAT Gateway EIP allocation IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeAddressesCommand({
        AllocationIds: [outputs.NatGateway1EIP, outputs.NatGateway2EIP]
      });
      
      const response = await ec2Client.send(command);
      const addresses = response.Addresses || [];
      
      expect(addresses).toHaveLength(2);
      
      addresses.forEach(address => {
        expect(address.Domain).toBe('vpc');
        expect(address.AssociationId).toBeDefined(); // Should be associated with NAT Gateway
        expect(address.PublicIp).toBeDefined();
        
        // Check EIP tags
        const nameTag = address.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(new RegExp(`TAP-NAT[12]-EIP-${environmentSuffix}`));
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('Public route table should route traffic to Internet Gateway', async () => {
      if (!outputs.PublicRouteTableId) {
        console.warn('Public route table ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PublicRouteTableId]
      });
      
      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables?.[0];
      
      expect(routeTable).toBeDefined();
      expect(routeTable?.VpcId).toBe(outputs.VPCId);
      
      // Check for default route to IGW
      const defaultRoute = routeTable?.Routes?.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute?.GatewayId).toBe(outputs.InternetGatewayId);
      expect(defaultRoute?.State).toBe('active');
      
      // Check subnet associations
      expect(routeTable?.Associations?.length).toBeGreaterThanOrEqual(2);
      const subnetAssociations = routeTable?.Associations?.filter(assoc => assoc.SubnetId);
      expect(subnetAssociations?.some(assoc => assoc.SubnetId === outputs.PublicSubnet1Id)).toBe(true);
      expect(subnetAssociations?.some(assoc => assoc.SubnetId === outputs.PublicSubnet2Id)).toBe(true);
    });

    test('Private route tables should route traffic to NAT Gateways', async () => {
      if (!outputs.PrivateRouteTable1Id || !outputs.PrivateRouteTable2Id) {
        console.warn('Private route table IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PrivateRouteTable1Id, outputs.PrivateRouteTable2Id]
      });
      
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables || [];
      
      expect(routeTables).toHaveLength(2);
      
      // Check first private route table
      const rt1 = routeTables.find(rt => rt.RouteTableId === outputs.PrivateRouteTable1Id);
      expect(rt1?.VpcId).toBe(outputs.VPCId);
      
      const defaultRoute1 = rt1?.Routes?.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute1).toBeDefined();
      expect(defaultRoute1?.NatGatewayId).toBe(outputs.NatGateway1Id);
      expect(defaultRoute1?.State).toBe('active');
      
      const subnetAssoc1 = rt1?.Associations?.find(assoc => assoc.SubnetId === outputs.PrivateSubnet1Id);
      expect(subnetAssoc1).toBeDefined();
      
      // Check second private route table
      const rt2 = routeTables.find(rt => rt.RouteTableId === outputs.PrivateRouteTable2Id);
      expect(rt2?.VpcId).toBe(outputs.VPCId);
      
      const defaultRoute2 = rt2?.Routes?.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute2).toBeDefined();
      expect(defaultRoute2?.NatGatewayId).toBe(outputs.NatGateway2Id);
      expect(defaultRoute2?.State).toBe('active');
      
      const subnetAssoc2 = rt2?.Associations?.find(assoc => assoc.SubnetId === outputs.PrivateSubnet2Id);
      expect(subnetAssoc2).toBeDefined();
    });
  });

  describe('Security Group Configuration', () => {
    test('Security groups should allow ICMP traffic', async () => {
      if (!outputs.PublicSecurityGroupId || !outputs.PrivateSecurityGroupId) {
        console.warn('Security Group IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.PublicSecurityGroupId, outputs.PrivateSecurityGroupId]
      });
      
      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      
      expect(securityGroups).toHaveLength(2);
      
      securityGroups.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.VPCId);
        
        // Check ICMP ingress rule
        const icmpIngressRule = sg.IpPermissions?.find(rule => rule.IpProtocol === 'icmp');
        expect(icmpIngressRule).toBeDefined();
        expect(icmpIngressRule?.FromPort).toBe(-1);
        expect(icmpIngressRule?.ToPort).toBe(-1);
        expect(icmpIngressRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
        
        // Check ICMP egress rule
        const icmpEgressRule = sg.IpPermissionsEgress?.find(rule => rule.IpProtocol === 'icmp');
        expect(icmpEgressRule).toBeDefined();
        expect(icmpEgressRule?.FromPort).toBe(-1);
        expect(icmpEgressRule?.ToPort).toBe(-1);
        expect(icmpEgressRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
        
        // Check all outbound traffic rule
        const allEgressRule = sg.IpPermissionsEgress?.find(rule => rule.IpProtocol === '-1');
        expect(allEgressRule).toBeDefined();
        expect(allEgressRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
        
        // Check security group tags
        const nameTag = sg.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(new RegExp(`TAP-(Public|Private)-SG-${environmentSuffix}`));
        
        const envTag = sg.Tags?.find(tag => tag.Key === 'Environment');
        expect(envTag?.Value).toBe('development');
      });
    });
  });

  describe('End-to-End Networking Workflow', () => {
    test('All networking components should be properly integrated', async () => {
      // This test validates the complete networking setup
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.InternetGatewayId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.NatGateway1Id).toBeDefined();
      expect(outputs.NatGateway2Id).toBeDefined();
      expect(outputs.NatGateway1EIP).toBeDefined();
      expect(outputs.NatGateway2EIP).toBeDefined();
      expect(outputs.PublicRouteTableId).toBeDefined();
      expect(outputs.PrivateRouteTable1Id).toBeDefined();
      expect(outputs.PrivateRouteTable2Id).toBeDefined();
      expect(outputs.PublicSecurityGroupId).toBeDefined();
      expect(outputs.PrivateSecurityGroupId).toBeDefined();
      
      // Verify environment suffix is correctly applied
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.StackName).toBe(stackName);
    });
  });
});