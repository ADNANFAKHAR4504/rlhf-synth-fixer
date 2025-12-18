# Advanced Serverless Microservices Platform - AWS CDK Implementation

I'll provide a comprehensive, production-ready AWS CDK application that meets all your requirements. This implementation follows modern cloud-native patterns and best practices for serverless microservices.

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

// Configuration interfaces
interface DatabaseConfig {
  billingMode: 'PROVISIONED' | 'PAY_PER_REQUEST';
  readCapacity?: number;
  writeCapacity?: number;
}

interface EnvironmentConfig {
  environment: string;
  regions: string[];
  database: DatabaseConfig;
  enableFeatureX: boolean;
  logRetentionDays: number;
  removalPolicy: 'RETAIN' | 'DESTROY';
}

// Default configuration
const DEFAULT_CONFIG: EnvironmentConfig = {
  environment: 'dev',
  regions: ['us-east-1'],
  database: {
    billingMode: 'PROVISIONED',
    readCapacity: 5,
    writeCapacity: 5
  },
  enableFeatureX: false,
  logRetentionDays: 7,
  removalPolicy: 'DESTROY'
};

class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & { config: EnvironmentConfig; region: string }) {
    super(scope, id, props);

    const { config, region } = props;
    const envSuffix = `${config.environment}-${region}`;
    const isProd = config.environment === 'prod';
    
    // Determine removal policy based on environment
    const removalPolicy = isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for TAP platform - ${envSuffix}`,
      enableKeyRotation: true,
      removalPolicy
    });

    // DynamoDB Table
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: `products-${envSuffix}`,
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: config.database.billingMode === 'PROVISIONED' 
        ? dynamodb.BillingMode.PROVISIONED 
        : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: config.database.billingMode === 'PROVISIONED' ? config.database.readCapacity : undefined,
      writeCapacity: config.database.billingMode === 'PROVISIONED' ? config.database.writeCapacity : undefined,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: isProd,
      removalPolicy
    });

    // SNS Topic for event notifications
    const eventTopic = new sns.Topic(this, 'EventTopic', {
      topicName: `product-events-${envSuffix}`,
      displayName: `Product Events Topic - ${envSuffix}`,
      masterKey: encryptionKey
    });

    // SQS Queue for background processing
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `order-processing-${envSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14)
    });

    // Lambda Log Group with explicit retention
    const lambdaLogGroup = new logs.LogGroup(this, 'ProductLambdaLogGroup', {
      logGroupName: `/aws/lambda/product-service-${envSuffix}`,
      retention: logs.RetentionDays.SEVEN,
      removalPolicy
    });

    // Lambda IAM Role with least privilege
    const lambdaRole = new iam.Role(this, 'ProductLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
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
                'dynamodb:Scan'
              ],
              resources: [productsTable.tableArn]
            })
          ]
        }),
        SNSPublish: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [eventTopic.topicArn]
            })
          ]
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey'
              ],
              resources: [encryptionKey.keyArn]
            })
          ]
        })
      }
    });

    // Lambda Function
    const productLambda = new lambda.Function(this, 'ProductLambda', {
      functionName: `product-service-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      logGroup: lambdaLogGroup,
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        EVENT_TOPIC_ARN: eventTopic.topicArn,
        ENVIRONMENT: config.environment,
        REGION: region,
        ENABLE_FEATURE_X: config.enableFeatureX.toString()
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const sns = new AWS.SNS();

        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          const { httpMethod, pathParameters, body } = event;
          const tableName = process.env.PRODUCTS_TABLE_NAME;
          const topicArn = process.env.EVENT_TOPIC_ARN;
          const featureXEnabled = process.env.ENABLE_FEATURE_X === 'true';
          
          try {
            if (httpMethod === 'GET') {
              if (pathParameters && pathParameters.productId) {
                // Get specific product
                const result = await dynamodb.get({
                  TableName: tableName,
                  Key: { productId: pathParameters.productId }
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.Item || {})
                };
              } else {
                // List all products
                const result = await dynamodb.scan({
                  TableName: tableName
                }).promise();
                
                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.Items || [])
                };
              }
            } else if (httpMethod === 'POST') {
              const productData = JSON.parse(body);
              const productId = productData.productId || \`product-\${Date.now()}\`;
              
              const item = {
                productId,
                ...productData,
                createdAt: new Date().toISOString(),
                featureXEnabled
              };
              
              await dynamodb.put({
                TableName: tableName,
                Item: item
              }).promise();
              
              // Publish event
              await sns.publish({
                TopicArn: topicArn,
                Message: JSON.stringify({
                  eventType: 'ProductCreated',
                  productId,
                  timestamp: new Date().toISOString()
                }),
                Subject: 'Product Created Event'
              }).promise();
              
              return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
              };
            }
            
            return {
              statusCode: 405,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Method not allowed' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Internal server error' })
            };
          }
        };
      `)
    });

    // API Gateway Log Group
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/product-api-${envSuffix}`,
      retention: logs.RetentionDays.SEVEN,
      removalPolicy
    });

    // API Gateway IAM Role for logging
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    // Configure API Gateway Account settings
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayRole.roleArn
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: `product-api-${envSuffix}`,
      description: `Product API for ${envSuffix}`,
      deployOptions: {
        stageName: config.environment,
        accessLogDestination: apigateway.LogGroupLogDestination.fromLogGroup(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true
        }),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(productLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // API Resources and Methods
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', lambdaIntegration);
    productsResource.addMethod('POST', lambdaIntegration);

    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod('GET', lambdaIntegration);

    // CloudWatch Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${envSuffix}`,
      alarmDescription: `Lambda function errors for ${envSuffix}`,
      metric: productLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `api-5xx-errors-${envSuffix}`,
      alarmDescription: `API Gateway 5xx errors for ${envSuffix}`,
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
      alarmName: `dynamo-throttle-${envSuffix}`,
      alarmDescription: `DynamoDB throttled reads for ${envSuffix}`,
      metric: productsTable.metricThrottledRequestsForOperations({
        operations: [dynamodb.Operation.GET_ITEM, dynamodb.Operation.QUERY, dynamodb.Operation.SCAN],
        period: cdk.Duration.minutes(5),
        statistic: 'Sum'
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `api-url-${envSuffix}`
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: productsTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `table-name-${envSuffix}`
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: eventTopic.topicArn,
      description: 'SNS Topic ARN',
      exportName: `topic-arn-${envSuffix}`
    });

    new cdk.CfnOutput(this, 'SqsQueueUrl', {
      value: processingQueue.queueUrl,
      description: 'SQS Queue URL',
      exportName: `queue-url-${envSuffix}`
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: productLambda.functionName,
      description: 'Lambda Function Name',
      exportName: `lambda-name-${envSuffix}`
    });
  }
}

// Main application
const app = new cdk.App();

// Get configuration from context
const contextConfig = app.node.tryGetContext('config') || {};
const environment = app.node.tryGetContext('environment') || 'dev';

// Merge default config with context config
const config: EnvironmentConfig = {
  ...DEFAULT_CONFIG,
  ...contextConfig,
  environment
};

// Apply global tags
const globalTags = {
  Project: 'TAP-Platform',
  Environment: config.environment,
  Owner: 'CloudEngineering',
  CostCenter: 'Engineering',
  Repository: 'tap-serverless-platform',
  Author: 'Senior-Cloud-Engineer'
};

Object.entries(globalTags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// Deploy to multiple regions
config.regions.forEach(region => {
  const stackId = `TapStack-${config.environment}-${region}`;
  
  new TapStack(app, stackId, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region
    },
    config,
    region,
    stackName: stackId,
    description: `TAP Serverless Platform Stack for ${config.environment} in ${region}`
  });
});

// Example cdk.context.json structure:
/*
{
  "config": {
    "environment": "prod",
    "regions": ["us-east-1", "us-west-2"],
    "database": {
      "billingMode": "PROVISIONED",
      "readCapacity": 20,
      "writeCapacity": 20
    },
    "enableFeatureX": true,
    "logRetentionDays": 30,
    "removalPolicy": "RETAIN"
  }
}
*/
```
