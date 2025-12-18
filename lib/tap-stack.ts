import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';

export interface TapStackProps extends StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, { ...props, env: { region: 'us-east-1' } });

    // Reference existing S3 bucket
    const existingBucketName =
      this.node.tryGetContext('existingBucketName') || 'my-default-bucket';
    const imageBucket = s3.Bucket.fromBucketName(
      this,
      'ExistingImageBucket',
      existingBucketName
    );

    // Create SNS topic
    const notificationTopic = new sns.Topic(
      this,
      'ImageProcessingNotifications',
      {
        displayName: 'Image Processing Completion Notifications',
      }
    );

    // Set removal policy for test environments (LocalStack and CI/CD)
    // This allows proper cleanup after testing
    notificationTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'ImageProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant permissions
    imageBucket.grantReadWrite(lambdaRole);
    notificationTopic.grantPublish(lambdaRole);

    // Lambda function using NodejsFunction for automatic TypeScript bundling
    const imageProcessor = new NodejsFunction(this, 'ImageProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lib/lambda/imageProcessor.ts',
      environment: {
        IMAGE_BUCKET: imageBucket.bucketName,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
      role: lambdaRole,
      bundling: {
        minify: false,
        sourceMap: true,
        externalModules: [],
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ImageProcessingApi', {
      restApiName: 'ImageProcessingService',
      description: 'API Gateway for image processing requests',
    });

    const imageResource = api.root.addResource('process');
    imageResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(imageProcessor)
    );

    // Outputs for integration tests
    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
    });

    new cdk.CfnOutput(this, 'ImageProcessingApiRestApiId', {
      value: api.restApiId,
    });

    new cdk.CfnOutput(this, 'ImageProcessingApiUrl', {
      value: api.url,
    });

    new cdk.CfnOutput(this, 'ImageProcessorFunctionName', {
      value: imageProcessor.functionName,
    });
  }
}
