import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads and validates the CloudFormation template
 */
export class TemplateLoader {
  private template: any;
  private readonly templatePath: string;

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(__dirname, 'TapStack.json');
    this.template = this.loadTemplate();
  }

  /**
   * Loads the template from disk
   */
  private loadTemplate(): any {
    try {
      const content = fs.readFileSync(this.templatePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load template: ${error}`);
    }
  }

  /**
   * Gets the template object
   */
  public getTemplate(): any {
    return this.template;
  }

  /**
   * Gets template version
   */
  public getVersion(): string {
    return this.template.AWSTemplateFormatVersion || '';
  }

  /**
   * Gets template description
   */
  public getDescription(): string {
    return this.template.Description || '';
  }

  /**
   * Gets all parameters
   */
  public getParameters(): Record<string, any> {
    return this.template.Parameters || {};
  }

  /**
   * Gets a specific parameter
   */
  public getParameter(name: string): any {
    return this.template.Parameters?.[name];
  }

  /**
   * Gets all resources
   */
  public getResources(): Record<string, any> {
    return this.template.Resources || {};
  }

  /**
   * Gets a specific resource
   */
  public getResource(name: string): any {
    return this.template.Resources?.[name];
  }

  /**
   * Gets all outputs
   */
  public getOutputs(): Record<string, any> {
    return this.template.Outputs || {};
  }

  /**
   * Gets a specific output
   */
  public getOutput(name: string): any {
    return this.template.Outputs?.[name];
  }

  /**
   * Gets all conditions
   */
  public getConditions(): Record<string, any> {
    return this.template.Conditions || {};
  }

  /**
   * Gets a specific condition
   */
  public getCondition(name: string): any {
    return this.template.Conditions?.[name];
  }

  /**
   * Validates that the template has required sections
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.template.AWSTemplateFormatVersion) {
      errors.push('Missing AWSTemplateFormatVersion');
    }

    if (!this.template.Description) {
      errors.push('Missing Description');
    }

    if (!this.template.Resources || Object.keys(this.template.Resources).length === 0) {
      errors.push('No resources defined');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets resource count by type
   */
  public getResourceCountByType(type: string): number {
    const resources = this.getResources();
    return Object.values(resources).filter((r: any) => r.Type === type).length;
  }

  /**
   * Checks if a resource exists
   */
  public hasResource(name: string): boolean {
    return this.template.Resources?.[name] !== undefined;
  }

  /**
   * Checks if a parameter exists
   */
  public hasParameter(name: string): boolean {
    return this.template.Parameters?.[name] !== undefined;
  }

  /**
   * Checks if an output exists
   */
  public hasOutput(name: string): boolean {
    return this.template.Outputs?.[name] !== undefined;
  }

  /**
   * Checks if a condition exists
   */
  public hasCondition(name: string): boolean {
    return this.template.Conditions?.[name] !== undefined;
  }

  /**
   * Gets all resource names
   */
  public getResourceNames(): string[] {
    return Object.keys(this.getResources());
  }

  /**
   * Gets all parameter names
   */
  public getParameterNames(): string[] {
    return Object.keys(this.getParameters());
  }

  /**
   * Gets all output names
   */
  public getOutputNames(): string[] {
    return Object.keys(this.getOutputs());
  }

  /**
   * Gets all condition names
   */
  public getConditionNames(): string[] {
    return Object.keys(this.getConditions());
  }
}

/**
 * Factory function to create a template loader
 */
export function loadTemplate(templatePath?: string): TemplateLoader {
  return new TemplateLoader(templatePath);
}
