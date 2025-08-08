/**
 * secureS3Bucket.ts
 *
 * This module defines a reusable SecureS3Bucket component that enforces
 * security best practices for S3 buckets including encryption, versioning,
 * and public access blocking.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { KMSKey } from './kmsComponent';

/**
 * Arguments for creating a secure S3 bucket
 */
export interface SecureS3BucketArgs {
  /**
   * The environment suffix for the bucket name (e.g., 'development', 'production')
   */
  environmentSuffix: string;

  /**
   * Optional tags to apply to the bucket and related resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * A reusable component that creates a secure S3 bucket with enforced security configurations
 */
export class SecureS3Bucket extends pulumi.ComponentResource {
  /**
   * The created S3 bucket
   */
  public readonly bucket: aws.s3.Bucket;

  /**
   * The bucket versioning configuration
   */
  public readonly bucketVersioning: aws.s3.BucketVersioning;

  /**
   * The bucket encryption configuration
   */
  public readonly bucketEncryption: aws.s3.BucketServerSideEncryptionConfiguration;

  /**
   * The bucket public access block configuration
   */
  public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;

  /**
   * The KMS key for bucket encryption
   */
  public readonly kmsKey: KMSKey;

  /**
   * The ARN of the created bucket
   */
  public readonly bucketArn: pulumi.Output<string>;

  /**
   * The name of the created bucket
   */
  public readonly bucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecureS3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:SecureS3Bucket', name, {}, opts);

    const resourceOpts: pulumi.ResourceOptions = { parent: this };

    // Merge required tags with optional tags
    const allTags = pulumi.all([args.tags || {}]).apply(([userTags]) => ({
      ...userTags,
      Department: 'Security',
      Project: 'PulumiIaCProject',
    }));

    // Create KMS key for bucket encryption
    this.kmsKey = new KMSKey(
      `s3-kms-key-${args.environmentSuffix}`,
      {
        environmentSuffix: args.environmentSuffix,
        description: `KMS key for S3 bucket encryption in ${args.environmentSuffix} environment`,
        tags: allTags,
      },
      { parent: this }
    );

    // Create the S3 bucket with proper naming convention
    this.bucket = new aws.s3.Bucket(
      `app-data-${args.environmentSuffix}`,
      {
        forceDestroy: true,
        tags: allTags,
      },
      resourceOpts
    );

    // Enable versioning on the bucket
    this.bucketVersioning = new aws.s3.BucketVersioning(
      `app-data-${args.environmentSuffix}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      resourceOpts
    );

    // Configure server-side encryption with KMS
    this.bucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(
      `app-data-${args.environmentSuffix}-encryption`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.keyArn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      resourceOpts
    );

    // Block all public access to the bucket
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `app-data-${args.environmentSuffix}-pab`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      resourceOpts
    );

    // Export the bucket ARN and name
    this.bucketArn = this.bucket.arn;
    this.bucketName = this.bucket.id;

    // Register outputs
    this.registerOutputs({
      bucketArn: this.bucketArn,
      bucketName: this.bucketName,
      kmsKeyArn: this.kmsKey.keyArn,
      kmsKeyId: this.kmsKey.keyId,
    });
  }
}
