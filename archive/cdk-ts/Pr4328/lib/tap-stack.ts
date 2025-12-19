import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption at rest (FERPA Compliance)
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for learning platform - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant CloudWatch Logs permission to use the KMS key
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
          },
        },
      })
    );

    // DynamoDB Table for educational content metadata
    const contentTable = new dynamodb.Table(this, 'ContentTable', {
      tableName: `learning-content-${environmentSuffix}`,
      partitionKey: {
        name: 'contentId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      pointInTimeRecovery: true, // Failure recovery feature
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by content type
    contentTable.addGlobalSecondaryIndex({
      indexName: 'ContentTypeIndex',
      partitionKey: {
        name: 'contentType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // S3 Bucket for educational content storage
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `learning-content-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'intelligent-tiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Dead Letter Queue for failed Lambda executions
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `learning-api-dlq-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Lambda execution role with least privilege (FERPA Compliance)
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `learning-api-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant specific permissions to Lambda role
    contentTable.grantReadWriteData(lambdaRole);
    encryptionKey.grantEncryptDecrypt(lambdaRole);

    // CloudWatch Log Group with encryption (FERPA Compliance)
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/learning-api-${environmentSuffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for content API
    const contentHandler = new lambda.Function(this, 'ContentHandler', {
      functionName: `learning-api-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: contentTable.tableName,
        ENVIRONMENT: environmentSuffix,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      deadLetterQueue: dlq,
      retryAttempts: 2, // Failure recovery feature
      logGroup: logGroup,
    });

    // CloudWatch Alarms for failure detection
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `learning-api-errors-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function has errors',
      metric: contentHandler.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `learning-api-throttles-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function is throttled',
      metric: contentHandler.metricThrottles({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // API Gateway REST API with API key authentication
    const api = new apigateway.RestApi(this, 'LearningApi', {
      restApiName: `learning-api-${environmentSuffix}`,
      description: 'Serverless API for educational content delivery',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      cloudWatchRole: true,
    });

    // API Key for authentication (FERPA Compliance)
    const apiKey = api.addApiKey('LearningApiKey', {
      apiKeyName: `learning-api-key-${environmentSuffix}`,
      description: 'API key for educational content access',
    });

    // Usage Plan with throttling (High Availability)
    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `learning-api-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for educational content API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 100000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(contentHandler, {
      proxy: true,
    });

    // API Resources and Methods
    const content = api.root.addResource('content');

    // GET /content - List all content
    content.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // POST /content - Create new content
    content.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '201',
        },
        {
          statusCode: '400',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // GET /content/{id} - Get specific content
    const contentById = content.addResource('{id}');
    contentById.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '404',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // PUT /content/{id} - Update content
    contentById.addMethod('PUT', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
        },
        {
          statusCode: '404',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // DELETE /content/{id} - Delete content
    contentById.addMethod('DELETE', lambdaIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '204',
        },
        {
          statusCode: '404',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `learning-api-dashboard-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [contentHandler.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [contentHandler.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [contentHandler.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          api.metricCount(),
          api.metricClientError(),
          api.metricServerError(),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Learning API URL',
      exportName: `${environmentSuffix}-api-url`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `${environmentSuffix}-api-key-id`,
    });

    new cdk.CfnOutput(this, 'ContentTableName', {
      value: contentTable.tableName,
      description: 'DynamoDB Content Table Name',
      exportName: `${environmentSuffix}-content-table-name`,
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: contentBucket.bucketName,
      description: 'S3 Content Bucket Name',
      exportName: `${environmentSuffix}-content-bucket-name`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: contentHandler.functionName,
      description: 'Lambda Function Name',
      exportName: `${environmentSuffix}-lambda-function-name`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: `${environmentSuffix}-dlq-url`,
    });
  }
}
