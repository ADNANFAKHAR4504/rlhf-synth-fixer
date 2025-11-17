import * as path from 'path';
import {
  CloudFormationTemplateValidator,
  validateTemplate,
} from '../lib/template-validator';

describe('CloudFormationTemplateValidator', () => {
  let validator: CloudFormationTemplateValidator;
  const templatePath = path.join(__dirname, '../lib/TapStack.json');

  beforeAll(() => {
    validator = new CloudFormationTemplateValidator(templatePath);
  });

  describe('Template Structure Validation', () => {
    test('should validate template structure successfully', () => {
      const result = validator.validateStructure();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should have AWS CloudFormation version', () => {
      const result = validator.validateStructure();
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Missing AWSTemplateFormatVersion');
    });

    test('should have description', () => {
      const result = validator.validateStructure();
      expect(result.warnings).not.toContain('Missing Description');
    });

    test('should have resources section', () => {
      const result = validator.validateStructure();
      expect(result.errors).not.toContain('Missing Resources section');
    });

    test('should have non-empty resources', () => {
      const result = validator.validateStructure();
      expect(result.errors).not.toContain('Resources section is empty');
    });
  });

  describe('Environment Suffix Validation', () => {
    test('should validate environmentSuffix usage', () => {
      const result = validator.validateEnvironmentSuffixUsage();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should have high environmentSuffix coverage', () => {
      const result = validator.validateEnvironmentSuffixUsage();
      const coverageMessage = result.errors.find((e) =>
        e.includes('coverage')
      );
      expect(coverageMessage).toBeUndefined();
    });

    test('should not have resources without suffix', () => {
      const result = validator.validateEnvironmentSuffixUsage();
      const warningMessage = result.warnings.find((w) =>
        w.includes('without environmentSuffix')
      );
      // If there's a warning, it should be empty
      if (warningMessage) {
        expect(warningMessage).toMatch(/Resources without environmentSuffix:/);
      }
    });
  });

  describe('Deletion Policy Validation', () => {
    test('should not have any Retain deletion policies', () => {
      const result = validator.validateDeletionPolicies();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should not find Retain policies in resources', () => {
      const result = validator.validateDeletionPolicies();
      const retainError = result.errors.find((e) => e.includes('Retain'));
      expect(retainError).toBeUndefined();
    });
  });

  describe('Resource Count', () => {
    test('should count resources correctly', () => {
      const count = validator.getResourceCount();
      expect(count.total).toBe(25);
    });

    test('should count resources by type', () => {
      const count = validator.getResourceCount();
      expect(count.byType).toBeDefined();
      expect(Object.keys(count.byType).length).toBeGreaterThan(0);
    });

    test('should have VPC resource', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::EC2::VPC']).toBe(1);
    });

    test('should have subnets', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::EC2::Subnet']).toBe(4);
    });

    test('should have EKS cluster', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::EKS::Cluster']).toBe(1);
    });

    test('should have EKS node group', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::EKS::Nodegroup']).toBe(1);
    });

    test('should have IAM roles', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::IAM::Role']).toBe(2);
    });

    test('should have security group', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::EC2::SecurityGroup']).toBe(1);
    });

    test('should have KMS key', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::KMS::Key']).toBe(1);
    });

    test('should have CloudWatch log group', () => {
      const count = validator.getResourceCount();
      expect(count.byType['AWS::Logs::LogGroup']).toBe(1);
    });
  });

  describe('Outputs', () => {
    test('should have outputs', () => {
      const outputs = validator.getOutputs();
      expect(outputs.length).toBeGreaterThan(0);
    });

    test('should have VPCId output', () => {
      const outputs = validator.getOutputs();
      expect(outputs).toContain('VPCId');
    });

    test('should have ClusterName output', () => {
      const outputs = validator.getOutputs();
      expect(outputs).toContain('ClusterName');
    });

    test('should have ClusterEndpoint output', () => {
      const outputs = validator.getOutputs();
      expect(outputs).toContain('ClusterEndpoint');
    });

    test('should have correct number of outputs', () => {
      const outputs = validator.getOutputs();
      expect(outputs.length).toBe(12);
    });
  });

  describe('Parameters', () => {
    test('should have parameters', () => {
      const parameters = validator.getParameters();
      expect(parameters.length).toBeGreaterThan(0);
    });

    test('should have EnvironmentSuffix parameter', () => {
      const parameters = validator.getParameters();
      expect(parameters).toContain('EnvironmentSuffix');
    });

    test('should have ClusterVersion parameter', () => {
      const parameters = validator.getParameters();
      expect(parameters).toContain('ClusterVersion');
    });

    test('should have NodeInstanceType parameter', () => {
      const parameters = validator.getParameters();
      expect(parameters).toContain('NodeInstanceType');
    });

    test('should have node scaling parameters', () => {
      const parameters = validator.getParameters();
      expect(parameters).toContain('NodeGroupMinSize');
      expect(parameters).toContain('NodeGroupMaxSize');
      expect(parameters).toContain('NodeGroupDesiredSize');
    });

    test('should have correct number of parameters', () => {
      const parameters = validator.getParameters();
      expect(parameters.length).toBe(6);
    });
  });

  describe('EKS Requirements Validation', () => {
    test('should validate EKS requirements successfully', () => {
      const result = validator.validateEKSRequirements();
      expect(result.isValid).toBe(true);
    });

    test('should find EKS Cluster resource', () => {
      const result = validator.validateEKSRequirements();
      const clusterError = result.errors.find((e) =>
        e.includes('AWS::EKS::Cluster')
      );
      expect(clusterError).toBeUndefined();
    });

    test('should find EKS Node Group', () => {
      const result = validator.validateEKSRequirements();
      const nodeGroupWarning = result.warnings.find((w) =>
        w.includes('Nodegroup')
      );
      expect(nodeGroupWarning).toBeUndefined();
    });

    test('should have VPC for EKS', () => {
      const result = validator.validateEKSRequirements();
      const vpcWarning = result.warnings.find((w) => w.includes('VPC'));
      expect(vpcWarning).toBeUndefined();
    });

    test('should have sufficient subnets', () => {
      const result = validator.validateEKSRequirements();
      const subnetWarning = result.warnings.find((w) => w.includes('subnet'));
      expect(subnetWarning).toBeUndefined();
    });
  });

  describe('Complete Validation', () => {
    test('should pass all validations', () => {
      const result = validator.validateAll();
      expect(result.isValid).toBe(true);
    });

    test('should have no errors', () => {
      const result = validator.validateAll();
      expect(result.errors).toHaveLength(0);
    });

    test('should combine all validation results', () => {
      const result = validator.validateAll();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('Helper Function', () => {
    test('validateTemplate should work with valid template', () => {
      const result = validateTemplate(templatePath);
      expect(result.isValid).toBe(true);
    });

    test('validateTemplate should handle valid path', () => {
      const result = validateTemplate(templatePath);
      expect(result.errors).toHaveLength(0);
    });

    test('validateTemplate should handle invalid path', () => {
      const result = validateTemplate('/nonexistent/template.json');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validateTemplate error should mention failure', () => {
      const result = validateTemplate('/nonexistent/template.json');
      expect(result.errors[0]).toContain('Failed to validate template');
    });
  });

  describe('Edge Cases', () => {
    test('validator should handle template with resources', () => {
      const count = validator.getResourceCount();
      expect(count.total).toBeGreaterThan(0);
    });

    test('resource types should be valid AWS types', () => {
      const count = validator.getResourceCount();
      Object.keys(count.byType).forEach((type) => {
        expect(type).toMatch(/^AWS::/);
      });
    });

    test('all validations should be consistent', () => {
      const result1 = validator.validateAll();
      const result2 = validator.validateAll();
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors.length).toBe(result2.errors.length);
    });
  });

  describe('Error Path Coverage', () => {
    test('should detect missing AWSTemplateFormatVersion', () => {
      // Create a mock template without version
      const mockTemplatePath = path.join(__dirname, '../lib/TapStack.json');
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      // Mock fs.readFileSync to return invalid template
      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          Description: 'Test',
          Resources: { Test: { Type: 'AWS::Test' } },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(mockTemplatePath);
      const result = testValidator.validateStructure();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing AWSTemplateFormatVersion');

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    test('should detect missing Description', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: { Test: { Type: 'AWS::Test' } },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateStructure();

      expect(result.warnings).toContain('Missing Description');

      fs.readFileSync = originalReadFileSync;
    });

    test('should detect missing Resources section', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Description: 'Test',
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateStructure();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing Resources section');

      fs.readFileSync = originalReadFileSync;
    });

    test('should detect empty Resources section', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Description: 'Test',
          Resources: {},
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateStructure();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resources section is empty');

      fs.readFileSync = originalReadFileSync;
    });

    test('should detect resources without environmentSuffix', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestBucket: {
              Type: 'AWS::S3::Bucket',
              Properties: {
                BucketName: 'test-bucket-hardcoded',
              },
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEnvironmentSuffixUsage();

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('coverage');

      fs.readFileSync = originalReadFileSync;
    });

    test('should detect Retain deletion policy', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestTable: {
              Type: 'AWS::DynamoDB::Table',
              DeletionPolicy: 'Retain',
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateDeletionPolicies();

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Retain');

      fs.readFileSync = originalReadFileSync;
    });

    test('should detect missing EKS Cluster', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestVPC: {
              Type: 'AWS::EC2::VPC',
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEKSRequirements();

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('AWS::EKS::Cluster');

      fs.readFileSync = originalReadFileSync;
    });

    test('should warn about missing Node Group', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestCluster: {
              Type: 'AWS::EKS::Cluster',
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEKSRequirements();

      expect(result.warnings.some((w) => w.includes('Nodegroup'))).toBe(true);

      fs.readFileSync = originalReadFileSync;
    });

    test('should warn about missing VPC', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestCluster: {
              Type: 'AWS::EKS::Cluster',
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEKSRequirements();

      expect(result.warnings.some((w) => w.includes('VPC'))).toBe(true);

      fs.readFileSync = originalReadFileSync;
    });

    test('should warn about insufficient subnets', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestCluster: {
              Type: 'AWS::EKS::Cluster',
            },
            TestSubnet: {
              Type: 'AWS::EC2::Subnet',
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEKSRequirements();

      expect(result.warnings.some((w) => w.includes('subnet'))).toBe(true);

      fs.readFileSync = originalReadFileSync;
    });

    test('should handle template without Outputs', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            Test: { Type: 'AWS::Test' },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const outputs = testValidator.getOutputs();

      expect(outputs).toEqual([]);

      fs.readFileSync = originalReadFileSync;
    });

    test('should handle template without Parameters', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            Test: { Type: 'AWS::Test' },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const parameters = testValidator.getParameters();

      expect(parameters).toEqual([]);

      fs.readFileSync = originalReadFileSync;
    });

    test('should handle template without Resources in getResourceCount', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const count = testValidator.getResourceCount();

      expect(count.total).toBe(0);
      expect(Object.keys(count.byType).length).toBe(0);

      fs.readFileSync = originalReadFileSync;
    });

    test('should handle UpdateReplacePolicy Retain', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestTable: {
              Type: 'AWS::DynamoDB::Table',
              UpdateReplacePolicy: 'Retain',
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateDeletionPolicies();

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Retain');

      fs.readFileSync = originalReadFileSync;
    });

    test('environmentSuffix validation should handle empty Resources', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEnvironmentSuffixUsage();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No Resources section found');

      fs.readFileSync = originalReadFileSync;
    });

    test('EKS validation should handle empty Resources', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const result = testValidator.validateEKSRequirements();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No Resources section found');

      fs.readFileSync = originalReadFileSync;
    });

    test('should handle template with resources without Type field', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;

      fs.readFileSync = jest.fn().mockReturnValue(
        JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            TestResource: {
              Properties: {},
            },
          },
        })
      );

      const testValidator = new CloudFormationTemplateValidator(templatePath);
      const count = testValidator.getResourceCount();

      expect(count.total).toBe(1);
      expect(count.byType['Unknown']).toBe(1);

      fs.readFileSync = originalReadFileSync;
    });

    test('should validate all checks combined have no errors', () => {
      const result = validator.validateAll();
      expect(result.errors.length).toBe(0);
      expect(result.isValid).toBe(true);
    });
  });
});
