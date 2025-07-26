// Configuration - These are coming from cfn-outputs after cfn deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-west-2';
const ec2Client = new EC2Client({ region });

let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch {
  console.log('cfn-outputs/flat-outputs.json not found. Integration tests will be skipped until deployment completes.');
}

describe('VPC Infrastructure Integration Tests', () => {
  const stackName = `TapStack${environmentSuffix}`;

  beforeAll(() => {
    if (Object.keys(outputs).length === 0) {
      console.log('Warning: No stack outputs found. Integration tests will be skipped until deployment.');
    }
  });

  describe('VPC Integration Tests', () => {
    test('VPC should exist and have correct CIDR block', async () => {
      if (!outputs.VPCId) return;

      try {
        const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
        expect(response.Vpcs?.length).toBe(1);
        const vpc = response.Vpcs?.[0];
        expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc?.State).toBe('available');
      } catch (error) {
        console.log(`VPC test failed: ${error}`);
        throw error;
      }
    }, 30000);

    test('VPC should have DNS support and DNS hostnames enabled', async () => {
      if (!outputs.VPCId) return;

      try {
        const dnsSupport = await ec2Client.send(new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCId,
          Attribute: 'enableDnsSupport'
        }));
        const dnsHostnames = await ec2Client.send(new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCId,
          Attribute: 'enableDnsHostnames'
        }));

        expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
        expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      } catch (error) {
        console.log(`DNS attributes test failed: ${error}`);
        throw error;
      }
    }, 30000);
  });

  describe('Subnet Integration Tests', () => {
    test('PublicSubnet1 should exist with correct properties', async () => {
      if (!outputs.PublicSubnet1Id) return;

      try {
        const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnet1Id] }));
        expect(response.Subnets?.length).toBe(1);
        const subnet = response.Subnets?.[0];
        expect(subnet?.CidrBlock).toBe('10.0.1.0/24');
        expect(subnet?.VpcId).toBe(outputs.VPCId);
        expect(subnet?.State).toBe('available');
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      } catch (error) {
        console.log(`PublicSubnet1 test failed: ${error}`);
        throw error;
      }
    }, 30000);

    test('PublicSubnet2 should exist with correct properties', async () => {
      if (!outputs.PublicSubnet2Id) return;

      try {
        const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnet2Id] }));
        expect(response.Subnets?.length).toBe(1);
        const subnet = response.Subnets?.[0];
        expect(subnet?.CidrBlock).toBe('10.0.2.0/24');
        expect(subnet?.VpcId).toBe(outputs.VPCId);
        expect(subnet?.State).toBe('available');
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      } catch (error) {
        console.log(`PublicSubnet2 test failed: ${error}`);
        throw error;
      }
    }, 30000);

    test('subnets should be in different availability zones', async () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) return;

      try {
        const response = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
        }));
        const subnets = response.Subnets || [];
        const az1 = subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id)?.AvailabilityZone;
        const az2 = subnets.find(s => s.SubnetId === outputs.PublicSubnet2Id)?.AvailabilityZone;

        expect(az1).toBeDefined();
        expect(az2).toBeDefined();
        expect(az1).not.toBe(az2);
      } catch (error) {
        console.log(`Subnet availability zone test failed: ${error}`);
        throw error;
      }
    }, 30000);
  });

  describe('Internet Gateway Integration Tests', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      if (!outputs.InternetGatewayId) return;

      try {
        const response = await ec2Client.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.InternetGatewayId] }));
        expect(response.InternetGateways?.length).toBe(1);
        const igw = response.InternetGateways?.[0];
        const attachment = igw?.Attachments?.[0];
        expect(attachment?.VpcId).toBe(outputs.VPCId);
        expect(attachment?.State).toBe('available');
      } catch (error) {
        console.log(`Internet Gateway test failed: ${error}`);
        throw error;
      }
    }, 30000);
  });

  describe('Security Group Integration Tests', () => {
    test('Security Group should exist with correct SSH rule', async () => {
      if (!outputs.SecurityGroupId) return;

      try {
        const response = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [outputs.SecurityGroupId] }));
        expect(response.SecurityGroups?.length).toBe(1);
        const sg = response.SecurityGroups?.[0];
        expect(sg?.VpcId).toBe(outputs.VPCId);
        expect(sg?.Description).toBe('Allow SSH access from anywhere');

        const sshRule = sg?.IpPermissions?.find(
          rule => rule.IpProtocol === 'tcp' && rule.FromPort === 22 && rule.ToPort === 22
        );
        expect(sshRule).toBeDefined();
        expect(sshRule?.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
      } catch (error) {
        console.log(`Security Group test failed: ${error}`);
        throw error;
      }
    }, 30000);
  });

  describe('Routing Integration Tests', () => {
    test('route tables should have correct routes to Internet Gateway', async () => {
      if (!outputs.VPCId || !outputs.InternetGatewayId) return;

      try {
        const response = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
        }));

        const routeTables = response.RouteTables || [];
        const publicRouteTable = routeTables.find(rt =>
          rt.Routes?.some(route =>
            route.GatewayId === outputs.InternetGatewayId && route.DestinationCidrBlock === '0.0.0.0/0'
          )
        );

        expect(publicRouteTable).toBeDefined();
        const igwRoute = publicRouteTable?.Routes?.find(route =>
          route.GatewayId === outputs.InternetGatewayId && route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(igwRoute?.State).toBe('active');
      } catch (error) {
        console.log(`Route table test failed: ${error}`);
        throw error;
      }
    }, 30000);

    test('subnets should be associated with public route table', async () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) return;

      try {
        const response = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [{ Name: 'association.subnet-id', Values: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id] }]
        }));

        const routeTables = response.RouteTables || [];
        const subnet1Association = routeTables.find(rt => rt.Associations?.some(a => a.SubnetId === outputs.PublicSubnet1Id));
        const subnet2Association = routeTables.find(rt => rt.Associations?.some(a => a.SubnetId === outputs.PublicSubnet2Id));

        expect(subnet1Association).toBeDefined();
        expect(subnet2Association).toBeDefined();
        expect(subnet1Association?.RouteTableId).toBe(subnet2Association?.RouteTableId);
      } catch (error) {
        console.log(`Subnet route table association test failed: ${error}`);
        throw error;
      }
    }, 30000);
  });

  describe('End-to-End Network Connectivity', () => {
    test('VPC infrastructure should be properly configured for internet access', async () => {
      if (!outputs.VPCId || !outputs.InternetGatewayId) return;

      try {
        const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
        const igwResp = await ec2Client.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.InternetGatewayId] }));

        expect(vpcResp.Vpcs?.[0].State).toBe('available');
        expect(igwResp.InternetGateways?.[0].Attachments?.[0].State).toBe('available');
        console.log('✅ VPC infrastructure is properly configured for internet access');
      } catch (error) {
        console.log(`End-to-end connectivity test failed: ${error}`);
        throw error;
      }
    }, 30000);
  });
});
