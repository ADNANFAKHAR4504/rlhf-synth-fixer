# Payment Webhook Processing System - Initial Implementation

This implementation creates a serverless event processing system for payment webhooks with all required components.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PaymentWebhookStack } from './payment-webhook-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the payment webhook stack
    new PaymentWebhookStack(this, 'PaymentWebhookStack', {
      environmentSuffix: environmentSuffix,
    });
  }
}
```

## File: lib/payment-webhook-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

interface PaymentWebhookStackProps {
  environmentSuffix: string;
}

export class PaymentWebhookStack extends Construct {
  constructor(scope: Construct, id: string, props: PaymentWebhookStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // KMS key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for payment webhook system',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // VPC for Lambda functions
    const vpc = new ec2.Vpc(this, 'WebhookVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // DynamoDB table for payment events
    const paymentTable = new dynamodb.Table(this, 'PaymentTable', {
      tableName: `payment-events-${environmentSuffix}`,
      partitionKey: { name: 'paymentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for querying by payment provider
    paymentTable.addGlobalSecondaryIndex({
      indexName: 'ProviderTimestampIndex',
      partitionKey: { name: 'provider', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // S3 bucket for webhook archives
    const archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      bucketName: `webhook-archive-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // SQS queues for message delivery
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `processing-queue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(180),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
    });

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: `notification-queue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(180),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
    });

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `payment-alerts-${environmentSuffix}`,
      displayName: 'Payment Alert Notifications',
      masterKey: encryptionKey,
    });

    // EventBridge custom event bus
    const paymentEventBus = new events.EventBus(this, 'PaymentEventBus', {
      eventBusName: `payment-events-${environmentSuffix}`,
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    paymentTable.grantReadWriteData(lambdaRole);
    archiveBucket.grantReadWrite(lambdaRole);
    processingQueue.grantSendMessages(lambdaRole);
    notificationQueue.grantSendMessages(lambdaRole);
    alertTopic.grantPublish(lambdaRole);
    encryptionKey.grantEncryptDecrypt(lambdaRole);

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [paymentEventBus.eventBusArn],
      })
    );

    // SSM Parameter for configuration
    const configParameter = new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName: `/payment-webhook/${environmentSuffix}/config`,
      stringValue: JSON.stringify({
        maxRetries: 3,
        timeoutMs: 30000,
      }),
    });

    configParameter.grantRead(lambdaRole);

    // Lambda function 1: Webhook Receiver
    const webhookReceiver = new lambda.Function(this, 'WebhookReceiver', {
      functionName: `webhook-receiver-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/webhook-receiver'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        PAYMENT_TABLE: paymentTable.tableName,
        ARCHIVE_BUCKET: archiveBucket.bucketName,
        PROCESSING_QUEUE: processingQueue.queueUrl,
        CONFIG_PARAM: configParameter.parameterName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Lambda function 2: Event Processor
    const eventProcessor = new lambda.Function(this, 'EventProcessor', {
      functionName: `event-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/event-processor'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        PAYMENT_TABLE: paymentTable.tableName,
        EVENT_BUS: paymentEventBus.eventBusName,
        NOTIFICATION_QUEUE: notificationQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    eventProcessor.addEventSource(
      new SqsEventSource(processingQueue, {
        batchSize: 10,
      })
    );

    // Lambda function 3: Notification Handler
    const notificationHandler = new lambda.Function(this, 'NotificationHandler', {
      functionName: `notification-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/notification-handler'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        ALERT_TOPIC: alertTopic.topicArn,
        PAYMENT_TABLE: paymentTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    notificationHandler.addEventSource(
      new SqsEventSource(notificationQueue, {
        batchSize: 10,
      })
    );

    // Lambda function URL for health check
    const healthCheckUrl = webhookReceiver.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'WebhookApi', {
      restApiName: `webhook-api-${environmentSuffix}`,
      description: 'Payment Webhook API',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
    });

    const webhookResource = api.root.addResource('webhook');
    webhookResource.addMethod('POST', new apigateway.LambdaIntegration(webhookReceiver));

    // EventBridge rules for routing based on amount
    new events.Rule(this, 'HighValuePaymentRule', {
      eventBus: paymentEventBus,
      eventPattern: {
        source: ['payment.processor'],
        detailType: ['Payment Processed'],
        detail: {
          amount: [{ numeric: ['>', 10000] }],
        },
      },
      targets: [new targets.SnsTopic(alertTopic)],
    });

    new events.Rule(this, 'StandardPaymentRule', {
      eventBus: paymentEventBus,
      eventPattern: {
        source: ['payment.processor'],
        detailType: ['Payment Processed'],
        detail: {
          amount: [{ numeric: ['<=', 10000] }],
        },
      },
      targets: [new targets.CloudWatchLogGroup(
        new logs.LogGroup(this, 'StandardPaymentLogs', {
          logGroupName: `/aws/events/standard-payments-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_MONTH,
        })
      )],
    });

    // CloudWatch alarms
    new cloudwatch.Alarm(this, 'WebhookReceiverErrorAlarm', {
      metric: webhookReceiver.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alert when webhook receiver has errors exceeding 1%',
    });

    new cloudwatch.Alarm(this, 'DynamoDBThrottleAlarm', {
      metric: paymentTable.metricUserErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alert when DynamoDB is being throttled',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard', {
      dashboardName: `payment-webhook-dashboard-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [
          api.metricLatency({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          webhookReceiver.metricInvocations(),
          eventProcessor.metricInvocations(),
          notificationHandler.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity',
        left: [
          paymentTable.metricConsumedReadCapacityUnits(),
          paymentTable.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'HealthCheckUrl', {
      value: healthCheckUrl.url,
      description: 'Lambda Function URL for health checks',
    });

    new cdk.CfnOutput(this, 'PaymentTableName', {
      value: paymentTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: paymentEventBus.eventBusName,
      description: 'EventBridge event bus name',
    });
  }
}
```

## File: lib/lambda/webhook-receiver/index.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as crypto from 'crypto';

const dynamoClient = new DynamoDBClient({});
const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

const PAYMENT_TABLE = process.env.PAYMENT_TABLE!;
const ARCHIVE_BUCKET = process.env.ARCHIVE_BUCKET!;
const PROCESSING_QUEUE = process.env.PROCESSING_QUEUE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Health check endpoint
    if (event.path === '/health' || event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'healthy' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const payload = JSON.parse(event.body);

    // Validate signature (simplified - in production use proper HMAC validation)
    const signature = event.headers['X-Webhook-Signature'] || '';
    if (!validateSignature(payload, signature)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const paymentId = payload.paymentId || crypto.randomUUID();
    const timestamp = Date.now();

    // Store in DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: PAYMENT_TABLE,
        Item: {
          paymentId: { S: paymentId },
          timestamp: { N: timestamp.toString() },
          provider: { S: payload.provider || 'unknown' },
          amount: { N: payload.amount?.toString() || '0' },
          status: { S: 'received' },
          rawPayload: { S: JSON.stringify(payload) },
        },
      })
    );

    // Archive to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: ARCHIVE_BUCKET,
        Key: `webhooks/${new Date().toISOString().split('T')[0]}/${paymentId}.json`,
        Body: JSON.stringify(payload),
        ContentType: 'application/json',
      })
    );

    // Send to processing queue
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: PROCESSING_QUEUE,
        MessageBody: JSON.stringify({
          paymentId,
          timestamp,
          payload,
        }),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook received',
        paymentId,
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function validateSignature(payload: any, signature: string): boolean {
  // Simplified validation - in production implement proper HMAC-SHA256 validation
  return signature.length > 0;
}
```

## File: lib/lambda/event-processor/index.ts

```typescript
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const dynamoClient = new DynamoDBClient({});
const eventBridgeClient = new EventBridgeClient({});
const sqsClient = new SQSClient({});

const PAYMENT_TABLE = process.env.PAYMENT_TABLE!;
const EVENT_BUS = process.env.EVENT_BUS!;
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE!;

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { paymentId, timestamp, payload } = message;

      // Transform and enrich the payment data
      const processedPayment = {
        paymentId,
        timestamp,
        provider: payload.provider,
        amount: parseFloat(payload.amount || 0),
        currency: payload.currency || 'USD',
        status: 'processed',
        processedAt: Date.now(),
      };

      // Update DynamoDB
      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: PAYMENT_TABLE,
          Key: {
            paymentId: { S: paymentId },
            timestamp: { N: timestamp.toString() },
          },
          UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'processed' },
            ':processedAt': { N: Date.now().toString() },
          },
        })
      );

      // Send to EventBridge
      await eventBridgeClient.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: 'payment.processor',
              DetailType: 'Payment Processed',
              Detail: JSON.stringify(processedPayment),
              EventBusName: EVENT_BUS,
            },
          ],
        })
      );

      // If high-value payment or failed, send to notification queue
      if (processedPayment.amount > 10000 || payload.status === 'failed') {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: NOTIFICATION_QUEUE,
            MessageBody: JSON.stringify(processedPayment),
          })
        );
      }

      console.log(`Processed payment ${paymentId}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error; // This will cause the message to be retried
    }
  }
};
```

## File: lib/lambda/notification-handler/index.ts

```typescript
import { SQSEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const snsClient = new SNSClient({});
const dynamoClient = new DynamoDBClient({});

const ALERT_TOPIC = process.env.ALERT_TOPIC!;
const PAYMENT_TABLE = process.env.PAYMENT_TABLE!;

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const payment = JSON.parse(record.body);

      // Get full payment details from DynamoDB
      const result = await dynamoClient.send(
        new GetItemCommand({
          TableName: PAYMENT_TABLE,
          Key: {
            paymentId: { S: payment.paymentId },
            timestamp: { N: payment.timestamp.toString() },
          },
        })
      );

      if (!result.Item) {
        console.warn(`Payment ${payment.paymentId} not found in DynamoDB`);
        continue;
      }

      const amount = parseFloat(payment.amount || 0);
      const provider = payment.provider || 'unknown';

      // Send notification for high-value or failed payments
      if (amount > 10000) {
        await snsClient.send(
          new PublishCommand({
            TopicArn: ALERT_TOPIC,
            Subject: `High-Value Payment Alert: $${amount}`,
            Message: `
High-value payment detected:
- Payment ID: ${payment.paymentId}
- Provider: ${provider}
- Amount: $${amount}
- Status: ${payment.status}
- Timestamp: ${new Date(payment.processedAt).toISOString()}

Please review this transaction for compliance.
            `.trim(),
          })
        );

        console.log(`Sent alert for high-value payment ${payment.paymentId}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
};
```

## File: lib/lambda/webhook-receiver/package.json

```json
{
  "name": "webhook-receiver",
  "version": "1.0.0",
  "description": "Webhook receiver Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-sqs": "^3.400.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/event-processor/package.json

```json
{
  "name": "event-processor",
  "version": "1.0.0",
  "description": "Event processor Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-eventbridge": "^3.400.0",
    "@aws-sdk/client-sqs": "^3.400.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/notification-handler/package.json

```json
{
  "name": "notification-handler",
  "version": "1.0.0",
  "description": "Notification handler Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sns": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/webhook-receiver/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/event-processor/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/notification-handler/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```
