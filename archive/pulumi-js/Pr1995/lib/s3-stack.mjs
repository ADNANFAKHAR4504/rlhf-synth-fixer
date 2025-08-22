/**
 * S3 Stack - Creates secure S3 bucket with KMS encryption, versioning,
 * and access logging following AWS 2025 security best practices.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class S3Stack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:S3Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create KMS key for S3 encryption
    const kmsKey = new aws.kms.Key(
      `SecureApp-s3-kms-key-${environmentSuffix}`,
      {
        description: 'KMS key for SecureApp S3 bucket encryption',
        tags: {
          ...tags,
          Name: `SecureApp-s3-kms-key-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS key alias
    new aws.kms.Alias(
      `SecureApp-s3-kms-alias-${environmentSuffix}`,
      {
        name: `alias/SecureApp-s3-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create S3 bucket for access logs
    const logsBucket = new aws.s3.Bucket(
      `SecureApp-access-logs-${environmentSuffix}`,
      {
        tags: {
          ...tags,
          Name: `SecureApp-access-logs-${environmentSuffix}`,
          Purpose: 'AccessLogs',
        },
      },
      { parent: this }
    );

    // Block public access for logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `SecureApp-logs-pab-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create main S3 bucket
    this.bucket = new aws.s3.Bucket(
      `SecureApp-data-bucket-${environmentSuffix}`,
      {
        tags: {
          ...tags,
          Name: `SecureApp-data-bucket-${environmentSuffix}`,
          Purpose: 'DataStorage',
        },
      },
      { parent: this }
    );

    // Configure bucket versioning
    new aws.s3.BucketVersioning(
      `SecureApp-bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `SecureApp-bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: kmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `SecureApp-bucket-pab-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Configure access logging
    new aws.s3.BucketLogging(
      `SecureApp-bucket-logging-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        targetBucket: logsBucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    // Configure lifecycle policy
    new aws.s3.BucketLifecycleConfiguration(
      `SecureApp-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: 'transition_to_ia',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Export values
    this.bucketName = this.bucket.bucket;
    this.bucketArn = this.bucket.arn;
    this.kmsKeyId = kmsKey.keyId;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
      kmsKeyId: this.kmsKeyId,
    });
  }
}
