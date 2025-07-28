import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
const template = Template.fromJSON(templateData);

describe('CloudFormation Template Validation', () => {
  it('creates a VPC with correct CIDR', () => {
    const vpcs = template.findResources('AWS::EC2::VPC');
    expect(Object.values(vpcs)).toHaveLength(1);
    const vpc = Object.values(vpcs)[0] as any;
    expect(vpc.Properties).toHaveProperty('CidrBlock', '10.0.0.0/16');
    expect(vpc.Properties).toHaveProperty('EnableDnsSupport', true);
    expect(vpc.Properties).toHaveProperty('EnableDnsHostnames', true);
  });

  it('creates two public subnets with correct CIDRs', () => {
    const subnets = template.findResources('AWS::EC2::Subnet');
    const subnetList = Object.values(subnets) as any[];
    expect(subnetList.length).toBe(2);
    const cidrs = subnetList.map(s => s.Properties.CidrBlock);
    expect(cidrs).toContain('10.0.1.0/24');
    expect(cidrs).toContain('10.0.2.0/24');
  });

  it('attaches Internet Gateway to the VPC', () => {
    const attachments = template.findResources('AWS::EC2::VPCGatewayAttachment');
    const attachment = Object.values(attachments)[0] as any;
    expect(attachment.Properties).toHaveProperty('VpcId');
    expect(attachment.Properties).toHaveProperty('InternetGatewayId');
  });

  it('creates a route to the Internet Gateway', () => {
    const routes = template.findResources('AWS::EC2::Route');
    const route = Object.values(routes)[0] as any;
    expect(route.Properties).toHaveProperty('DestinationCidrBlock', '0.0.0.0/0');
    expect(route.Properties).toHaveProperty('GatewayId');
  });

  it('associates route table with both public subnets', () => {
    const associations = template.findResources('AWS::EC2::SubnetRouteTableAssociation');
    const assocList = Object.values(associations) as any[];
    expect(assocList.length).toBe(2);
    assocList.forEach(assoc => {
      expect(assoc.Properties).toHaveProperty('SubnetId');
      expect(assoc.Properties).toHaveProperty('RouteTableId');
    });
  });

  it('tags all resources with Environment = Production', () => {
    const allResources = Object.values(templateData.Resources);
    allResources.forEach((res: any) => {
      const tags = res?.Properties?.Tags;
      if (tags) {
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag?.Value).toBe('Production');
      }
    });
  });

  it('ensures Internet Gateway is tagged for Production', () => {
    const igws = template.findResources('AWS::EC2::InternetGateway');
    for (const igw of Object.values(igws)) {
      const tags = igw.Properties?.Tags || [];
      const envTag = tags.find((t: any) => t.Key === 'Environment' && t.Value === 'Production');
      expect(envTag).toBeDefined();
    }
  });

  it('ensures route to IGW is correctly configured', () => {
    const routes = template.findResources('AWS::EC2::Route');
    for (const route of Object.values(routes)) {
      expect(route.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties?.GatewayId?.Ref).toBe('IGW');
    }
  });

  it('ensures all VPC resources are tagged with ManagedBy = CloudFormation', () => {
  const resources = template.findResources('AWS::EC2::VPC');
  for (const res of Object.values(resources) as any[]) {
    const tags = res?.Properties?.Tags || [];
    const managedBy = tags.find((t: any) => t.Key === 'ManagedBy' && t.Value === 'CloudFormation');
    expect(managedBy).toBeDefined();
  }
});

  it('validates CloudFormation Outputs', () => {
    const outputs = template.toJSON().Outputs;
    const expected = [
      'VPCId',
      'PublicSubnetAId',
      'PublicSubnetBId',
      'InternetGatewayId',
      'PublicRouteTableId',
      'StackName'
    ];
    expected.forEach(o => expect(outputs).toHaveProperty(o));
  });

  it('fails if any subnet CIDR is outside VPC CIDR block', () => {
    const vpcCidrPrefix = '10.0.';
    const subnets = template.findResources('AWS::EC2::Subnet');
    for (const subnet of Object.values(subnets)) {
      const cidr = subnet.Properties?.CidrBlock;
      expect(cidr.startsWith(vpcCidrPrefix)).toBe(true);
    }
  });

  it('fails if any public subnet is not mapped to a public route table', () => {
    const associations = template.findResources('AWS::EC2::SubnetRouteTableAssociation');
    const publicSubnets = ['PublicSubnetA', 'PublicSubnetB'];
    const publicRouteTable = 'PublicRouteTable';

    for (const assoc of Object.values(associations)) {
      const subnetRef = assoc.Properties?.SubnetId?.Ref;
      const routeRef = assoc.Properties?.RouteTableId?.Ref;

      if (publicSubnets.includes(subnetRef)) {
        expect(routeRef).toBe(publicRouteTable);
      }
    }
  });

  it('fails if Internet Gateway is not attached to VPC', () => {
    const attachments = template.findResources('AWS::EC2::VPCGatewayAttachment');
    expect(Object.keys(attachments).length).toBeGreaterThan(0);

    for (const attachment of Object.values(attachments)) {
      expect(attachment.Properties).toHaveProperty('VpcId');
      expect(attachment.Properties).toHaveProperty('InternetGatewayId');
    }
  });

  it('fails if route table has no routes defined', () => {
    const routes = template.findResources('AWS::EC2::Route');
    expect(Object.keys(routes).length).toBeGreaterThan(0);

    for (const route of Object.values(routes)) {
      expect(route.Properties?.DestinationCidrBlock).toBeDefined();
      expect(route.Properties?.GatewayId).toBeDefined();
    }
  });
  it('ensures public subnets have MapPublicIpOnLaunch set to true', () => {
  const subnets = template.findResources('AWS::EC2::Subnet');
  for (const [logicalId, subnet] of Object.entries(subnets)) {
    if (logicalId.startsWith('PublicSubnet')) {
      expect(subnet.Properties?.MapPublicIpOnLaunch).toBe(true);
    }
  }
});
it('ensures exactly one public route table exists', () => {
  const routeTables = template.findResources('AWS::EC2::RouteTable');
  const publicRouteTables = Object.entries(routeTables).filter(
    ([, rt]: any) =>
      rt.Properties?.Tags?.some(
        (tag: any) => tag.Key === 'Type' && tag.Value === 'Public'
      )
  );
  expect(publicRouteTables.length).toBe(1);
});
it('ensures logical IDs follow naming conventions', () => {
  const resourceKeys = Object.keys(template.toJSON().Resources || {});
  const expectedPrefixes = [
    'ProductionVPC',
    'PublicSubnetA',
    'PublicSubnetB',
    'PublicRouteTable',
    'PublicRoute',
    'PublicSubnetARouteTableAssociation',
    'PublicSubnetBRouteTableAssociation',
    'IGW',
    'AttachIGW',
  ];

  expectedPrefixes.forEach(expected => {
    const match = resourceKeys.find(id => id === expected);
    expect(match).toBeDefined();
  });
});

});
