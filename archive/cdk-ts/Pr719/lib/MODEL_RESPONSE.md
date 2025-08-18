# CDK TypeScript Serverless Infrastructure Solution

Here's a complete CDK TypeScript solution for your serverless application requirements:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // S3 bucket for Lambda source code
    const lambdaBucket = new s3.Bucket(this, 'LambdaSourceBucket', {
      bucketName: 'lambda-source-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // DynamoDB table with on-demand billing for cost efficiency
    const userDataTable = new dynamodb.Table(this, 'UserDataTable', {
      tableName: 'UserData',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.ON_DEMAND, // Using on-demand for cost efficiency
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // IAM role for Lambda execution
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant Lambda role permissions to access DynamoDB
    userDataTable.grantReadWriteData(lambdaRole);

    // CloudWatch Log Group for Lambda functions with Live Tail support
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/user-data-functions`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for handling GET requests
    const getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, ScanCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
        const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

        const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

        exports.handler = async (event) => {
          console.log('GET request received:', JSON.stringify(event));
          
          try {
            const userId = event.pathParameters?.id;
            
            if (userId) {
              // Get specific user
              const command = new GetItemCommand({
                TableName: process.env.TABLE_NAME,
                Key: marshall({ id: userId })
              });
              
              const result = await dynamodb.send(command);
              
              if (result.Item) {
                return {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify(unmarshall(result.Item))
                };
              } else {
                return {
                  statusCode: 404,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({ message: 'User not found' })
                };
              }
            } else {
              // Get all users
              const command = new ScanCommand({
                TableName: process.env.TABLE_NAME
              });
              
              const result = await dynamodb.send(command);
              const items = result.Items?.map(item => unmarshall(item)) || [];
              
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(items)
              };
            }
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ message: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: userDataTable.tableName,
        LOG_LEVEL: 'INFO',
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: lambdaLogGroup,
    });

    // Lambda function for handling POST requests
    const createUserFunction = new lambda.Function(this, 'CreateUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        const { marshall } = require('@aws-sdk/util-dynamodb');
        const { randomUUID } = require('crypto');

        const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

        exports.handler = async (event) => {
          console.log('POST request received:', JSON.stringify(event));
          
          try {
            const requestBody = JSON.parse(event.body || '{}');
            
            const userData = {
              id: randomUUID(),
              ...requestBody,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            const command = new PutItemCommand({
              TableName: process.env.TABLE_NAME,
              Item: marshall(userData)
            });
            
            await dynamodb.send(command);
            
            return {
              statusCode: 201,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify(userData)
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ message: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: userDataTable.tableName,
        LOG_LEVEL: 'INFO',
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: lambdaLogGroup,
    });

    // Lambda function for handling DELETE requests
    const deleteUserFunction = new lambda.Function(this, 'DeleteUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, DeleteItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
        const { marshall } = require('@aws-sdk/util-dynamodb');

        const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

        exports.handler = async (event) => {
          console.log('DELETE request received:', JSON.stringify(event));
          
          try {
            const userId = event.pathParameters?.id;
            
            if (!userId) {
              return {
                statusCode: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'User ID is required' })
              };
            }
            
            // Check if user exists first
            const getCommand = new GetItemCommand({
              TableName: process.env.TABLE_NAME,
              Key: marshall({ id: userId })
            });
            
            const getResult = await dynamodb.send(getCommand);
            
            if (!getResult.Item) {
              return {
                statusCode: 404,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'User not found' })
              };
            }
            
            // Delete the user
            const deleteCommand = new DeleteItemCommand({
              TableName: process.env.TABLE_NAME,
              Key: marshall({ id: userId })
            });
            
            await dynamodb.send(deleteCommand);
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ message: 'User deleted successfully' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ message: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: userDataTable.tableName,
        LOG_LEVEL: 'INFO',
      },
      timeout: cdk.Duration.seconds(30),
      logGroup: lambdaLogGroup,
    });

    // CloudWatch Log Group for API Gateway
    const apiGatewayLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: '/aws/apigateway/user-data-api',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'UserDataApi', {
      restApiName: 'User Data Service',
      description: 'API Gateway for user data operations',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiGatewayLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // API Gateway integrations
    const getUserIntegration = new apigateway.LambdaIntegration(getUserFunction);
    const createUserIntegration = new apigateway.LambdaIntegration(createUserFunction);
    const deleteUserIntegration = new apigateway.LambdaIntegration(deleteUserFunction);

    // API routes
    const users = api.root.addResource('users');
    users.addMethod('GET', getUserIntegration); // GET /users - get all users
    users.addMethod('POST', createUserIntegration); // POST /users - create user

    const userById = users.addResource('{id}');
    userById.addMethod('GET', getUserIntegration); // GET /users/{id} - get specific user
    userById.addMethod('DELETE', deleteUserIntegration); // DELETE /users/{id} - delete user

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(lambdaBucket).add('Environment', 'Production');
    cdk.Tags.of(userDataTable).add('Environment', 'Production');
    cdk.Tags.of(getUserFunction).add('Environment', 'Production');
    cdk.Tags.of(createUserFunction).add('Environment', 'Production');
    cdk.Tags.of(deleteUserFunction).add('Environment', 'Production');
    cdk.Tags.of(api).add('Environment', 'Production');

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: userDataTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: lambdaBucket.bucketName,
      description: 'S3 Bucket Name for Lambda source code',
    });
  }
}
```

This solution provides:

1. **Lambda Functions**: Three separate functions for GET, POST, and DELETE operations with inline Node.js code
2. **API Gateway**: REST API with proper routing and CORS support
3. **DynamoDB**: On-demand billing table named 'UserData' for cost efficiency
4. **S3 Bucket**: Named 'lambda-source-bucket' for Lambda deployment packages
5. **IAM Roles**: Proper permissions for Lambda to access DynamoDB
6. **CloudWatch Logs**: Integrated logging for both API Gateway and Lambda functions with Live Tail support
7. **Environment Variables**: Lambda functions have TABLE_NAME environment variable
8. **Tags**: All resources tagged with 'Environment': 'Production'
9. **Error Handling**: Comprehensive error handling in Lambda functions
10. **CORS Support**: Enabled for web application access

The solution uses modern AWS SDK v3 for JavaScript and follows CDK best practices with proper resource cleanup and security configurations.