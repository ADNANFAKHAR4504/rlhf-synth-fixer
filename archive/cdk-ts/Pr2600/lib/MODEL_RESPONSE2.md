Here are the corrected TypeScript code sections to fix the compilation errors:

## Fix 1: Lambda Function Type Issue

```typescript
// In lambda/audit-function.ts or inline Lambda code
const s3ProcessorFunction = new lambda.Function(
  this,
  `S3ProcessorFunction-${environmentSuffix}`,
  {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    role: lambdaRole,
    code: lambda.Code.fromInline(`
    const AWS = require('aws-sdk');
    const sqs = new AWS.SQS();
    
    exports.handler = async (event) => {
      try {
        console.log('S3 Event:', JSON.stringify(event, null, 2));
        
        for (const record of event.Records) {
          const message = {
            eventName: record.eventName,
            bucketName: record.s3.bucket.name,
            objectKey: record.s3.object.key,
            timestamp: new Date().toISOString()
          };
          
          await sqs.sendMessage({
            QueueUrl: '${logQueue.queueUrl}',
            MessageBody: JSON.stringify(message)
          }).promise();
        }
        
        return { statusCode: 200 };
      } catch (error) {
        // Fix: Proper error type handling
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error processing S3 event:', errorMessage);
        throw error;
      }
    };
  `),
    environment: {
      QUEUE_URL: logQueue.queueUrl,
    },
  }
);
```

## Fix 2-4: AutoScaling Group Metric Issues

```typescript
// 12. CloudWatch alarms for CPU/memory - CORRECTED VERSION
const cpuAlarm = new cloudwatch.Alarm(this, `CpuAlarm-${environmentSuffix}`, {
  // Fix: Use correct metric method
  metric: autoScalingGroup.metric('CPUUtilization', {
    statistic: 'Average',
  }),
  threshold: 80,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: 'High CPU utilization alarm',
});

const memoryAlarm = new cloudwatch.Alarm(
  this,
  `MemoryAlarm-${environmentSuffix}`,
  {
    metric: new cloudwatch.Metric({
      namespace: 'CWAgent',
      metricName: 'mem_used_percent',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    }),
    threshold: 80,
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    alarmDescription: 'High memory utilization alarm',
  }
);

// Scale up policy - CORRECTED VERSION
const scaleUpPolicy = autoScalingGroup.scaleOnMetric('ScaleUp', {
  // Fix: Use correct metric method
  metric: autoScalingGroup.metric('CPUUtilization', {
    statistic: 'Average',
  }),
  scalingSteps: [
    { upper: 50, change: +1 },
    { lower: 85, change: +2 },
  ],
  adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
  cooldown: cdk.Duration.minutes(5),
});

// Scale down policy - CORRECTED VERSION
const scaleDownPolicy = autoScalingGroup.scaleOnMetric('ScaleDown', {
  // Fix: Use correct metric method
  metric: autoScalingGroup.metric('CPUUtilization', {
    statistic: 'Average',
  }),
  scalingSteps: [{ upper: 30, change: -1 }],
  adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
  cooldown: cdk.Duration.minutes(5),
});
```

## Alternative Approach for More Robust Scaling Policies

If you want more control over the scaling policies, you can also use this approach:

```typescript
// Alternative: Using step scaling policies with CloudWatch alarms
const scaleUpAlarm = new cloudwatch.Alarm(
  this,
  `ScaleUpAlarm-${environmentSuffix}`,
  {
    metric: autoScalingGroup.metric('CPUUtilization', {
      statistic: 'Average',
    }),
    threshold: 70,
    evaluationPeriods: 2,
    alarmDescription: 'Scale up when CPU > 70%',
  }
);

const scaleDownAlarm = new cloudwatch.Alarm(
  this,
  `ScaleDownAlarm-${environmentSuffix}`,
  {
    metric: autoScalingGroup.metric('CPUUtilization', {
      statistic: 'Average',
    }),
    threshold: 30,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    alarmDescription: 'Scale down when CPU < 30%',
  }
);

// Create scaling policies
const scaleUpAction = new autoscaling.StepScalingAction(
  this,
  `ScaleUpAction-${environmentSuffix}`,
  {
    autoScalingGroup,
    adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    cooldown: cdk.Duration.minutes(5),
  }
);

scaleUpAction.addAdjustment({
  adjustment: 1,
  lowerBound: 0,
});

const scaleDownAction = new autoscaling.StepScalingAction(
  this,
  `ScaleDownAction-${environmentSuffix}`,
  {
    autoScalingGroup,
    adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    cooldown: cdk.Duration.minutes(5),
  }
);

scaleDownAction.addAdjustment({
  adjustment: -1,
  upperBound: 0,
});

// Connect alarms to scaling actions
scaleUpAlarm.addAlarmAction(
  new cdk.aws_cloudwatch_actions.AutoScalingAction(scaleUpAction)
);
scaleDownAlarm.addAlarmAction(
  new cdk.aws_cloudwatch_actions.AutoScalingAction(scaleDownAction)
);
```

These fixes address:

1. **Lambda Type Issue**: Added proper error handling with type checking using `instanceof Error` and `String()` conversion
2. **AutoScaling Metrics**: Changed from `metricCpuUtilization()` to `metric('CPUUtilization', { statistic: 'Average' })`
3. **Added Cooldown**: Added cooldown periods to prevent rapid scaling
4. **Provided Alternative**: Included a more robust scaling approach using separate alarms and actions

The corrected code maintains all existing security features while fixing the TypeScript compilation errors.
