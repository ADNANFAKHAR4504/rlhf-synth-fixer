import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      expect(template.Description).toBe(
        'Basic networking setup with VPC, public/private subnets, and internet acces'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should be configured correctly', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    const resources = [
      'VPC',
      'PublicSubnet',
      'PrivateSubnet',
      'InternetGateway',
      'VPCGatewayAttachment',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnetRouteTableAssociation',
    ];

    resources.forEach(resource => {
      test(`should include ${resource}`, () => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('PublicSubnet should map public IP on launch', () => {
      expect(
        template.Resources.PublicSubnet.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('PrivateSubnet should not map public IP', () => {
      expect(
        template.Resources.PrivateSubnet.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });

    test('PublicRoute should use InternetGateway and 0.0.0.0/0 destination', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Outputs', () => {
    const outputKeys = [
      'VPCId',
      'PublicSubnetId',
      'PrivateSubnetId',
      'InternetGatewayId',
      'PublicRouteTableId',
    ];

    test('should contain all required outputs', () => {
      outputKeys.forEach(key => {
        expect(template.Outputs[key]).toBeDefined();
      });
    });

    test('all outputs should export with correct naming convention', () => {
      outputKeys.forEach(key => {
        const exportName = template.Outputs[key].Export.Name;
        expect(exportName).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${key}`,
        });
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should be tagged with Environment', () => {
      Object.entries(template.Resources).forEach(([name, resource]: any) => {
        const tags = resource.Properties?.Tags || [];
        const hasEnvironmentTag = tags.some(
          (tag: any) => tag.Key === 'Environment'
        );
        if (tags.length > 0) {
          expect(hasEnvironmentTag).toBe(true);
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('template structure should be valid', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('template should include all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have exactly one parameter', () => {
      expect(Object.keys(template.Parameters).length).toBe(1);
    });

    test('should have 13 resources defined', () => {
      expect(Object.keys(template.Resources).length).toBe(13);
    });

    test('should have 5 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBe(5);
    });
  });
});
