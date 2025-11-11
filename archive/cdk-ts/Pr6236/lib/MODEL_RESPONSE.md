# Serverless Transaction Processing System

Complete AWS CDK TypeScript implementation for serverless transaction processing with fraud detection and audit logging.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Lambda Layer with AWS SDK v3 and validation libraries
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'layer')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'AWS SDK v3 and validation libraries',
    });

    // DynamoDB Table for transactions
    const transactionTable = new dynamodb.Table(this, 'TransactionTable', {
      tableName: `TransactionTable-${environmentSuffix}`,
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Dead Letter Queue
    const dlq = new sqs.Queue(this, 'TransactionDLQ', {
      queueName: `transaction-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // SQS Queue for audit processing
    const auditQueue = new sqs.Queue(this, 'TransactionQueue', {
      queueName: `transaction-queue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // S3 Bucket for transaction reports
    const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      bucketName: `transaction-reports-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-old-reports',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // Process Transaction Lambda
    const processTransactionFn = new lambda.Function(this, 'ProcessTransaction', {
      functionName: `processTransaction-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'processTransaction')),
      layers: [sharedLayer],
      environment: {
        TABLE_NAME: transactionTable.tableName,
        QUEUE_URL: auditQueue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: 100,
    });

    // Grant permissions to process transaction function
    transactionTable.grantWriteData(processTransactionFn);
    auditQueue.grantSendMessages(processTransactionFn);

    // CloudWatch Alarm for Lambda errors
    const processErrorAlarm = new cloudwatch.Alarm(this, 'ProcessTransactionErrorAlarm', {
      alarmName: `processTransaction-errors-${environmentSuffix}`,
      metric: processTransactionFn.metricErrors({
        statistic: 'sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Audit Transaction Lambda
    const auditTransactionFn = new lambda.Function(this, 'AuditTransaction', {
      functionName: `auditTransaction-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'auditTransaction')),
      layers: [sharedLayer],
      environment: {
        BUCKET_NAME: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
    });

    // Add SQS trigger to audit function
    auditTransactionFn.addEventSource(
      new SqsEventSource(auditQueue, {
        batchSize: 10,
      })
    );

    // Grant permissions to audit function
    reportsBucket.grantWrite(auditTransactionFn);

    // CloudWatch Alarm for audit Lambda errors
    const auditErrorAlarm = new cloudwatch.Alarm(this, 'AuditTransactionErrorAlarm', {
      alarmName: `auditTransaction-errors-${environmentSuffix}`,
      metric: auditTransactionFn.metricErrors({
        statistic: 'sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Request Validator Model
    const requestModel = new apigateway.Model(this, 'TransactionRequestModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'TransactionRequest',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['transactionId', 'amount', 'currency'],
        properties: {
          transactionId: { type: apigateway.JsonSchemaType.STRING },
          amount: { type: apigateway.JsonSchemaType.NUMBER },
          currency: { type: apigateway.JsonSchemaType.STRING },
          timestamp: { type: apigateway.JsonSchemaType.NUMBER },
          customerId: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TransactionApi', {
      restApiName: `transaction-api-${environmentSuffix}`,
      description: 'Transaction Processing API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
      deployOptions: {
        throttlingBurstLimit: 10000,
        throttlingRateLimit: 5000,
      },
    });

    // API Gateway Request Validator
    const validator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: api,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    // /transactions resource
    const transactions = api.root.addResource('transactions');

    // POST /transactions endpoint
    transactions.addMethod(
      'POST',
      new apigateway.LambdaIntegration(processTransactionFn, {
        proxy: true,
      }),
      {
        requestValidator: validator,
        requestModels: {
          'application/json': requestModel,
        },
      }
    );

    // EventBridge Rule for daily summaries
    const dailySummaryRule = new events.Rule(this, 'DailySummaryRule', {
      ruleName: `daily-summary-${environmentSuffix}`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
      }),
    });

    // Daily Summary Lambda
    const dailySummaryFn = new lambda.Function(this, 'DailySummary', {
      functionName: `dailySummary-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'dailySummary')),
      environment: {
        TABLE_NAME: transactionTable.tableName,
        BUCKET_NAME: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Add target to EventBridge rule
    dailySummaryRule.addTarget(new targets.LambdaFunction(dailySummaryFn));

    // Grant permissions to daily summary function
    transactionTable.grantReadData(dailySummaryFn);
    reportsBucket.grantWrite(dailySummaryFn);

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Transaction API URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: transactionTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: auditQueue.queueUrl,
      description: 'SQS Queue URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: reportsBucket.bucketName,
      description: 'S3 Bucket for Reports',
    });
  }
}
```

## File: lib/lambda/processTransaction/index.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const dynamodb = new DynamoDBClient({});
const sqs = new SQSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    const transaction = {
      transactionId: body.transactionId,
      timestamp: body.timestamp || Date.now(),
      amount: body.amount,
      currency: body.currency,
      customerId: body.customerId,
      status: 'processed',
    };

    // Store in DynamoDB
    await dynamodb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          transactionId: { S: transaction.transactionId },
          timestamp: { N: transaction.timestamp.toString() },
          amount: { N: transaction.amount.toString() },
          currency: { S: transaction.currency },
          customerId: { S: transaction.customerId },
          status: { S: transaction.status },
        },
      })
    );

    // Send to audit queue
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(transaction),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction processed successfully',
        transactionId: transaction.transactionId,
      }),
    };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process transaction',
      }),
    };
  }
};
```

## File: lib/lambda/auditTransaction/index.ts

```typescript
import { SQSEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);

      const auditLog = {
        ...transaction,
        auditedAt: Date.now(),
        messageId: record.messageId,
      };

      const key = `audit/${transaction.transactionId}-${Date.now()}.json`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: JSON.stringify(auditLog, null, 2),
          ContentType: 'application/json',
        })
      );

      console.log(`Audit log created: ${key}`);
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }
};
```

## File: lib/lambda/dailySummary/index.ts

```typescript
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (): Promise<void> => {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#ts > :yesterday',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':yesterday': { N: oneDayAgo.toString() },
        },
      })
    );

    const transactions = result.Items || [];
    const summary = {
      date: new Date().toISOString().split('T')[0],
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, item) => {
        return sum + parseFloat(item.amount?.N || '0');
      }, 0),
      generatedAt: Date.now(),
    };

    const key = `summaries/daily-${summary.date}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(summary, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(`Daily summary created: ${key}`);
  } catch (error) {
    console.error('Error generating daily summary:', error);
    throw error;
  }
};
```

## File: lib/lambda/layer/nodejs/package.json

```json
{
  "name": "shared-layer",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda functions",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-sqs": "^3.400.0"
  }
}
```