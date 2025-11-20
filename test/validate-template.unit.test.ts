import { TemplateValidator, loadAndValidateTemplate } from '../lib/validate-template';
import { join } from 'path';

describe('TemplateValidator', () => {
  let validator: TemplateValidator;
  const templatePath = join(__dirname, '..', 'lib', 'infrastructure-template.json');

  beforeAll(() => {
    validator = new TemplateValidator(templatePath);
  });

  describe('constructor and loading', () => {
    test('should load template successfully', () => {
      expect(validator).toBeInstanceOf(TemplateValidator);
    });

    test('should load template via helper function', () => {
      const v = loadAndValidateTemplate(templatePath);
      expect(v).toBeInstanceOf(TemplateValidator);
    });
  });

  describe('validateStructure', () => {
    test('should validate template structure', () => {
      expect(validator.validateStructure()).toBe(true);
    });

    test('should throw error for missing AWSTemplateFormatVersion', () => {
      const invalidTemplatePath = join(__dirname, '..', 'lib', 'infrastructure-template.json');
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn(() => '{"Resources": {"VPC": {"Type": "AWS::EC2::VPC"}}}');

      expect(() => {
        const v = new TemplateValidator(invalidTemplatePath);
        v.validateStructure();
      }).toThrow('Missing AWSTemplateFormatVersion');

      fs.readFileSync = originalReadFileSync;
    });

    test('should throw error for missing Resources', () => {
      const invalidTemplatePath = join(__dirname, '..', 'lib', 'infrastructure-template.json');
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn(() => '{"AWSTemplateFormatVersion": "2010-09-09"}');

      expect(() => {
        const v = new TemplateValidator(invalidTemplatePath);
        v.validateStructure();
      }).toThrow('Missing or empty Resources section');

      fs.readFileSync = originalReadFileSync;
    });
  });

  describe('getResource', () => {
    test('should get VPC resource', () => {
      const vpc = validator.getResource('VPC');
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should get ECS Cluster resource', () => {
      const cluster = validator.getResource('ECSCluster');
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should get DynamoDB Table resource', () => {
      const table = validator.getResource('ApplicationTable');
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should throw error for non-existent resource', () => {
      expect(() => validator.getResource('NonExistent')).toThrow('Resource NonExistent not found');
    });
  });

  describe('getResourcesByType', () => {
    test('should get all VPC resources', () => {
      const vpcs = validator.getResourcesByType('AWS::EC2::VPC');
      expect(Array.isArray(vpcs)).toBe(true);
      expect(vpcs.length).toBe(1);
    });

    test('should get all subnet resources', () => {
      const subnets = validator.getResourcesByType('AWS::EC2::Subnet');
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(4);
    });

    test('should get all ECS resources', () => {
      const ecsResources = validator.getResourcesByType('AWS::ECS::Cluster');
      expect(Array.isArray(ecsResources)).toBe(true);
      expect(ecsResources.length).toBeGreaterThan(0);
    });

    test('should return empty array for non-existent type', () => {
      const resources = validator.getResourcesByType('AWS::NonExistent::Type');
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(0);
    });
  });

  describe('validateEnvironmentSuffix', () => {
    test('should validate all resources use EnvironmentSuffix', () => {
      const missing = validator.validateEnvironmentSuffix();
      expect(Array.isArray(missing)).toBe(true);
      expect(missing.length).toBe(0);
    });

    test('should detect resources missing EnvironmentSuffix', () => {
      const invalidTemplatePath = join(__dirname, '..', 'lib', 'infrastructure-template.json');
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn(() => JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' }
          }
        }
      }));

      const v = new TemplateValidator(invalidTemplatePath);
      const missing = v.validateEnvironmentSuffix();
      expect(Array.isArray(missing)).toBe(true);
      expect(missing.length).toBe(1);
      expect(missing[0]).toBe('VPC');

      fs.readFileSync = originalReadFileSync;
    });
  });

  describe('findRetainPolicies', () => {
    test('should find no Retain policies', () => {
      const retainResources = validator.findRetainPolicies();
      expect(Array.isArray(retainResources)).toBe(true);
      expect(retainResources.length).toBe(0);
    });

    test('should detect resources with Retain policies', () => {
      const invalidTemplatePath = join(__dirname, '..', 'lib', 'infrastructure-template.json');
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn(() => JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          Table: {
            Type: 'AWS::DynamoDB::Table',
            DeletionPolicy: 'Retain',
            Properties: { TableName: 'test' }
          }
        }
      }));

      const v = new TemplateValidator(invalidTemplatePath);
      const retainResources = v.findRetainPolicies();
      expect(Array.isArray(retainResources)).toBe(true);
      expect(retainResources.length).toBe(1);
      expect(retainResources[0]).toBe('Table');

      fs.readFileSync = originalReadFileSync;
    });
  });

  describe('countResources', () => {
    test('should count resources', () => {
      const count = validator.countResources();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeGreaterThanOrEqual(30);
    });
  });

  describe('countOutputs', () => {
    test('should count outputs', () => {
      const count = validator.countOutputs();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });

  describe('hasParameter', () => {
    test('should find EnvironmentSuffix parameter', () => {
      expect(validator.hasParameter('EnvironmentSuffix')).toBe(true);
    });

    test('should find EnvironmentName parameter', () => {
      expect(validator.hasParameter('EnvironmentName')).toBe(true);
    });

    test('should find ApplicationName parameter', () => {
      expect(validator.hasParameter('ApplicationName')).toBe(true);
    });

    test('should not find non-existent parameter', () => {
      expect(validator.hasParameter('NonExistent')).toBe(false);
    });
  });

  describe('hasOutput', () => {
    test('should find VPCId output', () => {
      expect(validator.hasOutput('VPCId')).toBe(true);
    });

    test('should find LoadBalancerDNS output', () => {
      expect(validator.hasOutput('LoadBalancerDNS')).toBe(true);
    });

    test('should find DynamoDBTableName output', () => {
      expect(validator.hasOutput('DynamoDBTableName')).toBe(true);
    });

    test('should not find non-existent output', () => {
      expect(validator.hasOutput('NonExistent')).toBe(false);
    });
  });

  describe('getEnvironmentConfig', () => {
    test('should get dev environment config', () => {
      const config = validator.getEnvironmentConfig('dev');
      expect(config).toBeDefined();
      expect(config.VpcCidr).toBe('10.0.0.0/16');
    });

    test('should get staging environment config', () => {
      const config = validator.getEnvironmentConfig('staging');
      expect(config).toBeDefined();
      expect(config.VpcCidr).toBe('10.1.0.0/16');
    });

    test('should get prod environment config', () => {
      const config = validator.getEnvironmentConfig('prod');
      expect(config).toBeDefined();
      expect(config.VpcCidr).toBe('10.2.0.0/16');
    });

    test('should throw error for non-existent environment', () => {
      expect(() => validator.getEnvironmentConfig('invalid')).toThrow('Environment invalid not found');
    });

    test('should throw error for template without EnvironmentConfig mapping', () => {
      const invalidTemplatePath = join(__dirname, '..', 'lib', 'infrastructure-template.json');
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn(() => JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: { VPC: { Type: 'AWS::EC2::VPC' } }
      }));

      expect(() => {
        const v = new TemplateValidator(invalidTemplatePath);
        v.getEnvironmentConfig('dev');
      }).toThrow('Missing EnvironmentConfig mapping');

      fs.readFileSync = originalReadFileSync;
    });
  });
});
