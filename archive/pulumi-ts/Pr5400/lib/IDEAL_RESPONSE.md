# Multi-Environment Data Pipeline Infrastructure - Pulumi TypeScript Implementation

This solution implements a multi-environment data pipeline infrastructure using Pulumi with TypeScript, designed to automatically replicate production configuration changes to development and staging environments.

## Architecture Overview

The infrastructure consists of three independently deployable stacks (dev, staging, prod), with the production stack containing additional resources for event-driven replication:

- **Storage Layer**: S3 buckets for data storage with versioning and lifecycle policies
- **Metadata Layer**: DynamoDB tables for pipeline metadata storage
- **Replication Layer**: Lambda functions for automated configuration replication (prod only)
- **Event Processing**: EventBridge rules to trigger replication workflows (prod only)
- **Notification System**: SNS topics for success and failure notifications
- **Error Handling**: SQS dead letter queue for failed replication attempts

## Implementation Files

### 1. Type Definitions (`lib/types.ts`)

Defines TypeScript interfaces for consistent resource configurations across all environments.

```typescript
export interface EnvironmentConfig {
  environment: string;
  environmentSuffix: string;
  region: string;
  tags: {
    Environment: string;
    Project: string;
    ManagedBy: string;
    [key: string]: string;
  };
}

export interface ReplicationEvent {
  source: string;
  detailType: string;
  detail: {
    eventSource: string;
    eventName: string;
    requestParameters: {
      bucketName?: string;
      tableName?: string;
      key?: string;
    };
  };
}

export interface ReplicationResult {
  success: boolean;
  environment: string;
  resourceType: string;
  resourceId: string;
  timestamp: number;
  error?: string;
}
```

**Key Features:**
- `EnvironmentConfig` standardizes environment-specific configurations
- `ReplicationEvent` models EventBridge events from CloudTrail
- `ReplicationResult` provides structured response format for replication operations

### 2. Environment Component Resource (`lib/environment-component.ts`)

Implements a reusable Pulumi ComponentResource that creates all infrastructure for a single environment.

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig } from './types';

export class DataPipelineEnvironment extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly table: aws.dynamodb.Table;
  public readonly successTopic: aws.sns.Topic;
  public readonly failureTopic: aws.sns.Topic;
  public readonly dlq: aws.sqs.Queue;
  public readonly replicationFunction?: aws.lambda.Function;
  public readonly eventRule?: aws.cloudwatch.EventRule;
  private readonly lambdaRole?: aws.iam.Role;

  constructor(
    name: string,
    config: EnvironmentConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:DataPipeline:Environment', name, {}, opts);

    const defaultOpts = { parent: this };
    const environment = config.environment;
    const suffix = config.environmentSuffix;

    // S3 Bucket for data storage
    this.bucket = new aws.s3.Bucket(
      `company-data-${environment}-${suffix}`,
      {
        bucket:
          `company-data-${environment}-${config.region}-${suffix}`.toLowerCase(),
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        forceDestroy: true,
        tags: {
          ...config.tags,
          Name: `company-data-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // DynamoDB Table for metadata storage
    this.table = new aws.dynamodb.Table(
      `pipeline-metadata-${environment}-${suffix}`,
      {
        name: `pipeline-metadata-${environment}-${suffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'id', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'environment', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'environment-index',
            hashKey: 'environment',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        tags: {
          ...config.tags,
          Name: `pipeline-metadata-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // SNS Topic for success notifications
    this.successTopic = new aws.sns.Topic(
      `replication-success-${environment}-${suffix}`,
      {
        name: `replication-success-${environment}-${suffix}`,
        tags: {
          ...config.tags,
          Name: `replication-success-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // SNS Topic for failure notifications
    this.failureTopic = new aws.sns.Topic(
      `replication-failure-${environment}-${suffix}`,
      {
        name: `replication-failure-${environment}-${suffix}`,
        tags: {
          ...config.tags,
          Name: `replication-failure-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // Dead Letter Queue for failed replications
    this.dlq = new aws.sqs.Queue(
      `replication-dlq-${environment}-${suffix}`,
      {
        name: `replication-dlq-${environment}-${suffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...config.tags,
          Name: `replication-dlq-${environment}-${suffix}`,
        },
      },
      defaultOpts
    );

    // Production-specific resources
    if (environment === 'prod') {
      // IAM Role for Lambda function
      this.lambdaRole = new aws.iam.Role(
        `replication-lambda-role-${suffix}`,
        {
          name: `replication-lambda-role-${suffix}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              },
            ],
          }),
          tags: {
            ...config.tags,
            Name: `replication-lambda-role-${suffix}`,
          },
        },
        defaultOpts
      );

      // Attach basic Lambda execution policy
      new aws.iam.RolePolicyAttachment(
        `lambda-basic-execution-${suffix}`,
        {
          role: this.lambdaRole.name,
          policyArn:
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        },
        defaultOpts
      );

      // Custom policy for cross-environment access
      const replicationPolicy = new aws.iam.Policy(
        `replication-policy-${suffix}`,
        {
          name: `replication-policy-${suffix}`,
          policy: pulumi
            .all([
              this.bucket.arn,
              this.table.arn,
              this.successTopic.arn,
              this.failureTopic.arn,
              this.dlq.arn,
            ])
            .apply(
              ([
                bucketArn,
                tableArn,
                successTopicArn,
                failureTopicArn,
                dlqArn,
              ]) =>
                JSON.stringify({
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: ['s3:GetObject', 's3:ListBucket'],
                      Resource: [bucketArn, `${bucketArn}/*`],
                    },
                    {
                      Effect: 'Allow',
                      Action: ['s3:PutObject'],
                      Resource: [
                        'arn:aws:s3:::company-data-dev-*/*',
                        'arn:aws:s3:::company-data-staging-*/*',
                      ],
                    },
                    {
                      Effect: 'Allow',
                      Action: [
                        'dynamodb:GetItem',
                        'dynamodb:Query',
                        'dynamodb:Scan',
                      ],
                      Resource: tableArn,
                    },
                    {
                      Effect: 'Allow',
                      Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                      Resource: [
                        `arn:aws:dynamodb:${config.region}:*:table/pipeline-metadata-dev-*`,
                        `arn:aws:dynamodb:${config.region}:*:table/pipeline-metadata-staging-*`,
                      ],
                    },
                    {
                      Effect: 'Allow',
                      Action: ['sns:Publish'],
                      Resource: [successTopicArn, failureTopicArn],
                    },
                    {
                      Effect: 'Allow',
                      Action: ['sqs:SendMessage'],
                      Resource: dlqArn,
                    },
                  ],
                })
            ),
          tags: {
            ...config.tags,
            Name: `replication-policy-${suffix}`,
          },
        },
        defaultOpts
      );

      new aws.iam.RolePolicyAttachment(
        `lambda-replication-policy-${suffix}`,
        {
          role: this.lambdaRole.name,
          policyArn: replicationPolicy.arn,
        },
        defaultOpts
      );

      // Lambda function for replication
      this.replicationFunction = new aws.lambda.Function(
        `config-replication-${suffix}`,
        {
          name: `config-replication-${suffix}`,
          runtime: aws.lambda.Runtime.NodeJS18dX,
          handler: 'index.handler',
          role: this.lambdaRole.arn,
          timeout: 300, // 5 minutes
          code: new pulumi.asset.AssetArchive({
            '.': new pulumi.asset.FileArchive('./lib/lambda/replication'),
          }),
          environment: {
            variables: {
              PROD_BUCKET: this.bucket.id,
              PROD_TABLE: this.table.name,
              SUCCESS_TOPIC_ARN: this.successTopic.arn,
              FAILURE_TOPIC_ARN: this.failureTopic.arn,
              DLQ_URL: this.dlq.url,
              ENVIRONMENT_SUFFIX: suffix,
              REGION: config.region,
            },
          },
          deadLetterConfig: {
            targetArn: this.dlq.arn,
          },
          tags: {
            ...config.tags,
            Name: `config-replication-${suffix}`,
          },
        },
        defaultOpts
      );

      // EventBridge rule for production changes
      this.eventRule = new aws.cloudwatch.EventRule(
        `prod-config-change-${suffix}`,
        {
          name: `prod-config-change-${suffix}`,
          description:
            'Trigger replication on production configuration changes',
          eventPattern: pulumi
            .all([this.bucket.id, this.table.name])
            .apply(([bucketName, tableName]) =>
              JSON.stringify({
                source: ['aws.s3', 'aws.dynamodb'],
                detailType: ['AWS API Call via CloudTrail'],
                detail: {
                  eventSource: ['s3.amazonaws.com', 'dynamodb.amazonaws.com'],
                  eventName: [
                    'PutObject',
                    'CopyObject',
                    'PutItem',
                    'UpdateItem',
                  ],
                  requestParameters: {
                    bucketName: [bucketName],
                    tableName: [tableName],
                  },
                },
              })
            ),
          tags: {
            ...config.tags,
            Name: `prod-config-change-${suffix}`,
          },
        },
        defaultOpts
      );

      // EventBridge target to invoke Lambda
      new aws.cloudwatch.EventTarget(
        `replication-target-${suffix}`,
        {
          rule: this.eventRule.name,
          arn: this.replicationFunction.arn,
        },
        defaultOpts
      );

      // Permission for EventBridge to invoke Lambda
      new aws.lambda.Permission(
        `eventbridge-invoke-${suffix}`,
        {
          action: 'lambda:InvokeFunction',
          function: this.replicationFunction.name,
          principal: 'events.amazonaws.com',
          sourceArn: this.eventRule.arn,
        },
        defaultOpts
      );
    }

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      tableName: this.table.name,
      tableArn: this.table.arn,
      successTopicArn: this.successTopic.arn,
      failureTopicArn: this.failureTopic.arn,
      dlqUrl: this.dlq.url,
      dlqArn: this.dlq.arn,
    });
  }
}
```

**Key Features:**
- Creates complete environment infrastructure as a single ComponentResource
- Conditional logic for production-only resources (Lambda, EventBridge, IAM roles)
- Least-privilege IAM policies with specific resource-level permissions
- S3 buckets with versioning and 30-day lifecycle policies
- DynamoDB tables with on-demand billing and global secondary index
- Lambda function with 5-minute timeout and dead letter queue configuration
- EventBridge rule filtering production S3 and DynamoDB changes only

### 3. Main Stack Entry Point (`lib/index.ts`)

Creates and configures the environment infrastructure using the ComponentResource pattern.

```typescript
import * as pulumi from '@pulumi/pulumi';
import { DataPipelineEnvironment } from './environment-component';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  pulumi.getStack();
const environment = pulumi.getStack();
const awsRegion = 'us-east-1';

// Create the environment infrastructure
const pipelineEnv = new DataPipelineEnvironment(
  `data-pipeline-${environment}`,
  {
    environment: environment,
    environmentSuffix: environmentSuffix,
    region: awsRegion,
    tags: {
      Environment: environment,
      Project: 'MultiEnvDataPipeline',
      ManagedBy: 'Pulumi',
    },
  }
);

// Export outputs
export const bucketName = pipelineEnv.bucket.id;
export const bucketArn = pipelineEnv.bucket.arn;
export const tableName = pipelineEnv.table.name;
export const tableArn = pipelineEnv.table.arn;
export const successTopicArn = pipelineEnv.successTopic.arn;
export const failureTopicArn = pipelineEnv.failureTopic.arn;
export const dlqUrl = pipelineEnv.dlq.url;
export const dlqArn = pipelineEnv.dlq.arn;

// Production-specific exports (only defined if prod stack)
export const replicationFunctionArn = pipelineEnv.replicationFunction?.arn;
export const replicationFunctionName = pipelineEnv.replicationFunction?.name;
export const eventRuleArn = pipelineEnv.eventRule?.arn;
export const eventRuleName = pipelineEnv.eventRule?.name;
```

**Key Features:**
- Uses Pulumi Config for flexible environment configuration
- Fallback to environment variable or stack name for environmentSuffix
- Creates single environment infrastructure using ComponentResource
- Exports all resource identifiers for stack references
- Production-specific exports are conditionally undefined for non-prod stacks

### 4. Lambda Replication Function (`lib/lambda/replication/index.ts`)

Implements the replication logic for copying production changes to dev and staging environments.

```typescript
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });

const PROD_BUCKET = process.env.PROD_BUCKET!;
const PROD_TABLE = process.env.PROD_TABLE!;
const SUCCESS_TOPIC_ARN = process.env.SUCCESS_TOPIC_ARN!;
const FAILURE_TOPIC_ARN = process.env.FAILURE_TOPIC_ARN!;
const DLQ_URL = process.env.DLQ_URL!;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX!;

interface EventDetail {
  eventSource: string;
  eventName: string;
  requestParameters: {
    bucketName?: string;
    tableName?: string;
    key?: string;
  };
}

interface ReplicationEvent {
  detail: EventDetail;
}

const TARGET_ENVIRONMENTS = ['dev', 'staging'];
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i >= retries - 1) {
        throw error;
      }
      const delay = INITIAL_DELAY * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${retries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

async function replicateS3Object(
  key: string,
  targetEnv: string
): Promise<void> {
  console.log(`Replicating S3 object ${key} to ${targetEnv}`);

  const getCommand = new GetObjectCommand({
    Bucket: PROD_BUCKET,
    Key: key,
  });

  const response = await retryWithBackoff(() => s3Client.send(getCommand));
  const body = await response.Body?.transformToByteArray();

  if (!body) {
    throw new Error('Empty object body');
  }

  const targetBucket = `company-data-${targetEnv}-${REGION}-${ENVIRONMENT_SUFFIX}`;
  const putCommand = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    Body: body,
    Metadata: response.Metadata,
  });

  await retryWithBackoff(() => s3Client.send(putCommand));
  console.log(`Successfully replicated S3 object to ${targetBucket}/${key}`);
}

async function replicateDynamoDBItem(
  itemKey: Record<string, AttributeValue>
): Promise<void> {
  console.log('Replicating DynamoDB item to target environments');

  const getCommand = new GetItemCommand({
    TableName: PROD_TABLE,
    Key: itemKey,
  });

  const response = await retryWithBackoff(() => dynamoClient.send(getCommand));

  if (!response.Item) {
    throw new Error('Item not found');
  }

  for (const targetEnv of TARGET_ENVIRONMENTS) {
    const targetTable = `pipeline-metadata-${targetEnv}-${ENVIRONMENT_SUFFIX}`;
    const putCommand = new PutItemCommand({
      TableName: targetTable,
      Item: {
        ...response.Item,
        environment: { S: targetEnv },
        replicatedFrom: { S: 'prod' },
        replicationTimestamp: { N: Date.now().toString() },
      },
    });

    await retryWithBackoff(() => dynamoClient.send(putCommand));
    console.log(`Successfully replicated DynamoDB item to ${targetTable}`);
  }
}

async function publishNotification(
  success: boolean,
  message: string
): Promise<void> {
  const topicArn = success ? SUCCESS_TOPIC_ARN : FAILURE_TOPIC_ARN;
  const subject = success ? 'Replication Success' : 'Replication Failure';

  const command = new PublishCommand({
    TopicArn: topicArn,
    Subject: subject,
    Message: JSON.stringify(
      {
        success,
        message,
        timestamp: new Date().toISOString(),
        environment: 'prod',
      },
      null,
      2
    ),
  });

  await snsClient.send(command);
}

async function sendToDeadLetterQueue(
  event: ReplicationEvent,
  error: string
): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: DLQ_URL,
    MessageBody: JSON.stringify({
      event,
      error,
      timestamp: new Date().toISOString(),
    }),
  });

  await sqsClient.send(command);
}

export async function handler(
  event: ReplicationEvent
): Promise<{ statusCode: number; body: string }> {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const detail = event.detail;
    const eventSource = detail.eventSource;

    if (eventSource === 's3.amazonaws.com') {
      const key = detail.requestParameters.key;
      if (!key) {
        throw new Error('S3 key not found in event');
      }

      for (const targetEnv of TARGET_ENVIRONMENTS) {
        await replicateS3Object(key, targetEnv);
      }

      await publishNotification(
        true,
        `Successfully replicated S3 object ${key} to ${TARGET_ENVIRONMENTS.join(', ')}`
      );
    } else if (eventSource === 'dynamodb.amazonaws.com') {
      const itemKey = {
        id: { S: detail.requestParameters.key || 'unknown' },
        timestamp: { N: Date.now().toString() },
      };

      await replicateDynamoDBItem(itemKey);

      await publishNotification(
        true,
        `Successfully replicated DynamoDB item to ${TARGET_ENVIRONMENTS.join(', ')}`
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Replication completed successfully' }),
    };
  } catch (error) {
    console.error('Replication failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await sendToDeadLetterQueue(event, errorMessage);
    await publishNotification(false, `Replication failed: ${errorMessage}`);

    throw error;
  }
}
```

**Key Features:**
- **Exponential Backoff**: Implements retry logic with exponential delays (1s, 2s, 4s, 8s, 16s)
- **S3 Replication**: Reads objects from production bucket and writes to dev/staging buckets
- **DynamoDB Replication**: Reads items from production table and writes to dev/staging tables
- **Error Handling**: Failed operations are sent to dead letter queue with full context
- **Notifications**: Success and failure events are published to appropriate SNS topics
- **Structured Logging**: Console logs provide detailed operational context

## Deployment Instructions

### Prerequisites

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Install Node.js dependencies
npm ci

# Configure AWS credentials
aws configure
```

### Deploy Each Environment

```bash
# Deploy dev environment
pulumi stack select dev
pulumi config set environmentSuffix pr5400
pulumi up

# Deploy staging environment
pulumi stack select staging
pulumi config set environmentSuffix pr5400
pulumi up

# Deploy prod environment
pulumi stack select prod
pulumi config set environmentSuffix pr5400
pulumi up
```

### Verify Deployment

```bash
# Get outputs for a specific stack
pulumi stack output --json

# Test S3 bucket
aws s3 ls s3://company-data-prod-us-east-1-pr5400/

# Test DynamoDB table
aws dynamodb describe-table --table-name pipeline-metadata-prod-pr5400

# Check Lambda function
aws lambda get-function --function-name config-replication-pr5400

# Verify EventBridge rule
aws events describe-rule --name prod-config-change-pr5400
```

## Key Design Decisions

1. **ComponentResource Pattern**: Encapsulates all environment resources in a reusable component for consistency and maintainability

2. **Conditional Production Resources**: Lambda and EventBridge resources are only created for the production stack, reducing costs and complexity

3. **Exponential Backoff**: Implements robust retry logic to handle transient AWS service failures

4. **Least-Privilege IAM**: Lambda role has specific permissions only for required operations across environments

5. **Event-Driven Architecture**: EventBridge monitors CloudTrail events for S3 and DynamoDB changes, triggering Lambda automatically

6. **Comprehensive Error Handling**: Failed replications are captured in DLQ with full event context for troubleshooting

7. **Notification System**: SNS topics provide real-time visibility into replication success and failure states

8. **Resource Naming Convention**: All resources include environmentSuffix for global uniqueness and easy identification

9. **Versioning and Lifecycle**: S3 buckets have versioning enabled and 30-day expiration to manage storage costs

10. **On-Demand Billing**: DynamoDB tables use PAY_PER_REQUEST mode to optimize costs for variable workloads

## Resource Outputs

Each stack exports the following outputs:

**Common to all environments:**
- `bucketName`: S3 bucket name for data storage
- `bucketArn`: S3 bucket ARN
- `tableName`: DynamoDB table name for metadata
- `tableArn`: DynamoDB table ARN
- `successTopicArn`: SNS topic ARN for success notifications
- `failureTopicArn`: SNS topic ARN for failure notifications
- `dlqUrl`: SQS dead letter queue URL
- `dlqArn`: SQS dead letter queue ARN

**Production stack only:**
- `replicationFunctionArn`: Lambda function ARN for replication
- `replicationFunctionName`: Lambda function name
- `eventRuleArn`: EventBridge rule ARN
- `eventRuleName`: EventBridge rule name

## Testing the Replication

```bash
# Upload a file to production S3 bucket
aws s3 cp test-file.json s3://company-data-prod-us-east-1-pr5400/

# Check Lambda logs to verify replication
aws logs tail /aws/lambda/config-replication-pr5400 --follow

# Verify file replicated to dev
aws s3 ls s3://company-data-dev-us-east-1-pr5400/

# Verify file replicated to staging
aws s3 ls s3://company-data-staging-us-east-1-pr5400/

# Check SNS notifications
aws sns list-subscriptions-by-topic --topic-arn <SUCCESS_TOPIC_ARN>
```

## Cleanup

```bash
# Destroy each stack in reverse order
pulumi stack select prod
pulumi destroy

pulumi stack select staging
pulumi destroy

pulumi stack select dev
pulumi destroy
```
