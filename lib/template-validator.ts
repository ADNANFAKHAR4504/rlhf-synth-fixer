/**
 * CloudFormation Template Validator
 * Provides validation utilities for CloudFormation templates
 */

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TemplateValidator {
  /**
   * Validates that a template has the required CloudFormation structure
   */
  static validateStructure(template: CloudFormationTemplate): boolean {
    return (
      template.AWSTemplateFormatVersion === '2010-09-09' &&
      typeof template.Description === 'string' &&
      template.Description.length > 0 &&
      typeof template.Resources === 'object' &&
      Object.keys(template.Resources).length > 0
    );
  }

  /**
   * Validates that all resources use EnvironmentSuffix parameter
   */
  static validateEnvironmentSuffix(template: CloudFormationTemplate): boolean {
    if (!template.Parameters?.EnvironmentSuffix) {
      return false;
    }

    const resources = Object.values(template.Resources);
    const hasResourcesWithSuffix = resources.some((resource: any) => {
      const resourceStr = JSON.stringify(resource);
      return resourceStr.includes('EnvironmentSuffix');
    });

    return hasResourcesWithSuffix;
  }

  /**
   * Validates that no resources have Retain deletion policy
   */
  static validateNoRetainPolicy(template: CloudFormationTemplate): boolean {
    return Object.values(template.Resources).every(
      (resource: any) =>
        resource.DeletionPolicy !== 'Retain' &&
        resource.UpdateReplacePolicy !== 'Retain'
    );
  }

  /**
   * Validates that template has required outputs
   */
  static validateOutputs(
    template: CloudFormationTemplate,
    requiredOutputs: string[]
  ): boolean {
    if (!template.Outputs) {
      return false;
    }

    return requiredOutputs.every(output => output in template.Outputs!);
  }

  /**
   * Validates WAF configuration
   */
  static validateWAFConfiguration(template: CloudFormationTemplate): boolean {
    const resources = template.Resources;

    // Check for WAF Web ACL
    const hasWebACL = Object.values(resources).some(
      (resource: any) => resource.Type === 'AWS::WAFv2::WebACL'
    );

    // Check for WAF logging configuration
    const hasLogging = Object.values(resources).some(
      (resource: any) => resource.Type === 'AWS::WAFv2::LoggingConfiguration'
    );

    // Check for S3 bucket for logs
    const hasLogBucket = Object.values(resources).some(
      (resource: any) =>
        resource.Type === 'AWS::S3::Bucket' &&
        JSON.stringify(resource).includes('waf') &&
        JSON.stringify(resource).includes('log')
    );

    return hasWebACL && hasLogging && hasLogBucket;
  }

  /**
   * Validates network infrastructure for ALB
   */
  static validateNetworkInfrastructure(
    template: CloudFormationTemplate
  ): boolean {
    const resources = template.Resources;

    const hasVPC = Object.values(resources).some(
      (resource: any) => resource.Type === 'AWS::EC2::VPC'
    );

    const hasSubnets = Object.values(resources).some(
      (resource: any) => resource.Type === 'AWS::EC2::Subnet'
    );

    const hasIGW = Object.values(resources).some(
      (resource: any) => resource.Type === 'AWS::EC2::InternetGateway'
    );

    const hasALB = Object.values(resources).some(
      (resource: any) =>
        resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    );

    return hasVPC && hasSubnets && hasIGW && hasALB;
  }

  /**
   * Validates S3 bucket security configuration
   */
  static validateS3Security(template: CloudFormationTemplate): boolean {
    const resources = Object.values(template.Resources);
    const s3Buckets = resources.filter(
      (r: any) => r.Type === 'AWS::S3::Bucket'
    );

    return s3Buckets.every((bucket: any) => {
      const hasEncryption = bucket.Properties?.BucketEncryption !== undefined;
      const hasPublicAccessBlock =
        bucket.Properties?.PublicAccessBlockConfiguration !== undefined;
      return hasEncryption && hasPublicAccessBlock;
    });
  }

  /**
   * Counts WAF rules in the template
   */
  static countWAFRules(template: CloudFormationTemplate): number {
    const resources = Object.values(template.Resources);
    const webACL = resources.find((r: any) => r.Type === 'AWS::WAFv2::WebACL');

    if (!webACL || !(webACL as any).Properties?.Rules) {
      return 0;
    }

    return (webACL as any).Properties.Rules.length;
  }

  /**
   * Validates that required WAF rule types exist
   */
  static validateWAFRules(template: CloudFormationTemplate): {
    hasRateLimit: boolean;
    hasGeoBlock: boolean;
    hasSQLInjection: boolean;
    hasIPAllowlist: boolean;
  } {
    const resources = Object.values(template.Resources);
    const webACL = resources.find((r: any) => r.Type === 'AWS::WAFv2::WebACL');

    if (!webACL || !(webACL as any).Properties?.Rules) {
      return {
        hasRateLimit: false,
        hasGeoBlock: false,
        hasSQLInjection: false,
        hasIPAllowlist: false,
      };
    }

    const rules = (webACL as any).Properties.Rules;

    return {
      hasRateLimit: rules.some(
        (r: any) => r.Statement?.RateBasedStatement !== undefined
      ),
      hasGeoBlock: rules.some(
        (r: any) => r.Statement?.GeoMatchStatement !== undefined
      ),
      hasSQLInjection: rules.some(
        (r: any) => r.Statement?.ManagedRuleGroupStatement !== undefined
      ),
      hasIPAllowlist: rules.some(
        (r: any) => r.Statement?.IPSetReferenceStatement !== undefined
      ),
    };
  }
}
