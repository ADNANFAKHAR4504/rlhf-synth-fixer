import * as fs from 'fs';
import * as path from 'path';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

export class TemplateValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    const content = fs.readFileSync(templatePath, 'utf-8');
    this.template = JSON.parse(content);
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public hasParameter(name: string): boolean {
    return name in this.template.Parameters;
  }

  public hasResource(name: string): boolean {
    return name in this.template.Resources;
  }

  public hasOutput(name: string): boolean {
    return name in this.template.Outputs;
  }

  public getResource(name: string): any {
    return this.template.Resources[name];
  }

  public getParameter(name: string): any {
    return this.template.Parameters[name];
  }

  public getOutput(name: string): any {
    return this.template.Outputs[name];
  }

  public getResourceType(resourceName: string): string {
    if (!this.hasResource(resourceName)) {
      throw new Error(`Resource ${resourceName} not found`);
    }
    return this.template.Resources[resourceName].Type;
  }

  public getResourceProperty(resourceName: string, propertyPath: string): any {
    const resource = this.getResource(resourceName);
    if (!resource) {
      throw new Error(`Resource ${resourceName} not found`);
    }

    const parts = propertyPath.split('.');
    let current = resource;

    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        throw new Error(`Property path ${propertyPath} not found in resource ${resourceName}`);
      }
      current = current[part];
    }

    return current;
  }

  public validateZeroTrustSecurity(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const successes: string[] = [];

    // Check VPC
    if (this.hasResource('VPC')) {
      successes.push('VPC resource exists');
    } else {
      errors.push('Missing VPC resource');
    }

    // Check private subnets (3 AZs)
    const privateSubnets = ['PrivateSubnetAZ1', 'PrivateSubnetAZ2', 'PrivateSubnetAZ3'];
    for (const subnet of privateSubnets) {
      if (this.hasResource(subnet)) {
        successes.push(`${subnet} resource exists`);
      } else {
        errors.push(`Missing ${subnet} resource`);
      }
    }

    // Check Network Firewall
    if (this.hasResource('NetworkFirewall')) {
      successes.push('Network Firewall resource exists');
    } else {
      errors.push('Missing Network Firewall resource');
    }

    // Check KMS keys
    const kmsKeys = ['EBSKMSKey', 'S3KMSKey', 'RDSKMSKey'];
    for (const key of kmsKeys) {
      if (this.hasResource(key)) {
        try {
          const rotationEnabled = this.getResourceProperty(key, 'Properties.EnableKeyRotation');
          if (rotationEnabled === true) {
            successes.push(`${key} has rotation enabled`);
          } else {
            errors.push(`${key} does not have rotation enabled`);
          }
        } catch (e) {
          errors.push(`${key} missing EnableKeyRotation property`);
        }
      } else {
        errors.push(`Missing ${key} resource`);
      }
    }

    // Check VPC Flow Logs
    if (this.hasResource('VPCFlowLog')) {
      successes.push('VPC Flow Log resource exists');
    } else {
      errors.push('Missing VPC Flow Log resource');
    }

    // Check AWS Config
    if (this.hasResource('ConfigRecorder')) {
      successes.push('AWS Config Recorder resource exists');
    } else {
      errors.push('Missing AWS Config Recorder resource');
    }

    // Check Config Rules
    const configRules = ['ConfigRuleEncryptedVolumes', 'ConfigRuleIAMPasswordPolicy'];
    for (const rule of configRules) {
      if (this.hasResource(rule)) {
        successes.push(`${rule} resource exists`);
      } else {
        errors.push(`Missing ${rule} resource`);
      }
    }

    // Check GuardDuty (should NOT exist)
    if (this.hasResource('GuardDutyDetector')) {
      errors.push('GuardDuty detector found - this is an account-level resource');
    } else {
      successes.push('GuardDuty detector correctly omitted');
    }

    // Check SSM endpoints
    const ssmEndpoints = ['SSMEndpoint', 'SSMMessagesEndpoint', 'EC2MessagesEndpoint'];
    for (const endpoint of ssmEndpoints) {
      if (this.hasResource(endpoint)) {
        successes.push(`${endpoint} resource exists`);
      } else {
        errors.push(`Missing ${endpoint} resource`);
      }
    }

    // Check IAM role
    if (this.hasResource('EC2InstanceRole')) {
      successes.push('EC2 Instance Role resource exists');
    } else {
      errors.push('Missing EC2 Instance Role resource');
    }

    // Check no Retain deletion policies
    for (const resourceName of Object.keys(this.template.Resources)) {
      const resource = this.template.Resources[resourceName];
      if (resource.DeletionPolicy === 'Retain') {
        errors.push(`Resource ${resourceName} has Retain deletion policy`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      successes,
    };
  }

  public countResourcesByType(type: string): number {
    return Object.values(this.template.Resources).filter((r: any) => r.Type === type).length;
  }

  public listResourceNames(): string[] {
    return Object.keys(this.template.Resources);
  }

  public listParameterNames(): string[] {
    return Object.keys(this.template.Parameters);
  }

  public listOutputNames(): string[] {
    return Object.keys(this.template.Outputs);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  successes: string[];
}

export function loadTemplate(templatePath: string): CloudFormationTemplate {
  const content = fs.readFileSync(templatePath, 'utf-8');
  return JSON.parse(content);
}

export function validateTemplateStructure(template: CloudFormationTemplate): boolean {
  return (
    template.AWSTemplateFormatVersion === '2010-09-09' &&
    !!template.Description &&
    !!template.Parameters &&
    !!template.Resources &&
    !!template.Outputs
  );
}
