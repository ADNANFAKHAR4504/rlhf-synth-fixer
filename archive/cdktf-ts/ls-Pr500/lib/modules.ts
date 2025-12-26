import { Construct } from 'constructs';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaAlias } from '@cdktf/provider-aws/lib/lambda-alias';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
// Import API Gateway V1 (REST API) - LocalStack Community compatible
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
// Corrected import path and name for CodeDeploy
import { CodedeployApp } from '@cdktf/provider-aws/lib/codedeploy-app';
import { CodedeployDeploymentGroup } from '@cdktf/provider-aws/lib/codedeploy-deployment-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { CodedeployDeploymentConfig } from '@cdktf/provider-aws/lib/codedeploy-deployment-config'; // ADD THIS IMPORT
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
  filename?: string;
  s3Bucket?: string;
  s3Key?: string;
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
  enabled?: boolean; // Allow disabling for LocalStack
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
      description:
        config.description || `Lambda function: ${config.functionName}`,
      timeout: config.timeout || 30,
      memorySize: config.memorySize || 128,
      environment: config.environmentVariables
        ? { variables: config.environmentVariables }
        : undefined,
      tags: config.tags,
      publish: true,

      // Choose based on config
      ...(config.s3Bucket && config.s3Key
        ? {
            s3Bucket: config.s3Bucket,
            s3Key: config.s3Key,
          }
        : {
            filename: config.filename!,
            sourceCodeHash: Fn.filebase64sha256(config.filename!),
          }),
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
 * Reusable API Gateway Module (REST API - LocalStack compatible)
 */
export class ApiGatewayModule extends Construct {
  public readonly api: ApiGatewayRestApi;
  public deployment!: ApiGatewayDeployment;
  public stage!: ApiGatewayStage;
  public readonly executionRole: IamRole;
  private routes: { [key: string]: ApiGatewayResource } = {};

  constructor(scope: Construct, id: string, config: ApiGatewayModuleConfig) {
    super(scope, id);

    // Create API Gateway execution role
    this.executionRole = this.createApiGatewayExecutionRole(
      config.apiName,
      config.tags
    );

    // Create REST API Gateway (LocalStack compatible)
    this.api = new ApiGatewayRestApi(this, 'api', {
      name: config.apiName,
      description: config.description || `REST API: ${config.apiName}`,
      tags: config.tags,
    });

    // Note: Deployment and Stage will be created after routes are added
    // We'll create them in addRoute or expose a finalize method
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
   * Add a route to the REST API Gateway that integrates with a Lambda alias
   * Route format: "GET /v1/function1" -> resource: /v1/function1, method: GET
   */
  public addRoute(routeConfig: RouteConfig): void {
    const routeKey = routeConfig.routeKey; // e.g., "GET /v1/function1"
    const [httpMethod, ...pathParts] = routeKey.split(' ');
    const path = pathParts.join(' '); // e.g., "/v1/function1"

    // Parse path to create resources (e.g., /v1/function1 -> /v1 -> /function1)
    const pathSegments = path.split('/').filter(s => s);
    let parentId = this.api.rootResourceId;
    let currentPath = '';

    // Create nested resources for each path segment
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const resourceKey = currentPath;

      if (!this.routes[resourceKey]) {
        this.routes[resourceKey] = new ApiGatewayResource(
          this,
          `resource${currentPath.replace(/\//g, '-')}`,
          {
            restApiId: this.api.id,
            parentId: parentId,
            pathPart: segment,
          }
        );
      }

      parentId = this.routes[resourceKey].id;
    }

    const resource = this.routes[currentPath];

    // Create Lambda permission for API Gateway
    new LambdaPermission(
      this,
      `permission-${routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        statementId: `AllowExecutionFromAPIGateway-${routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
        action: 'lambda:InvokeFunction',
        functionName: routeConfig.lambdaAlias.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${this.api.executionArn}/*/${httpMethod}${currentPath}`,
      }
    );

    // Create method
    const method = new ApiGatewayMethod(
      this,
      `method-${routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: httpMethod,
        authorization: 'NONE',
      }
    );

    // Create Lambda integration
    new ApiGatewayIntegration(
      this,
      `integration-${routeKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
      {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        integrationHttpMethod: 'POST', // Lambda always uses POST
        type: 'AWS_PROXY',
        uri: routeConfig.lambdaAlias.invokeArn,
      }
    );
  }

  /**
   * Finalize the API by creating deployment and stage
   * Must be called after all routes are added
   */
  public finalize(stageName: string, tags: CommonTags): void {
    // Create deployment (triggers after all methods are created)
    this.deployment = new ApiGatewayDeployment(this, 'deployment', {
      restApiId: this.api.id,
      // Trigger redeployment when routes change
      triggers: {
        redeployment: Date.now().toString(),
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Create stage
    this.stage = new ApiGatewayStage(this, 'stage', {
      restApiId: this.api.id,
      deploymentId: this.deployment.id,
      stageName: stageName,
      accessLogSettings: {
        destinationArn: this.createLogGroup(this.api.name, tags).arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          resourcePath: '$context.resourcePath',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },
      tags: tags,
    });
  }
}

/**
 * Canary Deployment Module using AWS CodeDeploy
 * NOTE: CodeDeploy requires LocalStack Pro - disabled for Community Edition
 */
export class CanaryDeploymentModule extends Construct {
  public readonly application?: CodedeployApp;
  public readonly deploymentGroup?: CodedeployDeploymentGroup;
  public readonly serviceRole?: IamRole;
  public readonly deploymentConfig?: CodedeployDeploymentConfig;
  public readonly enabled: boolean;

  constructor(scope: Construct, id: string, config: CanaryDeploymentConfig) {
    super(scope, id);

    this.enabled = config.enabled ?? false;

    // Skip CodeDeploy resources if disabled (LocalStack Community)
    if (!this.enabled) {
      console.log(`CodeDeploy disabled for ${config.applicationName} (LocalStack Community Edition)`);
      return;
    }

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

    // Create a custom deployment configuration
    this.deploymentConfig = new CodedeployDeploymentConfig(
      this,
      'deployment-config',
      {
        deploymentConfigName: `${config.applicationName}-canary-10-percent-5-minutes`,
        computePlatform: 'Lambda',
        trafficRoutingConfig: {
          type: 'TimeBasedCanary',
          timeBasedCanary: {
            interval: 5,
            percentage: 10,
          },
        },
      }
    );

    // Create deployment group
    this.deploymentGroup = new CodedeployDeploymentGroup(
      this,
      'deployment-group',
      {
        appName: this.application.name,
        deploymentGroupName: config.deploymentGroupName,
        serviceRoleArn: this.serviceRole.arn,
        deploymentConfigName: this.deploymentConfig.deploymentConfigName,
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
