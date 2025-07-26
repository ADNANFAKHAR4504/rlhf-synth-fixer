// lib/image-processing-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

// cdk.json
// {
//   "app": "npx ts-node dev"
// }

// package.json
// {
//   "name": "image-processing-pipeline",
//   "version": "1.0.0",
//   "scripts": {
//     "build": "tsc",
//     "cdk": "cdk"
//   },
//   "dependencies": {
//     "aws-cdk-lib": "^2.0.0",
//     "constructs": "^10.0.0",
//     "source-map-support": "^0.5.21"
//   },
//   "devDependencies": {
//     "@types/node": "^18.0.0",
//     "aws-cdk": "^2.0.0",
//     "typescript": "^4.9.5"
//   }
// }

export interface TapStackProps extends StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, { ...props, env: { region: 'us-east-1' } });

    // const suffix = props.environmentSuffix;

    const { environmentSuffix } = props;

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

    // Lambda function
    const imageProcessor = new lambda.Function(this, 'ImageProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'imageProcessor.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        IMAGE_BUCKET: imageBucket.bucketName,
      },
      role: lambdaRole,
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

    // Output SNS topic ARN
    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
    });
  }
}

// lambda/imageProcessor.ts
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface ImageRequest {
  imageKey: string;
  metadata: Record<string, string>;
}

const snsClient = new SNSClient({});
const TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN || '';

export const handler = async (event: ImageRequest): Promise<void> => {
  try {
    const { imageKey, metadata } = event;

    // Simulate image processing
    console.log(`Processing image: ${imageKey} with metadata:`, metadata);

    // Publish success notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: TOPIC_ARN,
        Message: `Successfully processed image: ${imageKey}`,
      })
    );
  } catch (error) {
    console.error('Processing failed:', error);
  }
};
