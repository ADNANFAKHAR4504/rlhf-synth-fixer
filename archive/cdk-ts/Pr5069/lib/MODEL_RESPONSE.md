### Main Stack (tap-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as iot from 'aws-cdk-lib/aws-iot';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for archived IoT data
    const archiveBucket = new s3.Bucket(this, 'IoTArchiveBucket', {
      bucketName: `iot-archive-${this.account}-${this.region}`,
      versioned: true,
      lifecycleRules: [{
        id: 'archive-rule',
        transitions: [{
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        }],
      }],
    });

    // DynamoDB table for IoT time-series data
    const timeSeriesTable = new dynamodb.Table(this, 'IoTTimeSeriesTable', {
      tableName: 'IoTTimeSeries',
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Global Secondary Index for time-based queries
    timeSeriesTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'hour', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Kinesis Stream for message replay
    const recoveryStream = new kinesis.Stream(this, 'RecoveryStream', {
      streamName: 'iot-recovery-stream',
      shardCount: 100, // Handle 45M messages
      retentionPeriod: cdk.Duration.days(7),
    });

    // SQS Dead Letter Queues by device type
    const deviceTypes = ['sensor', 'actuator', 'gateway', 'edge'];
    const dlQueues: { [key: string]: sqs.Queue } = {};
    
    deviceTypes.forEach(type => {
      dlQueues[type] = new sqs.Queue(this, `${type}DLQueue`, {
        queueName: `iot-${type}-dlq`,
        visibilityTimeout: cdk.Duration.minutes(15),
        retentionPeriod: cdk.Duration.days(14),
      });
    });

    // Lambda function to analyze IoT shadow states
    const shadowAnalyzerLambda = new NodejsFunction(this, 'ShadowAnalyzerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/shadow-analyzer.ts'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 3008,
      reservedConcurrentExecutions: 100,
      environment: {
        REGION: this.region,
      },
    });

    // Grant IoT shadow read permissions
    shadowAnalyzerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iot:GetThingShadow', 'iot:ListThings'],
      resources: ['*'],
    }));

    // Lambda function for Kinesis publishing
    const kinesisPublisherLambda = new NodejsFunction(this, 'KinesisPublisherLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/kinesis-publisher.ts'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 3008,
      reservedConcurrentExecutions: 500,
      environment: {
        STREAM_NAME: recoveryStream.streamName,
        BUCKET_NAME: archiveBucket.bucketName,
      },
    });

    recoveryStream.grantWrite(kinesisPublisherLambda);
    archiveBucket.grantRead(kinesisPublisherLambda);

    // Lambda function for data validation
    const validatorLambda = new NodejsFunction(this, 'ValidatorLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/validator.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        TABLE_NAME: timeSeriesTable.tableName,
        INDEX_NAME: 'TimestampIndex',
      },
    });

    timeSeriesTable.grantReadData(validatorLambda);

    // Step Functions for orchestration
    const backfillTask = new sfnTasks.DynamoUpdateItem(this, 'BackfillData', {
      table: timeSeriesTable,
      key: {
        deviceId: sfnTasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$.deviceId')
        ),
        timestamp: sfnTasks.DynamoAttributeValue.fromNumber(
          stepfunctions.JsonPath.numberAt('$.timestamp')
        ),
      },
      updateExpression: 'SET #data = :data, #hour = :hour',
      expressionAttributeNames: {
        '#data': 'data',
        '#hour': 'hour',
      },
      expressionAttributeValues: {
        ':data': sfnTasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$.data')
        ),
        ':hour': sfnTasks.DynamoAttributeValue.fromString(
          stepfunctions.JsonPath.stringAt('$.hour')
        ),
      },
    });

    const publishTask = new sfnTasks.LambdaInvoke(this, 'PublishToKinesis', {
      lambdaFunction: kinesisPublisherLambda,
      outputPath: '$.Payload',
    });

    const validateTask = new sfnTasks.LambdaInvoke(this, 'ValidateRecovery', {
      lambdaFunction: validatorLambda,
      outputPath: '$.Payload',
    });

    // Parallel execution for backfill and publish
    const parallel = new stepfunctions.Parallel(this, 'ParallelRecovery');
    parallel.branch(backfillTask);
    parallel.branch(publishTask);

    // Step Function definition
    const recoveryStateMachine = new stepfunctions.StateMachine(this, 'RecoveryStateMachine', {
      definition: parallel.next(validateTask),
      timeout: cdk.Duration.hours(1),
    });

    // CloudWatch Alarms for IoT Core rule failures
    const ruleFailureAlarm = new cloudwatch.Alarm(this, 'IoTRuleFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/IoT',
        metricName: 'RuleMessageThrottled',
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'IoT Core rule failures detected',
    });

    // Lambda to start Step Functions
    const orchestratorLambda = new NodejsFunction(this, 'OrchestratorLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/orchestrator.ts'),
      timeout: cdk.Duration.minutes(5),
      environment: {
        STATE_MACHINE_ARN: recoveryStateMachine.stateMachineArn,
        SHADOW_ANALYZER_ARN: shadowAnalyzerLambda.functionArn,
      },
    });

    recoveryStateMachine.grantStartExecution(orchestratorLambda);
    shadowAnalyzerLambda.grantInvoke(orchestratorLambda);

    // Connect alarm to orchestrator
    ruleFailureAlarm.addAlarmAction(
      new cloudwatchActions.LambdaAction(orchestratorLambda)
    );

    // EventBridge rules for routing by device type
    const eventBus = new events.EventBus(this, 'RecoveryEventBus', {
      eventBusName: 'iot-recovery-bus',
    });

    deviceTypes.forEach(type => {
      new events.Rule(this, `${type}RecoveryRule`, {
        eventBus: eventBus,
        ruleName: `${type}-recovery-rule`,
        eventPattern: {
          source: ['iot.recovery'],
          detailType: ['Device Recovery'],
          detail: {
            deviceType: [type],
          },
        },
        targets: [new eventsTargets.SqsQueue(dlQueues[type])],
      });
    });

    // Lambda for processing Kinesis records and sending to EventBridge
    const eventRouterLambda = new NodejsFunction(this, 'EventRouterLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/event-router.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });

    eventBus.grantPutEventsTo(eventRouterLambda);
    
    // Kinesis event source for Lambda
    recoveryStream.grantRead(eventRouterLambda);
    eventRouterLambda.addEventSource(new lambda.EventSourceMapping(this, 'KinesisEventSource', {
      eventSourceArn: recoveryStream.streamArn,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 100,
      parallelizationFactor: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }));

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'RecoveryDashboard', {
      dashboardName: 'iot-recovery-dashboard',
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Rule Failures',
            left: [ruleFailureAlarm.metric],
            period: cdk.Duration.seconds(60),
          }),
          new cloudwatch.GraphWidget({
            title: 'Recovery Executions',
            left: [recoveryStateMachine.metricSucceeded()],
            right: [recoveryStateMachine.metricFailed()],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Kinesis Throughput',
            left: [recoveryStream.metricIncomingRecords()],
            right: [recoveryStream.metricIncomingBytes()],
          }),
          new cloudwatch.GraphWidget({
            title: 'DLQ Messages',
            left: Object.values(dlQueues).map(q => q.metricApproximateNumberOfMessagesVisible()),
          }),
        ],
      ],
    });
  }
}
```

### Lambda Functions

#### shadow-analyzer.ts
```typescript
import { IoTClient, GetThingShadowCommand, ListThingsCommand } from '@aws-sdk/client-iot';
import { IoTDataPlaneClient, GetThingShadowCommand as GetShadowCommand } from '@aws-sdk/client-iot-data-plane';

const iotClient = new IoTClient({ region: process.env.REGION });
const iotDataClient = new IoTDataPlaneClient({ region: process.env.REGION });

export const handler = async (event: any) => {
  const affectedDevices = [];
  const batchSize = 1000;
  let nextToken: string | undefined;

  // List all things in batches
  do {
    const listCommand = new ListThingsCommand({
      maxResults: batchSize,
      nextToken,
    });
    
    const response = await iotClient.send(listCommand);
    
    // Check shadows in parallel
    const shadowPromises = response.things?.map(async (thing) => {
      try {
        const shadowCommand = new GetShadowCommand({
          thingName: thing.thingName,
        });
        
        const shadowResponse = await iotDataClient.send(shadowCommand);
        const shadow = JSON.parse(new TextDecoder().decode(shadowResponse.payload));
        
        // Check if device is in error state
        if (shadow.state?.reported?.status === 'error') {
          return {
            deviceId: thing.thingName,
            deviceType: thing.thingTypeName || 'sensor',
            lastActivity: shadow.state?.reported?.timestamp,
          };
        }
      } catch (error) {
        console.error(`Error getting shadow for ${thing.thingName}:`, error);
      }
      return null;
    }) || [];

    const results = await Promise.all(shadowPromises);
    affectedDevices.push(...results.filter(Boolean));
    
    nextToken = response.nextToken;
  } while (nextToken);

  return {
    statusCode: 200,
    affectedDevices,
    totalChecked: affectedDevices.length,
  };
};
```

#### kinesis-publisher.ts
```typescript
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as zlib from 'zlib';
import { promisify } from 'util';

const kinesisClient = new KinesisClient({});
const s3Client = new S3Client({});
const gunzip = promisify(zlib.gunzip);

export const handler = async (event: any) => {
  const streamName = process.env.STREAM_NAME!;
  const bucketName = process.env.BUCKET_NAME!;
  
  let totalPublished = 0;
  const batchSize = 500; // Kinesis limit

  // Process each device's archived data
  for (const device of event.devices || []) {
    const key = `archive/${device.deviceId}/${event.startTime}-${event.endTime}.gz`;
    
    try {
      // Get archived data from S3
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const response = await s3Client.send(getCommand);
      const body = await streamToBuffer(response.Body as Readable);
      const data = await gunzip(body);
      const messages = JSON.parse(data.toString()).messages;
      
      // Sort by timestamp to maintain order
      messages.sort((a: any, b: any) => a.timestamp - b.timestamp);
      
      // Publish in batches
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        const records = batch.map((msg: any) => ({
          Data: Buffer.from(JSON.stringify(msg)),
          PartitionKey: device.deviceId,
        }));
        
        const putCommand = new PutRecordsCommand({
          StreamName: streamName,
          Records: records,
        });
        
        const result = await kinesisClient.send(putCommand);
        totalPublished += result.Records?.length || 0;
        
        // Handle failed records
        if (result.FailedRecordCount && result.FailedRecordCount > 0) {
          console.error(`Failed to publish ${result.FailedRecordCount} records`);
          // Retry logic here
        }
      }
    } catch (error) {
      console.error(`Error processing device ${device.deviceId}:`, error);
    }
  }

  return {
    statusCode: 200,
    totalPublished,
  };
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}
```

#### validator.ts
```typescript
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({});

export const handler = async (event: any) => {
  const tableName = process.env.TABLE_NAME!;
  const indexName = process.env.INDEX_NAME!;
  
  const validationResults = [];
  const gapThreshold = 60000; // 1 minute in milliseconds

  for (const device of event.devices || []) {
    const startTime = event.startTime;
    const endTime = event.endTime;
    const hour = new Date(startTime).toISOString().substring(0, 13);
    
    try {
      // Query time-series data
      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#hour = :hour AND #timestamp BETWEEN :start AND :end',
        ExpressionAttributeNames: {
          '#hour': 'hour',
          '#timestamp': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':hour': { S: hour },
          ':start': { N: startTime.toString() },
          ':end': { N: endTime.toString() },
        },
        FilterExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ...queryCommand.input.ExpressionAttributeValues,
          ':deviceId': { S: device.deviceId },
        },
      });
      
      const response = await dynamoClient.send(queryCommand);
      const items = response.Items?.map(item => unmarshall(item)) || [];
      
      // Sort by timestamp
      items.sort((a, b) => a.timestamp - b.timestamp);
      
      // Check for gaps
      const gaps = [];
      for (let i = 1; i < items.length; i++) {
        const gap = items[i].timestamp - items[i-1].timestamp;
        if (gap > gapThreshold) {
          gaps.push({
            start: items[i-1].timestamp,
            end: items[i].timestamp,
            duration: gap,
          });
        }
      }
      
      const recoveryRate = items.length > 0 
        ? ((endTime - startTime - gaps.reduce((sum, gap) => sum + gap.duration, 0)) / (endTime - startTime)) * 100
        : 0;
      
      validationResults.push({
        deviceId: device.deviceId,
        recordsFound: items.length,
        gaps: gaps.length,
        recoveryRate: recoveryRate.toFixed(2),
        status: recoveryRate >= 99.9 ? 'SUCCESS' : 'PARTIAL',
      });
      
    } catch (error) {
      console.error(`Validation error for device ${device.deviceId}:`, error);
      validationResults.push({
        deviceId: device.deviceId,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  const overallRecoveryRate = validationResults
    .filter(r => r.status === 'SUCCESS')
    .length / validationResults.length * 100;

  return {
    statusCode: 200,
    validationResults,
    overallRecoveryRate: overallRecoveryRate.toFixed(2),
    meetsTarget: overallRecoveryRate >= 99.9,
  };
};
```

#### event-router.ts
```typescript
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eventBridgeClient = new EventBridgeClient({});

export const handler = async (event: any) => {
  const eventBusName = process.env.EVENT_BUS_NAME!;
  const entries = [];

  for (const record of event.Records) {
    const data = JSON.parse(
      Buffer.from(record.kinesis.data, 'base64').toString()
    );

    entries.push({
      Source: 'iot.recovery',
      DetailType: 'Device Recovery',
      Detail: JSON.stringify({
        deviceId: data.deviceId,
        deviceType: data.deviceType || 'sensor',
        timestamp: data.timestamp,
        recoveryTime: new Date().toISOString(),
        data: data,
      }),
      EventBusName: eventBusName,
    });
  }

  // Send events in batches (EventBridge limit is 10)
  for (let i = 0; i < entries.length; i += 10) {
    const batch = entries.slice(i, i + 10);
    
    const command = new PutEventsCommand({
      Entries: batch,
    });
    
    await eventBridgeClient.send(command);
  }

  return {
    statusCode: 200,
    processed: entries.length,
  };
};
```

#### orchestrator.ts
```typescript
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

const lambdaClient = new LambdaClient({});
const sfnClient = new SFNClient({});

export const handler = async (event: any) => {
  const stateMachineArn = process.env.STATE_MACHINE_ARN!;
  const shadowAnalyzerArn = process.env.SHADOW_ANALYZER_ARN!;
  
  // First, analyze affected devices
  const analyzeCommand = new InvokeCommand({
    FunctionName: shadowAnalyzerArn,
    InvocationType: 'RequestResponse',
  });
  
  const analysisResult = await lambdaClient.send(analyzeCommand);
  const analysis = JSON.parse(new TextDecoder().decode(analysisResult.Payload));
  
  // Start recovery for affected devices
  const executions = [];
  const batchSize = 100;
  
  for (let i = 0; i < analysis.affectedDevices.length; i += batchSize) {
    const batch = analysis.affectedDevices.slice(i, i + batchSize);
    
    const executionCommand = new StartExecutionCommand({
      stateMachineArn,
      name: `recovery-${Date.now()}-${i}`,
      input: JSON.stringify({
        devices: batch,
        startTime: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
        endTime: Date.now(),
      }),
    });
    
    const execution = await sfnClient.send(executionCommand);
    executions.push(execution.executionArn);
  }

  return {
    statusCode: 200,
    affectedDevices: analysis.affectedDevices.length,
    executions: executions.length,
  };
};
```