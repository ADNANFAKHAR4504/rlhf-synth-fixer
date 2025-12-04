import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, environment } = props;

    // Source S3 bucket for image uploads
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `image-source-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(90),
          id: 'CleanupOldImages',
        },
      ],
    });

    // Destination S3 bucket for thumbnails
    const thumbnailBucket = new s3.Bucket(this, 'ThumbnailBucket', {
      bucketName: `image-thumbnail-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(90),
          id: 'CleanupOldThumbnails',
        },
      ],
    });

    // CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'ProcessImageLogGroup', {
      logGroupName: `/aws/lambda/process-image-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // IAM role for Lambda execution
    const lambdaRole = new iam.Role(this, 'ProcessImageRole', {
      roleName: `process-image-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for image processing Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant specific S3 permissions to Lambda role (least privilege)
    sourceBucket.grantRead(lambdaRole);
    thumbnailBucket.grantWrite(lambdaRole);

    // Lambda function for image processing
    const processImageFunction = new lambda.Function(
      this,
      'ProcessImageFunction',
      {
        functionName: `process-image-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda', 'process-image')
        ),
        role: lambdaRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        environment: {
          THUMBNAIL_BUCKET: thumbnailBucket.bucketName,
          ENVIRONMENT: environment,
          LOG_LEVEL: 'INFO',
        },
        logGroup: logGroup,
        description: 'Processes uploaded images and generates thumbnails',
        reservedConcurrentExecutions: 10,
      }
    );

    // Add S3 event notification to trigger Lambda on object creation
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processImageFunction),
      {
        suffix: '.jpg',
      }
    );

    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processImageFunction),
      {
        suffix: '.jpeg',
      }
    );

    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processImageFunction),
      {
        suffix: '.png',
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Name of the source S3 bucket for image uploads',
      exportName: `SourceBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ThumbnailBucketName', {
      value: thumbnailBucket.bucketName,
      description: 'Name of the destination S3 bucket for thumbnails',
      exportName: `ThumbnailBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessImageFunctionArn', {
      value: processImageFunction.functionArn,
      description: 'ARN of the image processing Lambda function',
      exportName: `ProcessImageFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group for Lambda function',
      exportName: `LogGroupName-${environmentSuffix}`,
    });

    // Tags for resource management
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Project', 'MediaProcessingPipeline');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
