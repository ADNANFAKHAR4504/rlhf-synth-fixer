import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface SecureStorageProps {
  readonly bucketName?: string;
  readonly enableVersioning?: boolean;
}

export class SecureStorage extends Construct {
  public readonly logBucket: s3.Bucket;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecureStorageProps = {}) {
    super(scope, id);

    // Create KMS key for S3 encryption
    this.encryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create S3 bucket for logging with encryption
    this.logBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: props.bucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      versioned: props.enableVersioning ?? true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Apply tags
    cdk.Tags.of(this.logBucket).add('Environment', 'Production');
    cdk.Tags.of(this.encryptionKey).add('Environment', 'Production');
  }
}
