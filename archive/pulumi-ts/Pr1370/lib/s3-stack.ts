/**
 * s3-stack.ts
 *
 * This module defines the S3Stack component for creating secure S3 buckets
 * with AWS-managed KMS encryption and proper security configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  namePrefix: string;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucketId: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    // S3 bucket names must be globally unique and follow DNS naming conventions
    const s3BucketName =
      `${args.namePrefix}-s3-secure-data-${args.environmentSuffix}`.toLowerCase();

    // S3 Bucket
    const s3Bucket = new aws.s3.Bucket(
      s3BucketName,
      {
        bucket: s3BucketName,
        tags: {
          ...args.tags,
          ResourceType: 'S3Bucket',
          Purpose: 'SecureDataStorage',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    // S3 Bucket Server-Side Encryption Configuration with AWS-managed KMS
    new aws.s3.BucketServerSideEncryptionConfiguration(
      's3-encryption',
      {
        bucket: s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: 'alias/aws/s3',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    // S3 Bucket Public Access Block (security best practice)
    new aws.s3.BucketPublicAccessBlock(
      's3-public-access-block',
      {
        bucket: s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this, provider: opts?.provider }
    );

    // S3 Bucket Versioning (production best practice)
    new aws.s3.BucketVersioning(
      's3-versioning',
      {
        bucket: s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this, provider: opts?.provider }
    );

    this.bucketId = s3Bucket.id;
    this.bucketArn = s3Bucket.arn;

    this.registerOutputs({
      bucketId: this.bucketId,
      bucketArn: this.bucketArn,
    });
  }
}
