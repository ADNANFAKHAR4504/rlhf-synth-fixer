/**
 * DataStack - DynamoDB, S3, KMS resources
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DataStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DataStack extends pulumi.ComponentResource {
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DataStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:data:DataStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // KMS Key for database backup encryption
    const kmsKey = new aws.kms.Key(
      `payment-kms-${environmentSuffix}`,
      {
        description:
          'Customer-managed KMS key for payment database backup encryption',
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-db-backup-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    this.kmsKeyArn = kmsKey.arn;

    // DynamoDB Table
    const table = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST', // On-demand billing
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `transactions-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.tableName = table.name;

    // S3 Bucket for audit logs
    const bucket = new aws.s3.Bucket(
      `payment-audit-logs-${environmentSuffix}`,
      {
        bucket: `payment-audit-logs-${environmentSuffix}`,
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
            id: 'archive-old-logs',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-audit-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.bucketName = bucket.id;

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `payment-audit-logs-pab-${environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.registerOutputs({
      tableName: this.tableName,
      bucketName: this.bucketName,
      kmsKeyArn: this.kmsKeyArn,
    });
  }
}
