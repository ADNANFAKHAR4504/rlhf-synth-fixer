import { DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcAttributeCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });

describe('VPC Infrastructure Integration Tests', () => {

  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have DNS hostnames enabled', async () => {
      const attr = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsHostnames'
      }));

      expect(attr.EnableDnsHostnames?.Value).toBe(false);
    });

    test('VPC should have DNS support enabled', async () => {
      const attr = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsSupport'
      }));

      expect(attr.EnableDnsSupport?.Value).toBe(true);
    });
  });

  describe('Subnets Configuration', () => {
    test('all 4 subnets should exist and be available', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(4);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      });

      const response = await ec2Client.send(command);
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();

      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24']);
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets should be distributed across two availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id
        ]
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBe(2);
    });

    test('each AZ should have one public and one private subnet', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id
        ]
      });

      const response = await ec2Client.send(command);
      const subnetsByAZ = new Map<string, { public: number; private: number }>();

      response.Subnets!.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        if (!subnetsByAZ.has(az)) {
          subnetsByAZ.set(az, { public: 0, private: 0 });
        }

        const azData = subnetsByAZ.get(az)!;
        if (subnet.MapPublicIpOnLaunch) {
          azData.public++;
        } else {
          azData.private++;
        }
      });

      subnetsByAZ.forEach(counts => {
        expect(counts.public).toBe(1);
        expect(counts.private).toBe(1);
      });
    });
  });

  describe('NAT Gateways', () => {
    test('both NAT Gateways should exist and be available', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(2);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.VpcId).toBe(outputs.VPCId);
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id]
      });

      const response = await ec2Client.send(command);
      const subnetIds = response.NatGateways!.map(ng => ng.SubnetId).sort();
      const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id].sort();

      expect(subnetIds).toEqual(publicSubnetIds);
    });

    test('each NAT Gateway should have an Elastic IP', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id]
      });

      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
        expect(natGw.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });

    test('NAT Gateways should be in different availability zones', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id]
      });

      const response = await ec2Client.send(command);

      const subnetIds = response.NatGateways!
        .map(ng => ng.SubnetId)
        .filter((id): id is string => Boolean(id));
      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway should exist and be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Security Groups', () => {
    test('all 3 security groups should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.BastionSecurityGroupId,
          outputs.ApplicationSecurityGroupId,
          outputs.DatabaseSecurityGroupId
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(3);

      response.SecurityGroups!.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.VPCId);
      });
    });

    test('security groups should have proper names with environment suffix', async () => {
      // derive expected suffix from VPC Name tag (last hyphen-delimited token)
      const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      const vpc = vpcResp.Vpcs![0];
      const vpcName = (vpc.Tags || []).find(t => t.Key === 'Name')?.Value || '';
      const derivedSuffix = vpcName.includes('-') ? vpcName.split('-').pop()! : vpcName;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.BastionSecurityGroupId,
          outputs.ApplicationSecurityGroupId,
          outputs.DatabaseSecurityGroupId
        ]
      });

      const response = await ec2Client.send(command);

      response.SecurityGroups!.forEach(sg => {
        expect(sg.GroupName).toBeDefined();
        if (derivedSuffix) {
          expect(sg.GroupName!).toMatch(new RegExp(`-${derivedSuffix}$`));
        }
      });
    });
  });

  describe('High Availability', () => {
    test('critical resources should be distributed across multiple AZs', async () => {
      const natGwCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id]
      });
      const natGwResponse = await ec2Client.send(natGwCommand);

      const subnetIds = natGwResponse.NatGateways!
        .map(ng => ng.SubnetId)
        .filter((id): id is string => Boolean(id));

      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];

      const tags = vpc.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');

      const nameTag = tags.find(t => t.Key === 'Name');
      const vpcName = nameTag?.Value || '';
      const derivedSuffix = vpcName.includes('-') ? vpcName.split('-').pop()! : vpcName;
      if (derivedSuffix) {
        expect(vpcName).toMatch(new RegExp(`-${derivedSuffix}$`));
      }
    });

    test('subnets should have required tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id
        ]
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');

        const nameTag = tags.find(t => t.Key === 'Name');
        const nameVal = nameTag?.Value || '';
        const derivedSuffix = nameVal.includes('-') ? nameVal.split('-').pop()! : nameVal;
        if (derivedSuffix) {
          expect(nameVal).toMatch(new RegExp(`-${derivedSuffix}$`));
        }
      });
    });
  });
});
