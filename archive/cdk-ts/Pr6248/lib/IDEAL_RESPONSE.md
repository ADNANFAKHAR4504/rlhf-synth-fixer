# TapStack Infrastructure Code

## Complete lib/tap-stack.ts Implementation

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import * as logs from 'aws-cdk-lib/aws-logs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Apply stack tags
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('CostCenter', 'payments');

    // SSM Parameters for configuration
    const maxAmountParam = new ssm.StringParameter(this, 'MaxAmountParam', {
      parameterName: `/payments/${environmentSuffix}/max-amount`,
      stringValue: '10000',
      description: 'Maximum transaction amount allowed',
    });

    const supportedCurrenciesParam = new ssm.StringParameter(
      this,
      'SupportedCurrenciesParam',
      {
        parameterName: `/payments/${environmentSuffix}/supported-currencies`,
        stringValue: 'USD,EUR,GBP',
        description: 'Comma-separated list of supported currencies',
      }
    );

    const highValueThresholdParam = new ssm.StringParameter(
      this,
      'HighValueThresholdParam',
      {
        parameterName: `/payments/${environmentSuffix}/high-value-threshold`,
        stringValue: '5000',
        description: 'Threshold for high-value transaction notifications',
      }
    );

    // DynamoDB Table for valid transactions
    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: `transactions-${environmentSuffix}`,
      partitionKey: {
        name: 'transaction_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SQS DLQ for invalid transactions
    const invalidTransactionsDlq = new sqs.Queue(
      this,
      'InvalidTransactionsDLQ',
      {
        queueName: `invalid-transactions-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    // SQS Queue for invalid transactions
    const invalidTransactionsQueue = new sqs.Queue(
      this,
      'InvalidTransactionsQueue',
      {
        queueName: `invalid-transactions-${environmentSuffix}`,
        visibilityTimeout: cdk.Duration.minutes(5),
        deadLetterQueue: {
          maxReceiveCount: 3,
          queue: invalidTransactionsDlq,
        },
      }
    );

    // SNS Topic for compliance notifications
    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `compliance-notifications-${environmentSuffix}`,
      displayName: 'Compliance Notifications for High-Value Transactions',
    });

    // Create log groups with 7-day retention
    const validationLogGroup = new logs.LogGroup(this, 'ValidationLogGroup', {
      logGroupName: `/aws/lambda/transaction-validator-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Transaction validation Lambda function
    const validationLambda = new lambda.Function(this, 'ValidationLambda', {
      functionName: `transaction-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/validation')),
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: 100,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: validationLogGroup,
      environment: {
        TRANSACTIONS_TABLE: transactionsTable.tableName,
        INVALID_QUEUE_URL: invalidTransactionsQueue.queueUrl,
        COMPLIANCE_TOPIC_ARN: complianceTopic.topicArn,
        MAX_AMOUNT_PARAM: maxAmountParam.parameterName,
        SUPPORTED_CURRENCIES_PARAM: supportedCurrenciesParam.parameterName,
        HIGH_VALUE_THRESHOLD_PARAM: highValueThresholdParam.parameterName,
      },
    });

    // Grant permissions to validation Lambda
    transactionsTable.grantWriteData(validationLambda);
    invalidTransactionsQueue.grantSendMessages(validationLambda);
    complianceTopic.grantPublish(validationLambda);
    maxAmountParam.grantRead(validationLambda);
    supportedCurrenciesParam.grantRead(validationLambda);
    highValueThresholdParam.grantRead(validationLambda);

    // Review processing DLQ
    const reviewProcessingDlq = new sqs.Queue(this, 'ReviewProcessingDLQ', {
      queueName: `review-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create log group for review Lambda
    const reviewLogGroup = new logs.LogGroup(this, 'ReviewLogGroup', {
      logGroupName: `/aws/lambda/review-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Review processing Lambda function
    const reviewLambda = new lambda.Function(this, 'ReviewLambda', {
      functionName: `review-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/review')),
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      logGroup: reviewLogGroup,
      deadLetterQueue: reviewProcessingDlq,
      environment: {
        ENVIRONMENT: environmentSuffix,
      },
    });

    // Add SQS event source to review Lambda
    reviewLambda.addEventSource(
      new SqsEventSource(invalidTransactionsQueue, {
        batchSize: 10,
      })
    );

    // Grant review Lambda permission to receive messages
    invalidTransactionsQueue.grantConsumeMessages(reviewLambda);

    // CloudWatch Alarms for Lambda errors
    const validationErrorAlarm = new cloudwatch.Alarm(
      this,
      'ValidationErrorAlarm',
      {
        alarmName: `validation-lambda-errors-${environmentSuffix}`,
        metric: validationLambda.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    validationErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(complianceTopic)
    );

    const reviewErrorAlarm = new cloudwatch.Alarm(this, 'ReviewErrorAlarm', {
      alarmName: `review-lambda-errors-${environmentSuffix}`,
      metric: reviewLambda.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    reviewErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(complianceTopic)
    );

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'PaymentAPI', {
      restApiName: `payment-api-${environmentSuffix}`,
      description: 'Payment Processing API',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true,
    });

    // Request model for transaction validation
    const transactionModel = api.addModel('TransactionModel', {
      contentType: 'application/json',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['amount', 'currency', 'card_token'],
        properties: {
          amount: { type: apigateway.JsonSchemaType.NUMBER },
          currency: { type: apigateway.JsonSchemaType.STRING },
          card_token: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    // Request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        requestValidatorName: 'transaction-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // /transactions resource
    const transactions = api.root.addResource('transactions');

    // POST method with Lambda integration
    transactions.addMethod(
      'POST',
      new apigateway.LambdaIntegration(validationLambda),
      {
        apiKeyRequired: true,
        requestValidator,
        requestModels: {
          'application/json': transactionModel,
        },
      }
    );

    // Usage plan
    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `payment-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000,
        period: apigateway.Period.DAY,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // API Key
    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: `payment-api-key-${environmentSuffix}`,
    });

    usagePlan.addApiKey(apiKey);

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
    });

    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'DynamoDB table for transactions',
    });

    new cdk.CfnOutput(this, 'InvalidQueueUrl', {
      value: invalidTransactionsQueue.queueUrl,
      description: 'SQS queue URL for invalid transactions',
    });

    new cdk.CfnOutput(this, 'ComplianceTopicArn', {
      value: complianceTopic.topicArn,
      description: 'SNS topic ARN for compliance notifications',
    });

    new cdk.CfnOutput(this, 'ValidationLambdaArn', {
      value: validationLambda.functionArn,
      description: 'Validation Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'ReviewLambdaArn', {
      value: reviewLambda.functionArn,
      description: 'Review Lambda function ARN',
    });
  }
}
```

## Infrastructure Components

This AWS CDK stack defines a payment processing infrastructure with the following components:

### Core Services
- **SSM Parameters**: Configuration parameters for transaction limits, supported currencies, and high-value thresholds
- **DynamoDB Table**: Stores valid transactions with partition key (transaction_id) and sort key (timestamp)
- **SQS Queues**: Handles invalid transactions with dead letter queue (DLQ) support
- **SNS Topic**: Sends compliance notifications for high-value transactions

### Lambda Functions
- **Validation Lambda**: Processes and validates incoming transactions
  - Runtime: Node.js 18.x
  - Reserved concurrency: 100
  - X-Ray tracing enabled
  - Environment variables for table names, queue URLs, and parameter names

- **Review Lambda**: Processes invalid transactions from SQS queue
  - Batch size: 10 messages
  - Dead letter queue configured
  - X-Ray tracing enabled

### API Gateway
- REST API with request validation
- `/transactions` POST endpoint
- API key authentication required
- Usage plan with rate limiting (1000 requests/day, 1000 TPS rate limit)
- Request model validation for transaction data

### Monitoring & Logging
- CloudWatch Log Groups with 7-day retention
- CloudWatch Alarms for Lambda errors
- SNS notifications for alarm triggers
- Full request/response logging in API Gateway

### Security Features
- IAM permissions using least privilege principle
- API key required for all requests
- Request validation at API Gateway level
- Environment-specific resource naming
- Stack-level tagging for cost allocation

### Stack Outputs
The stack exports the following outputs for use by other stacks or applications:
- API endpoint URL
- API key ID
- DynamoDB table name
- SQS queue URL
- SNS topic ARN
- Lambda function ARNs
