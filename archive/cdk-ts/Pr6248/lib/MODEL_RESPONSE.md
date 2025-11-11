# Serverless Payment Processing System — CDK ts (Model Version)

Below is the model’s initial implementation for the TapStack infrastructure. It provisions API Gateway, multiple Lambda functions, DynamoDB, SQS/SNS integrations, and all required monitoring. The snippets highlight the key files inside `lib/`.

> ⚠️ This version contains a couple of mistakes that were later fixed in `IDEAL_RESPONSE.md`. See `MODEL_FAILURES.md` for details.

---

## `lib/tap-stack.ts`

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

    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('CostCenter', 'payments');

    const maxAmountParam = new ssm.StringParameter(this, 'MaxAmountParam', {
      parameterName: `/payments/${environmentSuffix}/max-amount`,
      stringValue: '10000',
    });

    const supportedCurrenciesParam = new ssm.StringParameter(
      this,
      'SupportedCurrenciesParam',
      {
        parameterName: `/payments/${environmentSuffix}/supported-currencies`,
        stringValue: 'USD,EUR,GBP',
      }
    );

    const highValueThresholdParam = new ssm.StringParameter(
      this,
      'HighValueThresholdParam',
      {
        parameterName: `/payments/${environmentSuffix}/high-value-threshold`,
        stringValue: '5000',
      }
    );

    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: `transactions-${environmentSuffix}`,
      partitionKey: { name: 'transaction_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type:dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const invalidTransactionsDlq = new sqs.Queue(
      this,
      'InvalidTransactionsDLQ',
      {
        queueName: `invalid-transactions-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

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

    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `compliance-notifications-${environmentSuffix}`,
    });

    const validationLogGroup = new logs.LogGroup(this, 'ValidationLogGroup', {
      logGroupName: `/aws/lambda/transaction-validator-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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

    transactionsTable.grantWriteData(validationLambda);
    invalidTransactionsQueue.grantSendMessages(validationLambda);
    // ❌ Missing grantPublish on the compliance topic here (fixed in IDEAL_RESPONSE)
    maxAmountParam.grantRead(validationLambda);
    supportedCurrenciesParam.grantRead(validationLambda);
    highValueThresholdParam.grantRead(validationLambda);

    const reviewProcessingDlq = new sqs.Queue(this, 'ReviewProcessingDLQ', {
      queueName: `review-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const reviewLogGroup = new logs.LogGroup(this, 'ReviewLogGroup', {
      logGroupName: `/aws/lambda/review-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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

    reviewLambda.addEventSource(
      new SqsEventSource(invalidTransactionsQueue, {
        batchSize: 10,
      })
    );

    invalidTransactionsQueue.grantConsumeMessages(reviewLambda);

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

    const transactions = api.root.addResource('transactions');

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

    usagePlan.addApiStage({ stage: api.deploymentStage });

    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: `payment-api-key-${environmentSuffix}`,
    });

    usagePlan.addApiKey(apiKey);

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}
```

---

## `lib/lambda/validation/index.js`

```js
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamodb = new DynamoDBClient({});
const sqs = new SQSClient({});
const sns = new SNSClient({});
const ssm = new SSMClient({});

let cachedParams = {};

async function getParameter(name) {
  if (cachedParams[name]) {
    return cachedParams[name];
  }
  const response = await ssm.send(new GetParameterCommand({ Name: name }));
  cachedParams[name] = response.Parameter.Value;
  return cachedParams[name];
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { amount, currency, card_token } = body;

    const maxAmount = parseFloat(await getParameter(process.env.MAX_AMOUNT_PARAM));
    const supportedCurrencies = (await getParameter(process.env.SUPPORTED_CURRENCIES_PARAM)).split(',');
    const highValueThreshold = parseFloat(await getParameter(process.env.HIGH_VALUE_THRESHOLD_PARAM));

    const isValid = amount < maxAmount && supportedCurrencies.includes(currency);
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const timestamp = new Date().toISOString();

    if (isValid) {
      await dynamodb.send(new PutItemCommand({
        TableName: process.env.TRANSACTIONS_TABLE,
        Item: marshall({
          transaction_id: transactionId,
          timestamp,
          amount,
          currency,
          card_token,
          status: 'valid',
        }),
      }));

      if (amount > highValueThreshold) {
        await sns.send(new PublishCommand({
          TopicArn: process.env.COMPLIANCE_TOPIC_ARN,
          Subject: 'High-Value Transaction Alert',
          Message: `Transaction ${transactionId} of ${amount} ${currency} exceeds ${highValueThreshold}`,
        }));
      }

      return { statusCode: 200, body: JSON.stringify({ transactionId }) };
    }

    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.INVALID_QUEUE_URL,
      MessageBody: JSON.stringify({
        transactionId,
        timestamp,
        amount,
        currency,
        card_token,
        reason: amount >= maxAmount ? 'Amount exceeds limit' : 'Unsupported currency',
      }),
    }));

    return { statusCode: 400, body: JSON.stringify({ transactionId }) };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};
```

---

## `lib/TapStack.json` (Target Group excerpt)

```json
{
  "Resources": {
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "tg-${EnvironmentSuffix}" },
        "Port": 80,
        "Protocol": "HTTP",
        "TargetType": "ip",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5
      }
    }
  }
}
```

This JSON excerpt shows how the model configured the ALB target group. The health check path was later corrected in the ideal implementation.
