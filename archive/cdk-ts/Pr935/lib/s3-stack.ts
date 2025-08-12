import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface S3StackProps extends cdk.StackProps {
  environmentSuffix: string;
  triggerFunction: lambda.Function;
}

export class S3Stack extends cdk.Stack {
  public readonly triggerBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    this.triggerBucket = new s3.Bucket(this, 'ObjectTriggerBucket', {
      bucketName: `object-trigger-bucket-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      autoDeleteObjects: true, // For development only
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Enable event notifications
      eventBridgeEnabled: false, // Using direct Lambda trigger
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Add S3 event notification to trigger Lambda function on object creation
    this.triggerBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(props.triggerFunction)
      // No filter needed - trigger on all objects
    );

    // Grant Lambda permission to read from this S3 bucket
    this.triggerBucket.grantRead(props.triggerFunction);

    // Add tags
    cdk.Tags.of(this.triggerBucket).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.triggerBucket).add('Purpose', 'LambdaTrigger');

    // Output bucket name
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.triggerBucket.bucketName,
      description: 'Name of the S3 bucket that triggers Lambda function',
      exportName: `S3BucketName-${props.environmentSuffix}`,
    });

    // Output bucket ARN
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: this.triggerBucket.bucketArn,
      description: 'ARN of the S3 bucket that triggers Lambda function',
      exportName: `S3BucketArn-${props.environmentSuffix}`,
    });
  }
}
