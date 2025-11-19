import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface S3ComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
}

/**
 * S3 Component for audit logs with environment-specific lifecycle
 */
export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;

  constructor(
    name: string,
    args: S3ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:storage:S3Component', name, {}, opts);

    const { config, tags, environmentSuffix } = args;

    // Get current AWS account ID for unique bucket naming
    const callerIdentity = aws.getCallerIdentityOutput({});
    const accountId = callerIdentity.accountId;
    const region = aws.getRegionOutput({}).name;

    // Create S3 bucket with account-specific naming
    const bucketName = pulumi.interpolate`audit-logs-${environmentSuffix}-${accountId}-${region}`;

    this.bucket = new aws.s3.Bucket(
      `audit-logs-${environmentSuffix}`,
      {
        bucket: bucketName,
        forceDestroy: true,
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
            id: 'expire-old-logs',
            enabled: true,
            expiration: {
              days: config.s3RetentionDays,
            },
            noncurrentVersionExpiration: {
              days: 7,
            },
          },
        ],
        tags: {
          ...tags,
          Name: `audit-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `audit-logs-public-access-${environmentSuffix}`,
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
