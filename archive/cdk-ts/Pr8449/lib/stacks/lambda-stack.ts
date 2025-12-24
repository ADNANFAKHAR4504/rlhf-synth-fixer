import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface LambdaStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  imageBucket: s3.Bucket;
  detectionTable: dynamodb.Table;
  notificationTopic: sns.Topic;
}

export class LambdaStack extends cdk.NestedStack {
  public readonly imageProcessorFunction: lambda.Function;
  public readonly fileManagerFunction: lambda.Function;
  public readonly notificationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      imageBucket,
      detectionTable,
      notificationTopic,
    } = props;

    // Common Lambda configuration for security and performance
    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X, // Latest stable Node.js version
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      architecture: lambda.Architecture.ARM_64, // Better price-performance
      environment: {
        ENVIRONMENT: environmentSuffix,
        BUCKET_NAME: imageBucket.bucketName,
        TABLE_NAME: detectionTable.tableName,
        REGION: cdk.Aws.REGION,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1', // Optimize SDK v3 connections
        AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL || '', // LocalStack endpoint
        LOCALSTACK_HOSTNAME:
          process.env.LOCALSTACK_HOSTNAME || 'localhost:4566',
      },
      // Removed reservedConcurrentExecutions to avoid account limits
    };

    // Log groups for Lambda functions
    const imageProcessorLogGroup = new logs.LogGroup(
      this,
      'ImageProcessorLogGroup',
      {
        logGroupName: `/aws/lambda/serverlessapp-image-processor-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const fileManagerLogGroup = new logs.LogGroup(this, 'FileManagerLogGroup', {
      logGroupName: `/aws/lambda/serverlessapp-file-manager-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const notificationLogGroup = new logs.LogGroup(
      this,
      'NotificationLogGroup',
      {
        logGroupName: `/aws/lambda/serverlessapp-notification-service-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Image Processor Lambda - Main processing function
    this.imageProcessorFunction = new lambda.Function(this, 'ImageProcessor', {
      ...commonLambdaProps,
      functionName: `serverlessapp-image-processor-${environmentSuffix}`,
      code: lambda.Code.fromAsset('lib/lambdas/image-processor'),
      handler: 'index.handler',
      memorySize: 1024, // Higher memory for image processing
      timeout: cdk.Duration.minutes(10),
      logGroup: imageProcessorLogGroup,
      environment: {
        ...commonLambdaProps.environment,
        FILE_MANAGER_FUNCTION: `serverlessapp-file-manager-${environmentSuffix}`,
        NOTIFICATION_FUNCTION: `serverlessapp-notification-service-${environmentSuffix}`,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
        BUCKET_NAME: imageBucket.bucketName,
        TABLE_NAME: detectionTable.tableName,
        REGION: cdk.Stack.of(this).region,
        ENVIRONMENT: environmentSuffix,
      },
    });

    // File Manager Lambda - Handles file organization
    this.fileManagerFunction = new lambda.Function(this, 'FileManager', {
      ...commonLambdaProps,
      functionName: `serverlessapp-file-manager-${environmentSuffix}`,
      code: lambda.Code.fromAsset('lib/lambdas/file-manager'),
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.minutes(2),
      logGroup: fileManagerLogGroup,
    });

    // Notification Service Lambda - Handles uncertain classification alerts
    this.notificationFunction = new lambda.Function(
      this,
      'NotificationService',
      {
        ...commonLambdaProps,
        functionName: `serverlessapp-notification-service-${environmentSuffix}`,
        code: lambda.Code.fromAsset('lib/lambdas/notification-service'),
        handler: 'index.handler',
        memorySize: 256,
        timeout: cdk.Duration.minutes(1),
        logGroup: notificationLogGroup,
        environment: {
          ...commonLambdaProps.environment,
          SNS_TOPIC_ARN: notificationTopic.topicArn,
        },
      }
    );

    // Grant S3 permissions
    imageBucket.grantReadWrite(this.imageProcessorFunction);
    imageBucket.grantReadWrite(this.fileManagerFunction);
    imageBucket.grantRead(this.notificationFunction);

    // Grant DynamoDB permissions
    detectionTable.grantReadWriteData(this.imageProcessorFunction);
    detectionTable.grantReadData(this.fileManagerFunction);
    detectionTable.grantReadData(this.notificationFunction);

    // Grant SNS permissions
    notificationTopic.grantPublish(this.imageProcessorFunction);
    notificationTopic.grantPublish(this.notificationFunction);

    // Grant Rekognition permissions to image processor (FREE TIER ONLY)
    this.imageProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rekognition:DetectLabels', // Only free tier API - 5,000 images/month
          // Note: DetectModerationLabels intentionally excluded to save API quota
          // Note: No custom model actions to avoid additional charges
        ],
        resources: ['*'],
      })
    );

    // Grant CloudWatch PutMetricData permissions to image processor
    this.imageProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Grant SSM parameter access for Rekognition configuration
    this.imageProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/serverlessapp/${environmentSuffix}/rekognition/*`,
        ],
      })
    );

    // Grant CloudWatch metrics permissions to all Lambda functions
    const cloudWatchMetricsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
    });

    this.imageProcessorFunction.addToRolePolicy(cloudWatchMetricsPolicy);
    this.fileManagerFunction.addToRolePolicy(cloudWatchMetricsPolicy);
    this.notificationFunction.addToRolePolicy(cloudWatchMetricsPolicy);

    // Grant Lambda invoke permissions for cross-function calls
    this.fileManagerFunction.grantInvoke(this.imageProcessorFunction);
    this.notificationFunction.grantInvoke(this.imageProcessorFunction);

    // Enable X-Ray tracing for observability
    this.imageProcessorFunction.addEnvironment(
      'POWERTOOLS_SERVICE_NAME',
      'image-processor'
    );
    this.fileManagerFunction.addEnvironment(
      'POWERTOOLS_SERVICE_NAME',
      'file-manager'
    );
    this.notificationFunction.addEnvironment(
      'POWERTOOLS_SERVICE_NAME',
      'notification-service'
    );

    // Add resource tags
    cdk.Tags.of(this).add('Component', 'Compute');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
