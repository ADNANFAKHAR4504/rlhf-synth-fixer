import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthmgvf4';
const region = process.env.AWS_REGION || 'ca-central-1';

const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('VPC has correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs[0].Tags || [];
      const tagMap = Object.fromEntries(tags.map((t) => [t.Key, t.Value]));

      expect(tagMap.Environment).toBe('production');
      expect(tagMap.Project).toBe('financial-app');
      expect(tagMap.ManagedBy).toBe('cdk');
    });
  });

  describe('Subnet Configuration', () => {
    test('Public subnets exist and are in correct AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets.map((s) => s.AvailabilityZone).sort();
      expect(azs).toHaveLength(3);
      expect(new Set(azs).size).toBe(3); // All unique AZs
    });

    test('Private subnets exist and are in correct AZs', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets.map((s) => s.AvailabilityZone).sort();
      expect(azs).toHaveLength(3);
      expect(new Set(azs).size).toBe(3); // All unique AZs
    });

    test('Public subnets auto-assign public IPs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Private subnets do not auto-assign public IPs', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('Three NAT Gateways exist for high availability', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(3);

      response.NatGateways.forEach((natGw) => {
        expect(natGw.State).toBe('available');
      });
    });

    test('Each NAT Gateway is in a different public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const subnetIds = response.NatGateways.map((natGw) => natGw.SubnetId);
      expect(new Set(subnetIds).size).toBe(3); // All in different subnets
    });

    test('Each NAT Gateway has an Elastic IP', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      response.NatGateways.forEach((natGw) => {
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
        expect(natGw.NatGatewayAddresses[0].PublicIp).toBeTruthy();
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways[0].Attachments[0].State).toBe(
        'available'
      );
      expect(response.InternetGateways[0].Attachments[0].VpcId).toBe(
        outputs.VpcId
      );
    });
  });

  describe('Route Table Configuration', () => {
    test('Public subnets route to Internet Gateway', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: subnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(3);

      response.RouteTables.forEach((rt) => {
        const defaultRoute = rt.Routes.find(
          (r) => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.GatewayId).toMatch(/^igw-/);
      });
    });

    test('Private subnets route to NAT Gateway', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: subnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(3);

      response.RouteTables.forEach((rt) => {
        const defaultRoute = rt.Routes.find(
          (r) => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.NatGatewayId).toMatch(/^nat-/);
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('CloudWatch Log Group exists for VPC Flow Logs', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs/${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups[0].logGroupName).toBe(
        `/aws/vpc/flowlogs/${environmentSuffix}`
      );
      expect(response.logGroups[0].retentionInDays).toBe(30);
    });

    test('IAM Role exists for VPC Flow Logs', async () => {
      const command = new GetRoleCommand({
        RoleName: `vpc-flow-log-role-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(
        `vpc-flow-log-role-${environmentSuffix}`
      );
    });

    test('VPC Flow Log is enabled and capturing ALL traffic', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toHaveLength(1);
      expect(response.FlowLogs[0].FlowLogStatus).toBe('ACTIVE');
      expect(response.FlowLogs[0].TrafficType).toBe('ALL');
      expect(response.FlowLogs[0].LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Network ACL Configuration', () => {
    test('Network ACL exists for public subnets', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: subnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      // All public subnets should share the same custom NACL
      const naclIds = new Set(
        response.NetworkAcls.map((nacl) => nacl.NetworkAclId)
      );
      expect(naclIds.size).toBe(1); // Single shared NACL
    });

    test('Network ACL denies SSH from internet', async () => {
      const subnetIds = [outputs.PublicSubnet1Id];

      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: subnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      const nacl = response.NetworkAcls[0];
      const sshDenyRule = nacl.Entries.find(
        (entry) =>
          entry.PortRange?.From === 22 &&
          entry.PortRange?.To === 22 &&
          entry.Protocol === '6' &&
          entry.CidrBlock === '0.0.0.0/0' &&
          entry.RuleAction === 'deny' &&
          !entry.Egress
      );

      expect(sshDenyRule).toBeDefined();
      expect(sshDenyRule.RuleNumber).toBe(1);
    });
  });

  describe('Security Group Configuration', () => {
    test('Web Security Group exists with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];

      expect(sg.GroupName).toBe(`web-tier-sg-${environmentSuffix}`);

      // Check HTTP rule
      const httpRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.IpRanges[0].CidrIp).toBe('0.0.0.0/0');

      // Check HTTPS rule
      const httpsRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpRanges[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('App Security Group exists with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];

      expect(sg.GroupName).toBe(`app-tier-sg-${environmentSuffix}`);

      // Check HTTP rule from web tier
      const httpRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.UserIdGroupPairs[0].GroupId).toBe(
        outputs.WebSecurityGroupId
      );

      // Check HTTPS rule from web tier
      const httpsRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.UserIdGroupPairs[0].GroupId).toBe(
        outputs.WebSecurityGroupId
      );
    });

    test('App Security Group only accepts traffic from Web Security Group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups[0];

      sg.IpPermissions.forEach((rule) => {
        if (rule.IpRanges?.length > 0) {
          // Should not have any IP-based rules
          expect(rule.IpRanges).toHaveLength(0);
        }
        if (rule.UserIdGroupPairs?.length > 0) {
          // Should only reference web security group
          expect(rule.UserIdGroupPairs[0].GroupId).toBe(
            outputs.WebSecurityGroupId
          );
        }
      });
    });
  });

  describe('High Availability & Resilience', () => {
    test('Resources are distributed across 3 availability zones', () => {
      const azs = outputs.AvailabilityZones.split(',');
      expect(azs).toHaveLength(3);
      expect(new Set(azs).size).toBe(3); // All unique
    });

    test('VPC spans correct CIDR range', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs[0].CidrBlock).toBe(outputs.VpcCidr);
      expect(outputs.VpcCidr).toBe('10.0.0.0/16');
    });
  });
});
