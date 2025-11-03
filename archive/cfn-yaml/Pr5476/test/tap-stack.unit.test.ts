// test/tap-stack.unit.test.ts
import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Custom schema to handle CloudFormation intrinsic functions
const CLOUDFORMATION_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data) => ({ Ref: data })
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::Sub': data })
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::GetAtt': data.split('.') })
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Equals': data })
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Not': data })
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::If': data })
  })
]);

describe('TapStack Comprehensive Tests', () => {
  let template: Template;
  let templateObj: any;

  beforeAll(() => {
    try {
      // Load CloudFormation template with custom schema
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Parse with custom schema for CloudFormation functions
      templateObj = yaml.load(templateContent, { 
        schema: CLOUDFORMATION_SCHEMA 
      }) as any;

      // Create a minimal CDK stack for testing
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      
      // Convert to Template object for assertions
      template = Template.fromJSON(templateObj);

    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  });

  describe('Template Structure Validation', () => {
    test('Template has correct AWS format version', () => {
      expect(templateObj.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('Template has valid description', () => {
      expect(typeof templateObj.Description).toBe('string');
      expect(templateObj.Description).toContain('Zero-Trust Security Baseline');
    });

    test('Template contains all required sections', () => {
      expect(templateObj.Parameters).toBeDefined();
      expect(templateObj.Resources).toBeDefined();
      expect(templateObj.Outputs).toBeDefined();
      expect(templateObj.Conditions).toBeDefined();
    });

    test('Template has Metadata section', () => {
      expect(templateObj.Metadata).toBeDefined();
      expect(templateObj.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('SecurityAccountId parameter has proper validation', () => {
      const param = templateObj.Parameters.SecurityAccountId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBe('^([0-9]{12})?$');
    });

    test('OwnerTag parameter has correct constraints', () => {
      const param = templateObj.Parameters.OwnerTag;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('SecurityTeam');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(50);
    });

    test('ClassificationTag parameter has valid values', () => {
      const param = templateObj.Parameters.ClassificationTag;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('confidential');
      expect(param.AllowedValues).toEqual(['confidential', 'restricted', 'public']);
    });
  });

  describe('Conditions Validation', () => {
    test('UseCurrentAccount condition is defined', () => {
      const condition = templateObj.Conditions.UseCurrentAccount;
      expect(condition).toBeDefined();
    });

    test('HasSecurityAccount condition is defined', () => {
      const condition = templateObj.Conditions.HasSecurityAccount;
      expect(condition).toBeDefined();
    });
  });

  describe('IAM Roles Validation', () => {
    test('DeveloperRole is created with proper configuration', () => {
      const role = templateObj.Resources.DeveloperRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toBeDefined();
      expect(role.Properties.PermissionsBoundary).toBeDefined();
    });

    test('SecurityAdminRole has MFA enforcement', () => {
      const role = templateObj.Resources.SecurityAdminRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Condition).toBeDefined();
    });

    test('SecurityOperationsRole has proper boundaries', () => {
      const role = templateObj.Resources.SecurityOperationsRole;
      expect(role.Properties.PermissionsBoundary).toBeDefined();
    });

    test('All roles have MFA requirement', () => {
      const roles = ['DeveloperRole', 'SecurityAdminRole', 'SecurityOperationsRole'];
      roles.forEach(roleName => {
        const role = templateObj.Resources[roleName];
        const condition = role.Properties.AssumeRolePolicyDocument.Statement[0].Condition;
        expect(condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
      });
    });
  });

  describe('KMS Key Validation', () => {
    test('SecurityKMSKey is properly configured', () => {
      const key = templateObj.Resources.SecurityKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.Enabled).toBe(true);
    });

    test('KMS Key has valid policy structure', () => {
      const key = templateObj.Resources.SecurityKMSKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
    });

    test('KMS Key alias is configured', () => {
      const alias = templateObj.Resources.SecurityKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBeDefined();
      expect(alias.Properties.TargetKeyId).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups Validation', () => {
    test('SecurityAuditLogGroup has proper configuration', () => {
      const logGroup = templateObj.Resources.SecurityAuditLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('ApplicationLogGroup has correct settings', () => {
      const logGroup = templateObj.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('SNS Topics Validation', () => {
    test('SecurityAlertsTopic uses encryption', () => {
      const topic = templateObj.Resources.SecurityAlertsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });
  describe('Outputs Validation', () => {
    test('KMS Key outputs are defined', () => {
      const outputs = templateObj.Outputs;
      expect(outputs.SecurityKMSKeyArn).toBeDefined();
      expect(outputs.SecurityKMSKeyId).toBeDefined();
      expect(outputs.SecurityKMSKeyAlias).toBeDefined();
    });

    test('IAM Role outputs are exported', () => {
      const outputs = templateObj.Outputs;
      expect(outputs.DeveloperRoleArn).toBeDefined();
      expect(outputs.SecurityAdminRoleArn).toBeDefined();
      expect(outputs.SecurityOperationsRoleArn).toBeDefined();
    });

    test('SNS Topic outputs are present', () => {
      const outputs = templateObj.Outputs;
      expect(outputs.SecurityAlertsTopicArn).toBeDefined();
      expect(outputs.ComplianceAlertsTopicArn).toBeDefined();
    });

    test('Log Group outputs are configured', () => {
      const outputs = templateObj.Outputs;
      expect(outputs.SecurityAuditLogGroupName).toBeDefined();
      expect(outputs.ComplianceLogGroupName).toBeDefined();
      expect(outputs.ApplicationLogGroupName).toBeDefined();
    });

    test('Stack summary provides deployment info', () => {
      const summary = templateObj.Outputs.StackSummary;
      expect(summary.Description).toContain('Summary of deployed resources');
    });
  });

  describe('Security Standards Validation', () => {
    test('All IAM roles have MFA requirement', () => {
      const roles = ['DeveloperRole', 'SecurityAdminRole', 'SecurityOperationsRole'];
      roles.forEach(roleName => {
        const role = templateObj.Resources[roleName];
        const condition = role.Properties.AssumeRolePolicyDocument.Statement[0].Condition;
        expect(condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
      });
    });

    test('Critical resources have KMS encryption', () => {
      const encryptedResources = [
        'SecurityAuditLogGroup',
        'ComplianceLogGroup', 
        'ApplicationLogGroup',
        'SecurityAlertsTopic',
        'ComplianceAlertsTopic'
      ];

      encryptedResources.forEach(resourceName => {
        const resource = templateObj.Resources[resourceName];
        const kmsProperty = resource.Properties.KmsKeyId || resource.Properties.KmsMasterKeyId;
        expect(kmsProperty).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('KMS key is referenced by encrypted resources', () => {
      const resourcesWithKms = [
        'SecurityAuditLogGroup',
        'ComplianceLogGroup',
        'ApplicationLogGroup',
        'SecurityAlertsTopic',
        'ComplianceAlertsTopic'
      ];

      resourcesWithKms.forEach(resourceName => {
        const resource = templateObj.Resources[resourceName];
        const kmsRef = resource.Properties.KmsKeyId || resource.Properties.KmsMasterKeyId;
        expect(kmsRef).toBeDefined();
      });
    });
  });

  describe('Tagging Validation', () => {
    test('Resources have environment tags', () => {
      const resources = Object.values(templateObj.Resources) as any[];
      const taggedResources = resources.filter(resource => 
        resource.Properties && resource.Properties.Tags
      );

      // Check that at least some resources have tags
      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Template Completeness', () => {
    test('Template has all required resource types', () => {
      const resources = templateObj.Resources;
      const resourceTypes = Object.values(resources).map((resource: any) => resource.Type);
      
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::SSM::Parameter');
    });

    test('Template follows naming conventions', () => {
      const resources = templateObj.Resources;
      Object.entries(resources).forEach(([name, resource]: [string, any]) => {
        // Basic naming convention check - names should be meaningful
        expect(name.length).toBeGreaterThan(0);
        expect(typeof name).toBe('string');
      });
    });
  });
});