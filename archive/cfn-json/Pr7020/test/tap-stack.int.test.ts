import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  IAMClient
} from '@aws-sdk/client-iam';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const EnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC', () => {
    test('VPC should exist and have correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      expect(tags.some(t => t.Key === 'Environment')).toBe(true);
      expect(tags.some(t => t.Key === 'Department')).toBe(true);
    });
  });

  describe('Subnets', () => {
    test('all 6 subnets should exist', async () => {
      const subnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(6);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should have MapPublicIpOnLaunch disabled', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets should be in correct availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(azs.filter(az => az === 'us-east-1a')).toHaveLength(2);
      expect(azs.filter(az => az === 'us-east-1b')).toHaveLength(2);
      expect(azs.filter(az => az === 'us-east-1c')).toHaveLength(2);
    });

    test('all subnets should belong to the VPC', async () => {
      const allSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('NAT Gateways', () => {
    test('all 3 NAT Gateways should exist and be available', async () => {
      const natGatewayIds = [
        outputs.NATGatewayAZ1Id,
        outputs.NATGatewayAZ2Id,
        outputs.NATGatewayAZ3Id
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(3);
      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const natGatewayIds = [
        outputs.NATGatewayAZ1Id,
        outputs.NATGatewayAZ2Id,
        outputs.NATGatewayAZ3Id
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      const subnetIds = response.NatGateways!.map(ng => ng.SubnetId);
      expect(subnetIds).toContain(outputs.PublicSubnetAZ1Id);
      expect(subnetIds).toContain(outputs.PublicSubnetAZ2Id);
      expect(subnetIds).toContain(outputs.PublicSubnetAZ3Id);
    });

    test('NAT Gateways should have Elastic IPs', async () => {
      const natGatewayIds = [
        outputs.NATGatewayAZ1Id,
        outputs.NATGatewayAZ2Id,
        outputs.NATGatewayAZ3Id
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
        expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });

    test('NAT Gateways should be in different AZs', async () => {
      const natGatewayIds = [
        outputs.NATGatewayAZ1Id,
        outputs.NATGatewayAZ2Id,
        outputs.NATGatewayAZ3Id
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      const subnetIds = response.NatGateways!.map(ng => ng.SubnetId);

      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      const azs = subnetsResponse.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(3);
    });
  });

  describe('Route Tables', () => {
    test('public subnets should route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.PublicSubnetAZ1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(1);
      const routeTable = response.RouteTables![0];

      const defaultRoute = routeTable.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute!.GatewayId).toBe(outputs.InternetGatewayId);
    });

    test('private subnets should route to NAT Gateways', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      for (const subnetId of privateSubnetIds) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId]
            },
            {
              Name: 'association.subnet-id',
              Values: [subnetId]
            }
          ]
        });
        const response = await ec2Client.send(command);

        expect(response.RouteTables).toHaveLength(1);
        const routeTable = response.RouteTables![0];

        const defaultRoute = routeTable.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute!.NatGatewayId).toBeDefined();
      }
    });

    test('each private subnet should have its own route table', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const routeTableIds = new Set();

      for (const subnetId of privateSubnetIds) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnetId]
            }
          ]
        });
        const response = await ec2Client.send(command);
        routeTableIds.add(response.RouteTables![0].RouteTableId);
      }

      expect(routeTableIds.size).toBe(3);
    });

    test('private routes should point to NAT Gateways in same AZ', async () => {
      const privateSubnetToNATMapping = [
        { subnetId: outputs.PrivateSubnetAZ1Id, natGatewayId: outputs.NATGatewayAZ1Id },
        { subnetId: outputs.PrivateSubnetAZ2Id, natGatewayId: outputs.NATGatewayAZ2Id },
        { subnetId: outputs.PrivateSubnetAZ3Id, natGatewayId: outputs.NATGatewayAZ3Id }
      ];

      for (const mapping of privateSubnetToNATMapping) {
        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [mapping.subnetId]
            }
          ]
        });
        const response = await ec2Client.send(command);

        const routeTable = response.RouteTables![0];
        const defaultRoute = routeTable.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute!.NatGatewayId).toBe(mapping.natGatewayId);
      }
    });
  });

  describe('Network ACLs', () => {
    test('public subnets should have custom Network ACL', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.PublicSubnetAZ1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.NetworkAcls).toHaveLength(1);
      const nacl = response.NetworkAcls![0];
      expect(nacl.IsDefault).toBe(false);
    });

    test('private subnets should have custom Network ACL', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.PrivateSubnetAZ1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.NetworkAcls).toHaveLength(1);
      const nacl = response.NetworkAcls![0];
      expect(nacl.IsDefault).toBe(false);
    });

    test('public NACL should allow HTTP, HTTPS, and SSH', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'association.subnet-id',
            Values: [outputs.PublicSubnetAZ1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const nacl = response.NetworkAcls![0];
      const ingressRules = nacl.Entries!.filter(e => !e.Egress);

      const httpRule = ingressRules.find(r =>
        r.PortRange?.From === 80 && r.PortRange?.To === 80 && r.RuleAction === 'allow'
      );
      expect(httpRule).toBeDefined();

      const httpsRule = ingressRules.find(r =>
        r.PortRange?.From === 443 && r.PortRange?.To === 443 && r.RuleAction === 'allow'
      );
      expect(httpsRule).toBeDefined();

      const sshRule = ingressRules.find(r =>
        r.PortRange?.From === 22 && r.PortRange?.To === 22 && r.RuleAction === 'allow'
      );
      expect(sshRule).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('CloudWatch Log Group should exist with 30-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.VPCFlowLogGroupName
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('High Availability', () => {
    test('infrastructure should span 3 availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('each AZ should have both public and private subnets', async () => {
      const azToSubnets: { [key: string]: { public: string[], private: string[] } } = {
        'us-east-1a': { public: [], private: [] },
        'us-east-1b': { public: [], private: [] },
        'us-east-1c': { public: [], private: [] }
      };

      const allSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PublicSubnetAZ3Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        if (subnet.MapPublicIpOnLaunch) {
          azToSubnets[az].public.push(subnet.SubnetId!);
        } else {
          azToSubnets[az].private.push(subnet.SubnetId!);
        }
      });

      Object.values(azToSubnets).forEach(subnets => {
        expect(subnets.public).toHaveLength(1);
        expect(subnets.private).toHaveLength(1);
      });
    });

    test('each AZ should have its own NAT Gateway', async () => {
      const natGatewayIds = [
        outputs.NATGatewayAZ1Id,
        outputs.NATGatewayAZ2Id,
        outputs.NATGatewayAZ3Id
      ];

      const natCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const natResponse = await ec2Client.send(natCommand);

      const subnetIds = natResponse.NatGateways!.map(ng => ng.SubnetId!);

      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Resource Tags', () => {
    test('all resources should have Environment and Department tags', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      expect(vpcTags.some(t => t.Key === 'Environment')).toBe(true);
      expect(vpcTags.some(t => t.Key === 'Department')).toBe(true);
    });
  });

  describe('Connectivity', () => {
    test('VPC should have internet connectivity through IGW', async () => {
      const igwCommand = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      });
      const igwResponse = await ec2Client.send(igwCommand);

      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    test('private subnets should have outbound connectivity through NAT Gateways', async () => {
      const natGatewayIds = [
        outputs.NATGatewayAZ1Id,
        outputs.NATGatewayAZ2Id,
        outputs.NATGatewayAZ3Id
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.ConnectivityType).toBe('public');
      });
    });
  });
});
