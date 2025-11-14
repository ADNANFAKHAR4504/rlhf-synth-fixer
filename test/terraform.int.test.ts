import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

describe('Terraform VPC Infrastructure Integration Tests', () => {

  describe('VPC Configuration', () => {
    test('VPC exists and has correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC has DNS support enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];

      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('VPC has correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];

      const tags = vpc.Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const costTag = tags.find(t => t.Key === 'CostCenter');

      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe('production');
      expect(costTag).toBeDefined();
      expect(costTag?.Value).toBe('banking');
    });
  });

  describe('Subnet Configuration', () => {
    test('three public subnets exist in different AZs', async () => {
      const subnetIds = [
        outputs.public_subnet_id_0,
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    test('public subnets have correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.public_subnet_id_0,
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      const cidrs = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('public subnets have map public IP enabled', async () => {
      const subnetIds = [
        outputs.public_subnet_id_0,
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('three private subnets exist in different AZs', async () => {
      const subnetIds = [
        outputs.private_subnet_id_0,
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']);
    });

    test('private subnets have correct CIDR blocks', async () => {
      const subnetIds = [
        outputs.private_subnet_id_0,
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      const cidrs = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrs).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.InternetGatewayId).toBe(outputs.internet_gateway_id);
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('NAT Gateways', () => {
    test('three NAT Gateways exist', async () => {
      const natIds = [
        outputs.nat_gateway_id_0,
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natIds
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(3);
    });

    test('NAT Gateways are in different AZs', async () => {
      const natIds = [
        outputs.nat_gateway_id_0,
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natIds
      });

      const response = await ec2Client.send(command);
      const azs = response.NatGateways!.map(n => n.SubnetId).sort();

      expect(new Set(azs).size).toBe(3);
    });

    test('NAT Gateways have Elastic IPs attached', async () => {
      const natIds = [
        outputs.nat_gateway_id_0,
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natIds
      });

      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(nat => {
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeTruthy();
        expect(nat.State).toBe('available');
      });
    });

    test('Elastic IPs match deployment outputs', async () => {
      const expectedIPs = [
        outputs.elastic_ip_0,
        outputs.elastic_ip_1,
        outputs.elastic_ip_2
      ].sort();

      const natIds = [
        outputs.nat_gateway_id_0,
        outputs.nat_gateway_id_1,
        outputs.nat_gateway_id_2
      ];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natIds
      });

      const response = await ec2Client.send(command);
      const actualIPs = response.NatGateways!
        .map(n => n.NatGatewayAddresses![0].PublicIp!)
        .sort();

      expect(actualIPs).toEqual(expectedIPs);
    });
  });

  describe('Route Tables', () => {
    test('public route table routes traffic to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id]
      });

      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables![0];

      const igwRoute = routeTable.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.GatewayId).toBe(outputs.internet_gateway_id);
      expect(igwRoute!.State).toBe('active');
    });

    test('public route table is associated with public subnets', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id]
      });

      const response = await ec2Client.send(command);
      const routeTable = response.RouteTables![0];

      const associations = routeTable.Associations!.filter(a => a.SubnetId);
      expect(associations.length).toBeGreaterThanOrEqual(3);
    });

    test('private route tables route traffic to NAT Gateways', async () => {
      const privateRtIds = [
        outputs.private_route_table_id_0,
        outputs.private_route_table_id_1,
        outputs.private_route_table_id_2
      ];

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: privateRtIds
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toHaveLength(3);

      response.RouteTables!.forEach(rt => {
        const natRoute = rt.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toBeTruthy();
        expect(natRoute!.State).toBe('active');
      });
    });
  });

  describe('Network ACLs', () => {
    test('Network ACL exists and is associated with public subnets', async () => {
      const command = new DescribeNetworkAclsCommand({
        NetworkAclIds: [outputs.network_acl_id]
      });

      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls![0];

      expect(nacl.NetworkAclId).toBe(outputs.network_acl_id);
      expect(nacl.Associations!.length).toBeGreaterThanOrEqual(3);
    });

    test('Network ACL allows HTTP inbound', async () => {
      const command = new DescribeNetworkAclsCommand({
        NetworkAclIds: [outputs.network_acl_id]
      });

      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls![0];

      const httpRule = nacl.Entries!.find(e =>
        !e.Egress &&
        e.Protocol === '6' &&
        e.PortRange?.From === 80 &&
        e.RuleAction === 'allow'
      );

      expect(httpRule).toBeDefined();
    });

    test('Network ACL allows HTTPS inbound', async () => {
      const command = new DescribeNetworkAclsCommand({
        NetworkAclIds: [outputs.network_acl_id]
      });

      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls![0];

      const httpsRule = nacl.Entries!.find(e =>
        !e.Egress &&
        e.Protocol === '6' &&
        e.PortRange?.From === 443 &&
        e.RuleAction === 'allow'
      );

      expect(httpsRule).toBeDefined();
    });

    test('Network ACL allows ephemeral ports inbound', async () => {
      const command = new DescribeNetworkAclsCommand({
        NetworkAclIds: [outputs.network_acl_id]
      });

      const response = await ec2Client.send(command);
      const nacl = response.NetworkAcls![0];

      const ephemeralRule = nacl.Entries!.find(e =>
        !e.Egress &&
        e.Protocol === '6' &&
        e.PortRange?.From === 1024 &&
        e.RuleAction === 'allow'
      );

      expect(ephemeralRule).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('CloudWatch Log Group exists with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.flow_log_cloudwatch_log_group
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toHaveLength(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.flow_log_cloudwatch_log_group);
      expect(logGroup.retentionInDays).toBe(7);
    });

    test('IAM role for Flow Logs exists', async () => {
      const roleName = outputs.flow_log_cloudwatch_log_group.split('/').pop()?.replace('flow-logs-', 'vpc-flow-logs-role-');

      if (roleName) {
        const command = new GetRoleCommand({
          RoleName: roleName
        });

        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
      }
    });
  });

  describe('Resource Naming and Tags', () => {
    test('all resources use environment suffix in naming', () => {
      expect(outputs.vpc_id).toBeTruthy();
      expect(outputs.flow_log_cloudwatch_log_group).toContain('synth');
    });

    test('resources have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const hasEnvironmentTag = tags.some(t => t.Key === 'Environment');
      const hasCostCenterTag = tags.some(t => t.Key === 'CostCenter');

      expect(hasEnvironmentTag).toBe(true);
      expect(hasCostCenterTag).toBe(true);
    });
  });

  describe('Multi-AZ Deployment', () => {
    test('infrastructure spans three availability zones', async () => {
      const allSubnetIds = [
        outputs.public_subnet_id_0,
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.private_subnet_id_0,
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBe(3);
      expect(azs.has('us-east-1a')).toBe(true);
      expect(azs.has('us-east-1b')).toBe(true);
      expect(azs.has('us-east-1c')).toBe(true);
    });

    test('each AZ has both public and private subnets', async () => {
      const azSubnets: { [az: string]: number } = {};

      const allSubnetIds = [
        outputs.public_subnet_id_0,
        outputs.public_subnet_id_1,
        outputs.public_subnet_id_2,
        outputs.private_subnet_id_0,
        outputs.private_subnet_id_1,
        outputs.private_subnet_id_2
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        azSubnets[az] = (azSubnets[az] || 0) + 1;
      });

      expect(azSubnets['us-east-1a']).toBe(2);
      expect(azSubnets['us-east-1b']).toBe(2);
      expect(azSubnets['us-east-1c']).toBe(2);
    });
  });
});
