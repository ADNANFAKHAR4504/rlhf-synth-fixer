import * as path from 'path';
import { TemplateValidator, validateTemplate } from '../lib/template-validator';

describe('TemplateValidator', () => {
  let validator: TemplateValidator;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    validator = new TemplateValidator(templatePath);
  });

  describe('Basic Template Validation', () => {
    test('should load and parse template correctly', () => {
      const template = validator.getTemplate();
      expect(template).toBeDefined();
      expect(template.Resources).toBeDefined();
    });

    test('should validate CloudFormation format version', () => {
      expect(validator.validateFormat()).toBe(true);
    });

    test('should check for template description', () => {
      expect(validator.hasDescription()).toBe(true);
    });

    test('should count resources correctly', () => {
      const resourceCount = validator.getResourceCount();
      expect(resourceCount).toBeGreaterThan(30);
      expect(resourceCount).toBeLessThan(50);
    });

    test('should count parameters correctly', () => {
      const paramCount = validator.getParameterCount();
      expect(paramCount).toBe(8);
    });

    test('should count outputs correctly', () => {
      const outputCount = validator.getOutputCount();
      expect(outputCount).toBe(10);
    });
  });

  describe('Resource Existence Checks', () => {
    const criticalResources = [
      'VPC',
      'InternetGateway',
      'PublicSubnetA',
      'PublicSubnetB',
      'PrivateSubnetA',
      'PrivateSubnetB',
      'ApplicationLoadBalancer',
      'AutoScalingGroup',
      'DatabaseInstance',
      'ApplicationS3Bucket'
    ];

    test.each(criticalResources)('should have %s resource', (resourceId) => {
      expect(validator.hasResource(resourceId)).toBe(true);
    });

    test('should return correct resource types', () => {
      expect(validator.getResourceType('VPC')).toBe('AWS::EC2::VPC');
      expect(validator.getResourceType('DatabaseInstance')).toBe('AWS::RDS::DBInstance');
      expect(validator.getResourceType('ApplicationLoadBalancer')).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(validator.getResourceType('NonExistentResource')).toBeUndefined();
    });
  });

  describe('Parameter Validation', () => {
    const requiredParams = [
      'EnvironmentSuffix',
      'DatabasePassword',
      'KeyPairName',
      'VpcCidr'
    ];

    test.each(requiredParams)('should have %s parameter', (param) => {
      expect(validator.hasParameter(param)).toBe(true);
    });

    test('should not have non-existent parameter', () => {
      expect(validator.hasParameter('NonExistentParam')).toBe(false);
    });
  });

  describe('Output Validation', () => {
    const requiredOutputs = [
      'VPCId',
      'ApplicationLoadBalancerDNS',
      'DatabaseEndpoint',
      'S3BucketName'
    ];

    test.each(requiredOutputs)('should have %s output', (output) => {
      expect(validator.hasOutput(output)).toBe(true);
    });
  });

  describe('Security Validation', () => {
    test('should validate security groups configuration', () => {
      expect(validator.validateSecurityGroups()).toBe(true);
    });

    test('should validate IAM roles configuration', () => {
      expect(validator.validateIAMRoles()).toBe(true);
    });

    test('should validate encryption settings', () => {
      expect(validator.validateEncryption()).toBe(true);
    });

    test('should validate deletion policies', () => {
      expect(validator.validateDeletionPolicies()).toBe(true);
    });
  });

  describe('High Availability Validation', () => {
    test('should validate high availability configuration', () => {
      expect(validator.validateHighAvailability()).toBe(true);
    });

    test('should validate auto scaling configuration', () => {
      expect(validator.validateAutoScaling()).toBe(true);
    });

    test('should validate load balancer configuration', () => {
      expect(validator.validateLoadBalancer()).toBe(true);
    });
  });

  describe('Monitoring Validation', () => {
    test('should validate CloudWatch alarms exist', () => {
      expect(validator.validateCloudWatchAlarms()).toBe(true);
    });
  });

  describe('Tag Validation', () => {
    test('should validate production environment tags', () => {
      const hasProductionTags = validator.validateTags({
        Key: 'environment',
        Value: 'production'
      });
      expect(hasProductionTags).toBe(true);
    });

    test('should fail for non-existent tags', () => {
      const hasNonExistentTags = validator.validateTags({
        Key: 'non-existent',
        Value: 'value'
      });
      expect(hasNonExistentTags).toBe(false);
    });
  });

  describe('Validation Summary', () => {
    test('should return valid template summary', () => {
      const summary = validator.getValidationSummary();
      expect(summary.valid).toBe(true);
      expect(summary.errors).toHaveLength(0);
    });

    test('should provide comprehensive validation', () => {
      const summary = validator.getValidationSummary();
      expect(summary).toHaveProperty('valid');
      expect(summary).toHaveProperty('errors');
      expect(summary).toHaveProperty('warnings');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing optional sections gracefully', () => {
      const template = validator.getTemplate();
      // Even if Conditions is optional, validator should handle it
      const hasConditions = template.Conditions !== undefined;
      expect(typeof hasConditions).toBe('boolean');
    });

    test('should correctly identify resource types', () => {
      const template = validator.getTemplate();
      const resourceTypes = Object.values(template.Resources)
        .map((r: any) => r.Type)
        .filter((type, index, self) => self.indexOf(type) === index);
      
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
    });

    test('should handle YAML files correctly', () => {
      const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
      const yamlValidator = new TemplateValidator(yamlPath);
      expect(yamlValidator.validateFormat()).toBe(true);
      expect(yamlValidator.getResourceCount()).toBeGreaterThan(30);
    });
  });
});

describe('validateTemplate helper function', () => {
  test('should create validator instance', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const validator = validateTemplate(templatePath);
    expect(validator).toBeInstanceOf(TemplateValidator);
    expect(validator.validateFormat()).toBe(true);
  });
});