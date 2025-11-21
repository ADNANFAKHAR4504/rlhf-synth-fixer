import fs from 'fs';
import path from 'path';

export interface WAFTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: any;
  Conditions?: any;
  Resources: any;
  Outputs: any;
}

export class TemplateValidator {
  private template: WAFTemplate;

  constructor(templatePath: string) {
    const content = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(content);
  }

  validateFormatVersion(): boolean {
    return this.template.AWSTemplateFormatVersion === '2010-09-09';
  }

  validateParameters(): boolean {
    const params = this.template.Parameters;
    return (
      params &&
      params.EnvironmentSuffix &&
      params.ALBArn &&
      params.ALBArn.Default === ''
    );
  }

  validateResources(): boolean {
    const resources = this.template.Resources;
    const required = [
      'OfficeIPSet',
      'WAFWebACL',
      'WAFLogsBucket',
      'WAFLogsBucketPolicy',
      'WAFLoggingConfiguration',
      'WebACLAssociation',
    ];
    return required.every((r) => resources[r] !== undefined);
  }

  validateOutputs(): boolean {
    const outputs = this.template.Outputs;
    const required = [
      'WebACLArn',
      'WebACLId',
      'WAFLogsBucketName',
      'WAFLogsBucketArn',
      'OfficeIPSetArn',
    ];
    return required.every((o) => outputs[o] !== undefined);
  }

  validateWAFRules(): boolean {
    const rules = this.template.Resources.WAFWebACL?.Properties?.Rules;
    if (!rules || rules.length !== 5) return false;

    const ruleNames = rules.map((r: any) => r.Name);
    const expected = [
      'AllowOfficeIPs',
      'GeoBlockHighRiskCountries',
      'RateLimitRule',
      'SQLInjectionProtection',
      'KnownBadInputsProtection',
    ];

    return expected.every((name) => ruleNames.includes(name));
  }

  validateRateLimitConfig(): boolean {
    const rules = this.template.Resources.WAFWebACL?.Properties?.Rules;
    const rateLimitRule = rules?.find((r: any) => r.Name === 'RateLimitRule');
    return rateLimitRule?.Statement?.RateBasedStatement?.Limit === 2000;
  }

  validateGeoBlocking(): boolean {
    const rules = this.template.Resources.WAFWebACL?.Properties?.Rules;
    const geoRule = rules?.find(
      (r: any) => r.Name === 'GeoBlockHighRiskCountries'
    );
    const countries = geoRule?.Statement?.GeoMatchStatement?.CountryCodes;
    return countries?.includes('KP') && countries?.includes('IR');
  }

  validateS3Encryption(): boolean {
    const bucket = this.template.Resources.WAFLogsBucket;
    const encryption =
      bucket?.Properties?.BucketEncryption
        ?.ServerSideEncryptionConfiguration?.[0]
        ?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    return encryption === 'AES256';
  }

  validatePublicAccessBlock(): boolean {
    const bucket = this.template.Resources.WAFLogsBucket;
    const config = bucket?.Properties?.PublicAccessBlockConfiguration;
    return (
      config?.BlockPublicAcls === true &&
      config?.BlockPublicPolicy === true &&
      config?.IgnorePublicAcls === true &&
      config?.RestrictPublicBuckets === true
    );
  }

  validateIPAllowlist(): boolean {
    const ipSet = this.template.Resources.OfficeIPSet;
    const addresses = ipSet?.Properties?.Addresses;
    return (
      addresses?.includes('10.0.0.0/24') &&
      addresses?.includes('192.168.1.0/24')
    );
  }

  validateConditions(): boolean {
    return this.template.Conditions?.HasALB !== undefined;
  }

  validateConditionalAssociation(): boolean {
    const association = this.template.Resources.WebACLAssociation;
    return association?.Condition === 'HasALB';
  }

  validateEnvironmentSuffixUsage(): boolean {
    const officeIPName =
      this.template.Resources.OfficeIPSet?.Properties?.Name;
    const webACLName = this.template.Resources.WAFWebACL?.Properties?.Name;
    const bucketName =
      this.template.Resources.WAFLogsBucket?.Properties?.BucketName;

    return (
      officeIPName?.['Fn::Sub']?.includes('${EnvironmentSuffix}') &&
      webACLName?.['Fn::Sub']?.includes('${EnvironmentSuffix}') &&
      bucketName?.['Fn::Sub']?.includes('${EnvironmentSuffix}')
    );
  }

  validateResourceTags(): boolean {
    const resources = [
      this.template.Resources.OfficeIPSet,
      this.template.Resources.WAFWebACL,
      this.template.Resources.WAFLogsBucket,
    ];
    return resources.every((r) => r?.Properties?.Tags?.length > 0);
  }

  validateLoggingConfiguration(): boolean {
    const config = this.template.Resources.WAFLoggingConfiguration;
    return (
      config?.DependsOn?.includes('WAFLogsBucketPolicy') &&
      config?.Properties?.LoggingFilter !== undefined
    );
  }

  validateManagedRules(): boolean {
    const rules = this.template.Resources.WAFWebACL?.Properties?.Rules;
    const sqliRule = rules?.find((r: any) => r.Name === 'SQLInjectionProtection');
    const badInputsRule = rules?.find(
      (r: any) => r.Name === 'KnownBadInputsProtection'
    );

    return (
      sqliRule?.Statement?.ManagedRuleGroupStatement?.Name ===
        'AWSManagedRulesSQLiRuleSet' &&
      badInputsRule?.Statement?.ManagedRuleGroupStatement?.Name ===
        'AWSManagedRulesKnownBadInputsRuleSet'
    );
  }

  validateMetricsEnabled(): boolean {
    const rules = this.template.Resources.WAFWebACL?.Properties?.Rules;
    return rules?.every(
      (r: any) => r.VisibilityConfig?.CloudWatchMetricsEnabled === true
    );
  }

  validateNoDeletionRetain(): boolean {
    const resources = Object.values(this.template.Resources);
    return resources.every((r: any) => r.DeletionPolicy !== 'Retain');
  }

  runAllValidations(): { passed: boolean; results: Record<string, boolean> } {
    const results = {
      formatVersion: this.validateFormatVersion(),
      parameters: this.validateParameters(),
      resources: this.validateResources(),
      outputs: this.validateOutputs(),
      wafRules: this.validateWAFRules(),
      rateLimit: this.validateRateLimitConfig(),
      geoBlocking: this.validateGeoBlocking(),
      s3Encryption: this.validateS3Encryption(),
      publicAccessBlock: this.validatePublicAccessBlock(),
      ipAllowlist: this.validateIPAllowlist(),
      conditions: this.validateConditions(),
      conditionalAssociation: this.validateConditionalAssociation(),
      environmentSuffix: this.validateEnvironmentSuffixUsage(),
      resourceTags: this.validateResourceTags(),
      loggingConfig: this.validateLoggingConfiguration(),
      managedRules: this.validateManagedRules(),
      metricsEnabled: this.validateMetricsEnabled(),
      noDeletionRetain: this.validateNoDeletionRetain(),
    };

    const passed = Object.values(results).every((v) => v === true);
    return { passed, results };
  }

  getTemplate(): WAFTemplate {
    return this.template;
  }
}

export function loadTemplate(templatePath: string): WAFTemplate {
  const content = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(content);
}

export function validateTemplate(templatePath: string): boolean {
  const validator = new TemplateValidator(templatePath);
  const { passed } = validator.runAllValidations();
  return passed;
}
