import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Reading YAML template directly
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  describe('Write Unit TESTS', () => {
    test('Template should be valid YAML', async () => {
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const privateSubnet1 = template.Resources.PrivateSubnet1;
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();

      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();

      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
      expect(template.Resources.PrivateRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have security group with restricted SSH access', () => {
      expect(template.Resources.PublicSecurityGroup).toBeDefined();

      const securityGroup = template.Resources.PublicSecurityGroup;
      expect(securityGroup.Type).toBe('AWS::EC2::SecurityGroup');

      const sshRule = securityGroup.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/8'); // Should not be 0.0.0.0/0
    });
  });

  describe('Outputs', () => {
    test('should have all VPC-related outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'InternetGatewayId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toContain('VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });
  });
});
