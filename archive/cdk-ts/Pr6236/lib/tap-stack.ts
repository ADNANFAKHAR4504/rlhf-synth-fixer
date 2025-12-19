import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
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
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Process Transaction Lambda
    const processTransactionFn = new NodejsFunction(
      this,
      'ProcessTransaction',
      {
        functionName: `processTransaction-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, 'lambda', 'processTransaction', 'index.ts'),
        layers: [sharedLayer],
        environment: {
          TABLE_NAME: transactionTable.tableName,
          QUEUE_URL: auditQueue.queueUrl,
        },
        timeout: cdk.Duration.seconds(30),
        reservedConcurrentExecutions: 100,
        bundling: {
          minify: true,
          sourceMap: false,
          target: 'es2020',
        },
      }
    );

    // Grant permissions to process transaction function
    transactionTable.grantWriteData(processTransactionFn);
    auditQueue.grantSendMessages(processTransactionFn);

    // CloudWatch Alarm for Lambda errors (threshold adjusted to >1%)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const processErrorAlarm = new cloudwatch.Alarm(
      this,
      'ProcessTransactionErrorAlarm',
      {
        alarmName: `processTransaction-errors-${environmentSuffix}`,
        metric: processTransactionFn.metricErrors({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.01,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Audit Transaction Lambda
    const auditTransactionFn = new NodejsFunction(this, 'AuditTransaction', {
      functionName: `auditTransaction-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, 'lambda', 'auditTransaction', 'index.ts'),
      layers: [sharedLayer],
      environment: {
        BUCKET_NAME: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      reservedConcurrentExecutions: 100,
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'es2020',
      },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const auditErrorAlarm = new cloudwatch.Alarm(
      this,
      'AuditTransactionErrorAlarm',
      {
        alarmName: `auditTransaction-errors-${environmentSuffix}`,
        metric: auditTransactionFn.metricErrors({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.01,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // API Gateway - FIXED: Define BEFORE using in requestModel
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

    // Request Validator Model - FIXED: Moved after API definition
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

    // API Gateway Request Validator
    const validator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

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
    const dailySummaryFn = new NodejsFunction(this, 'DailySummary', {
      functionName: `dailySummary-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, 'lambda', 'dailySummary', 'index.ts'),
      layers: [sharedLayer],
      environment: {
        TABLE_NAME: transactionTable.tableName,
        BUCKET_NAME: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'es2020',
      },
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
