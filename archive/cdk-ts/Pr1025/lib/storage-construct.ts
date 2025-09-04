import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
  bucketName?: string;
}

export class StorageConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly logBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Create logging bucket first
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `webapp-logs-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Create main application bucket
    this.bucket = new s3.Bucket(this, 'AppBucket', {
      bucketName:
        props.bucketName ||
        `webapp-data-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: this.logBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Add tags
    cdk.Tags.of(this.bucket).add('Component', 'Storage');
    cdk.Tags.of(this.bucket).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.logBucket).add('Component', 'Storage');
    cdk.Tags.of(this.logBucket).add('Environment', props.environmentSuffix);
  }
}
