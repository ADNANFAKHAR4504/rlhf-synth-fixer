import fs from 'fs';
import path from 'path';

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

let template: any;

beforeAll(() => {
  const templatePath = path.resolve(__dirname, '..', 'lib', 'TapStack.json');
  const raw = fs.readFileSync(templatePath, 'utf-8');
  template = JSON.parse(raw);
});

function getResourcesOfType(template: any, resourceType: string): any[] {
  return Object.values(template?.Resources || {}).filter(
    (res: any) => res.Type === resourceType
  );
}

describe('CloudFormation Template Tests', () => {
  test('template format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('template description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toContain('TAP Stack');
    expect(template.Description).toContain('LocalStack Compatible');
  });

  test('metadata and parameter groups exist', () => {
    const metadata = template.Metadata?.['AWS::CloudFormation::Interface'];
    expect(metadata).toBeDefined();
    expect(metadata.ParameterGroups).toBeDefined();
  });

  test('EnvironmentSuffix parameter', () => {
    const param = template.Parameters?.EnvironmentSuffix;
    expect(param).toBeDefined();
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('dev');
    expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
  });

  test('VPC CIDR parameters exist', () => {
    const vpcCidr = template.Parameters?.VpcCidrBlock;
    const publicCidr = template.Parameters?.PublicSubnetCidrBlock;
    const privateCidr = template.Parameters?.PrivateSubnetCidrBlock;

    expect(vpcCidr).toBeDefined();
    expect(publicCidr).toBeDefined();
    expect(privateCidr).toBeDefined();
  });

  test('EC2-related parameters do not exist (LocalStack compatibility)', () => {
    expect(template.Parameters?.SshCidrBlock).toBeUndefined();
    expect(template.Parameters?.InstanceType).toBeUndefined();
    expect(template.Parameters?.KeyName).toBeUndefined();
    expect(template.Parameters?.AmiId).toBeUndefined();
  });

  test('VPC with DNS support and hostnames', () => {
    const vpcs = getResourcesOfType(template, 'AWS::EC2::VPC');
    expect(vpcs.length).toBeGreaterThan(0);
    const props = vpcs[0].Properties;
    expect(props.EnableDnsSupport).toBe(true);
    expect(props.EnableDnsHostnames).toBe(true);
  });

  test('Public and Private subnets exist', () => {
    const subnets = getResourcesOfType(template, 'AWS::EC2::Subnet');
    expect(subnets.length).toBe(2);
  });

  test('InternetGateway and attachment exist', () => {
    const igws = getResourcesOfType(template, 'AWS::EC2::InternetGateway');
    const attachments = getResourcesOfType(template, 'AWS::EC2::VPCGatewayAttachment');
    expect(igws.length).toBe(1);
    expect(attachments.length).toBe(1);
  });

  test('NAT Gateway does not exist (LocalStack compatibility)', () => {
    const eips = getResourcesOfType(template, 'AWS::EC2::EIP');
    const natGws = getResourcesOfType(template, 'AWS::EC2::NatGateway');
    expect(eips.length).toBe(0);
    expect(natGws.length).toBe(0);
  });

  test('Public route to IGW exists', () => {
    const routes = getResourcesOfType(template, 'AWS::EC2::Route');
    const publicRoute = routes.find(r => r.Properties?.GatewayId);
    expect(publicRoute).toBeDefined();
    expect(publicRoute?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
  });

  test('Route tables exist', () => {
    const routeTables = getResourcesOfType(template, 'AWS::EC2::RouteTable');
    expect(routeTables.length).toBe(2); // Public and Private
  });

  test('EC2 Instances do not exist (LocalStack compatibility)', () => {
    const instances = getResourcesOfType(template, 'AWS::EC2::Instance');
    expect(instances.length).toBe(0);
  });

  test('Security group exists with HTTPS access', () => {
    const sgs = getResourcesOfType(template, 'AWS::EC2::SecurityGroup');
    expect(sgs.length).toBeGreaterThan(0);
    const ingress = sgs[0].Properties?.SecurityGroupIngress || [];
    const fromPorts = ingress.map((r: any) => r.FromPort);
    const toPorts = ingress.map((r: any) => r.ToPort);
    expect(fromPorts).toContain(443);
    expect(toPorts).toContain(443);
  });

  test('Outputs section exists and has expected VPC keys', () => {
    const outputs = template.Outputs;
    expect(outputs).toBeDefined();
    const expected = [
      'VPCId',
      'PublicSubnetId',
      'PrivateSubnetId',
      'SecurityGroupId',
      'InternetGatewayId',
    ];
    expected.forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('EC2 instance outputs do not exist (LocalStack compatibility)', () => {
    const outputs = template.Outputs;
    expect(outputs?.PublicInstanceId).toBeUndefined();
    expect(outputs?.PrivateInstanceId).toBeUndefined();
    expect(outputs?.PublicInstancePublicIP).toBeUndefined();
  });

  test('Outputs have exports with stack name', () => {
    const outputs = template.Outputs;
    Object.values(outputs).forEach((output: any) => {
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });
  });
});
