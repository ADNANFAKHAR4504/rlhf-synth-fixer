import fs from 'fs';
import path from 'path';

interface Template {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

let template: Template;

describe('Security-Focused CloudFormation Template', () => {
  beforeAll(() => {
    // Convert YAML to JSON before testing
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
        'Secure AWS Infrastructure with comprehensive security controls, monitoring, and compliance features'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'Environment',
        'VpcCidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toBe('Environment name for resource naming and configuration');
    });

    test('VPC CIDR parameter should have correct validation pattern', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe(
        '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$'
      );
    });
  });

  describe('Resources', () => {
    describe('KMS Configuration', () => {
      test('should have KMS key with rotation enabled', () => {
        const kmsKey = template.Resources.MainKMSKey;
        expect(kmsKey.Type).toBe('AWS::KMS::Key');
        expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      });

      test('should have proper KMS key policy', () => {
        const kmsKey = template.Resources.MainKMSKey;
        const policy = kmsKey.Properties.KeyPolicy;

        expect(policy.Statement).toHaveLength(2);
        expect(policy.Statement[0].Effect).toBe('Allow');
        expect(policy.Statement[1].Principal.Service).toContain('s3.amazonaws.com');
      });
    });

    describe('IAM Role Configuration', () => {

    });

    describe('VPC Configuration', () => {
      test('should have VPC with proper configuration', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });

      test('should have subnets in multiple AZs', () => {
        expect(template.Resources.PrivateSubnet1).toBeDefined();
        expect(template.Resources.PrivateSubnet2).toBeDefined();
        expect(template.Resources.PublicSubnet1).toBeDefined();
        expect(template.Resources.PublicSubnet2).toBeDefined();

        const subnet1 = template.Resources.PrivateSubnet1.Properties;
        const subnet2 = template.Resources.PrivateSubnet2.Properties;

        expect(subnet1.AvailabilityZone['Fn::Select'][0]).toBe(0);
        expect(subnet2.AvailabilityZone['Fn::Select'][0]).toBe(1);
      });
    });

    describe('Monitoring Configuration', () => {

    });

    describe('EC2 Instance Security', () => {
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'MainKMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should be correct', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VpcId',
      });
    });

    test('Subnet outputs should be correct', () => {
      const subnets = ['PrivateSubnet1Id', 'PrivateSubnet2Id', 'PublicSubnet1Id', 'PublicSubnet2Id'];
      subnets.forEach(subnetOutput => {
        const output = template.Outputs[subnetOutput];
        expect(output.Description).toContain('Subnet');
        expect(output.Value).toEqual({ Ref: subnetOutput.replace('Id', '') });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${subnetOutput}`,
        });
      });
    });

    test('KMS Key output should be correct', () => {
      const output = template.Outputs.MainKMSKeyId;
      expect(output.Value).toEqual({ Ref: 'MainKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-MainKMSKeyId',
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

    test('should have the expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10); // We have exactly 10 core infrastructure resources after removing AWS Config and CloudTrail
    });

    test('should have the expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6); // Environment and CIDR parameters
    });

    test('should have the expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6); // VPC outputs and KMS key outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Security Features', () => {

  });
});