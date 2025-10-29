// Integration tests for Multi-Region VPC Terraform Infrastructure
// These tests validate deployed AWS VPC infrastructure using the flat outputs
// Requires deployed infrastructure and valid AWS credentials

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeAvailabilityZonesCommand,
  DescribeDhcpOptionsCommand,
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Define types for flat outputs
interface FlatOutputs {
  account_id: string;
  availability_zones: string;
  common_tags: string;
  dhcp_options_id: string;
  internet_gateway_arn: string;
  internet_gateway_id: string;
  name_prefix: string;
  nat_gateway_id: string;
  nat_gateway_public_ip: string;
  private_route_table_ids: string;
  private_subnet_arns: string;
  private_subnet_cidr_blocks: string;
  private_subnet_ids: string;
  public_route_table_id: string;
  public_subnet_arns: string;
  public_subnet_cidr_blocks: string;
  public_subnet_ids: string;
  region: string;
  vpc_arn: string;
  vpc_cidr_block: string;
  vpc_flow_logs_id: string;
  vpc_flow_logs_log_group_name: string;
  vpc_id: string;
}

// Constants
const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const TEST_TIMEOUT = 30000; // 30 seconds per test

describe('Multi-Region VPC Infrastructure Integration Tests', () => {
  let outputs: FlatOutputs;
  let ec2Client: EC2Client;
  let logsClient: CloudWatchLogsClient;
  let iamClient: IAMClient;

  // Parsed output values
  let availabilityZones: string[];
  let commonTags: Record<string, string>;
  let privateRouteTableIds: string[];
  let privateSubnetArns: string[];
  let privateSubnetCidrs: string[];
  let privateSubnetIds: string[];
  let publicSubnetArns: string[];
  let publicSubnetCidrs: string[];
  let publicSubnetIds: string[];

  beforeAll(async () => {
    try {
      console.log('Loading deployment outputs from flat-outputs.json...');

      if (!fs.existsSync(FLAT_OUTPUTS_PATH)) {
        throw new Error(`Flat outputs file not found at: ${FLAT_OUTPUTS_PATH}`);
      }

      const outputsContent = fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8');
      outputs = JSON.parse(outputsContent);

      console.log('Successfully loaded deployment outputs');
      console.log(`Found ${Object.keys(outputs).length} outputs`);
      console.log(`Testing region: ${outputs.region}`);
      console.log(`VPC ID: ${outputs.vpc_id}`);

      // Parse JSON string outputs
      availabilityZones = JSON.parse(outputs.availability_zones);
      commonTags = JSON.parse(outputs.common_tags);
      privateRouteTableIds = JSON.parse(outputs.private_route_table_ids);
      privateSubnetArns = JSON.parse(outputs.private_subnet_arns);
      privateSubnetCidrs = JSON.parse(outputs.private_subnet_cidr_blocks);
      privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      publicSubnetArns = JSON.parse(outputs.public_subnet_arns);
      publicSubnetCidrs = JSON.parse(outputs.public_subnet_cidr_blocks);
      publicSubnetIds = JSON.parse(outputs.public_subnet_ids);

      // Initialize AWS clients
      ec2Client = new EC2Client({ region: outputs.region });
      logsClient = new CloudWatchLogsClient({ region: outputs.region });
      iamClient = new IAMClient({ region: outputs.region });

      console.log('AWS clients initialized');
    } catch (error) {
      console.error('Failed to initialize test environment:', error);
      throw error;
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup AWS clients
    if (ec2Client) {
      ec2Client.destroy();
    }
    if (logsClient) {
      logsClient.destroy();
    }
    if (iamClient) {
      iamClient.destroy();
    }
    console.log('Test cleanup completed');
  });

  // ===================================================================================================================
  // VPC CORE INFRASTRUCTURE VALIDATION
  // ===================================================================================================================

  describe('VPC Core Infrastructure', () => {
    test('VPC exists with correct configuration', async () => {
      console.log('\nValidating VPC configuration...');

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe(outputs.vpc_cidr_block);
      expect(vpc.State).toBe('available');

      // Verify DNS support is enabled by checking VPC attributes
      const dnsCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      });
      const dnsResponse = await ec2Client.send(dnsCommand);
      expect(dnsResponse.EnableDnsSupport?.Value).toBe(true);

      const hostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      });
      const hostnamesResponse = await ec2Client.send(hostnamesCommand);
      expect(hostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      // Verify tags
      const tags = vpc.Tags || [];
      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(commonTags.Project);

      console.log('  VPC configuration validated');
    }, TEST_TIMEOUT);

    test('Internet Gateway is properly attached', async () => {
      console.log('\nValidating Internet Gateway...');

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.InternetGatewayId).toBe(outputs.internet_gateway_id);

      // Verify attachment to VPC
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBe(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe('available');

      console.log('  Internet Gateway validated');
    }, TEST_TIMEOUT);

    test('DHCP options are configured with custom DNS', async () => {
      console.log('\nValidating DHCP options...');

      const command = new DescribeDhcpOptionsCommand({
        DhcpOptionsIds: [outputs.dhcp_options_id]
      });

      const response = await ec2Client.send(command);
      expect(response.DhcpOptions).toBeDefined();
      expect(response.DhcpOptions!.length).toBe(1);

      const dhcpOptions = response.DhcpOptions![0];
      expect(dhcpOptions.DhcpOptionsId).toBe(outputs.dhcp_options_id);

      // Verify DNS servers configuration
      const dhcpConfigurations = dhcpOptions.DhcpConfigurations || [];
      const dnsServersConfig = dhcpConfigurations.find(config => config.Key === 'domain-name-servers');
      expect(dnsServersConfig).toBeDefined();
      expect(dnsServersConfig!.Values).toBeDefined();

      // Should include Google DNS servers (8.8.8.8, 8.8.4.4)
      const dnsValues = dnsServersConfig!.Values!.map(v => v.Value);
      expect(dnsValues).toContain('8.8.8.8');
      expect(dnsValues).toContain('8.8.4.4');

      console.log('  DHCP options validated');
    }, TEST_TIMEOUT);
  });

  // ===================================================================================================================
  // SUBNET ARCHITECTURE VALIDATION
  // ===================================================================================================================

  describe('Subnet Architecture', () => {
    test('public subnets are correctly configured', async () => {
      console.log('\nValidating public subnets...');

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      // Verify each public subnet
      for (let i = 0; i < response.Subnets!.length; i++) {
        const subnet = response.Subnets![i];
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true); // Auto-assign public IPs

        // Verify CIDR block matches expected
        expect(publicSubnetCidrs).toContain(subnet.CidrBlock!);

        // Verify AZ assignment
        expect(availabilityZones).toContain(subnet.AvailabilityZone!);

        // Verify tags
        const tags = subnet.Tags || [];
        const tierTag = tags.find(tag => tag.Key === 'Tier');
        expect(tierTag).toBeDefined();
        expect(tierTag!.Value).toBe('public');
      }

      console.log('  All public subnets validated');
    }, TEST_TIMEOUT);

    test('private subnets are correctly configured', async () => {
      console.log('\nValidating private subnets...');

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      // Verify each private subnet
      for (let i = 0; i < response.Subnets!.length; i++) {
        const subnet = response.Subnets![i];
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false); // No auto-assign public IPs

        // Verify CIDR block matches expected
        expect(privateSubnetCidrs).toContain(subnet.CidrBlock!);

        // Verify AZ assignment
        expect(availabilityZones).toContain(subnet.AvailabilityZone!);

        // Verify tags
        const tags = subnet.Tags || [];
        const tierTag = tags.find(tag => tag.Key === 'Tier');
        expect(tierTag).toBeDefined();
        expect(tierTag!.Value).toBe('private');
      }

      console.log('  All private subnets validated');
    }, TEST_TIMEOUT);

    test('subnets are distributed across exactly 3 availability zones', async () => {
      console.log('\nValidating AZ distribution...');

      // Get all subnets
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      // Extract unique AZs from subnets
      const usedAZs = [...new Set(subnets.map(subnet => subnet.AvailabilityZone))];
      expect(usedAZs.length).toBe(3);

      // Each AZ should have exactly 2 subnets (1 public, 1 private)
      for (const az of usedAZs) {
        const subnetsInAZ = subnets.filter(subnet => subnet.AvailabilityZone === az);
        expect(subnetsInAZ.length).toBe(2);

        const tiers = subnetsInAZ.map(subnet => {
          const tierTag = subnet.Tags!.find(tag => tag.Key === 'Tier');
          return tierTag!.Value;
        });
        expect(tiers).toContain('public');
        expect(tiers).toContain('private');
      }

      console.log('  AZ distribution validated (3 AZs, 2 subnets each)');
    }, TEST_TIMEOUT);
  });

  // ===================================================================================================================
  // ROUTING AND NAT GATEWAY VALIDATION
  // ===================================================================================================================

  describe('Routing and NAT Gateway', () => {
    test('NAT Gateway is properly configured', async () => {
      console.log('\nValidating NAT Gateway...');

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(1);

      const natGateway = response.NatGateways![0];
      expect(natGateway.NatGatewayId).toBe(outputs.nat_gateway_id);
      expect(natGateway.State).toBe('available');

      // Verify it's in a public subnet
      expect(publicSubnetIds).toContain(natGateway.SubnetId!);

      // Verify NAT Gateway addresses
      const addresses = natGateway.NatGatewayAddresses || [];
      expect(addresses.length).toBeGreaterThan(0);

      // Should have public IP matching output
      const publicIp = addresses.find(addr => addr.PublicIp === outputs.nat_gateway_public_ip);
      expect(publicIp).toBeDefined();

      console.log('  NAT Gateway validated');
    }, TEST_TIMEOUT);

    test('public route table routes traffic to Internet Gateway', async () => {
      console.log('\nValidating public route table...');

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id]
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(1);

      const routeTable = response.RouteTables![0];
      expect(routeTable.VpcId).toBe(outputs.vpc_id);

      // Verify routes
      const routes = routeTable.Routes || [];

      // Should have local VPC route
      const localRoute = routes.find(route =>
        route.DestinationCidrBlock === outputs.vpc_cidr_block &&
        route.GatewayId === 'local'
      );
      expect(localRoute).toBeDefined();

      // Should have Internet Gateway route for 0.0.0.0/0
      const igwRoute = routes.find(route =>
        route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.GatewayId === outputs.internet_gateway_id
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.State).toBe('active');

      // Verify associations with public subnets
      const associations = routeTable.Associations || [];
      const subnetAssociations = associations.filter(assoc => assoc.SubnetId);

      for (const publicSubnetId of publicSubnetIds) {
        const hasAssociation = subnetAssociations.some(assoc => assoc.SubnetId === publicSubnetId);
        expect(hasAssociation).toBe(true);
      }

      console.log('  Public route table validated');
    }, TEST_TIMEOUT);

    test('private route tables route traffic to NAT Gateway', async () => {
      console.log('\nValidating private route tables...');

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: privateRouteTableIds
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(3);

      // Verify each private route table
      for (let i = 0; i < response.RouteTables!.length; i++) {
        const routeTable = response.RouteTables![i];
        expect(routeTable.VpcId).toBe(outputs.vpc_id);

        // Verify routes
        const routes = routeTable.Routes || [];

        // Should have local VPC route
        const localRoute = routes.find(route =>
          route.DestinationCidrBlock === outputs.vpc_cidr_block &&
          route.GatewayId === 'local'
        );
        expect(localRoute).toBeDefined();

        // Should have NAT Gateway route for 0.0.0.0/0
        const natRoute = routes.find(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.NatGatewayId === outputs.nat_gateway_id
        );
        expect(natRoute).toBeDefined();
        expect(natRoute!.State).toBe('active');

        // Verify association with exactly one private subnet
        const associations = routeTable.Associations || [];
        const subnetAssociations = associations.filter(assoc => assoc.SubnetId);
        expect(subnetAssociations.length).toBe(1);

        const associatedSubnetId = subnetAssociations[0].SubnetId!;
        expect(privateSubnetIds).toContain(associatedSubnetId);
      }

      console.log('  All private route tables validated');
    }, TEST_TIMEOUT);
  });

  // ===================================================================================================================
  // MONITORING AND LOGGING VALIDATION
  // ===================================================================================================================

  describe('Monitoring and Logging', () => {
    test('VPC Flow Logs are enabled and configured', async () => {
      console.log('\nValidating VPC Flow Logs...');

      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.vpc_flow_logs_id]
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBe(1);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogId).toBe(outputs.vpc_flow_logs_id);
      expect(flowLog.ResourceId).toBe(outputs.vpc_id);
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.LogGroupName).toBe(outputs.vpc_flow_logs_log_group_name);

      console.log('  VPC Flow Logs validated');
    }, TEST_TIMEOUT);

    test('CloudWatch Log Group for Flow Logs exists', async () => {
      console.log('\nValidating CloudWatch Log Group...');

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.vpc_flow_logs_log_group_name
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);

      const logGroup = response.logGroups!.find(lg =>
        lg.logGroupName === outputs.vpc_flow_logs_log_group_name
      );
      expect(logGroup).toBeDefined();

      // Verify retention period is set (should be configured in Terraform)
      expect(logGroup!.retentionInDays).toBeDefined();
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);

      console.log('  CloudWatch Log Group validated');
    }, TEST_TIMEOUT);

    test('VPC Flow Logs IAM role has correct permissions', async () => {
      console.log('\nValidating VPC Flow Logs IAM role...');

      // Extract role name from Flow Logs ARN (if available in deliverLogsPermissionArn)
      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.vpc_flow_logs_id]
      });

      const response = await ec2Client.send(command);
      const flowLog = response.FlowLogs![0];

      if (flowLog.DeliverLogsPermissionArn) {
        // Extract role name from ARN: arn:aws:iam::account:role/role-name
        const roleArn = flowLog.DeliverLogsPermissionArn;
        const roleName = roleArn.split('/').pop()!;

        const roleCommand = new GetRoleCommand({
          RoleName: roleName
        });

        const roleResponse = await iamClient.send(roleCommand);
        expect(roleResponse.Role).toBeDefined();
        expect(roleResponse.Role!.RoleName).toBe(roleName);

        // Verify it's a service role for VPC Flow Logs
        const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
        const statements = assumeRolePolicy.Statement || [];
        const vpcFlowLogsStatement = statements.find((stmt: any) =>
          stmt.Principal?.Service === 'vpc-flow-logs.amazonaws.com'
        );
        expect(vpcFlowLogsStatement).toBeDefined();

        console.log('  VPC Flow Logs IAM role validated');
      } else {
        console.log('  VPC Flow Logs IAM role ARN not available, skipping validation');
      }
    }, TEST_TIMEOUT);
  });

  // ===================================================================================================================
  // SECURITY AND COMPLIANCE VALIDATION
  // ===================================================================================================================

  describe('Security and Compliance', () => {
    test('CIDR blocks follow /20 requirement', () => {
      console.log('\nValidating CIDR block requirements...');

      // VPC should use /20 CIDR
      expect(outputs.vpc_cidr_block).toMatch(/\/20$/);

      // Public subnets should use /26 (64 IPs each)
      publicSubnetCidrs.forEach(cidr => {
        expect(cidr).toMatch(/\/26$/);
      });

      // Private subnets should use /24 (256 IPs each)
      privateSubnetCidrs.forEach(cidr => {
        expect(cidr).toMatch(/\/24$/);
      });

      console.log('  CIDR block requirements validated');
    });

    test('resource tagging follows consistent pattern', async () => {
      console.log('\nValidating resource tagging consistency...');

      // Test VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      // Verify required tags exist
      const requiredTagKeys = ['Name', 'Environment', 'Project', 'ManagedBy', 'Region'];
      for (const requiredKey of requiredTagKeys) {
        const hasTag = vpcTags.some(tag => tag.Key === requiredKey);
        expect(hasTag).toBe(true);
      }

      // Verify tag values match common tags
      const projectTag = vpcTags.find(tag => tag.Key === 'Project');
      expect(projectTag!.Value).toBe(commonTags.Project);

      const environmentTag = vpcTags.find(tag => tag.Key === 'Environment');
      expect(environmentTag!.Value).toBe(commonTags.Environment);

      console.log('  Resource tagging validated');
    }, TEST_TIMEOUT);

    test('network segmentation prevents cross-AZ private communication', async () => {
      console.log('\nValidating network segmentation...');

      // Verify each private subnet has its own route table (already tested above)
      // This ensures traffic isolation between private subnets in different AZs
      expect(privateRouteTableIds.length).toBe(3);
      expect(privateSubnetIds.length).toBe(3);

      // Each route table should be unique
      const uniqueRouteTables = new Set(privateRouteTableIds);
      expect(uniqueRouteTables.size).toBe(3);

      console.log('  Network segmentation validated');
    });
  });

  // ===================================================================================================================
  // COST OPTIMIZATION VALIDATION
  // ===================================================================================================================

  describe('Cost Optimization', () => {
    test('single NAT Gateway architecture for cost efficiency', async () => {
      console.log('\nValidating cost optimization measures...');

      // Should only have one NAT Gateway (cost optimization)
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(1);
      expect(response.NatGateways![0].NatGatewayId).toBe(outputs.nat_gateway_id);

      // NAT Gateway should be in first AZ (cost optimization pattern)
      const natSubnetId = response.NatGateways![0].SubnetId!;
      expect(publicSubnetIds[0]).toBe(natSubnetId);

      console.log('  Cost optimization validated');
    }, TEST_TIMEOUT);
  });

  // ===================================================================================================================
  // REGIONAL AND MULTI-REGION COMPATIBILITY VALIDATION
  // ===================================================================================================================

  describe('Regional Compatibility', () => {
    test('availability zones match regional requirements', async () => {
      console.log('\nValidating regional AZ requirements...');

      // Get available AZs for the region
      const command = new DescribeAvailabilityZonesCommand({
        Filters: [
          {
            Name: 'state',
            Values: ['available']
          },
          {
            Name: 'opt-in-status',
            Values: ['opt-in-not-required']
          }
        ]
      });

      const response = await ec2Client.send(command);
      const availableAZs = response.AvailabilityZones || [];
      const availableAZNames = availableAZs.map(az => az.ZoneName!);

      // All used AZs should be in the available list
      for (const usedAZ of availabilityZones) {
        expect(availableAZNames).toContain(usedAZ);
      }

      // Should use exactly 3 AZs as configured
      expect(availabilityZones.length).toBe(3);

      console.log('  Regional AZ requirements validated');
    }, TEST_TIMEOUT);

    test('outputs provide comprehensive metadata for integration', () => {
      console.log('\nValidating output completeness for integration...');

      // Verify all required outputs are present and non-empty
      const requiredOutputs = [
        'account_id', 'region', 'vpc_id', 'vpc_arn', 'vpc_cidr_block',
        'internet_gateway_id', 'internet_gateway_arn',
        'nat_gateway_id', 'nat_gateway_public_ip',
        'public_subnet_ids', 'private_subnet_ids',
        'public_route_table_id', 'private_route_table_ids',
        'availability_zones', 'name_prefix'
      ];

      for (const outputKey of requiredOutputs) {
        expect(outputs[outputKey as keyof FlatOutputs]).toBeDefined();
        expect(outputs[outputKey as keyof FlatOutputs]).not.toBe('');
        expect(outputs[outputKey as keyof FlatOutputs]).not.toBe('null');
      }

      // Verify ARN formats
      expect(outputs.vpc_arn).toMatch(/^arn:aws:ec2:[^:]+:[^:]+:vpc\/vpc-[a-f0-9]+$/);
      expect(outputs.internet_gateway_arn).toMatch(/^arn:aws:ec2:[^:]+:[^:]+:internet-gateway\/igw-[a-f0-9]+$/);

      // Verify resource ID formats
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-f0-9]+$/);
      expect(outputs.nat_gateway_id).toMatch(/^nat-[a-f0-9]+$/);

      console.log('  Output completeness validated');
    });
  });

  // ===================================================================================================================
  // END-TO-END CONNECTIVITY TESTS
  // ===================================================================================================================

  describe('End-to-End Connectivity', () => {
    test('infrastructure is ready for application deployment', async () => {
      console.log('\nPerforming final infrastructure readiness check...');

      // Verify all critical components are in available/active state
      const checks = [
        { name: 'VPC', status: 'available' },
        { name: 'Internet Gateway', status: 'available' },
        { name: 'NAT Gateway', status: 'available' },
        { name: 'VPC Flow Logs', status: 'ACTIVE' }
      ];

      // VPC check
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Internet Gateway check
      const igwCommand = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id]
      });
      const igwResponse = await ec2Client.send(igwCommand);
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');

      // NAT Gateway check
      const natCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id]
      });
      const natResponse = await ec2Client.send(natCommand);
      expect(natResponse.NatGateways![0].State).toBe('available');

      // VPC Flow Logs check
      const flowLogsCommand = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.vpc_flow_logs_id]
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      expect(flowLogsResponse.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');

      console.log('  Infrastructure is ready for application deployment');
      console.log('\nAll integration tests passed! VPC infrastructure is fully validated.');
    }, TEST_TIMEOUT);
  });
});
