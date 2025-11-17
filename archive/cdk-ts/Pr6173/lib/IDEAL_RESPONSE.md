### Answer
---

```ts
// bin/tap.ts
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

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

```ts
// lib/tap-stack.ts
import { Construct } from 'constructs';
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
  Tags,
} from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

interface TapStackProps extends StackProps {
  environmentSuffix?: string;
}

export class TapStack extends Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const region = this.region;

    // 🔹 VPC with endpoints for DynamoDB and SQS
    const vpc = new ec2.Vpc(this, 'TransactionVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Endpoint for DynamoDB
    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // VPC Endpoint for SQS
    vpc.addInterfaceEndpoint('SQSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // 🔹 SNS Topic for CloudWatch Alarms
    const alarmTopic = new sns.Topic(this, 'TransactionAlarmTopic', {
      displayName: `Transaction Processing Alarms - ${region} - ${environmentSuffix}`,
      topicName: `txn-processing-alarms-${region}-${environmentSuffix}`,
    });
    alarmTopic.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // 🔹 DynamoDB Global Table
    const transactionTable = new dynamodb.Table(this, 'TransactionTable', {
      tableName: `GlobalTransactionTable-${environmentSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 🔹 Dead Letter Queues
    const transactionDLQ = new sqs.Queue(this, 'TransactionDLQ', {
      queueName: `transaction-dlq-${region}-${environmentSuffix}.fifo`,
      fifo: true,
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.seconds(300),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 🔹 SQS FIFO Queue for transaction processing
    const transactionQueue = new sqs.Queue(this, 'TransactionQueue', {
      queueName: `transaction-processing-${region}-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      visibilityTimeout: Duration.seconds(300),
      retentionPeriod: Duration.days(7),
      deadLetterQueue: {
        queue: transactionDLQ,
        maxReceiveCount: 3,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 🔹 Transaction Processor Lambda
    const processorRole = new iam.Role(this, 'ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        ProcessorPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
              ],
              resources: [
                transactionTable.tableArn,
                `${transactionTable.tableArn}/index/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              resources: [transactionQueue.queueArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const processorLogGroup = new logs.LogGroup(this, 'ProcessorLogGroup', {
      logGroupName: `/aws/lambda/transaction-processor-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const transactionProcessor = new lambda.Function(
      this,
      'TransactionProcessor',
      {
        functionName: `transaction-processor-${region}-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const AWS = require('aws-sdk');
          const ddb = new AWS.DynamoDB.DocumentClient();
          const eventBridge = new AWS.EventBridge();
          
          exports.handler = async (event) => {
            console.log('Processing transactions:', JSON.stringify(event));
            
            for (const record of event.Records) {
              const body = JSON.parse(record.body);
              const transactionId = body.transactionId;
              const timestamp = Date.now();
              
              // Idempotency check using messageId
              const idempotencyToken = record.messageId;
              
              try {
                // Write to DynamoDB with idempotency
                await ddb.put({
                  TableName: process.env.TABLE_NAME,
                  Item: {
                    transactionId,
                    timestamp,
                    data: body,
                    idempotencyToken,
                    processedAt: new Date().toISOString(),
                    region: process.env.AWS_REGION
                  },
                  ConditionExpression: 'attribute_not_exists(transactionId) OR idempotencyToken <> :token',
                  ExpressionAttributeValues: {
                    ':token': idempotencyToken
                  }
                }).promise().catch(err => {
                  if (err.code === 'ConditionalCheckFailedException') {
                    console.log('Transaction already processed:', transactionId);
                    return;
                  }
                  throw err;
                });
                
                // Send to EventBridge
                await eventBridge.putEvents({
                  Entries: [{
                    Source: 'transaction.processor',
                    DetailType: 'TransactionProcessed',
                    Detail: JSON.stringify({
                      transactionId,
                      timestamp,
                      status: 'processed',
                      region: process.env.AWS_REGION
                    })
                  }]
                }).promise();
                
              } catch (error) {
                console.error('Error processing transaction:', error);
                throw error;
              }
            }
            
            return { statusCode: 200 };
          };
        `),
        timeout: Duration.seconds(60),
        memorySize: 1024,
        reservedConcurrentExecutions: 100,
        environment: {
          TABLE_NAME: transactionTable.tableName,
          EVENT_BUS_NAME: 'default',
        },
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        role: processorRole,
        logGroup: processorLogGroup,
      }
    );

    // Add SQS event source
    transactionProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(transactionQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      })
    );

    // 🔹 CDC Lambda for DynamoDB Streams
    const cdcRole = new iam.Role(this, 'CDCLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        CDCPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              resources: [`${transactionTable.tableArn}/stream/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const cdcLogGroup = new logs.LogGroup(this, 'CDCLogGroup', {
      logGroupName: `/aws/lambda/transaction-cdc-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const cdcProcessor = new lambda.Function(this, 'CDCProcessor', {
      functionName: `transaction-cdc-${region}-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const eventBridge = new AWS.EventBridge();
        
        exports.handler = async (event) => {
          console.log('CDC Event:', JSON.stringify(event));
          
          const entries = event.Records.map(record => ({
            Source: 'transaction.cdc',
            DetailType: record.eventName,
            Detail: JSON.stringify({
              keys: record.dynamodb.Keys,
              newImage: record.dynamodb.NewImage,
              oldImage: record.dynamodb.OldImage,
              sequenceNumber: record.dynamodb.SequenceNumber,
              region: process.env.AWS_REGION
            })
          }));
          
          if (entries.length > 0) {
            await eventBridge.putEvents({ Entries: entries }).promise();
          }
          
          return { statusCode: 200 };
        };
      `),
      timeout: Duration.seconds(60),
      memorySize: 512,
      environment: {
        EVENT_BUS_NAME: 'default',
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      role: cdcRole,
      logGroup: cdcLogGroup,
    });

    // Add DynamoDB stream trigger
    if (transactionTable.tableStreamArn) {
      cdcProcessor.addEventSource(
        new lambdaEventSources.DynamoEventSource(transactionTable, {
          startingPosition: lambda.StartingPosition.TRIM_HORIZON,
          batchSize: 100,
          maxBatchingWindow: Duration.seconds(5),
          bisectBatchOnError: true,
          retryAttempts: 3,
          reportBatchItemFailures: true,
        })
      );
    }

    // 🔹 Lambda Authorizer
    const authorizerLogGroup = new logs.LogGroup(this, 'AuthorizerLogGroup', {
      logGroupName: `/aws/lambda/api-authorizer-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const authorizer = new lambda.Function(this, 'ApiAuthorizer', {
      functionName: `api-authorizer-${region}-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Authorizer event:', JSON.stringify(event));
          
          const token = event.authorizationToken;
          
          // Simple token validation (replace with real logic)
          if (token && token.startsWith('Bearer ')) {
            return {
              principalId: 'user',
              policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                  Action: 'execute-api:Invoke',
                  Effect: 'Allow',
                  Resource: event.methodArn
                }]
              },
              context: {
                userId: 'authenticated-user'
              }
            };
          }
          
          throw new Error('Unauthorized');
        };
      `),
      timeout: Duration.seconds(10),
      memorySize: 256,
      logGroup: authorizerLogGroup,
    });

    // 🔹 API Handler Lambda
    const apiHandlerRole = new iam.Role(this, 'ApiHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        ApiHandlerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [transactionQueue.queueArn],
            }),
          ],
        }),
      },
    });

    const apiHandlerLogGroup = new logs.LogGroup(this, 'ApiHandlerLogGroup', {
      logGroupName: `/aws/lambda/api-handler-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      functionName: `api-handler-${region}-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sqs = new AWS.SQS();
        const crypto = require('crypto');
        
        exports.handler = async (event) => {
          console.log('API event:', JSON.stringify(event));
          
          const body = JSON.parse(event.body);
          const transactionId = body.transactionId || crypto.randomUUID();
          
          const messageBody = {
            ...body,
            transactionId,
            receivedAt: new Date().toISOString()
          };
          
          await sqs.sendMessage({
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(messageBody),
            MessageGroupId: body.accountId || 'default',
            MessageDeduplicationId: transactionId
          }).promise();
          
          return {
            statusCode: 202,
            headers: {
              'Content-Type': 'application/json',
              'X-Transaction-Id': transactionId
            },
            body: JSON.stringify({
              transactionId,
              status: 'accepted',
              region: process.env.AWS_REGION
            })
          };
        };
      `),
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: {
        QUEUE_URL: transactionQueue.queueUrl,
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      role: apiHandlerRole,
      logGroup: apiHandlerLogGroup,
    });

    // 🔹 API Gateway Setup
    const apiLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: `/aws/apigateway/transaction-api-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'TransactionApi', {
      restApiName: `transaction-api-${region}-${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 10000,
        throttlingRateLimit: 10000,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });
    api.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const lambdaAuthorizer = new apigateway.TokenAuthorizer(
      this,
      'LambdaAuthorizer',
      {
        handler: authorizer,
        resultsCacheTtl: Duration.minutes(5),
      }
    );

    const transactionsResource = api.root.addResource('transactions');
    transactionsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(apiHandler, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }),
      {
        authorizer: lambdaAuthorizer,
        apiKeyRequired: true,
      }
    );

    const plan = api.addUsagePlan('TransactionApiUsagePlan', {
      name: `transaction-api-plan-${region}-${environmentSuffix}`,
      throttle: {
        rateLimit: 10000,
        burstLimit: 10000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.DAY,
      },
    });

    const apiKey = api.addApiKey('TransactionApiKey', {
      apiKeyName: `transaction-api-key-${region}-${environmentSuffix}`,
    });
    apiKey.applyRemovalPolicy(RemovalPolicy.DESTROY);

    plan.addApiKey(apiKey);
    plan.addApiStage({
      stage: api.deploymentStage,
    });

    // 🔹 EventBridge Event Bus and Rules
    const eventBus = new events.EventBus(this, 'TransactionEventBus', {
      eventBusName: `transaction-events-${region}-${environmentSuffix}`,
    });
    eventBus.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const eventDLQ = new sqs.Queue(this, 'EventDLQ', {
      queueName: `event-dlq-${region}-${environmentSuffix}`,
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const processedTransactionRule = new events.Rule(
      this,
      'ProcessedTransactionRule',
      {
        eventBus,
        eventPattern: {
          source: ['transaction.processor'],
          detailType: ['TransactionProcessed'],
        },
        ruleName: `processed-transactions-${region}-${environmentSuffix}`,
      }
    );
    processedTransactionRule.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Downstream target
    const downstreamQueue = new sqs.Queue(this, 'DownstreamQueue', {
      queueName: `downstream-processing-${region}-${environmentSuffix}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const downstreamTarget = new targets.SqsQueue(downstreamQueue, {
      deadLetterQueue: eventDLQ,
      maxEventAge: Duration.hours(2),
      retryAttempts: 3,
    });

    processedTransactionRule.addTarget(downstreamTarget);

    // 🔹 CloudWatch Alarms
    const queueDepthAlarm = new cloudwatch.Alarm(this, 'QueueDepthAlarm', {
      alarmName: `transaction-queue-depth-${region}-${environmentSuffix}`,
      metric: transactionQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1000,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Transaction queue depth exceeds 1000 messages',
    });

    queueDepthAlarm.addAlarmAction(new cwactions.SnsAction(alarmTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `transaction-processor-errors-${region}-${environmentSuffix}`,
      metric: new cloudwatch.MathExpression({
        expression: '100 * errors / invocations',
        usingMetrics: {
          errors: transactionProcessor.metricErrors(),
          invocations: transactionProcessor.metricInvocations(),
        },
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Transaction processor error rate exceeds 1%',
    });

    lambdaErrorAlarm.addAlarmAction(new cwactions.SnsAction(alarmTopic));

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TransactionDashboard', {
      dashboardName: `transaction-processing-${region}-${environmentSuffix}`,
      defaultInterval: Duration.hours(3),
    });
    dashboard.applyRemovalPolicy(RemovalPolicy.DESTROY);

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [
          api.metricCount(),
          api.metricClientError(),
          api.metricServerError(),
        ],
        right: [api.metricLatency()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Queue Metrics',
        left: [
          transactionQueue.metricApproximateNumberOfMessagesVisible(),
          transactionQueue.metricNumberOfMessagesSent(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Performance',
        left: [
          transactionProcessor.metricInvocations(),
          transactionProcessor.metricErrors(),
        ],
        right: [transactionProcessor.metricDuration()],
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Current Queue Depth',
        metrics: [transactionQueue.metricApproximateNumberOfMessagesVisible()],
      })
    );

    // 🔹 Stack Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: `API Gateway endpoint URL for ${region}`,
    });

    new CfnOutput(this, 'GlobalTableArn', {
      value: transactionTable.tableArn,
      description: 'DynamoDB Global Table ARN',
    });

    new CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new CfnOutput(this, 'QueueUrl', {
      value: transactionQueue.queueUrl,
      description: 'Transaction processing queue URL',
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication',
    });

    // 🔹 Tags
    Tags.of(this).add('Project', 'TransactionProcessing');
    Tags.of(this).add('Environment', environmentSuffix);
    Tags.of(this).add('Region', region);
    Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```
