/**
 * tap-stack.ts
 *
 * Multi-Environment Data Pipeline Infrastructure
 *
 * This module creates consistent infrastructure across multiple AWS environments
 * for a data analytics company. It deploys S3, DynamoDB, SQS, and IAM resources
 * with environment-specific naming and tagging.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'staging', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the multi-environment data pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly queueUrl: pulumi.Output<string>;

  /**
   * Creates a new TapStack component with all required resources.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const config = new pulumi.Config();
    const environmentSuffix =
      args.environmentSuffix || config.get('env') || 'dev';
    const region = config.get('region') || 'us-east-1';

    // Merge provided tags with required tags
    const resourceTags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'DataPipeline',
      ManagedBy: 'Pulumi',
    }));

    // Generate random suffix for S3 bucket global uniqueness
    const randomSuffix = new random.RandomId(
      'bucket-suffix',
      {
        byteLength: 4,
      },
      { parent: this }
    );

    // Create SQS Queue for S3 event notifications
    const queue = new aws.sqs.Queue(
      `datapipeline-queue-${environmentSuffix}`,
      {
        name: pulumi.interpolate`datapipeline-queue-${environmentSuffix}`,
        messageRetentionSeconds: 14 * 24 * 60 * 60, // 14 days
        visibilityTimeoutSeconds: 300, // 5 minutes
        tags: resourceTags,
      },
      { parent: this }
    );

    // Create SQS Queue Policy to allow S3 to send messages
    const queuePolicy = new aws.sqs.QueuePolicy(
      `datapipeline-queue-policy-${environmentSuffix}`,
      {
        queueUrl: queue.url,
        policy: pulumi.all([queue.arn]).apply(([queueArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 's3.amazonaws.com',
                },
                Action: 'sqs:SendMessage',
                Resource: queueArn,
              },
            ],
          })
        ),
      },
      { parent: queue }
    );

    // Create S3 Bucket with unique name
    const bucket = new aws.s3.Bucket(
      `datapipeline-bucket-${environmentSuffix}`,
      {
        bucket: pulumi.interpolate`datapipeline-bucket-${environmentSuffix}-${randomSuffix.hex}`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // Enable S3 bucket versioning
    void new aws.s3.BucketVersioningV2(
      `datapipeline-bucket-versioning-${environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: bucket }
    );

    // Configure S3 bucket encryption (SSE-S3)
    void new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `datapipeline-bucket-encryption-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: bucket }
    );

    // Configure S3 lifecycle rules - transition to Glacier after 90 days
    void new aws.s3.BucketLifecycleConfigurationV2(
      `datapipeline-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: bucket }
    );

    // Configure S3 event notifications to SQS
    void new aws.s3.BucketNotification(
      `datapipeline-bucket-notification-${environmentSuffix}`,
      {
        bucket: bucket.id,
        queues: [
          {
            queueArn: queue.arn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
      },
      {
        parent: bucket,
        dependsOn: [queuePolicy],
      }
    );

    // Create DynamoDB table for file metadata
    const table = new aws.dynamodb.Table(
      `datapipeline-table-${environmentSuffix}`,
      {
        name: pulumi.interpolate`datapipeline-table-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'fileId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'fileId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'S',
          },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: resourceTags,
      },
      { parent: this }
    );

    // Create IAM policy for S3 and DynamoDB access
    void new aws.iam.Policy(
      `datapipeline-access-policy-${environmentSuffix}`,
      {
        name: pulumi.interpolate`datapipeline-access-policy-${environmentSuffix}`,
        description: `Allows read/write access to S3 bucket and DynamoDB table for ${environmentSuffix} environment`,
        policy: pulumi
          .all([bucket.arn, table.arn, queue.arn])
          .apply(([bucketArn, tableArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:SendMessage',
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                  ],
                  Resource: queueArn,
                },
              ],
            })
          ),
        tags: resourceTags,
      },
      { parent: this }
    );

    // Export resource identifiers
    this.bucketName = bucket.bucket;
    this.tableName = table.name;
    this.queueUrl = queue.url;

    // Register outputs
    this.registerOutputs({
      bucketName: this.bucketName,
      tableName: this.tableName,
      queueUrl: this.queueUrl,
      region: region,
      environment: environmentSuffix,
    });
  }
}
