import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as iam from 'aws-cdk-lib/aws-iam'; // Not needed
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface S3StackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class S3Stack extends cdk.Stack {
  public readonly applicationBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    // KMS key for S3 encryption
    const s3Key = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Access logs bucket
    this.logsBucket = new s3.Bucket(
      this,
      `AccessLogsBucket${props.environmentSuffix}`,
      {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        versioned: false,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            expiration: cdk.Duration.days(90),
            // Storage class transitions disabled for LocalStack - limited support
            // transitions: [
            //   {
            //     storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            //     transitionAfter: cdk.Duration.days(30),
            //   },
            //   {
            //     storageClass: s3.StorageClass.GLACIER,
            //     transitionAfter: cdk.Duration.days(60),
            //   },
            // ],
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Application data bucket
    this.applicationBucket = new s3.Bucket(
      this,
      `ApplicationBucket${props.environmentSuffix}`,
      {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: s3Key,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        versioned: true,
        serverAccessLogsBucket: this.logsBucket,
        serverAccessLogsPrefix: 'application-access-logs/',
        // Lifecycle transitions disabled for LocalStack - limited support
        // lifecycleRules: [
        //   {
        //     id: 'transition-to-ia',
        //     transitions: [
        //       {
        //         storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        //         transitionAfter: cdk.Duration.days(30),
        //       },
        //     ],
        //   },
        // ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Backup bucket with cross-region replication setup
    this.backupBucket = new s3.Bucket(
      this,
      `BackupBucket${props.environmentSuffix}`,
      {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: s3Key,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        versioned: true,
        // Lifecycle transitions disabled for LocalStack - limited support
        // lifecycleRules: [
        //   {
        //     id: 'backup-lifecycle',
        //     transitions: [
        //       {
        //         storageClass: s3.StorageClass.GLACIER,
        //         transitionAfter: cdk.Duration.days(30),
        //       },
        //       {
        //         storageClass: s3.StorageClass.DEEP_ARCHIVE,
        //         transitionAfter: cdk.Duration.days(120),
        //       },
        //     ],
        //   },
        // ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );
  }
}
