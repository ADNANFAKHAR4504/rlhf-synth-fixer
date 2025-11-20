import { readFileSync } from 'fs';
import { join } from 'path';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TemplateValidator {
  private template: CloudFormationTemplate;

  constructor(templatePath: string) {
    const content = readFileSync(templatePath, 'utf-8');
    this.template = JSON.parse(content);
  }

  public validateStructure(): boolean {
    if (!this.template.AWSTemplateFormatVersion) {
      throw new Error('Missing AWSTemplateFormatVersion');
    }

    if (!this.template.Resources || Object.keys(this.template.Resources).length === 0) {
      throw new Error('Missing or empty Resources section');
    }

    return true;
  }

  public getResource(logicalId: string): any {
    if (!this.template.Resources[logicalId]) {
      throw new Error(`Resource ${logicalId} not found`);
    }
    return this.template.Resources[logicalId];
  }

  public getResourcesByType(resourceType: string): any[] {
    return Object.entries(this.template.Resources)
      .filter(([, resource]) => resource.Type === resourceType)
      .map(([id, resource]) => ({ id, ...resource }));
  }

  public validateEnvironmentSuffix(): string[] {
    const nameableTypes = [
      'AWS::EC2::VPC',
      'AWS::ECS::Cluster',
      'AWS::DynamoDB::Table',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::SNS::Topic',
      'AWS::Logs::LogGroup'
    ];

    const missing: string[] = [];

    for (const [id, resource] of Object.entries(this.template.Resources)) {
      if (nameableTypes.includes(resource.Type)) {
        const resourceStr = JSON.stringify(resource);
        if (!resourceStr.includes('EnvironmentSuffix')) {
          missing.push(id);
        }
      }
    }

    return missing;
  }

  public findRetainPolicies(): string[] {
    const retainResources: string[] = [];

    for (const [id, resource] of Object.entries(this.template.Resources)) {
      if (resource.DeletionPolicy === 'Retain' ||
          resource.UpdateReplacePolicy === 'Retain' ||
          resource.Properties?.DeletionProtectionEnabled === true) {
        retainResources.push(id);
      }
    }

    return retainResources;
  }

  public countResources(): number {
    return Object.keys(this.template.Resources).length;
  }

  public countOutputs(): number {
    return this.template.Outputs ? Object.keys(this.template.Outputs).length : 0;
  }

  public hasParameter(name: string): boolean {
    return this.template.Parameters ? name in this.template.Parameters : false;
  }

  public hasOutput(name: string): boolean {
    return this.template.Outputs ? name in this.template.Outputs : false;
  }

  public getEnvironmentConfig(environment: string): any {
    if (!this.template.Mappings?.EnvironmentConfig) {
      throw new Error('Missing EnvironmentConfig mapping');
    }

    if (!this.template.Mappings.EnvironmentConfig[environment]) {
      throw new Error(`Environment ${environment} not found`);
    }

    return this.template.Mappings.EnvironmentConfig[environment];
  }
}

export function loadAndValidateTemplate(templatePath: string): TemplateValidator {
  return new TemplateValidator(templatePath);
}
