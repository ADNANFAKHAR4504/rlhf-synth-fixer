import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeNetworkAclsCommand, DescribeFlowLogsCommand } from '@aws-sdk/client-ec2';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs[0].EnableDnsSupport).toBe(true);
      expect(response.Vpcs[0].EnableDnsHostnames).toBe(true);
    });
  });

  describe('Subnets', () => {
    test('should have 6 subnets total', async () => {
      const publicSubnets = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];
      const privateSubnets = [
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ];

      const allSubnetIds = [...publicSubnets, ...privateSubnets];
      expect(allSubnetIds.length).toBe(6);
      allSubnetIds.forEach(id => expect(id).toBeDefined());
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24']);
    });

    test('subnets should be in correct availability zones', async () => {
      const publicA = outputs.PublicSubnetAId;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicA] })
      );

      expect(response.Subnets[0].AvailabilityZone).toBe('us-east-1a');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const subnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch', async () => {
      const subnetIds = [
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('NAT Gateways', () => {
    test('should have 3 NAT Gateways in available state', async () => {
      const natGatewayIds = [
        outputs.NatGatewayAId,
        outputs.NatGatewayBId,
        outputs.NatGatewayCId
      ];

      expect(natGatewayIds.length).toBe(3);

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );

      expect(response.NatGateways.length).toBe(3);
      response.NatGateways.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const natGatewayIds = [
        outputs.NatGatewayAId,
        outputs.NatGatewayBId,
        outputs.NatGatewayCId
      ];
      const publicSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );

      response.NatGateways.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test('NAT Gateways should have Elastic IPs attached', async () => {
      const natGatewayIds = [
        outputs.NatGatewayAId,
        outputs.NatGatewayBId,
        outputs.NatGatewayCId
      ];

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );

      response.NatGateways.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses[0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const igwId = outputs.InternetGatewayId;
      const vpcId = outputs.VPCId;
      expect(igwId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
      );

      expect(response.InternetGateways.length).toBe(1);
      expect(response.InternetGateways[0].Attachments.length).toBe(1);
      expect(response.InternetGateways[0].Attachments[0].VpcId).toBe(vpcId);
      expect(response.InternetGateways[0].Attachments[0].State).toBe('available');
    });
  });

  describe('Route Tables', () => {
    test('should have route tables for all subnets', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      expect(response.RouteTables.length).toBeGreaterThanOrEqual(4);
    });

    test('public route table should have route to IGW', async () => {
      const vpcId = outputs.VPCId;
      const igwId = outputs.InternetGatewayId;
      const publicSubnetId = outputs.PublicSubnetAId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [publicSubnetId] }
          ]
        })
      );

      expect(response.RouteTables.length).toBe(1);
      const routes = response.RouteTables[0].Routes;
      const igwRoute = routes.find(r => r.GatewayId === igwId);
      expect(igwRoute).toBeDefined();
      expect(igwRoute.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private route tables should have routes to NAT Gateways', async () => {
      const privateSubnetId = outputs.PrivateSubnetAId;
      const natGatewayId = outputs.NatGatewayAId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [privateSubnetId] }
          ]
        })
      );

      expect(response.RouteTables.length).toBe(1);
      const routes = response.RouteTables[0].Routes;
      const natRoute = routes.find(r => r.NatGatewayId === natGatewayId);
      expect(natRoute).toBeDefined();
      expect(natRoute.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Network ACLs', () => {
    test('VPC should have custom Network ACLs', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      const customNacls = response.NetworkAcls.filter(nacl => !nacl.IsDefault);
      expect(customNacls.length).toBeGreaterThan(0);
    });

    test('custom Network ACL should deny SSH from 0.0.0.0/0', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      const customNacls = response.NetworkAcls.filter(nacl => !nacl.IsDefault);
      expect(customNacls.length).toBeGreaterThan(0);

      const nacl = customNacls[0];
      const sshDenyRule = nacl.Entries.find(entry =>
        !entry.Egress &&
        entry.RuleNumber === 100 &&
        entry.Protocol === '6' && // TCP
        entry.RuleAction === 'deny'
      );

      expect(sshDenyRule).toBeDefined();
      expect(sshDenyRule.PortRange.From).toBe(22);
      expect(sshDenyRule.PortRange.To).toBe(22);
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC should have Flow Logs enabled', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filters: [{ Name: 'resource-id', Values: [vpcId] }]
        })
      );

      expect(response.FlowLogs.length).toBeGreaterThan(0);
      expect(response.FlowLogs[0].TrafficType).toBe('ALL');
      expect(response.FlowLogs[0].LogDestinationType).toBe('cloud-watch-logs');
    });

    test('CloudWatch Log Group should exist for Flow Logs', async () => {
      const logGroupName = outputs.VPCFlowLogsLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        })
      );

      expect(response.logGroups.length).toBeGreaterThan(0);
      expect(response.logGroups[0].logGroupName).toBe(logGroupName);
      expect(response.logGroups[0].retentionInDays).toBe(7);
    });

    test('IAM Role for Flow Logs should exist', async () => {
      const roleName = `vpc-flowlogs-role-${environmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have correct tags', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const tags = response.Vpcs[0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const costTag = tags.find(t => t.Key === 'CostCenter');
      const nameTag = tags.find(t => t.Key === 'Name');

      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');

      expect(costTag).toBeDefined();
      expect(costTag.Value).toBe('Infrastructure');

      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain(environmentSuffix);
    });

    test('subnets should have correct tags', async () => {
      const subnetId = outputs.PublicSubnetAId;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [subnetId] })
      );

      const tags = response.Subnets[0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const costTag = tags.find(t => t.Key === 'CostCenter');

      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');

      expect(costTag).toBeDefined();
      expect(costTag.Value).toBe('Infrastructure');
    });
  });

  describe('High Availability', () => {
    test('resources should be distributed across 3 availability zones', async () => {
      const subnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const azs = response.Subnets.map(s => s.AvailabilityZone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    test('each private subnet should have its own NAT Gateway', async () => {
      const privateSubnets = [
        { id: outputs.PrivateSubnetAId, nat: outputs.NatGatewayAId },
        { id: outputs.PrivateSubnetBId, nat: outputs.NatGatewayBId },
        { id: outputs.PrivateSubnetCId, nat: outputs.NatGatewayCId }
      ];

      for (const subnet of privateSubnets) {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: 'association.subnet-id', Values: [subnet.id] }
            ]
          })
        );

        const routes = response.RouteTables[0].Routes;
        const natRoute = routes.find(r => r.NatGatewayId === subnet.nat);
        expect(natRoute).toBeDefined();
      }
    });
  });
});
