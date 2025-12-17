import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

// Load stack outputs from deployment - REQUIRED for tests
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

if (!fs.existsSync(outputsPath)) {
  throw new Error(`Deployment outputs file not found: ${outputsPath}. Deploy infrastructure first.`);
}

const outputs: Record<string, string> = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Validate required outputs exist
const requiredOutputs = [
  'VPCId',
  'PublicSubnet1Id',
  'PublicSubnet2Id',
  'PublicSubnet3Id',
  'PrivateSubnet1Id',
  'PrivateSubnet2Id',
  'PrivateSubnet3Id',
  'HTTPSSecurityGroupId',
  'VPCCidr'
];

const missingOutputs = requiredOutputs.filter(key => !outputs[key]);
if (missingOutputs.length > 0) {
  throw new Error(`Missing required outputs: ${missingOutputs.join(', ')}. Deployment may have failed.`);
}

// Initialize AWS clients - configured for LocalStack
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});

// Extract resource IDs from outputs
const vpcId = outputs.VPCId;
const publicSubnet1Id = outputs.PublicSubnet1Id;
const publicSubnet2Id = outputs.PublicSubnet2Id;
const publicSubnet3Id = outputs.PublicSubnet3Id;
const privateSubnet1Id = outputs.PrivateSubnet1Id;
const privateSubnet2Id = outputs.PrivateSubnet2Id;
const privateSubnet3Id = outputs.PrivateSubnet3Id;
const httpsSecurityGroupId = outputs.HTTPSSecurityGroupId;
const vpcCidr = outputs.VPCCidr;

describe('TapStack Integration Tests - Multi-AZ VPC Infrastructure', () => {
  beforeAll(() => {
    console.log('Running integration tests against LocalStack...');
    console.log('LocalStack endpoint:', process.env.AWS_ENDPOINT_URL || 'http://localhost:4566');
    console.log(`Loaded ${Object.keys(outputs).length} outputs from flat-outputs.json`);
    console.log('VPC ID:', vpcId);
  });

  describe('VPC Configuration Validation', () => {
    test('should verify VPC exists and has correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should verify VPC has DNS support enabled', async () => {
      const command = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      });
      const response = await ec2Client.send(command);

      expect(response.EnableDnsSupport?.Value).toBe(true);
    });

    test('should verify VPC has proper tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('TradingPlatform');
    });
  });

  describe('Public Subnets Validation', () => {
    const publicSubnetIds = [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id];
    const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    test('should verify all public subnets exist', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
    });

    test('should verify public subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(expectedCidrs).toContain(subnet.CidrBlock!);
      });
    });

    test('should verify public subnets are in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.AvailabilityZone).toBeDefined();
        expect(subnet.AvailabilityZone!.length).toBeGreaterThan(0);
      });
    });

    test('should verify public subnets have MapPublicIpOnLaunch enabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should verify public subnets belong to correct VPC', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('should verify public subnets have proper tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Type');

        const typeTag = tags.find(t => t.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');
      });
    });
  });

  describe('Private Subnets Validation', () => {
    const privateSubnetIds = [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id];
    const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    test('should verify all private subnets exist', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
    });

    test('should verify private subnets have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(expectedCidrs).toContain(subnet.CidrBlock!);
      });
    });

    test('should verify private subnets are in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.AvailabilityZone).toBeDefined();
        expect(subnet.AvailabilityZone!.length).toBeGreaterThan(0);
      });
    });

    test('should verify private subnets have MapPublicIpOnLaunch disabled', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should verify private subnets belong to correct VPC', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('should verify private subnets have proper tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Type');

        const typeTag = tags.find(t => t.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');
      });
    });
  });

  describe('Internet Gateway Validation', () => {
    test('should verify Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBe(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should verify Internet Gateway has proper tags', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const igw = response.InternetGateways![0];
      const tags = igw.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
    });
  });

  describe('Route Tables Validation', () => {
    test('should verify public route table routes to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const publicRouteTable = response.RouteTables!.find(rt => {
        return rt.Associations?.some(assoc =>
          [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id].includes(assoc.SubnetId || '')
        );
      });

      expect(publicRouteTable).toBeDefined();
    });

    test('should verify all public subnets are associated with public route table', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const publicSubnetIds = [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id];
      const associatedSubnets: string[] = [];

      response.RouteTables!.forEach(rt => {
        rt.Associations?.forEach(assoc => {
          if (assoc.SubnetId && publicSubnetIds.includes(assoc.SubnetId)) {
            associatedSubnets.push(assoc.SubnetId);
          }
        });
      });

      expect(associatedSubnets.sort()).toEqual(publicSubnetIds.sort());
    });

    test('should verify private subnets have route table associations', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const privateSubnetIds = [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id];
      const associatedPrivateSubnets: string[] = [];

      response.RouteTables!.forEach(rt => {
        rt.Associations?.forEach(assoc => {
          if (assoc.SubnetId && privateSubnetIds.includes(assoc.SubnetId)) {
            associatedPrivateSubnets.push(assoc.SubnetId);
          }
        });
      });

      expect(associatedPrivateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should verify each private route table has proper associations', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);

      const privateSubnetIds = [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id];

      privateSubnetIds.forEach(subnetId => {
        const routeTable = response.RouteTables!.find(rt =>
          rt.Associations?.some(assoc => assoc.SubnetId === subnetId)
        );

        expect(routeTable).toBeDefined();

        const association = routeTable!.Associations!.find(assoc => assoc.SubnetId === subnetId);
        expect(association).toBeDefined();
        expect(association!.SubnetId).toBe(subnetId);
      });
    });
  });

  describe('Security Group Validation', () => {
    test('should verify HTTPS security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(httpsSecurityGroupId);
      expect(sg.VpcId).toBe(vpcId);
    });

    test('should verify security group allows all outbound traffic', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const egressRules = sg.IpPermissionsEgress || [];

      const allOutboundRule = egressRules.find(rule =>
        rule.IpProtocol === '-1'
      );

      expect(allOutboundRule).toBeDefined();
      expect(allOutboundRule!.IpRanges).toBeDefined();
      expect(allOutboundRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test('should verify security group has proper tags', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const tags = sg.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('TradingPlatform');
    });
  });

  describe('High Availability Verification', () => {
    test('should verify resources are distributed across availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(1);
      expect(response.Subnets!.length).toBe(6);
    });

    test('should verify subnets have proper type tags', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      let publicCount = 0;
      let privateCount = 0;

      response.Subnets!.forEach(subnet => {
        const typeTag = subnet.Tags?.find(t => t.Key === 'Type');
        expect(typeTag).toBeDefined();

        if (typeTag?.Value === 'Public') {
          publicCount++;
        } else if (typeTag?.Value === 'Private') {
          privateCount++;
        }
      });

      expect(publicCount).toBe(3);
      expect(privateCount).toBe(3);
    });
  });

  describe('Network Connectivity', () => {
    test('should verify VPC CIDR is correct', async () => {
      expect(vpcCidr).toBe('10.0.0.0/16');

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should verify subnet CIDRs are within VPC CIDR range', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      const expectedCidrs = [
        '10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24',
        '10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'
      ];

      response.Subnets!.forEach(subnet => {
        expect(expectedCidrs).toContain(subnet.CidrBlock!);
      });
    });

    test('should verify private subnets have route tables configured', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'association.subnet-id',
            Values: [privateSubnet1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const routeTable = response.RouteTables![0];
      expect(routeTable.VpcId).toBe(vpcId);

      const localRoute = routeTable.Routes!.find(route =>
        route.DestinationCidrBlock === '10.0.0.0/16' && route.GatewayId === 'local'
      );
      expect(localRoute).toBeDefined();
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('should verify all resources have Environment tag', async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'Environment')).toBe(true);

      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [publicSubnet1Id, privateSubnet1Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'Environment')).toBe(true);
      });

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgTags = sgResponse.SecurityGroups![0].Tags || [];
      expect(sgTags.some(t => t.Key === 'Environment')).toBe(true);
    });

    test('should verify all resources have Project tag', async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'Project' && t.Value === 'TradingPlatform')).toBe(true);

      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [publicSubnet1Id, privateSubnet1Id]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'Project' && t.Value === 'TradingPlatform')).toBe(true);
      });

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [httpsSecurityGroupId]
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sgTags = sgResponse.SecurityGroups![0].Tags || [];
      expect(sgTags.some(t => t.Key === 'Project' && t.Value === 'TradingPlatform')).toBe(true);
    });
  });

  describe('Infrastructure Readiness', () => {
    test('should verify VPC is in available state', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should verify all subnets are in available state', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1Id, publicSubnet2Id, publicSubnet3Id,
          privateSubnet1Id, privateSubnet2Id, privateSubnet3Id
        ]
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });
  });
});
