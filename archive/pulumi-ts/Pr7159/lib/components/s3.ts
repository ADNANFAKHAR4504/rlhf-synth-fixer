import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3ComponentArgs {
  lifecycleRules: {
    enabled: boolean;
    transitionDays?: number;
    expirationDays?: number;
  };
  enableVersioning: boolean;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: S3ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:storage:S3Component', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // S3 Bucket
    this.bucket = new aws.s3.Bucket(
      `trading-data-${args.environmentSuffix}`,
      {
        forceDestroy: true,
        tags: {
          ...args.tags,
          Name: `trading-data-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.bucketName = this.bucket.id;

    // Versioning
    if (args.enableVersioning) {
      new aws.s3.BucketVersioningV2(
        `bucket-versioning-${args.environmentSuffix}`,
        {
          bucket: this.bucket.id,
          versioningConfiguration: {
            status: 'Enabled',
          },
        },
        defaultResourceOptions
      );
    }

    // Encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `bucket-encryption-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      defaultResourceOptions
    );

    // Lifecycle Rules
    if (args.lifecycleRules.enabled) {
      const rules: aws.types.input.s3.BucketLifecycleConfigurationRule[] = [];

      if (args.lifecycleRules.transitionDays) {
        rules.push({
          id: 'transition-to-ia',
          status: 'Enabled',
          transitions: [
            {
              days: args.lifecycleRules.transitionDays,
              storageClass: 'STANDARD_IA',
            },
          ],
        });
      }

      if (args.lifecycleRules.expirationDays) {
        rules.push({
          id: 'expiration',
          status: 'Enabled',
          expiration: {
            days: args.lifecycleRules.expirationDays,
          },
        });
      }

      if (rules.length > 0) {
        new aws.s3.BucketLifecycleConfiguration(
          `bucket-lifecycle-${args.environmentSuffix}`,
          {
            bucket: this.bucket.id,
            rules: rules,
          },
          defaultResourceOptions
        );
      }
    }

    // Block Public Access
    new aws.s3.BucketPublicAccessBlock(
      `bucket-public-access-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucket.arn,
    });
  }
}
