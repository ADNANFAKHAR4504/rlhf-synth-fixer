import path from 'path';
import fs from 'fs';
import { TemplateValidator, loadTemplate, validateTemplate } from '../lib/template-validator';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const templatePath = path.join(__dirname, '../lib/TapStack.json');

describe('TapStack CloudFormation Template - WAF Security', () => {
  let validator: TemplateValidator;
  let template: any;

  beforeAll(() => {
    validator = new TemplateValidator(templatePath);
    template = validator.getTemplate();
  });

  describe('Template Loading', () => {
    test('should load template successfully', () => {
      const loaded = loadTemplate(templatePath);
      expect(loaded).toBeDefined();
      expect(loaded.AWSTemplateFormatVersion).toBeDefined();
    });

    test('validator should have template loaded', () => {
      const t = validator.getTemplate();
      expect(t).toBeDefined();
      expect(typeof t).toBe('object');
    });
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(validator.validateFormatVersion()).toBe(true);
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for WAF security', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('WAF');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should validate all parameters correctly', () => {
      expect(validator.validateParameters()).toBe(true);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('suffix');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have ALBArn parameter', () => {
      expect(template.Parameters.ALBArn).toBeDefined();
    });

    test('ALBArn parameter should have default empty value', () => {
      const param = template.Parameters.ALBArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have exactly 2 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(2);
    });
  });

  describe('Conditions Validation', () => {
    test('should validate conditions correctly', () => {
      expect(validator.validateConditions()).toBe(true);
    });

    test('should validate conditional association', () => {
      expect(validator.validateConditionalAssociation()).toBe(true);
    });

    test('should have HasALB condition', () => {
      expect(template.Conditions.HasALB).toBeDefined();
    });

    test('HasALB condition should check for non-empty ALBArn', () => {
      const condition = template.Conditions.HasALB;
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
    });
  });

  describe('Resources Validation', () => {
    test('should validate all resources exist', () => {
      expect(validator.validateResources()).toBe(true);
    });

    test('should have exactly 6 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });

    test('all resources should be defined', () => {
      const expectedResources = [
        'OfficeIPSet',
        'WAFWebACL',
        'WAFLogsBucket',
        'WAFLogsBucketPolicy',
        'WAFLoggingConfiguration',
        'WebACLAssociation',
      ];
      expectedResources.forEach((resourceName) => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });

  describe('WAF Resources Validation', () => {
    test('should have OfficeIPSet resource', () => {
      expect(template.Resources.OfficeIPSet).toBeDefined();
    });

    test('OfficeIPSet should be WAFv2 IPSet', () => {
      const resource = template.Resources.OfficeIPSet;
      expect(resource.Type).toBe('AWS::WAFv2::IPSet');
    });

    test('should validate IP allowlist correctly', () => {
      expect(validator.validateIPAllowlist()).toBe(true);
    });

    test('OfficeIPSet should have office IP addresses', () => {
      const resource = template.Resources.OfficeIPSet;
      expect(resource.Properties.Addresses).toContain('10.0.0.0/24');
      expect(resource.Properties.Addresses).toContain('192.168.1.0/24');
    });

    test('OfficeIPSet should be REGIONAL scope', () => {
      const resource = template.Resources.OfficeIPSet;
      expect(resource.Properties.Scope).toBe('REGIONAL');
    });

    test('OfficeIPSet should be IPV4', () => {
      const resource = template.Resources.OfficeIPSet;
      expect(resource.Properties.IPAddressVersion).toBe('IPV4');
    });
  });

  describe('WAF Web ACL Validation', () => {
    test('should have WAFWebACL resource', () => {
      expect(template.Resources.WAFWebACL).toBeDefined();
    });

    test('WAFWebACL should be WAFv2 WebACL', () => {
      const resource = template.Resources.WAFWebACL;
      expect(resource.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('WAFWebACL should be REGIONAL scope', () => {
      const resource = template.Resources.WAFWebACL;
      expect(resource.Properties.Scope).toBe('REGIONAL');
    });

    test('WAFWebACL should have default Allow action', () => {
      const resource = template.Resources.WAFWebACL;
      expect(resource.Properties.DefaultAction.Allow).toBeDefined();
    });

    test('should validate metrics are enabled', () => {
      expect(validator.validateMetricsEnabled()).toBe(true);
    });

    test('WAFWebACL should have visibility config with metrics enabled', () => {
      const resource = template.Resources.WAFWebACL;
      const visConfig = resource.Properties.VisibilityConfig;
      expect(visConfig.SampledRequestsEnabled).toBe(true);
      expect(visConfig.CloudWatchMetricsEnabled).toBe(true);
      expect(visConfig.MetricName).toBeDefined();
    });
  });

  describe('WAF Rules Validation', () => {
    test('should validate WAF rules correctly', () => {
      expect(validator.validateWAFRules()).toBe(true);
    });

    test('should return false when WAF rules are invalid or missing', () => {
      // Create a mock template with invalid rules (wrong count)
      const invalidTemplate = JSON.parse(JSON.stringify(template));
      invalidTemplate.Resources.WAFWebACL.Properties.Rules = []; // Empty rules array

      // Write temporary invalid template
      const tempPath = 'lib/TapStack-invalid-test.json';
      fs.writeFileSync(tempPath, JSON.stringify(invalidTemplate, null, 2));

      // Create validator with invalid template
      const invalidValidator = new TemplateValidator(tempPath);
      expect(invalidValidator.validateWAFRules()).toBe(false);

      // Clean up
      fs.unlinkSync(tempPath);
    });

    test('should validate rate limit configuration', () => {
      expect(validator.validateRateLimitConfig()).toBe(true);
    });

    test('should validate geo blocking configuration', () => {
      expect(validator.validateGeoBlocking()).toBe(true);
    });

    test('should validate managed rules', () => {
      expect(validator.validateManagedRules()).toBe(true);
    });

    test('WAFWebACL should have exactly 5 rules', () => {
      const resource = template.Resources.WAFWebACL;
      expect(resource.Properties.Rules.length).toBe(5);
    });

    let rules: any[];

    beforeAll(() => {
      rules = template.Resources.WAFWebACL.Properties.Rules;
    });

    test('should have AllowOfficeIPs rule at priority 0', () => {
      const rule = rules.find((r: any) => r.Name === 'AllowOfficeIPs');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(0);
    });

    test('AllowOfficeIPs should reference OfficeIPSet', () => {
      const rule = rules.find((r: any) => r.Name === 'AllowOfficeIPs');
      expect(rule.Statement.IPSetReferenceStatement).toBeDefined();
      expect(rule.Statement.IPSetReferenceStatement.Arn).toEqual({
        'Fn::GetAtt': ['OfficeIPSet', 'Arn'],
      });
    });

    test('AllowOfficeIPs should have Allow action', () => {
      const rule = rules.find((r: any) => r.Name === 'AllowOfficeIPs');
      expect(rule.Action.Allow).toBeDefined();
    });

    test('should have GeoBlockHighRiskCountries rule at priority 1', () => {
      const rule = rules.find((r: any) => r.Name === 'GeoBlockHighRiskCountries');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(1);
    });

    test('GeoBlockHighRiskCountries should block KP and IR', () => {
      const rule = rules.find((r: any) => r.Name === 'GeoBlockHighRiskCountries');
      expect(rule.Statement.GeoMatchStatement.CountryCodes).toContain('KP');
      expect(rule.Statement.GeoMatchStatement.CountryCodes).toContain('IR');
    });

    test('GeoBlockHighRiskCountries should have Block action', () => {
      const rule = rules.find((r: any) => r.Name === 'GeoBlockHighRiskCountries');
      expect(rule.Action.Block).toBeDefined();
    });

    test('should have RateLimitRule at priority 2', () => {
      const rule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(2);
    });

    test('RateLimitRule should have correct limit of 2000', () => {
      const rule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('RateLimitRule should aggregate by IP', () => {
      const rule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
    });

    test('RateLimitRule should have Block action', () => {
      const rule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rule.Action.Block).toBeDefined();
    });

    test('should have SQLInjectionProtection rule at priority 3', () => {
      const rule = rules.find((r: any) => r.Name === 'SQLInjectionProtection');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(3);
    });

    test('SQLInjectionProtection should use AWS managed rule', () => {
      const rule = rules.find((r: any) => r.Name === 'SQLInjectionProtection');
      expect(rule.Statement.ManagedRuleGroupStatement).toBeDefined();
      expect(rule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(rule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
    });

    test('SQLInjectionProtection should have OverrideAction None', () => {
      const rule = rules.find((r: any) => r.Name === 'SQLInjectionProtection');
      expect(rule.OverrideAction.None).toBeDefined();
    });

    test('should have KnownBadInputsProtection rule at priority 4', () => {
      const rule = rules.find((r: any) => r.Name === 'KnownBadInputsProtection');
      expect(rule).toBeDefined();
      expect(rule.Priority).toBe(4);
    });

    test('KnownBadInputsProtection should use AWS managed rule', () => {
      const rule = rules.find((r: any) => r.Name === 'KnownBadInputsProtection');
      expect(rule.Statement.ManagedRuleGroupStatement).toBeDefined();
      expect(rule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesKnownBadInputsRuleSet');
    });

    test('all rules should have visibility config with metrics', () => {
      rules.forEach((rule: any) => {
        expect(rule.VisibilityConfig).toBeDefined();
        expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
        expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
        expect(rule.VisibilityConfig.MetricName).toBeDefined();
      });
    });

    test('all rule priorities should be unique', () => {
      const priorities = rules.map((r: any) => r.Priority);
      const uniquePriorities = new Set(priorities);
      expect(uniquePriorities.size).toBe(priorities.length);
    });
  });

  describe('S3 Logging Bucket Validation', () => {
    test('should have WAFLogsBucket resource', () => {
      expect(template.Resources.WAFLogsBucket).toBeDefined();
    });

    test('WAFLogsBucket should be S3 Bucket', () => {
      const resource = template.Resources.WAFLogsBucket;
      expect(resource.Type).toBe('AWS::S3::Bucket');
    });

    test('should validate S3 encryption', () => {
      expect(validator.validateS3Encryption()).toBe(true);
    });

    test('should validate public access block', () => {
      expect(validator.validatePublicAccessBlock()).toBe(true);
    });

    test('WAFLogsBucket should have AES256 encryption', () => {
      const resource = template.Resources.WAFLogsBucket;
      const encryption = resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('WAFLogsBucket should block all public access', () => {
      const resource = template.Resources.WAFLogsBucket;
      const publicAccess = resource.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('S3 Bucket Policy Validation', () => {
    test('should have WAFLogsBucketPolicy resource', () => {
      expect(template.Resources.WAFLogsBucketPolicy).toBeDefined();
    });

    test('WAFLogsBucketPolicy should be S3 BucketPolicy', () => {
      const resource = template.Resources.WAFLogsBucketPolicy;
      expect(resource.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('WAFLogsBucketPolicy should reference WAFLogsBucket', () => {
      const resource = template.Resources.WAFLogsBucketPolicy;
      expect(resource.Properties.Bucket).toEqual({ Ref: 'WAFLogsBucket' });
    });

    test('WAFLogsBucketPolicy should allow log delivery service', () => {
      const resource = template.Resources.WAFLogsBucketPolicy;
      const statements = resource.Properties.PolicyDocument.Statement;
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSLogDeliveryWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Principal.Service).toBe('delivery.logs.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
    });

    test('WAFLogsBucketPolicy should allow ACL check', () => {
      const resource = template.Resources.WAFLogsBucketPolicy;
      const statements = resource.Properties.PolicyDocument.Statement;
      const aclStatement = statements.find((s: any) => s.Sid === 'AWSLogDeliveryAclCheck');
      expect(aclStatement).toBeDefined();
      expect(aclStatement.Action).toBe('s3:GetBucketAcl');
    });
  });

  describe('WAF Logging Configuration Validation', () => {
    test('should validate logging configuration', () => {
      expect(validator.validateLoggingConfiguration()).toBe(true);
    });

    test('should have WAFLoggingConfiguration resource', () => {
      expect(template.Resources.WAFLoggingConfiguration).toBeDefined();
    });

    test('WAFLoggingConfiguration should be WAFv2 LoggingConfiguration', () => {
      const resource = template.Resources.WAFLoggingConfiguration;
      expect(resource.Type).toBe('AWS::WAFv2::LoggingConfiguration');
    });

    test('WAFLoggingConfiguration should depend on bucket policy', () => {
      const resource = template.Resources.WAFLoggingConfiguration;
      expect(resource.DependsOn).toContain('WAFLogsBucketPolicy');
    });

    test('WAFLoggingConfiguration should reference WAFWebACL', () => {
      const resource = template.Resources.WAFLoggingConfiguration;
      expect(resource.Properties.ResourceArn).toEqual({
        'Fn::GetAtt': ['WAFWebACL', 'Arn'],
      });
    });

    test('WAFLoggingConfiguration should use S3 bucket for logs', () => {
      const resource = template.Resources.WAFLoggingConfiguration;
      expect(resource.Properties.LogDestinationConfigs).toBeDefined();
      expect(resource.Properties.LogDestinationConfigs[0]).toEqual({
        'Fn::GetAtt': ['WAFLogsBucket', 'Arn'],
      });
    });

    test('WAFLoggingConfiguration should have logging filter', () => {
      const resource = template.Resources.WAFLoggingConfiguration;
      expect(resource.Properties.LoggingFilter).toBeDefined();
      expect(resource.Properties.LoggingFilter.DefaultBehavior).toBe('KEEP');
    });

    test('WAFLoggingConfiguration should filter for BLOCK actions', () => {
      const resource = template.Resources.WAFLoggingConfiguration;
      const filters = resource.Properties.LoggingFilter.Filters;
      expect(filters).toBeDefined();
      expect(filters[0].Conditions[0].ActionCondition.Action).toBe('BLOCK');
    });
  });

  describe('WebACL Association Validation', () => {
    test('should have WebACLAssociation resource', () => {
      expect(template.Resources.WebACLAssociation).toBeDefined();
    });

    test('WebACLAssociation should be WAFv2 WebACLAssociation', () => {
      const resource = template.Resources.WebACLAssociation;
      expect(resource.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });

    test('WebACLAssociation should have HasALB condition', () => {
      const resource = template.Resources.WebACLAssociation;
      expect(resource.Condition).toBe('HasALB');
    });

    test('WebACLAssociation should reference ALBArn parameter', () => {
      const resource = template.Resources.WebACLAssociation;
      expect(resource.Properties.ResourceArn).toEqual({ Ref: 'ALBArn' });
    });

    test('WebACLAssociation should reference WAFWebACL', () => {
      const resource = template.Resources.WebACLAssociation;
      expect(resource.Properties.WebACLArn).toEqual({
        'Fn::GetAtt': ['WAFWebACL', 'Arn'],
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should validate all outputs exist', () => {
      expect(validator.validateOutputs()).toBe(true);
    });

    test('should have exactly 5 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });

    test('should have WebACLArn output', () => {
      expect(template.Outputs.WebACLArn).toBeDefined();
    });

    test('WebACLArn output should reference WAFWebACL', () => {
      const output = template.Outputs.WebACLArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WAFWebACL', 'Arn'],
      });
    });

    test('should have WebACLId output', () => {
      expect(template.Outputs.WebACLId).toBeDefined();
    });

    test('WebACLId output should reference WAFWebACL', () => {
      const output = template.Outputs.WebACLId;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WAFWebACL', 'Id'],
      });
    });

    test('should have WAFLogsBucketName output', () => {
      expect(template.Outputs.WAFLogsBucketName).toBeDefined();
    });

    test('WAFLogsBucketName output should reference WAFLogsBucket', () => {
      const output = template.Outputs.WAFLogsBucketName;
      expect(output.Value).toEqual({ Ref: 'WAFLogsBucket' });
    });

    test('should have WAFLogsBucketArn output', () => {
      expect(template.Outputs.WAFLogsBucketArn).toBeDefined();
    });

    test('WAFLogsBucketArn output should reference WAFLogsBucket', () => {
      const output = template.Outputs.WAFLogsBucketArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WAFLogsBucket', 'Arn'],
      });
    });

    test('should have OfficeIPSetArn output', () => {
      expect(template.Outputs.OfficeIPSetArn).toBeDefined();
    });

    test('OfficeIPSetArn output should reference OfficeIPSet', () => {
      const output = template.Outputs.OfficeIPSetArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['OfficeIPSet', 'Arn'],
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Naming Conventions Validation', () => {
    test('should validate environment suffix usage', () => {
      expect(validator.validateEnvironmentSuffixUsage()).toBe(true);
    });

    test('all named resources should include environmentSuffix', () => {
      expect(template.Resources.OfficeIPSet.Properties.Name).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
      expect(template.Resources.WAFWebACL.Properties.Name).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
      expect(template.Resources.WAFLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('all export names should follow stack naming convention', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Resource Tags Validation', () => {
    test('should validate resource tags', () => {
      expect(validator.validateResourceTags()).toBe(true);
    });

    test('OfficeIPSet should have proper tags', () => {
      const resource = template.Resources.OfficeIPSet;
      expect(resource.Properties.Tags).toBeDefined();
      expect(resource.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('WAFWebACL should have proper tags', () => {
      const resource = template.Resources.WAFWebACL;
      expect(resource.Properties.Tags).toBeDefined();
      expect(resource.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('WAFLogsBucket should have proper tags', () => {
      const resource = template.Resources.WAFLogsBucket;
      expect(resource.Properties.Tags).toBeDefined();
      expect(resource.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Security Best Practices Validation', () => {
    test('should validate no deletion retain policies', () => {
      expect(validator.validateNoDeletionRetain()).toBe(true);
    });

    test('S3 bucket should not have Retain deletion policy', () => {
      const resource = template.Resources.WAFLogsBucket;
      expect(resource.DeletionPolicy).not.toBe('Retain');
    });

    test('all resources should not have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach((resourceKey) => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('WAF rules should have CloudWatch metrics enabled', () => {
      const rules = template.Resources.WAFWebACL.Properties.Rules;
      rules.forEach((rule: any) => {
        expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
      });
    });
  });

  describe('Complete Validation', () => {
    test('should pass all validations', () => {
      const { passed, results } = validator.runAllValidations();
      expect(passed).toBe(true);
      Object.entries(results).forEach(([key, value]) => {
        expect(value).toBe(true);
      });
    });

    test('validateTemplate function should return true', () => {
      expect(validateTemplate(templatePath)).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
