import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
}

export class TapStack {
  private template: CloudFormationTemplate;
  private environmentSuffix: string;

  constructor(environmentSuffix?: string) {
    this.environmentSuffix = environmentSuffix || 'dev';
    this.template = this.loadTemplate();
  }

  private loadTemplate(): CloudFormationTemplate {
    const jsonPath = path.join(__dirname, 'TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(jsonContent) as CloudFormationTemplate;
  }

  public getTemplate(): CloudFormationTemplate {
    return this.template;
  }

  public getEnvironmentSuffix(): string {
    return this.environmentSuffix;
  }

  public getResourceCount(): number {
    return Object.keys(this.template.Resources).length;
  }

  public getResourceTypes(): string[] {
    return [
      ...new Set(
        Object.values(this.template.Resources).map((r: any) => r.Type)
      ),
    ];
  }

  public hasResource(resourceName: string): boolean {
    return resourceName in this.template.Resources;
  }

  public getResource(resourceName: string): any {
    return this.template.Resources[resourceName];
  }

  public getOutput(outputName: string): any {
    return this.template.Outputs?.[outputName];
  }

  public getParameter(parameterName: string): any {
    return this.template.Parameters?.[parameterName];
  }

  public validateTemplate(): string[] {
    const errors: string[] = [];

    // Check format version
    if (this.template.AWSTemplateFormatVersion !== '2010-09-09') {
      errors.push('Invalid CloudFormation template version');
    }

    // Check required sections
    if (
      !this.template.Resources ||
      Object.keys(this.template.Resources).length === 0
    ) {
      errors.push('Template must have at least one resource');
    }

    // Check deletion policies
    Object.entries(this.template.Resources).forEach(
      ([name, resource]: [string, any]) => {
        const deletableTypes = [
          'AWS::S3::Bucket',
          'AWS::DynamoDB::Table',
          'AWS::IAM::Role',
          'AWS::Lambda::Function',
          'AWS::ApiGateway::RestApi',
          'AWS::CloudWatch::Dashboard',
          'AWS::CloudWatch::Alarm',
        ];

        if (deletableTypes.includes(resource.Type)) {
          if (resource.DeletionPolicy !== 'Delete') {
            errors.push(`Resource ${name} should have DeletionPolicy: Delete`);
          }
          if (resource.UpdateReplacePolicy !== 'Delete') {
            errors.push(
              `Resource ${name} should have UpdateReplacePolicy: Delete`
            );
          }
        }
      }
    );

    // Check environment suffix usage
    this.checkEnvironmentSuffixUsage(errors);

    return errors;
  }

  private checkEnvironmentSuffixUsage(errors: string[]): void {
    const namedResources = [
      'QuizResultsBucket',
      'QuestionsTable',
      'ResultsTable',
      'QuizGenerationFunction',
      'QuizScoringFunction',
      'QuizGenerationLambdaRole',
      'QuizScoringLambdaRole',
    ];

    namedResources.forEach(resourceName => {
      if (this.hasResource(resourceName)) {
        const resource = this.getResource(resourceName);
        let hasEnvironmentSuffix = false;

        // Check various name properties based on resource type
        if (
          resource.Type === 'AWS::S3::Bucket' &&
          resource.Properties?.BucketName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.BucketName
          );
        } else if (
          resource.Type === 'AWS::DynamoDB::Table' &&
          resource.Properties?.TableName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.TableName
          );
        } else if (
          resource.Type === 'AWS::Lambda::Function' &&
          resource.Properties?.FunctionName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.FunctionName
          );
        } else if (
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.RoleName
        ) {
          hasEnvironmentSuffix = this.checkForEnvironmentSuffix(
            resource.Properties.RoleName
          );
        }

        if (!hasEnvironmentSuffix && resource.Properties) {
          errors.push(
            `Resource ${resourceName} should use EnvironmentSuffix in its name`
          );
        }
      }
    });
  }

  private checkForEnvironmentSuffix(nameProperty: any): boolean {
    if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
      return nameProperty['Fn::Sub'].includes('${EnvironmentSuffix}');
    }
    return false;
  }

  public getStackResources(): {
    s3Buckets: string[];
    dynamoTables: string[];
    lambdaFunctions: string[];
    iamRoles: string[];
    apiGateways: string[];
  } {
    const resources = {
      s3Buckets: [] as string[],
      dynamoTables: [] as string[],
      lambdaFunctions: [] as string[],
      iamRoles: [] as string[],
      apiGateways: [] as string[],
    };

    Object.entries(this.template.Resources).forEach(
      ([name, resource]: [string, any]) => {
        switch (resource.Type) {
          case 'AWS::S3::Bucket':
            resources.s3Buckets.push(name);
            break;
          case 'AWS::DynamoDB::Table':
            resources.dynamoTables.push(name);
            break;
          case 'AWS::Lambda::Function':
            resources.lambdaFunctions.push(name);
            break;
          case 'AWS::IAM::Role':
            resources.iamRoles.push(name);
            break;
          case 'AWS::ApiGateway::RestApi':
            resources.apiGateways.push(name);
            break;
        }
      }
    );

    return resources;
  }

  public getRequiredCapabilities(): string[] {
    const capabilities: string[] = [];
    const hasIamResources = Object.values(this.template.Resources).some(
      (r: any) => r.Type?.startsWith('AWS::IAM')
    );

    if (hasIamResources) {
      capabilities.push('CAPABILITY_IAM');

      // Check for named IAM resources
      const hasNamedIamResources = Object.values(this.template.Resources).some(
        (r: any) =>
          r.Type?.startsWith('AWS::IAM') &&
          (r.Properties?.RoleName || r.Properties?.PolicyName)
      );

      if (hasNamedIamResources) {
        capabilities.push('CAPABILITY_NAMED_IAM');
      }
    }

    return capabilities;
  }

  public getDependencyGraph(): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    Object.entries(this.template.Resources).forEach(
      ([name, resource]: [string, any]) => {
        const deps: string[] = [];

        // Check DependsOn
        if (resource.DependsOn) {
          if (Array.isArray(resource.DependsOn)) {
            deps.push(...resource.DependsOn);
          } else {
            deps.push(resource.DependsOn);
          }
        }

        // Check for Ref dependencies
        const refs = this.findRefs(resource);
        deps.push(...refs);

        // Check for GetAtt dependencies
        const getAtts = this.findGetAtts(resource);
        deps.push(...getAtts);

        if (deps.length > 0) {
          dependencies.set(name, [...new Set(deps)]);
        }
      }
    );

    return dependencies;
  }

  private findRefs(obj: any, refs: string[] = []): string[] {
    if (obj && typeof obj === 'object') {
      if (
        obj.Ref &&
        typeof obj.Ref === 'string' &&
        !obj.Ref.startsWith('AWS::')
      ) {
        refs.push(obj.Ref);
      } else {
        Object.values(obj).forEach(value => this.findRefs(value, refs));
      }
    }
    return refs;
  }

  private findGetAtts(obj: any, getAtts: string[] = []): string[] {
    if (obj && typeof obj === 'object') {
      if (obj['Fn::GetAtt'] && Array.isArray(obj['Fn::GetAtt'])) {
        getAtts.push(obj['Fn::GetAtt'][0]);
      } else {
        Object.values(obj).forEach(value => this.findGetAtts(value, getAtts));
      }
    }
    return getAtts;
  }

  public toJson(): string {
    return JSON.stringify(this.template, null, 2);
  }

  public toYaml(): string {
    return yaml.dump(this.template);
  }
}
