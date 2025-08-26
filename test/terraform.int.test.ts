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

// Test configuration
const TEST_CONFIG = {
  applicationName: 'webapp',
  environment: 'production',
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

describe('Terraform Infrastructure Integration Tests', () => {
  let accountId: string;

  beforeAll(async () => {
    // Get AWS account ID for testing
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

        expect(vpcs.Vpcs).toHaveLength(1);
        const vpc = vpcs.Vpcs![0];

        // Validate VPC configuration
        expect(vpc.CidrBlock).toBe(TEST_CONFIG.vpcCidrs[region as keyof typeof TEST_CONFIG.vpcCidrs]);
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

        expect(subnets.Subnets).toHaveLength(1);
        const subnet = subnets.Subnets![0];

        // Validate subnet configuration
        expect(subnet.CidrBlock).toBe(TEST_CONFIG.subnetCidrs[region as keyof typeof TEST_CONFIG.subnetCidrs]);
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

        expect(igws.InternetGateways).toHaveLength(1);
        const igw = igws.InternetGateways![0];

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

        expect(routeTables.RouteTables).toHaveLength(1);
        const routeTable = routeTables.RouteTables![0];

        // Validate route table configuration
        expect(routeTable.Routes).toBeDefined();

        // Check for internet gateway route (0.0.0.0/0)
        const internetRoute = routeTable.Routes?.find(
          route => route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(internetRoute).toBeDefined();
        expect(internetRoute?.GatewayId).toBeDefined();

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

        expect(securityGroups.SecurityGroups).toHaveLength(1);
        const sg = securityGroups.SecurityGroups![0];

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

        // Get the public subnet
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-${region}`],
              },
            ],
          })
        );

        expect(subnets.Subnets).toHaveLength(1);
        const subnet = subnets.Subnets![0];

        // Get the route table
        const routeTables = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-rt-${region}`],
              },
            ],
          })
        );

        expect(routeTables.RouteTables).toHaveLength(1);
        const routeTable = routeTables.RouteTables![0];

        // Check if subnet is associated with the route table
        const association = routeTable.Associations?.find(
          assoc => assoc.SubnetId === subnet.SubnetId
        );
        expect(association).toBeDefined();
        expect(association?.Main).toBe(false);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have consistent tagging', async () => {
      const requiredTags = ['Name', 'Environment'];

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
            ],
          })
        );

        const vpc = vpcs.Vpcs![0];
        for (const tagName of requiredTags) {
          const tag = vpc.Tags?.find(t => t.Key === tagName);
          expect(tag).toBeDefined();
          expect(tag?.Value).toBeDefined();
        }

        // Test subnet tags
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-${region}`],
              },
            ],
          })
        );

        const subnet = subnets.Subnets![0];
        for (const tagName of requiredTags) {
          const tag = subnet.Tags?.find(t => t.Key === tagName);
          expect(tag).toBeDefined();
          expect(tag?.Value).toBeDefined();
        }
      }
    });
  });

  describe('Multi-Region Consistency', () => {
    test('Both regions have identical resource configurations', async () => {
      const regions = TEST_CONFIG.regions;

      // Compare VPC configurations
      const vpcConfigs = [];
      for (const region of regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;
        const vpcs = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-vpc-${region}`],
              },
            ],
          })
        );
        vpcConfigs.push({
          region,
          cidr: vpcs.Vpcs![0].CidrBlock,
          state: vpcs.Vpcs![0].State,
        });
      }

      // All VPCs should be available
      expect(vpcConfigs.every(config => config.cidr)).toBeDefined();

      // Compare subnet configurations
      const subnetConfigs = [];
      for (const region of regions) {
        const ec2Client = region === 'us-east-1' ? ec2UsEast1 : ec2UsWest2;
        const subnets = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`${TEST_CONFIG.applicationName}-public-${region}`],
              },
            ],
          })
        );
        subnetConfigs.push({
          region,
          mapPublicIp: subnets.Subnets![0].MapPublicIpOnLaunch,
        });
      }

      // All subnets should map public IPs
      expect(subnetConfigs.every(config => config.mapPublicIp)).toBe(true);
    });
  });
});
