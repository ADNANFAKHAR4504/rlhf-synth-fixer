import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
  region: string;
  kmsKey: cdk.aws_kms.Key;
}

export class StorageConstruct extends Construct {
  public readonly bucket: cdk.aws_s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, kmsKey } = props;

    // S3 Bucket with KMS encryption (unique key per bucket as requested)
    this.bucket = new cdk.aws_s3.Bucket(this, 'MainBucket', {
      bucketName: `${environmentSuffix}-main-bucket-${region}-${cdk.Stack.of(this).account}`,
      encryption: cdk.aws_s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      bucketKeyEnabled: true, // Cost optimization
      versioned: true,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: cdk.aws_s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
      autoDeleteObjects: true, // For dev/test environments
    });

    // CloudTrail removed due to AWS limit (max 5 trails per region)
    // In production, you would reuse an existing organization trail
    // or implement a centralized logging solution
  }
}
