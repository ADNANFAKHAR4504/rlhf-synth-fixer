import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as kms from 'aws-cdk-lib/aws-kms';

// Import your stacks here
// import { MyStack } from './my-stack';

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

    // Import all resources from serverless-infrastructure-stack here
    // (temporarily in one stack to avoid cross-stack reference issues)

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

    // Lambda Functions (shortened for brevity - use inline code for LocalStack)
    const lambdaCode = `
const { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, UpdateItemCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost") || process.env.AWS_ENDPOINT_URL?.includes("4566");
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(isLocalStack && { endpoint: process.env.AWS_ENDPOINT_URL })
});

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Success' })
  };
};`;

    const createItemFunction = new lambda.Function(this, 'CreateItemFunction', {
      functionName: `serverlessApp-create-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(lambdaCode),
      environment: { TABLE_NAME: dynamoTable.tableName },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Create additional Lambda functions similarly (read, update, delete, maintenance)
    const readItemFunction = new lambda.Function(this, 'ReadItemFunction', {
      functionName: `serverlessApp-read-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(lambdaCode),
      environment: { TABLE_NAME: dynamoTable.tableName },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const updateItemFunction = new lambda.Function(this, 'UpdateItemFunction', {
      functionName: `serverlessApp-update-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(lambdaCode),
      environment: { TABLE_NAME: dynamoTable.tableName },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const deleteItemFunction = new lambda.Function(this, 'DeleteItemFunction', {
      functionName: `serverlessApp-delete-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(lambdaCode),
      environment: { TABLE_NAME: dynamoTable.tableName },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const scheduledFunction = new lambda.Function(
      this,
      'ScheduledMaintenanceFunction',
      {
        functionName: `serverlessApp-maintenance-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        role: lambdaRole,
        code: lambda.Code.fromInline(lambdaCode),
        environment: { TABLE_NAME: dynamoTable.tableName },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
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

    itemsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createItemFunction)
    );
    itemsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(readItemFunction)
    );
    itemResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(readItemFunction)
    );
    itemResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateItemFunction)
    );
    itemResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteItemFunction)
    );

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
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
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

    // Outputs
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}
