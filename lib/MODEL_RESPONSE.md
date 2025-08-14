# Serverless Application Infrastructure

I'll help you create a serverless application infrastructure using AWS Lambda, API Gateway, and DynamoDB with Pulumi TypeScript. Here's the complete infrastructure code:

## tap-stack.ts
```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the serverless application infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { CloudWatchStack } from './cloudwatch-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the serverless application.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create DynamoDB stack
    const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create Lambda stack
    const lambdaStack = new LambdaStack("tap-lambda", {
      environmentSuffix: environmentSuffix,
      tableName: dynamoDBStack.tableName,
      tags: tags,
    }, { parent: this });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack("tap-api", {
      environmentSuffix: environmentSuffix,
      lambdaFunction: lambdaStack.lambdaFunction,
      tags: tags,
    }, { parent: this });

    // Create CloudWatch stack
    const cloudWatchStack = new CloudWatchStack("tap-cloudwatch", {
      environmentSuffix: environmentSuffix,
      lambdaFunctionName: lambdaStack.lambdaFunctionName,
      apiGatewayName: apiGatewayStack.apiGatewayName,
      tags: tags,
    }, { parent: this });

    this.apiEndpoint = apiGatewayStack.apiEndpoint;
    this.tableName = dynamoDBStack.tableName;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      tableName: this.tableName,
    });
  }
}
```

## dynamodb-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly tableName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(name: string, args: DynamoDBStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:dynamodb:DynamoDBStack', name, args, opts);

    // Create KMS key for DynamoDB encryption
    const kmsKey = new aws.kms.Key(`tap-dynamodb-kms-${args.environmentSuffix}`, {
      description: "KMS key for DynamoDB encryption",
      tags: args.tags,
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`tap-dynamodb-kms-alias-${args.environmentSuffix}`, {
      name: `alias/tap-dynamodb-${args.environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // Create DynamoDB table with encryption
    const table = new aws.dynamodb.Table(`tap-table-${args.environmentSuffix}`, {
      name: `tap-serverless-${args.environmentSuffix}`,
      billingMode: "PAY_PER_REQUEST",
      hashKey: "id",
      attributes: [
        {
          name: "id",
          type: "S",
        },
      ],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKey.arn,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: args.tags,
    }, { parent: this });

    this.tableName = table.name;
    this.tableArn = table.arn;

    this.registerOutputs({
      tableName: this.tableName,
      tableArn: this.tableArn,
    });
  }
}
```

## lambda-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tableName: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  constructor(name: string, args: LambdaStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:lambda:LambdaStack', name, args, opts);

    // Create IAM role for Lambda with least privilege
    const lambdaRole = new aws.iam.Role(`tap-lambda-role-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          },
        ],
      }),
      tags: args.tags,
    }, { parent: this });

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(`tap-lambda-basic-${args.environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    }, { parent: this });

    // Create custom policy for DynamoDB access
    const dynamodbPolicy = new aws.iam.RolePolicy(`tap-lambda-dynamodb-policy-${args.environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([args.tableName]).apply(([tableName]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:BatchGetItem",
              "dynamodb:BatchWriteItem",
              "dynamodb:ExecuteStatement",
              "dynamodb:ExecuteTransaction",
            ],
            Resource: `arn:aws:dynamodb:us-east-1:*:table/${tableName}`,
          },
        ],
      })),
    }, { parent: this });

    // Lambda function code
    const lambdaCode = `
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ExecuteStatementCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.TABLE_NAME;
    
    try {
        const httpMethod = event.httpMethod;
        const path = event.path;
        
        switch (httpMethod) {
            case 'GET':
                if (event.pathParameters && event.pathParameters.id) {
                    // Get specific item
                    const id = event.pathParameters.id;
                    const getResult = await ddbDocClient.send(new GetCommand({
                        TableName: tableName,
                        Key: { id: id }
                    }));
                    
                    return {
                        statusCode: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        body: JSON.stringify(getResult.Item || {})
                    };
                } else {
                    // List all items using PartiQL
                    const partiQLResult = await ddbDocClient.send(new ExecuteStatementCommand({
                        Statement: \`SELECT * FROM "\${tableName}"\`
                    }));
                    
                    return {
                        statusCode: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        body: JSON.stringify(partiQLResult.Items || [])
                    };
                }
                
            case 'POST':
                const body = JSON.parse(event.body || '{}');
                const item = {
                    id: body.id || new Date().getTime().toString(),
                    ...body,
                    createdAt: new Date().toISOString()
                };
                
                await ddbDocClient.send(new PutCommand({
                    TableName: tableName,
                    Item: item
                }));
                
                return {
                    statusCode: 201,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    body: JSON.stringify(item)
                };
                
            default:
                return {
                    statusCode: 405,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    body: JSON.stringify({ message: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message 
            })
        };
    }
};
`;

    // Create Lambda function
    this.lambdaFunction = new aws.lambda.Function(`tap-lambda-${args.environmentSuffix}`, {
      runtime: aws.lambda.Runtime.NodeJS22dX,
      code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(lambdaCode),
        "package.json": new pulumi.asset.StringAsset(JSON.stringify({
          name: "tap-serverless-lambda",
          version: "1.0.0",
          dependencies: {
            "@aws-sdk/client-dynamodb": "^3.0.0",
            "@aws-sdk/lib-dynamodb": "^3.0.0"
          }
        }))
      }),
      handler: "index.handler",
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          TABLE_NAME: args.tableName,
          NODE_ENV: "production",
        },
      },
      tags: args.tags,
    }, { parent: this, dependsOn: [lambdaBasicPolicy, dynamodbPolicy] });

    this.lambdaFunctionName = this.lambdaFunction.name;

    this.registerOutputs({
      lambdaFunctionName: this.lambdaFunctionName,
    });
  }
}
```

## api-gateway-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  lambdaFunction: aws.lambda.Function;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly apiGatewayName: pulumi.Output<string>;

  constructor(name: string, args: ApiGatewayStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(`tap-api-${args.environmentSuffix}`, {
      name: `tap-serverless-api-${args.environmentSuffix}`,
      description: "Serverless API Gateway for TAP application",
      endpointConfiguration: {
        types: "REGIONAL",
      },
      tags: args.tags,
    }, { parent: this });

    // Create resource for /items
    const itemsResource = new aws.apigateway.Resource(`tap-items-resource-${args.environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: "items",
    }, { parent: this });

    // Create resource for /items/{id}
    const itemResource = new aws.apigateway.Resource(`tap-item-resource-${args.environmentSuffix}`, {
      restApi: api.id,
      parentId: itemsResource.id,
      pathPart: "{id}",
    }, { parent: this });

    // Create request validator for input validation
    const requestValidator = new aws.apigateway.RequestValidator(`tap-validator-${args.environmentSuffix}`, {
      restApi: api.id,
      name: "request-validator",
      validateRequestBody: true,
      validateRequestParameters: true,
    }, { parent: this });

    // Create model for request validation
    const requestModel = new aws.apigateway.Model(`tap-model-${args.environmentSuffix}`, {
      restApi: api.id,
      name: "CreateItemModel",
      contentType: "application/json",
      schema: JSON.stringify({
        "$schema": "http://json-schema.org/draft-04/schema#",
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" }
        },
        required: ["name"]
      }),
    }, { parent: this });

    // GET method for /items (list all)
    const getItemsMethod = new aws.apigateway.Method(`tap-get-items-method-${args.environmentSuffix}`, {
      restApi: api.id,
      resourceId: itemsResource.id,
      httpMethod: "GET",
      authorization: "NONE",
    }, { parent: this });

    // POST method for /items (create item)
    const postItemsMethod = new aws.apigateway.Method(`tap-post-items-method-${args.environmentSuffix}`, {
      restApi: api.id,
      resourceId: itemsResource.id,
      httpMethod: "POST",
      authorization: "NONE",
      requestValidatorId: requestValidator.id,
      requestModels: {
        "application/json": requestModel.name,
      },
    }, { parent: this });

    // GET method for /items/{id} (get specific item)
    const getItemMethod = new aws.apigateway.Method(`tap-get-item-method-${args.environmentSuffix}`, {
      restApi: api.id,
      resourceId: itemResource.id,
      httpMethod: "GET",
      authorization: "NONE",
      requestParameters: {
        "method.request.path.id": true,
      },
    }, { parent: this });

    // Lambda permission for API Gateway
    const lambdaPermission = new aws.lambda.Permission(`tap-lambda-permission-${args.environmentSuffix}`, {
      statementId: "AllowExecutionFromAPIGateway",
      action: "lambda:InvokeFunction",
      function: args.lambdaFunction.name,
      principal: "apigateway.amazonaws.com",
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, { parent: this });

    // Integration for GET /items
    const getItemsIntegration = new aws.apigateway.Integration(`tap-get-items-integration-${args.environmentSuffix}`, {
      restApi: api.id,
      resourceId: itemsResource.id,
      httpMethod: getItemsMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: args.lambdaFunction.invokeArn,
    }, { parent: this, dependsOn: [lambdaPermission] });

    // Integration for POST /items
    const postItemsIntegration = new aws.apigateway.Integration(`tap-post-items-integration-${args.environmentSuffix}`, {
      restApi: api.id,
      resourceId: itemsResource.id,
      httpMethod: postItemsMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: args.lambdaFunction.invokeArn,
    }, { parent: this, dependsOn: [lambdaPermission] });

    // Integration for GET /items/{id}
    const getItemIntegration = new aws.apigateway.Integration(`tap-get-item-integration-${args.environmentSuffix}`, {
      restApi: api.id,
      resourceId: itemResource.id,
      httpMethod: getItemMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: args.lambdaFunction.invokeArn,
    }, { parent: this, dependsOn: [lambdaPermission] });

    // Deploy the API
    const deployment = new aws.apigateway.Deployment(`tap-deployment-${args.environmentSuffix}`, {
      restApi: api.id,
      stageName: args.environmentSuffix,
    }, { 
      parent: this, 
      dependsOn: [getItemsIntegration, postItemsIntegration, getItemIntegration] 
    });

    this.apiEndpoint = pulumi.interpolate`${api.executionArn}/${deployment.stageName}`;
    this.apiGatewayName = api.name;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      apiGatewayName: this.apiGatewayName,
    });
  }
}
```

## cloudwatch-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  lambdaFunctionName: pulumi.Output<string>;
  apiGatewayName: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly logGroupArn: pulumi.Output<string>;

  constructor(name: string, args: CloudWatchStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    // Create CloudWatch Log Group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(`tap-lambda-logs-${args.environmentSuffix}`, {
      name: pulumi.interpolate`/aws/lambda/${args.lambdaFunctionName}`,
      retentionInDays: 14,
      tags: args.tags,
    }, { parent: this });

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(`tap-alarms-${args.environmentSuffix}`, {
      name: `tap-serverless-alarms-${args.environmentSuffix}`,
      tags: args.tags,
    }, { parent: this });

    // CloudWatch alarm for Lambda errors
    const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(`tap-lambda-error-alarm-${args.environmentSuffix}`, {
      name: `tap-lambda-errors-${args.environmentSuffix}`,
      description: "Lambda function errors",
      metricName: "Errors",
      namespace: "AWS/Lambda",
      statistic: "Sum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 1,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      dimensions: {
        FunctionName: args.lambdaFunctionName,
      },
      alarmActions: [alarmTopic.arn],
      tags: args.tags,
    }, { parent: this });

    // CloudWatch alarm for Lambda duration
    const lambdaDurationAlarm = new aws.cloudwatch.MetricAlarm(`tap-lambda-duration-alarm-${args.environmentSuffix}`, {
      name: `tap-lambda-duration-${args.environmentSuffix}`,
      description: "Lambda function duration",
      metricName: "Duration",
      namespace: "AWS/Lambda",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 25000, // 25 seconds
      comparisonOperator: "GreaterThanThreshold",
      dimensions: {
        FunctionName: args.lambdaFunctionName,
      },
      alarmActions: [alarmTopic.arn],
      tags: args.tags,
    }, { parent: this });

    // CloudWatch alarm for API Gateway 4XX errors
    const apiGateway4xxAlarm = new aws.cloudwatch.MetricAlarm(`tap-api-4xx-alarm-${args.environmentSuffix}`, {
      name: `tap-api-4xx-errors-${args.environmentSuffix}`,
      description: "API Gateway 4XX errors",
      metricName: "4XXError",
      namespace: "AWS/ApiGateway",
      statistic: "Sum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: "GreaterThanThreshold",
      dimensions: {
        ApiName: args.apiGatewayName,
      },
      alarmActions: [alarmTopic.arn],
      tags: args.tags,
    }, { parent: this });

    // CloudWatch alarm for API Gateway 5XX errors
    const apiGateway5xxAlarm = new aws.cloudwatch.MetricAlarm(`tap-api-5xx-alarm-${args.environmentSuffix}`, {
      name: `tap-api-5xx-errors-${args.environmentSuffix}`,
      description: "API Gateway 5XX errors",
      metricName: "5XXError",
      namespace: "AWS/ApiGateway",
      statistic: "Sum",
      period: 300,
      evaluationPeriods: 1,
      threshold: 1,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      dimensions: {
        ApiName: args.apiGatewayName,
      },
      alarmActions: [alarmTopic.arn],
      tags: args.tags,
    }, { parent: this });

    this.logGroupArn = logGroup.arn;

    this.registerOutputs({
      logGroupArn: this.logGroupArn,
    });
  }
}
```

This infrastructure provides:

1. **Lambda Functions**: Uses Node.js 22 runtime with proper IAM roles and least privilege access
2. **API Gateway**: RESTful API with input validation, request models, and proper integration
3. **DynamoDB**: Encrypted table with KMS keys and PartiQL query support in the Lambda code
4. **CloudWatch**: Comprehensive monitoring with log groups and operational alarms
5. **Security**: Proper IAM roles, encryption at rest, and input validation
6. **Scalability**: Pay-per-request DynamoDB billing and automatic Lambda scaling

The infrastructure follows AWS best practices for serverless applications and includes proper error handling, monitoring, and security measures.