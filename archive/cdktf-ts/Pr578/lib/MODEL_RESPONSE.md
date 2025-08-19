import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { ApiGatewayMethodSettings } from "@cdktf/provider-aws/lib/api-gateway-method-settings";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { DataArchiveFile } from "@cdktf/provider-archive/lib/data-archive-file";
import { ArchiveProvider } from "@cdktf/provider-archive/lib/provider";

class ServerlessWebAppStack extends TerraformStack {
private readonly resourcePrefix = "prod-service";
private readonly region = "us-east-1";

constructor(scope: Construct, id: string) {
super(scope, id);

    // Providers
    new AwsProvider(this, "AWS", {
      region: this.region,
    });

    new ArchiveProvider(this, "archive");

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
      lambdaRole,
      lambdaBucket,
      userTable,
      sessionTable,
      lambdaLogGroups
    );

    // API Gateway
    const apiGateway = this.createApiGateway(lambdaFunctions, apiLogGroup);

    // Outputs
    this.createOutputs(apiGateway, userTable, sessionTable);

}

private createLambdaBucket(): S3Bucket {
return new S3Bucket(this, `${this.resourcePrefix}-lambda-bucket`, {
bucket: `${this.resourcePrefix}-lambda-deployments-${Date.now()}`,
versioning: {
enabled: true,
},
serverSideEncryptionConfiguration: {
rule: {
applyServerSideEncryptionByDefault: {
sseAlgorithm: "AES256",
},
},
},
tags: {
Name: `${this.resourcePrefix}-lambda-bucket`,
Environment: "production",
Project: "IaC-AWS-Nova-Model-Breaking",
},
});
}

private createUserTable(): DynamodbTable {
return new DynamodbTable(this, `${this.resourcePrefix}-user-table`, {
name: `${this.resourcePrefix}-users`,
billingMode: "PAY_PER_REQUEST",
hashKey: "userId",
attribute: [
{
name: "userId",
type: "S",
},
{
name: "email",
type: "S",
},
],
globalSecondaryIndex: [
{
name: "EmailIndex",
hashKey: "email",
projectionType: "ALL",
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
Environment: "production",
Project: "IaC-AWS-Nova-Model-Breaking",
},
});
}

private createSessionTable(): DynamodbTable {
return new DynamodbTable(this, `${this.resourcePrefix}-session-table`, {
name: `${this.resourcePrefix}-sessions`,
billingMode: "PAY_PER_REQUEST",
hashKey: "sessionId",
attribute: [
{
name: "sessionId",
type: "S",
},
{
name: "userId",
type: "S",
},
],
globalSecondaryIndex: [
{
name: "UserIndex",
hashKey: "userId",
projectionType: "ALL",
},
],
ttl: {
attributeName: "expiresAt",
enabled: true,
},
serverSideEncryption: {
enabled: true,
},
pointInTimeRecovery: {
enabled: true,
},
tags: {
Name: `${this.resourcePrefix}-session-table`,
Environment: "production",
Project: "IaC-AWS-Nova-Model-Breaking",
},
});
}

private createLambdaExecutionRole(
userTable: DynamodbTable,
sessionTable: DynamodbTable
): IamRole {
const role = new IamRole(this, `${this.resourcePrefix}-lambda-role`, {
name: `${this.resourcePrefix}-lambda-execution-role`,
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
tags: {
Name: `${this.resourcePrefix}-lambda-role`,
Environment: "production",
Project: "IaC-AWS-Nova-Model-Breaking",
},
});

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, `${this.resourcePrefix}-lambda-basic-policy`, {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    // Custom policy for DynamoDB access
    const dynamoPolicy = new IamPolicy(this, `${this.resourcePrefix}-dynamo-policy`, {
      name: `${this.resourcePrefix}-lambda-dynamo-policy`,
      description: "Policy for Lambda to access DynamoDB tables",
      policy: JSON.stringify({
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
            ],
            Resource: [
              userTable.arn,
              sessionTable.arn,
              `${userTable.arn}/index/*`,
              `${sessionTable.arn}/index/*`,
            ],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, `${this.resourcePrefix}-lambda-dynamo-attachment`, {
      role: role.name,
      policyArn: dynamoPolicy.arn,
    });

    return role;

}

private createApiLogGroup(): CloudwatchLogGroup {
return new CloudwatchLogGroup(this, `${this.resourcePrefix}-api-logs`, {
name: `/aws/apigateway/${this.resourcePrefix}-api`,
retentionInDays: 14,
tags: {
Name: `${this.resourcePrefix}-api-logs`,
Environment: "production",
Project: "IaC-AWS-Nova-Model-Breaking",
},
});
}

private createLambdaLogGroups(): Record<string, CloudwatchLogGroup> {
const functions = ["auth", "users", "health"];
const logGroups: Record<string, CloudwatchLogGroup> = {};

    functions.forEach((func) => {
      logGroups[func] = new CloudwatchLogGroup(this, `${this.resourcePrefix}-${func}-logs`, {
        name: `/aws/lambda/${this.resourcePrefix}-${func}`,
        retentionInDays: 14,
        tags: {
          Name: `${this.resourcePrefix}-${func}-logs`,
          Environment: "production",
          Project: "IaC-AWS-Nova-Model-Breaking",
        },
      });
    });

    return logGroups;

}

private createLambdaFunctions(
role: IamRole,
bucket: S3Bucket,
userTable: DynamodbTable,
sessionTable: DynamodbTable,
logGroups: Record<string, CloudwatchLogGroup>
): Record<string, LambdaFunction> {
const functions: Record<string, LambdaFunction> = {};

    // Auth Lambda Function
    const authCode = this.createAuthLambdaCode();
    const authArchive = new DataArchiveFile(this, `${this.resourcePrefix}-auth-archive`, {
      type: "zip",
      outputPath: "/tmp/auth-lambda.zip",
      source: [
        {
          content: authCode,
          filename: "index.js",
        },
      ],
    });

    const authS3Object = new S3Object(this, `${this.resourcePrefix}-auth-s3-object`, {
      bucket: bucket.id,
      key: "auth-lambda.zip",
      source: authArchive.outputPath,
      etag: authArchive.outputMd5,
    });

    functions.auth = new LambdaFunction(this, `${this.resourcePrefix}-auth-lambda`, {
      functionName: `${this.resourcePrefix}-auth`,
      role: role.arn,
      handler: "index.handler",
      runtime: "nodejs18.x",
      timeout: 30,
      memorySize: 256,
      s3Bucket: bucket.id,
      s3Key: authS3Object.key,
      sourceCodeHash: authArchive.outputBase64Sha256,
      environment: {
        variables: {
          USER_TABLE: userTable.name,
          SESSION_TABLE: sessionTable.name,
          REGION: this.region,
        },
      },
      dependsOn: [logGroups.auth],
      tags: {
        Name: `${this.resourcePrefix}-auth-lambda`,
        Environment: "production",
        Project: "IaC-AWS-Nova-Model-Breaking",
      },
    });

    // Users Lambda Function
    const usersCode = this.createUsersLambdaCode();
    const usersArchive = new DataArchiveFile(this, `${this.resourcePrefix}-users-archive`, {
      type: "zip",
      outputPath: "/tmp/users-lambda.zip",
      source: [
        {
          content: usersCode,
          filename: "index.js",
        },
      ],
    });

    const usersS3Object = new S3Object(this, `${this.resourcePrefix}-users-s3-object`, {
      bucket: bucket.id,
      key: "users-lambda.zip",
      source: usersArchive.outputPath,
      etag: usersArchive.outputMd5,
    });

    functions.users = new LambdaFunction(this, `${this.resourcePrefix}-users-lambda`, {
      functionName: `${this.resourcePrefix}-users`,
      role: role.arn,
      handler: "index.handler",
      runtime: "nodejs18.x",
      timeout: 30,
      memorySize: 512,
      s3Bucket: bucket.id,
      s3Key: usersS3Object.key,
      sourceCodeHash: usersArchive.outputBase64Sha256,
      environment: {
        variables: {
          USER_TABLE: userTable.name,
          SESSION_TABLE: sessionTable.name,
          REGION: this.region,
        },
      },
      dependsOn: [logGroups.users],
      tags: {
        Name: `${this.resourcePrefix}-users-lambda`,
        Environment: "production",
        Project: "IaC-AWS-Nova-Model-Breaking",
      },
    });

    // Health Check Lambda Function
    const healthCode = this.createHealthLambdaCode();
    const healthArchive = new DataArchiveFile(this, `${this.resourcePrefix}-health-archive`, {
      type: "zip",
      outputPath: "/tmp/health-lambda.zip",
      source: [
        {
          content: healthCode,
          filename: "index.js",
        },
      ],
    });

    const healthS3Object = new S3Object(this, `${this.resourcePrefix}-health-s3-object`, {
      bucket: bucket.id,
      key: "health-lambda.zip",
      source: healthArchive.outputPath,
      etag: healthArchive.outputMd5,
    });

    functions.health = new LambdaFunction(this, `${this.resourcePrefix}-health-lambda`, {
      functionName: `${this.resourcePrefix}-health`,
      role: role.arn,
      handler: "index.handler",
      runtime: "nodejs18.x",
      timeout: 10,
      memorySize: 128,
      s3Bucket: bucket.id,
      s3Key: healthS3Object.key,
      sourceCodeHash: healthArchive.outputBase64Sha256,
      environment: {
        variables: {
          USER_TABLE: userTable.name,
          SESSION_TABLE: sessionTable.name,
          REGION: this.region,
        },
      },
      dependsOn: [logGroups.health],
      tags: {
        Name: `${this.resourcePrefix}-health-lambda`,
        Environment: "production",
        Project: "IaC-AWS-Nova-Model-Breaking",
      },
    });

    return functions;

}

private createApiGateway(
lambdaFunctions: Record<string, LambdaFunction>,
logGroup: CloudwatchLogGroup
): ApiGatewayRestApi {
// REST API
const api = new ApiGatewayRestApi(this, `${this.resourcePrefix}-api`, {
name: `${this.resourcePrefix}-api`,
description: "Serverless Web Application API",
endpointConfiguration: {
types: ["REGIONAL"],
},
tags: {
Name: `${this.resourcePrefix}-api`,
Environment: "production",
Project: "IaC-AWS-Nova-Model-Breaking",
},
});

    // Resources
    const authResource = new ApiGatewayResource(this, `${this.resourcePrefix}-auth-resource`, {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "auth",
    });

    const usersResource = new ApiGatewayResource(this, `${this.resourcePrefix}-users-resource`, {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "users",
    });

    const healthResource = new ApiGatewayResource(this, `${this.resourcePrefix}-health-resource`, {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "health",
    });

    // Methods and Integrations
    this.createApiMethod(api, authResource, "POST", lambdaFunctions.auth, "auth");
    this.createApiMethod(api, usersResource, "GET", lambdaFunctions.users, "users");
    this.createApiMethod(api, usersResource, "POST", lambdaFunctions.users, "users");
    this.createApiMethod(api, healthResource, "GET", lambdaFunctions.health, "health");

    // Deployment
    const deployment = new ApiGatewayDeployment(this, `${this.resourcePrefix}-api-deployment`, {
      restApiId: api.id,
      triggers: {
        redeployment: Date.now().toString(),
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Stage
    const stage = new ApiGatewayStage(this, `${this.resourcePrefix}-api-stage`, {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: "prod",
      accessLogSettings: {
        destinationArn: logGroup.arn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          ip: "$context.identity.sourceIp",
          caller: "$context.identity.caller",
          user: "$context.identity.user",
          requestTime: "$context.requestTime",
          httpMethod: "$context.httpMethod",
          resourcePath: "$context.resourcePath",
          status: "$context.status",
          protocol: "$context.protocol",
          responseLength: "$context.responseLength",
        }),
      },
      xrayTracingEnabled: true,
      tags: {
        Name: `${this.resourcePrefix}-api-stage`,
        Environment: "production",
        Project: "IaC-AWS-Nova-Model-Breaking",
      },
    });

    // Method Settings for throttling and monitoring
    new ApiGatewayMethodSettings(this, `${this.resourcePrefix}-api-method-settings`, {
      restApiId: api.id,
      stageName: stage.stageName,
      methodPath: "*/*",
      settings: {
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        metricsEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: "INFO",
      },
    });

    return api;

}

private createApiMethod(
api: ApiGatewayRestApi,
resource: ApiGatewayResource,
httpMethod: string,
lambdaFunction: LambdaFunction,
functionName: string
): void {
// Method
const method = new ApiGatewayMethod(this, `${this.resourcePrefix}-${functionName}-${httpMethod.toLowerCase()}-method`, {
restApiId: api.id,
resourceId: resource.id,
httpMethod: httpMethod,
authorization: "NONE",
requestParameters: {
"method.request.header.Content-Type": false,
},
});

    // Integration
    new ApiGatewayIntegration(this, `${this.resourcePrefix}-${functionName}-${httpMethod.toLowerCase()}-integration`, {
      restApiId: api.id,
      resourceId: resource.id,
      httpMethod: method.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: lambdaFunction.invokeArn,
    });

    // Lambda Permission
    new LambdaPermission(this, `${this.resourcePrefix}-${functionName}-${httpMethod.toLowerCase()}-permission`, {
      statementId: `AllowExecutionFromAPIGateway-${functionName}-${httpMethod}`,
      action: "lambda:InvokeFunction",
      functionName: lambdaFunction.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

}

private createAuthLambdaCode(): string {
return `
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
console.log('Auth Lambda invoked:', JSON.stringify(event, null, 2));

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight' })
            };
        }

        const body = JSON.parse(event.body || '{}');
        const { email, password } = body;

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Email and password are required' })
            };
        }

        // Simulate authentication (in real app, verify password hash)
        const userId = uuidv4();
        const sessionId = uuidv4();
        const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour

        // Store user
        await dynamodb.put({
            TableName: process.env.USER_TABLE,
            Item: {
                userId,
                email,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            }
        }).promise();

        // Store session
        await dynamodb.put({
            TableName: process.env.SESSION_TABLE,
            Item: {
                sessionId,
                userId,
                expiresAt,
                createdAt: new Date().toISOString()
            }
        }).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Authentication successful',
                sessionId,
                userId,
                expiresAt
            })
        };

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }

};
`;
}

private createUsersLambdaCode(): string {
return `
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
console.log('Users Lambda invoked:', JSON.stringify(event, null, 2));

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight' })
            };
        }

        if (event.httpMethod === 'GET') {
            // Get all users
            const result = await dynamodb.scan({
                TableName: process.env.USER_TABLE,
                ProjectionExpression: 'userId, email, createdAt, lastLogin'
            }).promise();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    users: result.Items,
                    count: result.Count
                })
            };
        }

        if (event.httpMethod === 'POST') {
            // Create new user
            const body = JSON.parse(event.body || '{}');
            const { email, name } = body;

            if (!email || !name) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Email and name are required' })
                };
            }

            const userId = uuidv4();
            const user = {
                userId,
                email,
                name,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };

            await dynamodb.put({
                TableName: process.env.USER_TABLE,
                Item: user,
                ConditionExpression: 'attribute_not_exists(email)'
            }).promise();

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: 'User created successfully',
                    user
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Users error:', error);

        if (error.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'User with this email already exists' })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }

};
`;
}

private createHealthLambdaCode(): string {
return `
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
console.log('Health Lambda invoked:', JSON.stringify(event, null, 2));

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight' })
            };
        }

        // Check DynamoDB connectivity
        const userTableHealth = await dynamodb.scan({
            TableName: process.env.USER_TABLE,
            Limit: 1
        }).promise();

        const sessionTableHealth = await dynamodb.scan({
            TableName: process.env.SESSION_TABLE,
            Limit: 1
        }).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'prod-service-api',
                version: '1.0.0',
                checks: {
                    dynamodb: {
                        userTable: 'healthy',
                        sessionTable: 'healthy'
                    },
                    lambda: 'healthy'
                },
                region: process.env.AWS_REGION
            })
        };

    } catch (error) {
        console.error('Health check error:', error);
        return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            })
        };
    }

};
`;
}

private createOutputs(
api: ApiGatewayRestApi,
userTable: DynamodbTable,
sessionTable: DynamodbTable
): void {
new TerraformOutput(this, "api_gateway_url", {
description: "API Gateway URL",
value: `https://${api.id}.execute-api.${this.region}.amazonaws.com/prod`,
});

    new TerraformOutput(this, "api_gateway_id", {
      description: "API Gateway ID",
      value: api.id,
    });

    new TerraformOutput(this, "user_table_name", {
      description: "DynamoDB User Table Name",
      value: userTable.name,
    });

    new TerraformOutput(this, "session_table_name", {
      description: "DynamoDB Session Table Name",
      value: sessionTable.name,
    });

    new TerraformOutput(this, "health_endpoint", {
      description: "Health Check Endpoint",
      value: `https://${api.id}.execute-api.${this.region}.amazonaws.com/prod/health`,
    });

    new TerraformOutput(this, "auth_endpoint", {
      description: "Authentication Endpoint",
      value: `https://${api.id}.execute-api.${this.region}.amazonaws.com/prod/auth`,
    });

    new TerraformOutput(this, "users_endpoint", {
      description: "Users Endpoint",
      value: `https://${api.id}.execute-api.${this.region}.amazonaws.com/prod/users`,
    });

}
}

const app = new App();
new ServerlessWebAppStack(app, "prod-service-serverless-web-app");
app.synth();
