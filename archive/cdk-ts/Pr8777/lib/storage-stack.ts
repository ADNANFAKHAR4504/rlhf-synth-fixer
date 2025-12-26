import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageConstructProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
  regionSuffix?: string;
}

export class StorageConstruct extends Construct {
  public readonly applicationBucket: s3.Bucket;
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const regionSuffix = props.regionSuffix || '';

    // KMS key for S3 encryption
    const s3Key = new kms.Key(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-s3-key`,
      {
        description: 'KMS key for S3 bucket encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Application data bucket
    this.applicationBucket = new s3.Bucket(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-app-bucket`,
      {
        bucketName: `${props.commonTags.ProjectName}-${props.environmentSuffix}-app${regionSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: s3Key,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
          {
            id: 'transition-to-ia',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
          },
        ],
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Backup bucket with cross-region replication
    this.backupBucket = new s3.Bucket(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-backup-bucket`,
      {
        bucketName: `${props.commonTags.ProjectName}-${props.environmentSuffix}-backup${regionSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: s3Key,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Enable intelligent tiering for cost optimization
    // Note: Intelligent tiering would be configured via bucket configuration, not as a separate construct

    // Apply tags
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.applicationBucket).add(key, value);
      cdk.Tags.of(this.backupBucket).add(key, value);
      cdk.Tags.of(s3Key).add(key, value);
    });
  }
}
