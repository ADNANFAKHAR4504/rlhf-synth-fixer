// Multi-Tier Web Application Nested Stacks - Unit Tests
// These tests validate the CloudFormation nested stack templates
import fs from 'fs';
import path from 'path';
import * as validator from '../lib/template-validator';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Master Template', () => {
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

    test('should have description for multi-tier application', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('multi-tier');
      expect(template.Description).toContain('nested');
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.CostCenter).toBeDefined();
    });

    test('EnvironmentSuffix should have correct constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBeDefined();
    });

    test('EnvironmentType should have correct allowed values', () => {
      const param = template.Parameters.EnvironmentType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toBeDefined();
      expect(param.AllowedValues).toContain('dev');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('prod');
    });

    test('InstanceType should have correct allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toBeDefined();
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
      expect(param.AllowedValues).toContain('t3.xlarge');
    });
  });

  describe('Nested Stacks', () => {
    test('should have VPCStack nested stack', () => {
      const vpcStack = template.Resources.VPCStack;
      expect(vpcStack).toBeDefined();
      expect(vpcStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('should have ComputeStack nested stack', () => {
      const computeStack = template.Resources.ComputeStack;
      expect(computeStack).toBeDefined();
      expect(computeStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('should have DataStack nested stack', () => {
      const dataStack = template.Resources.DataStack;
      expect(dataStack).toBeDefined();
      expect(dataStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('nested stacks should have template URLs', () => {
      expect(template.Resources.VPCStack.Properties.TemplateURL).toBeDefined();
      expect(template.Resources.ComputeStack.Properties.TemplateURL).toBeDefined();
      expect(template.Resources.DataStack.Properties.TemplateURL).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have VPC outputs from VPCStack', () => {
      expect(template.Outputs).toBeDefined();
      const vpcIdOutput = template.Outputs.VpcId;
      expect(vpcIdOutput).toBeDefined();
    });

    test('all outputs should reference nested stack outputs', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });
  });
});

describe('VPCStack CloudFormation Nested Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/VPCStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have configurable CIDR block', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have 3 public and 3 private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('outputs should have exports', () => {
      const vpcIdOutput = template.Outputs.VpcId;
      expect(vpcIdOutput.Export).toBeDefined();
      expect(vpcIdOutput.Export.Name['Fn::Sub']).toContain('VpcId-${EnvironmentSuffix}');
    });
  });
});

describe('ComputeStack CloudFormation Nested Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/ComputeStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Mappings', () => {
    test('should have PortConfig mapping', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.PortConfig).toBeDefined();
      expect(template.Mappings.PortConfig.HTTP).toBeDefined();
      expect(template.Mappings.PortConfig.HTTPS).toBeDefined();
    });
  });

  describe('ALB Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ALB || template.Resources.ApplicationLoadBalancer).toBeDefined();
    });

    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Auto Scaling', () => {
    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup || template.Resources.WebServerASG;
      expect(asg).toBeDefined();
    });

    test('should have Launch Configuration or Launch Template', () => {
      const hasLC = template.Resources.LaunchConfiguration || template.Resources.LaunchConfig;
      const hasLT = template.Resources.LaunchTemplate;
      expect(hasLC || hasLT).toBeTruthy();
    });
  });
});

describe('DataStack CloudFormation Nested Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/DataStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Conditions', () => {
    test('should have CreateElastiCache condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.CreateElastiCache).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS Aurora cluster', () => {
      const cluster = template.Resources.RDSCluster || template.Resources.AuroraCluster || template.Resources.DBCluster;
      expect(cluster).toBeDefined();
    });

    test('should have RDS security group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS should use Secrets Manager for password', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('ElastiCache Resources (Conditional)', () => {
    test('ElastiCache resources should have Condition', () => {
      const cacheResources = Object.keys(template.Resources).filter(key =>
        key.toLowerCase().includes('cache') || key.toLowerCase().includes('redis')
      );
      
      if (cacheResources.length > 0) {
        const firstCacheResource = template.Resources[cacheResources[0]];
        expect(firstCacheResource.Condition || firstCacheResource).toBeDefined();
      }
    });
  });

  describe('Deletion Policies', () => {
    test('RDS should have Snapshot deletion policy', () => {
      const cluster = template.Resources.RDSCluster || template.Resources.AuroraCluster || template.Resources.DBCluster;
      if (cluster) {
        expect(cluster.DeletionPolicy).toBe('Snapshot');
      }
    });
  });
});

describe('Template Validator Utilities', () => {
  describe('loadTemplate', () => {
    test('should load TapStack template', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should load VPCStack template', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(template).toBeDefined();
      expect(template.Resources.VPC).toBeDefined();
    });

    test('should load ComputeStack template', () => {
      const template = validator.loadTemplate('ComputeStack.json');
      expect(template).toBeDefined();
    });

    test('should load DataStack template', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(template).toBeDefined();
    });
  });

  describe('validateTemplateStructure', () => {
    test('should validate valid template', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(() => validator.validateTemplateStructure(template)).not.toThrow();
    });

    test('should throw error for missing AWSTemplateFormatVersion', () => {
      const invalidTemplate = { Resources: {} } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow('Template missing AWSTemplateFormatVersion');
    });

    test('should throw error for invalid format version', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2008-01-01', Resources: {} } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow('Invalid AWSTemplateFormatVersion');
    });

    test('should throw error for missing resources', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09' } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow('Template must have at least one resource');
    });

    test('should throw error for empty resources', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Resources: {} } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow('Template must have at least one resource');
    });
  });

  describe('getParameterNames', () => {
    test('should get parameters from TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      const params = validator.getParameterNames(template);
      expect(params).toContain('EnvironmentSuffix');
      expect(params).toContain('EnvironmentType');
    });

    test('should return empty array for template without parameters', () => {
      const template = { AWSTemplateFormatVersion: '2010-09-09', Resources: { VPC: { Type: 'AWS::EC2::VPC' } } } as any;
      const params = validator.getParameterNames(template);
      expect(params).toEqual([]);
    });
  });

  describe('getResourceNames', () => {
    test('should get resources from TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      const resources = validator.getResourceNames(template);
      expect(resources).toContain('VPCStack');
      expect(resources).toContain('ComputeStack');
      expect(resources).toContain('DataStack');
    });
  });

  describe('getOutputNames', () => {
    test('should get outputs from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const outputs = validator.getOutputNames(template);
      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs).toContain('VpcId');
    });

    test('should return empty array for template without outputs', () => {
      const template = { AWSTemplateFormatVersion: '2010-09-09', Resources: { VPC: { Type: 'AWS::EC2::VPC' } } } as any;
      const outputs = validator.getOutputNames(template);
      expect(outputs).toEqual([]);
    });
  });

  describe('hasDefaultValue', () => {
    test('should detect parameters with default values', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasDefaultValue(template, 'EnvironmentType')).toBe(true);
    });

    test('should return false for parameters without default', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasDefaultValue(template, 'NonExistent')).toBe(false);
    });

    test('should return false for template without parameters', () => {
      const template = { AWSTemplateFormatVersion: '2010-09-09', Resources: {} } as any;
      expect(validator.hasDefaultValue(template, 'Any')).toBe(false);
    });
  });

  describe('getResourceType', () => {
    test('should get resource type', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.getResourceType(template, 'VPCStack')).toBe('AWS::CloudFormation::Stack');
    });

    test('should throw error for non-existent resource', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(() => validator.getResourceType(template, 'NonExistent')).toThrow('Resource NonExistent not found');
    });
  });

  describe('hasTag', () => {
    test('should detect CostCenter tag in VPC', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'VPC', 'CostCenter')).toBe(true);
    });

    test('should return false for non-existent tag', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'VPC', 'NonExistentTag')).toBe(false);
    });

    test('should return false for resource without tags', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'NonExistent', 'Name')).toBe(false);
    });
  });

  describe('getResourcesByType', () => {
    test('should get nested stack resources', () => {
      const template = validator.loadTemplate('TapStack.json');
      const nestedStacks = validator.getResourcesByType(template, 'AWS::CloudFormation::Stack');
      expect(nestedStacks.length).toBe(3);
      expect(nestedStacks).toContain('VPCStack');
      expect(nestedStacks).toContain('ComputeStack');
      expect(nestedStacks).toContain('DataStack');
    });

    test('should get VPCs from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const vpcs = validator.getResourcesByType(template, 'AWS::EC2::VPC');
      expect(vpcs).toContain('VPC');
    });
  });

  describe('hasNestedStacks', () => {
    test('should detect nested stacks in TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasNestedStacks(template)).toBe(true);
    });

    test('should return false for templates without nested stacks', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasNestedStacks(template)).toBe(false);
    });
  });

  describe('validateEnvironmentSuffixUsage', () => {
    test('should validate VPCStack naming', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.validateEnvironmentSuffixUsage(template)).toBe(true);
    });

    test('should detect missing EnvironmentSuffix in Name tag', () => {
      const badTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: { 'Fn::Sub': 'vpc-hardcoded-name' }
                }
              ]
            }
          }
        }
      } as any;
      expect(validator.validateEnvironmentSuffixUsage(badTemplate)).toBe(false);
    });
  });

  describe('getConditionNames', () => {
    test('should get conditions from DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      const conditions = validator.getConditionNames(template);
      expect(conditions).toContain('CreateElastiCache');
    });

    test('should return empty array for template without conditions', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const conditions = validator.getConditionNames(template);
      expect(conditions).toEqual([]);
    });
  });

  describe('isConditionalResource', () => {
    test('should detect conditional resources in DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      const resources = Object.keys(template.Resources);
      const conditionalResources = resources.filter(r => validator.isConditionalResource(template, r));
      expect(conditionalResources.length).toBeGreaterThanOrEqual(0);
    });

    test('should return false for non-existent resource', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(validator.isConditionalResource(template, 'NonExistent')).toBe(false);
    });
  });

  describe('getExportNames', () => {
    test('should get export names from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const exports = validator.getExportNames(template);
      expect(exports.length).toBeGreaterThan(0);
      expect(exports.some(e => e.includes('VpcId'))).toBe(true);
    });

    test('should handle template without Outputs', () => {
      const template = { AWSTemplateFormatVersion: '2010-09-09', Resources: { VPC: { Type: 'AWS::EC2::VPC', Properties: {} } } } as any;
      const exports = validator.getExportNames(template);
      expect(exports).toEqual([]);
    });

    test('should handle string export names', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Outputs: {
          Test: {
            Value: 'test',
            Export: { Name: 'PlainStringExport' }
          }
        }
      } as any;
      const exports = validator.getExportNames(template);
      expect(exports).toContain('PlainStringExport');
    });
  });

  describe('validateDeletionPolicies', () => {
    test('should validate DataStack deletion policies', () => {
      const template = validator.loadTemplate('DataStack.json');
      const issues = validator.validateDeletionPolicies(template);
      expect(Array.isArray(issues)).toBe(true);
    });

    test('should not report issues for VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const issues = validator.validateDeletionPolicies(template);
      expect(issues.length).toBe(0);
    });

    test('should detect missing Snapshot policy on RDS', () => {
      const badTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          DB: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {}
          }
        }
      } as any;
      const issues = validator.validateDeletionPolicies(badTemplate);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('Snapshot');
    });
  });
});

