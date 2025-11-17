import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Multi-Environment Payment Processing Infrastructure'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBe('Unique suffix for resource naming');
      expect(envSuffixParam.MinLength).toBe(3);
      expect(envSuffixParam.MaxLength).toBe(30);
    });
  });

  describe('Resources', () => {
    describe('VPC', () => {
      test('should have VPC resource', () => {
        expect(template.Resources.VPC).toBeDefined();
      });

      test('VPC should have correct type', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
      });

      test('VPC should have correct properties', () => {
        const vpc = template.Resources.VPC;
        const properties = vpc.Properties;

        expect(properties.CidrBlock).toEqual({
          'Ref': 'VPCCidr'
        });
        expect(properties.EnableDnsHostnames).toBe(true);
        expect(properties.EnableDnsSupport).toBe(true);
      });

      test('VPC should have correct tags', () => {
        const vpc = template.Resources.VPC;
        const tags = vpc.Properties.Tags;

        expect(tags).toContainEqual({
          Key: 'Name',
          Value: {
            'Fn::Sub': 'vpc-${EnvironmentSuffix}'
          }
        });

        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: {
            'Ref': 'Environment'
          }
        });
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all required resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have all required parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(0);
    });

    test('should have all required outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name tag should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: { Key: string }) => t.Key === 'Name');

      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'vpc-${EnvironmentSuffix}',
      });
    });

    test('VPC should have environment tag', () => {
      const vpc = template.Resources.VPC;
      const envTag = vpc.Properties.Tags.find((t: { Key: string }) => t.Key === 'Environment');

      expect(envTag.Value).toEqual({
        'Ref': 'Environment'
      });
    });

    test('export names should have correct structure', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
      });
    });
  });
});
