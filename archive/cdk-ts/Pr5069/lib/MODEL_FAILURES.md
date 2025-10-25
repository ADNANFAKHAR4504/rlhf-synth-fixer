# Model Failures and Fixes

## Stack Configuration Issues

### FAILURE 1: Missing Environment Suffix Support
**Location:** `tap-stack.ts` - Stack constructor
**Issue:** Stack does not accept or use `environmentSuffix` parameter for multi-environment deployments
**Original Code:**
```typescript
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
```
**Fixed Code:**
```typescript
export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);
    this.environmentSuffix = props.environmentSuffix;
```

### FAILURE 2: Hard-coded Resource Names
**Location:** `tap-stack.ts` - Multiple resources
**Issue:** Resource names are hard-coded without environment suffix, causing conflicts in multi-environment deployments
**Original Code:**
```typescript
bucketName: `iot-archive-${this.account}-${this.region}`,
tableName: 'IoTTimeSeries',
streamName: 'iot-recovery-stream',
queueName: `iot-${type}-dlq`,
```
**Fixed Code:**
```typescript
bucketName: `iot-archive-${this.environmentSuffix}-${this.account}-${this.region}`,
tableName: `iot-device-recovery-${this.environmentSuffix}`,
streamName: `iot-replay-stream-${this.environmentSuffix}-${i}`,
queueName: `iot-recovery-dlq-${this.environmentSuffix}-${type}`,
```

### FAILURE 3: Missing Removal Policies
**Location:** `tap-stack.ts` - All stateful resources
**Issue:** No removal policies defined, making it difficult to clean up non-production environments
**Original Code:**
```typescript
const archiveBucket = new s3.Bucket(this, 'IoTArchiveBucket', {
  bucketName: `iot-archive-${this.account}-${this.region}`,
  versioned: true,
});
```
**Fixed Code:**
```typescript
const archiveBucket = new s3.Bucket(this, 'IoTArchiveBucket', {
  bucketName: `iot-archive-${this.environmentSuffix}-${this.account}-${this.region}`,
  versioned: true,
  removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: this.environmentSuffix !== 'prod',
});
```

### FAILURE 4: Missing CloudFormation Outputs
**Location:** `tap-stack.ts` - End of stack
**Issue:** No CloudFormation outputs defined for resource ARNs, names, and helper commands
**Original Code:** No outputs present
**Fixed Code:**
```typescript
new cdk.CfnOutput(this, 'IoTArchiveBucketName', {
  value: archiveBucket.bucketName,
  description: 'S3 bucket for archived IoT data',
  exportName: `IoTArchiveBucket-${this.environmentSuffix}`
});
// ... 20+ additional outputs for all key resources
```

## DynamoDB Configuration Issues

### FAILURE 5: Deprecated pointInTimeRecovery Property
**Location:** `tap-stack.ts` - DynamoDB table
**Issue:** Using deprecated `pointInTimeRecovery` property
**Original Code:**
```typescript
pointInTimeRecovery: true,
```
**Fixed Code:**
```typescript
pointInTimeRecoverySpecification: {
  pointInTimeRecoveryEnabled: true
},
```

### FAILURE 6: Wrong Table Schema for Recovery Use Case
**Location:** `tap-stack.ts` - DynamoDB table
**Issue:** Table named `IoTTimeSeries` with `hour` attribute doesn't match device recovery requirements
**Original Code:**
```typescript
const timeSeriesTable = new dynamodb.Table(this, 'IoTTimeSeriesTable', {
  tableName: 'IoTTimeSeries',
  partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
});

timeSeriesTable.addGlobalSecondaryIndex({
  indexName: 'TimestampIndex',
  partitionKey: { name: 'hour', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
});
```
**Fixed Code:**
```typescript
const deviceTable = new dynamodb.Table(this, 'DeviceRecoveryTable', {
  tableName: `iot-device-recovery-${this.environmentSuffix}`,
  partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
});

deviceTable.addGlobalSecondaryIndex({
  indexName: `deviceType-index-${this.environmentSuffix}`,
  partitionKey: { name: 'deviceType', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
});
```

### FAILURE 7: Missing Validation Table with Time-Series Support
**Location:** `tap-stack.ts` - Missing validation table
**Issue:** No dedicated table for recovery validation with time-series range queries and TTL
**Original Code:** No validation table present
**Fixed Code:**
```typescript
const validationTable = new dynamodb.Table(this, 'RecoveryValidationTable', {
  tableName: `iot-recovery-validation-${this.environmentSuffix}`,
  partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: true
  },
  timeToLiveAttribute: 'ttl',
});

validationTable.addGlobalSecondaryIndex({
  indexName: `timestamp-index-${this.environmentSuffix}`,
  partitionKey: { name: 'validationType', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
  projectionType: dynamodb.ProjectionType.ALL
});
```

## Kinesis Configuration Issues

### FAILURE 8: Single Stream Instead of Partitioned Streams
**Location:** `tap-stack.ts` - Kinesis stream
**Issue:** Single stream with 100 shards cannot handle 45M message replay requirement efficiently
**Original Code:**
```typescript
const recoveryStream = new kinesis.Stream(this, 'RecoveryStream', {
  streamName: 'iot-recovery-stream',
  shardCount: 100,
  retentionPeriod: cdk.Duration.days(7),
});
```
**Fixed Code:**
```typescript
const kinesisStreams: kinesis.Stream[] = [];
for (let i = 0; i < 10; i++) {
  kinesisStreams.push(new kinesis.Stream(this, `IoTReplayStream${i}`, {
    streamName: `iot-replay-stream-${this.environmentSuffix}-${i}`,
    shardCount: 100, // 1000 shards total
    retentionPeriod: cdk.Duration.hours(24),
    removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
  }));
}
```

### FAILURE 9: Wrong Retention Period
**Location:** `tap-stack.ts` - Kinesis stream
**Issue:** 7-day retention is excessive for recovery replay (increases costs)
**Original Code:**
```typescript
retentionPeriod: cdk.Duration.days(7),
```
**Fixed Code:**
```typescript
retentionPeriod: cdk.Duration.hours(24),
```

## SQS Configuration Issues

### FAILURE 10: Missing Secondary Dead Letter Queues
**Location:** `tap-stack.ts` - SQS queues
**Issue:** No secondary DLQs for additional resilience
**Original Code:**
```typescript
dlQueues[type] = new sqs.Queue(this, `${type}DLQueue`, {
  queueName: `iot-${type}-dlq`,
  visibilityTimeout: cdk.Duration.minutes(15),
  retentionPeriod: cdk.Duration.days(14),
});
```
**Fixed Code:**
```typescript
dlQueues[type] = new sqs.Queue(this, `${type}DLQ`, {
  queueName: `iot-recovery-dlq-${this.environmentSuffix}-${type}`,
  visibilityTimeout: cdk.Duration.minutes(15),
  retentionPeriod: cdk.Duration.days(14),
  removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
  deadLetterQueue: {
    maxReceiveCount: 3,
    queue: new sqs.Queue(this, `${type}DLQ-Secondary`, {
      queueName: `iot-recovery-dlq-${this.environmentSuffix}-${type}-secondary`,
      removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    })
  }
});
```

## Lambda Configuration Issues

### FAILURE 11: Wrong Lambda File Names
**Location:** `tap-stack.ts` - Lambda function entry points
**Issue:** Lambda file names don't match actual implementation files
**Original Code:**
```typescript
entry: path.join(__dirname, '../lambda/shadow-analyzer.ts'),
entry: path.join(__dirname, '../lambda/kinesis-publisher.ts'),
entry: path.join(__dirname, '../lambda/validator.ts'),
entry: path.join(__dirname, '../lambda/orchestrator.ts'),
entry: path.join(__dirname, '../lambda/event-router.ts'),
```
**Fixed Code:**
```typescript
entry: path.join(__dirname, '../lambda/shadow-analysis.ts'),
entry: path.join(__dirname, '../lambda/kinesis-republish.ts'),
entry: path.join(__dirname, '../lambda/dynamodb-validation.ts'),
entry: path.join(__dirname, '../lambda/trigger-recovery.ts'),
```

### FAILURE 12: Missing Environment Variables
**Location:** `tap-stack.ts` - Lambda functions
**Issue:** Lambda functions missing critical environment variables like ENVIRONMENT
**Original Code:**
```typescript
environment: {
  REGION: this.region,
}
```
**Fixed Code:**
```typescript
environment: {
  DEVICE_TABLE_NAME: deviceTable.tableName,
  BUCKET_NAME: archiveBucket.bucketName,
  ENVIRONMENT: this.environmentSuffix
}
```

### FAILURE 13: Incorrect Lambda Function Names
**Location:** `tap-stack.ts` - Lambda functions
**Issue:** Lambda functions not explicitly named, making them hard to identify
**Original Code:** No `functionName` property
**Fixed Code:**
```typescript
functionName: `iot-shadow-analysis-${this.environmentSuffix}`,
functionName: `iot-kinesis-republish-${this.environmentSuffix}`,
functionName: `iot-dynamodb-validation-${this.environmentSuffix}`,
functionName: `iot-trigger-recovery-${this.environmentSuffix}`,
```

## Step Functions Issues

### FAILURE 14: Deprecated definition Property
**Location:** `tap-stack.ts` - Step Functions state machine
**Issue:** Using deprecated `definition` property instead of `definitionBody`
**Original Code:**
```typescript
const recoveryStateMachine = new stepfunctions.StateMachine(this, 'RecoveryStateMachine', {
  definition: parallel.next(validateTask),
  timeout: cdk.Duration.hours(1),
});
```
**Fixed Code:**
```typescript
const stateMachine = new stepfunctions.StateMachine(this, 'RecoveryStateMachine', {
  stateMachineName: `iot-recovery-orchestration-${this.environmentSuffix}`,
  definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
  timeout: cdk.Duration.hours(2),
  removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
});
```

### FAILURE 15: Wrong Step Functions Task Definition
**Location:** `tap-stack.ts` - Step Functions tasks
**Issue:** Using `DynamoUpdateItem` task instead of Lambda invokes for backfill
**Original Code:**
```typescript
const backfillTask = new sfnTasks.DynamoUpdateItem(this, 'BackfillData', {
  table: timeSeriesTable,
  key: { /* complex key configuration */ },
  updateExpression: 'SET #data = :data, #hour = :hour',
  // ... expression attributes
});
```
**Fixed Code:**
```typescript
const backfillTask = new sfnTasks.LambdaInvoke(this, 'BackfillTask', {
  lambdaFunction: shadowAnalysisLambda,
  outputPath: '$.Payload'
});
```

### FAILURE 16: Wrong Timeout Duration
**Location:** `tap-stack.ts` - Step Functions state machine
**Issue:** 1-hour timeout insufficient for 12-hour backfill window processing
**Original Code:**
```typescript
timeout: cdk.Duration.hours(1),
```
**Fixed Code:**
```typescript
timeout: cdk.Duration.hours(2),
```

## CloudWatch Issues

### FAILURE 17: Invalid Metric Period
**Location:** `tap-stack.ts` - CloudWatch alarm metric
**Issue:** No period specified for alarm metric (defaults may not meet requirements)
**Original Code:**
```typescript
metric: new cloudwatch.Metric({
  namespace: 'AWS/IoT',
  metricName: 'RuleMessageThrottled',
  statistic: 'Sum',
}),
```
**Fixed Code:**
```typescript
metric: new cloudwatch.Metric({
  namespace: 'AWS/IoT',
  metricName: 'RuleMessageThrottled',
  dimensionsMap: {
    RuleName: '*'
  },
  statistic: 'Sum',
  period: cdk.Duration.minutes(1)
}),
```

### FAILURE 18: Missing Alarm Name
**Location:** `tap-stack.ts` - CloudWatch alarm
**Issue:** Alarm not explicitly named, making it hard to identify
**Original Code:** No `alarmName` property
**Fixed Code:**
```typescript
alarmName: `iot-rule-failures-${this.environmentSuffix}`,
```

## Lambda Implementation Issues

### FAILURE 19: Wrong IoT Client Import
**Location:** `lambda/shadow-analyzer.ts` - Imports
**Issue:** `GetThingShadowCommand` imported from wrong package
**Original Code:**
```typescript
import { IoTClient, GetThingShadowCommand, ListThingsCommand } from '@aws-sdk/client-iot';
```
**Fixed Code:**
```typescript
import { IoTClient, ListThingsCommand } from '@aws-sdk/client-iot';
import { GetThingShadowCommand, IoTDataPlaneClient } from '@aws-sdk/client-iot-data-plane';
```

### FAILURE 20: Wrong IoT Client Usage
**Location:** `lambda/shadow-analyzer.ts` - Client instantiation
**Issue:** Using wrong client for shadow operations
**Original Code:**
```typescript
const iotClient = new IoTClient({ region: process.env.REGION });
// ... later
const shadowCommand = new GetShadowCommand({
  thingName: thing.thingName,
});
const shadowResponse = await iotDataClient.send(shadowCommand);
```
**Fixed Code:**
```typescript
const iot = new IoTClient({});
const iotData = new IoTDataPlaneClient({});
// ... later
const shadowCommand = new GetThingShadowCommand({
  thingName: thing.thingName!
});
const shadowResponse = await iotData.send(shadowCommand);
```

### FAILURE 21: Incorrect Shadow Payload Decoding
**Location:** `lambda/shadow-analyzer.ts` - Shadow response processing
**Issue:** Shadow payload not properly decoded from Uint8Array
**Original Code:**
```typescript
const shadow = JSON.parse(new TextDecoder().decode(shadowResponse.payload));
```
**Fixed Code:**
```typescript
const shadow = JSON.parse(new TextDecoder().decode(shadowResponse.payload));
```
Note: This is actually correct in the original, but the issue is that the payload needs explicit handling.

### FAILURE 22: Missing DynamoDB Write Operation
**Location:** `lambda/shadow-analyzer.ts` - Device storage
**Issue:** No actual DynamoDB writes for failed devices
**Original Code:** No DynamoDB write implementation visible
**Fixed Code:**
```typescript
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
```

### FAILURE 23: Missing S3 Archive Processing
**Location:** `lambda/shadow-analyzer.ts` - Archive identification
**Issue:** No S3 archive identification for 12-hour backfill window
**Original Code:** Not implemented
**Fixed Code:**
```typescript
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
```

### FAILURE 24: Missing Environment Variable in Response
**Location:** `lambda/shadow-analyzer.ts` - Handler return
**Issue:** Environment not included in response for downstream processing
**Original Code:**
```typescript
return {
  statusCode: 200,
  affectedDevices,
  totalChecked: affectedDevices.length,
};
```
**Fixed Code:**
```typescript
return {
  processedDevices,
  failedDevices: failedDevices.length,
  archivesToProcess: archives,
  environment
};
```

### FAILURE 25: Wrong Kinesis Stream Configuration
**Location:** `lambda/kinesis-publisher.ts` - Stream handling
**Issue:** Single stream name instead of multiple partitioned streams
**Original Code:**
```typescript
const streamName = process.env.STREAM_NAME!;
```
**Fixed Code:**
```typescript
const kinesisStreams = JSON.parse(process.env.KINESIS_STREAMS!);
```

### FAILURE 26: Missing EventBridge Integration
**Location:** `lambda/kinesis-publisher.ts` - Error handling
**Issue:** No EventBridge integration for failed record routing
**Original Code:**
```typescript
if (result.FailedRecordCount && result.FailedRecordCount > 0) {
  console.error(`Failed to publish ${result.FailedRecordCount} records`);
  // Retry logic here
}
```
**Fixed Code:**
```typescript
if (response.FailedRecordCount && response.FailedRecordCount > 0) {
  const failedRecords = batch.filter((_, index) =>
    response.Records![index].ErrorCode
  );
  await sendToEventBridge(failedRecords);
}

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
  await eventbridge.send(new PutEventsCommand({ Entries: events }));
}
```

### FAILURE 27: Complex S3 Archive Format
**Location:** `lambda/kinesis-publisher.ts` - S3 data retrieval
**Issue:** Assumes gzipped archive format with specific structure
**Original Code:**
```typescript
const body = await streamToBuffer(response.Body as Readable);
const data = await gunzip(body);
const messages = JSON.parse(data.toString()).messages;
```
**Fixed Code:**
```typescript
const archiveData = await s3Response.Body!.transformToString();
const messages: IoTMessage[] = JSON.parse(archiveData);
```

### FAILURE 28: Wrong Validation Approach
**Location:** `lambda/validator.ts` - Entire file
**Issue:** Uses DynamoDB queries instead of dedicated validation table with time-series analysis
**Original Code:** Complex DynamoDB queries with filters
**Fixed Code:** Complete rewrite to `lambda/dynamodb-validation.ts` with:
- Dedicated validation table writes with TTL
- Time-series range queries using GSI
- Timestamp gap detection
- CloudWatch metrics integration
- Data continuity percentage calculation
- 99.9% recovery target validation

### FAILURE 29: Missing CloudWatch Metrics
**Location:** `lambda/validator.ts` - Validation results
**Issue:** No CloudWatch metrics sent for monitoring
**Original Code:** Returns only JSON response
**Fixed Code:**
```typescript
await cloudwatch.send(new PutMetricDataCommand({
  Namespace: `IoTRecovery-${environment}`,
  MetricData: [
    { MetricName: 'RecoveryPercentage', Value: recoveryPercentage, Unit: StandardUnit.Percent },
    { MetricName: 'DevicesRecovered', Value: processedDevices - failedDevices, Unit: StandardUnit.Count },
    { MetricName: 'DevicesFailed', Value: failedDevices, Unit: StandardUnit.Count },
    { MetricName: 'MessagesReplayed', Value: totalMessagesReplayed, Unit: StandardUnit.Count },
    { MetricName: 'DataContinuityPercentage', Value: dataContinuityPercentage, Unit: StandardUnit.Percent },
    { MetricName: 'TimestampGapsDetected', Value: timestampGaps.length, Unit: StandardUnit.Count },
    { MetricName: 'RecoveryCompletion', Value: recoveryPercentage >= 99.9 ? 1 : 0, Unit: StandardUnit.None }
  ]
}));
```

### FAILURE 30: Unused event-router.ts Lambda
**Location:** `lambda/event-router.ts` - Entire file
**Issue:** This Lambda is unnecessary as EventBridge integration is handled within kinesis-republish Lambda
**Original Code:** Complete separate Lambda function
**Fixed Code:** Removed entirely, functionality integrated into kinesis-republish.ts

### FAILURE 31: Wrong Orchestrator Implementation
**Location:** `lambda/orchestrator.ts` - Entire file
**Issue:** Complex two-step orchestration (analyze then execute) instead of simple Step Functions trigger
**Original Code:** Invokes shadow analyzer then starts multiple state machine executions
**Fixed Code:** Complete rewrite to `lambda/trigger-recovery.ts`:
```typescript
const startExecutionCommand = new StartExecutionCommand({
  stateMachineArn,
  name: `recovery-${Date.now()}`,
  input: JSON.stringify({
    triggerTime: new Date().toISOString(),
    triggerSource: event.source || 'cloudwatch-alarm',
    environment,
    ...event
  })
});
```

### FAILURE 32: Wrong Error Handling
**Location:** Multiple Lambda files - Error handling
**Issue:** Inconsistent error handling and logging
**Original Code:**
```typescript
} catch (error) {
  console.error(`Error processing device ${device.deviceId}:`, error);
}
```
**Fixed Code:**
```typescript
} catch (error) {
  console.error('Failed to perform DynamoDB validation:', error);
  return {
    error: 'Failed to perform validation',
    details: error instanceof Error ? error.message : 'Unknown error',
    recoveryPercentage: 0,
    processedDevices,
    failedDevices,
    totalMessagesReplayed,
    environment
  };
}
```

## EventBridge Issues

### FAILURE 33: Missing Environment-Specific Event Bus Name
**Location:** `tap-stack.ts` - EventBridge event bus
**Issue:** Event bus name not environment-specific
**Original Code:**
```typescript
eventBusName: 'iot-recovery-bus',
```
**Fixed Code:**
```typescript
eventBusName: `iot-recovery-events-${this.environmentSuffix}`
```

### FAILURE 34: Missing Environment-Specific Rule Names
**Location:** `tap-stack.ts` - EventBridge rules
**Issue:** Rule names not environment-specific
**Original Code:**
```typescript
ruleName: `${type}-recovery-rule`,
```
**Fixed Code:**
```typescript
ruleName: `iot-recovery-${this.environmentSuffix}-${type}`,
```

## Kinesis Event Source Issues

### FAILURE 35: Incorrect Event Source Mapping
**Location:** `tap-stack.ts` - Kinesis event source
**Issue:** Using deprecated EventSourceMapping constructor directly
**Original Code:**
```typescript
eventRouterLambda.addEventSource(new lambda.EventSourceMapping(this, 'KinesisEventSource', {
  eventSourceArn: recoveryStream.streamArn,
  startingPosition: lambda.StartingPosition.TRIM_HORIZON,
  batchSize: 100,
  parallelizationFactor: 10,
  maxBatchingWindow: cdk.Duration.seconds(5),
}));
```
**Fixed Code:** Removed event router Lambda entirely as EventBridge integration is handled in kinesis-republish Lambda

## Architecture Issues

### FAILURE 36: Glacier Transition Too Long
**Location:** `tap-stack.ts` - S3 lifecycle rule
**Issue:** 90-day Glacier transition too long for recovery data
**Original Code:**
```typescript
transitionAfter: cdk.Duration.days(90),
```
**Fixed Code:**
```typescript
transitionAfter: cdk.Duration.days(30)
```

### FAILURE 37: Missing IAM CloudWatch Permissions
**Location:** `tap-stack.ts` - Lambda IAM policies
**Issue:** Validation Lambda missing CloudWatch PutMetricData permissions
**Original Code:** No CloudWatch permissions
**Fixed Code:**
```typescript
dynamodbValidationLambda.addToRolePolicy(new iam.PolicyStatement({
  actions: [
    'cloudwatch:PutMetricData',
    'cloudwatch:GetMetricStatistics'
  ],
  resources: ['*']
}));
```

### FAILURE 38: Missing Dashboard Name
**Location:** `tap-stack.ts` - CloudWatch dashboard
**Issue:** Dashboard name not environment-specific
**Original Code:**
```typescript
dashboardName: 'iot-recovery-dashboard',
```
**Fixed Code:**
```typescript
dashboardName: `iot-recovery-monitoring-${this.environmentSuffix}`,
```

### FAILURE 39: Wrong Lambda Memory Allocation
**Location:** `tap-stack.ts` - Validator Lambda
**Issue:** Validation Lambda only has 1024 MB when it needs more for large-scale queries
**Original Code:**
```typescript
memorySize: 1024,
```
**Fixed Code:**
```typescript
memorySize: 3008,
```
