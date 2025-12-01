### Reasoning Trace
---

This is a complex request for a CDK TypeScript program for a distributed task processing system. Let me break down the requirements:

1. **Primary Region**: us-east-1
2. **DynamoDB Global Table**: Replicate to us-west-2
3. **SQS Queue**:
   - 300-second visibility timeout
   - 14-day retention
   - Server-side encryption with customer-managed KMS key
   - Dead-letter queue with maxReceiveCount of 3
4. **DynamoDB**:
   - On-demand billing
   - Global secondary index for task status tracking
   - PITR enabled
   - Contributor Insights enabled
   - TTL for distributed lock expiration
5. **Lambda Functions**:
   - ARM-based Graviton2 processors
   - Reserved concurrency of 50
   - Environment variables from SSM Parameter Store
   - Lambda destinations for success/failure using SNS topics
6. **EventBridge Rules**:
   - Trigger on S3 upload events from multiple buckets
   - Input transformers to normalize event formats
7. **Distributed Locking**: Via DynamoDB conditional writes
8. **CloudWatch Alarms**: For DLQs exceeding 10 messages
9. **Dashboard**: Queue depth, Lambda metrics, DynamoDB usage
10. **VPC Endpoints**: For private communication
11. **Tagging**: Project=DistributedTaskSystem, Owner=SiddhantRaj, Environment=Production
12. **Output**: Single CDK v2 TypeScript stack named TapStack

Let me create a comprehensive CDK stack that includes all these requirements.
### Answer 
---

Here's a comprehensive CDK TypeScript program for your fault-tolerant distributed task processing system:

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
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Project: 'DistributedTaskSystem',
      Owner: 'SiddhantRaj',
      Environment: 'Production'
    };

    // Apply tags to the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'TaskSystemKMSKey', {
      description: 'Customer managed key for task processing system',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create VPC for private communication
    const vpc = new ec2.Vpc(this, 'TaskSystemVPC', {
      maxAzs: 3,
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
        }
      ]
    });

    // Create VPC endpoints for private communication
    vpc.addInterfaceEndpoint('DynamoDBEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.DYNAMODB,
      privateDnsEnabled: true,
    });

    vpc.addInterfaceEndpoint('SQSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
      privateDnsEnabled: true,
    });

    vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      privateDnsEnabled: true,
    });

    vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      privateDnsEnabled: true,
    });

    // Create dead letter queue
    const dlq = new sqs.Queue(this, 'TaskDLQ', {
      queueName: 'distributed-task-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
    });

    // Create main task queue
    const taskQueue = new sqs.Queue(this, 'TaskQueue', {
      queueName: 'distributed-task-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Create DynamoDB global table with replication to us-west-2
    const taskTable = new dynamodb.Table(this, 'TaskTable', {
      tableName: 'distributed-task-table',
      partitionKey: {
        name: 'taskId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      contributorInsightsEnabled: true,
      timeToLiveAttribute: 'ttl',
      replicationRegions: ['us-west-2'],
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add global secondary index for task status tracking
    taskTable.addGlobalSecondaryIndex({
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
    });

    // Create distributed lock table
    const lockTable = new dynamodb.Table(this, 'LockTable', {
      tableName: 'distributed-lock-table',
      partitionKey: {
        name: 'lockId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      replicationRegions: ['us-west-2'],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create SNS topics for Lambda destinations
    const successTopic = new sns.Topic(this, 'TaskSuccessTopic', {
      displayName: 'Task Processing Success',
      masterKey: kmsKey,
    });

    const failureTopic = new sns.Topic(this, 'TaskFailureTopic', {
      displayName: 'Task Processing Failure',
      masterKey: kmsKey,
    });

    // Store configuration in SSM Parameter Store
    const queueUrlParameter = new ssm.StringParameter(this, 'QueueUrlParameter', {
      parameterName: '/distributed-task-system/queue-url',
      stringValue: taskQueue.queueUrl,
      description: 'Task queue URL',
    });

    const tableNameParameter = new ssm.StringParameter(this, 'TableNameParameter', {
      parameterName: '/distributed-task-system/table-name',
      stringValue: taskTable.tableName,
      description: 'Task table name',
    });

    const lockTableNameParameter = new ssm.StringParameter(this, 'LockTableNameParameter', {
      parameterName: '/distributed-task-system/lock-table-name',
      stringValue: lockTable.tableName,
      description: 'Lock table name',
    });

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'TaskProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant permissions to Lambda role
    taskQueue.grantConsumeMessages(lambdaRole);
    taskTable.grantReadWriteData(lambdaRole);
    lockTable.grantReadWriteData(lambdaRole);
    successTopic.grantPublish(lambdaRole);
    failureTopic.grantPublish(lambdaRole);
    kmsKey.grantDecrypt(lambdaRole);

    // Grant SSM parameter read permissions
    queueUrlParameter.grantRead(lambdaRole);
    tableNameParameter.grantRead(lambdaRole);
    lockTableNameParameter.grantRead(lambdaRole);

    // Create Lambda function for task processing
    const taskProcessor = new NodejsFunction(this, 'TaskProcessor', {
      functionName: 'distributed-task-processor',
      entry: path.join(__dirname, 'lambda/task-processor.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      reservedConcurrentExecutions: 50,
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        QUEUE_URL_PARAM: queueUrlParameter.parameterName,
        TABLE_NAME_PARAM: tableNameParameter.parameterName,
        LOCK_TABLE_NAME_PARAM: lockTableNameParameter.parameterName,
        SUCCESS_TOPIC_ARN: successTopic.topicArn,
        FAILURE_TOPIC_ARN: failureTopic.topicArn,
      },
      onSuccess: new destinations.SnsDestination(successTopic),
      onFailure: new destinations.SnsDestination(failureTopic),
      deadLetterQueueEnabled: true,
      deadLetterQueue: dlq,
    });

    // Create SQS event source for Lambda
    taskProcessor.addEventSource(new lambda.EventSourceMapping(this, 'SQSEventSource', {
      eventSourceArn: taskQueue.queueArn,
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }));

    // Create S3 buckets for EventBridge integration
    const bucket1 = new s3.Bucket(this, 'TaskBucket1', {
      bucketName: `task-bucket-1-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const bucket2 = new s3.Bucket(this, 'TaskBucket2', {
      bucketName: `task-bucket-2-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create EventBridge rule for S3 uploads
    const uploadRule = new events.Rule(this, 'S3UploadRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [bucket1.bucketName, bucket2.bucketName],
          },
        },
      },
    });

    // Add target with input transformer
    uploadRule.addTarget(new targets.SqsQueue(taskQueue, {
      messageGroupId: 'task-processing',
      message: events.RuleTargetInput.fromObject({
        taskId: events.EventField.fromPath('$.id'),
        bucketName: events.EventField.fromPath('$.detail.bucket.name'),
        objectKey: events.EventField.fromPath('$.detail.object.key'),
        timestamp: events.EventField.time,
        eventType: 's3-upload',
      }),
    }));

    // Create CloudWatch alarm for DLQ
    new cloudwatch.Alarm(this, 'DLQAlarm', {
      alarmName: 'distributed-task-dlq-alarm',
      alarmDescription: 'Alarm when DLQ has more than 10 messages',
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TaskSystemDashboard', {
      dashboardName: 'distributed-task-system-dashboard',
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Queue Depth',
            left: [
              taskQueue.metricApproximateNumberOfMessagesVisible({ label: 'Messages Visible' }),
              taskQueue.metricApproximateNumberOfMessagesNotVisible({ label: 'Messages In Flight' }),
            ],
            right: [
              dlq.metricApproximateNumberOfMessagesVisible({ label: 'DLQ Messages' }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Metrics',
            left: [
              taskProcessor.metricInvocations({ label: 'Invocations' }),
              taskProcessor.metricErrors({ label: 'Errors' }),
            ],
            right: [
              taskProcessor.metricDuration({ label: 'Duration', statistic: 'Average' }),
              taskProcessor.metricConcurrentExecutions({ label: 'Concurrent Executions' }),
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
                  TableName: taskTable.tableName,
                },
                label: 'Task Table Read',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedWriteCapacityUnits',
                dimensionsMap: {
                  TableName: taskTable.tableName,
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
                  TableName: taskTable.tableName,
                },
                label: 'Task Table Throttles',
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ThrottledRequests',
                dimensionsMap: {
                  TableName: lockTable.tableName,
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

    // Outputs
    new cdk.CfnOutput(this, 'TaskQueueUrl', {
      value: taskQueue.queueUrl,
      description: 'URL of the task queue',
    });

    new cdk.CfnOutput(this, 'TaskTableName', {
      value: taskTable.tableName,
      description: 'Name of the task table',
    });

    new cdk.CfnOutput(this, 'LockTableName', {
      value: lockTable.tableName,
      description: 'Name of the lock table',
    });

    new cdk.CfnOutput(this, 'SuccessTopicArn', {
      value: successTopic.topicArn,
      description: 'ARN of the success topic',
    });

    new cdk.CfnOutput(this, 'FailureTopicArn', {
      value: failureTopic.topicArn,
      description: 'ARN of the failure topic',
    });
  }
}

// Example Lambda function code (lambda/task-processor.ts)
const lambdaCode = `
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

let tableName: string;
let lockTableName: string;

async function initializeParameters(): Promise<void> {
  if (!tableName) {
    const tableParam = await ssmClient.send(
      new GetParameterCommand({ Name: process.env.TABLE_NAME_PARAM! })
    );
    tableName = tableParam.Parameter!.Value!;
  }
  
  if (!lockTableName) {
    const lockParam = await ssmClient.send(
      new GetParameterCommand({ Name: process.env.LOCK_TABLE_NAME_PARAM! })
    );
    lockTableName = lockParam.Parameter!.Value!;
  }
}

async function acquireLock(lockId: string, owner: string, ttlSeconds: number = 30): Promise<boolean> {
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
      ConditionExpression: 'attribute_not_exists(lockId) OR ttl < :now',
      ExpressionAttributeValues: {
        ':now': { N: Math.floor(Date.now() / 1000).toString() }
      }
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw error;
  }
}

async function releaseLock(lockId: string, owner: string): Promise<void> {
  await dynamoClient.send(new UpdateItemCommand({
    TableName: lockTableName,
    Key: {
      lockId: { S: lockId }
    },
    UpdateExpression: 'SET #ttl = :ttl',
    ConditionExpression: '#owner = :owner',
    ExpressionAttributeNames: {
      '#ttl': 'ttl',
      '#owner': 'owner'
    },
    ExpressionAttributeValues: {
      ':ttl': { N: '0' },
      ':owner': { S: owner }
    }
  }));
}

async function processTask(record: SQSRecord): Promise<void> {
  const body = JSON.parse(record.body);
  const taskId = body.taskId || record.messageId;
  const lockId = \`task-\${taskId}\`;
  const owner = \`lambda-\${context.requestId}\`;
  
  // Try to acquire distributed lock
  const lockAcquired = await acquireLock(lockId, owner);
  if (!lockAcquired) {
    console.log(\`Lock not acquired for task \${taskId}, skipping...\`);
    return;
  }
  
  try {
    // Record task start
    await dynamoClient.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        taskId: { S: taskId },
        timestamp: { N: Date.now().toString() },
        status: { S: 'PROCESSING' },
        data: { S: JSON.stringify(body) },
        ttl: { N: (Math.floor(Date.now() / 1000) + 86400 * 30).toString() } // 30 days TTL
      }
    }));
    
    // Simulate task processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Update task status
    await dynamoClient.send(new UpdateItemCommand({
      TableName: tableName,
      Key: {
        taskId: { S: taskId },
        timestamp: { N: Date.now().toString() }
      },
      UpdateExpression: 'SET #status = :status, completedAt = :completedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': { S: 'COMPLETED' },
        ':completedAt': { N: Date.now().toString() }
      }
    }));
    
    // Send success notification
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SUCCESS_TOPIC_ARN,
      Message: JSON.stringify({
        taskId,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      })
    }));
    
  } finally {
    // Always release the lock
    await releaseLock(lockId, owner);
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  await initializeParameters();
  
  const promises = event.Records.map(record => 
    processTask(record).catch(error => {
      console.error(\`Error processing task: \${error}\`);
      throw error;
    })
  );
  
  await Promise.all(promises);
};
`;
```

## Additional Files Needed

### 1. `app.ts` - CDK App Entry Point
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Distributed task processing system with cross-region replication',
});

app.synth();
```

### 2. `package.json`
```json
{
  "name": "distributed-task-system",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy": "cdk deploy --all --require-approval never"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "aws-cdk": "^2.100.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-ssm": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0",
    "@types/aws-lambda": "^8.10.0",
    "esbuild": "^0.19.0"
  }
}
```

### 3. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## Deployment Instructions

1. **Install Dependencies**:
```bash
npm install
```

2. **Bootstrap CDK** (if not already done):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-west-2
```

3. **Deploy the Stack**:
```bash
cdk deploy TapStack
```

## Key Architecture Features

1. **Fault Tolerance**:
   - Multi-region DynamoDB global tables
   - Dead letter queues with retry logic
   - Distributed locking prevents duplicate processing
   - Lambda destinations for reliable notifications

2. **Performance**:
   - ARM-based Graviton2 processors for cost efficiency
   - Reserved concurrency prevents throttling
   - VPC endpoints for private communication
   - On-demand DynamoDB scaling

3. **Monitoring**:
   - CloudWatch dashboard with key metrics
   - DLQ alarms for failed messages
   - Contributor Insights for DynamoDB analysis
   - Lambda destinations track success/failure

4. **Security**:
   - Customer-managed KMS keys for encryption
   - VPC isolation with private subnets
   - IAM least-privilege access
   - SSM Parameter Store for configuration

The system guarantees at-least-once processing through SQS visibility timeout and conditional DynamoDB writes for distributed locking, ensuring no duplicate processing even in a distributed environment.