```typescript
import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly taskQueue: sqs.Queue;
  public readonly dlq: sqs.Queue;
  public readonly taskTable: dynamodb.TableV2;
  public readonly lockTable: dynamodb.TableV2;
  public readonly successTopic: sns.Topic;
  public readonly failureTopic: sns.Topic;
  public readonly taskProcessor: lambda.Function;
  public readonly kmsKey: kms.Key;
  public readonly vpc: ec2.Vpc;
  public readonly bucket1: s3.Bucket;
  public readonly bucket2: s3.Bucket;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const commonTags = {
      Project: 'DistributedTaskSystem',
      Owner: 'SiddhantRaj',
      Environment: 'Production',
    };

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    this.kmsKey = new kms.Key(this, 'TaskSystemKMSKey', {
      description: 'Customer managed key for task processing system',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alias: `alias/task-system-key-${environmentSuffix}`,
    });

    this.vpc = new ec2.Vpc(this, 'TaskSystemVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    this.vpc.addInterfaceEndpoint('SQSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.dlq = new sqs.Queue(this, 'TaskDLQ', {
      queueName: `distributed-task-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.taskQueue = new sqs.Queue(this, 'TaskQueue', {
      queueName: `distributed-task-queue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: this.kmsKey,
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.taskTable = new dynamodb.TableV2(this, 'TaskTable', {
      tableName: `distributed-task-table-${environmentSuffix}`,
      partitionKey: {
        name: 'taskId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecovery: true,
      contributorInsights: true,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      replicas: [
        {
          region: 'us-west-2',
          contributorInsights: true,
        },
      ],
      globalSecondaryIndexes: [
        {
          indexName: 'statusIndex',
          partitionKey: {
            name: 'status',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'timestamp',
            type: dynamodb.AttributeType.NUMBER,
          },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    this.lockTable = new dynamodb.TableV2(this, 'LockTable', {
      tableName: `distributed-lock-table-${environmentSuffix}`,
      partitionKey: {
        name: 'lockId',
        type: dynamodb.AttributeType.STRING,
      },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      replicas: [
        {
          region: 'us-west-2',
        },
      ],
    });

    this.successTopic = new sns.Topic(this, 'TaskSuccessTopic', {
      topicName: `task-success-${environmentSuffix}`,
      displayName: 'Task Processing Success',
      masterKey: this.kmsKey,
    });

    this.failureTopic = new sns.Topic(this, 'TaskFailureTopic', {
      topicName: `task-failure-${environmentSuffix}`,
      displayName: 'Task Processing Failure',
      masterKey: this.kmsKey,
    });

    const queueUrlParameter = new ssm.StringParameter(
      this,
      'QueueUrlParameter',
      {
        parameterName: `/distributed-task-system/${environmentSuffix}/queue-url`,
        stringValue: this.taskQueue.queueUrl,
        description: 'Task queue URL',
      }
    );

    const tableNameParameter = new ssm.StringParameter(
      this,
      'TableNameParameter',
      {
        parameterName: `/distributed-task-system/${environmentSuffix}/table-name`,
        stringValue: this.taskTable.tableName,
        description: 'Task table name',
      }
    );

    const lockTableNameParameter = new ssm.StringParameter(
      this,
      'LockTableNameParameter',
      {
        parameterName: `/distributed-task-system/${environmentSuffix}/lock-table-name`,
        stringValue: this.lockTable.tableName,
        description: 'Lock table name',
      }
    );

    const lambdaRole = new iam.Role(this, 'TaskProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    this.taskQueue.grantConsumeMessages(lambdaRole);
    this.taskTable.grantReadWriteData(lambdaRole);
    this.lockTable.grantReadWriteData(lambdaRole);
    this.successTopic.grantPublish(lambdaRole);
    this.failureTopic.grantPublish(lambdaRole);
    this.kmsKey.grantEncryptDecrypt(lambdaRole);

    queueUrlParameter.grantRead(lambdaRole);
    tableNameParameter.grantRead(lambdaRole);
    lockTableNameParameter.grantRead(lambdaRole);

    const taskProcessorCode = `
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

let tableName = null;
let lockTableName = null;

async function initializeParameters() {
  if (!tableName) {
    const tableParam = await ssmClient.send(
      new GetParameterCommand({ Name: process.env.TABLE_NAME_PARAM })
    );
    tableName = tableParam.Parameter.Value;
  }
  
  if (!lockTableName) {
    const lockParam = await ssmClient.send(
      new GetParameterCommand({ Name: process.env.LOCK_TABLE_NAME_PARAM })
    );
    lockTableName = lockParam.Parameter.Value;
  }
}

async function acquireLock(lockId, owner, ttlSeconds = 30) {
  const ttl = Math.floor(Date.now() / 1000) + ttlSeconds;
  
  try {
    await dynamoClient.send(new PutItemCommand({
      TableName: lockTableName,
      Item: {
        lockId: { S: lockId },
        owner: { S: owner },
        ttl: { N: ttl.toString() },
        acquiredAt: { N: Date.now().toString() }
      },
      ConditionExpression: 'attribute_not_exists(lockId) OR #ttl < :now',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':now': { N: Math.floor(Date.now() / 1000).toString() }
      }
    }));
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw error;
  }
}

async function releaseLock(lockId, owner) {
  try {
    await dynamoClient.send(new UpdateItemCommand({
      TableName: lockTableName,
      Key: { lockId: { S: lockId } },
      UpdateExpression: 'SET #ttl = :ttl',
      ConditionExpression: '#owner = :owner',
      ExpressionAttributeNames: { '#ttl': 'ttl', '#owner': 'owner' },
      ExpressionAttributeValues: {
        ':ttl': { N: '0' },
        ':owner': { S: owner }
      }
    }));
  } catch (error) {
    console.log('Failed to release lock:', error.message);
  }
}

async function processRecord(record, context) {
  const body = JSON.parse(record.body);
  const taskId = body.taskId || record.messageId;
  const lockId = 'task-' + taskId;
  const owner = 'lambda-' + context.awsRequestId;
  const timestamp = Date.now();
  
  const lockAcquired = await acquireLock(lockId, owner);
  if (!lockAcquired) {
    console.log('Lock not acquired for task ' + taskId + ', skipping...');
    return { taskId, status: 'SKIPPED' };
  }
  
  try {
    await dynamoClient.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        taskId: { S: taskId },
        timestamp: { N: timestamp.toString() },
        status: { S: 'PROCESSING' },
        data: { S: JSON.stringify(body) },
        ttl: { N: (Math.floor(Date.now() / 1000) + 86400 * 30).toString() }
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await dynamoClient.send(new UpdateItemCommand({
      TableName: tableName,
      Key: {
        taskId: { S: taskId },
        timestamp: { N: timestamp.toString() }
      },
      UpdateExpression: 'SET #status = :status, completedAt = :completedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': { S: 'COMPLETED' },
        ':completedAt': { N: Date.now().toString() }
      }
    }));
    
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SUCCESS_TOPIC_ARN,
      Message: JSON.stringify({ taskId, status: 'COMPLETED', timestamp: new Date().toISOString() })
    }));
    
    return { taskId, status: 'COMPLETED' };
  } finally {
    await releaseLock(lockId, owner);
  }
}

exports.handler = async (event, context) => {
  await initializeParameters();
  
  const results = await Promise.allSettled(
    event.Records.map(record => processRecord(record, context))
  );
  
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error('Failed records:', failures.map(f => f.reason));
    throw new Error('Some records failed to process');
  }
  
  return { processed: results.length };
};
`;

    this.taskProcessor = new lambda.Function(this, 'TaskProcessor', {
      functionName: `distributed-task-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(taskProcessorCode),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      // Note: reservedConcurrentExecutions removed for test environment compatibility
      // In production, set reservedConcurrentExecutions: 50
      role: lambdaRole,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        QUEUE_URL_PARAM: queueUrlParameter.parameterName,
        TABLE_NAME_PARAM: tableNameParameter.parameterName,
        LOCK_TABLE_NAME_PARAM: lockTableNameParameter.parameterName,
        SUCCESS_TOPIC_ARN: this.successTopic.topicArn,
        FAILURE_TOPIC_ARN: this.failureTopic.topicArn,
      },
      onSuccess: new destinations.SnsDestination(this.successTopic),
      onFailure: new destinations.SnsDestination(this.failureTopic),
    });

    this.taskProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(this.taskQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    this.bucket1 = new s3.Bucket(this, 'TaskBucket1', {
      bucketName: `task-bucket-1-${this.account}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      eventBridgeEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    this.bucket2 = new s3.Bucket(this, 'TaskBucket2', {
      bucketName: `task-bucket-2-${this.account}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      eventBridgeEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    this.kmsKey.grantEncryptDecrypt(
      new iam.ServicePrincipal('s3.amazonaws.com')
    );

    const uploadRule = new events.Rule(this, 'S3UploadRule', {
      ruleName: `s3-upload-rule-${environmentSuffix}`,
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [this.bucket1.bucketName, this.bucket2.bucketName],
          },
        },
      },
    });

    uploadRule.addTarget(
      new targets.SqsQueue(this.taskQueue, {
        message: events.RuleTargetInput.fromObject({
          taskId: events.EventField.fromPath('$.id'),
          bucketName: events.EventField.fromPath('$.detail.bucket.name'),
          objectKey: events.EventField.fromPath('$.detail.object.key'),
          timestamp: events.EventField.time,
          eventType: 's3-upload',
        }),
      })
    );

    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
      alarmName: `distributed-task-dlq-alarm-${environmentSuffix}`,
      alarmDescription: 'Alarm when DLQ has more than 10 messages',
      metric: this.dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Dashboard(this, 'TaskSystemDashboard', {
      dashboardName: `distributed-task-system-dashboard-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Queue Depth',
            left: [
              this.taskQueue.metricApproximateNumberOfMessagesVisible({
                label: 'Messages Visible',
              }),
              this.taskQueue.metricApproximateNumberOfMessagesNotVisible({
                label: 'Messages In Flight',
              }),
            ],
            right: [
              this.dlq.metricApproximateNumberOfMessagesVisible({
                label: 'DLQ Messages',
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Metrics',
            left: [
              this.taskProcessor.metricInvocations({ label: 'Invocations' }),
              this.taskProcessor.metricErrors({ label: 'Errors' }),
            ],
            right: [
              this.taskProcessor.metricDuration({
                label: 'Duration',
                statistic: 'Average',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'ConcurrentExecutions',
                dimensionsMap: {
                  FunctionName: this.taskProcessor.functionName,
                },
                label: 'Concurrent Executions',
                statistic: 'Maximum',
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Read/Write Capacity',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: {
                  TableName: this.taskTable.tableName,
                },
                label: 'Task Table Read',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: {
                  TableName: this.taskTable.tableName,
                },
                label: 'Task Table Write',
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Throttles',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ThrottledRequests',
                dimensionsMap: {
                  TableName: this.taskTable.tableName,
                },
                label: 'Task Table Throttles',
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ThrottledRequests',
                dimensionsMap: {
                  TableName: this.lockTable.tableName,
                },
                label: 'Lock Table Throttles',
                statistic: 'Sum',
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    new cdk.CfnOutput(this, 'TaskQueueUrl', {
      value: this.taskQueue.queueUrl,
      description: 'URL of the task queue',
      exportName: `TaskQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TaskQueueArn', {
      value: this.taskQueue.queueArn,
      description: 'ARN of the task queue',
      exportName: `TaskQueueArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: this.dlq.queueUrl,
      description: 'URL of the dead letter queue',
      exportName: `DLQUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TaskTableName', {
      value: this.taskTable.tableName,
      description: 'Name of the task table',
      exportName: `TaskTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LockTableName', {
      value: this.lockTable.tableName,
      description: 'Name of the lock table',
      exportName: `LockTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SuccessTopicArn', {
      value: this.successTopic.topicArn,
      description: 'ARN of the success topic',
      exportName: `SuccessTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FailureTopicArn', {
      value: this.failureTopic.topicArn,
      description: 'ARN of the failure topic',
      exportName: `FailureTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TaskProcessorArn', {
      value: this.taskProcessor.functionArn,
      description: 'ARN of the task processor Lambda',
      exportName: `TaskProcessorArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Bucket1Name', {
      value: this.bucket1.bucketName,
      description: 'Name of bucket 1',
      exportName: `Bucket1Name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Bucket2Name', {
      value: this.bucket2.bucketName,
      description: 'Name of bucket 2',
      exportName: `Bucket2Name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DLQAlarmArn', {
      value: dlqAlarm.alarmArn,
      description: 'ARN of the DLQ alarm',
      exportName: `DLQAlarmArn-${environmentSuffix}`,
    });
  }
}
```
