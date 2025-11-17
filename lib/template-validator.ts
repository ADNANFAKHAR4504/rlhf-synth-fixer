/**
 * template-validator.ts
 *
 * Utility functions for CloudFormation template validation.
 * Provides programmatic access to template properties and validation logic.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Metadata?: any;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TemplateValidator {
  private template: CloudFormationTemplate;
  private templatePath: string;

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(__dirname, 'TapStack.json');
    this.template = this.loadTemplate();
  }

  /**
   * Load the CloudFormation template from file
   */
  private loadTemplate(): CloudFormationTemplate {
    const content = fs.readFileSync(this.templatePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Get the template object
   */
  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  /**
   * Validate template has required sections
   */
  public validateStructure(): boolean {
    return !!(
      this.template.AWSTemplateFormatVersion &&
      this.template.Description &&
      this.template.Resources &&
      Object.keys(this.template.Resources).length > 0
    );
  }

  /**
   * Get all resource types in the template
   */
  public getResourceTypes(): string[] {
    return Object.values(this.template.Resources).map((r: any) => r.Type);
  }

  /**
   * Get resource by logical ID
   */
  public getResource(logicalId: string): any {
    return this.template.Resources[logicalId];
  }

  /**
   * Check if resource exists
   */
  public hasResource(logicalId: string): boolean {
    return logicalId in this.template.Resources;
  }

  /**
   * Get all resources of a specific type
   */
  public getResourcesByType(resourceType: string): Record<string, any> {
    const resources: Record<string, any> = {};
    Object.entries(this.template.Resources).forEach(([id, resource]: [string, any]) => {
      if (resource.Type === resourceType) {
        resources[id] = resource;
      }
    });
    return resources;
  }

  /**
   * Validate parameter exists and has correct type
   */
  public validateParameter(name: string, expectedType: string): boolean {
    if (!this.template.Parameters || !(name in this.template.Parameters)) {
      return false;
    }
    return this.template.Parameters[name].Type === expectedType;
  }

  /**
   * Get all parameters
   */
  public getParameters(): Record<string, any> {
    return this.template.Parameters || {};
  }

  /**
   * Get all outputs
   */
  public getOutputs(): Record<string, any> {
    return this.template.Outputs || {};
  }

  /**
   * Validate output exists
   */
  public hasOutput(name: string): boolean {
    return !!(this.template.Outputs && name in this.template.Outputs);
  }

  /**
   * Check if resource has DependsOn attribute
   */
  public hasDependency(logicalId: string, dependsOn: string): boolean {
    const resource = this.getResource(logicalId);
    if (!resource || !resource.DependsOn) {
      return false;
    }

    if (Array.isArray(resource.DependsOn)) {
      return resource.DependsOn.includes(dependsOn);
    }

    return resource.DependsOn === dependsOn;
  }

  /**
   * Validate no circular dependencies exist
   */
  public validateNCircularDependencies(): boolean {
    const resources = this.template.Resources;
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (resourceId: string): boolean => {
      if (!visited.has(resourceId)) {
        visited.add(resourceId);
        recursionStack.add(resourceId);

        const resource = resources[resourceId];
        if (resource.DependsOn) {
          const dependencies = Array.isArray(resource.DependsOn)
            ? resource.DependsOn
            : [resource.DependsOn];

          for (const dep of dependencies) {
            if (!visited.has(dep) && hasCycle(dep)) {
              return true;
            } else if (recursionStack.has(dep)) {
              return true;
            }
          }
        }
      }

      recursionStack.delete(resourceId);
      return false;
    };

    for (const resourceId of Object.keys(resources)) {
      if (hasCycle(resourceId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if resource uses intrinsic functions instead of hardcoded values
   */
  public usesIntrinsicFunction(logicalId: string, property: string[]): boolean {
    const resource = this.getResource(logicalId);
    if (!resource) return false;

    let value: any = resource.Properties;
    for (const prop of property) {
      value = value?.[prop];
      if (!value) return false;
    }

    // Check if value is an intrinsic function
    return !!(
      value['Ref'] ||
      value['Fn::GetAtt'] ||
      value['Fn::Sub'] ||
      value['Fn::Join'] ||
      value['Fn::Select'] ||
      value['Fn::ImportValue']
    );
  }

  /**
   * Validate all resources include EnvironmentSuffix in their names
   */
  public validateEnvironmentSuffixUsage(): boolean {
    const resources = this.template.Resources;
    const nameProperties = ['TableName', 'RoleName', 'ManagedPolicyName', 'FunctionName'];

    for (const [id, resource] of Object.entries(resources) as [string, any][]) {
      for (const prop of nameProperties) {
        if (resource.Properties?.[prop]) {
          const value = resource.Properties[prop];
          if (value['Fn::Sub'] && !value['Fn::Sub'].includes('${EnvironmentSuffix}')) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Validate resource is destroyable (no Retain policies)
   */
  public validateDestroyable(logicalId: string): boolean {
    const resource = this.getResource(logicalId);
    if (!resource) return false;

    return resource.DeletionPolicy !== 'Retain' && resource.UpdateReplacePolicy !== 'Retain';
  }

  /**
   * Get resource count
   */
  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  /**
   * Get parameter count
   */
  public getParameterCount(): number {
    return Object.keys(this.template.Parameters || {}).length;
  }

  /**
   * Get output count
   */
  public getOutputCount(): number {
    return Object.keys(this.template.Outputs || {}).length;
  }
}

/**
 * Default export for convenience
 */
export default TemplateValidator;
