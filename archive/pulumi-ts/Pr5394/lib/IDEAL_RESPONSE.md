# Multi-Environment Data Pipeline Infrastructure

## Implementation Overview

This solution implements a complete multi-environment data pipeline infrastructure using Pulumi with TypeScript. It creates consistent infrastructure across development, staging, and production environments with S3 for data storage, DynamoDB for metadata, SQS for event notifications, and IAM for access control.

## File: lib/tap-stack.ts

```typescript
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
    const bucketVersioning = new aws.s3.BucketVersioningV2(
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
    const bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
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
    const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
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
    const bucketNotification = new aws.s3.BucketNotification(
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
    const dataAccessPolicy = new aws.iam.Policy(
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
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for easy access
export const bucketName = stack.bucketName;
export const tableName = stack.tableName;
export const queueUrl = stack.queueUrl;
```

## Key Features

### 1. Multi-Environment Support

- Environment parameter (dev, staging, prod) controls resource naming
- Uses Pulumi configuration system for environment-specific settings
- All resource names follow pattern: `datapipeline-{resourceType}-{environment}`

### 2. S3 Configuration

- Versioning enabled for data protection
- SSE-S3 encryption for data at rest
- Lifecycle rule to transition objects to Glacier after 90 days
- Event notifications trigger on object creation
- Random suffix ensures globally unique bucket names

### 3. DynamoDB Table

- On-demand billing mode for cost efficiency
- Partition key: `fileId`, Sort key: `timestamp`
- Point-in-time recovery enabled for data protection
- Environment-specific naming

### 4. SQS Integration

- 14-day message retention period
- 5-minute visibility timeout
- Receives S3 event notifications
- Queue policy allows S3 to send messages

### 5. IAM Security

- Least privilege access policy
- Environment-specific resource access
- Includes S3, DynamoDB, and SQS permissions
- Read/write operations for same environment only

### 6. Resource Tagging

- Consistent tags across all resources
- Environment tag for environment identification
- Project: DataPipeline
- ManagedBy: Pulumi

### 7. Dependency Management

- Queue policy created before bucket notifications
- Proper parent relationships for resource organization
- Uses Pulumi's dependsOn for explicit dependencies

### 8. Stack Outputs

- S3 bucket name
- DynamoDB table name
- SQS queue URL
- All exported for easy reference

## Deployment

```bash
# Set environment
pulumi config set env dev

# Set region (optional, defaults to us-east-1)
pulumi config set region us-east-1

# Deploy
pulumi up

# View outputs
pulumi stack output bucketName
pulumi stack output tableName
pulumi stack output queueUrl
```

## Design Decisions

1. **Random Suffix for S3**: Uses `aws.random.RandomId` to ensure bucket names are globally unique across environments
2. **Queue-First Approach**: Creates SQS queue and policy before S3 bucket notification to avoid circular dependencies
3. **Pulumi Interpolation**: Uses `pulumi.interpolate` for dynamic resource naming with environment suffix
4. **On-Demand Billing**: DynamoDB on-demand mode provides cost efficiency for variable workload
5. **Separate Resources**: Uses separate Pulumi resources for versioning, encryption, lifecycle, and notifications (AWS best practice)
6. **Point-in-Time Recovery**: Enabled on DynamoDB for data protection and compliance requirements
7. **ComponentResource Pattern**: Uses Pulumi ComponentResource for better organization and reusability
