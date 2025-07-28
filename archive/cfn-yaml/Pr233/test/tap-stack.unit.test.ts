import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
    });

    test('should define Resources section', () => {
      expect(template.Resources).toBeDefined();
    });
  });

  describe('Resources', () => {
    const resourceNames = [
      'vpcDevelopment',
      'publicSubnet',
      'privateSubnet',
      'internetGateway',
      'attachGateway',
      'publicRouteTable',
      'publicRoute',
      'publicSubnetRouteTableAssociation',
      'elasticIP',
      'natGateway',
      'privateRouteTable',
      'privateRoute',
      'privateSubnetRouteTableAssociation',
      'securityGroup',
      'publicInstance',
      'privateInstance'
    ];

    resourceNames.forEach(name => {
      test(`should define ${name}`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });

    test('vpcDevelopment should be a VPC resource', () => {
      expect(template.Resources.vpcDevelopment.Type).toBe('AWS::EC2::VPC');
    });

    test('publicSubnet should map public IPs on launch', () => {
      expect(template.Resources.publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('natGateway should use an AllocationId and SubnetId', () => {
      const nat = template.Resources.natGateway.Properties;
      expect(nat.AllocationId).toBeDefined();
      expect(nat.SubnetId).toBeDefined();
    });

    test('EC2 instances should use security group', () => {
      const publicInstance = template.Resources.publicInstance.Properties;
      const privateInstance = template.Resources.privateInstance.Properties;

      expect(publicInstance.SecurityGroupIds).toBeDefined();
      expect(privateInstance.SecurityGroupIds).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should define Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });

    const expectedOutputs = [
      'VPCId',
      'PublicSubnetId',
      'PrivateSubnetId',
      'NATGatewayId',
      'NatEIPAllocationId',
      'InternetGatewayId',
      'SecurityGroupId',
      'PublicInstanceId',
      'PrivateInstanceId'
    ];

    expectedOutputs.forEach(outputName => {
      test(`should define output: ${outputName}`, () => {
        expect(template.Outputs).toBeDefined();
        expect(template.Outputs[outputName]).toBeDefined();
      });

      test(`${outputName} output should export value`, () => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputName}`,
        });
      });
    });
  });

  describe('Naming Convention Checks', () => {
    test('resource names should use environment suffix where applicable', () => {
      const instance = template.Resources.publicInstance;
      expect(instance.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: 'Development',
          }),
        ])
      );
    });

    test('Outputs should use Fn::Sub with StackName in Export', () => {
      for (const key in template.Outputs) {
        const exportName = template.Outputs[key].Export?.Name;
        expect(exportName).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${key}`,
        });
      }
    });
  });
});