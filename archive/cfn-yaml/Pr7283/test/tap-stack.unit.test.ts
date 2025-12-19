import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  const getParameter = (name: string) => template.Parameters?.[name];
  const getResource = (name: string) => template.Resources?.[name];
  const getOutput = (name: string) => template.Outputs?.[name];

  describe('Template metadata', () => {
    test('exposes the expected format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('groups parameters via interface metadata', () => {
      const iface = template.Metadata['AWS::CloudFormation::Interface'];

      expect(iface.ParameterGroups).toHaveLength(3);
      expect(iface.ParameterLabels.KeyPairName.default).toBe('EC2 Key Pair Name');
      expect(
        iface.ParameterGroups.flatMap((group: any) => group.Parameters)
      ).toEqual([
        'VPCCidr',
        'PublicSubnetCidr',
        'KeyPairName',
        'InstanceType',
        'LatestAmiId',
        'EnvironmentTag',
        'ProjectName',
      ]);
    });
  });

  describe('Parameter definitions', () => {
    test('VPCCidr parameter enforces CIDR format and default', () => {
      const parameter = getParameter('VPCCidr');

      expect(parameter.Type).toBe('String');
      expect(parameter.Default).toBe('10.0.0.0/16');
      expect(parameter.AllowedPattern).toContain('\\.');
      expect(parameter.ConstraintDescription).toMatch(/valid CIDR/);
    });

    test('PublicSubnetCidr shares the same validation as VPCCidr', () => {
      const subnet = getParameter('PublicSubnetCidr');
      const vpc = getParameter('VPCCidr');

      expect(subnet.AllowedPattern).toBe(vpc.AllowedPattern);
      expect(subnet.Default).toBe('10.0.1.0/24');
    });

    test('HasKeyPair only accepts boolean-like strings', () => {
      const flag = getParameter('HasKeyPair');
      expect(flag.AllowedValues).toEqual(['true', 'false']);
    });

    test('KeyPairName restricts allowed characters and enforces dependency description', () => {
      const parameter = getParameter('KeyPairName');

      expect(parameter.AllowedPattern).toBe('^[A-Za-z0-9._-]{0,255}$');
      expect(parameter.ConstraintDescription).toContain('HasKeyPair');
    });

    test.each([
      ['InstanceType', 't2.micro', ['t2.micro', 't2.small', 't2.medium']],
      ['EnvironmentTag', 'Testing', ['Development', 'Testing', 'Staging', 'Production']],
    ])('%s parameter enforces allowed values and defaults', (name, def, allowed) => {
      const parameter = getParameter(name);
      expect(parameter.Default).toBe(def);
      expect(parameter.AllowedValues).toEqual(allowed);
    });
  });

  describe('Conditions and rules', () => {
    test('UseExistingKeyPair reflects HasKeyPair flag', () => {
      const condition = template.Conditions.UseExistingKeyPair;

      expect(condition['Fn::Equals']).toEqual([{ Ref: 'HasKeyPair' }, 'true']);
    });

    test('RequireKeyPairNameWhenEnabled forces non-empty key pair names', () => {
      const rule = template.Rules.RequireKeyPairNameWhenEnabled;

      expect(rule.RuleCondition).toEqual({
        'Fn::Equals': [{ Ref: 'HasKeyPair' }, 'true'],
      });
      expect(rule.Assertions[0].Assert['Fn::Not']).toEqual([
        { 'Fn::Equals': [{ Ref: 'KeyPairName' }, ''] },
      ]);
    });
  });

  describe('Network resources', () => {
    test('VPC configures CIDR and DNS support', () => {
      const vpc = getResource('VPC');

      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Public subnet consumes the VPC and subnet CIDR parameters', () => {
      const subnet = getResource('PublicSubnet');

      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnetCidr' });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Route resources wire the IGW, route table, and subnet together', () => {
      const attach = getResource('AttachGateway');
      const route = getResource('PublicRoute');
      const association = getResource('PublicSubnetRouteTableAssociation');

      expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(route.DependsOn).toBe('AttachGateway');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });
  });

  describe('Security posture', () => {
    test('Security group ingress exposes only SSH and HTTP from 0.0.0.0/0', () => {
      const ingress = getResource('WebServerSecurityGroup').Properties.SecurityGroupIngress;
      const ports = ingress.map((rule: any) => rule.FromPort);

      expect(ports).toEqual([22, 80]);
      ingress.forEach((rule: any) => expect(rule.CidrIp).toBe('0.0.0.0/0'));
    });

    test('Security group egress restricts destinations appropriately', () => {
      const egress = getResource('WebServerSecurityGroup').Properties.SecurityGroupEgress;

      const ssh = egress.find((rule: any) => rule.ToPort === 22);
      expect(ssh.CidrIp).toEqual({ Ref: 'VPCCidr' });
      expect(
        egress.filter((rule: any) => [80, 443].includes(rule.ToPort)).every((rule: any) => rule.CidrIp === '0.0.0.0/0')
      ).toBe(true);
    });
  });

  describe('Compute resources', () => {
    test('Web server instance references subnet, security group, AMI, and type', () => {
      const instance = getResource('WebServerInstance');

      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(instance.Properties.SecurityGroupIds).toEqual([{ Ref: 'WebServerSecurityGroup' }]);
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('Web server instance key pair selection is conditional', () => {
      const keyName = getResource('WebServerInstance').Properties.KeyName;
      expect(keyName['Fn::If']).toEqual([
        'UseExistingKeyPair',
        { Ref: 'KeyPairName' },
        { Ref: 'AWS::NoValue' },
      ]);
    });

    test('User data script logs stack metadata', () => {
      const script =
        getResource('WebServerInstance').Properties.UserData['Fn::Base64']['Fn::Sub'];

      expect(script).toContain('Stack: ${AWS::StackName}');
      expect(script).toContain('Environment: ${EnvironmentTag}');
    });
  });

  describe('Outputs', () => {
    test('Critical networking and compute outputs exist', () => {
      [
        'VPCId',
        'PublicSubnetId',
        'InternetGatewayId',
        'PublicRouteTableId',
        'WebServerInstanceId',
        'WebServerPublicIP',
      ].forEach(outputName => expect(getOutput(outputName)).toBeDefined());
    });

    test('SSH and HTTP outputs reference the instance public IP', () => {
      const ssh = getOutput('SSHConnectionCommand');
      const http = getOutput('HTTPEndpoint');

      expect(ssh.Value['Fn::Sub']).toContain('${WebServerInstance.PublicIp}');
      expect(http.Value['Fn::Sub']).toBe('http://${WebServerInstance.PublicIp}');
    });
  });
});
