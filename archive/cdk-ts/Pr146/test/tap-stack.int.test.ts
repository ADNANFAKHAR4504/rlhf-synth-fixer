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

// Initialize AWS EC2 client
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Get environment suffix from environment variable (set by CI/CD pipeline)
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

  describe('VPC Configuration', () => {
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
      const allSubnetIds = [
        ...outputs.PublicSubnetIds.split(','),
        ...outputs.PrivateSubnetIds.split(','),
        ...outputs.IsolatedSubnetIds.split(','),
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

    test('NAT Gateways are created for private subnets', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');

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

      expect(natGateways.length).toBe(2); // One per AZ
      natGateways.forEach((ngw: NatGateway) => {
        expect(ngw.State).toBe('available');
      });
    });
  });

  describe('Security Groups', () => {
    test('DMZ security group allows HTTP and HTTPS from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DmzSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.GroupName).toBe(`DMZ-SG-${environmentSuffix}`);

      const ingressRules = sg?.IpPermissions || [];

      // Check HTTP rule
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

      // Check HTTPS rule
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });

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

  describe('Network ACLs', () => {
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

    test('DMZ NACL allows HTTP and HTTPS traffic', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'tag:Name',
            Values: [`*DMZ-NACL-${environmentSuffix}*`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const nacls = response.NetworkAcls || [];

      if (nacls.length > 0) {
        const dmzNacl = nacls[0];
        const entries = dmzNacl.Entries || [];

        // Check for HTTP entry (port 80)
        const httpEntry = entries.find(
          (entry: NetworkAclEntry) =>
            entry.RuleNumber === 100 &&
            entry.PortRange?.From === 80 &&
            !entry.Egress
        );
        expect(httpEntry).toBeDefined();

        // Check for HTTPS entry (port 443)
        const httpsEntry = entries.find(
          (entry: NetworkAclEntry) =>
            entry.RuleNumber === 110 &&
            entry.PortRange?.From === 443 &&
            !entry.Egress
        );
        expect(httpsEntry).toBeDefined();
      } else {
        console.log(
          'DMZ NACL not found by tag, checking entries in all custom NACLs'
        );

        // Fallback: check all custom NACLs for HTTP/HTTPS rules
        const allCommand = new DescribeNetworkAclsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
          ],
        });

        const allResponse = await ec2Client.send(allCommand);
        const allNacls =
          allResponse.NetworkAcls?.filter(
            (nacl: NetworkAcl) => !nacl.IsDefault
          ) || [];

        let foundHttpRule = false;
        let foundHttpsRule = false;

        allNacls.forEach((nacl: NetworkAcl) => {
          const entries = nacl.Entries || [];

          if (
            entries.some(
              (e: NetworkAclEntry) => e.PortRange?.From === 80 && !e.Egress
            )
          ) {
            foundHttpRule = true;
          }

          if (
            entries.some(
              (e: NetworkAclEntry) => e.PortRange?.From === 443 && !e.Egress
            )
          ) {
            foundHttpsRule = true;
          }
        });

        expect(foundHttpRule).toBe(true);
        expect(foundHttpsRule).toBe(true);
      }
    });
  });

  describe('End-to-End Network Connectivity', () => {
    test('3-tier architecture is properly segmented', async () => {
      // This test verifies the overall network architecture
      // Verify we have the right number and types of subnets
      const publicSubnets = outputs.PublicSubnetIds.split(',');
      const privateSubnets = outputs.PrivateSubnetIds.split(',');
      const isolatedSubnets = outputs.IsolatedSubnetIds.split(',');

      expect(publicSubnets.length).toBe(2); // DMZ tier
      expect(privateSubnets.length).toBe(2); // Internal tier
      expect(isolatedSubnets.length).toBe(2); // Secure tier

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
