import * as path from 'path';
import { TemplateValidator, loadTemplate, validateTemplateStructure } from '../lib/template-validator';

describe('Template Validator Unit Tests', () => {
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
  let validator: TemplateValidator;

  beforeAll(() => {
    validator = new TemplateValidator(templatePath);
  });

  describe('TemplateValidator Constructor', () => {
    test('should load template successfully', () => {
      expect(validator).toBeDefined();
      expect(validator.getTemplate()).toBeDefined();
    });

    test('should throw error for non-existent file', () => {
      expect(() => {
        new TemplateValidator('/nonexistent/path.json');
      }).toThrow();
    });
  });

  describe('Template Access Methods', () => {
    test('getTemplate should return template object', () => {
      const template = validator.getTemplate();
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('hasParameter should detect existing parameters', () => {
      expect(validator.hasParameter('EnvironmentSuffix')).toBe(true);
      expect(validator.hasParameter('TransitGatewayId')).toBe(true);
      expect(validator.hasParameter('VpcCidr')).toBe(true);
    });

    test('hasParameter should return false for non-existent parameters', () => {
      expect(validator.hasParameter('NonExistentParameter')).toBe(false);
    });

    test('hasResource should detect existing resources', () => {
      expect(validator.hasResource('VPC')).toBe(true);
      expect(validator.hasResource('PrivateSubnetAZ1')).toBe(true);
      expect(validator.hasResource('NetworkFirewall')).toBe(true);
    });

    test('hasResource should return false for non-existent resources', () => {
      expect(validator.hasResource('NonExistentResource')).toBe(false);
    });

    test('hasOutput should detect existing outputs', () => {
      expect(validator.hasOutput('VPCId')).toBe(true);
      expect(validator.hasOutput('NetworkFirewallArn')).toBe(true);
    });

    test('hasOutput should return false for non-existent outputs', () => {
      expect(validator.hasOutput('NonExistentOutput')).toBe(false);
    });

    test('getResource should return resource object', () => {
      const vpc = validator.getResource('VPC');
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('getParameter should return parameter object', () => {
      const param = validator.getParameter('EnvironmentSuffix');
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });

    test('getOutput should return output object', () => {
      const output = validator.getOutput('VPCId');
      expect(output).toBeDefined();
      expect(output.Value).toBeDefined();
    });
  });

  describe('Resource Type Methods', () => {
    test('getResourceType should return correct type', () => {
      expect(validator.getResourceType('VPC')).toBe('AWS::EC2::VPC');
      expect(validator.getResourceType('NetworkFirewall')).toBe('AWS::NetworkFirewall::Firewall');
      expect(validator.getResourceType('EBSKMSKey')).toBe('AWS::KMS::Key');
    });

    test('getResourceType should throw for non-existent resource', () => {
      expect(() => {
        validator.getResourceType('NonExistentResource');
      }).toThrow('Resource NonExistentResource not found');
    });

    test('countResourcesByType should count VPC correctly', () => {
      expect(validator.countResourcesByType('AWS::EC2::VPC')).toBe(1);
    });

    test('countResourcesByType should count subnets correctly', () => {
      expect(validator.countResourcesByType('AWS::EC2::Subnet')).toBe(6);
    });

    test('countResourcesByType should count KMS keys correctly', () => {
      expect(validator.countResourcesByType('AWS::KMS::Key')).toBe(3);
    });

    test('countResourcesByType should return 0 for non-existent type', () => {
      expect(validator.countResourcesByType('AWS::NonExistent::Type')).toBe(0);
    });
  });

  describe('Resource Property Access', () => {
    test('getResourceProperty should access nested properties', () => {
      const enableDns = validator.getResourceProperty('VPC', 'Properties.EnableDnsHostnames');
      expect(enableDns).toBe(true);
    });

    test('getResourceProperty should access deep nested properties', () => {
      const firewallType = validator.getResourceProperty('NetworkFirewallRuleGroup', 'Properties.Type');
      expect(firewallType).toBe('STATEFUL');
    });

    test('getResourceProperty should throw for non-existent resource', () => {
      expect(() => {
        validator.getResourceProperty('NonExistent', 'Properties.Something');
      }).toThrow('Resource NonExistent not found');
    });

    test('getResourceProperty should return undefined for invalid path', () => {
      const result = validator.getResourceProperty('VPC', 'Properties.NonExistent');
      expect(result).toBeUndefined();
    });
  });

  describe('List Methods', () => {
    test('listResourceNames should return all resource names', () => {
      const names = validator.listResourceNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('VPC');
      expect(names).toContain('NetworkFirewall');
      expect(names).toContain('EBSKMSKey');
    });

    test('listParameterNames should return all parameter names', () => {
      const names = validator.listParameterNames();
      expect(names).toContain('EnvironmentSuffix');
      expect(names).toContain('TransitGatewayId');
      expect(names).toContain('VpcCidr');
    });

    test('listOutputNames should return all output names', () => {
      const names = validator.listOutputNames();
      expect(names).toContain('VPCId');
      expect(names).toContain('NetworkFirewallArn');
      expect(names).toContain('EBSKMSKeyArn');
    });
  });

  describe('Zero Trust Security Validation', () => {
    test('validateZeroTrustSecurity should pass for valid template', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should validate VPC exists', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('VPC resource exists');
    });

    test('should validate all private subnets exist', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('PrivateSubnetAZ1 resource exists');
      expect(result.successes).toContain('PrivateSubnetAZ2 resource exists');
      expect(result.successes).toContain('PrivateSubnetAZ3 resource exists');
    });

    test('should validate Network Firewall exists', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('Network Firewall resource exists');
    });

    test('should validate KMS keys have rotation enabled', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('EBSKMSKey has rotation enabled');
      expect(result.successes).toContain('S3KMSKey has rotation enabled');
      expect(result.successes).toContain('RDSKMSKey has rotation enabled');
    });

    test('should validate VPC Flow Log exists', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('VPC Flow Log resource exists');
    });

    test('should validate AWS Config exists', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('AWS Config Recorder resource exists');
    });

    test('should validate Config Rules exist', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('ConfigRuleEncryptedVolumes resource exists');
      expect(result.successes).toContain('ConfigRuleIAMPasswordPolicy resource exists');
    });

    test('should validate GuardDuty is not present', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('GuardDuty detector correctly omitted');
    });

    test('should validate SSM endpoints exist', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('SSMEndpoint resource exists');
      expect(result.successes).toContain('SSMMessagesEndpoint resource exists');
      expect(result.successes).toContain('EC2MessagesEndpoint resource exists');
    });

    test('should validate EC2 Instance Role exists', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes).toContain('EC2 Instance Role resource exists');
    });

    test('should have successes but no errors', () => {
      const result = validator.validateZeroTrustSecurity();
      expect(result.successes.length).toBeGreaterThan(15);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Standalone Functions', () => {
    test('loadTemplate should load template', () => {
      const template = loadTemplate(templatePath);
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('loadTemplate should throw for invalid path', () => {
      expect(() => {
        loadTemplate('/nonexistent/path.json');
      }).toThrow();
    });

    test('validateTemplateStructure should validate valid template', () => {
      const template = loadTemplate(templatePath);
      expect(validateTemplateStructure(template)).toBe(true);
    });

    test('validateTemplateStructure should reject invalid template', () => {
      const invalidTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
      };
      expect(validateTemplateStructure(invalidTemplate)).toBe(false);
    });

    test('validateTemplateStructure should check all required sections', () => {
      const incomplete1: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Resources: {},
      };
      expect(validateTemplateStructure(incomplete1)).toBe(false);

      const incomplete2: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Parameters: {},
        Outputs: {},
      };
      expect(validateTemplateStructure(incomplete2)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle resources without Properties', () => {
      const template = validator.getTemplate();
      const resourcesWithoutProps = Object.keys(template.Resources).filter(
        name => !template.Resources[name].Properties
      );
      expect(resourcesWithoutProps.length).toBe(0);
    });

    test('should handle resources with DeletionPolicy', () => {
      const kmsKey = validator.getResource('EBSKMSKey');
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });

    test('should verify no Retain deletion policies', () => {
      const resources = validator.listResourceNames();
      for (const resourceName of resources) {
        const resource = validator.getResource(resourceName);
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      }
    });
  });

  describe('Error Path Coverage', () => {
    test('getResourceProperty should handle non-object properties', () => {
      // Create a mock validator with a resource that has a non-object property
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {
          TestResource: {
            Type: 'AWS::Test::Resource',
            Properties: {
              StringProp: 'test'
            }
          }
        },
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }
      })();

      expect(() => {
        mockValidator.getResourceProperty('TestResource', 'Properties.StringProp.nested');
      }).toThrow();
    });

    test('validateZeroTrustSecurity should detect missing VPC', () => {
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {},
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }
      })();

      const result = mockValidator.validateZeroTrustSecurity();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing VPC resource');
    });

    test('validateZeroTrustSecurity should detect missing subnets', () => {
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {
          VPC: { Type: 'AWS::EC2::VPC', Properties: {} }
        },
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }
      })();

      const result = mockValidator.validateZeroTrustSecurity();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing PrivateSubnetAZ1 resource');
      expect(result.errors).toContain('Missing PrivateSubnetAZ2 resource');
      expect(result.errors).toContain('Missing PrivateSubnetAZ3 resource');
    });

    test('validateZeroTrustSecurity should detect missing Network Firewall', () => {
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {
          VPC: { Type: 'AWS::EC2::VPC', Properties: {} },
          PrivateSubnetAZ1: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ2: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ3: { Type: 'AWS::EC2::Subnet', Properties: {} }
        },
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }
      })();

      const result = mockValidator.validateZeroTrustSecurity();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing Network Firewall resource');
    });

    test('validateZeroTrustSecurity should detect KMS key without rotation', () => {
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {
          VPC: { Type: 'AWS::EC2::VPC', Properties: {} },
          PrivateSubnetAZ1: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ2: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ3: { Type: 'AWS::EC2::Subnet', Properties: {} },
          NetworkFirewall: { Type: 'AWS::NetworkFirewall::Firewall', Properties: {} },
          EBSKMSKey: {
            Type: 'AWS::KMS::Key',
            Properties: { EnableKeyRotation: false }
          },
          S3KMSKey: { Type: 'AWS::KMS::Key', Properties: {} },
          RDSKMSKey: { Type: 'AWS::KMS::Key', Properties: {} }
        },
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }

        public getResourceProperty(resourceName: string, propertyPath: string): any {
          if (resourceName === 'S3KMSKey' || resourceName === 'RDSKMSKey') {
            throw new Error('Test error');
          }
          return super.getResourceProperty(resourceName, propertyPath);
        }
      })();

      const result = mockValidator.validateZeroTrustSecurity();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('EBSKMSKey does not have rotation enabled');
      expect(result.errors).toContain('S3KMSKey missing EnableKeyRotation property');
      expect(result.errors).toContain('RDSKMSKey missing EnableKeyRotation property');
    });

    test('validateZeroTrustSecurity should detect GuardDuty if present', () => {
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {
          VPC: { Type: 'AWS::EC2::VPC', Properties: {} },
          PrivateSubnetAZ1: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ2: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ3: { Type: 'AWS::EC2::Subnet', Properties: {} },
          NetworkFirewall: { Type: 'AWS::NetworkFirewall::Firewall', Properties: {} },
          EBSKMSKey: { Type: 'AWS::KMS::Key', Properties: { EnableKeyRotation: true } },
          S3KMSKey: { Type: 'AWS::KMS::Key', Properties: { EnableKeyRotation: true } },
          RDSKMSKey: { Type: 'AWS::KMS::Key', Properties: { EnableKeyRotation: true } },
          VPCFlowLog: { Type: 'AWS::EC2::FlowLog', Properties: {} },
          ConfigRecorder: { Type: 'AWS::Config::ConfigurationRecorder', Properties: {} },
          ConfigRuleEncryptedVolumes: { Type: 'AWS::Config::ConfigRule', Properties: {} },
          ConfigRuleIAMPasswordPolicy: { Type: 'AWS::Config::ConfigRule', Properties: {} },
          GuardDutyDetector: { Type: 'AWS::GuardDuty::Detector', Properties: {} },
          SSMEndpoint: { Type: 'AWS::EC2::VPCEndpoint', Properties: {} },
          SSMMessagesEndpoint: { Type: 'AWS::EC2::VPCEndpoint', Properties: {} },
          EC2MessagesEndpoint: { Type: 'AWS::EC2::VPCEndpoint', Properties: {} },
          EC2InstanceRole: { Type: 'AWS::IAM::Role', Properties: {} }
        },
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }
      })();

      const result = mockValidator.validateZeroTrustSecurity();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('GuardDuty detector found - this is an account-level resource');
    });

    test('validateZeroTrustSecurity should detect Retain deletion policy', () => {
      const mockTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Mock',
        Parameters: {},
        Resources: {
          VPC: { Type: 'AWS::EC2::VPC', Properties: {} },
          PrivateSubnetAZ1: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ2: { Type: 'AWS::EC2::Subnet', Properties: {} },
          PrivateSubnetAZ3: { Type: 'AWS::EC2::Subnet', Properties: {} },
          NetworkFirewall: { Type: 'AWS::NetworkFirewall::Firewall', Properties: {} },
          EBSKMSKey: { Type: 'AWS::KMS::Key', Properties: { EnableKeyRotation: true }, DeletionPolicy: 'Retain' },
          S3KMSKey: { Type: 'AWS::KMS::Key', Properties: { EnableKeyRotation: true } },
          RDSKMSKey: { Type: 'AWS::KMS::Key', Properties: { EnableKeyRotation: true } },
          VPCFlowLog: { Type: 'AWS::EC2::FlowLog', Properties: {} },
          ConfigRecorder: { Type: 'AWS::Config::ConfigurationRecorder', Properties: {} },
          ConfigRuleEncryptedVolumes: { Type: 'AWS::Config::ConfigRule', Properties: {} },
          ConfigRuleIAMPasswordPolicy: { Type: 'AWS::Config::ConfigRule', Properties: {} },
          SSMEndpoint: { Type: 'AWS::EC2::VPCEndpoint', Properties: {} },
          SSMMessagesEndpoint: { Type: 'AWS::EC2::VPCEndpoint', Properties: {} },
          EC2MessagesEndpoint: { Type: 'AWS::EC2::VPCEndpoint', Properties: {} },
          EC2InstanceRole: { Type: 'AWS::IAM::Role', Properties: {} }
        },
        Outputs: {}
      };

      const mockValidator = new (class extends TemplateValidator {
        constructor() {
          super(templatePath);
          (this as any).template = mockTemplate;
        }
      })();

      const result = mockValidator.validateZeroTrustSecurity();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Resource EBSKMSKey has Retain deletion policy');
    });
  });
});
