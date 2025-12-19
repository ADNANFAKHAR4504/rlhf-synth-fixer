# IoT Data Pipeline Implementation

Here's a complete IoT data pipeline implementation using AWS CDK with TypeScript that handles 500,000 daily sensor readings with real-time processing, analytics, and long-term storage.

## Architecture Overview

The pipeline follows this data flow:
```
IoT Devices → IoT Core → Kinesis Stream → Lambda Processor → DynamoDB + S3
                                                              ↓
                                                         Glue Crawler → Data Catalog
```

## Complete CDK Implementation

### Main Stack (`lib/tap-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix for resource naming
    const environmentSuffix = this.node.tryGetContext('environmentSuffix') || 'dev';

    // S3 Bucket for raw sensor data storage
    const iotDataBucket = new s3.Bucket(this, 'IotDataBucket', {
      bucketName: `iot-sensor-data-${this.region}-dev-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldData',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.STANDARD_IA,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for device state management
    const deviceStateTable = new dynamodb.Table(this, 'DeviceStateTable', {
      tableName: `iot-device-state-dev-${environmentSuffix}`,
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for sensor metrics (replacing Timestream)
    const sensorMetricsTable = new dynamodb.Table(this, 'SensorMetricsTable', {
      tableName: `iot-sensor-metrics-dev-${environmentSuffix}`,
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      globalSecondaryIndexes: [
        {
          indexName: 'TimestampIndex',
          partitionKey: { name: 'metricType', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Kinesis Data Stream for real-time data ingestion
    const sensorDataStream = new kinesis.Stream(this, 'SensorDataStream', {
      streamName: `iot-sensor-data-stream-${environmentSuffix}-${Date.now()}`,
      shardCount: 2,
      retentionPeriod: cdk.Duration.hours(24),
      encryption: kinesis.StreamEncryption.MANAGED,
    });

    // Lambda function for stream processing
    const streamProcessor = new lambda.Function(this, 'StreamProcessor', {
      functionName: `iot-stream-processor-dev-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import base64
import time
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')

# DynamoDB table references
device_table = dynamodb.Table('${deviceStateTable.tableName}')
metrics_table = dynamodb.Table('${sensorMetricsTable.tableName}')

def exponential_backoff_retry(func, max_retries=3, initial_delay=0.1):
    """Exponential backoff retry decorator"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            delay = initial_delay * (2 ** attempt)
            print(f"Retry {attempt + 1}/{max_retries} after {delay}s delay. Error: {str(e)}")
            time.sleep(delay)

def handler(event, context):
    """Process IoT sensor data from Kinesis stream"""
    
    batch_failures = []
    
    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = json.loads(
                base64.b64decode(record['kinesis']['data']).decode('utf-8')
            )
            
            device_id = payload.get('deviceId')
            timestamp = payload.get('timestamp', int(datetime.now().timestamp() * 1000))
            
            # Process and enrich data
            enriched_data = {
                'deviceId': device_id,
                'timestamp': timestamp,
                'temperature': payload.get('temperature'),
                'humidity': payload.get('humidity'),
                'status': 'active' if payload.get('temperature', 0) > -50 else 'inactive',
                'ttl': int((datetime.now() + timedelta(days=30)).timestamp()),  # TTL: 30 days
                'processedAt': int(datetime.now().timestamp() * 1000)
            }
            
            # Write to DynamoDB with retry
            def write_to_dynamodb():
                device_table.put_item(Item=enriched_data)
            
            exponential_backoff_retry(write_to_dynamodb)
            
            # Write to DynamoDB metrics table with retry
            def write_to_metrics_table():
                # Create separate records for each metric type
                metrics_data = [
                    {
                        'deviceId': device_id,
                        'timestamp': timestamp,
                        'metricType': 'temperature',
                        'value': payload.get('temperature', 0),
                        'unit': 'celsius',
                        'region': context.invoked_function_arn.split(':')[3],
                        'ttl': int((datetime.now() + timedelta(days=365)).timestamp())  # TTL: 1 year
                    },
                    {
                        'deviceId': device_id,
                        'timestamp': timestamp,
                        'metricType': 'humidity',
                        'value': payload.get('humidity', 0),
                        'unit': 'percent',
                        'region': context.invoked_function_arn.split(':')[3],
                        'ttl': int((datetime.now() + timedelta(days=365)).timestamp())  # TTL: 1 year
                    }
                ]
                
                # Write each metric as a separate item
                for metric in metrics_data:
                    metrics_table.put_item(Item=metric)
            
            exponential_backoff_retry(write_to_metrics_table)
            
            print(f"Successfully processed record for device {device_id}")
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            # Add to batch failures for DLQ processing
            batch_failures.append({
                'itemIdentifier': record['kinesis']['sequenceNumber']
            })
    
    # Return partial batch failures for retry
    return {
        'batchItemFailures': batch_failures
    }
      `),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      environment: {
        DYNAMODB_TABLE: deviceStateTable.tableName,
        METRICS_TABLE: sensorMetricsTable.tableName,
      },
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
    });

    // Grant permissions to Lambda
    deviceStateTable.grantReadWriteData(streamProcessor);
    sensorMetricsTable.grantReadWriteData(streamProcessor);

    // Kinesis event source for Lambda
    streamProcessor.addEventSource(
      new lambda.KinesisEventSource(sensorDataStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(5),
        parallelizationFactor: 2,
        retryAttempts: 3,
        onFailure: new lambda.SqsDlq(new sns.Topic(this, 'DLQTopic')),
      })
    );

    // Kinesis Data Firehose for S3 delivery
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        FirehoseKinesisAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kinesis:DescribeStream',
                'kinesis:DescribeStreamConsumer',
                'kinesis:DescribeStreamSummary',
                'kinesis:GetRecords',
                'kinesis:GetShardIterator',
                'kinesis:ListShards',
                'kinesis:ListStreams',
                'kinesis:SubscribeToShard',
              ],
              resources: [sensorDataStream.streamArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
                's3:PutObjectAcl'
              ],
              resources: [
                `${iotDataBucket.bucketArn}`,
                `${iotDataBucket.bucketArn}/*`
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'glue:GetTable',
                'glue:GetTableVersion',
                'glue:GetTableVersions',
                'glue:GetDatabase',
                'glue:GetPartitions',
              ],
              resources: [
                `arn:aws:glue:${this.region}:${this.account}:catalog`,
                `arn:aws:glue:${this.region}:${this.account}:database/iot_sensor_db_dev_${environmentSuffix}`,
                `arn:aws:glue:${this.region}:${this.account}:table/iot_sensor_db_dev_${environmentSuffix}/sensor_data`,
              ],
            }),
          ],
        }),
      },
    });

    const firehoseLogGroup = new logs.LogGroup(this, 'FirehoseLogGroup', {
      logGroupName: `/aws/kinesisfirehose/iot-sensor-data-dev-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const firehoseLogStream = new logs.LogStream(this, 'FirehoseLogStream', {
      logGroup: firehoseLogGroup,
      logStreamName: 's3-delivery',
    });

    const firehoseDeliveryStream = new kinesisfirehose.CfnDeliveryStream(this, 'FirehoseDeliveryStream', {
      deliveryStreamName: `iot-sensor-data-to-s3-dev-${environmentSuffix}-${Date.now()}`,
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: sensorDataStream.streamArn,
        roleArn: firehoseRole.roleArn,
      },
      extendedS3DestinationConfiguration: {
        bucketArn: iotDataBucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        prefix: 'raw-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
        errorOutputPrefix: 'error-data/',
        bufferingHints: {
          intervalInSeconds: 300,
          sizeInMBs: 128,
        },
        compressionFormat: 'GZIP',
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: firehoseLogGroup.logGroupName,
          logStreamName: firehoseLogStream.logStreamName,
        },
        dataFormatConversionConfiguration: {
          enabled: false,
        },
      },
    });

    // Ensure dependency order
    firehoseDeliveryStream.node.addDependency(sensorDataStream);

    // IoT Core configuration
    const iotRuleRole = new iam.Role(this, 'IoTRuleRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
    });

    iotRuleRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kinesis:PutRecord', 'kinesis:PutRecords', 'kinesis:ListShards'],
        resources: [sensorDataStream.streamArn],
      })
    );

    iotRuleRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/iot/rules/errors-dev:*`],
      })
    );

    new iot.CfnTopicRule(this, 'IoTSensorRule', {
      ruleName: `route_sensor_data_to_kinesis_dev_${environmentSuffix}`,
      topicRulePayload: {
        sql: "SELECT *, topic(2) as deviceId, timestamp() as timestamp FROM 'device/+/telemetry'",
        actions: [
          {
            kinesis: {
              streamName: sensorDataStream.streamName,
              partitionKey: '${deviceId}',
              roleArn: iotRuleRole.roleArn,
            },
          },
        ],
        errorAction: {
          cloudwatchLogs: {
            logGroupName: `/aws/iot/rules/errors-dev-${environmentSuffix}`,
            roleArn: iotRuleRole.roleArn,
          },
        },
        ruleDisabled: false,
        description: 'Route sensor telemetry data to Kinesis Data Stream',
      },
    });

    // IoT Device Policy
    new iot.CfnPolicy(this, 'IoTDevicePolicy', {
      policyName: `IoTDeviceAccessPolicy-dev-${environmentSuffix}`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['iot:Connect', 'iot:Publish', 'iot:Subscribe', 'iot:Receive'],
            Resource: [
              `arn:aws:iot:${this.region}:${this.account}:client/\${iot:Connection.Thing.ThingName}`,
              `arn:aws:iot:${this.region}:${this.account}:topic/device/\${iot:Connection.Thing.ThingName}/*`,
              `arn:aws:iot:${this.region}:${this.account}:topicfilter/device/\${iot:Connection.Thing.ThingName}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['iot:GetThingShadow', 'iot:UpdateThingShadow'],
            Resource: `arn:aws:iot:${this.region}:${this.account}:thing/\${iot:Connection.Thing.ThingName}`,
          },
        ],
      },
    });

    // Glue Database and Crawler
    const glueDatabase = new glue.CfnDatabase(this, 'GlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: `iot_sensor_db_dev_${environmentSuffix}`,
        description: 'IoT sensor data catalog',
      },
    });

    const glueRole = new iam.Role(this, 'GlueRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });

    glueRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetBucket*', 's3:GetObject*', 's3:List*'],
        resources: [iotDataBucket.bucketArn, `${iotDataBucket.bucketArn}/*`],
      })
    );

    new glue.CfnCrawler(this, 'GlueCrawler', {
      name: `iot-sensor-data-crawler-dev-${environmentSuffix}`,
      role: glueRole.roleArn,
      databaseName: glueDatabase.ref,
      targets: {
        s3Targets: [
          {
            path: `s3://${iotDataBucket.bucketName}/raw-data/`,
          },
        ],
      },
      schedule: {
        scheduleExpression: 'cron(0 */6 * * ? *)',
      },
      schemaChangePolicy: {
        updateBehavior: 'UPDATE_IN_DATABASE',
        deleteBehavior: 'LOG',
      },
      configuration: JSON.stringify({
        Version: 1,
        CrawlerOutput: {
          Partitions: {
            AddOrUpdateBehavior: 'InheritFromTable',
          },
        },
      }),
    });

    // SNS Topics for alerts
    const alertTopic = new sns.Topic(this, 'IoTAlertTopic', {
      topicName: `iot-pipeline-alerts-dev-${environmentSuffix}`,
      displayName: 'IoT Pipeline Alerts',
    });

    const dlqTopic = new sns.Topic(this, 'IoTDLQTopic', {
      topicName: `iot-pipeline-dlq-dev-${environmentSuffix}`,
      displayName: 'IoT Pipeline Dead Letter Queue',
    });

    // Add email subscriptions (replace with actual emails)
    new sns.Subscription(this, 'AlertSubscription', {
      topic: alertTopic,
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: 'iot-alerts@example.com',
    });

    new sns.Subscription(this, 'DLQSubscription', {
      topic: dlqTopic,
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: 'iot-dlq@example.com',
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'KinesisHighThroughput', {
      alarmName: `iot-kinesis-high-throughput-dev-${environmentSuffix}`,
      metric: sensorDataStream.metricIncomingRecords({
        period: cdk.Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 10000,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when Kinesis receives > 10000 records/minute',
      alarmActions: [alertTopic],
    });

    new cloudwatch.Alarm(this, 'LambdaErrorRate', {
      alarmName: `iot-lambda-high-error-rate-dev-${environmentSuffix}`,
      metric: streamProcessor.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 0.01,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when Lambda error rate > 1%',
      alarmActions: [alertTopic],
    });

    new cloudwatch.Alarm(this, 'DynamoDBThrottling', {
      alarmName: `iot-dynamodb-throttling-dev-${environmentSuffix}`,
      metric: deviceStateTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when DynamoDB experiences throttling',
      alarmActions: [alertTopic],
    });

    new cloudwatch.Alarm(this, 'FirehoseDataFreshness', {
      alarmName: `iot-firehose-data-staleness-dev-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Kinesis/Firehose',
        metricName: 'DeliveryToS3.DataFreshness',
        dimensionsMap: {
          DeliveryStreamName: firehoseDeliveryStream.ref!,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Maximum',
      }),
      threshold: 600,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when Firehose data delivery is delayed > 10 minutes',
      alarmActions: [alertTopic],
    });

    new cloudwatch.Alarm(this, 'LambdaDLQMessages', {
      alarmName: `iot-lambda-dlq-messages-dev-${environmentSuffix}`,
      metric: dlqTopic.metricNumberOfMessagesPublished({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when Lambda sends messages to DLQ',
      alarmActions: [alertTopic],
    });

    new cloudwatch.Alarm(this, 'DynamoDBMetricsThrottling', {
      alarmName: `iot-dynamodb-metrics-throttling-dev-${environmentSuffix}`,
      metric: sensorMetricsTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when DynamoDB metrics table experiences throttling',
      alarmActions: [alertTopic],
    });

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'IoTPipelineDashboard', {
      dashboardName: `iot-pipeline-monitoring-dev-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Kinesis Stream Metrics',
            left: [
              sensorDataStream.metricIncomingRecords({ statistic: 'Sum' }),
              sensorDataStream.metricIncomingBytes({ statistic: 'Sum', yAxis: 'right' }),
            ],
            width: 6,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Processing',
            left: [
              streamProcessor.metricInvocations({ statistic: 'Sum' }),
              streamProcessor.metricErrors({ statistic: 'Sum', yAxis: 'right' }),
            ],
            width: 6,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Device State Performance',
            left: [
              deviceStateTable.metricConsumedReadCapacityUnits({ statistic: 'Sum' }),
              deviceStateTable.metricConsumedWriteCapacityUnits({ statistic: 'Sum', yAxis: 'right' }),
            ],
            width: 6,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Metrics Performance',
            left: [
              sensorMetricsTable.metricConsumedReadCapacityUnits({ statistic: 'Sum' }),
              sensorMetricsTable.metricConsumedWriteCapacityUnits({ statistic: 'Sum', yAxis: 'right' }),
            ],
            width: 6,
            height: 6,
          }),
        ],
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'IoTEndpoint', {
      value: `${this.account}.iot.${this.region}.amazonaws.com`,
      description: 'AWS IoT Core Endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: iotDataBucket.bucketName,
      description: 'S3 Bucket for sensor data',
    });

    new cdk.CfnOutput(this, 'KinesisStreamName', {
      value: sensorDataStream.streamName,
      description: 'Kinesis Data Stream name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: deviceStateTable.tableName,
      description: 'DynamoDB table for device state',
    });

    new cdk.CfnOutput(this, 'SensorMetricsTableName', {
      value: sensorMetricsTable.tableName,
      description: 'DynamoDB table for sensor metrics',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic for alerts',
    });

    new cdk.CfnOutput(this, 'AthenaQueryExample', {
      value: `SELECT * FROM ${glueDatabase.ref}.sensor_data WHERE year='2024' LIMIT 10`,
      description: 'Example Athena query',
    });

    new cdk.CfnOutput(this, 'DLQTopicArn', {
      value: dlqTopic.topicArn,
      description: 'SNS Topic for Lambda DLQ',
    });

    new cdk.CfnOutput(this, 'GlueDatabaseName', {
      value: glueDatabase.ref,
      description: 'Glue Database for data catalog',
    });
  }
}
```

### App Entry Point (`bin/tap.ts`)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 
                         process.env.ENVIRONMENT_SUFFIX || 
                         'dev';

// Create stack name without hyphen to avoid conflicts
const stackName = `TapStack${environmentSuffix}`;

new TapStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // Deploy to us-east-1 as specified
  },
  terminationProtection: false, // Disable termination protection for clean teardown
  tags: {
    Environment: environmentSuffix,
    Project: 'IoT-Sensor-Pipeline',
    ManagedBy: 'CDK',
    DataClassification: 'Sensitive',
    Compliance: 'GDPR',
  },
});
```

## Architecture Explanation

### Data Flow

1. **Device Connection**: IoT devices connect to AWS IoT Core using device certificates for secure authentication
2. **Message Routing**: IoT Rules automatically route sensor telemetry messages to Kinesis Data Streams
3. **Stream Processing**: Lambda function processes the stream data with exponential backoff retry logic
4. **Data Storage**: 
   - Device state goes to DynamoDB with TTL for automatic cleanup
   - Sensor metrics go to a separate DynamoDB table for time-series analysis
   - Raw data gets batched and delivered to S3 via Kinesis Data Firehose
5. **Schema Discovery**: Glue Crawler automatically discovers data schemas and updates the data catalog
6. **Analytics**: Athena can be used for ad-hoc queries on the data in S3

### Key Design Decisions

- **DynamoDB over Timestream**: Used DynamoDB for time-series data to avoid AWS service access restrictions
- **Kinesis with 2 shards**: Configured for 500k daily messages (6 msg/sec average) with room for spikes
- **Lambda with reserved concurrency**: Prevents overwhelming downstream services
- **S3 with lifecycle policies**: Automatically moves old data to cheaper storage classes
- **Comprehensive monitoring**: 6 CloudWatch alarms cover all critical failure points
- **Security**: Least-privilege IAM roles and secure device authentication

### Cost Optimization

- DynamoDB on-demand billing scales with usage
- S3 lifecycle policies reduce storage costs over time
- Kinesis Data Firehose batching reduces API calls
- CloudWatch log retention policies prevent log storage bloat

This implementation provides a production-ready, scalable IoT data pipeline that can handle 500,000 daily sensor readings while maintaining cost efficiency and operational excellence.