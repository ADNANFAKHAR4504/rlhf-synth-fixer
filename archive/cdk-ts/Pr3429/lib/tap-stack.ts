import * as cdk from 'aws-cdk-lib';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// Removed timestream import - using DynamoDB for time-series data instead
import * as glue from 'aws-cdk-lib/aws-glue';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // Convert to lowercase for S3 bucket naming requirements
    const environmentSuffix = (
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev'
    ).toLowerCase();

    // Common tags for all resources
    cdk.Tags.of(this).add('Project', 'IoT-Sensor-Pipeline');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Compliance', 'GDPR');
    cdk.Tags.of(this).add('DataClassification', 'Sensitive');

    // ==================== STORAGE LAYER ====================

    // S3 bucket for long-term storage with lifecycle policies
    const iotDataBucket = new s3.Bucket(this, 'IotDataBucket', {
      bucketName: `iot-sensor-data-${this.account}-${this.region}-dev-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for device state with TTL enabled
    const deviceStateTable = new dynamodb.Table(this, 'DeviceStateTable', {
      tableName: `iot-device-state-dev-${environmentSuffix}`,
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl', // Enable TTL for auto-expiration
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by device status
    deviceStateTable.addGlobalSecondaryIndex({
      indexName: 'status-timestamp-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // DynamoDB table for time-series sensor data (replacing Timestream)
    const sensorMetricsTable = new dynamodb.Table(this, 'SensorMetricsTable', {
      tableName: `iot-sensor-metrics-dev-${environmentSuffix}`,
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl', // Enable TTL for auto-expiration (365 days)
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by timestamp range
    sensorMetricsTable.addGlobalSecondaryIndex({
      indexName: 'timestamp-index',
      partitionKey: { name: 'metricType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ==================== STREAMING LAYER ====================

    // Kinesis Data Stream with auto-scaling and encryption
    const sensorDataStream = new kinesis.Stream(this, 'SensorDataStream', {
      streamName: `iot-sensor-data-stream-${environmentSuffix}-${Date.now()}`,
      shardCount: 2, // Start with 2 shards for 500k daily messages
      retentionPeriod: cdk.Duration.hours(24),
      streamMode: kinesis.StreamMode.PROVISIONED,
      encryption: kinesis.StreamEncryption.MANAGED, // Server-side encryption with AWS managed KMS key
    });

    // ==================== PROCESSING LAYER ====================

    // Lambda function for stream processing with retry logic
    const streamProcessor = new lambda.Function(this, 'StreamProcessor', {
      functionName: `iot-stream-processor-dev-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
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
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        DYNAMODB_TABLE: deviceStateTable.tableName,
        METRICS_TABLE: sensorMetricsTable.tableName,
      },
      reservedConcurrentExecutions: 10, // Limit concurrency for controlled processing
      retryAttempts: 2, // Lambda service retry attempts
    });

    // Grant permissions to Lambda
    deviceStateTable.grantReadWriteData(streamProcessor);
    sensorMetricsTable.grantReadWriteData(streamProcessor);

    // Add Kinesis event source to Lambda with parallel processing
    streamProcessor.addEventSource(
      new lambdaEventSources.KinesisEventSource(sensorDataStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(5),
        parallelizationFactor: 2, // Process 2 batches in parallel per shard
        retryAttempts: 3,
        reportBatchItemFailures: true, // Enable partial batch response
      })
    );

    // ==================== DATA DELIVERY LAYER ====================

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
                'kinesis:DescribeStreamSummary',
                'kinesis:DescribeStreamConsumer',
                'kinesis:GetShardIterator',
                'kinesis:ListShards',
                'kinesis:GetRecords',
                'kinesis:SubscribeToShard',
                'kinesis:ListStreams',
              ],
              resources: [sensorDataStream.streamArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
                's3:PutObjectAcl',
              ],
              resources: [
                `${iotDataBucket.bucketArn}`,
                `${iotDataBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
            // Glue schema read permissions for data format conversion
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
                `arn:aws:glue:${this.region}:${this.account}:database/iot_sensor_db_${environmentSuffix}`,
                `arn:aws:glue:${this.region}:${this.account}:table/iot_sensor_db_${environmentSuffix}/sensor_data`,
              ],
            }),
          ],
        }),
      },
    });

    // CloudWatch log group for Firehose errors
    const firehoseLogGroup = new logs.LogGroup(this, 'FirehoseLogGroup', {
      logGroupName: `/aws/kinesisfirehose/iot-sensor-data-dev-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const firehoseLogStream = new logs.LogStream(this, 'FirehoseLogStream', {
      logGroup: firehoseLogGroup,
      logStreamName: 's3-delivery',
    });

    const firehoseDeliveryStream = new kinesisfirehose.CfnDeliveryStream(
      this,
      'FirehoseDeliveryStream',
      {
        deliveryStreamName: `iot-sensor-data-to-s3-dev-${environmentSuffix}-${Date.now()}`,
        deliveryStreamType: 'KinesisStreamAsSource',
        kinesisStreamSourceConfiguration: {
          kinesisStreamArn: sensorDataStream.streamArn,
          roleArn: firehoseRole.roleArn,
        },
        extendedS3DestinationConfiguration: {
          bucketArn: iotDataBucket.bucketArn,
          roleArn: firehoseRole.roleArn,
          prefix:
            'raw-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
          errorOutputPrefix: 'error-data/',
          bufferingHints: {
            intervalInSeconds: 300, // Batch for 5 minutes
            sizeInMBs: 128, // Or 128MB, whichever comes first
          },
          compressionFormat: 'UNCOMPRESSED', // Must be UNCOMPRESSED when data format conversion is enabled
          cloudWatchLoggingOptions: {
            enabled: true,
            logGroupName: firehoseLogGroup.logGroupName,
            logStreamName: firehoseLogStream.logStreamName,
          },
          // Temporarily disable schema conversion until Glue table exists
          dataFormatConversionConfiguration: {
            enabled: false,
          },
        },
      }
    );

    // Ensure dependency order - Firehose must be created after Kinesis stream
    firehoseDeliveryStream.node.addDependency(sensorDataStream);

    // ==================== IOT CORE LAYER ====================

    // IAM Role for IoT Core Rules
    const iotRuleRole = new iam.Role(this, 'IoTRuleRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
    });

    sensorDataStream.grantWrite(iotRuleRole);

    // IoT Rule to route messages to Kinesis
    new iot.CfnTopicRule(this, 'IoTSensorRule', {
      ruleName: `route_sensor_data_to_kinesis_dev_${environmentSuffix}`,
      topicRulePayload: {
        sql: "SELECT *, topic(2) as deviceId, timestamp() as timestamp FROM 'device/+/telemetry'",
        description: 'Route sensor telemetry data to Kinesis Data Stream',
        actions: [
          {
            kinesis: {
              streamName: sensorDataStream.streamName,
              roleArn: iotRuleRole.roleArn,
              partitionKey: '${deviceId}', // Partition by device ID for ordering
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
      },
    });

    // Grant CloudWatch Logs permissions to IoT Rule Role
    iotRuleRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/iot/rules/errors-${environmentSuffix}:*`,
        ],
      })
    );

    // IoT Policy for device authentication
    new iot.CfnPolicy(this, 'IoTDevicePolicy', {
      policyName: `IoTDeviceAccessPolicy-dev-${environmentSuffix}`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iot:Connect',
              'iot:Publish',
              'iot:Subscribe',
              'iot:Receive',
            ],
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

    // ==================== ANALYTICS LAYER ====================

    // Glue Database
    const glueDatabase = new glue.CfnDatabase(this, 'GlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: `iot_sensor_db_dev_${environmentSuffix}`,
        description: 'IoT sensor data catalog',
      },
    });

    // IAM Role for Glue Crawler
    const glueRole = new iam.Role(this, 'GlueRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSGlueServiceRole'
        ),
      ],
    });

    iotDataBucket.grantRead(glueRole);

    // Glue Crawler for schema discovery
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
        scheduleExpression: 'cron(0 */6 * * ? *)', // Run every 6 hours for schema updates
      },
      schemaChangePolicy: {
        updateBehavior: 'UPDATE_IN_DATABASE',
        deleteBehavior: 'LOG',
      },
      configuration: JSON.stringify({
        Version: 1.0,
        CrawlerOutput: {
          Partitions: { AddOrUpdateBehavior: 'InheritFromTable' },
        },
      }),
    });

    // ==================== MONITORING LAYER ====================

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'IoTAlertTopic', {
      topicName: `iot-pipeline-alerts-dev-${environmentSuffix}`,
      displayName: 'IoT Pipeline Alerts',
    });

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('iot-alerts@example.com')
    );

    // Dead Letter Queue for failed Lambda invocations
    const dlqTopic = new sns.Topic(this, 'IoTDLQTopic', {
      topicName: `iot-pipeline-dlq-dev-${environmentSuffix}`,
      displayName: 'IoT Pipeline Dead Letter Queue',
    });

    dlqTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('iot-dlq@example.com')
    );

    // Configure Lambda event invoke config for DLQ
    // Temporarily disabled due to naming conflict with existing resources
    // new lambda.CfnEventInvokeConfig(this, 'StreamProcessorDLQConfig', {
    //   functionName: streamProcessor.functionName,
    //   qualifier: '$LATEST',
    //   destinationConfig: {
    //     onFailure: {
    //       destination: dlqTopic.topicArn,
    //     },
    //   },
    //   maximumEventAgeInSeconds: 21600, // 6 hours
    //   maximumRetryAttempts: 2,
    // });

    // Grant SNS publish permission to Lambda
    dlqTopic.grantPublish(streamProcessor);

    // CloudWatch Alarms

    // 1. Kinesis Stream - High incoming records
    new cloudwatch.Alarm(this, 'KinesisHighThroughput', {
      alarmName: `iot-kinesis-high-throughput-dev-${environmentSuffix}`,
      alarmDescription: 'Alert when Kinesis receives > 10000 records/minute',
      metric: sensorDataStream.metricIncomingRecords({
        period: cdk.Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 10000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 2. Lambda - High error rate
    new cloudwatch.Alarm(this, 'LambdaErrorRate', {
      alarmName: `iot-lambda-high-error-rate-dev-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda error rate > 1%',
      metric: streamProcessor.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 0.01,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 3. DynamoDB - Throttling
    new cloudwatch.Alarm(this, 'DynamoDBThrottling', {
      alarmName: `iot-dynamodb-throttling-dev-${environmentSuffix}`,
      alarmDescription: 'Alert when DynamoDB experiences throttling',
      metric: deviceStateTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 4. Firehose - Data delivery failures
    const firehoseMetric = new cloudwatch.Metric({
      namespace: 'AWS/Kinesis/Firehose',
      metricName: 'DeliveryToS3.DataFreshness',
      dimensionsMap: {
        DeliveryStreamName: firehoseDeliveryStream.ref!,
      },
      period: cdk.Duration.minutes(5),
      statistic: 'Maximum',
    });

    new cloudwatch.Alarm(this, 'FirehoseDataFreshness', {
      alarmName: `iot-firehose-data-staleness-dev-${environmentSuffix}`,
      alarmDescription:
        'Alert when Firehose data delivery is delayed > 10 minutes',
      metric: firehoseMetric,
      threshold: 600, // 10 minutes in seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 5. Lambda - DLQ messages
    new cloudwatch.Alarm(this, 'LambdaDLQMessages', {
      alarmName: `iot-lambda-dlq-messages-dev-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda sends messages to DLQ',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SNS',
        metricName: 'NumberOfMessagesPublished',
        dimensionsMap: {
          TopicName: dlqTopic.topicName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // 6. DynamoDB Metrics Table - Write throttling
    new cloudwatch.Alarm(this, 'DynamoDBMetricsThrottling', {
      alarmName: `iot-dynamodb-metrics-throttling-dev-${environmentSuffix}`,
      alarmDescription:
        'Alert when DynamoDB metrics table experiences throttling',
      metric: sensorMetricsTable.metricUserErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'IoTPipelineDashboard', {
      dashboardName: `iot-pipeline-monitoring-dev-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Kinesis Stream Metrics',
        left: [sensorDataStream.metricIncomingRecords()],
        right: [sensorDataStream.metricIncomingBytes()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Processing',
        left: [streamProcessor.metricInvocations()],
        right: [streamProcessor.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Device State Performance',
        left: [deviceStateTable.metricConsumedReadCapacityUnits()],
        right: [deviceStateTable.metricConsumedWriteCapacityUnits()],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Metrics Performance',
        left: [sensorMetricsTable.metricConsumedReadCapacityUnits()],
        right: [sensorMetricsTable.metricConsumedWriteCapacityUnits()],
      })
    );

    // ==================== OUTPUTS ====================

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

    // Stack description
    this.templateOptions.description = `Production IoT data pipeline for processing 500k daily sensor readings - ${environmentSuffix}`;
  }
}
