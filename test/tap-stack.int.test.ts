// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
  NatGateway,
  NetworkAcl,
  NetworkAclEntry,
  Subnet,
} from '@aws-sdk/client-ec2';
import fs from 'fs';

// Initialize AWS EC2 client for LocalStack
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK_ENDPOINT?.includes('localhost');

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocalStack && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
    forcePathStyle: true,
  }),
});

// Get environment suffix from environment variable (set by CI/CD pipeline)
// Note: For LocalStack testing, use the ENVIRONMENT_SUFFIX env var or fallback to 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs (only when file exists)
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  }
} catch (error) {
  console.warn('Could not load outputs file:', error);
}

describe('Network Infrastructure Integration Tests', () => {
  const stackName = `TapStack${environmentSuffix}`;

  // Skip integration tests if outputs are not available
  const hasOutputs = outputs && outputs.VpcId;

  // Conditional test execution based on outputs availability
  const conditionalDescribe = hasOutputs ? describe : describe.skip;

  conditionalDescribe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
    });

    test('Subnets are created in correct zones', async () => {
      // Note: Both Internal and Secure subnets are now PRIVATE_ISOLATED (in IsolatedSubnetIds)
      // due to LocalStack NAT Gateway limitations
      const publicSubnetIds = outputs.PublicSubnetIds ? outputs.PublicSubnetIds.split(',').filter(id => id) : [];
      const privateSubnetIds = outputs.PrivateSubnetIds ? outputs.PrivateSubnetIds.split(',').filter(id => id) : [];
      const isolatedSubnetIds = outputs.IsolatedSubnetIds ? outputs.IsolatedSubnetIds.split(',').filter(id => id) : [];

      const allSubnetIds = [
        ...publicSubnetIds,
        ...privateSubnetIds,
        ...isolatedSubnetIds,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets).toHaveLength(6); // 2 AZs * 3 tiers = 6 subnets

      // Check that we have subnets in multiple AZs
      const availabilityZones = new Set(
        subnets.map((s: Subnet) => s.AvailabilityZone)
      );
      expect(availabilityZones.size).toBe(2);

      // Check CIDR blocks are within VPC range
      subnets.forEach((subnet: Subnet) => {
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    });

    test('Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const igws = response.InternetGateways || [];

      expect(igws.length).toBeGreaterThan(0);
      expect(igws[0].Attachments?.[0]?.State).toBe('available');
    });

    test('NAT Gateways are NOT created (LocalStack Community limitation)', async () => {
      // LocalStack Community Edition has limited NAT Gateway support
      // We use PRIVATE_ISOLATED subnets instead of PRIVATE_WITH_EGRESS
      // This test verifies NAT Gateways are NOT present (expected behavior for LocalStack)

      const publicSubnetIds = outputs.PublicSubnetIds ? outputs.PublicSubnetIds.split(',').filter(id => id) : [];

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'subnet-id',
            Values: publicSubnetIds,
          },
        ],
      });

      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      // Expect NO NAT Gateways (changed architecture for LocalStack compatibility)
      expect(natGateways.length).toBe(0);
    });
  });

  conditionalDescribe('Security Groups', () => {
    test('Internal security group allows connections from DMZ on port 8080', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.InternalSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.GroupName).toBe(`Internal-SG-${environmentSuffix}`);

      const ingressRules = sg?.IpPermissions || [];
      const port8080Rule = ingressRules.find(
        (rule: any) => rule.FromPort === 8080
      );

      expect(port8080Rule).toBeDefined();
      expect(port8080Rule?.UserIdGroupPairs?.[0]?.GroupId).toBe(
        outputs.DmzSecurityGroupId
      );
    });

    test('Secure security group allows connections from Internal on port 5432', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecureSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.GroupName).toBe(`Secure-SG-${environmentSuffix}`);

      const ingressRules = sg?.IpPermissions || [];
      const port5432Rule = ingressRules.find(
        (rule: any) => rule.FromPort === 5432
      );

      expect(port5432Rule).toBeDefined();
      expect(port5432Rule?.UserIdGroupPairs?.[0]?.GroupId).toBe(
        outputs.InternalSecurityGroupId
      );
    });
  });

  conditionalDescribe('Network ACLs', () => {
    test('Network ACLs are created for each tier', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const nacls = response.NetworkAcls || [];

      // Should have 4 NACLs: 3 custom + 1 default
      expect(nacls.length).toBe(4);

      // Check for custom NACLs by tag or name pattern
      const customNacls = nacls.filter((nacl: NetworkAcl) => !nacl.IsDefault);
      expect(customNacls.length).toBe(3);
    });

  });

  conditionalDescribe('End-to-End Network Connectivity', () => {
    test('3-tier architecture is properly segmented', async () => {
      // This test verifies the overall network architecture
      // Note: Due to LocalStack limitations, Internal tier is PRIVATE_ISOLATED (not PRIVATE_WITH_EGRESS)
      const publicSubnets = outputs.PublicSubnetIds ? outputs.PublicSubnetIds.split(',').filter(id => id) : [];
      const privateSubnets = outputs.PrivateSubnetIds ? outputs.PrivateSubnetIds.split(',').filter(id => id) : [];
      const isolatedSubnets = outputs.IsolatedSubnetIds ? outputs.IsolatedSubnetIds.split(',').filter(id => id) : [];

      expect(publicSubnets.length).toBe(2); // DMZ tier
      expect(privateSubnets.length).toBe(0); // No private subnets (LocalStack limitation)
      expect(isolatedSubnets.length).toBe(4); // Internal (2) + Secure (2) tiers both isolated

      // Verify all subnets belong to the correct VPC
      const allSubnetIds = [
        ...publicSubnets,
        ...privateSubnets,
        ...isolatedSubnets,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      subnets.forEach((subnet: Subnet) => {
        expect(subnet.VpcId).toBe(outputs.VpcId);
        expect(subnet.State).toBe('available');
      });

      console.log(
        `✅ 3-tier network architecture verified: ${publicSubnets.length} public, ${privateSubnets.length} private, ${isolatedSubnets.length} isolated subnets`
      );
    });
  });
});
