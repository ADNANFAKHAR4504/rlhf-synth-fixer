import fs from 'fs';
import path from 'path';

describe('Network Environment CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // --- General Template Structure Tests ---
  test('Template should have a valid format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('Template should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
  });

  test('Template should have a Resources section', () => {
    expect(template.Resources).toBeDefined();
  });

  test('Template should have an Outputs section', () => {
    expect(template.Outputs).toBeDefined();
  });

  // --- Resources Tests ---
  test('VPC resource should be defined with correct CIDR', () => {
    const vpc = template.Resources.VPC;
    expect(vpc).toBeDefined();
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
  });

  test('Public and Private subnets should be defined with correct CIDRs and properties', () => {
    const publicSubnet1 = template.Resources.PublicSubnet1;
    const publicSubnet2 = template.Resources.PublicSubnet2;
    const privateSubnet1 = template.Resources.PrivateSubnet1;
    const privateSubnet2 = template.Resources.PrivateSubnet2;

    expect(publicSubnet1).toBeDefined();
    expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
    expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

    expect(publicSubnet2).toBeDefined();
    expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);

    expect(privateSubnet1).toBeDefined();
    expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
    expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);

    expect(privateSubnet2).toBeDefined();
    expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
  });

  test('Internet Gateway and VPC attachment should exist', () => {
    expect(template.Resources.InternetGateway).toBeDefined();
    const vpcAttachment = template.Resources.VPCGatewayAttachment;
    expect(vpcAttachment).toBeDefined();
    expect(vpcAttachment.Properties.VpcId.Ref).toBe('VPC');
    expect(vpcAttachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
  });

  test('Public subnets should be associated with the public route table', () => {
    const pubRouteTableAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
    const pubRouteTableAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
    expect(pubRouteTableAssoc1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    expect(pubRouteTableAssoc1.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
    expect(pubRouteTableAssoc2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    expect(pubRouteTableAssoc2.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
  });

  test('Public route table should have a default route to the Internet Gateway', () => {
    const publicRoute = template.Resources.PublicRoute;
    expect(publicRoute).toBeDefined();
    expect(publicRoute.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
    expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(publicRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
  });

  test('NAT Gateways and EIPs should be defined', () => {
    expect(template.Resources.EIP1).toBeDefined();
    expect(template.Resources.EIP2).toBeDefined();
    
    const natGateway1 = template.Resources.NATGateway1;
    expect(natGateway1).toBeDefined();
    expect(natGateway1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    
    const natGateway2 = template.Resources.NATGateway2;
    expect(natGateway2).toBeDefined();
    expect(natGateway2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
  });

  test('Private subnets should have a default route to their respective NAT Gateways', () => {
    const privateRoute1 = template.Resources.PrivateRoute1;
    const privateRoute2 = template.Resources.PrivateRoute2;
    
    expect(privateRoute1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
    expect(privateRoute1.Properties.NatGatewayId.Ref).toBe('NATGateway1');
    expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    
    expect(privateRoute2.Properties.RouteTableId.Ref).toBe('PrivateRouteTable2');
    expect(privateRoute2.Properties.NatGatewayId.Ref).toBe('NATGateway2');
    expect(privateRoute2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
  });

  test('EC2 instances should be in private subnets with no public IPs', () => {
    const instance1 = template.Resources.EC2Instance1;
    const instance2 = template.Resources.EC2Instance2;

    expect(instance1).toBeDefined();
    expect(instance1.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
    // MapPublicIpOnLaunch is on the subnet, so this check is indirect.
    
    expect(instance2).toBeDefined();
    expect(instance2.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
  });
  
  // --- Outputs Tests ---
  test('Outputs section should contain all required IDs', () => {
    const outputs = template.Outputs;
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.PublicSubnet1Id).toBeDefined();
    expect(outputs.PublicSubnet2Id).toBeDefined();
    expect(outputs.PrivateSubnet1Id).toBeDefined();
    expect(outputs.PrivateSubnet2Id).toBeDefined();
    expect(outputs.NATGateway1Id).toBeDefined();
    expect(outputs.NATGateway2Id).toBeDefined();
  });
});