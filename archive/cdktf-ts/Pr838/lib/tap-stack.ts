// CDKTF Serverless Web Application Infrastructure
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3Object } from '@cdktf/provider-aws/lib/s3-object';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  // Allow passing through AWS provider default tags structure
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Environment suffix for resource naming with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const envSuffix = props?.environmentSuffix || 'default';
    const uniqueSuffix = `${envSuffix}-${timestamp}`;

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'Serverless-Web-App',
      ManagedBy: 'CDKTF',
      DeploymentId: uniqueSuffix,
    };

    // AWS Provider
    const providerDefaultTags = props?.defaultTags
      ? [props.defaultTags]
      : [{ tags: commonTags }];

    new AwsProvider(this, 'aws', {
      region: props?.awsRegion || 'us-east-1',
      defaultTags: providerDefaultTags,
    });

    // Archive Provider for Lambda packages
    new ArchiveProvider(this, 'archive');

    // Data sources
    const current = new DataAwsCallerIdentity(this, 'current');

    // S3 Bucket for Lambda deployment packages with unique naming
    const lambdaBucket = new S3Bucket(this, 'lambda-deployment-bucket', {
      bucket: `lambda-deployments-${current.accountId}-${uniqueSuffix}`,
      tags: { ...commonTags, Purpose: 'Lambda deployment packages' },
    });

    new S3BucketPublicAccessBlock(this, 'lambda-bucket-pab', {
      bucket: lambdaBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'lambda-bucket-encryption',
      {
        bucket: lambdaBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // DynamoDB Tables with unique naming
    const userTable = new DynamodbTable(this, 'prod-service-user-table', {
      name: `prod-service-users-${uniqueSuffix}`,
      hashKey: 'userId',
      billingMode: 'PAY_PER_REQUEST',
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      attribute: [
        {
          name: 'userId',
          type: 'S',
        },
      ],
      tags: { ...commonTags, Name: `prod-service-users-${uniqueSuffix}` },
    });

    const sessionTable = new DynamodbTable(this, 'prod-service-session-table', {
      name: `prod-service-sessions-${uniqueSuffix}`,
      hashKey: 'sessionId',
      billingMode: 'PAY_PER_REQUEST',
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      ttl: {
        attributeName: 'expiresAt',
        enabled: true,
      },
      attribute: [
        {
          name: 'sessionId',
          type: 'S',
        },
      ],
      tags: { ...commonTags, Name: `prod-service-sessions-${uniqueSuffix}` },
    });

    // IAM Role for Lambda execution with unique naming
    const lambdaRole = new IamRole(this, 'lambda-execution-role', {
      name: `prod-service-lambda-execution-role-${uniqueSuffix}`,
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
      tags: commonTags,
    });

    // DynamoDB access policy for Lambda with unique naming
    const dynamoPolicy = new IamPolicy(this, 'lambda-dynamodb-policy', {
      name: `prod-service-lambda-dynamodb-policy-${uniqueSuffix}`,
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
              `${userTable.arn}/index/*`,
              `${sessionTable.arn}/index/*`,
            ],
          },
        ],
      }),
      tags: commonTags,
    });

    // Attach policies to Lambda role
    new IamRolePolicyAttachment(this, 'lambda-basic-execution-policy', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    new IamRolePolicyAttachment(this, 'lambda-dynamodb-policy-attachment', {
      role: lambdaRole.name,
      policyArn: dynamoPolicy.arn,
    });

    // CloudWatch Log Groups with unique naming
    new CloudwatchLogGroup(this, 'api-gateway-log-group', {
      name: `/aws/apigateway/prod-service-api-${uniqueSuffix}`,
      retentionInDays: 14,
      tags: commonTags,
    });

    new CloudwatchLogGroup(this, 'user-handler-log-group', {
      name: `/aws/lambda/prod-service-user-handler-${uniqueSuffix}`,
      retentionInDays: 14,
      tags: commonTags,
    });

    new CloudwatchLogGroup(this, 'session-handler-log-group', {
      name: `/aws/lambda/prod-service-session-handler-${uniqueSuffix}`,
      retentionInDays: 14,
      tags: commonTags,
    });

    new CloudwatchLogGroup(this, 'health-check-log-group', {
      name: `/aws/lambda/prod-service-health-check-${uniqueSuffix}`,
      retentionInDays: 14,
      tags: commonTags,
    });

    // Lambda function code archives
    const userHandlerZip = new DataArchiveFile(this, 'user-handler-zip', {
      type: 'zip',
      sourceContent: `
const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  console.log('User handler event:', JSON.stringify(event, null, 2));
  
  const { httpMethod, pathParameters } = event;
  const userId = pathParameters?.userId;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (userId) {
          const result = await client.send(new GetItemCommand({
            TableName: process.env.USER_TABLE_NAME,
            Key: { userId: { S: userId } }
          }));
          return {
            statusCode: 200,
            body: JSON.stringify(result.Item || {}),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        break;
      case 'POST':
        const body = JSON.parse(event.body || '{}');
        await client.send(new PutItemCommand({
          TableName: process.env.USER_TABLE_NAME,
          Item: {
            userId: { S: body.userId },
            name: { S: body.name },
            email: { S: body.email }
          }
        }));
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'User created' }),
          headers: { 'Content-Type': 'application/json' }
        };
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
          headers: { 'Content-Type': 'application/json' }
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
      `,
      sourceContentFilename: 'index.js',
      outputPath: './user-handler.zip',
    });

    const sessionHandlerZip = new DataArchiveFile(this, 'session-handler-zip', {
      type: 'zip',
      sourceContent: `
const { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  console.log('Session handler event:', JSON.stringify(event, null, 2));
  
  const { httpMethod, pathParameters } = event;
  const sessionId = pathParameters?.sessionId;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (sessionId) {
          const result = await client.send(new GetItemCommand({
            TableName: process.env.SESSION_TABLE_NAME,
            Key: { sessionId: { S: sessionId } }
          }));
          return {
            statusCode: 200,
            body: JSON.stringify(result.Item || {}),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        break;
      case 'POST':
        const body = JSON.parse(event.body || '{}');
        const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
        await client.send(new PutItemCommand({
          TableName: process.env.SESSION_TABLE_NAME,
          Item: {
            sessionId: { S: body.sessionId },
            userId: { S: body.userId },
            expiresAt: { N: expiresAt.toString() }
          }
        }));
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Session created' }),
          headers: { 'Content-Type': 'application/json' }
        };
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
          headers: { 'Content-Type': 'application/json' }
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
      `,
      sourceContentFilename: 'index.js',
      outputPath: './session-handler.zip',
    });

    const healthCheckZip = new DataArchiveFile(this, 'health-check-zip', {
      type: 'zip',
      sourceContent: `
const { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  console.log('Health check event:', JSON.stringify(event, null, 2));
  
  try {
    // Test DynamoDB connectivity with describeTable
    await client.send(new DescribeTableCommand({
      TableName: process.env.USER_TABLE_NAME
    }));
    // Perform write test
    const testId = \`health-check-$${Date.now()}\`;
    await client.send(new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME,
      Item: {
        userId: { S: testId },
        name: { S: 'Health Check' },
        email: { S: 'test@health.com' }
      }
    }));
    // Perform read test
    await client.send(new GetItemCommand({
      TableName: process.env.USER_TABLE_NAME,
      Key: { userId: { S: testId } }
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        writeTest: 'passed',
        readTest: 'passed'
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 503,
      body: JSON.stringify({ 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
      `,
      sourceContentFilename: 'index.js',
      outputPath: './health-check.zip',
    });

    // Upload Lambda packages to S3
    const userHandlerS3 = new S3Object(this, 'user-handler-s3', {
      bucket: lambdaBucket.id,
      key: 'user-handler.zip',
      source: userHandlerZip.outputPath,
      tags: commonTags,
    });

    const sessionHandlerS3 = new S3Object(this, 'session-handler-s3', {
      bucket: lambdaBucket.id,
      key: 'session-handler.zip',
      source: sessionHandlerZip.outputPath,
      tags: commonTags,
    });

    const healthCheckS3 = new S3Object(this, 'health-check-s3', {
      bucket: lambdaBucket.id,
      key: 'health-check.zip',
      source: healthCheckZip.outputPath,
      tags: commonTags,
    });

    // Lambda Functions with unique naming
    const userHandlerFunction = new LambdaFunction(
      this,
      'user-handler-function',
      {
        functionName: `prod-service-user-handler-${uniqueSuffix}`,
        s3Bucket: lambdaBucket.id,
        s3Key: 'user-handler.zip',
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 256,
        environment: {
          variables: {
            USER_TABLE_NAME: userTable.name,
            SESSION_TABLE_NAME: sessionTable.name,
          },
        },
        dependsOn: [userHandlerS3],
        tags: commonTags,
      }
    );

    const sessionHandlerFunction = new LambdaFunction(
      this,
      'session-handler-function',
      {
        functionName: `prod-service-session-handler-${uniqueSuffix}`,
        s3Bucket: lambdaBucket.id,
        s3Key: 'session-handler.zip',
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        timeout: 15,
        memorySize: 128,
        environment: {
          variables: {
            USER_TABLE_NAME: userTable.name,
            SESSION_TABLE_NAME: sessionTable.name,
          },
        },
        dependsOn: [sessionHandlerS3],
        tags: commonTags,
      }
    );

    const healthCheckFunction = new LambdaFunction(
      this,
      'health-check-function',
      {
        functionName: `prod-service-health-check-${uniqueSuffix}`,
        s3Bucket: lambdaBucket.id,
        s3Key: 'health-check.zip',
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        timeout: 10,
        memorySize: 128,
        environment: {
          variables: {
            USER_TABLE_NAME: userTable.name,
            SESSION_TABLE_NAME: sessionTable.name,
          },
        },
        dependsOn: [healthCheckS3],
        tags: commonTags,
      }
    );

    // API Gateway REST API with unique naming
    const restApi = new ApiGatewayRestApi(this, 'service-api', {
      name: `prod-service-api-${uniqueSuffix}`,
      description: 'Serverless Web Application API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: commonTags,
    });

    // API Gateway Resources
    const usersResource = new ApiGatewayResource(this, 'users-resource', {
      restApiId: restApi.id,
      parentId: restApi.rootResourceId,
      pathPart: 'users',
    });

    const userIdResource = new ApiGatewayResource(this, 'user-id-resource', {
      restApiId: restApi.id,
      parentId: usersResource.id,
      pathPart: '{userId}',
    });

    const sessionsResource = new ApiGatewayResource(this, 'sessions-resource', {
      restApiId: restApi.id,
      parentId: restApi.rootResourceId,
      pathPart: 'sessions',
    });

    const sessionIdResource = new ApiGatewayResource(
      this,
      'session-id-resource',
      {
        restApiId: restApi.id,
        parentId: sessionsResource.id,
        pathPart: '{sessionId}',
      }
    );

    const healthResource = new ApiGatewayResource(this, 'health-resource', {
      restApiId: restApi.id,
      parentId: restApi.rootResourceId,
      pathPart: 'health',
    });

    // API Gateway Methods
    const usersGetMethod = new ApiGatewayMethod(this, 'users-get-method', {
      restApiId: restApi.id,
      resourceId: usersResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    const usersPostMethod = new ApiGatewayMethod(this, 'users-post-method', {
      restApiId: restApi.id,
      resourceId: usersResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    const userGetMethod = new ApiGatewayMethod(this, 'user-get-method', {
      restApiId: restApi.id,
      resourceId: userIdResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    const userPutMethod = new ApiGatewayMethod(this, 'user-put-method', {
      restApiId: restApi.id,
      resourceId: userIdResource.id,
      httpMethod: 'PUT',
      authorization: 'NONE',
    });

    const userDeleteMethod = new ApiGatewayMethod(this, 'user-delete-method', {
      restApiId: restApi.id,
      resourceId: userIdResource.id,
      httpMethod: 'DELETE',
      authorization: 'NONE',
    });

    const sessionsGetMethod = new ApiGatewayMethod(
      this,
      'sessions-get-method',
      {
        restApiId: restApi.id,
        resourceId: sessionsResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      }
    );

    const sessionsPostMethod = new ApiGatewayMethod(
      this,
      'sessions-post-method',
      {
        restApiId: restApi.id,
        resourceId: sessionsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      }
    );

    const sessionGetMethod = new ApiGatewayMethod(this, 'session-get-method', {
      restApiId: restApi.id,
      resourceId: sessionIdResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    const sessionDeleteMethod = new ApiGatewayMethod(
      this,
      'session-delete-method',
      {
        restApiId: restApi.id,
        resourceId: sessionIdResource.id,
        httpMethod: 'DELETE',
        authorization: 'NONE',
      }
    );

    const healthGetMethod = new ApiGatewayMethod(this, 'health-get-method', {
      restApiId: restApi.id,
      resourceId: healthResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    // API Gateway Integrations
    const userIntegration = new ApiGatewayIntegration(
      this,
      'user-integration',
      {
        restApiId: restApi.id,
        resourceId: usersResource.id,
        httpMethod: usersGetMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: userHandlerFunction.invokeArn,
      }
    );

    const userPostIntegration = new ApiGatewayIntegration(
      this,
      'user-post-integration',
      {
        restApiId: restApi.id,
        resourceId: usersResource.id,
        httpMethod: usersPostMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: userHandlerFunction.invokeArn,
      }
    );

    const userIdGetIntegration = new ApiGatewayIntegration(
      this,
      'user-id-get-integration',
      {
        restApiId: restApi.id,
        resourceId: userIdResource.id,
        httpMethod: userGetMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: userHandlerFunction.invokeArn,
      }
    );

    const userIdPutIntegration = new ApiGatewayIntegration(
      this,
      'user-id-put-integration',
      {
        restApiId: restApi.id,
        resourceId: userIdResource.id,
        httpMethod: userPutMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: userHandlerFunction.invokeArn,
      }
    );

    const userIdDeleteIntegration = new ApiGatewayIntegration(
      this,
      'user-id-delete-integration',
      {
        restApiId: restApi.id,
        resourceId: userIdResource.id,
        httpMethod: userDeleteMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: userHandlerFunction.invokeArn,
      }
    );

    const sessionIntegration = new ApiGatewayIntegration(
      this,
      'session-integration',
      {
        restApiId: restApi.id,
        resourceId: sessionsResource.id,
        httpMethod: sessionsGetMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: sessionHandlerFunction.invokeArn,
      }
    );

    const sessionPostIntegration = new ApiGatewayIntegration(
      this,
      'session-post-integration',
      {
        restApiId: restApi.id,
        resourceId: sessionsResource.id,
        httpMethod: sessionsPostMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: sessionHandlerFunction.invokeArn,
      }
    );

    const sessionIdGetIntegration = new ApiGatewayIntegration(
      this,
      'session-id-get-integration',
      {
        restApiId: restApi.id,
        resourceId: sessionIdResource.id,
        httpMethod: sessionGetMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: sessionHandlerFunction.invokeArn,
      }
    );

    const sessionIdDeleteIntegration = new ApiGatewayIntegration(
      this,
      'session-id-delete-integration',
      {
        restApiId: restApi.id,
        resourceId: sessionIdResource.id,
        httpMethod: sessionDeleteMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: sessionHandlerFunction.invokeArn,
      }
    );

    const healthIntegration = new ApiGatewayIntegration(
      this,
      'health-integration',
      {
        restApiId: restApi.id,
        resourceId: healthResource.id,
        httpMethod: healthGetMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: healthCheckFunction.invokeArn,
      }
    );

    // Lambda Permissions for API Gateway
    new LambdaPermission(this, 'user-handler-api-gateway-permission', {
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: userHandlerFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${restApi.executionArn}/*/*`,
    });

    new LambdaPermission(this, 'session-handler-api-gateway-permission', {
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: sessionHandlerFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${restApi.executionArn}/*/*`,
    });

    new LambdaPermission(this, 'health-check-api-gateway-permission', {
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: healthCheckFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${restApi.executionArn}/*/*`,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: restApi.id,
      dependsOn: [
        userIntegration,
        userPostIntegration,
        userIdGetIntegration,
        userIdPutIntegration,
        userIdDeleteIntegration,
        sessionIntegration,
        sessionPostIntegration,
        sessionIdGetIntegration,
        sessionIdDeleteIntegration,
        healthIntegration,
      ],
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, 'api-stage', {
      restApiId: restApi.id,
      deploymentId: deployment.id,
      stageName: 'prod',
      accessLogSettings: {
        destinationArn: `arn:aws:logs:${props?.awsRegion || 'us-east-1'}:${current.accountId}:log-group:/aws/apigateway/prod-service-api-${uniqueSuffix}`,
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
      tags: commonTags,
    });

    // API Gateway Method Settings
    new ApiGatewayMethodSettings(this, 'api-method-settings', {
      restApiId: restApi.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        metricsEnabled: true,
        loggingLevel: 'INFO',
        dataTraceEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
    });

    // Outputs
    new TerraformOutput(this, 'api_gateway_url', {
      value: `https://${restApi.id}.execute-api.${props?.awsRegion || 'us-east-1'}.amazonaws.com/prod`,
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
        user_handler: userHandlerFunction.functionName,
        session_handler: sessionHandlerFunction.functionName,
        health_check: healthCheckFunction.functionName,
      },
      description: 'Lambda function names',
    });

    new TerraformOutput(this, 'health_check_url', {
      value: `https://${restApi.id}.execute-api.${props?.awsRegion || 'us-east-1'}.amazonaws.com/prod/health`,
      description: 'Health check endpoint for deployment validation',
    });
  }

  // Methods to expose Lambda function code for testing
  getUserHandlerCode(): string {
    return `
const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  console.log('User handler event:', JSON.stringify(event, null, 2));
  
  const { httpMethod, pathParameters } = event;
  const userId = pathParameters?.userId;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (userId) {
          const result = await client.send(new GetItemCommand({
            TableName: process.env.USER_TABLE_NAME,
            Key: { userId: { S: userId } }
          }));
          return {
            statusCode: 200,
            body: JSON.stringify(result.Item || {}),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        break;
      case 'POST':
        const body = JSON.parse(event.body || '{}');
        await client.send(new PutItemCommand({
          TableName: process.env.USER_TABLE_NAME,
          Item: {
            userId: { S: body.userId },
            name: { S: body.name },
            email: { S: body.email }
          }
        }));
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'User created' }),
          headers: { 'Content-Type': 'application/json' }
        };
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
          headers: { 'Content-Type': 'application/json' }
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
    `;
  }

  getSessionHandlerCode(): string {
    return `
const { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  console.log('Session handler event:', JSON.stringify(event, null, 2));
  
  const { httpMethod, pathParameters } = event;
  const sessionId = pathParameters?.sessionId;
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (sessionId) {
          const result = await client.send(new GetItemCommand({
            TableName: process.env.SESSION_TABLE_NAME,
            Key: { sessionId: { S: sessionId } }
          }));
          return {
            statusCode: 200,
            body: JSON.stringify(result.Item || {}),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        break;
      case 'POST':
        const body = JSON.parse(event.body || '{}');
        const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
        await client.send(new PutItemCommand({
          TableName: process.env.SESSION_TABLE_NAME,
          Item: {
            sessionId: { S: body.sessionId },
            userId: { S: body.userId },
            expiresAt: { N: expiresAt.toString() }
          }
        }));
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Session created' }),
          headers: { 'Content-Type': 'application/json' }
        };
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
          headers: { 'Content-Type': 'application/json' }
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
    `;
  }

  getHealthCheckCode(): string {
    return `
const { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
exports.handler = async (event) => {
  console.log('Health check event:', JSON.stringify(event, null, 2));
  
  try {
    // Test DynamoDB connectivity with describeTable
    await client.send(new DescribeTableCommand({
      TableName: process.env.USER_TABLE_NAME
    }));
    // Perform write test
    const testId = \`health-check-$${Date.now()}\`;
    await client.send(new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME,
      Item: {
        userId: { S: testId },
        name: { S: 'Health Check' },
        email: { S: 'test@health.com' }
      }
    }));
    // Perform read test
    await client.send(new GetItemCommand({
      TableName: process.env.USER_TABLE_NAME,
      Key: { userId: { S: testId } }
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        writeTest: 'passed',
        readTest: 'passed'
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 503,
      body: JSON.stringify({ 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
    `;
  }
}
