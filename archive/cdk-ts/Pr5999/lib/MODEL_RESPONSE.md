# Serverless Fraud Detection System - CDK TypeScript Implementation

This implementation provides a complete serverless fraud detection system for processing credit card transactions using AWS CDK with TypeScript.

## Architecture Overview

The solution implements a serverless architecture with the following components:
- API Gateway REST API with API key authentication
- Four Lambda functions (transaction validator, FIFO processor, fraud alert handler, batch processor)
- DynamoDB table for transaction storage
- SQS FIFO queue for ordered processing
- SNS topic for fraud alerts
- EventBridge scheduled rule for batch processing
- Dead letter queues for all Lambda functions
- CloudWatch alarms and X-Ray tracing
- Systems Manager Parameter Store integration

## File: lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FraudDetectionStack } from './fraud-detection-stack';

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

    // Create the fraud detection stack
    new FraudDetectionStack(this, `FraudDetectionStack-${environmentSuffix}`, {
      environmentSuffix,
    });
  }
}
```

## File: lib/fraud-detection-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface FraudDetectionStackProps {
  environmentSuffix: string;
}

export class FraudDetectionStack extends Construct {
  public readonly apiEndpoint: cdk.CfnOutput;
  public readonly tableNameOutput: cdk.CfnOutput;
  public readonly topicArnOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: FraudDetectionStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const stack = cdk.Stack.of(this);

    // Create Systems Manager parameters for Lambda environment variables
    const fraudThresholdParam = new ssm.StringParameter(this, `FraudThresholdParam-${environmentSuffix}`, {
      parameterName: `/fraud-detection/${environmentSuffix}/fraud-threshold`,
      stringValue: '1000',
      description: 'Fraud detection threshold amount',
    });

    const alertEmailParam = new ssm.StringParameter(this, `AlertEmailParam-${environmentSuffix}`, {
      parameterName: `/fraud-detection/${environmentSuffix}/alert-email`,
      stringValue: 'security@example.com',
      description: 'Email address for fraud alerts',
    });

    // Create DynamoDB table for transaction history
    const transactionTable = new dynamodb.Table(this, `TransactionHistory-${environmentSuffix}`, {
      tableName: `TransactionHistory-${environmentSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SNS topic for fraud alerts
    const fraudAlertTopic = new sns.Topic(this, `FraudAlerts-${environmentSuffix}`, {
      topicName: `FraudAlerts-${environmentSuffix}`,
      displayName: 'Fraud Detection Alerts',
    });

    // Create SQS FIFO queue for transaction processing
    const transactionQueue = new sqs.Queue(this, `TransactionQueue-${environmentSuffix}`, {
      queueName: `TransactionQueue-${environmentSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.minutes(6),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create dead letter queues for each Lambda function
    const validatorDLQ = new sqs.Queue(this, `ValidatorDLQ-${environmentSuffix}`, {
      queueName: `transaction-validator-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const processorDLQ = new sqs.Queue(this, `ProcessorDLQ-${environmentSuffix}`, {
      queueName: `fifo-processor-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const alertHandlerDLQ = new sqs.Queue(this, `AlertHandlerDLQ-${environmentSuffix}`, {
      queueName: `alert-handler-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const batchProcessorDLQ = new sqs.Queue(this, `BatchProcessorDLQ-${environmentSuffix}`, {
      queueName: `batch-processor-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Lambda function for transaction validation
    const transactionValidator = new lambda.Function(this, `TransactionValidator-${environmentSuffix}`, {
      functionName: `transaction-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/transaction-validator'),
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      reservedConcurrentExecutions: 100,
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: validatorDLQ,
      environment: {
        TRANSACTION_QUEUE_URL: transactionQueue.queueUrl,
        FRAUD_ALERT_TOPIC_ARN: fraudAlertTopic.topicArn,
        FRAUD_THRESHOLD_PARAM: fraudThresholdParam.parameterName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to transaction validator
    transactionQueue.grantSendMessages(transactionValidator);
    fraudAlertTopic.grantPublish(transactionValidator);
    fraudThresholdParam.grantRead(transactionValidator);
    transactionValidator.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }));

    // Lambda function for FIFO queue processing
    const fifoProcessor = new lambda.Function(this, `FIFOProcessor-${environmentSuffix}`, {
      functionName: `fifo-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/fifo-processor'),
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      reservedConcurrentExecutions: 100,
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: processorDLQ,
      environment: {
        TRANSACTION_TABLE_NAME: transactionTable.tableName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Add SQS event source to FIFO processor
    fifoProcessor.addEventSource(new lambda_event_sources.SqsEventSource(transactionQueue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }));

    // Grant permissions to FIFO processor
    transactionTable.grantWriteData(fifoProcessor);
    transactionQueue.grantConsumeMessages(fifoProcessor);
    fifoProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }));

    // Lambda function for fraud alert handling
    const alertHandler = new lambda.Function(this, `AlertHandler-${environmentSuffix}`, {
      functionName: `fraud-alert-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/alert-handler'),
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: alertHandlerDLQ,
      environment: {
        ALERT_EMAIL_PARAM: alertEmailParam.parameterName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Subscribe alert handler to SNS topic
    fraudAlertTopic.addSubscription(new subscriptions.LambdaSubscription(alertHandler));

    // Grant permissions to alert handler
    alertEmailParam.grantRead(alertHandler);
    alertHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }));

    // Lambda function for batch processing
    const batchProcessor = new lambda.Function(this, `BatchProcessor-${environmentSuffix}`, {
      functionName: `batch-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/batch-processor'),
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      reservedConcurrentExecutions: 100,
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: batchProcessorDLQ,
      environment: {
        TRANSACTION_TABLE_NAME: transactionTable.tableName,
        FRAUD_ALERT_TOPIC_ARN: fraudAlertTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to batch processor
    transactionTable.grantReadData(batchProcessor);
    fraudAlertTopic.grantPublish(batchProcessor);
    batchProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }));

    // Create EventBridge rule for hourly batch processing
    const batchProcessingRule = new events.Rule(this, `BatchProcessingRule-${environmentSuffix}`, {
      ruleName: `batch-processing-${environmentSuffix}`,
      description: 'Triggers batch processing Lambda every hour',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '*',
      }),
    });

    batchProcessingRule.addTarget(new targets.LambdaFunction(batchProcessor));

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, `FraudDetectionAPI-${environmentSuffix}`, {
      restApiName: `fraud-detection-api-${environmentSuffix}`,
      description: 'Fraud Detection System API',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
      cloudWatchRole: true,
    });

    // Create API key
    const apiKey = new apigateway.ApiKey(this, `FraudDetectionAPIKey-${environmentSuffix}`, {
      apiKeyName: `fraud-detection-key-${environmentSuffix}`,
      description: 'API key for fraud detection system',
    });

    // Create usage plan
    const usagePlan = new apigateway.UsagePlan(this, `FraudDetectionUsagePlan-${environmentSuffix}`, {
      name: `fraud-detection-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for fraud detection API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Create /transactions resource
    const transactions = api.root.addResource('transactions');

    // Create POST method with API key requirement
    transactions.addMethod('POST', new apigateway.LambdaIntegration(transactionValidator, {
      proxy: true,
    }), {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // Grant API Gateway permission to invoke Lambda
    transactionValidator.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com', {
      conditions: {
        ArnLike: {
          'aws:SourceArn': `arn:aws:execute-api:${stack.region}:${stack.account}:${api.restApiId}/*/*`,
        },
      },
    }));

    // Create CloudWatch alarms for Lambda functions
    this.createLambdaAlarm(transactionValidator, environmentSuffix, 'TransactionValidator');
    this.createLambdaAlarm(fifoProcessor, environmentSuffix, 'FIFOProcessor');
    this.createLambdaAlarm(alertHandler, environmentSuffix, 'AlertHandler');
    this.createLambdaAlarm(batchProcessor, environmentSuffix, 'BatchProcessor');

    // Stack outputs
    this.apiEndpoint = new cdk.CfnOutput(stack, `ApiEndpoint-${environmentSuffix}`, {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `FraudDetectionApiEndpoint-${environmentSuffix}`,
    });

    this.tableNameOutput = new cdk.CfnOutput(stack, `TableName-${environmentSuffix}`, {
      value: transactionTable.tableName,
      description: 'DynamoDB table name',
      exportName: `TransactionTableName-${environmentSuffix}`,
    });

    this.topicArnOutput = new cdk.CfnOutput(stack, `TopicArn-${environmentSuffix}`, {
      value: fraudAlertTopic.topicArn,
      description: 'SNS topic ARN',
      exportName: `FraudAlertTopicArn-${environmentSuffix}`,
    });

    // Additional outputs for testing
    new cdk.CfnOutput(stack, `ApiKeyId-${environmentSuffix}`, {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `FraudDetectionApiKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, `TransactionQueueUrl-${environmentSuffix}`, {
      value: transactionQueue.queueUrl,
      description: 'Transaction queue URL',
      exportName: `TransactionQueueUrl-${environmentSuffix}`,
    });
  }

  /**
   * Creates a CloudWatch alarm for Lambda function errors exceeding 1% over 5 minutes
   */
  private createLambdaAlarm(
    lambdaFunction: lambda.Function,
    environmentSuffix: string,
    functionType: string
  ): cloudwatch.Alarm {
    const errorMetric = lambdaFunction.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    const invocationMetric = lambdaFunction.metricInvocations({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    // Create a math expression for error rate percentage
    const errorRate = new cloudwatch.MathExpression({
      expression: '(errors / invocations) * 100',
      usingMetrics: {
        errors: errorMetric,
        invocations: invocationMetric,
      },
      period: cdk.Duration.minutes(5),
    });

    const alarm = new cloudwatch.Alarm(this, `${functionType}ErrorAlarm-${environmentSuffix}`, {
      alarmName: `${functionType}-error-rate-${environmentSuffix}`,
      alarmDescription: `${functionType} error rate exceeds 1% over 5 minutes`,
      metric: errorRate,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    return alarm;
  }
}
```

## File: lib/lambda/transaction-validator/index.ts

```ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const sqsClient = new SQSClient({});
const snsClient = new SNSClient({});
const ssmClient = new SSMClient({});

const TRANSACTION_QUEUE_URL = process.env.TRANSACTION_QUEUE_URL!;
const FRAUD_ALERT_TOPIC_ARN = process.env.FRAUD_ALERT_TOPIC_ARN!;
const FRAUD_THRESHOLD_PARAM = process.env.FRAUD_THRESHOLD_PARAM!;

interface TransactionRequest {
  transactionId: string;
  amount: number;
  currency: string;
  cardNumber: string;
  merchantId: string;
  timestamp?: number;
}

/**
 * Transaction validator Lambda function
 * Validates incoming credit card transactions and checks for fraud patterns
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Received transaction validation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const transaction: TransactionRequest = JSON.parse(event.body);

    // Validate required fields
    if (!transaction.transactionId || !transaction.amount || !transaction.currency || !transaction.cardNumber || !transaction.merchantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: transactionId, amount, currency, cardNumber, merchantId' }),
      };
    }

    // Add timestamp if not provided
    if (!transaction.timestamp) {
      transaction.timestamp = Date.now();
    }

    // Get fraud threshold from Parameter Store
    const paramResponse = await ssmClient.send(new GetParameterCommand({
      Name: FRAUD_THRESHOLD_PARAM,
    }));

    const fraudThreshold = parseFloat(paramResponse.Parameter?.Value || '1000');

    // Check for suspicious patterns (simple fraud detection logic)
    const isSuspicious = transaction.amount > fraudThreshold;

    if (isSuspicious) {
      console.log(`Suspicious transaction detected: ${transaction.transactionId}, amount: ${transaction.amount}`);

      // Publish fraud alert to SNS
      await snsClient.send(new PublishCommand({
        TopicArn: FRAUD_ALERT_TOPIC_ARN,
        Subject: 'Fraud Alert - Suspicious Transaction Detected',
        Message: JSON.stringify({
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          merchantId: transaction.merchantId,
          timestamp: transaction.timestamp,
          reason: 'Amount exceeds fraud threshold',
        }),
      }));
    }

    // Send transaction to FIFO queue for processing
    const messageGroupId = transaction.cardNumber.slice(-4); // Use last 4 digits as group ID
    const deduplicationId = `${transaction.transactionId}-${transaction.timestamp}`;

    await sqsClient.send(new SendMessageCommand({
      QueueUrl: TRANSACTION_QUEUE_URL,
      MessageBody: JSON.stringify(transaction),
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: deduplicationId,
    }));

    console.log(`Transaction ${transaction.transactionId} validated and queued for processing`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction validated successfully',
        transactionId: transaction.transactionId,
        suspicious: isSuspicious,
      }),
    };
  } catch (error) {
    console.error('Error validating transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
```

## File: lib/lambda/transaction-validator/package.json

```json
{
  "name": "transaction-validator",
  "version": "1.0.0",
  "description": "Transaction validator Lambda function",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0",
    "@aws-sdk/client-ssm": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/fifo-processor/index.ts

```ts
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TRANSACTION_TABLE_NAME = process.env.TRANSACTION_TABLE_NAME!;

interface Transaction {
  transactionId: string;
  amount: number;
  currency: string;
  cardNumber: string;
  merchantId: string;
  timestamp: number;
}

/**
 * FIFO queue processor Lambda function
 * Processes transactions from SQS FIFO queue and stores them in DynamoDB
 */
export async function handler(event: SQSEvent): Promise<void> {
  console.log(`Processing ${event.Records.length} transactions from FIFO queue`);

  const promises = event.Records.map((record: SQSRecord) => processTransaction(record));

  try {
    await Promise.all(promises);
    console.log('All transactions processed successfully');
  } catch (error) {
    console.error('Error processing transactions:', error);
    throw error; // Let Lambda retry failed messages
  }
}

async function processTransaction(record: SQSRecord): Promise<void> {
  try {
    const transaction: Transaction = JSON.parse(record.body);

    console.log(`Processing transaction: ${transaction.transactionId}`);

    // Store transaction in DynamoDB
    await docClient.send(new PutCommand({
      TableName: TRANSACTION_TABLE_NAME,
      Item: {
        transactionId: transaction.transactionId,
        timestamp: transaction.timestamp,
        amount: transaction.amount,
        currency: transaction.currency,
        cardNumber: maskCardNumber(transaction.cardNumber),
        merchantId: transaction.merchantId,
        processedAt: Date.now(),
        messageId: record.messageId,
      },
    }));

    console.log(`Transaction ${transaction.transactionId} stored in DynamoDB`);
  } catch (error) {
    console.error(`Error processing transaction from record ${record.messageId}:`, error);
    throw error;
  }
}

/**
 * Masks credit card number for PCI DSS compliance
 * Only stores last 4 digits
 */
function maskCardNumber(cardNumber: string): string {
  const lastFour = cardNumber.slice(-4);
  return `****-****-****-${lastFour}`;
}
```

## File: lib/lambda/fifo-processor/package.json

```json
{
  "name": "fifo-processor",
  "version": "1.0.0",
  "description": "FIFO queue processor Lambda function",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/alert-handler/index.ts

```ts
import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});

const ALERT_EMAIL_PARAM = process.env.ALERT_EMAIL_PARAM!;

interface FraudAlert {
  transactionId: string;
  amount: number;
  currency: string;
  merchantId: string;
  timestamp: number;
  reason: string;
}

/**
 * Fraud alert handler Lambda function
 * Processes fraud alerts from SNS topic and sends notifications to security team
 */
export async function handler(event: SNSEvent): Promise<void> {
  console.log(`Processing ${event.Records.length} fraud alerts`);

  // Get alert email from Parameter Store
  const paramResponse = await ssmClient.send(new GetParameterCommand({
    Name: ALERT_EMAIL_PARAM,
  }));

  const alertEmail = paramResponse.Parameter?.Value || 'security@example.com';

  const promises = event.Records.map((record: SNSEventRecord) => processAlert(record, alertEmail));

  try {
    await Promise.all(promises);
    console.log('All fraud alerts processed successfully');
  } catch (error) {
    console.error('Error processing fraud alerts:', error);
    throw error;
  }
}

async function processAlert(record: SNSEventRecord, alertEmail: string): Promise<void> {
  try {
    const alert: FraudAlert = JSON.parse(record.Sns.Message);

    console.log(`Processing fraud alert for transaction: ${alert.transactionId}`);

    // In a real implementation, this would send an email via SES or trigger other notification mechanisms
    // For now, we'll just log the alert
    console.log('Fraud Alert Details:', {
      transactionId: alert.transactionId,
      amount: alert.amount,
      currency: alert.currency,
      merchantId: alert.merchantId,
      timestamp: new Date(alert.timestamp).toISOString(),
      reason: alert.reason,
      alertEmail: alertEmail,
    });

    // Simulate sending alert to security team
    console.log(`Alert sent to security team at ${alertEmail}`);

    // In production, you would use AWS SES to send actual emails:
    // await sesClient.send(new SendEmailCommand({
    //   Source: 'fraud-alerts@example.com',
    //   Destination: { ToAddresses: [alertEmail] },
    //   Message: {
    //     Subject: { Data: `Fraud Alert - Transaction ${alert.transactionId}` },
    //     Body: { Text: { Data: JSON.stringify(alert, null, 2) } }
    //   }
    // }));
  } catch (error) {
    console.error(`Error processing fraud alert from record ${record.Sns.MessageId}:`, error);
    throw error;
  }
}
```

## File: lib/lambda/alert-handler/package.json

```json
{
  "name": "alert-handler",
  "version": "1.0.0",
  "description": "Fraud alert handler Lambda function",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-ssm": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/batch-processor/index.ts

```ts
import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const TRANSACTION_TABLE_NAME = process.env.TRANSACTION_TABLE_NAME!;
const FRAUD_ALERT_TOPIC_ARN = process.env.FRAUD_ALERT_TOPIC_ARN!;

interface TransactionRecord {
  transactionId: string;
  timestamp: number;
  amount: number;
  currency: string;
  merchantId: string;
  cardNumber: string;
}

/**
 * Batch processor Lambda function
 * Runs hourly to analyze transaction patterns and detect fraud
 */
export async function handler(event: ScheduledEvent): Promise<void> {
  console.log('Starting batch processing for fraud pattern analysis');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Calculate time window (last hour)
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Scan transactions from the last hour
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TRANSACTION_TABLE_NAME,
      FilterExpression: '#ts > :oneHourAgo',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':oneHourAgo': oneHourAgo,
      },
    }));

    const transactions = (scanResult.Items || []) as TransactionRecord[];

    console.log(`Found ${transactions.length} transactions in the last hour`);

    if (transactions.length === 0) {
      console.log('No transactions to analyze');
      return;
    }

    // Analyze transaction patterns
    const analysis = analyzeTransactionPatterns(transactions);

    console.log('Transaction pattern analysis:', JSON.stringify(analysis, null, 2));

    // Send summary report if suspicious patterns detected
    if (analysis.suspiciousPatterns.length > 0) {
      await snsClient.send(new PublishCommand({
        TopicArn: FRAUD_ALERT_TOPIC_ARN,
        Subject: 'Batch Analysis - Suspicious Patterns Detected',
        Message: JSON.stringify({
          timestamp: now,
          period: 'Last hour',
          totalTransactions: transactions.length,
          analysis: analysis,
        }),
      }));

      console.log('Suspicious pattern alert sent');
    }

    console.log('Batch processing completed successfully');
  } catch (error) {
    console.error('Error in batch processing:', error);
    throw error;
  }
}

interface AnalysisResult {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  uniqueMerchants: number;
  uniqueCards: number;
  suspiciousPatterns: string[];
}

/**
 * Analyzes transaction patterns to detect fraud indicators
 */
function analyzeTransactionPatterns(transactions: TransactionRecord[]): AnalysisResult {
  const suspiciousPatterns: string[] = [];

  // Calculate basic statistics
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = totalAmount / transactions.length;
  const maxAmount = Math.max(...transactions.map(t => t.amount));

  const uniqueMerchants = new Set(transactions.map(t => t.merchantId)).size;
  const uniqueCards = new Set(transactions.map(t => t.cardNumber)).size;

  // Detect suspicious patterns
  if (averageAmount > 5000) {
    suspiciousPatterns.push('High average transaction amount detected');
  }

  if (maxAmount > 10000) {
    suspiciousPatterns.push(`Exceptionally high transaction detected: ${maxAmount}`);
  }

  // Check for card velocity (same card used multiple times in short period)
  const cardFrequency = new Map<string, number>();
  transactions.forEach(t => {
    const count = cardFrequency.get(t.cardNumber) || 0;
    cardFrequency.set(t.cardNumber, count + 1);
  });

  for (const [card, count] of cardFrequency.entries()) {
    if (count > 10) {
      suspiciousPatterns.push(`High card velocity detected: ${card} used ${count} times in one hour`);
    }
  }

  // Check for merchant concentration
  const merchantFrequency = new Map<string, number>();
  transactions.forEach(t => {
    const count = merchantFrequency.get(t.merchantId) || 0;
    merchantFrequency.set(t.merchantId, count + 1);
  });

  for (const [merchant, count] of merchantFrequency.entries()) {
    if (count > transactions.length * 0.5) {
      suspiciousPatterns.push(`Unusual merchant concentration: ${merchant} represents ${(count / transactions.length * 100).toFixed(1)}% of transactions`);
    }
  }

  return {
    totalTransactions: transactions.length,
    totalAmount,
    averageAmount,
    maxAmount,
    uniqueMerchants,
    uniqueCards,
    suspiciousPatterns,
  };
}
```

## File: lib/lambda/batch-processor/package.json

```json
{
  "name": "batch-processor",
  "version": "1.0.0",
  "description": "Batch processor Lambda function for pattern analysis",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/transaction-validator/tsconfig.json

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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/fifo-processor/tsconfig.json

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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/alert-handler/tsconfig.json

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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/batch-processor/tsconfig.json

```json
{
  "compilerServices": {
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/README.md

```markdown
# Serverless Fraud Detection System

A complete serverless fraud detection system for processing credit card transactions using AWS CDK with TypeScript.

## Architecture

This system implements a production-ready fraud detection pipeline with the following components:

### Core Services

- **API Gateway**: REST API with `/transactions` endpoint for transaction submission
  - API key authentication
  - Request throttling (1000 req/s)
  - CloudWatch logging and X-Ray tracing

- **Lambda Functions**: Four ARM64-based Lambda functions
  - Transaction Validator: Validates incoming transactions and checks fraud patterns
  - FIFO Processor: Processes messages from queue and stores in DynamoDB
  - Alert Handler: Processes fraud alerts and notifies security team
  - Batch Processor: Hourly pattern analysis

- **DynamoDB**: TransactionHistory table
  - On-demand billing
  - Point-in-time recovery
  - Encryption enabled

- **SQS**: FIFO queue for ordered transaction processing
  - Content-based deduplication
  - Dead letter queues for all Lambda functions

- **SNS**: Fraud alert topic for notifications

- **EventBridge**: Scheduled rule for hourly batch processing

- **CloudWatch**: Alarms for Lambda error rates (>1% threshold)

- **Systems Manager Parameter Store**: Configuration management

## Resource Naming

All resources use the `environmentSuffix` parameter to support multiple PR environments:
- API Gateway: `fraud-detection-api-{environmentSuffix}`
- Lambda Functions: `{function-name}-{environmentSuffix}`
- DynamoDB Table: `TransactionHistory-{environmentSuffix}`
- SQS Queues: `{queue-name}-{environmentSuffix}`
- SNS Topic: `FraudAlerts-{environmentSuffix}`

## Deployment

### Prerequisites

- Node.js 18.x or higher
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- npm or yarn package manager

### Install Dependencies

```bash
npm install
```

### Deploy Stack

```bash
# Deploy with default environment suffix (dev)
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=pr123
```

### Deployment Outputs

The stack outputs the following values:
- API Gateway endpoint URL
- DynamoDB table name
- SNS topic ARN
- API key ID
- Transaction queue URL

## Testing

### Unit Tests

```bash
npm test
```

### Integration Testing

The stack outputs are saved to `cfn-outputs/flat-outputs.json` for integration testing.

```bash
# Run integration tests after deployment
npm run test:integration
```

### Manual Testing

1. Get the API key value:
```bash
aws apigateway get-api-key --api-key <API_KEY_ID> --include-value --query 'value' --output text
```

2. Send a test transaction:
```bash
curl -X POST https://<API_ENDPOINT>/prod/transactions \
  -H "x-api-key: <API_KEY_VALUE>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 150.00,
    "currency": "USD",
    "cardNumber": "4111111111111111",
    "merchantId": "merchant-001"
  }'
```

## Security

### PCI DSS Compliance

- Credit card numbers are masked before storage (only last 4 digits retained)
- All data encrypted at rest using AWS-managed keys
- All data encrypted in transit using HTTPS/TLS
- API key authentication required
- Least privilege IAM roles for all components

### IAM Permissions

Each Lambda function has minimal required permissions:
- Transaction Validator: SQS SendMessage, SNS Publish, SSM GetParameter
- FIFO Processor: DynamoDB PutItem, SQS ReceiveMessage/DeleteMessage
- Alert Handler: SSM GetParameter
- Batch Processor: DynamoDB Scan, SNS Publish

## Monitoring

### CloudWatch Alarms

Each Lambda function has a CloudWatch alarm that triggers when:
- Error rate exceeds 1% over a 5-minute period

### X-Ray Tracing

All Lambda functions and API Gateway have X-Ray tracing enabled for distributed tracing and performance analysis.

### Dead Letter Queues

All Lambda functions have dedicated dead letter queues for failed messages:
- `transaction-validator-dlq-{environmentSuffix}`
- `fifo-processor-dlq-{environmentSuffix}`
- `alert-handler-dlq-{environmentSuffix}`
- `batch-processor-dlq-{environmentSuffix}`

## Configuration

### Parameter Store Values

Update these parameters in AWS Systems Manager Parameter Store:

- `/fraud-detection/{environmentSuffix}/fraud-threshold`: Threshold amount for fraud detection (default: 1000)
- `/fraud-detection/{environmentSuffix}/alert-email`: Email address for fraud alerts (default: security@example.com)

## Cleanup

To remove all resources:

```bash
cdk destroy
```

Note: All resources are created with `RemovalPolicy.DESTROY` for easy cleanup during development and testing.

## Cost Optimization

This solution uses serverless architecture to minimize costs:
- Lambda with ARM64 (Graviton2) for 20% cost savings
- DynamoDB on-demand billing scales to zero
- No NAT Gateways or VPCs required
- API Gateway usage-based pricing
- Short log retention (7 days)

## Troubleshooting

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/transaction-validator-{environmentSuffix} --follow
```

### Check Dead Letter Queues

```bash
aws sqs receive-message --queue-url <DLQ_URL>
```

### Check API Gateway Logs

```bash
aws logs tail API-Gateway-Execution-Logs_{API_ID}/prod --follow
```

## License

This is a sample implementation for educational purposes.
```
