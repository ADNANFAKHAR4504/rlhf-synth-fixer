import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3BucketsArgs {
  environmentSuffix: string;
  kmsKey: aws.kms.Key;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class S3Buckets extends pulumi.ComponentResource {
  public readonly auditBucket: aws.s3.BucketV2;
  public readonly publicBucket: aws.s3.BucketV2;
  public readonly internalBucket: aws.s3.BucketV2;
  public readonly confidentialBucket: aws.s3.BucketV2;

  constructor(
    name: string,
    args: S3BucketsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:S3Buckets', name, {}, opts);

    const { environmentSuffix, kmsKey, tags } = args;

    // Create audit bucket for logging
    this.auditBucket = new aws.s3.BucketV2(
      `audit-bucket-${environmentSuffix}`,
      {
        bucket: `audit-logs-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          DataClassification: 'audit',
        })),
      },
      { parent: this }
    );

    // Enable versioning on audit bucket
    new aws.s3.BucketVersioningV2(
      `audit-bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Block public access on audit bucket
    new aws.s3.BucketPublicAccessBlock(
      `audit-bucket-public-access-${environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable server-side encryption on audit bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `audit-bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Create public bucket
    this.publicBucket = new aws.s3.BucketV2(
      `public-bucket-${environmentSuffix}`,
      {
        bucket: `public-data-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          DataClassification: 'public',
        })),
      },
      { parent: this }
    );

    // Enable versioning on public bucket
    new aws.s3.BucketVersioningV2(
      `public-bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.publicBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Block public access on public bucket
    new aws.s3.BucketPublicAccessBlock(
      `public-bucket-public-access-${environmentSuffix}`,
      {
        bucket: this.publicBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable server-side encryption on public bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `public-bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.publicBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Enable access logging on public bucket
    new aws.s3.BucketLoggingV2(
      `public-bucket-logging-${environmentSuffix}`,
      {
        bucket: this.publicBucket.id,
        targetBucket: this.auditBucket.id,
        targetPrefix: 'public-bucket-logs/',
      },
      { parent: this }
    );

    // Add lifecycle rule for public bucket
    new aws.s3.BucketLifecycleConfigurationV2(
      `public-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: this.publicBucket.id,
        rules: [
          {
            id: 'glacier-transition',
            status: 'Enabled',
            transitions: [
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

    // Create internal bucket
    this.internalBucket = new aws.s3.BucketV2(
      `internal-bucket-${environmentSuffix}`,
      {
        bucket: `internal-data-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          DataClassification: 'internal',
        })),
      },
      { parent: this }
    );

    // Enable versioning on internal bucket
    new aws.s3.BucketVersioningV2(
      `internal-bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.internalBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Block public access on internal bucket
    new aws.s3.BucketPublicAccessBlock(
      `internal-bucket-public-access-${environmentSuffix}`,
      {
        bucket: this.internalBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable server-side encryption on internal bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `internal-bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.internalBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Enable access logging on internal bucket
    new aws.s3.BucketLoggingV2(
      `internal-bucket-logging-${environmentSuffix}`,
      {
        bucket: this.internalBucket.id,
        targetBucket: this.auditBucket.id,
        targetPrefix: 'internal-bucket-logs/',
      },
      { parent: this }
    );

    // Add lifecycle rule for internal bucket
    new aws.s3.BucketLifecycleConfigurationV2(
      `internal-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: this.internalBucket.id,
        rules: [
          {
            id: 'glacier-transition',
            status: 'Enabled',
            transitions: [
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

    // Create confidential bucket
    this.confidentialBucket = new aws.s3.BucketV2(
      `confidential-bucket-${environmentSuffix}`,
      {
        bucket: `confidential-data-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          DataClassification: 'confidential',
        })),
      },
      { parent: this }
    );

    // Enable versioning on confidential bucket
    // Note: MFA delete protection cannot be enabled programmatically via API
    new aws.s3.BucketVersioningV2(
      `confidential-bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.confidentialBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Block public access on confidential bucket
    new aws.s3.BucketPublicAccessBlock(
      `confidential-bucket-public-access-${environmentSuffix}`,
      {
        bucket: this.confidentialBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable server-side encryption with KMS on confidential bucket
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `confidential-bucket-encryption-${environmentSuffix}`,
      {
        bucket: this.confidentialBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.id,
            },
          },
        ],
      },
      { parent: this }
    );

    // Enable access logging on confidential bucket
    new aws.s3.BucketLoggingV2(
      `confidential-bucket-logging-${environmentSuffix}`,
      {
        bucket: this.confidentialBucket.id,
        targetBucket: this.auditBucket.id,
        targetPrefix: 'confidential-bucket-logs/',
      },
      { parent: this }
    );

    // Add lifecycle rule for confidential bucket
    new aws.s3.BucketLifecycleConfigurationV2(
      `confidential-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: this.confidentialBucket.id,
        rules: [
          {
            id: 'glacier-transition',
            status: 'Enabled',
            transitions: [
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

    this.registerOutputs({
      auditBucketName: this.auditBucket.id,
      publicBucketName: this.publicBucket.id,
      internalBucketName: this.internalBucket.id,
      confidentialBucketName: this.confidentialBucket.id,
    });
  }
}
