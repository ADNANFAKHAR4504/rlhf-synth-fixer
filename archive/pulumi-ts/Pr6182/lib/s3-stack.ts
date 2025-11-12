/**
 * S3 Stack - Creates S3 buckets with versioning and lifecycle policies
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, S3Outputs } from './types';

export interface S3StackArgs {
  config: EnvironmentConfig;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly outputs: S3Outputs;

  constructor(
    name: string,
    args: S3StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:S3Stack', name, {}, opts);

    const { config } = args;

    // Create S3 bucket for payment data
    const bucket = new aws.s3.Bucket(
      `${config.environment}-payment-data-${config.environmentSuffix}`,
      {
        bucket: `${config.environment}-payment-data-${config.environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: `${config.environment}-lifecycle-rule`,
            enabled: true,
            transitions: [
              {
                days: config.s3LifecycleDays,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionTransitions: [
              {
                days: config.s3LifecycleDays,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionExpiration: {
              days: config.s3LifecycleDays * 2,
            },
          },
        ],
        tags: {
          ...config.tags,
          Name: `${config.environment}-payment-data-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${config.environment}-bucket-public-access-block-${config.environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.outputs = {
      bucketName: bucket.bucket,
      bucketArn: bucket.arn,
    };

    this.registerOutputs({
      bucketName: this.outputs.bucketName,
      bucketArn: this.outputs.bucketArn,
    });
  }
}
