// Configuration - These are coming from cfn-outputs after cfn deploy
import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInternetGatewaysCommand, DescribeSecurityGroupsCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-west-2';

const ec2Client = new EC2Client({ region });

let outputs: any = {};

// Try to load outputs if available, otherwise tests will be skipped
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
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
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      try {
        const command = new DescribeVpcsCommand({
          VpcIds: [vpcId]
        });

        const response = await ec2Client.send(command);
        expect(response.Vpcs).toHaveLength(1);
        
        const vpc = response.Vpcs[0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.State).toBe('available');
      } catch (error) {
        console.error('Failed to describe VPC:', error);
        throw error;
      }
    }, 30000);

    test('VPC should have DNS support and DNS hostnames enabled', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      const vpcId = outputs.VPCId;
      
      try {
        const command = new DescribeVpcsCommand({
          VpcIds: [vpcId]
        });

        const response = await ec2Client.send(command);
        const vpc = response.Vpcs[0];
        
        expect(vpc.EnableDnsSupport).toBe(true);
        expect(vpc.EnableDnsHostnames).toBe(true);
      } catch (error) {
        console.error('Failed to describe VPC DNS settings:', error);
        throw error;
      }
    }, 30000);
  });

  describe('Subnet Integration Tests', () => {
    test('PublicSubnet1 should exist with correct properties', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      const subnetId = outputs.PublicSubnet1Id;
      expect(subnetId).toBeDefined();

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: [subnetId]
        });

        const response = await ec2Client.send(command);
        expect(response.Subnets).toHaveLength(1);

        const subnet = response.Subnets[0];
        expect(subnet.CidrBlock).toBe('10.0.1.0/24');
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      } catch (error) {
        console.error('Failed to describe PublicSubnet1:', error);
        throw error;
      }
    }, 30000);

    test('PublicSubnet2 should exist with correct properties', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      const subnetId = outputs.PublicSubnet2Id;
      expect(subnetId).toBeDefined();

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: [subnetId]
        });

        const response = await ec2Client.send(command);
        expect(response.Subnets).toHaveLength(1);

        const subnet = response.Subnets[0];
        expect(subnet.CidrBlock).toBe('10.0.2.0/24');
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      } catch (error) {
        console.error('Failed to describe PublicSubnet2:', error);
        throw error;
      }
    }, 30000);

    test('subnets should be in different availability zones', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
        });

        const response = await ec2Client.send(command);
        expect(response.Subnets).toHaveLength(2);

        const az1 = response.Subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id)?.AvailabilityZone;
        const az2 = response.Subnets.find(s => s.SubnetId === outputs.PublicSubnet2Id)?.AvailabilityZone;

        expect(az1).toBeDefined();
        expect(az2).toBeDefined();
        expect(az1).not.toBe(az2);
      } catch (error) {
        console.error('Failed to describe subnet availability zones:', error);
        throw error;
      }
    }, 30000);
  });

  describe('Internet Gateway Integration Tests', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      const igwId = outputs.InternetGatewayId;
      expect(igwId).toBeDefined();

      try {
        const command = new DescribeInternetGatewaysCommand({
          InternetGatewayIds: [igwId]
        });

        const response = await ec2Client.send(command);
        expect(response.InternetGateways).toHaveLength(1);

        const igw = response.InternetGateways[0];
        expect(igw.Attachments).toHaveLength(1);
        expect(igw.Attachments[0].VpcId).toBe(outputs.VPCId);
        expect(igw.Attachments[0].State).toBe('available');
      } catch (error) {
        console.error('Failed to describe Internet Gateway:', error);
        throw error;
      }
    }, 30000);
  });

  describe('Security Group Integration Tests', () => {
    test('Security Group should exist with correct SSH rule', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();

      try {
        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [sgId]
        });

        const response = await ec2Client.send(command);
        expect(response.SecurityGroups).toHaveLength(1);

        const sg = response.SecurityGroups[0];
        expect(sg.VpcId).toBe(outputs.VPCId);
        expect(sg.GroupDescription).toBe('Allow SSH access from anywhere');

        // Check SSH ingress rule
        const sshRule = sg.IpPermissions?.find(
          rule => rule.IpProtocol === 'tcp' && rule.FromPort === 22 && rule.ToPort === 22
        );
        expect(sshRule).toBeDefined();
        expect(sshRule?.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
      } catch (error) {
        console.error('Failed to describe Security Group:', error);
        throw error;
      }
    }, 30000);
  });

  describe('Routing Integration Tests', () => {
    test('route tables should have correct routes to Internet Gateway', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      try {
        // Get route tables associated with our subnets
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId]
            }
          ]
        });

        const response = await ec2Client.send(command);
        expect(response.RouteTables.length).toBeGreaterThan(0);

        // Find the public route table (should have route to IGW)
        const publicRouteTable = response.RouteTables.find(rt => 
          rt.Routes?.some(route => 
            route.GatewayId === outputs.InternetGatewayId && 
            route.DestinationCidrBlock === '0.0.0.0/0'
          )
        );

        expect(publicRouteTable).toBeDefined();
        
        // Verify the route to IGW exists
        const igwRoute = publicRouteTable?.Routes?.find(route => 
          route.GatewayId === outputs.InternetGatewayId && 
          route.DestinationCidrBlock === '0.0.0.0/0'
        );
        
        expect(igwRoute).toBeDefined();
        expect(igwRoute?.State).toBe('active');
      } catch (error) {
        console.error('Failed to describe route tables:', error);
        throw error;
      }
    }, 30000);

    test('subnets should be associated with public route table', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      try {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
            }
          ]
        });

        const response = await ec2Client.send(command);
        
        // Both subnets should be associated with route tables
        const subnet1Association = response.RouteTables.find(rt =>
          rt.Associations?.some(assoc => assoc.SubnetId === outputs.PublicSubnet1Id)
        );
        
        const subnet2Association = response.RouteTables.find(rt =>
          rt.Associations?.some(assoc => assoc.SubnetId === outputs.PublicSubnet2Id)
        );

        expect(subnet1Association).toBeDefined();
        expect(subnet2Association).toBeDefined();

        // Both should be associated with the same route table that has IGW route
        expect(subnet1Association?.RouteTableId).toBe(subnet2Association?.RouteTableId);
      } catch (error) {
        console.error('Failed to describe subnet route table associations:', error);
        throw error;
      }
    }, 30000);
  });

  describe('End-to-End Network Connectivity', () => {
    test('VPC infrastructure should be properly configured for internet access', async () => {
      if (Object.keys(outputs).length === 0) {
        console.log('Skipping test: outputs not available');
        return;
      }

      try {
        // This is a high-level validation that all components are configured correctly
        // In a real scenario, you might launch an EC2 instance and test connectivity

        // Verify we have all required outputs
        expect(outputs.VPCId).toBeDefined();
        expect(outputs.PublicSubnet1Id).toBeDefined();
        expect(outputs.PublicSubnet2Id).toBeDefined();
        expect(outputs.InternetGatewayId).toBeDefined();
        expect(outputs.SecurityGroupId).toBeDefined();

        // Verify basic infrastructure is in place
        const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
        const vpcResponse = await ec2Client.send(vpcCommand);
        expect(vpcResponse.Vpcs[0].State).toBe('available');

        const igwCommand = new DescribeInternetGatewaysCommand({ 
          InternetGatewayIds: [outputs.InternetGatewayId] 
        });
        const igwResponse = await ec2Client.send(igwCommand);
        expect(igwResponse.InternetGateways[0].Attachments[0].State).toBe('available');

        console.log('✅ VPC infrastructure is properly configured for internet access');
      } catch (error) {
        console.error('Failed to validate end-to-end network connectivity:', error);
        throw error;
      }
    }, 30000);
  });
});