# CDKTF TypeScript Infrastructure Solution

## lib/tap-stack.ts

```typescript
// main.ts - CDKTF Serverless Web Application Infrastructure
// IaC – AWS Nova Model Breaking - Single File Implementation
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as path from 'path';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Object } from '@cdktf/provider-aws/lib/s3-object';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  defaultTags?: { [key: string]: string };
}

export class TapStack extends TerraformStack {
  private readonly resourcePrefix: string;
  private readonly region: string;
  private readonly uniqueSuffix: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Initialize properties with unique suffix
    const timestamp = Date.now();
    this.uniqueSuffix = `${timestamp}`;
    this.resourcePrefix = `${props?.environmentSuffix || 'prod'}-service`;
    this.region = props?.awsRegion || 'us-east-1';

    // Providers
    new AwsProvider(this, 'aws', {
      region: props?.awsRegion || this.region,
      defaultTags: [
        {
          tags: {
            Environment: props?.environmentSuffix || 'Production',
            Project: 'IaC-AWS-Nova-Model-Breaking',
            ManagedBy: 'CDKTF',
            Architecture: 'Serverless',
            ...props?.defaultTags,
          },
        },
      ],
    });

    // S3 Bucket for Lambda deployment packages
    const lambdaBucket = this.createLambdaBucket();

    // DynamoDB Tables
    const userTable = this.createUserTable();
    const sessionTable = this.createSessionTable();

    // IAM Roles and Policies
    const lambdaRole = this.createLambdaExecutionRole(userTable, sessionTable);

    // CloudWatch Log Groups
    const apiLogGroup = this.createApiLogGroup();
    const lambdaLogGroups = this.createLambdaLogGroups();

    // Lambda Functions
    const lambdaFunctions = this.createLambdaFunctions(
      lambdaBucket,
      lambdaRole,
      lambdaLogGroups,
      userTable,
      sessionTable
    );

    // API Gateway
    const api = this.createApiGateway(apiLogGroup);
    const apiResources = this.createApiResources(api);
    const { methods, integrations } = this.createApiMethodsAndIntegrations(
      api,
      apiResources,
      lambdaFunctions
    );
    const deployment = this.createApiDeployment(api, methods, integrations);
    const stage = this.createApiStage(api, deployment, apiLogGroup);

    // Lambda Permissions for API Gateway
    this.createLambdaPermissions(api, lambdaFunctions);

    // Outputs
    this.createOutputs(api, stage, userTable, sessionTable, lambdaFunctions);
  }

  private createLambdaBucket(): S3Bucket {
    return new S3Bucket(this, `${this.resourcePrefix}-lambda-bucket`, {
      bucket: `${this.resourcePrefix}-lambda-packages-${Date.now()}`,
      tags: {
        Name: `${this.resourcePrefix}-lambda-bucket`,
        Purpose: 'Lambda deployment packages',
      },
    });
  }

  private createUserTable(): DynamodbTable {
    return new DynamodbTable(this, `${this.resourcePrefix}-user-table`, {
      name: `${this.resourcePrefix}-users-${this.uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'userId',
      attribute: [
        {
          name: 'userId',
          type: 'S',
        },
        {
          name: 'email',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'email-index',
          hashKey: 'email',
          projectionType: 'ALL',
        },
      ],
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `${this.resourcePrefix}-user-table`,
        Purpose: 'User data storage',
      },
    });
  }

  private createSessionTable(): DynamodbTable {
    return new DynamodbTable(this, `${this.resourcePrefix}-session-table`, {
      name: `${this.resourcePrefix}-sessions-${this.uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'sessionId',
      attribute: [
        {
          name: 'sessionId',
          type: 'S',
        },
        {
          name: 'userId',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'user-sessions-index',
          hashKey: 'userId',
          projectionType: 'ALL',
        },
      ],
      ttl: {
        attributeName: 'expiresAt',
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `${this.resourcePrefix}-session-table`,
        Purpose: 'Session management',
      },
    });
  }

  private createLambdaExecutionRole(
    userTable: DynamodbTable,
    sessionTable: DynamodbTable
  ): IamRole {
    // Lambda execution role
    const lambdaRole = new IamRole(this, `${this.resourcePrefix}-lambda-role`, {
      name: `${this.resourcePrefix}-lambda-execution-role-${this.uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${this.resourcePrefix}-lambda-role`,
        Purpose: 'Lambda execution role',
      },
    });

    // Basic Lambda execution policy
    new IamRolePolicyAttachment(
      this,
      `${this.resourcePrefix}-lambda-basic-policy`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    // DynamoDB access policy
    const dynamodbPolicy = new IamPolicy(
      this,
      `${this.resourcePrefix}-dynamodb-policy`,
      {
        name: `${this.resourcePrefix}-lambda-dynamodb-policy-${this.uniqueSuffix}`,
        description: 'DynamoDB access policy for Lambda functions',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: [
                userTable.arn,
                sessionTable.arn,
                `${userTable.arn}/*`,
                `${sessionTable.arn}/*`,
              ],
            },
          ],
        }),
        tags: {
          Name: `${this.resourcePrefix}-dynamodb-policy`,
          Purpose: 'DynamoDB access for Lambda',
        },
      }
    );

    new IamRolePolicyAttachment(
      this,
      `${this.resourcePrefix}-lambda-dynamodb-policy-attachment`,
      {
        role: lambdaRole.name,
        policyArn: dynamodbPolicy.arn,
      }
    );

    return lambdaRole;
  }

  private createApiLogGroup(): CloudwatchLogGroup {
    return new CloudwatchLogGroup(this, `${this.resourcePrefix}-api-logs`, {
      name: `/aws/apigateway/${this.resourcePrefix}-api-${this.uniqueSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `${this.resourcePrefix}-api-logs`,
        Purpose: 'API Gateway logs',
      },
    });
  }

  private createLambdaLogGroups(): {
    userHandler: CloudwatchLogGroup;
    sessionHandler: CloudwatchLogGroup;
    healthCheck: CloudwatchLogGroup;
  } {
    return {
      userHandler: new CloudwatchLogGroup(
        this,
        `${this.resourcePrefix}-user-handler-logs`,
        {
          name: `/aws/lambda/${this.resourcePrefix}-user-handler-${this.uniqueSuffix}`,
          retentionInDays: 14,
          tags: {
            Name: `${this.resourcePrefix}-user-handler-logs`,
            Purpose: 'User handler Lambda logs',
          },
        }
      ),
      sessionHandler: new CloudwatchLogGroup(
        this,
        `${this.resourcePrefix}-session-handler-logs`,
        {
          name: `/aws/lambda/${this.resourcePrefix}-session-handler-${this.uniqueSuffix}`,
          retentionInDays: 14,
          tags: {
            Name: `${this.resourcePrefix}-session-handler-logs`,
            Purpose: 'Session handler Lambda logs',
          },
        }
      ),
      healthCheck: new CloudwatchLogGroup(
        this,
        `${this.resourcePrefix}-health-check-logs`,
        {
          name: `/aws/lambda/${this.resourcePrefix}-health-check-${this.uniqueSuffix}`,
          retentionInDays: 7,
          tags: {
            Name: `${this.resourcePrefix}-health-check-logs`,
            Purpose: 'Health check Lambda logs',
          },
        }
      ),
    };
  }

  private createLambdaFunctions(
    lambdaBucket: S3Bucket,
    lambdaRole: IamRole,
    logGroups: {
      userHandler: CloudwatchLogGroup;
      sessionHandler: CloudwatchLogGroup;
      healthCheck: CloudwatchLogGroup;
    },
    userTable: DynamodbTable,
    sessionTable: DynamodbTable
  ): {
    userHandler: LambdaFunction;
    sessionHandler: LambdaFunction;
    healthCheck: LambdaFunction;
  } {
    // Lambda Functions using existing placeholder ZIP file
    const userHandler = new LambdaFunction(
      this,
      `${this.resourcePrefix}-user-handler`,
      {
        functionName: `${this.resourcePrefix}-user-handler-${this.uniqueSuffix}`,
        role: lambdaRole.arn,
        runtime: 'nodejs18.x',
        handler: 'lambda-handler.handler',
        filename: path.resolve(__dirname, 'lambda-placeholder.zip'),
        sourceCodeHash: 'placeholder-hash-user',
        timeout: 30,
        memorySize: 128,
        environment: {
          variables: {
            USER_TABLE_NAME: userTable.name,
            SESSION_TABLE_NAME: sessionTable.name,
          },
        },
      }
    );

    const sessionHandler = new LambdaFunction(
      this,
      `${this.resourcePrefix}-session-handler`,
      {
        functionName: `${this.resourcePrefix}-session-handler-${this.uniqueSuffix}`,
        role: lambdaRole.arn,
        runtime: 'nodejs18.x',
        handler: 'lambda-handler.handler',
        filename: path.resolve(__dirname, 'lambda-placeholder.zip'),
        sourceCodeHash: 'placeholder-hash-session',
        timeout: 30,
        memorySize: 128,
        environment: {
          variables: {
            USER_TABLE_NAME: userTable.name,
            SESSION_TABLE_NAME: sessionTable.name,
          },
        },
      }
    );

    const healthCheck = new LambdaFunction(
      this,
      `${this.resourcePrefix}-health-check`,
      {
        functionName: `${this.resourcePrefix}-health-check-${this.uniqueSuffix}`,
        role: lambdaRole.arn,
        runtime: 'nodejs18.x',
        handler: 'lambda-handler.handler',
        filename: path.resolve(__dirname, 'lambda-placeholder.zip'),
        sourceCodeHash: 'placeholder-hash-health',
        timeout: 10,
        memorySize: 128,
      }
    );

    return { userHandler, sessionHandler, healthCheck };
  }

  private createApiGateway(logGroup: CloudwatchLogGroup): ApiGatewayRestApi {
    return new ApiGatewayRestApi(this, `${this.resourcePrefix}-api`, {
      name: `${this.resourcePrefix}-api-${this.uniqueSuffix}`,
      description: 'Serverless Web Application API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `${this.resourcePrefix}-api`,
        Purpose: 'REST API Gateway',
      },
    });
  }

  private createApiResources(api: ApiGatewayRestApi): {
    users: ApiGatewayResource;
    userById: ApiGatewayResource;
    sessions: ApiGatewayResource;
    sessionById: ApiGatewayResource;
    health: ApiGatewayResource;
  } {
    const users = new ApiGatewayResource(
      this,
      `${this.resourcePrefix}-users-resource`,
      {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'users',
      }
    );

    const userById = new ApiGatewayResource(
      this,
      `${this.resourcePrefix}-user-by-id-resource`,
      {
        restApiId: api.id,
        parentId: users.id,
        pathPart: '{userId}',
      }
    );

    const sessions = new ApiGatewayResource(
      this,
      `${this.resourcePrefix}-sessions-resource`,
      {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'sessions',
      }
    );

    const sessionById = new ApiGatewayResource(
      this,
      `${this.resourcePrefix}-session-by-id-resource`,
      {
        restApiId: api.id,
        parentId: sessions.id,
        pathPart: '{sessionId}',
      }
    );

    const health = new ApiGatewayResource(
      this,
      `${this.resourcePrefix}-health-resource`,
      {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'health',
      }
    );

    return { users, userById, sessions, sessionById, health };
  }

  private createApiMethodsAndIntegrations(
    api: ApiGatewayRestApi,
    resources: {
      users: ApiGatewayResource;
      userById: ApiGatewayResource;
      sessions: ApiGatewayResource;
      sessionById: ApiGatewayResource;
      health: ApiGatewayResource;
    },
    lambdaFunctions: {
      userHandler: LambdaFunction;
      sessionHandler: LambdaFunction;
      healthCheck: LambdaFunction;
    }
  ): { methods: ApiGatewayMethod[]; integrations: ApiGatewayIntegration[] } {
    const methods: ApiGatewayMethod[] = [];
    const integrations: ApiGatewayIntegration[] = [];

    // Users endpoints
    const { method: createUserMethod, integration: createUserIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.users,
        'POST',
        lambdaFunctions.userHandler,
        `${this.resourcePrefix}-create-user`
      );
    methods.push(createUserMethod);
    integrations.push(createUserIntegration);

    const { method: getUsersMethod, integration: getUsersIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.users,
        'GET',
        lambdaFunctions.userHandler,
        `${this.resourcePrefix}-get-users`
      );
    methods.push(getUsersMethod);
    integrations.push(getUsersIntegration);

    const { method: getUserMethod, integration: getUserIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.userById,
        'GET',
        lambdaFunctions.userHandler,
        `${this.resourcePrefix}-get-user`
      );
    methods.push(getUserMethod);
    integrations.push(getUserIntegration);

    const { method: updateUserMethod, integration: updateUserIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.userById,
        'PUT',
        lambdaFunctions.userHandler,
        `${this.resourcePrefix}-update-user`
      );
    methods.push(updateUserMethod);
    integrations.push(updateUserIntegration);

    const { method: deleteUserMethod, integration: deleteUserIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.userById,
        'DELETE',
        lambdaFunctions.userHandler,
        `${this.resourcePrefix}-delete-user`
      );
    methods.push(deleteUserMethod);
    integrations.push(deleteUserIntegration);

    // Sessions endpoints
    const {
      method: createSessionMethod,
      integration: createSessionIntegration,
    } = this.createApiMethodWithIntegration(
      api,
      resources.sessions,
      'POST',
      lambdaFunctions.sessionHandler,
      `${this.resourcePrefix}-create-session`
    );
    methods.push(createSessionMethod);
    integrations.push(createSessionIntegration);

    const { method: getSessionMethod, integration: getSessionIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.sessionById,
        'GET',
        lambdaFunctions.sessionHandler,
        `${this.resourcePrefix}-get-session`
      );
    methods.push(getSessionMethod);
    integrations.push(getSessionIntegration);

    const {
      method: deleteSessionMethod,
      integration: deleteSessionIntegration,
    } = this.createApiMethodWithIntegration(
      api,
      resources.sessionById,
      'DELETE',
      lambdaFunctions.sessionHandler,
      `${this.resourcePrefix}-delete-session`
    );
    methods.push(deleteSessionMethod);
    integrations.push(deleteSessionIntegration);

    // Health check endpoint
    const { method: healthCheckMethod, integration: healthCheckIntegration } =
      this.createApiMethodWithIntegration(
        api,
        resources.health,
        'GET',
        lambdaFunctions.healthCheck,
        `${this.resourcePrefix}-health-check`
      );
    methods.push(healthCheckMethod);
    integrations.push(healthCheckIntegration);

    return { methods, integrations };
  }

  private createApiMethodWithIntegration(
    api: ApiGatewayRestApi,
    resource: ApiGatewayResource,
    httpMethod: string,
    lambdaFunction: LambdaFunction,
    id: string
  ): { method: ApiGatewayMethod; integration: ApiGatewayIntegration } {
    const method = new ApiGatewayMethod(this, `${id}-method`, {
      restApiId: api.id,
      resourceId: resource.id,
      httpMethod: httpMethod,
      authorization: 'NONE',
    });

    const integration = new ApiGatewayIntegration(this, `${id}-integration`, {
      restApiId: api.id,
      resourceId: resource.id,
      httpMethod: method.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFunction.invokeArn,
      dependsOn: [method],
    });

    return { method, integration };
  }

  private createApiDeployment(
    api: ApiGatewayRestApi,
    methods: ApiGatewayMethod[],
    integrations: ApiGatewayIntegration[]
  ): ApiGatewayDeployment {
    return new ApiGatewayDeployment(
      this,
      `${this.resourcePrefix}-api-deployment`,
      {
        restApiId: api.id,
        dependsOn: [...methods, ...integrations],
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );
  }

  private createApiStage(
    api: ApiGatewayRestApi,
    deployment: ApiGatewayDeployment,
    logGroup: CloudwatchLogGroup
  ): ApiGatewayStage {
    const stage = new ApiGatewayStage(
      this,
      `${this.resourcePrefix}-api-stage`,
      {
        restApiId: api.id,
        deploymentId: deployment.id,
        stageName: 'prod',
        accessLogSettings: {
          destinationArn: logGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            caller: '$context.identity.caller',
            user: '$context.identity.user',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
        tags: {
          Name: `${this.resourcePrefix}-api-stage`,
          Environment: 'Production',
        },
      }
    );

    // Configure method settings for throttling and monitoring
    new ApiGatewayMethodSettings(
      this,
      `${this.resourcePrefix}-api-method-settings`,
      {
        restApiId: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          metricsEnabled: true,
          loggingLevel: 'INFO',
          dataTraceEnabled: true,
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 2000,
        },
      }
    );

    return stage;
  }

  private createLambdaPermissions(
    api: ApiGatewayRestApi,
    lambdaFunctions: {
      userHandler: LambdaFunction;
      sessionHandler: LambdaFunction;
      healthCheck: LambdaFunction;
    }
  ): void {
    // User handler permissions
    new LambdaPermission(
      this,
      `${this.resourcePrefix}-user-handler-permission`,
      {
        statementId: 'AllowExecutionFromAPIGateway',
        action: 'lambda:InvokeFunction',
        functionName: lambdaFunctions.userHandler.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
      }
    );

    // Session handler permissions
    new LambdaPermission(
      this,
      `${this.resourcePrefix}-session-handler-permission`,
      {
        statementId: 'AllowExecutionFromAPIGateway',
        action: 'lambda:InvokeFunction',
        functionName: lambdaFunctions.sessionHandler.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
      }
    );

    // Health check permissions
    new LambdaPermission(
      this,
      `${this.resourcePrefix}-health-check-permission`,
      {
        statementId: 'AllowExecutionFromAPIGateway',
        action: 'lambda:InvokeFunction',
        functionName: lambdaFunctions.healthCheck.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
      }
    );
  }

  private createOutputs(
    api: ApiGatewayRestApi,
    stage: ApiGatewayStage,
    userTable: DynamodbTable,
    sessionTable: DynamodbTable,
    lambdaFunctions: {
      userHandler: LambdaFunction;
      sessionHandler: LambdaFunction;
      healthCheck: LambdaFunction;
    }
  ): void {
    new TerraformOutput(this, 'api_gateway_url', {
      value: `https://${api.id}.execute-api.${this.region}.amazonaws.com/${stage.stageName}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'user_table_name', {
      value: userTable.name,
      description: 'DynamoDB Users table name',
    });

    new TerraformOutput(this, 'session_table_name', {
      value: sessionTable.name,
      description: 'DynamoDB Sessions table name',
    });

    new TerraformOutput(this, 'lambda_function_names', {
      value: {
        userHandler: lambdaFunctions.userHandler.functionName,
        sessionHandler: lambdaFunctions.sessionHandler.functionName,
        healthCheck: lambdaFunctions.healthCheck.functionName,
      },
      description: 'Lambda function names',
    });

    new TerraformOutput(this, 'health_check_url', {
      value: `https://${api.id}.execute-api.${this.region}.amazonaws.com/${stage.stageName}/health`,
      description: 'Health check endpoint for deployment validation',
    });
  }

  // Lambda function code implementations
  private getUserHandlerCode(): string {
    return `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const { httpMethod, pathParameters, body } = event;
    const userTableName = process.env.USER_TABLE_NAME;
    
    try {
        switch (httpMethod) {
            case 'GET':
                if (pathParameters && pathParameters.userId) {
                    return await getUser(userTableName, pathParameters.userId);
                } else {
                    return await getUsers(userTableName);
                }
            case 'POST':
                return await createUser(userTableName, JSON.parse(body || '{}'));
            case 'PUT':
                return await updateUser(userTableName, pathParameters.userId, JSON.parse(body || '{}'));
            case 'DELETE':
                return await deleteUser(userTableName, pathParameters.userId);
            default:
                return {
                    statusCode: 405,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function getUser(tableName, userId) {
    const params = {
        TableName: tableName,
        Key: { userId }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'User not found' })
        };
    }
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item)
    };
}

async function getUsers(tableName) {
    const params = {
        TableName: tableName,
        Limit: 50
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: result.Items, count: result.Count })
    };
}

async function createUser(tableName, userData) {
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    
    const user = {
        userId,
        ...userData,
        createdAt: timestamp,
        updatedAt: timestamp
    };
    
    const params = {
        TableName: tableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)'
    };
    
    await dynamodb.put(params).promise();
    
    return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };
}

async function updateUser(tableName, userId, updateData) {
    const timestamp = new Date().toISOString();
    updateData.updatedAt = timestamp;
    
    const updateExpression = 'SET ' + Object.keys(updateData).map(key => '#' + key + ' = :' + key).join(', ');
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach(key => {
        expressionAttributeNames['#' + key] = key;
        expressionAttributeValues[':' + key] = updateData[key];
    });
    
    const params = {
        TableName: tableName,
        Key: { userId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Attributes)
    };
}

async function deleteUser(tableName, userId) {
    const params = {
        TableName: tableName,
        Key: { userId },
        ReturnValues: 'ALL_OLD'
    };
    
    const result = await dynamodb.delete(params).promise();
    
    if (!result.Attributes) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'User not found' })
        };
    }
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'User deleted successfully', user: result.Attributes })
    };
}
`;
  }

  private getSessionHandlerCode(): string {
    return `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const { httpMethod, pathParameters, body } = event;
    const sessionTableName = process.env.SESSION_TABLE_NAME;
    
    try {
        switch (httpMethod) {
            case 'GET':
                return await getSession(sessionTableName, pathParameters.sessionId);
            case 'POST':
                return await createSession(sessionTableName, JSON.parse(body || '{}'));
            case 'DELETE':
                return await deleteSession(sessionTableName, pathParameters.sessionId);
            default:
                return {
                    statusCode: 405,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function getSession(tableName, sessionId) {
    const params = {
        TableName: tableName,
        Key: { sessionId }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Session not found' })
        };
    }
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.Item)
    };
}

async function createSession(tableName, sessionData) {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
    
    const session = {
        sessionId,
        ...sessionData,
        createdAt: timestamp,
        expiresAt
    };
    
    const params = {
        TableName: tableName,
        Item: session,
        ConditionExpression: 'attribute_not_exists(sessionId)'
    };
    
    await dynamodb.put(params).promise();
    
    return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
    };
}

async function deleteSession(tableName, sessionId) {
    const params = {
        TableName: tableName,
        Key: { sessionId },
        ReturnValues: 'ALL_OLD'
    };
    
    const result = await dynamodb.delete(params).promise();
    
    if (!result.Attributes) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Session not found' })
        };
    }
    
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Session deleted successfully', session: result.Attributes })
    };
}
`;
  }

  private getHealthCheckCode(): string {
    return `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Health check requested');
    
    const userTableName = process.env.USER_TABLE_NAME;
    const sessionTableName = process.env.SESSION_TABLE_NAME;
    
    try {
        // Test DynamoDB connectivity
        const userTableResult = await dynamodb.describeTable({ TableName: userTableName }).promise();
        const sessionTableResult = await dynamodb.describeTable({ TableName: sessionTableName }).promise();
        
        // Test write/read capability
        const testKey = 'health_check_' + Date.now();
        const testData = {
            userId: testKey,
            email: 'healthcheck@example.com',
            name: 'Health Check Test',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Write test data
        await dynamodb.put({
            TableName: userTableName,
            Item: testData
        }).promise();
        
        // Read test data
        const readResult = await dynamodb.get({
            TableName: userTableName,
            Key: { userId: testKey }
        }).promise();
        
        // Clean up test data
        await dynamodb.delete({
            TableName: userTableName,
            Key: { userId: testKey }
        }).promise();
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                dynamodb: {
                    userTable: {
                        status: userTableResult.Table.TableStatus,
                        itemCount: userTableResult.Table.ItemCount || 0
                    },
                    sessionTable: {
                        status: sessionTableResult.Table.TableStatus,
                        itemCount: sessionTableResult.Table.ItemCount || 0
                    }
                },
                dataAccess: {
                    writeTest: 'success',
                    readTest: readResult.Item ? 'success' : 'failed'
                }
            },
            environment: {
                region: process.env.AWS_REGION || 'us-east-1',
                functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
                version: process.env.AWS_LAMBDA_FUNCTION_VERSION || '1'
            }
        };
        
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(healthStatus)
        };
        
    } catch (error) {
        console.error('Health check failed:', error);
        
        const errorStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                code: error.code
            },
            environment: {
                region: process.env.AWS_REGION || 'us-east-1',
                functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
                version: process.env.AWS_LAMBDA_FUNCTION_VERSION || '1'
            }
        };
        
        return {
            statusCode: 503,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(errorStatus)
        };
    }
};
`;
  }
}
```
