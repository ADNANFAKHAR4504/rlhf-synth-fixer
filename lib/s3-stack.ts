/**
 * s3-stack.ts
 *
 * S3 bucket for storing daily transaction reports.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3StackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: S3StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:S3Stack', name, args, opts);

    // Create S3 bucket for reports
    this.bucket = new aws.s3.Bucket(
      `reports-bucket-${args.environmentSuffix}`,
      {
        bucket: `payment-reports-${args.environmentSuffix}`,
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
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.bucketName = this.bucket.bucket;

    this.registerOutputs({
      bucketName: this.bucketName,
    });
  }
}
