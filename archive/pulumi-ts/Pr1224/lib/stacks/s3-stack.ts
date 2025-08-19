/**
 * s3-stack.ts
 *
 * This module defines the S3 stack for creating secure S3 buckets
 * with encryption, versioning, and lifecycle policies.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  mainKmsKeyArn: pulumi.Input<string>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly dataBucketArn: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;
  public readonly logsBucketArn: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Data bucket
    const dataBucket = new aws.s3.Bucket(
      `tap-data-bucket-${environmentSuffix}`,
      {
        tags: {
          Name: `tap-data-bucket-${environmentSuffix}`,
          Purpose: 'DataStorage',
          ...tags,
        },
      },
      { parent: this }
    );

    // Block all public access for data bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-data-bucket-pab-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Server-side encryption for data bucket
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-data-bucket-encryption-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.mainKmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Versioning for data bucket
    new aws.s3.BucketVersioning(
      `tap-data-bucket-versioning-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Lifecycle configuration for data bucket
    new aws.s3.BucketLifecycleConfiguration(
      `tap-data-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        rules: [
          {
            id: 'transition-to-ia',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Logs bucket
    const logsBucket = new aws.s3.Bucket(
      `tap-logs-bucket-${environmentSuffix}`,
      {
        tags: {
          Name: `tap-logs-bucket-${environmentSuffix}`,
          Purpose: 'LogStorage',
          ...tags,
        },
      },
      { parent: this }
    );

    // Block all public access for logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-logs-bucket-pab-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Server-side encryption for logs bucket
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-logs-bucket-encryption-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.mainKmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Versioning for logs bucket
    new aws.s3.BucketVersioning(
      `tap-logs-bucket-versioning-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Lifecycle configuration for logs bucket
    new aws.s3.BucketLifecycleConfiguration(
      `tap-logs-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            id: 'delete-old-logs',
            status: 'Enabled',
            expiration: {
              days: 90,
            },
          },
        ],
      },
      { parent: this }
    );

    // Logging configuration for data bucket (logs go to logs bucket)
    new aws.s3.BucketLogging(
      `tap-data-bucket-logging-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        targetBucket: logsBucket.id,
        targetPrefix: 'data-bucket-access-logs/',
      },
      { parent: this }
    );

    this.dataBucketName = dataBucket.id;
    this.dataBucketArn = dataBucket.arn;
    this.logsBucketName = logsBucket.id;
    this.logsBucketArn = logsBucket.arn;

    this.registerOutputs({
      dataBucketName: this.dataBucketName,
      dataBucketArn: this.dataBucketArn,
      logsBucketName: this.logsBucketName,
      logsBucketArn: this.logsBucketArn,
    });
  }
}
