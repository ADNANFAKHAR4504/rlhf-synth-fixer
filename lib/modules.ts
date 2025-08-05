import { Construct } from 'constructs';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaAlias } from '@cdktf/provider-aws/lib/lambda-alias';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
// Corrected import paths and names for API Gateway V2
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
// Corrected import path and name for CodeDeploy
import { CodedeployApp } from '@cdktf/provider-aws/lib/codedeploy-app';
import { CodedeployDeploymentGroup } from '@cdktf/provider-aws/lib/codedeploy-deployment-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
// Terraform's Fn for filebase64sha256
import { Fn } from 'cdktf';

// 1. Correct the CommonTags type to be a generic string map.
// This resolves the "Index signature for type 'string' is missing" errors.
export type CommonTags = { [key: string]: string };

// Lambda module configuration
export interface LambdaModuleConfig {
  functionName: string;
  runtime: string;
  handler: string;
  filename: string;
  description?: string;
  timeout?: number;
  memorySize?: number;
  environmentVariables?: { [key: string]: string };
  tags: CommonTags;
}

// API Gateway module configuration
export interface ApiGatewayModuleConfig {
  apiName: string;
  description?: string;
  stageName: string;
  tags: CommonTags;
}

// Route configuration
export interface RouteConfig {
  routeKey: string;
  lambdaAlias: LambdaAlias;
  lambdaFunction: LambdaFunction;
}

// Canary deployment configuration
export interface CanaryDeploymentConfig {
  applicationName: string;
  deploymentGroupName: string;
  lambdaAlias: LambdaAlias;
  lambdaFunction: LambdaFunction;
  tags: CommonTags;
}

/**
 * Reusable Lambda Function Module with Versioning and Alias
 */
export class LambdaModule extends Construct {
  public readonly lambdaFunction: LambdaFunction;
  public readonly lambdaAlias: LambdaAlias;
  public readonly executionRole: IamRole;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: LambdaModuleConfig) {
    super(scope, id);

    // Create CloudWatch Log Group
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${config.functionName}`,
      retentionInDays: 14,
      tags: config.tags,
    });

    // Create IAM execution role for Lambda
    this.executionRole = this.createLambdaExecutionRole(
      config.functionName,
      config.tags
    );

    // Create Lambda function
    this.lambdaFunction = new LambdaFunction(this, 'function', {
      functionName: config.functionName,
      role: this.executionRole.arn,
      handler: config.handler,
      runtime: config.runtime,
      filename: config.filename,
      // Use Fn.filebase64sha256 for sourceCodeHash
      sourceCodeHash: Fn.filebase64sha256(config.filename),
      description:
        config.description || `Lambda function: ${config.functionName}`,
      timeout: config.timeout || 30,
      memorySize: config.memorySize || 128,
      environment: config.environmentVariables
        ? {
            variables: config.environmentVariables,
          }
        : undefined,
      tags: config.tags,
      publish: true, // Enable versioning
    });

    // Create Lambda alias for canary deployments
    this.lambdaAlias = new LambdaAlias(this, 'alias', {
      name: 'live',
      functionName: this.lambdaFunction.functionName,
      functionVersion: this.lambdaFunction.version,
      description: `Live alias for ${config.functionName}`,
    });
  }

  private createLambdaExecutionRole(
    functionName: string,
    tags: CommonTags
  ): IamRole {
    // Lambda assume role policy
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['lambda.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    // Create execution role
    const executionRole = new IamRole(this, 'execution-role', {
      name: `${functionName}-execution-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: tags,
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'basic-execution-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Create custom policy for CloudWatch Logs
    const logsPolicy = new DataAwsIamPolicyDocument(this, 'logs-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: [
            `arn:aws:logs:us-east-1:*:log-group:/aws/lambda/${functionName}:*`,
          ],
        },
      ],
    });

    const customLogsPolicy = new IamPolicy(this, 'custom-logs-policy', {
      name: `${functionName}-logs-policy`,
      policy: logsPolicy.json,
      tags: tags,
    });

    new IamRolePolicyAttachment(this, 'custom-logs-policy-attachment', {
      role: executionRole.name,
      policyArn: customLogsPolicy.arn,
    });

    return executionRole;
  }
}

/**
 * Reusable API Gateway Module
 */
export class ApiGatewayModule extends Construct {
  public readonly api: Apigatewayv2Api;
  public readonly stage: Apigatewayv2Stage;
  public readonly executionRole: IamRole;

  constructor(scope: Construct, id: string, config: ApiGatewayModuleConfig) {
    super(scope, id);

    // Create API Gateway execution role
    this.executionRole = this.createApiGatewayExecutionRole(
      config.apiName,
      config.tags
    );

    // Create HTTP API Gateway
    this.api = new Apigatewayv2Api(this, 'api', {
      name: config.apiName,
      description: config.description || `HTTP API: ${config.apiName}`,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowCredentials: false,
        allowHeaders: [
          'content-type',
          'x-amz-date',
          'authorization',
          'x-api-key',
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowOrigins: ['*'],
        maxAge: 86400,
      },
      tags: config.tags,
    });

    // Create stage
    this.stage = new Apigatewayv2Stage(this, 'stage', {
      apiId: this.api.id,
      name: config.stageName,
      description: `${config.stageName} stage for ${config.apiName}`,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: this.createLogGroup(config.apiName, config.tags).arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },
      tags: config.tags,
    });
  }

  private createLogGroup(
    apiName: string,
    tags: CommonTags
  ): CloudwatchLogGroup {
    return new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/${apiName}`,
      retentionInDays: 14,
      tags: tags,
    });
  }

  private createApiGatewayExecutionRole(
    apiName: string,
    tags: CommonTags
  ): IamRole {
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'api-assume-role-policy',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['apigateway.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    const executionRole = new IamRole(this, 'api-execution-role', {
      name: `${apiName}-api-execution-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: tags,
    });

    // Policy for CloudWatch Logs
    const logsPolicy = new DataAwsIamPolicyDocument(this, 'api-logs-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['arn:aws:logs:*:*:*'],
        },
      ],
    });

    const customLogsPolicy = new IamPolicy(this, 'api-custom-logs-policy', {
      name: `${apiName}-api-logs-policy`,
      policy: logsPolicy.json,
      tags: tags,
    });

    new IamRolePolicyAttachment(this, 'api-logs-policy-attachment', {
      role: executionRole.name,
      policyArn: customLogsPolicy.arn,
    });

    return executionRole;
  }

  /**
   * Add a route to the API Gateway that integrates with a Lambda alias
   */
  public addRoute(routeConfig: RouteConfig): void {
    // Create Lambda permission for API Gateway
    new LambdaPermission(
      this,
      `permission-${routeConfig.routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        statementId: `AllowExecutionFromAPIGateway-${routeConfig.routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
        action: 'lambda:InvokeFunction',
        functionName: routeConfig.lambdaAlias.functionName, // Corrected to use the alias functionName
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${this.api.executionArn}/*/*`,
      }
    );

    // Create integration with Lambda alias
    const integration = new Apigatewayv2Integration(
      this,
      `integration-${routeConfig.routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        apiId: this.api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: routeConfig.lambdaAlias.arn, // Correctly point to the alias ARN
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
      }
    );

    // Create route
    new Apigatewayv2Route(
      this,
      `route-${routeConfig.routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        apiId: this.api.id,
        routeKey: routeConfig.routeKey,
        target: `integrations/${integration.id}`,
      }
    );
  }
}

/**
 * Canary Deployment Module using AWS CodeDeploy
 */
export class CanaryDeploymentModule extends Construct {
  public readonly application: CodedeployApp;
  public readonly deploymentGroup: CodedeployDeploymentGroup;
  public readonly serviceRole: IamRole;

  constructor(scope: Construct, id: string, config: CanaryDeploymentConfig) {
    super(scope, id);

    // Create CodeDeploy service role
    this.serviceRole = this.createCodeDeployServiceRole(
      config.applicationName,
      config.tags
    );

    // Create CodeDeploy application
    this.application = new CodedeployApp(this, 'application', {
      name: config.applicationName,
      computePlatform: 'Lambda',
      tags: config.tags,
    });

    // Create deployment group with a simplified canary configuration
    this.deploymentGroup = new CodedeployDeploymentGroup(
      this,
      'deployment-group',
      {
        appName: this.application.name,
        deploymentGroupName: config.deploymentGroupName,
        serviceRoleArn: this.serviceRole.arn,
        deploymentConfigName: 'CodeDeployDefault.Lambda10PercentEvery5Minutes', // This is key to canary

        deploymentStyle: {
          deploymentOption: 'WITH_TRAFFIC_CONTROL',
          deploymentType: 'BLUE_GREEN',
        },

        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
        },

        tags: config.tags,
      }
    );
  }

  private createCodeDeployServiceRole(
    applicationName: string,
    tags: CommonTags
  ): IamRole {
    // ... (rest of the code for creating the service role)
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'codedeploy-assume-role-policy',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['codedeploy.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    const serviceRole = new IamRole(this, 'codedeploy-service-role', {
      name: `${applicationName}-codedeploy-service-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: tags,
    });

    new IamRolePolicyAttachment(this, 'codedeploy-lambda-policy', {
      role: serviceRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda',
    });

    return serviceRole;
  }
}

/**
 * Utility function to create common tags
 */
export function createCommonTags(environment: string = 'dev'): CommonTags {
  return {
    Environment: environment,
    Project: 'ServerlessMicroservices',
    Cloud: 'AWS',
  };
}
