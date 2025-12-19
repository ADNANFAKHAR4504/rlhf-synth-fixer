import * as fs from 'fs';
import * as path from 'path';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

export class FraudDetectionTemplateLoader {
  private template: CloudFormationTemplate;

  constructor() {
    const templatePath = path.join(__dirname, 'fraud-detection-template.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.template = JSON.parse(templateContent);
  }

  getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  getResources(): Record<string, any> {
    return this.template.Resources;
  }

  getResource(resourceName: string): any {
    return this.template.Resources[resourceName];
  }

  getParameters(): Record<string, any> {
    return this.template.Parameters;
  }

  getParameter(parameterName: string): any {
    return this.template.Parameters[parameterName];
  }

  getOutputs(): Record<string, any> {
    return this.template.Outputs;
  }

  getOutput(outputName: string): any {
    return this.template.Outputs[outputName];
  }

  getResourcesByType(type: string): Record<string, any> {
    const resources: Record<string, any> = {};
    Object.entries(this.template.Resources).forEach(([name, resource]) => {
      if (resource.Type === type) {
        resources[name] = resource;
      }
    });
    return resources;
  }

  hasResource(resourceName: string): boolean {
    return resourceName in this.template.Resources;
  }

  hasParameter(parameterName: string): boolean {
    return parameterName in this.template.Parameters;
  }

  hasOutput(outputName: string): boolean {
    return outputName in this.template.Outputs;
  }

  getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  getParameterCount(): number {
    return Object.keys(this.template.Parameters).length;
  }

  getOutputCount(): number {
    return Object.keys(this.template.Outputs).length;
  }

  validateResourceProperty(
    resourceName: string,
    propertyPath: string,
    expectedValue?: any
  ): boolean {
    const resource = this.getResource(resourceName);
    if (!resource) return false;

    const keys = propertyPath.split('.');
    let value = resource;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return false;
    }

    if (expectedValue !== undefined) {
      return JSON.stringify(value) === JSON.stringify(expectedValue);
    }

    return true;
  }

  getResourceProperty(resourceName: string, propertyPath: string): any {
    const resource = this.getResource(resourceName);
    if (!resource) return undefined;

    const keys = propertyPath.split('.');
    let value = resource;
    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }

  hasResourceProperty(resourceName: string, propertyPath: string): boolean {
    return this.getResourceProperty(resourceName, propertyPath) !== undefined;
  }

  getIAMRoles(): Record<string, any> {
    return this.getResourcesByType('AWS::IAM::Role');
  }

  getLambdaFunctions(): Record<string, any> {
    return this.getResourcesByType('AWS::Lambda::Function');
  }

  getDynamoDBTables(): Record<string, any> {
    return this.getResourcesByType('AWS::DynamoDB::Table');
  }

  getS3Buckets(): Record<string, any> {
    return this.getResourcesByType('AWS::S3::Bucket');
  }

  getSNSTopics(): Record<string, any> {
    return this.getResourcesByType('AWS::SNS::Topic');
  }

  getStepFunctionsStateMachines(): Record<string, any> {
    return this.getResourcesByType('AWS::StepFunctions::StateMachine');
  }

  getEventBridgeRules(): Record<string, any> {
    return this.getResourcesByType('AWS::Events::Rule');
  }

  getLogGroups(): Record<string, any> {
    return this.getResourcesByType('AWS::Logs::LogGroup');
  }

  usesEnvironmentSuffix(resourceName: string): boolean {
    const resource = this.getResource(resourceName);
    const resourceStr = JSON.stringify(resource);
    return resourceStr.includes('${EnvironmentSuffix}') || resourceStr.includes('EnvironmentSuffix');
  }

  hasRetainPolicy(): boolean {
    const templateStr = JSON.stringify(this.template);
    return templateStr.includes('RemovalPolicy') || templateStr.includes('Retain');
  }

  hasDeletionProtection(): boolean {
    const templateStr = JSON.stringify(this.template);
    return templateStr.includes('DeletionProtection');
  }
}

export function loadFraudDetectionTemplate(): FraudDetectionTemplateLoader {
  return new FraudDetectionTemplateLoader();
}
