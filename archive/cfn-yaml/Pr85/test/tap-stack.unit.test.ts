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

  test('Allowed SSH Location CIDR pattern', () => {
    const sshParam = template.Parameters?.SshCidrBlock;
    expect(sshParam).toBeDefined();
    expect(sshParam.AllowedPattern).toBe(
      '^([0-9]{1,3}\\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$'
    );
  });

  test('AMI ID parameter exists', () => {
    const ami = template.Parameters?.AmiId;
    expect(ami).toBeDefined();
  });

  test('VPC with DNS support and hostnames', () => {
    const vpcs = getResourcesOfType(template, 'AWS::EC2::VPC');
    expect(vpcs.length).toBeGreaterThan(0);
    const props = vpcs[0].Properties;
    expect(props.EnableDnsSupport).toBe(true);
    expect(props.EnableDnsHostnames).toBe(true);
  });

  test('InternetGateway and attachment exist', () => {
    const igws = getResourcesOfType(template, 'AWS::EC2::InternetGateway');
    const attachments = getResourcesOfType(template, 'AWS::EC2::VPCGatewayAttachment');
    expect(igws.length).toBe(1);
    expect(attachments.length).toBe(1);
  });

  test('NAT Gateway and EIP exist', () => {
    const eips = getResourcesOfType(template, 'AWS::EC2::EIP');
    const natGws = getResourcesOfType(template, 'AWS::EC2::NatGateway');
    expect(eips.length).toBeGreaterThanOrEqual(1);
    expect(natGws.length).toBe(1);
  });

  test('Public route to IGW exists', () => {
    const routes = getResourcesOfType(template, 'AWS::EC2::Route');
    const publicRoute = routes.find(r => r.Properties?.GatewayId);
    expect(publicRoute).toBeDefined();
    expect(publicRoute?.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
  });

  test('Private route using NAT exists', () => {
    const routes = getResourcesOfType(template, 'AWS::EC2::Route');
    const privateRoute = routes.find(r => r.Properties?.NatGatewayId);
    expect(privateRoute).toBeDefined();
  });

  test('EC2 Instances use AMI ID reference', () => {
    const instances = getResourcesOfType(template, 'AWS::EC2::Instance');
    expect(instances.length).toBe(2);
    for (const inst of instances) {
      const imageId = inst.Properties?.ImageId;
      expect(imageId).toBeDefined();
      expect(typeof imageId).toBe('object');
      expect(imageId.Ref).toBe('AmiId');
    }
  });

  test('Security group allows SSH and HTTP', () => {
    const sgs = getResourcesOfType(template, 'AWS::EC2::SecurityGroup');
    expect(sgs.length).toBeGreaterThan(0);
    const ingress = sgs[0].Properties?.SecurityGroupIngress || [];
    const fromPorts = ingress.map((r: any) => r.FromPort);
    const toPorts = ingress.map((r: any) => r.ToPort);
    expect(fromPorts).toContain(22);
    expect(toPorts).toContain(22);
    expect(fromPorts).toContain(80);
    expect(toPorts).toContain(80);
  });

  test('Outputs section exists and has expected keys', () => {
    const outputs = template.Outputs;
    expect(outputs).toBeDefined();
    const expected = [
      'VPCId',
      'PublicSubnetId',
      'PrivateSubnetId',
      'PublicInstanceId',
      'PrivateInstanceId',
      'PublicInstancePublicIP',
    ];
    expected.forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });
});
