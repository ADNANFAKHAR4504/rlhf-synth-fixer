import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SchedulerSchedule } from '@cdktf/provider-aws/lib/scheduler-schedule';
import { SchedulerScheduleGroup } from '@cdktf/provider-aws/lib/scheduler-schedule-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import * as path from 'path';

interface PriceMonitorStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class PriceMonitorStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: PriceMonitorStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Add unique suffix to avoid resource conflicts
    const resourceSuffix = 'primary-5';

    // Configure providers
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new ArchiveProvider(this, 'archive');

    // S3 Bucket for historical data
    // Add timestamp to make bucket name unique and avoid conflicts
    const bucketSuffix = Date.now().toString().slice(-8);
    const historicalDataBucket = new S3Bucket(this, 'historical-data-bucket', {
      bucket: `price-monitor-historical-${environmentSuffix}-${bucketSuffix}`,
      tags: {
        Name: 'Price Monitor Historical Data',
        Environment: environmentSuffix,
      },
    });

    new S3BucketVersioningA(this, 'historical-data-versioning', {
      bucket: historicalDataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketPublicAccessBlock(this, 'historical-data-pab', {
      bucket: historicalDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DynamoDB Table with Streams and PITR
    const priceTable = new DynamodbTable(this, 'price-table', {
      name: `price-monitor-${environmentSuffix}-${resourceSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'product_id',
      rangeKey: 'timestamp',

      attribute: [
        {
          name: 'product_id',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
        {
          name: 'retailer',
          type: 'S',
        },
      ],

      globalSecondaryIndex: [
        {
          name: 'retailer-index',
          hashKey: 'retailer',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],

      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      pointInTimeRecovery: {
        enabled: true,
      },

      tags: {
        Name: 'Price Monitor Table',
        Environment: environmentSuffix,
      },
    });

    // SQS Queues
    const deadLetterQueue = new SqsQueue(this, 'scraping-dlq', {
      name: `price-monitor-dlq-${environmentSuffix}-${resourceSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: 'Price Monitor DLQ',
        Environment: environmentSuffix,
      },
    });

    const scrapingQueue = new SqsQueue(this, 'scraping-queue', {
      name: `price-monitor-scraping-${environmentSuffix}-${resourceSuffix}`,
      visibilityTimeoutSeconds: 300, // 5 minutes
      messageRetentionSeconds: 86400, // 1 day
      receiveWaitTimeSeconds: 20, // Long polling
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: deadLetterQueue.arn,
        maxReceiveCount: 3,
      }),
      tags: {
        Name: 'Price Monitor Scraping Queue',
        Environment: environmentSuffix,
      },
    });

    // SNS Topic for notifications
    const notificationTopic = new SnsTopic(this, 'notification-topic', {
      name: `price-monitor-notifications-${environmentSuffix}-${resourceSuffix}`,
      displayName: 'Price Drop Notifications',
      tags: {
        Name: 'Price Monitor Notifications',
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Log Groups
    const scraperLogGroup = new CloudwatchLogGroup(this, 'scraper-logs', {
      name: `/aws/lambda/price-scraper-${environmentSuffix}-${resourceSuffix}`,
      retentionInDays: 7,
    });

    const streamProcessorLogGroup = new CloudwatchLogGroup(
      this,
      'stream-processor-logs',
      {
        name: `/aws/lambda/stream-processor-${environmentSuffix}-${resourceSuffix}`,
        retentionInDays: 7,
      }
    );

    // IAM Roles and Policies
    const lambdaAssumeRole = new DataAwsIamPolicyDocument(
      this,
      'lambda-assume-role',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['lambda.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    const scraperRole = new IamRole(this, 'scraper-role', {
      name: `price-scraper-role-${environmentSuffix}-${resourceSuffix}`,
      assumeRolePolicy: lambdaAssumeRole.json,
    });

    const streamProcessorRole = new IamRole(this, 'stream-processor-role', {
      name: `stream-processor-role-${environmentSuffix}-${resourceSuffix}`,
      assumeRolePolicy: lambdaAssumeRole.json,
    });

    const scraperPolicy = new IamPolicy(this, 'scraper-policy', {
      name: `price-scraper-policy-${environmentSuffix}-${resourceSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `${scraperLogGroup.arn}:*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:BatchWriteItem',
            ],
            Resource: [priceTable.arn, `${priceTable.arn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
              'sqs:SendMessage',
            ],
            Resource: [scrapingQueue.arn, deadLetterQueue.arn],
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: `${historicalDataBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      }),
    });

    const streamProcessorPolicy = new IamPolicy(
      this,
      'stream-processor-policy',
      {
        name: `stream-processor-policy-${environmentSuffix}-${resourceSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: `${streamProcessorLogGroup.arn}:*`,
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              Resource: `${priceTable.arn}/stream/*`,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: notificationTopic.arn,
            },
            {
              Effect: 'Allow',
              Action: ['cloudwatch:PutMetricData'],
              Resource: '*',
            },
          ],
        }),
      }
    );

    new IamRolePolicyAttachment(this, 'scraper-policy-attachment', {
      role: scraperRole.name,
      policyArn: scraperPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'stream-processor-policy-attachment', {
      role: streamProcessorRole.name,
      policyArn: streamProcessorPolicy.arn,
    });

    // Package Lambda functions
    const scraperPackage = new DataArchiveFile(this, 'scraper-package', {
      type: 'zip',
      sourceDir: path.join(__dirname, 'lambda', 'scraper'),
      outputPath: path.join(__dirname, '..', 'dist', 'scraper.zip'),
    });

    const streamProcessorPackage = new DataArchiveFile(
      this,
      'stream-processor-package',
      {
        type: 'zip',
        sourceDir: path.join(__dirname, 'lambda', 'stream-processor'),
        outputPath: path.join(__dirname, '..', 'dist', 'stream-processor.zip'),
      }
    );

    // Lambda Functions
    const scraperFunction = new LambdaFunction(this, 'scraper-function', {
      functionName: `price-scraper-${environmentSuffix}-${resourceSuffix}`,
      role: scraperRole.arn,
      handler: 'index.handler',
      runtime: 'python3.10',
      timeout: 60,
      memorySize: 512,
      filename: scraperPackage.outputPath,
      sourceCodeHash: scraperPackage.outputBase64Sha256,
      environment: {
        variables: {
          PRICE_TABLE: priceTable.name,
          QUEUE_URL: scrapingQueue.url,
          S3_BUCKET: historicalDataBucket.bucket,
          ENVIRONMENT: environmentSuffix,
        },
      },
      tags: {
        Name: 'Price Scraper Lambda',
        Environment: environmentSuffix,
      },
    });

    const streamProcessorFunction = new LambdaFunction(
      this,
      'stream-processor-function',
      {
        functionName: `stream-processor-${environmentSuffix}-${resourceSuffix}`,
        role: streamProcessorRole.arn,
        handler: 'index.handler',
        runtime: 'python3.10',
        timeout: 30,
        memorySize: 256,
        filename: streamProcessorPackage.outputPath,
        sourceCodeHash: streamProcessorPackage.outputBase64Sha256,
        environment: {
          variables: {
            SNS_TOPIC_ARN: notificationTopic.arn,
            ENVIRONMENT: environmentSuffix,
          },
        },
        tags: {
          Name: 'Stream Processor Lambda',
          Environment: environmentSuffix,
        },
      }
    );

    // Event Source Mappings
    new LambdaEventSourceMapping(this, 'sqs-to-scraper', {
      eventSourceArn: scrapingQueue.arn,
      functionName: scraperFunction.functionName,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5,
    });

    new LambdaEventSourceMapping(this, 'streams-to-processor', {
      eventSourceArn: priceTable.streamArn!,
      functionName: streamProcessorFunction.functionName,
      startingPosition: 'LATEST',
      maximumBatchingWindowInSeconds: 10,
      parallelizationFactor: 10,
      maximumRetryAttempts: 3,
    });

    // EventBridge Scheduler
    const schedulerGroup = new SchedulerScheduleGroup(this, 'scheduler-group', {
      name: `price-monitor-${environmentSuffix}-${resourceSuffix}`,
      tags: {
        Name: 'Price Monitor Scheduler Group',
        Environment: environmentSuffix,
      },
    });

    const schedulerRole = new IamRole(this, 'scheduler-role', {
      name: `price-scheduler-role-${environmentSuffix}-${resourceSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'scheduler.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      inlinePolicy: [
        {
          name: 'scheduler-sqs-policy',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage'],
                Resource: scrapingQueue.arn,
              },
            ],
          }),
        },
      ],
    });

    new SchedulerSchedule(this, 'price-scraper-schedule', {
      name: `price-scraper-${environmentSuffix}`,
      groupName: schedulerGroup.name,
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 15,
      },
      scheduleExpression: 'rate(6 hours)',
      target: {
        arn: scrapingQueue.arn,
        roleArn: schedulerRole.arn,
        input: JSON.stringify({
          action: 'scrape_all_products',
          // Timestamp will be added by the Lambda function when processing
        }),
      },
      state: 'ENABLED',
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'scraper-error-alarm', {
      alarmName: `price-scraper-errors-${environmentSuffix}-${resourceSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when scraper function has high error rate',
      dimensions: {
        FunctionName: scraperFunction.functionName,
      },
      alarmActions: [notificationTopic.arn],
    });

    new CloudwatchMetricAlarm(this, 'dlq-alarm', {
      alarmName: `price-monitor-dlq-${environmentSuffix}-${resourceSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'ApproximateNumberOfMessagesVisible',
      namespace: 'AWS/SQS',
      period: 300,
      statistic: 'Average',
      threshold: 5,
      alarmDescription: 'Alert when messages are in DLQ',
      dimensions: {
        QueueName: deadLetterQueue.name,
      },
      alarmActions: [notificationTopic.arn],
    });
  }
}
