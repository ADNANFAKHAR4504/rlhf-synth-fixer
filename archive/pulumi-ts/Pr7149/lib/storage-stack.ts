import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  kmsKeyId: pulumi.Input<string>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly staticBucketName: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:storage:StorageStack', name, args, opts);

    const { environmentSuffix, tags, kmsKeyId } = args;

    // S3 bucket for static assets
    const staticBucket = new aws.s3.Bucket(
      `payment-static-${environmentSuffix}`,
      {
        bucket: `payment-static-${environmentSuffix}`,
        forceDestroy: true,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'delete-old-versions',
            noncurrentVersionExpiration: {
              days: 90,
            },
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-static-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `payment-static-public-block-${environmentSuffix}`,
      {
        bucket: staticBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 bucket for audit logs
    const auditBucket = new aws.s3.Bucket(
      `payment-audit-logs-${environmentSuffix}`,
      {
        bucket: `payment-audit-logs-${environmentSuffix}`,
        forceDestroy: true,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'archive-old-logs',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 365,
            },
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-audit-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `payment-audit-public-block-${environmentSuffix}`,
      {
        bucket: auditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.staticBucketName = staticBucket.id;
    this.auditBucketName = auditBucket.id;

    this.registerOutputs({
      staticBucketName: this.staticBucketName,
      auditBucketName: this.auditBucketName,
    });
  }
}
