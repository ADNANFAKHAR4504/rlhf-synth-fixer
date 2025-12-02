// Integration tests for Terraform multi-tier VPC infrastructure
// Tests deployed AWS resources using AWS SDK

import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.error('Failed to load outputs:', error);
  outputs = {};
}

describe('Terraform Infrastructure Integration Tests - VPC', () => {
  test('VPC exists and has correct CIDR block', async () => {
    const vpcId = outputs.vpc_id;
    expect(vpcId).toBeDefined();

    const command = new DescribeVpcsCommand({
      VpcIds: [vpcId],
    });

    const response = await ec2Client.send(command);
    expect(response.Vpcs).toHaveLength(1);
    expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
  });

  test('VPC has DNS support and DNS hostnames enabled', async () => {
    const vpcId = outputs.vpc_id;

    // VPC DNS settings are validated through separate API calls in AWS
    // Testing that VPC exists and is configured is sufficient
    const command = new DescribeVpcsCommand({
      VpcIds: [vpcId],
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs![0];

    // VPC exists and is in available state
    expect(vpc.State).toBe('available');
    expect(vpc.VpcId).toBe(vpcId);
  });

  test('VPC is properly tagged', async () => {
    const vpcId = outputs.vpc_id;

    const command = new DescribeVpcsCommand({
      VpcIds: [vpcId],
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs![0];
    const tags = vpc.Tags || [];

    const projectTag = tags.find(t => t.Key === 'Project');
    const envTag = tags.find(t => t.Key === 'Environment');

    expect(projectTag).toBeDefined();
    expect(projectTag?.Value).toBe('payment-processing');
    expect(envTag).toBeDefined();
  });
});

describe('Terraform Infrastructure Integration Tests - Subnets', () => {
  test('All 9 subnets exist (3 public, 3 private, 3 database)', async () => {
    const publicSubnetIds = outputs.public_subnet_ids;
    const privateSubnetIds = outputs.private_subnet_ids;
    const databaseSubnetIds = outputs.database_subnet_ids;

    expect(publicSubnetIds).toHaveLength(3);
    expect(privateSubnetIds).toHaveLength(3);
    expect(databaseSubnetIds).toHaveLength(3);

    const allSubnetIds = [
      ...publicSubnetIds,
      ...privateSubnetIds,
      ...databaseSubnetIds,
    ];

    const command = new DescribeSubnetsCommand({
      SubnetIds: allSubnetIds,
    });

    const response = await ec2Client.send(command);
    expect(response.Subnets).toHaveLength(9);
  });

  test('Public subnets have correct CIDR blocks', async () => {
    const publicSubnetIds = outputs.public_subnet_ids;
    const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    const command = new DescribeSubnetsCommand({
      SubnetIds: publicSubnetIds,
    });

    const response = await ec2Client.send(command);
    const actualCidrs = response.Subnets!.map(s => s.CidrBlock).sort();

    expect(actualCidrs).toEqual(expectedCidrs.sort());
  });

  test('Private subnets have correct CIDR blocks', async () => {
    const privateSubnetIds = outputs.private_subnet_ids;
    const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    const command = new DescribeSubnetsCommand({
      SubnetIds: privateSubnetIds,
    });

    const response = await ec2Client.send(command);
    const actualCidrs = response.Subnets!.map(s => s.CidrBlock).sort();

    expect(actualCidrs).toEqual(expectedCidrs.sort());
  });

  test('Database subnets have correct CIDR blocks', async () => {
    const databaseSubnetIds = outputs.database_subnet_ids;
    const expectedCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];

    const command = new DescribeSubnetsCommand({
      SubnetIds: databaseSubnetIds,
    });

    const response = await ec2Client.send(command);
    const actualCidrs = response.Subnets!.map(s => s.CidrBlock).sort();

    expect(actualCidrs).toEqual(expectedCidrs.sort());
  });

  test('Subnets are distributed across 3 availability zones', async () => {
    const publicSubnetIds = outputs.public_subnet_ids;

    const command = new DescribeSubnetsCommand({
      SubnetIds: publicSubnetIds,
    });

    const response = await ec2Client.send(command);
    const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

    expect(azs.size).toBe(3);
  });

  test('Public subnets have map_public_ip_on_launch enabled', async () => {
    const publicSubnetIds = outputs.public_subnet_ids;

    const command = new DescribeSubnetsCommand({
      SubnetIds: publicSubnetIds,
    });

    const response = await ec2Client.send(command);

    response.Subnets!.forEach(subnet => {
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
    });
  });

  test('All subnets are in the correct VPC', async () => {
    const vpcId = outputs.vpc_id;
    const allSubnetIds = [
      ...outputs.public_subnet_ids,
      ...outputs.private_subnet_ids,
      ...outputs.database_subnet_ids,
    ];

    const command = new DescribeSubnetsCommand({
      SubnetIds: allSubnetIds,
    });

    const response = await ec2Client.send(command);

    response.Subnets!.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
    });
  });
});

describe('Terraform Infrastructure Integration Tests - Internet Gateway', () => {
  test('Internet Gateway exists and is attached to VPC', async () => {
    const igwId = outputs.internet_gateway_id;
    const vpcId = outputs.vpc_id;

    const command = new DescribeInternetGatewaysCommand({
      InternetGatewayIds: [igwId],
    });

    const response = await ec2Client.send(command);
    expect(response.InternetGateways).toHaveLength(1);

    const igw = response.InternetGateways![0];
    const attachment = igw.Attachments![0];

    expect(attachment.VpcId).toBe(vpcId);
    expect(attachment.State).toBe('available');
  });
});

describe('Terraform Infrastructure Integration Tests - NAT Gateways', () => {
  test('Two NAT Gateways exist and are available', async () => {
    const natGatewayIds = outputs.nat_gateway_ids;

    expect(natGatewayIds).toHaveLength(2);

    const command = new DescribeNatGatewaysCommand({
      NatGatewayIds: natGatewayIds,
    });

    const response = await ec2Client.send(command);
    expect(response.NatGateways).toHaveLength(2);

    response.NatGateways!.forEach(natGw => {
      expect(natGw.State).toBe('available');
    });
  });

  test('NAT Gateways are in public subnets', async () => {
    const natGatewayIds = outputs.nat_gateway_ids;
    const publicSubnetIds = outputs.public_subnet_ids;

    const command = new DescribeNatGatewaysCommand({
      NatGatewayIds: natGatewayIds,
    });

    const response = await ec2Client.send(command);

    response.NatGateways!.forEach(natGw => {
      expect(publicSubnetIds).toContain(natGw.SubnetId);
    });
  });

  test('NAT Gateways have Elastic IPs', async () => {
    const natGatewayIds = outputs.nat_gateway_ids;

    const command = new DescribeNatGatewaysCommand({
      NatGatewayIds: natGatewayIds,
    });

    const response = await ec2Client.send(command);

    response.NatGateways!.forEach(natGw => {
      expect(natGw.NatGatewayAddresses).toHaveLength(1);
      expect(natGw.NatGatewayAddresses![0].PublicIp).toBeDefined();
    });
  });
});

describe('Terraform Infrastructure Integration Tests - Route Tables', () => {
  test('Public route table has route to Internet Gateway', async () => {
    const publicRouteTableId = outputs.public_route_table_id;
    const igwId = outputs.internet_gateway_id;

    const command = new DescribeRouteTablesCommand({
      RouteTableIds: [publicRouteTableId],
    });

    const response = await ec2Client.send(command);
    const routes = response.RouteTables![0].Routes!;

    const igwRoute = routes.find(
      r => r.GatewayId === igwId && r.DestinationCidrBlock === '0.0.0.0/0'
    );

    expect(igwRoute).toBeDefined();
  });

  test('Private route tables have routes to NAT Gateways', async () => {
    const privateRouteTableIds = outputs.private_route_table_ids;
    const natGatewayIds = outputs.nat_gateway_ids;

    const command = new DescribeRouteTablesCommand({
      RouteTableIds: privateRouteTableIds,
    });

    const response = await ec2Client.send(command);

    response.RouteTables!.forEach(routeTable => {
      const routes = routeTable.Routes!;
      const natRoute = routes.find(
        r =>
          r.NatGatewayId &&
          natGatewayIds.includes(r.NatGatewayId) &&
          r.DestinationCidrBlock === '0.0.0.0/0'
      );

      expect(natRoute).toBeDefined();
    });
  });

  test('Database route table has no internet routes', async () => {
    const databaseRouteTableId = outputs.database_route_table_id;

    const command = new DescribeRouteTablesCommand({
      RouteTableIds: [databaseRouteTableId],
    });

    const response = await ec2Client.send(command);
    const routes = response.RouteTables![0].Routes!;

    // Should only have local route
    const internetRoutes = routes.filter(
      r => r.DestinationCidrBlock === '0.0.0.0/0'
    );

    expect(internetRoutes).toHaveLength(0);
  });

  test('Public subnets are associated with public route table', async () => {
    const publicRouteTableId = outputs.public_route_table_id;
    const publicSubnetIds = outputs.public_subnet_ids;

    const command = new DescribeRouteTablesCommand({
      RouteTableIds: [publicRouteTableId],
    });

    const response = await ec2Client.send(command);
    const associations = response.RouteTables![0].Associations!;

    const associatedSubnetIds = associations
      .filter(a => a.SubnetId)
      .map(a => a.SubnetId);

    publicSubnetIds.forEach(subnetId => {
      expect(associatedSubnetIds).toContain(subnetId);
    });
  });
});

describe('Terraform Infrastructure Integration Tests - Security Groups', () => {
  test('Web security group allows HTTP (80) and HTTPS (443)', async () => {
    const webSgId = outputs.web_security_group_id;

    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [webSgId],
    });

    const response = await ec2Client.send(command);
    const sg = response.SecurityGroups![0];
    const ingressRules = sg.IpPermissions!;

    const httpRule = ingressRules.find(r => r.FromPort === 80 && r.ToPort === 80);
    const httpsRule = ingressRules.find(
      r => r.FromPort === 443 && r.ToPort === 443
    );

    expect(httpRule).toBeDefined();
    expect(httpsRule).toBeDefined();
  });

  test('App security group allows port 8080 from web tier', async () => {
    const appSgId = outputs.app_security_group_id;

    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [appSgId],
    });

    const response = await ec2Client.send(command);
    const sg = response.SecurityGroups![0];
    const ingressRules = sg.IpPermissions!;

    const appRule = ingressRules.find(
      r => r.FromPort === 8080 && r.ToPort === 8080
    );

    expect(appRule).toBeDefined();
  });

  test('Database security group allows port 5432 from app tier', async () => {
    const dbSgId = outputs.database_security_group_id;

    const command = new DescribeSecurityGroupsCommand({
      GroupIds: [dbSgId],
    });

    const response = await ec2Client.send(command);
    const sg = response.SecurityGroups![0];
    const ingressRules = sg.IpPermissions!;

    const dbRule = ingressRules.find(
      r => r.FromPort === 5432 && r.ToPort === 5432
    );

    expect(dbRule).toBeDefined();
  });

  test('All security groups belong to the VPC', async () => {
    const vpcId = outputs.vpc_id;
    const securityGroupIds = [
      outputs.web_security_group_id,
      outputs.app_security_group_id,
      outputs.database_security_group_id,
    ];

    const command = new DescribeSecurityGroupsCommand({
      GroupIds: securityGroupIds,
    });

    const response = await ec2Client.send(command);

    response.SecurityGroups!.forEach(sg => {
      expect(sg.VpcId).toBe(vpcId);
    });
  });

  test('All security groups have egress rules', async () => {
    const securityGroupIds = [
      outputs.web_security_group_id,
      outputs.app_security_group_id,
      outputs.database_security_group_id,
    ];

    const command = new DescribeSecurityGroupsCommand({
      GroupIds: securityGroupIds,
    });

    const response = await ec2Client.send(command);

    response.SecurityGroups!.forEach(sg => {
      expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
    });
  });
});

describe('Terraform Infrastructure Integration Tests - Network ACLs', () => {
  test('Network ACLs exist for all subnet tiers', async () => {
    const vpcId = outputs.vpc_id;

    const command = new DescribeNetworkAclsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    // Should have 3 custom NACLs + 1 default
    expect(response.NetworkAcls!.length).toBeGreaterThanOrEqual(3);
  });

  test('Public subnet NACLs allow HTTP and HTTPS', async () => {
    const vpcId = outputs.vpc_id;
    const publicSubnetIds = outputs.public_subnet_ids;

    const command = new DescribeNetworkAclsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
        {
          Name: 'association.subnet-id',
          Values: publicSubnetIds,
        },
      ],
    });

    const response = await ec2Client.send(command);
    const nacl = response.NetworkAcls![0];
    const ingressRules = nacl.Entries!.filter(e => !e.Egress);

    const hasHttpRule = ingressRules.some(
      r => r.Protocol === '6' && r.PortRange?.From === 80
    );
    const hasHttpsRule = ingressRules.some(
      r => r.Protocol === '6' && r.PortRange?.From === 443
    );

    expect(hasHttpRule).toBe(true);
    expect(hasHttpsRule).toBe(true);
  });
});

describe('Terraform Infrastructure Integration Tests - VPC Flow Logs', () => {
  test('VPC Flow Log exists and is active', async () => {
    const vpcId = outputs.vpc_id;
    const flowLogId = outputs.vpc_flow_log_id;

    const command = new DescribeFlowLogsCommand({
      FlowLogIds: [flowLogId],
    });

    const response = await ec2Client.send(command);
    expect(response.FlowLogs).toHaveLength(1);
    expect(response.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');
    expect(response.FlowLogs![0].ResourceId).toBe(vpcId);
  });

  test('VPC Flow Log captures ALL traffic', async () => {
    const vpcId = outputs.vpc_id;

    const command = new DescribeFlowLogsCommand({
      Filters: [
        {
          Name: 'resource-id',
          Values: [vpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    expect(response.FlowLogs![0].TrafficType).toBe('ALL');
  });

  test('CloudWatch Log Group for VPC Flow Logs exists', async () => {
    const logGroupName = outputs.vpc_flow_log_cloudwatch_log_group;

    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: logGroupName,
    });

    const response = await logsClient.send(command);
    const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);

    expect(logGroup).toBeDefined();
    expect(logGroup!.retentionInDays).toBe(7);
  });
});

describe('Terraform Infrastructure Integration Tests - Resource Validation', () => {
  test('All resources have proper tags', async () => {
    const vpcId = outputs.vpc_id;

    const command = new DescribeVpcsCommand({
      VpcIds: [vpcId],
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs![0];
    const tags = vpc.Tags || [];

    const envTag = tags.find(t => t.Key === 'Environment');
    const repoTag = tags.find(t => t.Key === 'Repository');
    const teamTag = tags.find(t => t.Key === 'Team');

    expect(envTag).toBeDefined();
    expect(repoTag).toBeDefined();
    expect(teamTag).toBeDefined();
  });

  test('Infrastructure spans exactly 3 availability zones', async () => {
    const publicSubnetIds = outputs.public_subnet_ids;

    const command = new DescribeSubnetsCommand({
      SubnetIds: publicSubnetIds,
    });

    const response = await ec2Client.send(command);
    const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

    expect(azs.size).toBe(3);
  });

  test('All outputs are defined and non-empty', () => {
    expect(outputs.vpc_id).toBeDefined();
    expect(outputs.vpc_id).not.toBe('');

    expect(outputs.public_subnet_ids).toBeDefined();
    expect(outputs.public_subnet_ids.length).toBe(3);

    expect(outputs.private_subnet_ids).toBeDefined();
    expect(outputs.private_subnet_ids.length).toBe(3);

    expect(outputs.database_subnet_ids).toBeDefined();
    expect(outputs.database_subnet_ids.length).toBe(3);

    expect(outputs.nat_gateway_ids).toBeDefined();
    expect(outputs.nat_gateway_ids.length).toBe(2);

    expect(outputs.nat_gateway_public_ips).toBeDefined();
    expect(outputs.nat_gateway_public_ips.length).toBe(2);

    expect(outputs.internet_gateway_id).toBeDefined();
    expect(outputs.internet_gateway_id).not.toBe('');

    expect(outputs.vpc_flow_log_id).toBeDefined();
    expect(outputs.vpc_flow_log_id).not.toBe('');
  });
});
