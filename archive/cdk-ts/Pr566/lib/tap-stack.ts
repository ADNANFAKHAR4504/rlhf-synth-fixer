import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // DynamoDB Table for data storage
    const dataTable = new dynamodb.Table(this, 'DataTable', {
      tableName: `serverless-data-table-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying by user
    dataTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `serverless-user-pool-${environmentSuffix}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: `serverless-client-${environmentSuffix}`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['https://example.com/callback'],
        logoutUrls: ['https://example.com/logout'],
      },
    });

    // Lambda function for data processing
    const dataProcessorFunction = new lambda.Function(
      this,
      'DataProcessorFunction',
      {
        functionName: `data-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();

        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          const httpMethod = event.requestContext.http.method;
          const routeKey = event.routeKey;
          
          try {
            let response;
            
            switch (routeKey) {
              case 'POST /data':
                response = await createData(event);
                break;
              case 'GET /data':
                response = await getData(event);
                break;
              case 'GET /data/{id}':
                response = await getDataById(event);
                break;
              default:
                response = {
                  statusCode: 404,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({ message: 'Route not found' }),
                };
            }
            
            return response;
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message 
              }),
            };
          }
        };

        async function createData(event) {
          const body = JSON.parse(event.body || '{}');
          const userId = event.requestContext.authorizer.jwt.claims.sub;
          
          const item = {
            id: generateId(),
            userId: userId,
            timestamp: Date.now(),
            data: body.data,
            metadata: {
              createdAt: new Date().toISOString(),
              source: 'api',
            },
          };

          await dynamodb.put({
            TableName: process.env.TABLE_NAME,
            Item: item,
          }).promise();

          return {
            statusCode: 201,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
              message: 'Data created successfully',
              id: item.id 
            }),
          };
        }

        async function getData(event) {
          const userId = event.requestContext.authorizer.jwt.claims.sub;
          
          const result = await dynamodb.query({
            TableName: process.env.TABLE_NAME,
            IndexName: 'UserIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId,
            },
            ScanIndexForward: false,
            Limit: 50,
          }).promise();

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
              items: result.Items,
              count: result.Count 
            }),
          };
        }

        async function getDataById(event) {
          const id = event.pathParameters.id;
          const userId = event.requestContext.authorizer.jwt.claims.sub;
          
          const result = await dynamodb.get({
            TableName: process.env.TABLE_NAME,
            Key: { id: id },
          }).promise();

          if (!result.Item) {
            return {
              statusCode: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ message: 'Data not found' }),
            };
          }

          // Check if user owns the data
          if (result.Item.userId !== userId) {
            return {
              statusCode: 403,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ message: 'Access denied' }),
            };
          }

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result.Item),
          };
        }

        function generateId() {
          return Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
        }
      `),
        environment: {
          TABLE_NAME: dataTable.tableName,
          USER_POOL_ID: userPool.userPoolId,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    // Grant DynamoDB permissions to Lambda
    dataTable.grantReadWriteData(dataProcessorFunction);

    // JWT Authorizer for API Gateway
    const jwtAuthorizer = new apigatewayv2Authorizers.HttpJwtAuthorizer(
      'JwtAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    // API Gateway HTTP API - optimized for serverless
    const httpApi = new apigatewayv2.HttpApi(this, 'ServerlessApi', {
      apiName: `serverless-api-${environmentSuffix}`,
      description: 'Serverless API with Lambda, DynamoDB, and Cognito',
      corsPreflight: {
        allowCredentials: false,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
        maxAge: cdk.Duration.days(10),
      },
    });

    // Lambda integration
    const lambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        'DataProcessorIntegration',
        dataProcessorFunction
      );

    // API Routes with authentication
    httpApi.addRoutes({
      path: '/data',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: lambdaIntegration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: '/data',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: '/data/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
      authorizer: jwtAuthorizer,
    });

    // Health check endpoint (no auth required)
    const healthCheckFunction = new lambda.Function(
      this,
      'HealthCheckFunction',
      {
        functionName: `health-check-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              environment: process.env.ENVIRONMENT,
            }),
          };
        };
      `),
        environment: {
          ENVIRONMENT: environmentSuffix,
        },
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
      }
    );

    const healthIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        'HealthCheckIntegration',
        healthCheckFunction
      );

    httpApi.addRoutes({
      path: '/health',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: healthIntegration,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'DynamoDbTableName', {
      value: dataTable.tableName,
      description: 'DynamoDB table name',
    });
  }
}
