import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
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

    // Apply Environment=Production tag to all resources in stack
    cdk.Tags.of(this).add('Environment', 'Production');

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP application encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create S3 bucket with encryption and security settings
    const bucket = new s3.Bucket(this, 'TapDataBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Create DynamoDB table with encryption
    const table = new dynamodb.Table(this, 'TapTable', {
      tableName: `tap-table-${environmentSuffix}-${this.region}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SNS topic with encryption
    const topic = new sns.Topic(this, 'TapNotificationTopic', {
      topicName: `tap-notifications-${environmentSuffix}-${this.region}`,
      displayName: 'TAP Application Notifications',
      masterKey: kmsKey,
    });

    // Create SQS Dead Letter Queue with encryption
    const deadLetterQueue = new sqs.Queue(this, 'TapDeadLetterQueue', {
      queueName: `tap-dlq-${environmentSuffix}-${this.region}`,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      visibilityTimeout: cdk.Duration.minutes(5),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Parameter Store parameters for Lambda configuration
    const dbTableParam = new ssm.StringParameter(this, 'TapTableNameParam', {
      parameterName: `/tap/config/table-name-${environmentSuffix}`,
      stringValue: table.tableName,
      description: 'DynamoDB table name for TAP application',
      tier: ssm.ParameterTier.STANDARD,
    });

    const s3BucketParam = new ssm.StringParameter(this, 'TapBucketNameParam', {
      parameterName: `/tap/config/bucket-name-${environmentSuffix}`,
      stringValue: bucket.bucketName,
      description: 'S3 bucket name for TAP application',
      tier: ssm.ParameterTier.STANDARD,
    });

    const snsTopicParam = new ssm.StringParameter(this, 'TapTopicArnParam', {
      parameterName: `/tap/config/sns-topic-arn-${environmentSuffix}`,
      stringValue: topic.topicArn,
      description: 'SNS topic ARN for TAP notifications',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Create IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      roleName: `TapLambdaRole-${environmentSuffix}-${this.region}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'IAM role for TAP Lambda function with least privilege access',
    });

    // Attach AWS managed policy for basic Lambda execution
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    // Create custom policy for specific resource access
    const lambdaCustomPolicy = new iam.Policy(this, 'TapLambdaCustomPolicy', {
      policyName: `TapLambdaCustomPolicy-${environmentSuffix}-${this.region}`,
      statements: [
        // S3 permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [`${bucket.bucketArn}/*`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [bucket.bucketArn],
        }),
        // DynamoDB permissions
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
          resources: [table.tableArn],
        }),
        // SNS permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: [topic.topicArn],
        }),
        // Systems Manager Parameter Store permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ssm:GetParameter',
            'ssm:GetParameters',
            'ssm:GetParametersByPath',
          ],
          resources: [
            `arn:aws:ssm:${this.region}:${this.account}:parameter/tap/config/*`,
          ],
        }),
        // KMS permissions for decryption
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:DescribeKey'],
          resources: [kmsKey.keyArn],
        }),
        // SQS permissions for DLQ
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sqs:SendMessage'],
          resources: [deadLetterQueue.queueArn],
        }),
      ],
    });

    lambdaRole.attachInlinePolicy(lambdaCustomPolicy);

    // Create Lambda function with inline code for QA synthesis
    const lambdaCode = `
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };
    
    try {
        console.log('Processing request:', JSON.stringify(event));
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Data processed successfully',
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Internal server error'
            })
        };
    }
};`;

    const lambdaFunction = new lambda.Function(this, 'TapLambdaFunction', {
      functionName: `tap-function-${environmentSuffix}-${this.region}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(lambdaCode),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        REGION: this.region,
        TABLE_NAME_PARAM: dbTableParam.parameterName,
        BUCKET_NAME_PARAM: s3BucketParam.parameterName,
        SNS_TOPIC_PARAM: snsTopicParam.parameterName,
      },
      deadLetterQueue: deadLetterQueue,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'TapApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/tap-api-${environmentSuffix}-${this.region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create API Gateway with CloudWatch logging
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `tap-api-${environmentSuffix}-${this.region}`,
      description: 'TAP Serverless API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
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
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Create API Gateway integration with Lambda
    const integration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
        {
          statusCode: '400',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
      ],
    });

    // Add POST method to API Gateway
    const dataResource = api.root.addResource('data');
    dataResource.addMethod('POST', integration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '400',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'URL of the API Gateway',
      exportName: `TapApiUrl-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `TapS3Bucket-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'Name of the DynamoDB table',
      exportName: `TapDynamoTable-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `TapLambdaFunction-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: topic.topicArn,
      description: 'ARN of the SNS topic',
      exportName: `TapSNSTopic-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'SQSDeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'URL of the SQS dead letter queue',
      exportName: `TapSQSDLQ-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'ID of the KMS key',
      exportName: `TapKMSKey-${environmentSuffix}-${this.region}`,
    });
  }
}
