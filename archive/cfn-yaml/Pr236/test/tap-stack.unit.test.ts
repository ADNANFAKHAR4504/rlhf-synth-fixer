import * as fs from 'fs';
import * as path from 'path';

describe('TapStack.json', () => {
  const stackFilePath = path.join(__dirname, '../lib/TapStack.json');
  let stack: any;

  beforeAll(() => {
    const rawData = fs.readFileSync(stackFilePath, 'utf-8');
    stack = JSON.parse(rawData);
  });

  test('VPC is defined with correct CIDR block', () => {
    const vpc = stack.Resources?.ProductionVPC;
    expect(vpc).toBeDefined();
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
  });

  test('VPC has DNS support and hostnames enabled', () => {
    const props = stack.Resources.ProductionVPC.Properties;
    expect(props.EnableDnsSupport).toBe(true);
    expect(props.EnableDnsHostnames).toBe(true);
  });

  test('Internet Gateway is properly attached', () => {
    const attachIGW = stack.Resources?.AttachIGW;
    expect(attachIGW).toBeDefined();
    expect(attachIGW.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(attachIGW.Properties.VpcId).toEqual({ Ref: 'ProductionVPC' });
    expect(attachIGW.Properties.InternetGatewayId).toEqual({ Ref: 'IGW' });
  });

  test('PublicSubnetA is in the correct CIDR range', () => {
    const subnetA = stack.Resources?.PublicSubnetA;
    expect(subnetA).toBeDefined();
    expect(subnetA.Type).toBe('AWS::EC2::Subnet');
    expect(subnetA.Properties.CidrBlock).toBe('10.0.1.0/24');
    expect(subnetA.Properties.MapPublicIpOnLaunch).toBe(true);
  });

  test('PublicSubnetB is in the correct CIDR range', () => {
    const subnetB = stack.Resources?.PublicSubnetB;
    expect(subnetB).toBeDefined();
    expect(subnetB.Properties.CidrBlock).toBe('10.0.2.0/24');
  });

  test('Route Table has a default route to IGW', () => {
    const route = stack.Resources?.PublicRoute;
    expect(route).toBeDefined();
    expect(route.Type).toBe('AWS::EC2::Route');
    expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(route.Properties.GatewayId).toEqual({ Ref: 'IGW' });
  });

  test('PublicSubnetA is associated with the route table', () => {
    const assocA = stack.Resources?.PublicSubnetARouteTableAssociation;
    expect(assocA).toBeDefined();
    expect(assocA.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetA' });
    expect(assocA.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
  });

  test('PublicSubnetB is associated with the route table', () => {
    const assocB = stack.Resources?.PublicSubnetBRouteTableAssociation;
    expect(assocB).toBeDefined();
    expect(assocB.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetB' });
    expect(assocB.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
  });



  test('Outputs export correct references', () => {
    const outputs = stack.Outputs;
    expect(outputs?.VPCId?.Value).toEqual({ Ref: 'ProductionVPC' });
    expect(outputs?.PublicSubnetAId?.Value).toEqual({ Ref: 'PublicSubnetA' });
    expect(outputs?.PublicSubnetBId?.Value).toEqual({ Ref: 'PublicSubnetB' });
    expect(outputs?.InternetGatewayId?.Value).toEqual({ Ref: 'IGW' });
    expect(outputs?.PublicRouteTableId?.Value).toEqual({ Ref: 'PublicRouteTable' });
  });

  test('StackName output correctly references the stack', () => {
    const output = stack.Outputs?.StackName;
    expect(output).toBeDefined();
    expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
  });
});