/**
 * S3 bucket creation with versioning, lifecycle, and encryption
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface S3MigrationArgs {
  bucketName: string;
  kmsKeyId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class S3Migration extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketVersioning: aws.s3.BucketVersioningV2;

  constructor(
    name: string,
    args: S3MigrationArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:S3Migration', name, {}, opts);

    // Create bucket
    this.bucket = new aws.s3.Bucket(
      `${args.bucketName}-${args.environmentSuffix}`,
      {
        bucket: `${args.bucketName}-${args.environmentSuffix}`,
        tags: args.tags,
      },
      { parent: this }
    );

    // Enable versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(
      `${args.bucketName}-versioning-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Server-side encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${args.bucketName}-encryption-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Lifecycle policy for Glacier transition
    new aws.s3.BucketLifecycleConfigurationV2(
      `${args.bucketName}-lifecycle-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
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

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${args.bucketName}-public-access-block-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
    });
  }
}
