import * as fs from 'fs';
import * as path from 'path';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
  Metadata?: Record<string, any>;
}

export class TemplateLoader {
  private templatePath: string;
  private template: CloudFormationTemplate | null = null;

  constructor(templateName: string = 'TapStack.json') {
    this.templatePath = path.join(__dirname, templateName);
  }

  /**
   * Load the CloudFormation template from file
   */
  loadTemplate(): CloudFormationTemplate {
    if (this.template) {
      return this.template;
    }

    const templateContent = fs.readFileSync(this.templatePath, 'utf8');
    this.template = JSON.parse(templateContent) as CloudFormationTemplate;

    return this.template;
  }

  /**
   * Get all resource types in the template
   */
  getResourceTypes(): string[] {
    const template = this.loadTemplate();
    return Object.values(template.Resources).map(
      (resource: any) => resource.Type
    );
  }

  /**
   * Get resources by type
   */
  getResourcesByType(resourceType: string): Record<string, any> {
    const template = this.loadTemplate();
    const resources: Record<string, any> = {};

    Object.entries(template.Resources).forEach(
      ([key, value]: [string, any]) => {
        if (value.Type === resourceType) {
          resources[key] = value;
        }
      }
    );

    return resources;
  }

  /**
   * Validate that all resource names include environment suffix
   */
  validateEnvironmentSuffix(): { valid: boolean; violations: string[] } {
    const template = this.loadTemplate();
    const violations: string[] = [];

    const resourceTypesRequiringNaming = [
      'AWS::EC2::SecurityGroup',
      'AWS::RDS::DBSubnetGroup',
      'AWS::RDS::DBCluster',
      'AWS::RDS::DBInstance',
      'AWS::DMS::ReplicationSubnetGroup',
      'AWS::DMS::ReplicationInstance',
      'AWS::DMS::Endpoint',
      'AWS::DMS::ReplicationTask',
      'AWS::SNS::Topic',
      'AWS::CloudWatch::Alarm',
      'AWS::CloudWatch::Dashboard',
      'AWS::Route53::HostedZone',
      'AWS::Route53::RecordSet',
    ];

    Object.entries(template.Resources).forEach(
      ([key, resource]: [string, any]) => {
        if (resourceTypesRequiringNaming.includes(resource.Type)) {
          const resourceString = JSON.stringify(resource);
          if (!resourceString.includes('${EnvironmentSuffix}')) {
            violations.push(`${key} (${resource.Type})`);
          }
        }
      }
    );

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate deletion policies
   */
  validateDeletionPolicies(): { valid: boolean; violations: string[] } {
    const template = this.loadTemplate();
    const violations: string[] = [];

    const resourcesRequiringSnapshot = [
      'AWS::RDS::DBCluster',
      'AWS::RDS::DBInstance',
      'AWS::DMS::ReplicationInstance',
    ];

    Object.entries(template.Resources).forEach(
      ([key, resource]: [string, any]) => {
        if (resourcesRequiringSnapshot.includes(resource.Type)) {
          if (
            !resource.DeletionPolicy ||
            resource.DeletionPolicy !== 'Snapshot'
          ) {
            violations.push(`${key}: Missing or incorrect DeletionPolicy`);
          }
          if (
            !resource.UpdateReplacePolicy ||
            resource.UpdateReplacePolicy !== 'Snapshot'
          ) {
            violations.push(`${key}: Missing or incorrect UpdateReplacePolicy`);
          }
        }
      }
    );

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate security best practices
   */
  validateSecurity(): { valid: boolean; violations: string[] } {
    const template = this.loadTemplate();
    const violations: string[] = [];

    // Check passwords have NoEcho
    const sensitiveParams = ['SourceDbPassword', 'TargetDbPassword'];
    sensitiveParams.forEach(param => {
      if (template.Parameters[param]) {
        if (!template.Parameters[param].NoEcho) {
          violations.push(`${param}: Missing NoEcho`);
        }
      }
    });

    // Check Aurora encryption
    const auroraClusters = this.getResourcesByType('AWS::RDS::DBCluster');
    Object.entries(auroraClusters).forEach(([key, resource]: [string, any]) => {
      if (!resource.Properties.StorageEncrypted) {
        violations.push(`${key}: Storage encryption not enabled`);
      }
    });

    // Check DMS endpoints use SSL
    const dmsEndpoints = this.getResourcesByType('AWS::DMS::Endpoint');
    Object.entries(dmsEndpoints).forEach(([key, resource]: [string, any]) => {
      if (resource.Properties.SslMode !== 'require') {
        violations.push(`${key}: SSL not required`);
      }
    });

    // Check instances not publicly accessible
    const rdsInstances = this.getResourcesByType('AWS::RDS::DBInstance');
    Object.entries(rdsInstances).forEach(([key, resource]: [string, any]) => {
      if (resource.Properties.PubliclyAccessible === true) {
        violations.push(`${key}: Publicly accessible`);
      }
    });

    const replicationInstances = this.getResourcesByType(
      'AWS::DMS::ReplicationInstance'
    );
    Object.entries(replicationInstances).forEach(
      ([key, resource]: [string, any]) => {
        if (resource.Properties.PubliclyAccessible === true) {
          violations.push(`${key}: Publicly accessible`);
        }
      }
    );

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate outputs have exports
   * Note: URL outputs may not have exports as they're informational only
   */
  validateOutputs(): { valid: boolean; violations: string[] } {
    const template = this.loadTemplate();
    const violations: string[] = [];

    // URL outputs are informational and don't need exports
    const urlOutputs = ['CloudWatchDashboardUrl'];

    Object.entries(template.Outputs).forEach(([key, output]: [string, any]) => {
      // Skip URL outputs
      if (urlOutputs.includes(key)) {
        return;
      }

      if (!output.Export) {
        violations.push(`${key}: Missing Export`);
      } else if (!output.Export.Name || !output.Export.Name['Fn::Sub']) {
        violations.push(`${key}: Export missing Fn::Sub for stack name`);
      }
    });

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Count resources by type
   */
  countResourcesByType(resourceType: string): number {
    return Object.keys(this.getResourcesByType(resourceType)).length;
  }

  /**
   * Get all parameters
   */
  getParameters(): Record<string, any> {
    const template = this.loadTemplate();
    return template.Parameters;
  }

  /**
   * Get all outputs
   */
  getOutputs(): Record<string, any> {
    const template = this.loadTemplate();
    return template.Outputs;
  }

  /**
   * Validate template structure
   */
  validateStructure(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const template = this.loadTemplate();

      if (!template.AWSTemplateFormatVersion) {
        errors.push('Missing AWSTemplateFormatVersion');
      }

      if (!template.Description) {
        errors.push('Missing Description');
      }

      if (!template.Parameters || typeof template.Parameters !== 'object') {
        errors.push('Missing or invalid Parameters section');
      }

      if (!template.Resources || typeof template.Resources !== 'object') {
        errors.push('Missing or invalid Resources section');
      }

      if (!template.Outputs || typeof template.Outputs !== 'object') {
        errors.push('Missing or invalid Outputs section');
      }

      if (Object.keys(template.Resources).length === 0) {
        errors.push('No resources defined');
      }
    } catch (error) {
      errors.push(`Failed to validate structure: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default TemplateLoader;
