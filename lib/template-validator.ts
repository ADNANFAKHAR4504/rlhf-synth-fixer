import * as fs from 'fs';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Metadata?: any;
  Parameters?: { [key: string]: any };
  Resources: { [key: string]: any };
  Outputs?: { [key: string]: any };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CloudFormationValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    this.template = JSON.parse(templateContent);
  }

  public validateTemplate(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate format version
    if (!this.template.AWSTemplateFormatVersion) {
      result.errors.push('Missing AWSTemplateFormatVersion');
      result.isValid = false;
    } else if (this.template.AWSTemplateFormatVersion !== '2010-09-09') {
      result.errors.push('Invalid AWSTemplateFormatVersion');
      result.isValid = false;
    }

    // Validate resources exist
    if (
      !this.template.Resources ||
      Object.keys(this.template.Resources).length === 0
    ) {
      result.errors.push('Template must contain at least one resource');
      result.isValid = false;
    }

    // Validate resource types
    if (this.template.Resources) {
      this.validateResources(result);
    }

    // Validate security best practices
    this.validateSecurityBestPractices(result);

    // Validate environment suffix usage
    this.validateEnvironmentSuffix(result);

    return result;
  }

  private validateResources(result: ValidationResult): void {
    for (const [name, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      // Validate resource type format
      if (!res.Type || !res.Type.match(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/)) {
        result.errors.push(`Invalid resource type for ${name}: ${res.Type}`);
        result.isValid = false;
      }

      // Validate resource properties exist
      if (!res.Properties) {
        result.errors.push(`Resource ${name} missing Properties section`);
        result.isValid = false;
      }

      // Check for deletion protection issues
      this.checkDeletionPolicies(name, res, result);
    }
  }

  private checkDeletionPolicies(
    name: string,
    resource: any,
    result: ValidationResult
  ): void {
    if (resource.DeletionPolicy === 'Retain') {
      result.warnings.push(
        `Resource ${name} has DeletionPolicy: Retain which may prevent cleanup`
      );
    }

    if (resource.UpdateReplacePolicy === 'Retain') {
      result.warnings.push(
        `Resource ${name} has UpdateReplacePolicy: Retain which may prevent cleanup`
      );
    }
  }

  private validateSecurityBestPractices(result: ValidationResult): void {
    if (!this.template.Resources) {
      return;
    }

    for (const [name, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      // Check S3 bucket encryption
      if (res.Type === 'AWS::S3::Bucket') {
        if (!res.Properties || !res.Properties.BucketEncryption) {
          result.errors.push(
            `S3 bucket ${name} should have encryption enabled`
          );
          result.isValid = false;
        }

        if (!res.Properties || !res.Properties.PublicAccessBlockConfiguration) {
          result.warnings.push(`S3 bucket ${name} should block public access`);
        }
      }

      // Check RDS encryption
      if (res.Type === 'AWS::RDS::DBInstance') {
        if (!res.Properties || !res.Properties.StorageEncrypted) {
          result.errors.push(
            `RDS instance ${name} should have storage encryption enabled`
          );
          result.isValid = false;
        }
      }

      // Check IAM role policies
      if (
        res.Type === 'AWS::IAM::Role' &&
        res.Properties &&
        res.Properties.Policies
      ) {
        this.validateIAMPolicies(name, res.Properties.Policies, result);
      }
    }
  }

  private validateIAMPolicies(
    roleName: string,
    policies: any[],
    result: ValidationResult
  ): void {
    for (const policy of policies) {
      if (policy.PolicyDocument && policy.PolicyDocument.Statement) {
        for (const statement of policy.PolicyDocument.Statement) {
          if (
            statement.Action === '*' ||
            (Array.isArray(statement.Action) && statement.Action.includes('*'))
          ) {
            result.warnings.push(
              `IAM role ${roleName} uses wildcard actions which violates least privilege`
            );
          }
          if (statement.Resource === '*' && statement.Effect === 'Allow') {
            result.warnings.push(
              `IAM role ${roleName} grants access to all resources`
            );
          }
        }
      }
    }
  }

  private validateEnvironmentSuffix(result: ValidationResult): void {
    const hasEnvironmentSuffix =
      this.template.Parameters && this.template.Parameters.EnvironmentSuffix;

    if (!hasEnvironmentSuffix) {
      result.warnings.push(
        'Template should include EnvironmentSuffix parameter for resource naming'
      );
      return;
    }

    // Check if resources use the environment suffix
    let resourcesUsingPrefix = 0;
    const totalResources = Object.keys(this.template.Resources).length;

    for (const [, resource] of Object.entries(this.template.Resources)) {
      const res = resource as any;

      // Check tags for environment suffix usage
      if (res.Properties && res.Properties.Tags) {
        const hasEnvironmentTag = res.Properties.Tags.some(
          (tag: any) =>
            tag.Key === 'Environment' &&
            tag.Value &&
            tag.Value.Ref === 'EnvironmentSuffix'
        );

        if (hasEnvironmentTag) {
          resourcesUsingPrefix++;
        }
      }
    }

    if (resourcesUsingPrefix / totalResources < 0.8) {
      result.warnings.push(
        'Most resources should use EnvironmentSuffix in their naming/tagging'
      );
    }
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  public getResourcesByType(resourceType: string): string[] {
    return Object.entries(this.template.Resources)
      .filter(([, resource]) => (resource as any).Type === resourceType)
      .map(([name]) => name);
  }

  public hasOutput(outputName: string): boolean {
    return !!(this.template.Outputs && this.template.Outputs[outputName]);
  }

  public validateOutputReferences(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!this.template.Outputs) {
      result.warnings.push('Template has no outputs defined');
      return result;
    }

    for (const [outputName, output] of Object.entries(this.template.Outputs)) {
      const out = output as any;

      if (out.Value && out.Value.Ref) {
        const referencedResource = out.Value.Ref;
        if (
          referencedResource !== 'AWS::StackName' &&
          referencedResource !== 'EnvironmentSuffix' &&
          !this.template.Resources[referencedResource]
        ) {
          result.errors.push(
            `Output ${outputName} references non-existent resource: ${referencedResource}`
          );
          result.isValid = false;
        }
      }

      if (out.Value && out.Value['Fn::GetAtt']) {
        const referencedResource = out.Value['Fn::GetAtt'][0];
        if (!this.template.Resources[referencedResource]) {
          result.errors.push(
            `Output ${outputName} references non-existent resource in GetAtt: ${referencedResource}`
          );
          result.isValid = false;
        }
      }
    }

    return result;
  }
}

export function validateTemplateFile(templatePath: string): ValidationResult {
  try {
    const validator = new CloudFormationValidator(templatePath);
    return validator.validateTemplate();
  } catch (error) {
    return {
      isValid: false,
      errors: [(error as Error).message],
      warnings: [],
    };
  }
}

export function getTemplateResources(templatePath: string): string[] {
  try {
    const validator = new CloudFormationValidator(templatePath);
    return Object.keys(validator.getTemplate().Resources);
  } catch (error) {
    return [];
  }
}
