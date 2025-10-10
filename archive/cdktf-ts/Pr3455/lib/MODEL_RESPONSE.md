# Price Monitoring Service Infrastructure

I'll create a comprehensive price monitoring service infrastructure using CDKTF with TypeScript. The system will track 5,300 daily product prices with automated scraping, change detection, and notifications.

## Infrastructure Stack

```typescript
// lib/price-monitor-stack.ts
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

    // Configure providers
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new ArchiveProvider(this, 'archive');

    // S3 Bucket for historical data
    const historicalDataBucket = new S3Bucket(this, 'historical-data-bucket', {
      bucket: `price-monitor-historical-${environmentSuffix}`,
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
      name: `price-monitor-${environmentSuffix}`,
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
      name: `price-monitor-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Name: 'Price Monitor DLQ',
        Environment: environmentSuffix,
      },
    });

    const scrapingQueue = new SqsQueue(this, 'scraping-queue', {
      name: `price-monitor-scraping-${environmentSuffix}`,
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
      name: `price-monitor-notifications-${environmentSuffix}`,
      displayName: 'Price Drop Notifications',
      tags: {
        Name: 'Price Monitor Notifications',
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Log Groups
    const scraperLogGroup = new CloudwatchLogGroup(this, 'scraper-logs', {
      name: `/aws/lambda/price-scraper-${environmentSuffix}`,
      retentionInDays: 7,
    });

    const streamProcessorLogGroup = new CloudwatchLogGroup(this, 'stream-processor-logs', {
      name: `/aws/lambda/stream-processor-${environmentSuffix}`,
      retentionInDays: 7,
    });

    // IAM Roles and Policies
    const lambdaAssumeRole = new DataAwsIamPolicyDocument(this, 'lambda-assume-role', {
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
    });

    const scraperRole = new IamRole(this, 'scraper-role', {
      name: `price-scraper-role-${environmentSuffix}`,
      assumeRolePolicy: lambdaAssumeRole.json,
    });

    const streamProcessorRole = new IamRole(this, 'stream-processor-role', {
      name: `stream-processor-role-${environmentSuffix}`,
      assumeRolePolicy: lambdaAssumeRole.json,
    });

    const scraperPolicy = new IamPolicy(this, 'scraper-policy', {
      name: `price-scraper-policy-${environmentSuffix}`,
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

    const streamProcessorPolicy = new IamPolicy(this, 'stream-processor-policy', {
      name: `stream-processor-policy-${environmentSuffix}`,
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
    });

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

    const streamProcessorPackage = new DataArchiveFile(this, 'stream-processor-package', {
      type: 'zip',
      sourceDir: path.join(__dirname, 'lambda', 'stream-processor'),
      outputPath: path.join(__dirname, '..', 'dist', 'stream-processor.zip'),
    });

    // Lambda Functions
    const scraperFunction = new LambdaFunction(this, 'scraper-function', {
      functionName: `price-scraper-${environmentSuffix}`,
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

    const streamProcessorFunction = new LambdaFunction(this, 'stream-processor-function', {
      functionName: `stream-processor-${environmentSuffix}`,
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
    });

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
      name: `price-monitor-${environmentSuffix}`,
      tags: {
        Name: 'Price Monitor Scheduler Group',
        Environment: environmentSuffix,
      },
    });

    const schedulerRole = new IamRole(this, 'scheduler-role', {
      name: `price-scheduler-role-${environmentSuffix}`,
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
          timestamp: '${time}',
        }),
      },
      state: 'ENABLED',
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'scraper-error-alarm', {
      alarmName: `price-scraper-errors-${environmentSuffix}`,
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
      alarmName: `price-monitor-dlq-${environmentSuffix}`,
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
```

## Scraper Lambda Function

```python
# lib/lambda/scraper/index.py
import json
import os
import time
import boto3
import random
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, List
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')
sqs = boto3.client('sqs')

PRICE_TABLE = os.environ['PRICE_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
QUEUE_URL = os.environ['QUEUE_URL']
ENVIRONMENT = os.environ['ENVIRONMENT']

table = dynamodb.Table(PRICE_TABLE)

def exponential_backoff(attempt: int, max_delay: int = 60) -> float:
    """Calculate exponential backoff with jitter."""
    delay = min(2 ** attempt + random.uniform(0, 1), max_delay)
    return delay

def scrape_price(product_id: str, retailer: str, url: str) -> Dict[str, Any]:
    """
    Simulate price scraping with exponential backoff.
    In production, this would make actual HTTP requests.
    """
    max_attempts = 5

    for attempt in range(max_attempts):
        try:
            # Simulate price scraping (replace with actual scraping logic)
            simulated_price = Decimal(str(round(random.uniform(10, 500), 2)))

            # Random failure simulation for testing retry logic
            if random.random() < 0.1:  # 10% failure rate
                raise Exception("Simulated scraping failure")

            return {
                'product_id': product_id,
                'retailer': retailer,
                'price': simulated_price,
                'url': url,
                'scraped_at': datetime.utcnow().isoformat(),
                'attempt': attempt + 1
            }

        except Exception as e:
            if attempt < max_attempts - 1:
                delay = exponential_backoff(attempt)
                logger.warning(f"Attempt {attempt + 1} failed for {product_id}, retrying in {delay:.2f}s: {str(e)}")
                time.sleep(delay)
            else:
                logger.error(f"Failed to scrape {product_id} after {max_attempts} attempts")
                raise

def store_price(price_data: Dict[str, Any]) -> None:
    """Store price in DynamoDB table."""
    timestamp = int(datetime.utcnow().timestamp() * 1000)

    item = {
        'product_id': price_data['product_id'],
        'timestamp': timestamp,
        'retailer': price_data['retailer'],
        'price': price_data['price'],
        'url': price_data['url'],
        'scraped_at': price_data['scraped_at'],
        'attempts': price_data['attempt']
    }

    table.put_item(Item=item)

    # Archive to S3 for historical analysis
    s3_key = f"prices/{price_data['retailer']}/{price_data['product_id']}/{timestamp}.json"
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=json.dumps(item, default=str),
        ContentType='application/json'
    )

def send_metrics(success_count: int, failure_count: int) -> None:
    """Send custom metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'PriceMonitor/{ENVIRONMENT}',
            MetricData=[
                {
                    'MetricName': 'ScrapingSuccess',
                    'Value': success_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'ScrapingFailure',
                    'Value': failure_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to send metrics: {str(e)}")

def process_batch(records: List[Dict]) -> Dict[str, int]:
    """Process a batch of SQS messages."""
    success_count = 0
    failure_count = 0

    for record in records:
        try:
            body = json.loads(record['body'])

            # Handle batch scraping request
            if body.get('action') == 'scrape_all_products':
                # Generate product list (in production, fetch from database or config)
                products = generate_product_list()

                # Send individual scraping jobs to queue
                for product in products:
                    sqs.send_message(
                        QueueUrl=QUEUE_URL,
                        MessageBody=json.dumps(product)
                    )

                logger.info(f"Queued {len(products)} products for scraping")
                success_count += 1
            else:
                # Handle individual product scraping
                product_id = body.get('product_id')
                retailer = body.get('retailer')
                url = body.get('url')

                if not all([product_id, retailer, url]):
                    raise ValueError("Missing required fields in message")

                price_data = scrape_price(product_id, retailer, url)
                store_price(price_data)

                logger.info(f"Successfully scraped and stored price for {product_id}")
                success_count += 1

        except Exception as e:
            logger.error(f"Failed to process record: {str(e)}")
            failure_count += 1

    return {'success': success_count, 'failure': failure_count}

def generate_product_list() -> List[Dict]:
    """Generate list of products to scrape."""
    products = []
    retailers = ['retailer_a', 'retailer_b', 'retailer_c']

    # Generate 5300 products distributed across retailers
    for i in range(5300):
        retailer = retailers[i % len(retailers)]
        products.append({
            'product_id': f'PROD_{i:06d}',
            'retailer': retailer,
            'url': f'https://{retailer}.com/product/{i}'
        })

    return products

def handler(event: Dict, context: Any) -> Dict:
    """Lambda handler for price scraping."""
    try:
        records = event.get('Records', [])

        if not records:
            logger.warning("No records to process")
            return {'statusCode': 200, 'body': json.dumps('No records to process')}

        results = process_batch(records)
        send_metrics(results['success'], results['failure'])

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(records),
                'success': results['success'],
                'failure': results['failure']
            })
        }

        logger.info(f"Processing complete: {response}")
        return response

    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Stream Processor Lambda Function

```python
# lib/lambda/stream-processor/index.py
import json
import os
import boto3
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, List
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']

# Price drop threshold (percentage)
PRICE_DROP_THRESHOLD = 10.0

def decimal_to_float(obj):
    """Convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def calculate_price_change(old_price: Decimal, new_price: Decimal) -> float:
    """Calculate percentage change between prices."""
    if old_price == 0:
        return 0.0

    change = ((new_price - old_price) / old_price) * 100
    return float(change)

def process_record(record: Dict) -> Dict[str, Any]:
    """Process a single DynamoDB stream record."""
    event_name = record.get('eventName')

    if event_name not in ['INSERT', 'MODIFY']:
        return None

    # Extract new and old images
    new_image = record.get('dynamodb', {}).get('NewImage', {})
    old_image = record.get('dynamodb', {}).get('OldImage', {})

    if not new_image:
        return None

    # Parse the data
    product_id = new_image.get('product_id', {}).get('S')
    retailer = new_image.get('retailer', {}).get('S')
    new_price = Decimal(new_image.get('price', {}).get('N', '0'))

    result = {
        'product_id': product_id,
        'retailer': retailer,
        'new_price': new_price,
        'event_type': event_name
    }

    # Check for price changes
    if old_image and event_name == 'MODIFY':
        old_price = Decimal(old_image.get('price', {}).get('N', '0'))
        result['old_price'] = old_price
        result['price_change'] = calculate_price_change(old_price, new_price)

        # Check if it's a significant price drop
        if result['price_change'] <= -PRICE_DROP_THRESHOLD:
            result['significant_drop'] = True

    return result

def send_notification(price_data: Dict[str, Any]) -> None:
    """Send price drop notification via SNS."""
    try:
        message = {
            'product_id': price_data['product_id'],
            'retailer': price_data['retailer'],
            'old_price': float(price_data.get('old_price', 0)),
            'new_price': float(price_data['new_price']),
            'price_change_percent': price_data['price_change'],
            'timestamp': datetime.utcnow().isoformat()
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Price Drop Alert: {price_data['product_id']}",
            Message=json.dumps(message, default=decimal_to_float),
            MessageAttributes={
                'product_id': {'DataType': 'String', 'StringValue': price_data['product_id']},
                'retailer': {'DataType': 'String', 'StringValue': price_data['retailer']},
                'price_change': {'DataType': 'Number', 'StringValue': str(price_data['price_change'])}
            }
        )

        logger.info(f"Sent notification for {price_data['product_id']}: {price_data['price_change']:.2f}% drop")

    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
        raise

def send_metrics(price_changes: int, price_drops: int) -> None:
    """Send metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'PriceMonitor/{ENVIRONMENT}',
            MetricData=[
                {
                    'MetricName': 'PriceChanges',
                    'Value': price_changes,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'SignificantPriceDrops',
                    'Value': price_drops,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to send metrics: {str(e)}")

def handler(event: Dict, context: Any) -> Dict:
    """Lambda handler for processing DynamoDB streams."""
    try:
        records = event.get('Records', [])

        if not records:
            logger.warning("No records to process")
            return {'statusCode': 200, 'body': json.dumps('No records to process')}

        price_changes = 0
        price_drops = 0
        notifications_sent = 0

        for record in records:
            try:
                result = process_record(record)

                if not result:
                    continue

                # Track metrics
                if 'price_change' in result:
                    price_changes += 1

                    # Send notification for significant price drops
                    if result.get('significant_drop'):
                        price_drops += 1
                        send_notification(result)
                        notifications_sent += 1

            except Exception as e:
                logger.error(f"Failed to process record: {str(e)}")
                # Continue processing other records
                continue

        # Send aggregated metrics
        send_metrics(price_changes, price_drops)

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(records),
                'price_changes': price_changes,
                'price_drops': price_drops,
                'notifications_sent': notifications_sent
            })
        }

        logger.info(f"Stream processing complete: {response}")
        return response

    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Updated Tap Stack

```typescript
// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { PriceMonitorStack } from './price-monitor-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate Price Monitor Stack
    new PriceMonitorStack(this, 'price-monitor', {
      environmentSuffix: environmentSuffix,
      awsRegion: awsRegion,
      defaultTags: props?.defaultTags,
    });
  }
}
```

## Lambda Requirements Files

```txt
# lib/lambda/scraper/requirements.txt
boto3==1.28.85
botocore==1.31.85
```

```txt
# lib/lambda/stream-processor/requirements.txt
boto3==1.28.85
botocore==1.31.85
```