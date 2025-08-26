import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

// AWS SDK clients for different regions
const ec2UsEast1 = new EC2Client({ region: 'us-east-1' });
const ec2UsWest2 = new EC2Client({ region: 'us-west-2' });
const sts = new STSClient({ region: 'us-east-1' });

// Get environment suffix from CI or use default
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Test configuration
const TEST_CONFIG = {
  applicationName: 'webapp',
  environment: 'production',
  environmentSuffix: ENVIRONMENT_SUFFIX,
  regions: ['us-east-1', 'us-west-2'] as const,
  vpcCidrs: {
    'us-east-1': '10.0.0.0/16',
    'us-west-2': '10.1.0.0/16',
  } as const,
  subnetCidrs: {
    'us-east-1': '10.0.1.0/24',
    'us-west-2': '10.1.1.0/24',
  } as const,
};

// Helper function to get the most recent resource from a list
function getMostRecentResource<T extends { [key: string]: any }>(
  resources: T[],
  idField: keyof T
): T {
  return resources
    .sort((a, b) => String(a[idField]).localeCompare(String(b[idField])))
    .pop()!;
}

describe('Terraform Infrastructure Integration Tests', () => {
  let accountId: string;

  beforeAll(async () => {
    // Get AWS account ID
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account!;
    console.log(`Testing infrastructure in AWS account: ${accountId}`);
  });

  describe('VPC Resources', () => {
    test('VPCs exist in both regions with correct configuration', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        const vpcs = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-vpc-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(vpcs.Vpcs).toBeDefined();
        expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
        // Get the most recent VPC when multiple exist
        const vpc = getMostRecentResource(vpcs.Vpcs!, 'VpcId');

        // Validate VPC configuration
        expect(vpc.CidrBlock).toBe(
          TEST_CONFIG.vpcCidrs[region as keyof typeof TEST_CONFIG.vpcCidrs]
        );
        expect(vpc.State).toBe('available');
        // Note: EnableDnsHostnames and EnableDnsSupport are not returned by the API
        // but are set in the Terraform configuration

        // Validate tags
        const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
        const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
        const regionTag = vpc.Tags?.find(tag => tag.Key === 'Region');

        expect(nameTag?.Value).toBe(
          `${TEST_CONFIG.applicationName}-vpc-${region}`
        );
        expect(envTag?.Value).toBe(TEST_CONFIG.environment);
        expect(regionTag?.Value).toBe(region);
      }
    });
  });

  describe('Subnet Resources', () => {
    test('Public subnets exist in both regions with correct configuration', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(subnets.Subnets).toBeDefined();
        expect(subnets.Subnets!.length).toBeGreaterThan(0);
        // Get the most recent subnet when multiple exist
        const subnet = getMostRecentResource(subnets.Subnets!, 'SubnetId');

        // Validate subnet configuration
        expect(subnet.CidrBlock).toBe(
          TEST_CONFIG.subnetCidrs[
            region as keyof typeof TEST_CONFIG.subnetCidrs
          ]
        );
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');

        // Validate tags
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        const envTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');

        expect(nameTag?.Value).toBe(
          `${TEST_CONFIG.applicationName}-public-${region}`
        );
        expect(envTag?.Value).toBe(TEST_CONFIG.environment);
        expect(typeTag?.Value).toBe('Public');
      }
    });
  });

  describe('Internet Gateway Resources', () => {
    test('Internet Gateways exist in both regions and are attached to VPCs', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        const igws = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-igw-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(igws.InternetGateways).toBeDefined();
        expect(igws.InternetGateways!.length).toBeGreaterThan(0);
        // Get the most recent IGW when multiple exist
        const igw = getMostRecentResource(
          igws.InternetGateways!,
          'InternetGatewayId'
        );

        // Validate IGW configuration
        expect(igw.Attachments).toHaveLength(1);
        expect(igw.Attachments![0].State).toBe('available');

        // Validate tags
        const nameTag = igw.Tags?.find(tag => tag.Key === 'Name');
        const envTag = igw.Tags?.find(tag => tag.Key === 'Environment');

        expect(nameTag?.Value).toBe(
          `${TEST_CONFIG.applicationName}-igw-${region}`
        );
        expect(envTag?.Value).toBe(TEST_CONFIG.environment);
      }
    });
  });

  describe('Route Table Resources', () => {
    test('Route tables exist in both regions with internet access', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        const routeTables = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-rt-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(routeTables.RouteTables).toBeDefined();
        expect(routeTables.RouteTables!.length).toBeGreaterThan(0);
        // Get the most recent route table when multiple exist
        const routeTable = getMostRecentResource(
          routeTables.RouteTables!,
          'RouteTableId'
        );

        // Validate route table configuration
        expect(routeTable.Routes).toBeDefined();

        // Check for internet gateway route (0.0.0.0/0)
        const internetRoute = routeTable.Routes?.find(
          route => route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(internetRoute).toBeDefined();
        expect(internetRoute?.GatewayId).toBeDefined();

        // Check for local route (VPC CIDR)
        const localRoute = routeTable.Routes?.find(
          route =>
            route.DestinationCidrBlock ===
            TEST_CONFIG.vpcCidrs[region as keyof typeof TEST_CONFIG.vpcCidrs]
        );
        expect(localRoute).toBeDefined();
        expect(localRoute?.GatewayId).toBe('local');

        // Validate tags
        const nameTag = routeTable.Tags?.find(tag => tag.Key === 'Name');
        const envTag = routeTable.Tags?.find(tag => tag.Key === 'Environment');

        expect(nameTag?.Value).toBe(
          `${TEST_CONFIG.applicationName}-public-rt-${region}`
        );
        expect(envTag?.Value).toBe(TEST_CONFIG.environment);
      }
    });
  });

  describe('Security Group Resources', () => {
    test('ALB security groups exist in both regions with correct rules', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        const securityGroups = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              {
                Name: 'group-name',
                Values: [`${TEST_CONFIG.applicationName}-alb-sg-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(securityGroups.SecurityGroups).toBeDefined();
        expect(securityGroups.SecurityGroups!.length).toBeGreaterThan(0);
        // Get the most recent security group when multiple exist
        const sg = getMostRecentResource(
          securityGroups.SecurityGroups!,
          'GroupId'
        );

        // Validate security group configuration
        expect(sg.GroupName).toBe(
          `${TEST_CONFIG.applicationName}-alb-sg-${region}`
        );
        expect(sg.Description).toBe('Security group for ALB');
        expect(sg.VpcId).toBeDefined();

        // Validate ingress rules (HTTP access)
        const httpIngress = sg.IpPermissions?.find(
          rule =>
            rule.FromPort === 80 &&
            rule.ToPort === 80 &&
            rule.IpProtocol === 'tcp'
        );
        expect(httpIngress).toBeDefined();
        expect(httpIngress?.IpRanges).toHaveLength(1);
        expect(httpIngress?.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

        // Validate egress rules (all traffic)
        const allEgress = sg.IpPermissionsEgress?.find(
          rule => rule.IpProtocol === '-1'
        );
        expect(allEgress).toBeDefined();
        expect(allEgress?.IpRanges).toHaveLength(1);
        expect(allEgress?.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

        // Validate tags
        const nameTag = sg.Tags?.find(tag => tag.Key === 'Name');
        const envTag = sg.Tags?.find(tag => tag.Key === 'Environment');

        expect(nameTag?.Value).toBe(
          `${TEST_CONFIG.applicationName}-alb-sg-${region}`
        );
        expect(envTag?.Value).toBe(TEST_CONFIG.environment);
      }
    });
  });

  describe('Network Connectivity', () => {
    test('Subnets are associated with route tables', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        // Get the VPC first to ensure we get resources from the same deployment
        const vpcs = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-vpc-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(vpcs.Vpcs).toBeDefined();
        expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
        const vpc = getMostRecentResource(vpcs.Vpcs!, 'VpcId');

        // Get the public subnet in the same VPC
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
              { Name: 'vpc-id', Values: [vpc.VpcId!] },
            ],
          })
        );

        expect(subnets.Subnets).toBeDefined();
        expect(subnets.Subnets!.length).toBeGreaterThan(0);
        const subnet = getMostRecentResource(subnets.Subnets!, 'SubnetId');

        // Get the route table in the same VPC
        const routeTables = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-rt-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
              { Name: 'vpc-id', Values: [vpc.VpcId!] },
            ],
          })
        );

        expect(routeTables.RouteTables).toBeDefined();
        expect(routeTables.RouteTables!.length).toBeGreaterThan(0);
        const routeTable = getMostRecentResource(
          routeTables.RouteTables!,
          'RouteTableId'
        );

        // Check that subnet is associated with route table
        const association = routeTable.Associations?.find(
          assoc => assoc.SubnetId === subnet.SubnetId && !assoc.Main
        );
        expect(association).toBeDefined();
        expect(association?.AssociationState?.State).toBe('associated');
      }
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have consistent tagging', async () => {
      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        // Test VPC tags
        const vpcs = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-vpc-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(vpcs.Vpcs).toBeDefined();
        expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
        const vpc = getMostRecentResource(vpcs.Vpcs!, 'VpcId');

        const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
        expect(envTag?.Value).toBe(TEST_CONFIG.environment);

        // Test subnet tags
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(subnets.Subnets).toBeDefined();
        expect(subnets.Subnets!.length).toBeGreaterThan(0);
        const subnet = getMostRecentResource(subnets.Subnets!, 'SubnetId');

        const subnetEnvTag = subnet.Tags?.find(
          tag => tag.Key === 'Environment'
        );
        expect(subnetEnvTag?.Value).toBe(TEST_CONFIG.environment);
      }
    });
  });

  describe('Multi-Region Consistency', () => {
    test('Both regions have identical resource configurations', async () => {
      const vpcConfigs: Array<{ region: string; cidr: string; state: string }> =
        [];

      for (const region of TEST_CONFIG.regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;

        const vpcs = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-vpc-${region}`],
              },
              { Name: 'tag:Environment', Values: [TEST_CONFIG.environment] },
            ],
          })
        );

        expect(vpcs.Vpcs).toBeDefined();
        expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
        const vpc = getMostRecentResource(vpcs.Vpcs!, 'VpcId');

        vpcConfigs.push({
          region,
          cidr: vpc.CidrBlock!,
          state: vpc.State!,
        });
      }

      // All VPCs should be available
      expect(vpcConfigs.every(config => config.state === 'available')).toBe(
        true
      );

      // All VPCs should have different CIDR blocks
      const cidrs = vpcConfigs.map(config => config.cidr);
      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(cidrs.length);
    });
  });
});
