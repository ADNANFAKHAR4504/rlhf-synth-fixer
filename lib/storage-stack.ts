import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly logsBucket: aws.s3.Bucket;
  public readonly bucketVersioning: aws.s3.BucketVersioningV2;

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:storage:StorageStack', name, args, opts);

    // S3 Bucket for logs
    this.logsBucket = new aws.s3.Bucket(
      `${name}-logs-bucket`,
      {
        forceDestroy: true, // Allow bucket to be deleted even if not empty
        tags: {
          ...args.tags,
          Name: `${name}-logs-bucket-${args.environmentSuffix}`,
          Purpose: 'Application Logs',
        },
      },
      { parent: this }
    );

    // Enable versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(
      `${name}-logs-versioning`,
      {
        bucket: this.logsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Server-side encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${name}-logs-encryption`,
      {
        bucket: this.logsBucket.id,
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

    // Lifecycle configuration
    new aws.s3.BucketLifecycleConfigurationV2(
      `${name}-logs-lifecycle`,
      {
        bucket: this.logsBucket.id,
        rules: [
          {
            id: 'log_lifecycle',
            status: 'Enabled',
            expiration: {
              days: 90,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${name}-logs-pab`,
      {
        bucket: this.logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.registerOutputs({
      logsBucketName: this.logsBucket.id,
      logsBucketArn: this.logsBucket.arn,
    });
  }
}
