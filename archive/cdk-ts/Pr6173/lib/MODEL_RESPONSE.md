### Reasoning Trace
---

This is a comprehensive request for a multi-region distributed transaction processing system using AWS CDK v2 in TypeScript. Let me break down the requirements:

1. **Two regions**: us-east-1 (primary) and us-west-2 (secondary)
2. **DynamoDB Global Tables**: partition key 'transactionId', sort key 'timestamp', on-demand billing, PITR enabled, streams enabled
3. **SQS FIFO queues**: deduplication, visibility timeout 300s, retention 7 days
4. **Lambda functions**: ARM64 (Graviton2), process from SQS, update DynamoDB with idempotency, triggered by streams for CDC
5. **EventBridge**: route processed transactions with content filtering, DLQ with max retry 3
6. **API Gateway**: REST API with Lambda authorizers, API key auth, throttling 10k RPS per key
7. **CloudWatch**: alarms for queue depth >1000, Lambda error rate >1%, 30-day log retention
8. **IAM**: least privilege for each Lambda
9. **Route 53**: cross-region failover with health checks
10. **VPC endpoints**: for DynamoDB and SQS

The flow should be:
API Gateway → SQS FIFO → Lambda → DynamoDB → EventBridge

I need to create two files:
- `main.ts`: Entry point for CDK app
- `tapstack.ts`: Full stack implementation

Let me structure the solution:

For `main.ts`:
- Initialize CDK app
- Create stacks for both regions
- Pass necessary cross-region references

For `tapstack.ts`:
- Define the stack class
- Create all resources with proper configuration
- Wire them together correctly
- Set up monitoring and alarms
- Configure cross-region components

Key considerations:
- DynamoDB Global Tables need special handling for cross-region
- Route 53 health checks and failover need to be configured properly


I'll focus on critical infrastructure components that require meticulous configuration. VPC endpoints demand careful network setup to ensure secure, private connectivity. Lambda functions need granular IAM permissions and environment-specific configurations. SQS FIFO queues require precise deduplication strategies to prevent duplicate message processing. EventBridge demands sophisticated content-based filtering to route transactions efficiently. API Gateway needs robust authentication mechanisms with Lambda authorizers and API key management.
### Answer 
---

```typescript
// main.ts
import { App, Stack, StackProps, Environment } from 'aws-cdk-lib';
import { TransactionProcessingStack } from './tapstack';

const app = new App();

// 🔹 Environment definitions
const primaryEnv: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1'
};

const secondaryEnv: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-west-2'
};

// 🔹 Primary region stack
const primaryStack = new TransactionProcessingStack(app, 'TxnProcessingPrimary', {
  env: primaryEnv,
  description: 'Primary transaction processing stack in us-east-1',
  isPrimary: true,
  crossRegionReferences: true
});

// 🔹 Secondary region stack with dependency on primary
const secondaryStack = new TransactionProcessingStack(app, 'TxnProcessingSecondary', {
  env: secondaryEnv,
  description: 'Secondary transaction processing stack in us-west-2',
  isPrimary: false,
  crossRegionReferences: true,
  primaryTableArn: primaryStack.globalTableArn
});

secondaryStack.addDependency(primaryStack);

app.synth();
```

```typescript
// tapstack.ts
import {
  Stack, StackProps, Duration, RemovalPolicy, CfnOutput, Tags, Fn
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
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface TransactionProcessingStackProps extends StackProps {
  isPrimary: boolean;
  primaryTableArn?: string;
}

export class TransactionProcessingStack extends Stack {
  public readonly globalTableArn: string;
  public readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, props: TransactionProcessingStackProps) {
    super(scope, id, props);

    const region = this.region;
    const isPrimary = props.isPrimary;

    // 🔹 VPC with endpoints for DynamoDB and SQS
    const vpc = new ec2.Vpc(this, 'TransactionVPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // VPC Endpoint for DynamoDB
    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });

    // VPC Endpoint for SQS
    vpc.addInterfaceEndpoint('SQSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    // 🔹 SNS Topic for CloudWatch Alarms
    const alarmTopic = new sns.Topic(this, 'TransactionAlarmTopic', {
      displayName: `Transaction Processing Alarms - ${region}`,
      topicName: `txn-processing-alarms-${region}`
    });

    // 🔹 DynamoDB Global Table
    let transactionTable: dynamodb.Table;
    
    if (isPrimary) {
      transactionTable = new dynamodb.Table(this, 'TransactionTable', {
        tableName: 'GlobalTransactionTable',
        partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.ON_DEMAND,
        pointInTimeRecovery: true,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: RemovalPolicy.DESTROY,
        replicationRegions: ['us-west-2']
      });
      this.globalTableArn = transactionTable.tableArn;
    } else {
      // Reference existing global table in secondary region
      transactionTable = dynamodb.Table.fromTableAttributes(this, 'TransactionTable', {
        tableName: 'GlobalTransactionTable',
        tableStreamArn: props.primaryTableArn ? 
          props.primaryTableArn.replace('us-east-1', 'us-west-2') + '/stream/*' : '',
        globalIndexes: []
      }) as dynamodb.Table;
      this.globalTableArn = props.primaryTableArn!;
    }

    // 🔹 Dead Letter Queues
    const transactionDLQ = new sqs.Queue(this, 'TransactionDLQ', {
      queueName: `transaction-dlq-${region}.fifo`,
      fifo: true,
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.seconds(300)
    });

    // 🔹 SQS FIFO Queue for transaction processing
    const transactionQueue = new sqs.Queue(this, 'TransactionQueue', {
      queueName: `transaction-processing-${region}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      visibilityTimeout: Duration.seconds(300),
      retentionPeriod: Duration.days(7),
      deadLetterQueue: {
        queue: transactionDLQ,
        maxReceiveCount: 3
      }
    });

    // 🔹 Lambda Layer for common dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromInline('// Placeholder for dependencies'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      description: 'Common dependencies for transaction processing'
    });

    // 🔹 Transaction Processor Lambda
    const processorRole = new iam.Role(this, 'ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
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
                'dynamodb:Query'
              ],
              resources: [
                transactionTable.tableArn || this.globalTableArn,
                `${transactionTable.tableArn || this.globalTableArn}/index/*`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes'
              ],
              resources: [transactionQueue.queueArn]
            })
          ]
        })
      }
    });

    const processorLogGroup = new logs.LogGroup(this, 'ProcessorLogGroup', {
      logGroupName: `/aws/lambda/transaction-processor-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const transactionProcessor = new lambda.Function(this, 'TransactionProcessor', {
      functionName: `transaction-processor-${region}`,
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
        TABLE_NAME: 'GlobalTransactionTable',
        EVENT_BUS_NAME: 'default'
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      role: processorRole,
      logGroup: processorLogGroup,
      layers: [dependenciesLayer],
      deadLetterQueueEnabled: true
    });

    // Add SQS event source
    transactionProcessor.addEventSource(
      new lambdaEventSources.SqsEventSource(transactionQueue, {
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(5),
        reportBatchItemFailures: true
      })
    );

    // 🔹 CDC Lambda for DynamoDB Streams
    const cdcRole = new iam.Role(this, 'CDCLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
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
                'dynamodb:ListStreams'
              ],
              resources: [`${transactionTable.tableArn || this.globalTableArn}/stream/*`]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: ['*']
            })
          ]
        })
      }
    });

    const cdcLogGroup = new logs.LogGroup(this, 'CDCLogGroup', {
      logGroupName: `/aws/lambda/transaction-cdc-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const cdcProcessor = new lambda.Function(this, 'CDCProcessor', {
      functionName: `transaction-cdc-${region}`,
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
        EVENT_BUS_NAME: 'default'
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      role: cdcRole,
      logGroup: cdcLogGroup,
      layers: [dependenciesLayer]
    });

    // Add DynamoDB stream trigger only in primary region
    if (isPrimary && transactionTable.tableStreamArn) {
      cdcProcessor.addEventSource(
        new lambdaEventSources.DynamoEventSource(transactionTable, {
          startingPosition: lambda.StartingPosition.TRIM_HORIZON,
          batchSize: 100,
          maxBatchingWindow: Duration.seconds(5),
          bisectBatchOnError: true,
          retryAttempts: 3,
          reportBatchItemFailures: true
        })
      );
    }

    // 🔹 Lambda Authorizer
    const authorizerLogGroup = new logs.LogGroup(this, 'AuthorizerLogGroup', {
      logGroupName: `/aws/lambda/api-authorizer-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const authorizer = new lambda.Function(this, 'ApiAuthorizer', {
      functionName: `api-authorizer-${region}`,
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
      logGroup: authorizerLogGroup
    });

    // 🔹 API Handler Lambda
    const apiHandlerRole = new iam.Role(this, 'ApiHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
      ],
      inlinePolicies: {
        ApiHandlerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [transactionQueue.queueArn]
            })
          ]
        })
      }
    });

    const apiHandlerLogGroup = new logs.LogGroup(this, 'ApiHandlerLogGroup', {
      logGroupName: `/aws/lambda/api-handler-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      functionName: `api-handler-${region}`,
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
        QUEUE_URL: transactionQueue.queueUrl
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      role: apiHandlerRole,
      logGroup: apiHandlerLogGroup,
      layers: [dependenciesLayer]
    });

    // 🔹 API Gateway Setup
    const apiLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: `/aws/apigateway/transaction-api-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const api = new apigateway.RestApi(this, 'TransactionApi', {
      restApiName: `transaction-api-${region}`,
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 10000,
        throttlingRateLimit: 10000,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields()
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER
    });

    const lambdaAuthorizer = new apigateway.TokenAuthorizer(this, 'LambdaAuthorizer', {
      handler: authorizer,
      resultsCacheTtl: Duration.minutes(5)
    });

    const transactionsResource = api.root.addResource('transactions');
    const postMethod = transactionsResource.addMethod('POST',
      new apigateway.LambdaIntegration(apiHandler, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
      }),
      {
        authorizer: lambdaAuthorizer,
        apiKeyRequired: true
      }
    );

    const plan = api.addUsagePlan('TransactionApiUsagePlan', {
      name: `transaction-api-plan-${region}`,
      throttle: {
        rateLimit: 10000,
        burstLimit: 10000
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.DAY
      }
    });

    const apiKey = api.addApiKey('TransactionApiKey', {
      apiKeyName: `transaction-api-key-${region}`
    });

    plan.addApiKey(apiKey);
    plan.addApiStage({
      stage: api.deploymentStage
    });

    this.apiEndpoint = api.url;

    // 🔹 EventBridge Event Bus and Rules
    const eventBus = new events.EventBus(this, 'TransactionEventBus', {
      eventBusName: `transaction-events-${region}`
    });

    const eventDLQ = new sqs.Queue(this, 'EventDLQ', {
      queueName: `event-dlq-${region}`,
      retentionPeriod: Duration.days(14)
    });

    const processedTransactionRule = new events.Rule(this, 'ProcessedTransactionRule', {
      eventBus,
      eventPattern: {
        source: ['transaction.processor'],
        detailType: ['TransactionProcessed']
      },
      ruleName: `processed-transactions-${region}`
    });

    // Downstream target (placeholder - could be another Lambda, SNS, etc.)
    const downstreamTarget = new targets.SqsQueue(
      new sqs.Queue(this, 'DownstreamQueue', {
        queueName: `downstream-processing-${region}`
      }),
      {
        deadLetterQueue: eventDLQ,
        maxEventAge: Duration.hours(2),
        retryAttempts: 3
      }
    );

    processedTransactionRule.addTarget(downstreamTarget);

    // 🔹 CloudWatch Alarms
    const queueDepthAlarm = new cloudwatch.Alarm(this, 'QueueDepthAlarm', {
      alarmName: `transaction-queue-depth-${region}`,
      metric: transactionQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1000,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Transaction queue depth exceeds 1000 messages'
    });

    queueDepthAlarm.addAlarmAction(new cwactions.SnsAction(alarmTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `transaction-processor-errors-${region}`,
      metric: new cloudwatch.MathExpression({
        expression: '100 * errors / invocations',
        usingMetrics: {
          errors: transactionProcessor.metricErrors(),
          invocations: transactionProcessor.metricInvocations()
        },
        period: Duration.minutes(5)
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Transaction processor error rate exceeds 1%'
    });

    lambdaErrorAlarm.addAlarmAction(new cwactions.SnsAction(alarmTopic));

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TransactionDashboard', {
      dashboardName: `transaction-processing-${region}`,
      defaultInterval: Duration.hours(3)
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [api.metricCount(), api.metric4XXError(), api.metric5XXError()],
        right: [api.metricLatency()]
      }),
      new cloudwatch.GraphWidget({
        title: 'Queue Metrics',
        left: [
          transactionQueue.metricApproximateNumberOfMessagesVisible(),
          transactionQueue.metricNumberOfMessagesSent()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Performance',
        left: [
          transactionProcessor.metricInvocations(),
          transactionProcessor.metricErrors()
        ],
        right: [transactionProcessor.metricDuration()]
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Current Queue Depth',
        metrics: [transactionQueue.metricApproximateNumberOfMessagesVisible()]
      })
    );

    // 🔹 Route 53 Health Check (only in primary)
    if (isPrimary) {
      const hostedZone = new route53.HostedZone(this, 'TransactionHostedZone', {
        zoneName: 'transactions.example.com'
      });

      const healthCheck = new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
        type: 'HTTPS',
        resourcePath: '/transactions',
        fullyQualifiedDomainName: Fn.select(2, Fn.split('/', api.url)),
        port: 443,
        requestInterval: 30,
        failureThreshold: 3
      });

      const primaryRecord = new route53.ARecord(this, 'PrimaryApiRecord', {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromAlias(
          new route53targets.ApiGateway(api)
        ),
        setIdentifier: 'Primary',
        region: 'us-east-1',
        healthCheckId: healthCheck.attrHealthCheckId
      });
    }

    // 🔹 Stack Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: `API Gateway endpoint URL for ${region}`
    });

    new CfnOutput(this, 'GlobalTableArn', {
      value: this.globalTableArn,
      description: 'DynamoDB Global Table ARN'
    });

    new CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL'
    });

    new CfnOutput(this, 'QueueUrl', {
      value: transactionQueue.queueUrl,
      description: 'Transaction processing queue URL'
    });

    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication'
    });

    // 🔹 Tags
    Tags.of(this).add('Project', 'TransactionProcessing');
    Tags.of(this).add('Environment', 'Production');
    Tags.of(this).add('Region', region);
    Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```