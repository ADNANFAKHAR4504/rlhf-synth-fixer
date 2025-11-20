import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageProps {
  environment: string;
  environmentSuffix: string;
  logRetentionDays: number;
}

export class StorageComponent extends pulumi.ComponentResource {
  public transactionTable: aws.dynamodb.Table;
  public auditBucket: aws.s3.Bucket;
  public logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    props: StorageProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:storage:StorageComponent', name, {}, opts);

    // Create DynamoDB table for transaction logs
    this.transactionTable = new aws.dynamodb.Table(
      `transaction-table-${props.environment}-${props.environmentSuffix}`,
      {
        name: `payments-transactions-${props.environment}-${props.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        pointInTimeRecovery: {
          enabled: true,
        },
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'S',
          },
          {
            name: 'customerId',
            type: 'S',
          },
        ],
        globalSecondaryIndexes: [
          {
            name: 'CustomerIndex',
            hashKey: 'customerId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        tags: {
          Name: `payments-transactions-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Create S3 bucket for audit trails
    this.auditBucket = new aws.s3.Bucket(
      `audit-bucket-${props.environment}-${props.environmentSuffix}`,
      {
        bucket: `payments-${props.environment}-audit-${props.environment}-${props.environmentSuffix}`,
        forceDestroy: true,
        tags: {
          Name: `payments-audit-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Enable versioning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketVersioning = new aws.s3.BucketVersioning(
      `audit-bucket-versioning-${props.environment}-${props.environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable encryption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(
      `audit-bucket-encryption-${props.environment}-${props.environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Lifecycle policy based on environment
    const lifecycleDays =
      props.environment === 'prod'
        ? 90
        : props.environment === 'staging'
          ? 30
          : 7;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketLifecycle = new aws.s3.BucketLifecycleConfiguration(
      `audit-bucket-lifecycle-${props.environment}-${props.environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        rules: [
          {
            id: 'archive-old-audits',
            status: 'Enabled',
            transitions: [
              {
                days: lifecycleDays,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `audit-bucket-public-access-${props.environment}-${props.environmentSuffix}`,
      {
        bucket: this.auditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create CloudWatch log group
    this.logGroup = new aws.cloudwatch.LogGroup(
      `payment-logs-${props.environment}-${props.environmentSuffix}`,
      {
        name: `/aws/payments/${props.environment}-${props.environment}-${props.environmentSuffix}`,
        retentionInDays: props.logRetentionDays,
        tags: {
          Name: `payment-logs-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      tableName: this.transactionTable.name,
      tableArn: this.transactionTable.arn,
      bucketName: this.auditBucket.bucket,
      bucketArn: this.auditBucket.arn,
      logGroupName: this.logGroup.name,
    });
  }
}
