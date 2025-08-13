import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface SecureS3BucketProps {
  bucketName: string;
  encryptionKey?: kms.IKey;
  enableLogging?: boolean;
}

export class SecureS3Bucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecureS3BucketProps) {
    super(scope, id);

    // Create KMS key for S3 encryption
    this.encryptionKey =
      (props.encryptionKey as kms.Key) ||
      new kms.Key(this, 'S3EncryptionKey', {
        description: 'KMS key for S3 bucket encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

    // Create secure S3 bucket
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: props.bucketName,
      // Enable versioning as required
      versioned: true,
      // Server-side encryption with KMS
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      // Ensure bucket is not publicly accessible
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      // Enable access logging if specified
      serverAccessLogsPrefix: props.enableLogging ? 'access-logs/' : undefined,
      // Secure transport only
      enforceSSL: true,
      // Lifecycle rules for cost optimization
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
