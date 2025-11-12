# Multi-Environment Data Pipeline Infrastructure - Model Response (With Bugs)

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Multi-Environment Data Pipeline Infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly queueUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const config = new pulumi.Config();
    const environmentSuffix = args.environmentSuffix || config.get('env') || 'dev';

    // BUG 1: Missing required tags - not merging Environment, Project, and ManagedBy
    const resourceTags = args.tags || {};

    // BUG 2: No random suffix - bucket names may not be globally unique
    // Create S3 Bucket
    const bucket = new aws.s3.Bucket(
      `datapipeline-bucket-${environmentSuffix}`,
      {
        bucket: `datapipeline-bucket-${environmentSuffix}`,
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
            id: 'transition-to-glacier',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: resourceTags,
      },
      { parent: this }
    );

    // Create DynamoDB table
    const table = new aws.dynamodb.Table(
      `datapipeline-table-${environmentSuffix}`,
      {
        name: `datapipeline-table-${environmentSuffix}`,
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
        // BUG 3: Missing point-in-time recovery
        tags: resourceTags,
      },
      { parent: this }
    );

    // Create SQS Queue
    const queue = new aws.sqs.Queue(
      `datapipeline-queue-${environmentSuffix}`,
      {
        name: `datapipeline-queue-${environmentSuffix}`,
        messageRetentionSeconds: 14 * 24 * 60 * 60,
        visibilityTimeoutSeconds: 300,
        tags: resourceTags,
      },
      { parent: this }
    );

    // BUG 4: Missing SQS Queue Policy - S3 won't be able to send messages

    // BUG 5: Using deprecated bucket notification syntax
    // Configure S3 event notifications
    bucket.onObjectCreated('object-created', queue);

    // Create IAM policy
    const dataAccessPolicy = new aws.iam.Policy(
      `datapipeline-access-policy-${environmentSuffix}`,
      {
        name: `datapipeline-access-policy-${environmentSuffix}`,
        description: `Allows read/write access to S3 bucket and DynamoDB table for ${environmentSuffix} environment`,
        policy: pulumi
          .all([bucket.arn, table.arn, queue.arn])
          .apply(([bucketArn, tableArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
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
                  Action: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
                  Resource: queueArn,
                },
              ],
            })
          ),
        tags: resourceTags,
      },
      { parent: this }
    );

    // BUG 6: Exporting bucket.id instead of bucket.bucket (will export ARN instead of name)
    this.bucketName = bucket.id;
    this.tableName = table.name;
    this.queueUrl = queue.url;

    // BUG 7: Not registering outputs
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs
export const bucketName = stack.bucketName;
export const tableName = stack.tableName;
export const queueUrl = stack.queueUrl;
```

## Known Issues in This Implementation

1. **Missing Required Tags**: Not merging Environment, Project, and ManagedBy tags as required
2. **No Random Suffix**: S3 bucket may fail to create if name already exists globally
3. **Old S3 API Usage**: Using deprecated properties like `versioning`, `serverSideEncryptionConfiguration`, and `lifecycleRules` instead of separate V2 resources
4. **Missing Point-in-Time Recovery**: DynamoDB table doesn't have PITR enabled
5. **Missing Queue Policy**: S3 cannot send notifications to SQS without proper policy
6. **Deprecated Notification Method**: Using `bucket.onObjectCreated()` which doesn't exist in Pulumi AWS provider
7. **Wrong Output Property**: Exporting bucket.id (ARN) instead of bucket.bucket (name)
8. **Missing registerOutputs()**: Not calling registerOutputs() in the constructor
9. **No Dependency Management**: Missing dependsOn for bucket notification on queue policy
10. **No Pulumi Interpolation**: Using template literals instead of pulumi.interpolate for resource names