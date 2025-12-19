import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kinesisEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // S3 Bucket for GPS data archival
    const archiveBucket = new s3.Bucket(this, 'GpsDataArchiveBucket', {
      bucketName: `gps-archive-${this.account}-${this.region}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-old-data',
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
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // DynamoDB Table for vehicle tracking
    const vehicleTable = new dynamodb.Table(this, 'VehicleTrackingTable', {
      tableName: `vehicle-tracking-${environmentSuffix}`,
      partitionKey: {
        name: 'vehicleId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for delivery status queries
    vehicleTable.addGlobalSecondaryIndex({
      indexName: 'delivery-status-index',
      partitionKey: {
        name: 'deliveryStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'expectedDeliveryTime',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Kinesis Stream for GPS data
    const gpsDataStream = new kinesis.Stream(this, 'GpsDataStream', {
      streamName: `vehicle-gps-stream-${environmentSuffix}`,
      shardCount: 2,
      retentionPeriod: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Kinesis Firehose
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        KinesisReadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kinesis:DescribeStream',
                'kinesis:GetShardIterator',
                'kinesis:GetRecords',
                'kinesis:ListShards',
              ],
              resources: [gpsDataStream.streamArn],
            }),
          ],
        }),
      },
    });

    archiveBucket.grantWrite(firehoseRole);

    // Kinesis Firehose for archiving to S3 (automatically configured)
    new kinesisfirehose.CfnDeliveryStream(this, 'GpsArchiveDeliveryStream', {
      deliveryStreamName: `gps-archive-stream-${environmentSuffix}`,
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: gpsDataStream.streamArn,
        roleArn: firehoseRole.roleArn,
      },
      s3DestinationConfiguration: {
        bucketArn: archiveBucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        prefix:
          'raw-gps-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
        errorOutputPrefix: 'error/',
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 128,
        },
        compressionFormat: 'GZIP',
      },
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'DelayAlertTopic', {
      topicName: `delivery-delay-alerts-${environmentSuffix}`,
      displayName: 'Delivery Delay Notifications',
    });

    // IAM Role for GPS Processing Lambda
    const processingLambdaRole = new iam.Role(this, 'ProcessingLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    vehicleTable.grantReadWriteData(processingLambdaRole);
    gpsDataStream.grantRead(processingLambdaRole);

    // Add EventBridge permissions
    processingLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [
          `arn:aws:events:${this.region}:${this.account}:event-bus/default`,
        ],
      })
    );

    // GPS Processing Lambda Function
    const gpsProcessorLambda = new lambda.Function(
      this,
      'GpsProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const eventbridge = new AWS.EventBridge();

exports.handler = async (event) => {
  const records = event.Records.map(record => {
    const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
    return JSON.parse(payload);
  });
  
  for (const record of records) {
    const item = {
      vehicleId: record.vehicleId,
      timestamp: record.timestamp,
      latitude: record.latitude,
      longitude: record.longitude,
      speed: record.speed,
      heading: record.heading,
      deliveryId: record.deliveryId,
      expectedDeliveryTime: record.expectedDeliveryTime,
      deliveryStatus: record.deliveryStatus,
      ttl: Math.floor(Date.now() / 1000) + 2592000
    };
    
    await dynamodb.put({
      TableName: process.env.TABLE_NAME,
      Item: item
    }).promise();
    
    if (record.expectedDeliveryTime && record.timestamp > record.expectedDeliveryTime) {
      await eventbridge.putEvents({
        Entries: [{
          Source: 'logistics.gps.tracking',
          DetailType: 'DeliveryDelayDetected',
          Detail: JSON.stringify({
            vehicleId: record.vehicleId,
            deliveryId: record.deliveryId,
            expectedTime: record.expectedDeliveryTime,
            currentTime: record.timestamp,
            delay: record.timestamp - record.expectedDeliveryTime
          })
        }]
      }).promise();
    }
  }
  
  return { statusCode: 200 };
};
      `),
        environment: {
          TABLE_NAME: vehicleTable.tableName,
        },
        role: processingLambdaRole,
        timeout: cdk.Duration.seconds(60),
        memorySize: 1024,
        reservedConcurrentExecutions: 100,
      }
    );

    // Add Kinesis event source to Lambda
    gpsProcessorLambda.addEventSource(
      new kinesisEventSources.KinesisEventSource(gpsDataStream, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 100,
        maxBatchingWindow: cdk.Duration.seconds(5),
        parallelizationFactor: 10,
      })
    );

    // IAM Role for Alert Handler Lambda
    const alertLambdaRole = new iam.Role(this, 'AlertLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    alertTopic.grantPublish(alertLambdaRole);

    // Alert Handler Lambda Function
    const alertHandlerLambda = new lambda.Function(
      this,
      'AlertHandlerFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
  const detail = event.detail;
  const message = {
    Message: JSON.stringify({
      alert: 'DELIVERY DELAY',
      vehicleId: detail.vehicleId,
      deliveryId: detail.deliveryId,
      delayMinutes: Math.floor(detail.delay / 60),
      timestamp: new Date().toISOString()
    }),
    TopicArn: process.env.TOPIC_ARN
  };
  
  await sns.publish(message).promise();
  return { statusCode: 200 };
};
      `),
        environment: {
          TOPIC_ARN: alertTopic.topicArn,
        },
        role: alertLambdaRole,
        timeout: cdk.Duration.seconds(30),
      }
    );

    // EventBridge Rule for delivery delays
    const delayEventRule = new events.Rule(this, 'DelayEventRule', {
      ruleName: `delivery-delay-rule-${environmentSuffix}`,
      eventPattern: {
        source: ['logistics.gps.tracking'],
        detailType: ['DeliveryDelayDetected'],
      },
    });

    delayEventRule.addTarget(new targets.LambdaFunction(alertHandlerLambda));

    // IAM Role for Analytics Lambda
    const analyticsLambdaRole = new iam.Role(this, 'AnalyticsLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    vehicleTable.grantReadData(analyticsLambdaRole);
    archiveBucket.grantWrite(analyticsLambdaRole);

    // Analytics Processor Lambda Function
    const analyticsProcessorLambda = new lambda.Function(
      this,
      'AnalyticsProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const endTime = Date.now();
  const startTime = endTime - (3600 * 1000);
  
  const params = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'delivery-status-index',
    KeyConditionExpression: 'deliveryStatus = :status AND expectedDeliveryTime BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':status': 'IN_TRANSIT',
      ':start': startTime,
      ':end': endTime
    }
  };
  
  const data = await dynamodb.query(params).promise();
  
  const analytics = {
    timestamp: new Date().toISOString(),
    activeVehicles: data.Count,
    avgSpeed: data.Items.reduce((acc, item) => acc + item.speed, 0) / data.Count,
    delayedDeliveries: data.Items.filter(item => item.timestamp > item.expectedDeliveryTime).length
  };
  
  await s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: 'analytics/' + new Date().toISOString() + '.json',
    Body: JSON.stringify(analytics),
    ContentType: 'application/json'
  }).promise();
  
  return { statusCode: 200 };
};
      `),
        environment: {
          TABLE_NAME: vehicleTable.tableName,
          BUCKET_NAME: archiveBucket.bucketName,
        },
        role: analyticsLambdaRole,
        timeout: cdk.Duration.seconds(120),
        memorySize: 2048,
      }
    );

    // Schedule for analytics processing
    const analyticsScheduleRule = new events.Rule(
      this,
      'AnalyticsScheduleRule',
      {
        schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      }
    );

    analyticsScheduleRule.addTarget(
      new targets.LambdaFunction(analyticsProcessorLambda)
    );

    // QuickSight Data Source Role (for manual QuickSight setup)
    const quicksightDataSourceRole = new iam.Role(
      this,
      'QuicksightDataSourceRole',
      {
        assumedBy: new iam.ServicePrincipal('quicksight.amazonaws.com'),
      }
    );

    archiveBucket.grantRead(quicksightDataSourceRole);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'GpsTrackingDashboard', {
      dashboardName: `logistics-gps-tracking-${environmentSuffix}`,
    });

    // CloudWatch Metrics
    const streamMetric = new cloudwatch.Metric({
      namespace: 'AWS/Kinesis',
      metricName: 'IncomingRecords',
      dimensionsMap: {
        StreamName: gpsDataStream.streamName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const lambdaErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: gpsProcessorLambda.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const lambdaDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensionsMap: {
        FunctionName: gpsProcessorLambda.functionName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const dynamodbThrottleMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'SystemErrors',
      dimensionsMap: {
        TableName: vehicleTable.tableName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Kinesis Stream Incoming Records',
        left: [streamMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Processing Errors',
        left: [lambdaErrorMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Processing Duration',
        left: [lambdaDurationMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Throttles',
        left: [dynamodbThrottleMetric],
        width: 12,
      })
    );

    // CloudWatch Alarms
    const streamAlarm = new cloudwatch.Alarm(this, 'StreamThrottleAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Kinesis',
        metricName: 'WriteProvisionedThroughputExceeded',
        dimensionsMap: {
          StreamName: gpsDataStream.streamName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaErrorMetric,
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm actions
    streamAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // CloudWatch Log Group (automatically used by Lambda)
    new logs.LogGroup(this, 'GpsProcessingLogs', {
      logGroupName: `/aws/lambda/gps-processing-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'StreamName', {
      value: gpsDataStream.streamName,
      description: 'Kinesis Stream Name for GPS Data',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: vehicleTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ArchiveBucketName', {
      value: archiveBucket.bucketName,
      description: 'S3 Bucket for Archive',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for Alerts',
    });

    new cdk.CfnOutput(this, 'AnalyticsDataPath', {
      value: `s3://${archiveBucket.bucketName}/analytics/`,
      description: 'S3 path for analytics data (for QuickSight setup)',
    });

    new cdk.CfnOutput(this, 'QuickSightRoleArn', {
      value: quicksightDataSourceRole.roleArn,
      description: 'IAM Role for QuickSight (use for manual QuickSight setup)',
    });
  }
}
