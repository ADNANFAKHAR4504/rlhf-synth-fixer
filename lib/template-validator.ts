import * as fs from 'fs';
import * as path from 'path';

/**
 * CloudFormation Template Validator
 * Provides validation and helper functions for EKS CloudFormation templates
 */

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ResourceCount {
  total: number;
  byType: Record<string, number>;
}

export class CloudFormationTemplateValidator {
  private template: any;

  constructor(templatePath: string) {
    const content = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(content);
  }

  /**
   * Validates the template structure and required sections
   */
  validateStructure(): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required top-level sections
    if (!this.template.AWSTemplateFormatVersion) {
      errors.push('Missing AWSTemplateFormatVersion');
    }

    if (!this.template.Description) {
      warnings.push('Missing Description');
    }

    if (!this.template.Resources) {
      errors.push('Missing Resources section');
    } else if (Object.keys(this.template.Resources).length === 0) {
      errors.push('Resources section is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates that resources include environmentSuffix in their names
   */
  validateEnvironmentSuffixUsage(): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.template.Resources) {
      errors.push('No Resources section found');
      return { isValid: false, errors, warnings };
    }

    const resourcesWithNaming: string[] = [];
    const resourcesWithoutSuffix: string[] = [];

    Object.entries(this.template.Resources).forEach(
      ([resourceName, resource]: [string, any]) => {
        const resourceStr = JSON.stringify(resource);

        // Check if resource has naming properties
        const hasNamingProperty =
          /Name|RoleName|BucketName|TableName|ClusterName|GroupName/.test(
            resourceStr
          );

        if (hasNamingProperty) {
          resourcesWithNaming.push(resourceName);

          if (!/EnvironmentSuffix/.test(resourceStr)) {
            resourcesWithoutSuffix.push(resourceName);
          }
        }
      }
    );

    if (resourcesWithoutSuffix.length > 0) {
      warnings.push(
        `Resources without environmentSuffix: ${resourcesWithoutSuffix.join(', ')}`
      );
    }

    const coverage =
      resourcesWithNaming.length > 0
        ? ((resourcesWithNaming.length - resourcesWithoutSuffix.length) /
            resourcesWithNaming.length) *
          100
        : 100;

    if (coverage < 80) {
      errors.push(
        `environmentSuffix coverage is ${coverage.toFixed(1)}%, minimum required is 80%`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates that no Retain deletion policies exist
   */
  validateDeletionPolicies(): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.template.Resources) {
      return { isValid: true, errors, warnings };
    }

    Object.entries(this.template.Resources).forEach(
      ([resourceName, resource]: [string, any]) => {
        if (
          resource.DeletionPolicy === 'Retain' ||
          resource.UpdateReplacePolicy === 'Retain'
        ) {
          errors.push(
            `Resource ${resourceName} has Retain policy (must be destroyable)`
          );
        }
      }
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Counts resources by type
   */
  getResourceCount(): ResourceCount {
    const byType: Record<string, number> = {};
    let total = 0;

    if (this.template.Resources) {
      Object.values(this.template.Resources).forEach((resource: any) => {
        const resourceType = resource.Type || 'Unknown';
        byType[resourceType] = (byType[resourceType] || 0) + 1;
        total++;
      });
    }

    return { total, byType };
  }

  /**
   * Gets all stack outputs
   */
  getOutputs(): string[] {
    if (!this.template.Outputs) {
      return [];
    }
    return Object.keys(this.template.Outputs);
  }

  /**
   * Gets all parameters
   */
  getParameters(): string[] {
    if (!this.template.Parameters) {
      return [];
    }
    return Object.keys(this.template.Parameters);
  }

  /**
   * Validates EKS-specific requirements
   */
  validateEKSRequirements(): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.template.Resources) {
      errors.push('No Resources section found');
      return { isValid: false, errors, warnings };
    }

    // Check for EKS Cluster
    const hasEKSCluster = Object.values(this.template.Resources).some(
      (resource: any) => resource.Type === 'AWS::EKS::Cluster'
    );

    if (!hasEKSCluster) {
      errors.push('No AWS::EKS::Cluster resource found');
    }

    // Check for Node Group
    const hasNodeGroup = Object.values(this.template.Resources).some(
      (resource: any) => resource.Type === 'AWS::EKS::Nodegroup'
    );

    if (!hasNodeGroup) {
      warnings.push('No AWS::EKS::Nodegroup resource found');
    }

    // Check for VPC
    const hasVPC = Object.values(this.template.Resources).some(
      (resource: any) => resource.Type === 'AWS::EC2::VPC'
    );

    if (!hasVPC) {
      warnings.push('No VPC resource found (EKS should have dedicated VPC)');
    }

    // Check for subnets
    const subnetCount = Object.values(this.template.Resources).filter(
      (resource: any) => resource.Type === 'AWS::EC2::Subnet'
    ).length;

    if (subnetCount < 2) {
      warnings.push(
        'EKS clusters should have at least 2 subnets across multiple AZs'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Run all validations
   */
  validateAll(): TemplateValidationResult {
    const results = [
      this.validateStructure(),
      this.validateEnvironmentSuffixUsage(),
      this.validateDeletionPolicies(),
      this.validateEKSRequirements(),
    ];

    const allErrors = results.flatMap((r) => r.errors);
    const allWarnings = results.flatMap((r) => r.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}

/**
 * Helper function to validate a template file
 */
export function validateTemplate(templatePath: string): TemplateValidationResult {
  try {
    const validator = new CloudFormationTemplateValidator(templatePath);
    return validator.validateAll();
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate template: ${error}`],
      warnings: [],
    };
  }
}
