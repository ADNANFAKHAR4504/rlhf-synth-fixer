import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface PodcastStorageStackProps {
  environmentSuffix: string;
}

export class PodcastStorageStack extends Construct {
  public readonly audioBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: PodcastStorageStackProps) {
    super(scope, id);

    // S3 bucket for audio files with requester pays and intelligent tiering
    this.audioBucket = new s3.Bucket(this, 'AudioBucket', {
      bucketName: `podcast-audio-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'IntelligentTieringRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Enable requester pays
    const cfnBucket = this.audioBucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.addPropertyOverride(
      'RequestPaymentConfiguration.Payer',
      'Requester'
    );

    new cdk.CfnOutput(this, 'AudioBucketName', {
      value: this.audioBucket.bucketName,
      description: 'S3 bucket for podcast audio files',
    });
  }
}
