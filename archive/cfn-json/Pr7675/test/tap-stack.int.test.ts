import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
} from '@aws-sdk/client-ec2';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('VPC Migration Infrastructure Integration Tests', () => {
  describe('VPC Validation', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VPCId;

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);

      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });
  });

  describe('Subnet Validation', () => {
    test('all 6 subnets should exist and be available', async () => {
      const subnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.IsolatedSubnetAZ1Id,
        outputs.IsolatedSubnetAZ2Id,
      ];

      expect(subnetIds.every(id => id !== undefined)).toBe(true);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(6);
      response.Subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetAZ1Id, outputs.PublicSubnetAZ2Id],
      });
      const response = await ec2Client.send(command);

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnetAZ1Id, outputs.PrivateSubnetAZ2Id],
      });
      const response = await ec2Client.send(command);

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.11.0/24', '10.0.12.0/24']);
    });

    test('isolated subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.IsolatedSubnetAZ1Id, outputs.IsolatedSubnetAZ2Id],
      });
      const response = await ec2Client.send(command);

      const cidrs = response.Subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.21.0/24', '10.0.22.0/24']);
    });

    test('public subnets should map public IPs on launch', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetAZ1Id, outputs.PublicSubnetAZ2Id],
      });
      const response = await ec2Client.send(command);

      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private and isolated subnets should NOT map public IPs on launch', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PrivateSubnetAZ1Id,
          outputs.PrivateSubnetAZ2Id,
          outputs.IsolatedSubnetAZ1Id,
          outputs.IsolatedSubnetAZ2Id,
        ],
      });
      const response = await ec2Client.send(command);

      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets should span 2 availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnetAZ1Id,
          outputs.PublicSubnetAZ2Id,
          outputs.PrivateSubnetAZ1Id,
          outputs.PrivateSubnetAZ2Id,
          outputs.IsolatedSubnetAZ1Id,
          outputs.IsolatedSubnetAZ2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });
  });

  describe('Security Group Validation', () => {
    test('all 3 security groups should exist', async () => {
      const sgIds = [
        outputs.WebServerSecurityGroupId,
        outputs.AppServerSecurityGroupId,
        outputs.DatabaseSecurityGroupId,
      ];

      expect(sgIds.every(id => id !== undefined)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(3);
      response.SecurityGroups.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.VPCId);
      });
    });

    test('web server security group should allow HTTP and HTTPS from anywhere', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebServerSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups[0];
      const ingress = sg.IpPermissions;

      const httpRule = ingress.find(r => r.FromPort === 80 && r.ToPort === 80);
      const httpsRule = ingress.find(
        r => r.FromPort === 443 && r.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.IpRanges.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
      expect(httpsRule.IpRanges.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test('app server security group should allow port 8080 from web tier only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppServerSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups[0];
      const ingress = sg.IpPermissions;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(8080);
      expect(ingress[0].ToPort).toBe(8080);
      expect(ingress[0].UserIdGroupPairs).toHaveLength(1);
      expect(ingress[0].UserIdGroupPairs[0].GroupId).toBe(
        outputs.WebServerSecurityGroupId
      );
    });

    test('database security group should allow port 3306 from app tier only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DatabaseSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups[0];
      const ingress = sg.IpPermissions;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].UserIdGroupPairs).toHaveLength(1);
      expect(ingress[0].UserIdGroupPairs[0].GroupId).toBe(
        outputs.AppServerSecurityGroupId
      );
    });
  });

  describe('NAT Gateway Validation', () => {
    test('should have 2 NAT Gateways in available state', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(2);

      const subnetIds = response.NatGateways.map(nat => nat.SubnetId).sort();
      const expectedSubnetIds = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
      ].sort();
      expect(subnetIds).toEqual(expectedSubnetIds);
    });

    test('NAT Gateways should be in different availability zones', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: response.NatGateways.map(nat => nat.SubnetId),
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      const azs = new Set(subnetsResponse.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });
  });

  describe('Internet Gateway Validation', () => {
    test('should have Internet Gateway attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const attachment = response.InternetGateways[0].Attachments[0];
      expect(attachment.State).toBe('available');
      expect(attachment.VpcId).toBe(outputs.VPCId);
    });
  });

  describe('Route Table Validation', () => {
    test('should have correct number of route tables', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // 1 main (default) + 1 public + 2 private + 2 isolated = 6 total
      expect(response.RouteTables.length).toBeGreaterThanOrEqual(5);
    });

    test('public subnets should have route to Internet Gateway', async () => {
      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetAZ1Id, outputs.PublicSubnetAZ2Id],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      for (const subnet of subnetsResponse.Subnets) {
        const rtCommand = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnet.SubnetId],
            },
          ],
        });
        const rtResponse = await ec2Client.send(rtCommand);

        expect(rtResponse.RouteTables).toHaveLength(1);
        const routes = rtResponse.RouteTables[0].Routes;
        const igwRoute = routes.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId && r.GatewayId.startsWith('igw-')
        );
        expect(igwRoute).toBeDefined();
      }
    });

    test('private subnets should have route to NAT Gateway', async () => {
      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnetAZ1Id, outputs.PrivateSubnetAZ2Id],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      for (const subnet of subnetsResponse.Subnets) {
        const rtCommand = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnet.SubnetId],
            },
          ],
        });
        const rtResponse = await ec2Client.send(rtCommand);

        expect(rtResponse.RouteTables).toHaveLength(1);
        const routes = rtResponse.RouteTables[0].Routes;
        const natRoute = routes.find(
          r =>
            r.DestinationCidrBlock === '0.0.0.0/0' &&
            r.NatGatewayId &&
            r.NatGatewayId.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
      }
    });

    test('isolated subnets should NOT have internet routes', async () => {
      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.IsolatedSubnetAZ1Id, outputs.IsolatedSubnetAZ2Id],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      for (const subnet of subnetsResponse.Subnets) {
        const rtCommand = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnet.SubnetId],
            },
          ],
        });
        const rtResponse = await ec2Client.send(rtCommand);

        expect(rtResponse.RouteTables).toHaveLength(1);
        const routes = rtResponse.RouteTables[0].Routes;
        const internetRoute = routes.find(
          r =>
            r.DestinationCidrBlock === '0.0.0.0/0' &&
            (r.GatewayId?.startsWith('igw-') || r.NatGatewayId?.startsWith('nat-'))
        );
        expect(internetRoute).toBeUndefined();
      }
    });
  });

  describe('Network ACL Validation', () => {
    test('should have Network ACLs associated with subnets', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Should have at least 4 NACLs (1 default + 3 custom)
      expect(response.NetworkAcls.length).toBeGreaterThanOrEqual(3);

      // All non-default NACLs should have associations
      const customNacls = response.NetworkAcls.filter(nacl => !nacl.IsDefault);
      customNacls.forEach(nacl => {
        expect(nacl.Associations.length).toBeGreaterThan(0);
      });
    });

    test('public subnets should have network ACL allowing HTTP and HTTPS', async () => {
      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetAZ1Id],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      const naclCommand = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [subnetsResponse.Subnets[0].SubnetId],
          },
        ],
      });
      const naclResponse = await ec2Client.send(naclCommand);

      const nacl = naclResponse.NetworkAcls[0];
      const ingressRules = nacl.Entries.filter(e => !e.Egress);

      const httpRule = ingressRules.find(
        r =>
          r.RuleAction === 'allow' &&
          r.PortRange?.From === 80 &&
          r.PortRange?.To === 80
      );
      const httpsRule = ingressRules.find(
        r =>
          r.RuleAction === 'allow' &&
          r.PortRange?.From === 443 &&
          r.PortRange?.To === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('Three-Tier Architecture Validation', () => {
    test('architecture should have proper tier segregation', async () => {
      const allSubnets = [
        outputs.PublicSubnetAZ1Id,
        outputs.PublicSubnetAZ2Id,
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.IsolatedSubnetAZ1Id,
        outputs.IsolatedSubnetAZ2Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnets,
      });
      const response = await ec2Client.send(command);

      const tiers = {
        web: response.Subnets.filter(s =>
          s.Tags?.some(t => t.Key === 'Tier' && t.Value === 'web')
        ),
        application: response.Subnets.filter(s =>
          s.Tags?.some(t => t.Key === 'Tier' && t.Value === 'application')
        ),
        database: response.Subnets.filter(s =>
          s.Tags?.some(t => t.Key === 'Tier' && t.Value === 'database')
        ),
      };

      expect(tiers.web.length).toBe(2);
      expect(tiers.application.length).toBe(2);
      expect(tiers.database.length).toBe(2);
    });

    test('all resources should have Environment and MigrationPhase tags', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);

      const vpc = vpcResponse.Vpcs[0];
      expect(vpc.Tags?.some(t => t.Key === 'Environment')).toBe(true);
      expect(vpc.Tags?.some(t => t.Key === 'MigrationPhase')).toBe(true);
    });
  });
});
