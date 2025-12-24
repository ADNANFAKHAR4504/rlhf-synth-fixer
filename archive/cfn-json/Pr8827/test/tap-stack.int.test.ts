import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

// Load stack outputs
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('VPC Migration Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('VPC should have appropriate CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      const cidrBlock = response.Vpcs?.[0].CidrBlock;
      expect(cidrBlock).toBeDefined();
      // Should be a valid CIDR block (default is 172.16.0.0/16)
      expect(cidrBlock).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    });
  });

  describe('Subnet Configuration', () => {
    const publicSubnetIds = [
      outputs.PublicSubnetAId,
      outputs.PublicSubnetBId,
      outputs.PublicSubnetCId
    ];

    const privateSubnetIds = [
      outputs.PrivateSubnetAId,
      outputs.PrivateSubnetBId,
      outputs.PrivateSubnetCId
    ];

    test('all 6 subnets should exist and be available', async () => {
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(6);
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets should be distributed across different availability zones', async () => {
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      const azSet = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      // Should have at least 3 different AZs
      expect(azSet.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Internet Gateway', () => {
    test('internet gateway should be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBeGreaterThanOrEqual(1);
      expect(response.InternetGateways?.[0].Attachments?.[0].State).toBe('available');
      expect(response.InternetGateways?.[0].Attachments?.[0].VpcId).toBe(outputs.VPCId);
    });
  });

  describe('NAT Gateways', () => {
    test('should have 3 NAT gateways in available state', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(3);
    });

    test('NAT gateways should be in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const publicSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];

      response.NatGateways?.forEach(natGw => {
        expect(publicSubnetIds).toContain(natGw.SubnetId);
      });
    });

    test('each NAT gateway should have an Elastic IP', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      response.NatGateways?.forEach(natGw => {
        expect(natGw.NatGatewayAddresses).toBeDefined();
        expect(natGw.NatGatewayAddresses?.length).toBeGreaterThan(0);
        expect(natGw.NatGatewayAddresses?.[0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Security Groups', () => {
    test('web tier security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebTierSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('database tier security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DatabaseTierSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].VpcId).toBe(outputs.VPCId);
    });
  });

  describe('S3 Bucket', () => {
    test('migration logs bucket should exist', async () => {
      // Simply getting versioning will fail if bucket doesn't exist
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.MigrationLogsBucketName
      });
      const response = await s3Client.send(command);

      expect(response).toBeDefined();
    });

    test('bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.MigrationLogsBucketName
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.MigrationLogsBucketName
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('VPC Endpoint', () => {
    test('S3 VPC endpoint should exist and be available', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.S3VPCEndpointId]
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints?.length).toBe(1);
      expect(response.VpcEndpoints?.[0].State).toBe('available');
      expect(response.VpcEndpoints?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('VPC endpoint should be gateway type for S3', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.S3VPCEndpointId]
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.[0].VpcEndpointType).toBe('Gateway');
      expect(response.VpcEndpoints?.[0].ServiceName).toContain('s3');
    });

    test('VPC endpoint should be associated with private route tables', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.S3VPCEndpointId]
      });
      const response = await ec2Client.send(command);

      const routeTableIds = response.VpcEndpoints?.[0].RouteTableIds;
      expect(routeTableIds).toBeDefined();
      expect(routeTableIds?.length).toBe(3);
    });
  });

  describe('Resource Tags', () => {
    test('VPC should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs?.[0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
    });

    test('subnets should have required tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetAId]
      });
      const response = await ec2Client.send(command);

      const tags = response.Subnets?.[0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
    });
  });

  describe('Multi-AZ High Availability', () => {
    test('infrastructure should span multiple availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      const azSet = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      // Multi-AZ setup should have 3 availability zones
      expect(azSet.size).toBe(3);
    });

    test('each AZ should have both public and private subnet', async () => {
      const allSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      // Group by AZ
      const azGroups = new Map<string, any[]>();
      response.Subnets?.forEach(subnet => {
        const az = subnet.AvailabilityZone || '';
        if (!azGroups.has(az)) {
          azGroups.set(az, []);
        }
        azGroups.get(az)?.push(subnet);
      });

      // Each AZ should have exactly 2 subnets (1 public, 1 private)
      azGroups.forEach((subnets, az) => {
        expect(subnets.length).toBe(2);
      });
    });
  });

  describe('Cost Optimization', () => {
    test('VPC endpoint should reduce data transfer costs for S3 access', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.S3VPCEndpointId]
      });
      const response = await ec2Client.send(command);

      // VPC endpoint exists and is available
      expect(response.VpcEndpoints?.[0].State).toBe('available');
      // Gateway endpoints for S3 have no hourly charges
      expect(response.VpcEndpoints?.[0].VpcEndpointType).toBe('Gateway');
    });
  });
});
