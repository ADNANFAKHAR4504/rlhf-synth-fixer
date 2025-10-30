import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Resource Validation', () => {
    test('VPC should exist and have correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();

      const costCenterTag = tags.find(t => t.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();
    });
  });

  describe('Subnet Configuration', () => {
    test('all 9 subnets should exist', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(9);
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id],
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id],
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
    });

    test('database subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id, outputs.DatabaseSubnet3Id],
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrBlocks).toEqual(['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']);
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id],
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id],
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets should be distributed across 3 availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBe(3);
    });

    test('all subnets should belong to the correct VPC', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('subnets should have correct Tier tags', async () => {
      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id],
      });
      const publicResponse = await ec2Client.send(publicCommand);
      publicResponse.Subnets!.forEach(subnet => {
        const tierTag = subnet.Tags?.find(t => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('public');
      });

      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id],
      });
      const privateResponse = await ec2Client.send(privateCommand);
      privateResponse.Subnets!.forEach(subnet => {
        const tierTag = subnet.Tags?.find(t => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('private');
      });

      const databaseCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id, outputs.DatabaseSubnet3Id],
      });
      const databaseResponse = await ec2Client.send(databaseCommand);
      databaseResponse.Subnets!.forEach(subnet => {
        const tierTag = subnet.Tags?.find(t => t.Key === 'Tier');
        expect(tierTag?.Value).toBe('database');
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('all 3 NAT Gateways should exist and be available', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id, outputs.NATGateway3Id],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(3);

      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id, outputs.NATGateway3Id],
      });

      const response = await ec2Client.send(command);
      const natSubnets = response.NatGateways!.map(nat => nat.SubnetId);

      const publicSubnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      natSubnets.forEach(subnetId => {
        expect(publicSubnets).toContain(subnetId);
      });
    });

    test('NAT Gateways should have Elastic IPs assigned', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id, outputs.NATGateway3Id],
      });

      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });

    test('NAT Gateways should be in different AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBe(3);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Route Tables', () => {
    test('public route table should have route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'association.subnet-id', Values: [outputs.PublicSubnet1Id] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(1);

      const routeTable = response.RouteTables![0];
      const igwRoute = routeTable.Routes?.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId === outputs.InternetGatewayId
      );

      expect(igwRoute).toBeDefined();
    });

    test('private route tables should have routes to NAT Gateways', async () => {
      const privateSubnets = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      for (const subnetId of privateSubnets) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCId] },
            { Name: 'association.subnet-id', Values: [subnetId] },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.RouteTables).toHaveLength(1);

        const routeTable = response.RouteTables![0];
        const natRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');

        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toBeDefined();
      }
    });

    test('database route tables should not have internet routes', async () => {
      const databaseSubnets = [
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      for (const subnetId of databaseSubnets) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCId] },
            { Name: 'association.subnet-id', Values: [subnetId] },
          ],
        });

        const response = await ec2Client.send(command);
        expect(response.RouteTables).toHaveLength(1);

        const routeTable = response.RouteTables![0];
        const internetRoute = routeTable.Routes?.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );

        expect(internetRoute).toBeUndefined();
      }
    });
  });

  describe('Network ACLs', () => {
    test('VPC should have custom Network ACLs', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });

      const response = await ec2Client.send(command);
      const customNACLs = response.NetworkAcls!.filter(nacl => !nacl.IsDefault);

      expect(customNACLs.length).toBeGreaterThanOrEqual(3);
    });

    test('subnets should be associated with custom NACLs', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PrivateSubnet1Id,
        outputs.DatabaseSubnet1Id,
      ];

      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });

      const response = await ec2Client.send(command);

      allSubnetIds.forEach(subnetId => {
        const nacl = response.NetworkAcls!.find(nacl =>
          nacl.Associations?.some(assoc => assoc.SubnetId === subnetId)
        );

        expect(nacl).toBeDefined();
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs should be enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filters: [
          { Name: 'resource-id', Values: [outputs.VPCId] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toHaveLength(1);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('CloudWatch Log Group should exist with correct retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.VPCFlowLogsLogGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toHaveLength(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.VPCFlowLogsLogGroupName);
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('End-to-End Network Connectivity', () => {
    test('all resources should be in the correct VPC', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      expect(subnetResponse.Subnets!.length).toBe(9);

      const natCommand = new DescribeNatGatewaysCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const natResponse = await ec2Client.send(natCommand);
      expect(natResponse.NatGateways!.length).toBe(3);
    });

    test('infrastructure should support multi-AZ deployment', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
        outputs.DatabaseSubnet1Id,
        outputs.DatabaseSubnet2Id,
        outputs.DatabaseSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBe(3);

      const publicAzs = new Set(
        response.Subnets!
          .filter(s => [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id].includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      expect(publicAzs.size).toBe(3);

      const privateAzs = new Set(
        response.Subnets!
          .filter(s => [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id].includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      expect(privateAzs.size).toBe(3);

      const databaseAzs = new Set(
        response.Subnets!
          .filter(s => [outputs.DatabaseSubnet1Id, outputs.DatabaseSubnet2Id, outputs.DatabaseSubnet3Id].includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      expect(databaseAzs.size).toBe(3);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      expect(vpcTags.find(t => t.Key === 'Environment')).toBeDefined();
      expect(vpcTags.find(t => t.Key === 'Project')).toBeDefined();
      expect(vpcTags.find(t => t.Key === 'CostCenter')).toBeDefined();
    });

    test('all resources should have environmentSuffix in names', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcName = vpcResponse.Vpcs![0].Tags?.find(t => t.Key === 'Name')?.Value;

      expect(vpcName).toContain(environmentSuffix);
    });
  });
});
