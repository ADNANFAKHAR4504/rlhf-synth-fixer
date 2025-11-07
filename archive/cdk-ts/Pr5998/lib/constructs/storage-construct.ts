import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
  retentionDays: number;
}

export class StorageConstruct extends Construct {
  public readonly transactionBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environmentSuffix, retentionDays } = props;

    // Create S3 bucket for transaction logs with Intelligent-Tiering
    // This works with ALL retention periods including 7 days for dev
    this.transactionBucket = new s3.Bucket(this, 'TransactionBucket', {
      bucketName: `payment-transactions-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: `intelligent-tiering-${environmentSuffix}`,
          enabled: true,
          // Use Intelligent-Tiering storage class - works with any retention period
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
        {
          id: `expiration-${environmentSuffix}`,
          enabled: true,
          // Expire objects after retention period
          expiration: cdk.Duration.days(retentionDays),
        },
        {
          id: `abort-incomplete-multipart-upload-${environmentSuffix}`,
          enabled: true,
          // Clean up incomplete multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Tags
    cdk.Tags.of(this.transactionBucket).add(
      'Name',
      `payment-transactions-${environmentSuffix}`
    );
    cdk.Tags.of(this.transactionBucket).add('Environment', environmentSuffix);
  }
}
