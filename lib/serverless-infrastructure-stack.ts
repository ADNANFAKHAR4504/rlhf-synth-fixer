import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface ServerlessInfrastructureStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  domainName?: string;
}

export class ServerlessInfrastructureStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly cloudFrontDomain: string;
  public readonly tableName: string;

  constructor(
    scope: Construct,
    id: string,
    props?: ServerlessInfrastructureStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'ServerlessAppKMSKey', {
      description: 'KMS key for serverless application encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'ServerlessAppTable', {
      tableName: `serverlessApp-table-${environmentSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for querying by status
    dynamoTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'ServerlessAppLambdaRole', {
      roleName: `serverlessApp-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant DynamoDB permissions to Lambda
    dynamoTable.grantReadWriteData(lambdaRole);
    kmsKey.grantEncryptDecrypt(lambdaRole);

    // Lambda Functions
    const createItemFunction = new lambda.Function(this, 'CreateItemFunction', {
      functionName: `serverlessApp-create-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
        const client = new DynamoDBClient({
          region: process.env.AWS_REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        });

        exports.handler = async (event) => {
          try {
            const body = JSON.parse(event.body || '{}');
            const timestamp = new Date().toISOString();
            
            const params = {
              TableName: process.env.TABLE_NAME,
              Item: {
                id: { S: Date.now().toString() },
                createdAt: { S: timestamp },
                updatedAt: { S: timestamp },
                status: { S: 'active' },
                data: { S: JSON.stringify(body) }
              }
            };

            await client.send(new PutItemCommand(params));
            
            return {
              statusCode: 201,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ message: 'Item created successfully', id: params.Item.id.S })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const readItemFunction = new lambda.Function(this, 'ReadItemFunction', {
      functionName: `serverlessApp-read-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
        const client = new DynamoDBClient({
          region: process.env.AWS_REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        });

        exports.handler = async (event) => {
          try {
            const pathParameters = event.pathParameters || {};
            const id = pathParameters.id;

            if (id) {
              // Get specific item
              const params = {
                TableName: process.env.TABLE_NAME,
                Key: {
                  id: { S: id },
                  createdAt: { S: event.queryStringParameters?.createdAt || '' }
                }
              };

              const result = await client.send(new GetItemCommand(params));
              
              if (!result.Item) {
                return {
                  statusCode: 404,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({ error: 'Item not found' })
                };
              }

              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                  id: result.Item.id.S,
                  createdAt: result.Item.createdAt.S,
                  updatedAt: result.Item.updatedAt.S,
                  status: result.Item.status.S,
                  data: JSON.parse(result.Item.data.S)
                })
              };
            } else {
              // List all items
              const params = {
                TableName: process.env.TABLE_NAME,
                Limit: 10
              };

              const result = await client.send(new ScanCommand(params));
              
              const items = result.Items?.map(item => ({
                id: item.id.S,
                createdAt: item.createdAt.S,
                updatedAt: item.updatedAt.S,
                status: item.status.S,
                data: JSON.parse(item.data.S)
              })) || [];

              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ items })
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
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const updateItemFunction = new lambda.Function(this, 'UpdateItemFunction', {
      functionName: `serverlessApp-update-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
        const client = new DynamoDBClient({
          region: process.env.AWS_REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        });

        exports.handler = async (event) => {
          try {
            const pathParameters = event.pathParameters || {};
            const id = pathParameters.id;
            const body = JSON.parse(event.body || '{}');
            
            if (!id) {
              return {
                statusCode: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'ID is required' })
              };
            }

            const timestamp = new Date().toISOString();
            
            const params = {
              TableName: process.env.TABLE_NAME,
              Key: {
                id: { S: id },
                createdAt: { S: event.queryStringParameters?.createdAt || '' }
              },
              UpdateExpression: 'SET updatedAt = :updatedAt, #data = :data, #status = :status',
              ExpressionAttributeNames: {
                '#data': 'data',
                '#status': 'status'
              },
              ExpressionAttributeValues: {
                ':updatedAt': { S: timestamp },
                ':data': { S: JSON.stringify(body) },
                ':status': { S: body.status || 'active' }
              },
              ReturnValues: 'ALL_NEW'
            };

            const result = await client.send(new UpdateItemCommand(params));
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ 
                message: 'Item updated successfully',
                item: {
                  id: result.Attributes?.id.S,
                  updatedAt: result.Attributes?.updatedAt.S,
                  status: result.Attributes?.status.S,
                  data: JSON.parse(result.Attributes?.data.S || '{}')
                }
              })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const deleteItemFunction = new lambda.Function(this, 'DeleteItemFunction', {
      functionName: `serverlessApp-delete-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
        const client = new DynamoDBClient({
          region: process.env.AWS_REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        });

        exports.handler = async (event) => {
          try {
            const pathParameters = event.pathParameters || {};
            const id = pathParameters.id;
            
            if (!id) {
              return {
                statusCode: 400,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'ID is required' })
              };
            }

            const params = {
              TableName: process.env.TABLE_NAME,
              Key: {
                id: { S: id },
                createdAt: { S: event.queryStringParameters?.createdAt || '' }
              }
            };

            await client.send(new DeleteItemCommand(params));
            
            return {
              statusCode: 204,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Scheduled function for maintenance tasks
    const scheduledFunction = new lambda.Function(
      this,
      'ScheduledMaintenanceFunction',
      {
        functionName: `serverlessApp-maintenance-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        role: lambdaRole,
        code: lambda.Code.fromInline(`
        const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
        const client = new DynamoDBClient({
          region: process.env.AWS_REGION,
          ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
        });

        exports.handler = async (event) => {
          console.log('Running scheduled maintenance task');
          
          try {
            const params = {
              TableName: process.env.TABLE_NAME,
              FilterExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#status': 'status'
              },
              ExpressionAttributeValues: {
                ':status': { S: 'active' }
              }
            };

            const result = await client.send(new ScanCommand(params));
            console.log(\`Found \${result.Count} active items\`);
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Maintenance completed',
                activeItems: result.Count 
              })
            };
          } catch (error) {
            console.error('Maintenance error:', error);
            throw error;
          }
        };
      `),
        environment: {
          TABLE_NAME: dynamoTable.tableName,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'ServerlessAppAPI', {
      restApiName: `serverlessApp-api-${environmentSuffix}`,
      description: 'Serverless REST API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true,
    });

    // API Resources and Methods
    const itemsResource = api.root.addResource('items');
    const itemResource = itemsResource.addResource('{id}');

    // Create Item (POST /items)
    itemsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createItemFunction)
    );

    // List Items (GET /items)
    itemsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(readItemFunction)
    );

    // Get Item (GET /items/{id})
    itemResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(readItemFunction)
    );

    // Update Item (PUT /items/{id})
    itemResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateItemFunction)
    );

    // Delete Item (DELETE /items/{id})
    itemResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteItemFunction)
    );

    // Note: SSL Certificate and custom domain removed as DNS validation requires Route53 hosted zone
    // For production, you would need to:
    // 1. Create a Route53 hosted zone for your domain
    // 2. Use ACM with DNS validation
    // 3. Configure CloudFront with the certificate

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(
      this,
      'ServerlessAppDistribution',
      {
        defaultBehavior: {
          origin: new origins.RestApiOrigin(api),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        // domainNames: [domainName],  // Requires valid certificate
        // certificate: certificate,    // Requires DNS validation
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        logBucket: undefined, // Will use default CloudFront logging
        comment: `CloudFront distribution for serverlessApp ${environmentSuffix}`,
      }
    );

    // EventBridge Scheduler Role
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      roleName: `serverlessApp-scheduler-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });

    scheduledFunction.grantInvoke(schedulerRole);

    // EventBridge Scheduler
    new scheduler.CfnSchedule(this, 'MaintenanceSchedule', {
      name: `serverlessApp-maintenance-schedule-${environmentSuffix}`,
      description: 'Daily maintenance schedule for serverless app',
      scheduleExpression: 'rate(24 hours)',
      state: 'ENABLED',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 15,
      },
      target: {
        arn: scheduledFunction.functionArn,
        roleArn: schedulerRole.roleArn,
      },
    });

    // Store values for parent stack access
    this.apiUrl = api.url;
    this.cloudFrontDomain = distribution.distributionDomainName;
    this.tableName = dynamoTable.tableName;

    // Outputs
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: this.apiUrl,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.cloudFrontDomain,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.tableName,
      description: 'DynamoDB Table Name',
    });

    // Custom domain output removed as certificate is not configured
    // new cdk.CfnOutput(this, 'CustomDomainName', {
    //   value: domainName,
    //   description: 'Custom Domain Name',
    // });
  }
}
