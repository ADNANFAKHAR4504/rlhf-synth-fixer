import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3ComponentArgs {
  environmentSuffix: string;
}

export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;

  constructor(
    name: string,
    args: S3ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:storage:S3Component', name, {}, opts);

    // Create S3 Bucket
    this.bucket = new aws.s3.Bucket(
      `data-bucket-${args.environmentSuffix}`,
      {
        bucket: `trading-data-${args.environmentSuffix.toLowerCase()}`,
        acl: 'private',
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            id: 'expire-old-versions',
            enabled: true,
            noncurrentVersionExpiration: {
              days: 90,
            },
          },
        ],
        tags: {
          Name: `data-bucket-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Block Public Access
    new aws.s3.BucketPublicAccessBlock(
      `bucket-public-access-block-${args.environmentSuffix}`,
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
