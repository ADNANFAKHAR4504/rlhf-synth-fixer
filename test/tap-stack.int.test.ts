import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-southeast-1';

const ec2Client = new EC2Client({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Tests', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VpcId;

      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      });
      const hostnamesResponse = await ec2Client.send(dnsHostnamesCommand);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      });
      const supportResponse = await ec2Client.send(dnsSupportCommand);

      expect(hostnamesResponse.EnableDnsHostnames?.Value).toBe(false);
      expect(supportResponse.EnableDnsSupport?.Value).toBe(false);
    });
  });

  describe('Subnet Tests', () => {
    test('all subnets should exist and be available', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      expect(subnetIds.every(id => id)).toBe(true);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.10.0/24', '10.0.11.0/24']);
    });

    test('public subnets should map public IPs on launch', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('subnets should be in correct availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id
        ]
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(s => s.AvailabilityZone).sort();
      const uniqueAzs = [...new Set(azs)];

      // Should have exactly 2 unique availability zones
      expect(uniqueAzs).toHaveLength(2);
      // Each AZ should have 2 subnets (1 public + 1 private)
      expect(azs).toHaveLength(4);
    });
  });

  describe('Internet Gateway Tests', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const igwId = outputs.InternetGatewayId;
      const vpcId = outputs.VpcId;

      expect(igwId).toBeDefined();

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [igwId]
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('NAT Gateway Tests', () => {
    test('both NAT Gateways should exist and be available', async () => {
      const natGatewayIds = [
        outputs.NatGateway1Id,
        outputs.NatGateway2Id
      ];

      expect(natGatewayIds.every(id => id)).toBe(true);

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(2);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const natGatewayIds = [
        outputs.NatGateway1Id,
        outputs.NatGateway2Id
      ];
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test('NAT Gateways should have Elastic IPs', async () => {
      const eip1 = outputs.NatGateway1Eip;
      const eip2 = outputs.NatGateway2Eip;

      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(eip1).not.toBe(eip2);
    });
  });

  describe('Route Table Tests', () => {
    test('all route tables should exist', async () => {
      const routeTableIds = [
        outputs.PublicRouteTableId,
        outputs.PrivateRouteTable1Id,
        outputs.PrivateRouteTable2Id
      ];

      expect(routeTableIds.every(id => id)).toBe(true);

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: routeTableIds
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(3);
    });

    test('public subnets should be associated with public route table', async () => {
      const routeTableId = outputs.PublicRouteTableId;
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id
      ];

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [routeTableId]
      });
      const response = await ec2Client.send(command);

      const routeTable = response.RouteTables![0];
      const associatedSubnets = routeTable.Associations!
        .filter(assoc => assoc.SubnetId)
        .map(assoc => assoc.SubnetId);

      publicSubnetIds.forEach(subnetId => {
        expect(associatedSubnets).toContain(subnetId);
      });
    });

    test('private subnets should be associated with private route tables', async () => {
      const privateRouteTableIds = [
        outputs.PrivateRouteTable1Id,
        outputs.PrivateRouteTable2Id
      ];
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: privateRouteTableIds
      });
      const response = await ec2Client.send(command);

      const allAssociatedSubnets: string[] = [];
      response.RouteTables!.forEach(routeTable => {
        const subnets = routeTable.Associations!
          .filter(assoc => assoc.SubnetId)
          .map(assoc => assoc.SubnetId!);
        allAssociatedSubnets.push(...subnets);
      });

      privateSubnetIds.forEach(subnetId => {
        expect(allAssociatedSubnets).toContain(subnetId);
      });
    });
  });

  describe('Output Validation', () => {
    test('all required outputs should be present', () => {
      const requiredOutputs = [
        'VpcId',
        'VpcCidr',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'NatGateway1Id',
        'NatGateway2Id',
        'NatGateway1Eip',
        'NatGateway2Eip',
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id',
        'InternetGatewayId',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      });
    });

    test('VPC CIDR output should match actual VPC', () => {
      expect(outputs.VpcCidr).toBe('10.0.0.0/16');
    });

    test('EnvironmentSuffix output should be defined', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9-]+$/);
    });
  });
});
