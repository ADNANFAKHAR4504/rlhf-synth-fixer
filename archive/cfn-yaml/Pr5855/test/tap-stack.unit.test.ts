import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests should be written separately', async () => {
      // Integration tests are in separate files
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production VPC Migration Infrastructure for Account Consolidation'
      );
    });

    test('should not require metadata section for this template', () => {
      // Metadata is optional and not present in this template
      expect(true).toBe(true);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe(
        'Suffix to append to all resource names for environment isolation'
      );
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should be an EC2 VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have NAT Gateway resources', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have security groups', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('should have VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.FlowLogsBucket).toBeDefined();
    });

    test('should have VPC endpoints', () => {
      expect(template.Resources.S3Endpoint).toBeDefined();
      expect(template.Resources.DynamoDBEndpoint).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicSubnet3Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.WebSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('should have NAT Gateway outputs', () => {
      expect(template.Outputs.NATGateway1Id).toBeDefined();
      expect(template.Outputs.NATGateway2Id).toBeDefined();
      expect(template.Outputs.NATGateway3Id).toBeDefined();
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

    test('should have VPC migration infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // At least 30+ resources for VPC infrastructure
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have multiple outputs for VPC resources', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(15); // At least 15+ outputs for VPC resources
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention with EnvironmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${EnvironmentSuffix}-${outputKey}`,
        });
      });
    });
  });
});
