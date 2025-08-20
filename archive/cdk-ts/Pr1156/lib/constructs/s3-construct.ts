import { Construct } from 'constructs';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  BucketAccessControl,
  StorageClass,
} from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { TaggingUtils } from '../utils/tagging';

export interface S3ConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
  encryptionKey: Key;
}

/**
 * S3 Construct for secure bucket management
 * Implements encryption at rest, access controls, and lifecycle policies
 */
export class S3Construct extends Construct {
  public dataBucket: Bucket;
  public logsBucket: Bucket;
  public backupBucket: Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    // Create secure data bucket
    this.dataBucket = new Bucket(this, 'DataBucket', {
      bucketName: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'data'
      ),
      encryption: BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          id: 'DataLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30), // 30 days
            },
            {
              storageClass: StorageClass.GLACIER,
              transitionAfter: Duration.days(90), // 90 days
            },
            {
              storageClass: StorageClass.DEEP_ARCHIVE,
              transitionAfter: Duration.days(365), // 1 year
            },
          ],
          noncurrentVersionTransitions: [
            {
              storageClass: StorageClass.GLACIER,
              transitionAfter: Duration.days(30),
            },
          ],
          noncurrentVersionExpiration: Duration.days(365), // 1 year
        },
      ],
    });

    // Create logs bucket for CloudTrail and other logs
    this.logsBucket = new Bucket(this, 'LogsBucket', {
      bucketName: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'logs'
      ),
      encryption: BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          id: 'LogsLifecycle',
          enabled: true,
          expiration: Duration.days(2555), // 7 years for compliance
          transitions: [
            {
              storageClass: StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
      ],
    });

    // Create backup bucket for disaster recovery
    this.backupBucket = new Bucket(this, 'BackupBucket', {
      bucketName: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'backup'
      ),
      encryption: BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      accessControl: BucketAccessControl.PRIVATE,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          id: 'BackupLifecycle',
          enabled: true,
          expiration: Duration.days(2555), // 7 years for compliance
          transitions: [
            {
              storageClass: StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
            {
              storageClass: StorageClass.DEEP_ARCHIVE,
              transitionAfter: Duration.days(365),
            },
          ],
        },
      ],
    });

    // Apply tags to all buckets
    const buckets = [
      { bucket: this.dataBucket, type: 'Data' },
      { bucket: this.logsBucket, type: 'Logs' },
      { bucket: this.backupBucket, type: 'Backup' },
    ];

    buckets.forEach(({ bucket, type }) => {
      TaggingUtils.applyStandardTags(
        bucket,
        props.environment,
        props.service,
        props.owner,
        props.project,
        { ResourceType: `S3-Bucket-${type}` }
      );
    });
  }
}
