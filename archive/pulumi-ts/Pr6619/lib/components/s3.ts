import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';
import { EnvironmentConfig, TagsConfig } from '../types';

export interface S3ComponentArgs {
  environmentSuffix: string;
  envConfig: EnvironmentConfig;
  tags: TagsConfig;
}

export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.BucketV2;
  public readonly bucketVersioning: aws.s3.BucketVersioningV2;
  public readonly bucketLifecycle: aws.s3.BucketLifecycleConfigurationV2;
  public readonly bucketEncryption: aws.s3.BucketServerSideEncryptionConfigurationV2;
  public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: S3ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:s3:S3Component', name, {}, opts);

    const { environmentSuffix, envConfig, tags } = args;

    // Generate a random suffix for bucket name uniqueness
    const randomId = new random.RandomId(
      `payment-audit-random-${environmentSuffix}`,
      {
        byteLength: 4,
      },
      { parent: this }
    );

    // Create S3 bucket for audit trails with naming convention
    this.bucket = new aws.s3.BucketV2(
      `payment-audit-${environmentSuffix}`,
      {
        bucket: pulumi.interpolate`payments-${envConfig.environment}-audit-${randomId.hex}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: pulumi.interpolate`payments-${envConfig.environment}-audit-${randomId.hex}`,
          Purpose: 'audit-trails',
        },
      },
      { parent: this }
    );

    // Enable versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(
      `payment-audit-versioning-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure lifecycle policies based on environment
    this.bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
      `payment-audit-lifecycle-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: 'TransitionToGlacier',
            status: 'Enabled',
            transitions: [
              {
                days: envConfig.s3LifecycleDays,
                storageClass: 'GLACIER',
              },
              {
                days: envConfig.s3LifecycleDays + 90,
                storageClass: 'DEEP_ARCHIVE',
              },
            ],
          },
          {
            id: 'DeleteOldVersions',
            status: 'Enabled',
            noncurrentVersionTransitions: [
              {
                noncurrentDays: 30,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionExpiration: {
              noncurrentDays: 90,
            },
          },
        ],
      },
      { parent: this }
    );

    // Enable server-side encryption
    this.bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `payment-audit-encryption-${environmentSuffix}`,
        {
          bucket: this.bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this }
      );

    // Block public access
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `payment-audit-public-access-block-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.bucketName = this.bucket.id;
    this.bucketArn = this.bucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
