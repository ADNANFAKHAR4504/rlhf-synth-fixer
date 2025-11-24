import * as fs from 'fs';
import * as path from 'path';
import { TemplateValidator, CloudFormationTemplate } from '../lib/template-validator';

describe('TemplateValidator', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('validateStructure', () => {
    test('should validate correct template structure', () => {
      expect(TemplateValidator.validateStructure(template)).toBe(true);
    });

    test('should reject template with wrong version', () => {
      const invalidTemplate = {
        ...template,
        AWSTemplateFormatVersion: '2009-01-01',
      };
      expect(TemplateValidator.validateStructure(invalidTemplate)).toBe(false);
    });

    test('should reject template with empty description', () => {
      const invalidTemplate = {
        ...template,
        Description: '',
      };
      expect(TemplateValidator.validateStructure(invalidTemplate)).toBe(false);
    });

    test('should reject template with non-string description', () => {
      const invalidTemplate = {
        ...template,
        Description: 123 as any,
      };
      expect(TemplateValidator.validateStructure(invalidTemplate)).toBe(false);
    });

    test('should reject template with non-object resources', () => {
      const invalidTemplate = {
        ...template,
        Resources: [] as any,
      };
      expect(TemplateValidator.validateStructure(invalidTemplate)).toBe(false);
    });

    test('should reject template with empty resources', () => {
      const invalidTemplate = {
        ...template,
        Resources: {},
      };
      expect(TemplateValidator.validateStructure(invalidTemplate)).toBe(false);
    });
  });

  describe('validateEnvironmentSuffix', () => {
    test('should validate template with EnvironmentSuffix parameter', () => {
      expect(TemplateValidator.validateEnvironmentSuffix(template)).toBe(true);
    });

    test('should reject template without EnvironmentSuffix parameter', () => {
      const invalidTemplate = {
        ...template,
        Parameters: {
          ...template.Parameters,
        },
      };
      delete invalidTemplate.Parameters!.EnvironmentSuffix;
      expect(TemplateValidator.validateEnvironmentSuffix(invalidTemplate)).toBe(false);
    });

    test('should reject template with no Parameters', () => {
      const invalidTemplate = {
        ...template,
        Parameters: undefined,
      };
      expect(TemplateValidator.validateEnvironmentSuffix(invalidTemplate)).toBe(false);
    });

    test('should reject template where resources do not use EnvironmentSuffix', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          TestResource: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: '10.0.0.0/16',
            },
          },
        },
      };
      expect(TemplateValidator.validateEnvironmentSuffix(invalidTemplate)).toBe(false);
    });
  });

  describe('validateNoRetainPolicy', () => {
    test('should validate template with no Retain policies', () => {
      expect(TemplateValidator.validateNoRetainPolicy(template)).toBe(true);
    });

    test('should reject template with DeletionPolicy Retain', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          ...template.Resources,
          TestResource: {
            Type: 'AWS::S3::Bucket',
            DeletionPolicy: 'Retain',
            Properties: {},
          },
        },
      };
      expect(TemplateValidator.validateNoRetainPolicy(invalidTemplate)).toBe(false);
    });

    test('should reject template with UpdateReplacePolicy Retain', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          ...template.Resources,
          TestResource: {
            Type: 'AWS::S3::Bucket',
            UpdateReplacePolicy: 'Retain',
            Properties: {},
          },
        },
      };
      expect(TemplateValidator.validateNoRetainPolicy(invalidTemplate)).toBe(false);
    });
  });

  describe('validateOutputs', () => {
    test('should validate template with required outputs', () => {
      const requiredOutputs = ['WebACLArn', 'WebACLId', 'WAFLogBucketName'];
      expect(TemplateValidator.validateOutputs(template, requiredOutputs)).toBe(true);
    });

    test('should reject template without required output', () => {
      const requiredOutputs = ['WebACLArn', 'NonExistentOutput'];
      expect(TemplateValidator.validateOutputs(template, requiredOutputs)).toBe(false);
    });

    test('should reject template with no Outputs section', () => {
      const invalidTemplate = {
        ...template,
        Outputs: undefined,
      };
      const requiredOutputs = ['WebACLArn'];
      expect(TemplateValidator.validateOutputs(invalidTemplate, requiredOutputs)).toBe(false);
    });

    test('should validate template with empty required outputs array', () => {
      expect(TemplateValidator.validateOutputs(template, [])).toBe(true);
    });
  });

  describe('validateWAFConfiguration', () => {
    test('should validate template with complete WAF configuration', () => {
      expect(TemplateValidator.validateWAFConfiguration(template)).toBe(true);
    });

    test('should reject template without WebACL', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          TestVPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {},
          },
        },
      };
      expect(TemplateValidator.validateWAFConfiguration(invalidTemplate)).toBe(false);
    });

    test('should reject template without logging configuration', () => {
      const resourcesWithoutLogging = { ...template.Resources };
      delete resourcesWithoutLogging.WAFLoggingConfiguration;
      const invalidTemplate = {
        ...template,
        Resources: resourcesWithoutLogging,
      };
      expect(TemplateValidator.validateWAFConfiguration(invalidTemplate)).toBe(false);
    });

    test('should reject template without log bucket', () => {
      const resourcesWithoutLogBucket = { ...template.Resources };
      delete resourcesWithoutLogBucket.WAFLogBucket;
      const invalidTemplate = {
        ...template,
        Resources: resourcesWithoutLogBucket,
      };
      expect(TemplateValidator.validateWAFConfiguration(invalidTemplate)).toBe(false);
    });
  });

  describe('validateNetworkInfrastructure', () => {
    test('should validate template with complete network infrastructure', () => {
      expect(TemplateValidator.validateNetworkInfrastructure(template)).toBe(true);
    });

    test('should reject template without VPC', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          TestALB: {
            Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
            Properties: {},
          },
        },
      };
      expect(TemplateValidator.validateNetworkInfrastructure(invalidTemplate)).toBe(false);
    });

    test('should reject template without subnets', () => {
      const resourcesWithoutSubnets = { ...template.Resources };
      delete resourcesWithoutSubnets.TestSubnet1;
      delete resourcesWithoutSubnets.TestSubnet2;
      const invalidTemplate = {
        ...template,
        Resources: resourcesWithoutSubnets,
      };
      expect(TemplateValidator.validateNetworkInfrastructure(invalidTemplate)).toBe(false);
    });

    test('should reject template without Internet Gateway', () => {
      const resourcesWithoutIGW = { ...template.Resources };
      delete resourcesWithoutIGW.TestInternetGateway;
      const invalidTemplate = {
        ...template,
        Resources: resourcesWithoutIGW,
      };
      expect(TemplateValidator.validateNetworkInfrastructure(invalidTemplate)).toBe(false);
    });

    test('should reject template without ALB', () => {
      const resourcesWithoutALB = { ...template.Resources };
      delete resourcesWithoutALB.TestALB;
      const invalidTemplate = {
        ...template,
        Resources: resourcesWithoutALB,
      };
      expect(TemplateValidator.validateNetworkInfrastructure(invalidTemplate)).toBe(false);
    });
  });

  describe('validateS3Security', () => {
    test('should validate template with secure S3 buckets', () => {
      expect(TemplateValidator.validateS3Security(template)).toBe(true);
    });

    test('should reject template with S3 bucket without encryption', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          ...template.Resources,
          InsecureBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
              },
            },
          },
        },
      };
      expect(TemplateValidator.validateS3Security(invalidTemplate)).toBe(false);
    });

    test('should reject template with S3 bucket without public access block', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          ...template.Resources,
          InsecureBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [],
              },
            },
          },
        },
      };
      expect(TemplateValidator.validateS3Security(invalidTemplate)).toBe(false);
    });

    test('should validate template with no S3 buckets', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          TestVPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {},
          },
        },
      };
      expect(TemplateValidator.validateS3Security(invalidTemplate)).toBe(true);
    });
  });

  describe('countWAFRules', () => {
    test('should count WAF rules correctly', () => {
      const count = TemplateValidator.countWAFRules(template);
      expect(count).toBeGreaterThan(0);
      expect(count).toBe(4); // AllowOfficeIPs, GeoBlockRule, RateLimitRule, SQLInjectionProtection
    });

    test('should return 0 for template without WebACL', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          TestVPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {},
          },
        },
      };
      expect(TemplateValidator.countWAFRules(invalidTemplate)).toBe(0);
    });

    test('should return 0 for WebACL without Rules', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          WAFWebACL: {
            Type: 'AWS::WAFv2::WebACL',
            Properties: {
              Scope: 'REGIONAL',
            },
          },
        },
      };
      expect(TemplateValidator.countWAFRules(invalidTemplate)).toBe(0);
    });
  });

  describe('validateWAFRules', () => {
    test('should validate all required WAF rule types exist', () => {
      const result = TemplateValidator.validateWAFRules(template);
      expect(result.hasRateLimit).toBe(true);
      expect(result.hasGeoBlock).toBe(true);
      expect(result.hasSQLInjection).toBe(true);
      expect(result.hasIPAllowlist).toBe(true);
    });

    test('should return all false for template without WebACL', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          TestVPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {},
          },
        },
      };
      const result = TemplateValidator.validateWAFRules(invalidTemplate);
      expect(result.hasRateLimit).toBe(false);
      expect(result.hasGeoBlock).toBe(false);
      expect(result.hasSQLInjection).toBe(false);
      expect(result.hasIPAllowlist).toBe(false);
    });

    test('should return all false for WebACL without Rules', () => {
      const invalidTemplate = {
        ...template,
        Resources: {
          WAFWebACL: {
            Type: 'AWS::WAFv2::WebACL',
            Properties: {
              Scope: 'REGIONAL',
            },
          },
        },
      };
      const result = TemplateValidator.validateWAFRules(invalidTemplate);
      expect(result.hasRateLimit).toBe(false);
      expect(result.hasGeoBlock).toBe(false);
      expect(result.hasSQLInjection).toBe(false);
      expect(result.hasIPAllowlist).toBe(false);
    });

    test('should detect individual rule types correctly', () => {
      const templateWithOnlyRateLimit = {
        ...template,
        Resources: {
          WAFWebACL: {
            Type: 'AWS::WAFv2::WebACL',
            Properties: {
              Rules: [
                {
                  Name: 'RateLimitRule',
                  Statement: {
                    RateBasedStatement: {
                      Limit: 2000,
                    },
                  },
                },
              ],
            },
          },
        },
      };
      const result = TemplateValidator.validateWAFRules(templateWithOnlyRateLimit);
      expect(result.hasRateLimit).toBe(true);
      expect(result.hasGeoBlock).toBe(false);
      expect(result.hasSQLInjection).toBe(false);
      expect(result.hasIPAllowlist).toBe(false);
    });
  });
});
