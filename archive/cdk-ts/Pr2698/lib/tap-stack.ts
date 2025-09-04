import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  trustedIpRanges: string[];
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix, default to 'dev' if not provided
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'ServerlessAppEncryptionKey', {
      description: `KMS key for ServerlessApp encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create S3 bucket for logs
    const logsBucket = new s3.Bucket(this, 'ServerlessAppLogsBucket', {
      bucketName: `serverless-app-logs-${this.account}-${this.region}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
    });

    // Create DynamoDB table
    const dynamoTable = new dynamodb.Table(this, 'ServerlessAppTable', {
      tableName: `ServerlessApp-ApplicationState-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags to DynamoDB table
    cdk.Tags.of(dynamoTable).add('Environment', environmentSuffix);
    cdk.Tags.of(dynamoTable).add('Application', 'ServerlessApp');

    // Create IAM role for Lambda functions
    const lambdaRole = new iam.Role(this, 'ServerlessAppLambdaRole', {
      roleName: `ServerlessApp-LambdaExecutionRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [dynamoTable.tableArn],
            }),
          ],
        }),
        S3LogsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:PutObjectAcl'],
              resources: [`${logsBucket.bucketArn}/*`],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Apply tags to IAM role
    cdk.Tags.of(lambdaRole).add('Environment', environmentSuffix);
    cdk.Tags.of(lambdaRole).add('Application', 'ServerlessApp');

    // Create Lambda function for handling API requests
    const apiHandlerFunction = new lambda.Function(
      this,
      'ServerlessApp-ApiHandler',
      {
        functionName: `ServerlessApp-ApiHandler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
        const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
        const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

        const dynamoClient = new DynamoDBClient({});
        const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
        const s3Client = new S3Client({});

        exports.handler = async (event, context) => {
          const logEntry = {
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId,
            event: JSON.stringify(event),
          };

          try {
            // Log to S3
            await s3Client.send(new PutObjectCommand({
              Bucket: process.env.LOGS_BUCKET,
              Key: \`logs/\${new Date().toISOString().split('T')[0]}/\${context.awsRequestId}.json\`,
              Body: JSON.stringify(logEntry),
              ContentType: 'application/json',
            }));

            const httpMethod = event.httpMethod;
            const path = event.path;

            let response;

            switch (httpMethod) {
              case 'GET':
                if (path === '/health') {
                  response = {
                    statusCode: 200,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
                  };
                } else if (path.startsWith('/items/')) {
                  const id = path.split('/')[2];
                  const result = await dynamoDocClient.send(new GetCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Key: { id },
                  }));
                  
                  response = {
                    statusCode: result.Item ? 200 : 404,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(result.Item || { error: 'Item not found' }),
                  };
                } else {
                  response = {
                    statusCode: 404,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({ error: 'Not found' }),
                  };
                }
                break;

              case 'POST':
                if (path === '/items') {
                  const body = JSON.parse(event.body || '{}');
                  const id = body.id || \`item-\${Date.now()}\`;
                  const item = {
                    id,
                    ...body,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };

                  await dynamoDocClient.send(new PutCommand({
                    TableName: process.env.DYNAMODB_TABLE,
                    Item: item,
                  }));

                  response = {
                    statusCode: 201,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(item),
                  };
                } else {
                  response = {
                    statusCode: 404,
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({ error: 'Not found' }),
                  };
                }
                break;

              default:
                response = {
                  statusCode: 405,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  },
                  body: JSON.stringify({ error: 'Method not allowed' }),
                };
            }

            return response;
          } catch (error) {
            console.error('Error:', error);
            
            // Log error to S3 with error handling
            try {
              await s3Client.send(new PutObjectCommand({
                Bucket: process.env.LOGS_BUCKET,
                Key: \`errors/\${new Date().toISOString().split('T')[0]}/\${context.awsRequestId}.json\`,
                Body: JSON.stringify({
                  ...logEntry,
                  error: error.message,
                  stack: error.stack,
                }),
                ContentType: 'application/json',
              }));
            } catch (logError) {
              console.error('Failed to log error to S3:', logError);
            }

            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ error: 'Internal server error' }),
            };
          }
        };
      `),
        timeout: cdk.Duration.seconds(60),
        role: lambdaRole,
        environment: {
          DYNAMODB_TABLE: dynamoTable.tableName,
          LOGS_BUCKET: logsBucket.bucketName,
          KMS_KEY_ID: encryptionKey.keyId,
        },
        environmentEncryption: encryptionKey,
        retryAttempts: 2,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Apply tags to API handler function
    cdk.Tags.of(apiHandlerFunction).add('Environment', environmentSuffix);
    cdk.Tags.of(apiHandlerFunction).add('Application', 'ServerlessApp');

    // Create Lambda function for background processing
    const backgroundProcessorFunction = new lambda.Function(
      this,
      'ServerlessApp-BackgroundProcessor',
      {
        functionName: `ServerlessApp-BackgroundProcessor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
        const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
        const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

        const dynamoClient = new DynamoDBClient({});
        const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
        const s3Client = new S3Client({});

        exports.handler = async (event, context) => {
          const logEntry = {
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId,
            event: JSON.stringify(event),
          };

          try {
            // Log to S3
            await s3Client.send(new PutObjectCommand({
              Bucket: process.env.LOGS_BUCKET,
              Key: \`background-logs/\${new Date().toISOString().split('T')[0]}/\${context.awsRequestId}.json\`,
              Body: JSON.stringify(logEntry),
              ContentType: 'application/json',
            }));

            // Simulate background processing
            const result = await dynamoDocClient.send(new ScanCommand({
              TableName: process.env.DYNAMODB_TABLE,
            }));

            console.log(\`Processed \${result.Items?.length || 0} items\`);

            return {
              statusCode: 200,
              processedItems: result.Items?.length || 0,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            console.error('Background processing error:', error);
            
            // Log error to S3 with error handling
            try {
              await s3Client.send(new PutObjectCommand({
                Bucket: process.env.LOGS_BUCKET,
                Key: \`background-errors/\${new Date().toISOString().split('T')[0]}/\${context.awsRequestId}.json\`,
                Body: JSON.stringify({
                  ...logEntry,
                  error: error.message,
                  stack: error.stack,
                }),
                ContentType: 'application/json',
              }));
            } catch (logError) {
              console.error('Failed to log error to S3:', logError);
            }

            throw error;
          }
        };
      `),
        timeout: cdk.Duration.seconds(60),
        role: lambdaRole,
        environment: {
          DYNAMODB_TABLE: dynamoTable.tableName,
          LOGS_BUCKET: logsBucket.bucketName,
          KMS_KEY_ID: encryptionKey.keyId,
        },
        environmentEncryption: encryptionKey,
        retryAttempts: 2,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Apply tags to background processor function
    cdk.Tags.of(backgroundProcessorFunction).add(
      'Environment',
      environmentSuffix
    );
    cdk.Tags.of(backgroundProcessorFunction).add(
      'Application',
      'ServerlessApp'
    );

    // Create API Gateway with IP restrictions
    const api = new apigateway.RestApi(this, 'ServerlessAppApi', {
      restApiName: `ServerlessApp-API-${environmentSuffix}`,
      description: `Serverless Application API - ${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              IpAddress: {
                'aws:SourceIp': props.trustedIpRanges,
              },
            },
          }),
        ],
      }),
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create API Gateway integrations
    const apiIntegration = new apigateway.LambdaIntegration(
      apiHandlerFunction,
      {
        requestTemplates: {
          'application/json': '{ "statusCode": "200" }',
        },
        proxy: true,
      }
    );

    // Add API routes
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', apiIntegration);

    const itemsResource = api.root.addResource('items');
    itemsResource.addMethod('GET', apiIntegration);
    itemsResource.addMethod('POST', apiIntegration);

    const itemResource = itemsResource.addResource('{id}');
    itemResource.addMethod('GET', apiIntegration);

    // Add CORS support
    api.root.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    });

    // Create CloudWatch alarms for monitoring
    apiHandlerFunction
      .metricErrors({
        period: cdk.Duration.minutes(5),
      })
      .createAlarm(this, 'ServerlessApp-ErrorAlarm', {
        alarmName: `ServerlessApp-ErrorAlarm-${environmentSuffix}`,
        threshold: 5,
        evaluationPeriods: 2,
        alarmDescription: `Lambda function error rate is too high - ${environmentSuffix}`,
      });

    apiHandlerFunction
      .metricDuration({
        period: cdk.Duration.minutes(5),
      })
      .createAlarm(this, 'ServerlessApp-DurationAlarm', {
        alarmName: `ServerlessApp-DurationAlarm-${environmentSuffix}`,
        threshold: 30000, // 30 seconds
        evaluationPeriods: 2,
        alarmDescription: `Lambda function duration is too high - ${environmentSuffix}`,
      });

    // Apply tags to all resources in the stack
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Application', 'ServerlessApp');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');

    // Output important information
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ServerlessApp-ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `ServerlessApp-DynamoDBTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
      exportName: `ServerlessApp-S3BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `ServerlessApp-KMSKeyId-${environmentSuffix}`,
    });
  }
}
