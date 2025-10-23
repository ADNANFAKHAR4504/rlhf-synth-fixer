import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    this.environmentSuffix = props.environmentSuffix;

    // S3 bucket for archived IoT data
    const archiveBucket = new s3.Bucket(this, 'IoTArchiveBucket', {
      bucketName: `iot-archive-${this.environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: this.environmentSuffix !== 'prod',
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
      tableName: `iot-device-recovery-${this.environmentSuffix}`,
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // Global Secondary Index for device type queries
    deviceTable.addGlobalSecondaryIndex({
      indexName: `deviceType-index-${this.environmentSuffix}`,
      partitionKey: { name: 'deviceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER }
    });

    // Kinesis streams for message replay (partitioned for scale)
    const kinesisStreams: kinesis.Stream[] = [];
    for (let i = 0; i < 10; i++) {
      kinesisStreams.push(new kinesis.Stream(this, `IoTReplayStream${i}`, {
        streamName: `iot-replay-stream-${this.environmentSuffix}-${i}`,
        shardCount: 100, // 1000 shards total for 45M messages
        retentionPeriod: cdk.Duration.hours(24),
        removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
      }));
    }

    // SQS Dead Letter Queues by device type
    const deviceTypes = ['sensor', 'actuator', 'gateway', 'edge'];
    const dlQueues: { [key: string]: sqs.Queue } = {};

    deviceTypes.forEach(type => {
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
    });

    // DynamoDB table for recovery validation with time-series data
    const validationTable = new dynamodb.Table(this, 'RecoveryValidationTable', {
      tableName: `iot-recovery-validation-${this.environmentSuffix}`,
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      },
      timeToLiveAttribute: 'ttl', // Auto-delete old validation records
      removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // Global Secondary Index for time-range queries
    validationTable.addGlobalSecondaryIndex({
      indexName: `timestamp-index-${this.environmentSuffix}`,
      partitionKey: { name: 'validationType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Lambda function for shadow state analysis
    const shadowAnalysisLambda = new NodejsFunction(this, 'ShadowAnalysisLambda', {
      functionName: `iot-shadow-analysis-${this.environmentSuffix}`,
      entry: path.join(__dirname, '../lambda/shadow-analysis.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 3008, // Max memory for handling 2.3M devices
      timeout: cdk.Duration.minutes(15),
      environment: {
        DEVICE_TABLE_NAME: deviceTable.tableName,
        BUCKET_NAME: archiveBucket.bucketName,
        ENVIRONMENT: this.environmentSuffix
      },
      reservedConcurrentExecutions: 1000
    });

    // Lambda function for Kinesis republishing
    const kinesisRepublishLambda = new NodejsFunction(this, 'KinesisRepublishLambda', {
      functionName: `iot-kinesis-republish-${this.environmentSuffix}`,
      entry: path.join(__dirname, '../lambda/kinesis-republish.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(15),
      environment: {
        KINESIS_STREAMS: JSON.stringify(kinesisStreams.map(s => s.streamName)),
        ENVIRONMENT: this.environmentSuffix
      },
      reservedConcurrentExecutions: 1000
    });

    // Lambda function for DynamoDB validation
    const dynamodbValidationLambda = new NodejsFunction(this, 'DynamoDBValidationLambda', {
      functionName: `iot-dynamodb-validation-${this.environmentSuffix}`,
      entry: path.join(__dirname, '../lambda/dynamodb-validation.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(5),
      environment: {
        VALIDATION_TABLE_NAME: validationTable.tableName,
        DEVICE_TABLE_NAME: deviceTable.tableName,
        ENVIRONMENT: this.environmentSuffix
      }
    });

    // Grant permissions
    deviceTable.grantReadWriteData(shadowAnalysisLambda);
    archiveBucket.grantRead(shadowAnalysisLambda);
    archiveBucket.grantRead(kinesisRepublishLambda);
    kinesisStreams.forEach(stream => stream.grantWrite(kinesisRepublishLambda));
    validationTable.grantReadWriteData(dynamodbValidationLambda);
    deviceTable.grantReadData(dynamodbValidationLambda);

    // IAM role for IoT shadow access
    shadowAnalysisLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iot:GetThingShadow', 'iot:ListThings'],
      resources: ['*']
    }));

    // IAM role for CloudWatch metrics access
    dynamodbValidationLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics'
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
      lambdaFunction: dynamodbValidationLambda,
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
      stateMachineName: `iot-recovery-orchestration-${this.environmentSuffix}`,
      definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.hours(2),
      removalPolicy: this.environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // EventBridge rules for routing recovery events
    const eventBus = new events.EventBus(this, 'RecoveryEventBus', {
      eventBusName: `iot-recovery-events-${this.environmentSuffix}`
    });

    deviceTypes.forEach(type => {
      new events.Rule(this, `${type}RecoveryRule`, {
        ruleName: `iot-recovery-${this.environmentSuffix}-${type}`,
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
      alarmName: `iot-rule-failures-${this.environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/IoT',
        metricName: 'RuleMessageThrottled',
        dimensionsMap: {
          RuleName: '*'
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1) // 1-minute detection window
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
      functionName: `iot-trigger-recovery-${this.environmentSuffix}`,
      entry: path.join(__dirname, '../lambda/trigger-recovery.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        ENVIRONMENT: this.environmentSuffix
      }
    });

    stateMachine.grantStartExecution(triggerStateMachineLambda);

    // CloudWatch Dashboard for monitoring
    new cloudwatch.Dashboard(this, 'RecoveryDashboard', {
      dashboardName: `iot-recovery-monitoring-${this.environmentSuffix}`,
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