import * as fs from 'fs';
import * as path from 'path';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Metadata?: Record<string, any>;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TemplateLoader {
  private templatePath: string;
  private template: CloudFormationTemplate | null = null;

  constructor(templatePath: string = path.join(__dirname, 'TapStack.json')) {
    this.templatePath = templatePath;
  }

  public loadTemplate(): CloudFormationTemplate {
    if (this.template) {
      return this.template;
    }

    const templateContent = fs.readFileSync(this.templatePath, 'utf8');
    this.template = JSON.parse(templateContent) as CloudFormationTemplate;
    return this.template;
  }

  public getResource(resourceName: string): any {
    const template = this.loadTemplate();
    return template.Resources[resourceName];
  }

  public getResourcesByType(resourceType: string): Record<string, any> {
    const template = this.loadTemplate();
    const resources: Record<string, any> = {};

    Object.entries(template.Resources).forEach(([name, resource]) => {
      if (resource.Type === resourceType) {
        resources[name] = resource;
      }
    });

    return resources;
  }

  public getParameter(parameterName: string): any {
    const template = this.loadTemplate();
    return template.Parameters?.[parameterName];
  }

  public getOutput(outputName: string): any {
    const template = this.loadTemplate();
    return template.Outputs?.[outputName];
  }

  public validateResourceExists(resourceName: string): boolean {
    const template = this.loadTemplate();
    return resourceName in template.Resources;
  }

  public validateParameterExists(parameterName: string): boolean {
    const template = this.loadTemplate();
    return template.Parameters ? parameterName in template.Parameters : false;
  }

  public validateOutputExists(outputName: string): boolean {
    const template = this.loadTemplate();
    return template.Outputs ? outputName in template.Outputs : false;
  }

  public getResourceCount(): number {
    const template = this.loadTemplate();
    return Object.keys(template.Resources).length;
  }

  public getParameterCount(): number {
    const template = this.loadTemplate();
    return template.Parameters ? Object.keys(template.Parameters).length : 0;
  }

  public getOutputCount(): number {
    const template = this.loadTemplate();
    return template.Outputs ? Object.keys(template.Outputs).length : 0;
  }

  public getResourceProperty(resourceName: string, propertyPath: string): any {
    const resource = this.getResource(resourceName);
    if (!resource) {
      return undefined;
    }

    const properties = resource.Properties || {};
    const pathParts = propertyPath.split('.');
    let value: any = properties;

    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  public getResourceTags(resourceName: string): Array<{ Key: string; Value: any }> {
    const properties = this.getResource(resourceName)?.Properties;
    return properties?.Tags || [];
  }

  public hasTag(resourceName: string, tagKey: string): boolean {
    const tags = this.getResourceTags(resourceName);
    return tags.some(tag => tag.Key === tagKey);
  }

  public getTagValue(resourceName: string, tagKey: string): any {
    const tags = this.getResourceTags(resourceName);
    const tag = tags.find(t => t.Key === tagKey);
    return tag?.Value;
  }

  public usesEnvironmentSuffix(resourceName: string): boolean {
    const resource = this.getResource(resourceName);
    const resourceString = JSON.stringify(resource);
    return resourceString.includes('EnvironmentSuffix');
  }
}
