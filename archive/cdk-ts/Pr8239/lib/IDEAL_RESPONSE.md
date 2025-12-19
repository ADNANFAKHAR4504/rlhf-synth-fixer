# TapStack - Optimized Serverless Transaction Processing System

Complete CDK ts implementation for optimizing serverless transaction processing infrastructure.

## bin/tap.ts

```ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

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

    // Naming prefix: {environment}-{service}-{component}
    const namingPrefix = `prod-transaction-${environmentSuffix}`;

    //  VPC and VPC Endpoints for cost optimization
    const vpc = new ec2.Vpc(this, 'OptimizedVpc', {
      vpcName: `${namingPrefix}-vpc`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // VPC endpoints to reduce data transfer costs
    vpc.addInterfaceEndpoint('DynamoDbEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.DYNAMODB,
      privateDnsEnabled: false, // DynamoDB endpoint does not support private DNS
    });

    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    //  SNS Topic for alerting
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${namingPrefix}-alerts`,
      displayName: 'Transaction System Alerts',
    });

    alertTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('prakhar.j@turing.com')
    );

    //  S3 Bucket with lifecycle policies
    const transactionLogsBucket = new s3.Bucket(this, 'TransactionLogs', {
      bucketName: `${namingPrefix}-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'transition-to-glacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          expiration: cdk.Duration.days(7 * 365), // 7 years for compliance
        },
        {
          id: 'cleanup-incomplete-multipart',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //  DynamoDB Tables with optimized configuration
    const transactionTable = new dynamodb.Table(this, 'TransactionTable', {
      tableName: `${namingPrefix}-transactions`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 10,
      writeCapacity: 10,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Configure autoscaling for DynamoDB
    const readScaling = transactionTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 500,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const writeScaling = transactionTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 500,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Add GSI to eliminate scan operations
    transactionTable.addGlobalSecondaryIndex({
      indexName: 'userId-timestamp-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 5,
      writeCapacity: 5,
    });

    transactionTable.addGlobalSecondaryIndex({
      indexName: 'status-timestamp-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
      readCapacity: 5,
      writeCapacity: 5,
    });

    //  SQS Queues for batch processing
    const dlq = new sqs.Queue(this, 'TransactionDLQ', {
      queueName: `${namingPrefix}-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const batchQueue = new sqs.Queue(this, 'BatchProcessingQueue', {
      queueName: `${namingPrefix}-batch`,
      visibilityTimeout: cdk.Duration.seconds(300),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    //  Lambda Layer for shared dependencies (optional - only if directory exists)
    const lambdaLayerPath = path.join(__dirname, '..', 'lambda-layer');
    let sharedLayer: lambda.ILayerVersion | undefined;

    if (fs.existsSync(lambdaLayerPath)) {
      sharedLayer = new lambda.LayerVersion(this, 'SharedDependencies', {
        layerVersionName: `${namingPrefix}-shared`,
        code: lambda.Code.fromAsset(lambdaLayerPath),
        compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
        compatibleArchitectures: [lambda.Architecture.ARM_64],
        description: 'Shared dependencies for transaction processing',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    //  Real-time processing Lambda (optimized)
    const realtimeLambda = new lambda.Function(this, 'RealtimeProcessor', {
      functionName: `${namingPrefix}-realtime`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const ddb = new AWS.DynamoDB.DocumentClient();
        
        exports.handler = async (event) => {
          const transaction = JSON.parse(event.body);
          
          try {
            await ddb.put({
              TableName: process.env.TABLE_NAME,
              Item: {
                transactionId: transaction.id,
                timestamp: Date.now(),
                userId: transaction.userId,
                status: 'processed',
                ...transaction
              }
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ success: true })
            };
          } catch (error) {
            console.error('Error processing transaction:', error);
            throw error;
          }
        };
      `),
      memorySize: 768,
      timeout: cdk.Duration.seconds(10),
      reservedConcurrentExecutions: 100,
      environment: {
        TABLE_NAME: transactionTable.tableName,
        QUEUE_URL: batchQueue.queueUrl,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      layers: sharedLayer ? [sharedLayer] : undefined,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    //  Batch processing Lambda (optimized)
    const batchLambda = new lambda.Function(this, 'BatchProcessor', {
      functionName: `${namingPrefix}-batch`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const ddb = new AWS.DynamoDB.DocumentClient();
        const s3 = new AWS.S3();
        
        exports.handler = async (event) => {
          const batchPromises = event.Records.map(async (record) => {
            const transaction = JSON.parse(record.body);
            
            try {
              await ddb.put({
                TableName: process.env.TABLE_NAME,
                Item: {
                  transactionId: transaction.id,
                  timestamp: Date.now(),
                  userId: transaction.userId,
                  status: 'batch-processed',
                  ...transaction
                }
              }).promise();
              
              await s3.putObject({
                Bucket: process.env.LOG_BUCKET,
                Key: \`transactions/\${new Date().toISOString().split('T')[0]}/\${transaction.id}.json\`,
                Body: JSON.stringify(transaction),
                ServerSideEncryption: 'AES256'
              }).promise();
              
            } catch (error) {
              console.error('Error in batch processing:', error);
              throw error;
            }
          });
          
          await Promise.all(batchPromises);
          return { batchItemFailures: [] };
        };
      `),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(300),
      reservedConcurrentExecutions: 50,
      environment: {
        TABLE_NAME: transactionTable.tableName,
        LOG_BUCKET: transactionLogsBucket.bucketName,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      layers: sharedLayer ? [sharedLayer] : undefined,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Configure SQS event source for batch processing
    batchLambda.addEventSource(
      new lambda_event_sources.SqsEventSource(batchQueue, {
        batchSize: 25,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    //  IAM Permissions (least privilege)
    transactionTable.grantReadWriteData(realtimeLambda);
    transactionTable.grantReadWriteData(batchLambda);
    batchQueue.grantSendMessages(realtimeLambda);
    batchQueue.grantConsumeMessages(batchLambda);
    transactionLogsBucket.grantWrite(batchLambda);

    //  CloudWatch Logs role for API Gateway (required for logging)
    const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // Set the CloudWatch role for API Gateway account settings
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });

    //  API Gateway
    const api = new apigateway.RestApi(this, 'TransactionAPI', {
      restApiName: `${namingPrefix}-api`,
      description: 'Transaction processing API',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Real-time endpoint
    const realtimeResource = api.root.addResource('realtime');
    realtimeResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(realtimeLambda, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      })
    );

    // Async endpoint (routes to SQS via Lambda)
    const asyncResource = api.root.addResource('async');
    asyncResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(realtimeLambda, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      })
    );

    //  CloudWatch Alarms
    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `${namingPrefix}-lambda-duration`,
      metric: realtimeLambda.metricDuration({
        statistic: 'p99',
      }),
      threshold: 1000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${namingPrefix}-lambda-errors`,
      metric: realtimeLambda.metricErrors(),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'DynamoDBThrottleAlarm', {
      alarmName: `${namingPrefix}-dynamodb-throttles`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'UserErrors',
        dimensionsMap: {
          TableName: transactionTable.tableName,
        },
      }),
      threshold: 5,
      evaluationPeriods: 2,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `${namingPrefix}-dlq-messages`,
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    //  Cost Budget and Alarm
    new budgets.CfnBudget(this, 'MonthlyCostBudget', {
      budget: {
        budgetName: `${namingPrefix}-monthly-budget`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 20000,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'finance@example.com',
            },
          ],
        },
      ],
    });

    //  CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'OptimizationDashboard', {
      dashboardName: `${namingPrefix}-performance`,
      defaultInterval: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda P50/P90/P99 Latency',
        left: [
          realtimeLambda.metricDuration({ statistic: 'p50' }),
          realtimeLambda.metricDuration({ statistic: 'p90' }),
          realtimeLambda.metricDuration({ statistic: 'p99' }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: { TableName: transactionTable.tableName },
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: { TableName: transactionTable.tableName },
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations and Errors',
        left: [
          realtimeLambda.metricInvocations(),
          batchLambda.metricInvocations(),
        ],
        right: [realtimeLambda.metricErrors(), batchLambda.metricErrors()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Metrics',
        left: [
          batchQueue.metricApproximateNumberOfMessagesVisible(),
          batchQueue.metricApproximateAgeOfOldestMessage(),
        ],
        right: [dlq.metricApproximateNumberOfMessagesVisible()],
        width: 12,
        height: 6,
      })
    );

    //  Custom Metrics for before/after comparison
    const metricNamespace = `${namingPrefix}/Performance`;

    new logs.MetricFilter(this, 'TransactionLatencyMetric', {
      logGroup: realtimeLambda.logGroup,
      metricNamespace,
      metricName: 'TransactionLatency',
      filterPattern: logs.FilterPattern.literal(
        '[time, request_id, latency_ms]'
      ),
      metricValue: '$latency_ms',
    });

    //  Stack Outputs
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${namingPrefix}-api-endpoint`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: transactionTable.tableName,
      description: 'DynamoDB table name',
      exportName: `${namingPrefix}-table`,
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    //  Resource tagging for cost allocation
    cdk.Tags.of(this).add('Component', 'optimization-stack');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(transactionTable).add('Component', 'database');
    cdk.Tags.of(realtimeLambda).add('Component', 'compute-realtime');
    cdk.Tags.of(batchLambda).add('Component', 'compute-batch');
    cdk.Tags.of(batchQueue).add('Component', 'messaging');
    cdk.Tags.of(transactionLogsBucket).add('Component', 'storage');
  }
}
```
