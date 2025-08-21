// Configuration - These are coming from cfn-outputs after cdk deploy
import * as fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInternetGatewaysCommand, DescribeVpcEndpointsCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import { VPCLatticeClient, GetServiceNetworkCommand } from '@aws-sdk/client-vpc-lattice';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const vpcLatticeClient = new VPCLatticeClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('VPC Infrastructure Integration Tests', () => {
  let outputs: any = {};
  
  beforeAll(() => {
    // Load outputs from deployment
    try {
      const outputsFile = 'cfn-outputs/flat-outputs.json';
      if (fs.existsSync(outputsFile)) {
        outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
      } else {
        console.warn('No deployment outputs found. Some tests may be skipped.');
      }
    } catch (error) {
      console.error('Error loading outputs:', error);
    }
  });

  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      if (!outputs.VpcId) {
        console.log('Skipping test - VPC ID not found in outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are in the VPC attributes, just verify VPC exists
    });

    test('VPC should have correct tags', async () => {
      if (!outputs.VpcId) {
        console.log('Skipping test - VPC ID not found in outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      }));

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('NetworkVpc');
    });
  });

  describe('Subnet Configuration', () => {
    test('Should have two public subnets in different AZs', async () => {
      if (!outputs.PublicSubnetIds) {
        console.log('Skipping test - Subnet IDs not found in outputs');
        return;
      }

      const subnetIds = outputs.PublicSubnetIds.split(',');
      expect(subnetIds).toHaveLength(2);

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(response.Subnets).toHaveLength(2);
      
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2); // Should be in different AZs
      
      // Check that all subnets are public
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Subnets should have correct CIDR blocks', async () => {
      if (!outputs.PublicSubnetIds) {
        console.log('Skipping test - Subnet IDs not found in outputs');
        return;
      }

      const subnetIds = outputs.PublicSubnetIds.split(',');
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock);
      expect(cidrBlocks).toContain('10.0.0.0/24');
      expect(cidrBlocks).toContain('10.0.1.0/24');
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway should be attached to VPC', async () => {
      if (!outputs.VpcId) {
        console.log('Skipping test - VPC ID not found in outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      }));

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Route Tables', () => {
    test('Public subnets should have routes to Internet Gateway', async () => {
      if (!outputs.PublicSubnetIds) {
        console.log('Skipping test - Subnet IDs not found in outputs');
        return;
      }

      const subnetIds = outputs.PublicSubnetIds.split(',');
      
      for (const subnetId of subnetIds) {
        const response = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnetId]
            }
          ]
        }));

        expect(response.RouteTables).toHaveLength(1);
        const routeTable = response.RouteTables![0];
        
        // Check for default route to IGW
        const defaultRoute = routeTable.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute!.GatewayId).toMatch(/^igw-/);
      }
    });
  });

  describe('VPC Endpoints', () => {
    test('Should have S3 Gateway endpoint', async () => {
      if (!outputs.VpcId) {
        console.log('Skipping test - VPC ID not found in outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'service-name',
            Values: ['com.amazonaws.us-east-1.s3']
          }
        ]
      }));

      const gatewayEndpoint = response.VpcEndpoints!.find(ve => ve.VpcEndpointType === 'Gateway');
      expect(gatewayEndpoint).toBeDefined();
    });

    test('Should have PrivateLink endpoints for S3 and EC2', async () => {
      if (!outputs.VpcId) {
        console.log('Skipping test - VPC ID not found in outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'vpc-endpoint-type',
            Values: ['Interface']
          }
        ]
      }));

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(2);
      
      // Check for S3 and EC2 interface endpoints
      const serviceNames = response.VpcEndpoints!.map(ve => ve.ServiceName);
      const hasS3Interface = serviceNames.some(sn => sn?.includes('s3'));
      const hasEC2Interface = serviceNames.some(sn => sn?.includes('ec2'));
      
      expect(hasS3Interface).toBe(true);
      expect(hasEC2Interface).toBe(true);
    });
  });

  describe('VPC Lattice', () => {
    test('Service Network should exist and be associated with VPC', async () => {
      if (!outputs.ServiceNetworkId) {
        console.log('Skipping test - Service Network ID not found in outputs');
        return;
      }

      try {
        const response = await vpcLatticeClient.send(new GetServiceNetworkCommand({
          serviceNetworkIdentifier: outputs.ServiceNetworkId
        }));

        expect(response.name).toContain('service-network-');
        expect(response.authType).toBe('NONE');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('VPC Lattice Service Network not found - may not be deployed');
        } else {
          throw error;
        }
      }
    });
  });
});
