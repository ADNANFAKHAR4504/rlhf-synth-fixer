

### Main Stack (tap-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as timestream from 'aws-cdk-lib/aws-timestream';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for archived IoT data
    const archiveBucket = new s3.Bucket(this, 'IoTArchiveBucket', {
      bucketName: `iot-archive-${this.account}-${this.region}`,
      versioned: true,
      lifecycleRules: [{
        id: 'archive-old-data',
        transitions: [{
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(30)
        }]
      }]
    });

    // DynamoDB table for device metadata and recovery state
    const deviceTable = new dynamodb.Table(this, 'DeviceRecoveryTable', {
      tableName: 'iot-device-recovery',
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Global Secondary Index for device type queries
    deviceTable.addGlobalSecondaryIndex({
      indexName: 'deviceType-index',
      partitionKey: { name: 'deviceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    // Kinesis streams for message replay (partitioned for scale)
    const kinesisStreams: kinesis.Stream[] = [];
    for (let i = 0; i < 10; i++) {
      kinesisStreams.push(new kinesis.Stream(this, `IoTReplayStream${i}`, {
        streamName: `iot-replay-stream-${i}`,
        shardCount: 100, // 1000 shards total for 45M messages
        retentionPeriod: cdk.Duration.hours(24)
      }));
    }

    // SQS Dead Letter Queues by device type
    const deviceTypes = ['sensor', 'actuator', 'gateway', 'edge'];
    const dlQueues: { [key: string]: sqs.Queue } = {};
    
    deviceTypes.forEach(type => {
      dlQueues[type] = new sqs.Queue(this, `${type}DLQ`, {
        queueName: `iot-recovery-dlq-${type}`,
        visibilityTimeout: cdk.Duration.minutes(15),
        retentionPeriod: cdk.Duration.days(14),
        deadLetterQueue: {
          maxReceiveCount: 3,
          queue: new sqs.Queue(this, `${type}DLQ-Secondary`, {
            queueName: `iot-recovery-dlq-${type}-secondary`
          })
        }
      });
    });

    // Timestream database and table for validation
    const timestreamDatabase = new timestream.CfnDatabase(this, 'IoTMetricsDB', {
      databaseName: 'iot-recovery-metrics'
    });

    const timestreamTable = new timestream.CfnTable(this, 'IoTMetricsTable', {
      databaseName: timestreamDatabase.databaseName!,
      tableName: 'recovery-validation',
      retentionProperties: {
        memoryStoreRetentionPeriodInHours: 24,
        magneticStoreRetentionPeriodInDays: 7
      }
    });
    timestreamTable.addDependency(timestreamDatabase);

    // Lambda function for shadow state analysis
    const shadowAnalysisLambda = new NodejsFunction(this, 'ShadowAnalysisLambda', {
      functionName: 'iot-shadow-analysis',
      entry: path.join(__dirname, '../lambda/shadow-analysis.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 3008, // Max memory for handling 2.3M devices
      timeout: cdk.Duration.minutes(15),
      environment: {
        DEVICE_TABLE_NAME: deviceTable.tableName,
        BUCKET_NAME: archiveBucket.bucketName
      },
      reservedConcurrentExecutions: 1000
    });

    // Lambda function for Kinesis republishing
    const kinesisRepublishLambda = new NodejsFunction(this, 'KinesisRepublishLambda', {
      functionName: 'iot-kinesis-republish',
      entry: path.join(__dirname, '../lambda/kinesis-republish.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(15),
      environment: {
        KINESIS_STREAMS: JSON.stringify(kinesisStreams.map(s => s.streamName))
      },
      reservedConcurrentExecutions: 1000
    });

    // Lambda function for Timestream validation
    const timestreamValidationLambda = new NodejsFunction(this, 'TimestreamValidationLambda', {
      functionName: 'iot-timestream-validation',
      entry: path.join(__dirname, '../lambda/timestream-validation.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(5),
      environment: {
        DATABASE_NAME: timestreamDatabase.databaseName!,
        TABLE_NAME: timestreamTable.tableName!
      }
    });

    // Grant permissions
    deviceTable.grantReadWriteData(shadowAnalysisLambda);
    archiveBucket.grantRead(shadowAnalysisLambda);
    archiveBucket.grantRead(kinesisRepublishLambda);
    kinesisStreams.forEach(stream => stream.grantWrite(kinesisRepublishLambda));

    // IAM role for IoT shadow access
    shadowAnalysisLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iot:GetThingShadow', 'iot:ListThings'],
      resources: ['*']
    }));

    // IAM role for Timestream access
    timestreamValidationLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'timestream:DescribeEndpoints',
        'timestream:SelectValues',
        'timestream:DescribeTable',
        'timestream:WriteRecords'
      ],
      resources: ['*']
    }));

    // Step Functions for orchestration
    const backfillTask = new sfnTasks.LambdaInvoke(this, 'BackfillTask', {
      lambdaFunction: shadowAnalysisLambda,
      outputPath: '$.Payload'
    });

    const republishTask = new sfnTasks.LambdaInvoke(this, 'RepublishTask', {
      lambdaFunction: kinesisRepublishLambda,
      outputPath: '$.Payload'
    });

    const validationTask = new sfnTasks.LambdaInvoke(this, 'ValidationTask', {
      lambdaFunction: timestreamValidationLambda,
      outputPath: '$.Payload'
    });

    // Parallel execution for faster recovery
    const parallelBackfill = new stepfunctions.Parallel(this, 'ParallelBackfill', {
      comment: 'Parallel backfill and republish'
    });

    parallelBackfill
      .branch(backfillTask)
      .branch(republishTask);

    const definition = parallelBackfill
      .next(validationTask)
      .next(new stepfunctions.Succeed(this, 'RecoveryComplete'));

    const stateMachine = new stepfunctions.StateMachine(this, 'RecoveryStateMachine', {
      stateMachineName: 'iot-recovery-orchestration',
      definition,
      timeout: cdk.Duration.hours(2)
    });

    // EventBridge rules for routing recovery events
    const eventBus = new events.EventBus(this, 'RecoveryEventBus', {
      eventBusName: 'iot-recovery-events'
    });

    deviceTypes.forEach(type => {
      new events.Rule(this, `${type}RecoveryRule`, {
        ruleName: `iot-recovery-${type}`,
        eventBus,
        eventPattern: {
          source: ['iot.recovery'],
          detailType: ['Device Recovery Event'],
          detail: {
            deviceType: [type]
          }
        },
        targets: [new eventsTargets.SqsQueue(dlQueues[type])]
      });
    });

    // CloudWatch Alarms for IoT Rule failures
    const ruleFailureAlarm = new cloudwatch.Alarm(this, 'IoTRuleFailureAlarm', {
      alarmName: 'iot-rule-failures',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/IoT',
        metricName: 'RuleMessageThrottled',
        dimensionsMap: {
          RuleName: '*'
        },
        statistic: 'Sum',
        period: cdk.Duration.seconds(15) // 15-second detection window
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    // Trigger Step Functions on alarm
    ruleFailureAlarm.addAlarmAction(
      new cloudwatchActions.LambdaAction(shadowAnalysisLambda)
    );

    // Lambda to trigger Step Functions
    const triggerStateMachineLambda = new NodejsFunction(this, 'TriggerStateMachineLambda', {
      functionName: 'iot-trigger-recovery',
      entry: path.join(__dirname, '../lambda/trigger-recovery.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn
      }
    });

    stateMachine.grantStartExecution(triggerStateMachineLambda);

    // CloudWatch Dashboard for monitoring
    new cloudwatch.Dashboard(this, 'RecoveryDashboard', {
      dashboardName: 'iot-recovery-monitoring',
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Rule Failures',
            left: [ruleFailureAlarm.metric]
          }),
          new cloudwatch.GraphWidget({
            title: 'Recovery Progress',
            left: [new cloudwatch.Metric({
              namespace: 'IoTRecovery',
              metricName: 'DevicesRecovered',
              statistic: 'Sum'
            })]
          })
        ]
      ]
    });
  }
}
```

### Lambda Functions

#### shadow-analysis.ts
```typescript
import { IoTClient, GetThingShadowCommand, ListThingsCommand } from '@aws-sdk/client-iot';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const iot = new IoTClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});

interface DeviceState {
  deviceId: string;
  deviceType: string;
  lastSeen: number;
  needsRecovery: boolean;
}

export const handler = async (event: any) => {
  const tableName = process.env.DEVICE_TABLE_NAME!;
  const bucketName = process.env.BUCKET_NAME!;
  
  // Batch process devices
  const batchSize = 1000;
  let nextToken: string | undefined;
  let processedDevices = 0;
  const failedDevices: DeviceState[] = [];

  do {
    // List devices
    const listCommand = new ListThingsCommand({
      maxResults: batchSize,
      nextToken
    });
    
    const response = await iot.send(listCommand);
    const things = response.things || [];
    
    // Process shadows in parallel
    const shadowPromises = things.map(async (thing) => {
      try {
        const shadowCommand = new GetThingShadowCommand({
          thingName: thing.thingName!
        });
        
        const shadowResponse = await iot.send(shadowCommand);
        const shadow = JSON.parse(new TextDecoder().decode(shadowResponse.payload));
        
        // Analyze shadow state
        const reported = shadow.state?.reported || {};
        const lastActivity = reported.timestamp || 0;
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - lastActivity;
        
        // If device hasn't reported in 1 hour, mark for recovery
        if (timeSinceLastActivity > 3600000) {
          failedDevices.push({
            deviceId: thing.thingName!,
            deviceType: thing.thingTypeName || 'unknown',
            lastSeen: lastActivity,
            needsRecovery: true
          });
        }
      } catch (error) {
        console.error(`Error processing device ${thing.thingName}:`, error);
      }
    });
    
    await Promise.all(shadowPromises);
    processedDevices += things.length;
    nextToken = response.nextToken;
    
  } while (nextToken && processedDevices < 2300000); // Process up to 2.3M devices

  // Store failed devices in DynamoDB
  if (failedDevices.length > 0) {
    const chunks = [];
    for (let i = 0; i < failedDevices.length; i += 25) {
      chunks.push(failedDevices.slice(i, i + 25));
    }
    
    for (const chunk of chunks) {
      const putRequests = chunk.map(device => ({
        PutRequest: {
          Item: {
            ...device,
            timestamp: Date.now(),
            recoveryStatus: 'pending'
          }
        }
      }));
      
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests
        }
      }));
    }
  }

  // Identify S3 archives for backfill (last 12 hours)
  const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
  const archives: string[] = [];
  
  const listObjectsCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'iot-data/'
  });
  
  const s3Response = await s3.send(listObjectsCommand);
  const objects = s3Response.Contents || [];
  
  objects.forEach(obj => {
    if (obj.LastModified && obj.LastModified.getTime() >= twelveHoursAgo) {
      archives.push(obj.Key!);
    }
  });

  return {
    processedDevices,
    failedDevices: failedDevices.length,
    archivesToProcess: archives
  };
};
```

#### kinesis-republish.ts
```typescript
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const kinesis = new KinesisClient({});
const s3 = new S3Client({});
const eventbridge = new EventBridgeClient({});

interface IoTMessage {
  deviceId: string;
  deviceType: string;
  timestamp: number;
  data: any;
}

export const handler = async (event: any) => {
  const kinesisStreams = JSON.parse(process.env.KINESIS_STREAMS!);
  const archives = event.archivesToProcess || [];
  
  let totalMessagesReplayed = 0;
  const batchSize = 500; // Kinesis max batch size
  
  for (const archiveKey of archives) {
    // Get archived data from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: event.bucketName,
      Key: archiveKey
    });
    
    const s3Response = await s3.send(getObjectCommand);
    const archiveData = await s3Response.Body!.transformToString();
    const messages: IoTMessage[] = JSON.parse(archiveData);
    
    // Sort messages by timestamp to maintain ordering
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Distribute messages across Kinesis streams
    const messagesByStream: { [key: string]: any[] } = {};
    kinesisStreams.forEach((stream: string) => {
      messagesByStream[stream] = [];
    });
    
    messages.forEach((message, index) => {
      const streamIndex = index % kinesisStreams.length;
      const streamName = kinesisStreams[streamIndex];
      
      messagesByStream[streamName].push({
        Data: JSON.stringify(message),
        PartitionKey: message.deviceId
      });
    });
    
    // Republish to Kinesis in batches
    for (const [streamName, streamMessages] of Object.entries(messagesByStream)) {
      for (let i = 0; i < streamMessages.length; i += batchSize) {
        const batch = streamMessages.slice(i, i + batchSize);
        
        const putRecordsCommand = new PutRecordsCommand({
          StreamName: streamName,
          Records: batch
        });
        
        const response = await kinesis.send(putRecordsCommand);
        
        // Handle failed records
        if (response.FailedRecordCount && response.FailedRecordCount > 0) {
          const failedRecords = batch.filter((_, index) => 
            response.Records![index].ErrorCode
          );
          
          // Send failed records to EventBridge for DLQ routing
          await sendToEventBridge(failedRecords);
        }
        
        totalMessagesReplayed += batch.length - (response.FailedRecordCount || 0);
      }
    }
  }
  
  return {
    totalMessagesReplayed,
    targetMessageCount: 45000000,
    completionPercentage: (totalMessagesReplayed / 45000000) * 100
  };
};

async function sendToEventBridge(failedRecords: any[]) {
  const events = failedRecords.map(record => {
    const message = JSON.parse(record.Data);
    return {
      Source: 'iot.recovery',
      DetailType: 'Device Recovery Event',
      Detail: JSON.stringify({
        deviceId: message.deviceId,
        deviceType: message.deviceType,
        timestamp: message.timestamp,
        reason: 'kinesis_republish_failed'
      })
    };
  });
  
  const putEventsCommand = new PutEventsCommand({
    Entries: events
  });
  
  await eventbridge.send(putEventsCommand);
}
```

#### timestream-validation.ts
```typescript
import { TimestreamQueryClient, QueryCommand } from '@aws-sdk/client-timestream-query';
import { TimestreamWriteClient, WriteRecordsCommand } from '@aws-sdk/client-timestream-write';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const queryClient = new TimestreamQueryClient({});
const writeClient = new TimestreamWriteClient({});
const cloudwatch = new CloudWatchClient({});

export const handler = async (event: any) => {
  const databaseName = process.env.DATABASE_NAME!;
  const tableName = process.env.TABLE_NAME!;
  
  // Query for data continuity over the last 12 hours
  const query = `
    WITH recovery_stats AS (
      SELECT 
        device_id,
        COUNT(*) as record_count,
        MIN(time) as first_record,
        MAX(time) as last_record,
        COUNT(DISTINCT DATE_TRUNC('hour', time)) as hours_with_data
      FROM "${databaseName}"."${tableName}"
      WHERE time >= ago(12h)
      GROUP BY device_id
    )
    SELECT 
      COUNT(DISTINCT device_id) as recovered_devices,
      AVG(record_count) as avg_records_per_device,
      COUNT(CASE WHEN hours_with_data >= 12 THEN 1 END) as fully_recovered_devices
    FROM recovery_stats
  `;
  
  const queryCommand = new QueryCommand({
    QueryString: query
  });
  
  const response = await queryClient.send(queryCommand);
  const rows = response.Rows || [];
  
  if (rows.length > 0) {
    const stats = rows[0].Data!;
    const recoveredDevices = parseInt(stats[0].ScalarValue || '0');
    const fullyRecoveredDevices = parseInt(stats[2].ScalarValue || '0');
    
    // Calculate recovery percentage
    const targetDevices = event.failedDevices || 2300000;
    const recoveryPercentage = (fullyRecoveredDevices / targetDevices) * 100;
    
    // Write validation metrics to Timestream
    const validationRecord = {
      MeasureName: 'recovery_validation',
      MeasureValue: recoveryPercentage.toString(),
      MeasureValueType: 'DOUBLE',
      Time: Date.now().toString(),
      TimeUnit: 'MILLISECONDS',
      Dimensions: [
        { Name: 'metric_type', Value: 'recovery_percentage' },
        { Name: 'validation_run', Value: new Date().toISOString() }
      ]
    };
    
    await writeClient.send(new WriteRecordsCommand({
      DatabaseName: databaseName,
      TableName: tableName,
      Records: [validationRecord]
    }));
    
    // Send metrics to CloudWatch
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'IoTRecovery',
      MetricData: [
        {
          MetricName: 'RecoveryPercentage',
          Value: recoveryPercentage,
          Unit: 'Percent',
          Timestamp: new Date()
        },
        {
          MetricName: 'DevicesRecovered',
          Value: recoveredDevices,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }));
    
    // Check if 99.9% recovery target is met
    const targetMet = recoveryPercentage >= 99.9;
    
    return {
      recoveryPercentage,
      recoveredDevices,
      fullyRecoveredDevices,
      targetMet,
      validationTime: new Date().toISOString()
    };
  }
  
  return {
    error: 'No validation data available'
  };
};
```