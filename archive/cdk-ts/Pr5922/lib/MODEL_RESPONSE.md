# Event-Driven Transaction Processing Pipeline - Initial Implementation

This implementation creates a complete event-driven transaction processing pipeline using AWS CDK with TypeScript.

## File: lib/transaction-processing-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface TransactionProcessingStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TransactionProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TransactionProcessingStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // DynamoDB Table for Transaction State
    const transactionTable = new dynamodb.Table(this, 'TransactionTable', {
      tableName: `transaction-state-${environmentSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for incoming transactions
    const transactionTopic = new sns.Topic(this, 'TransactionTopic', {
      topicName: `transaction-topic-${environmentSuffix}`,
      displayName: 'Transaction Processing Topic',
      masterKey: undefined, // Use AWS managed keys
    });

    // Dead Letter Queues
    const validationDLQ = new sqs.Queue(this, 'ValidationDLQ', {
      queueName: `validation-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const enrichmentDLQ = new sqs.Queue(this, 'EnrichmentDLQ', {
      queueName: `enrichment-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const highValueDLQ = new sqs.Queue(this, 'HighValueDLQ', {
      queueName: `high-value-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const standardValueDLQ = new sqs.Queue(this, 'StandardValueDLQ', {
      queueName: `standard-value-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const lowValueDLQ = new sqs.Queue(this, 'LowValueDLQ', {
      queueName: `low-value-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Lambda timeout constant
    const lambdaTimeout = cdk.Duration.seconds(30);
    const sqsVisibilityTimeout = cdk.Duration.seconds(180); // 6 times Lambda timeout

    // Validation Queue
    const validationQueue = new sqs.Queue(this, 'ValidationQueue', {
      queueName: `validation-queue-${environmentSuffix}`,
      visibilityTimeout: sqsVisibilityTimeout,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: validationDLQ,
        maxReceiveCount: 3,
      },
    });

    // Enrichment Queue
    const enrichmentQueue = new sqs.Queue(this, 'EnrichmentQueue', {
      queueName: `enrichment-queue-${environmentSuffix}`,
      visibilityTimeout: sqsVisibilityTimeout,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: enrichmentDLQ,
        maxReceiveCount: 3,
      },
    });

    // Value-based Queues
    const highValueQueue = new sqs.Queue(this, 'HighValueQueue', {
      queueName: `high-value-queue-${environmentSuffix}`,
      visibilityTimeout: sqsVisibilityTimeout,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: highValueDLQ,
        maxReceiveCount: 3,
      },
    });

    const standardValueQueue = new sqs.Queue(this, 'StandardValueQueue', {
      queueName: `standard-value-queue-${environmentSuffix}`,
      visibilityTimeout: sqsVisibilityTimeout,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: standardValueDLQ,
        maxReceiveCount: 3,
      },
    });

    const lowValueQueue = new sqs.Queue(this, 'LowValueQueue', {
      queueName: `low-value-queue-${environmentSuffix}`,
      visibilityTimeout: sqsVisibilityTimeout,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: lowValueDLQ,
        maxReceiveCount: 3,
      },
    });

    // Lambda Destination Queues
    const successQueue = new sqs.Queue(this, 'SuccessQueue', {
      queueName: `success-destination-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const failureQueue = new sqs.Queue(this, 'FailureQueue', {
      queueName: `failure-destination-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Webhook Receiver Lambda
    const webhookFunction = new lambda.Function(this, 'WebhookFunction', {
      functionName: `webhook-receiver-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'webhook')),
      timeout: lambdaTimeout,
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 10,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        TOPIC_ARN: transactionTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    });

    transactionTopic.grantPublish(webhookFunction);

    // Create Function URL for webhook
    const webhookUrl = webhookFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.POST],
      },
    });

    // Transaction Validator Lambda
    const validatorFunction = new lambda.Function(this, 'ValidatorFunction', {
      functionName: `transaction-validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'validator')),
      timeout: lambdaTimeout,
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 10,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        VALIDATION_QUEUE_URL: validationQueue.queueUrl,
        TRANSACTION_TABLE: transactionTable.tableName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      onSuccess: new cdk.aws_lambda_destinations.SqsDestination(successQueue),
      onFailure: new cdk.aws_lambda_destinations.SqsDestination(failureQueue),
    });

    validationQueue.grantSendMessages(validatorFunction);
    transactionTable.grantWriteData(validatorFunction);

    // Subscribe validator to SNS topic
    transactionTopic.addSubscription(new subscriptions.LambdaSubscription(validatorFunction));

    // Enrichment Lambda
    const enrichmentFunction = new lambda.Function(this, 'EnrichmentFunction', {
      functionName: `transaction-enrichment-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'enrichment')),
      timeout: lambdaTimeout,
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 10,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        TRANSACTION_TABLE: transactionTable.tableName,
        ENRICHMENT_QUEUE_URL: enrichmentQueue.queueUrl,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      onSuccess: new cdk.aws_lambda_destinations.SqsDestination(successQueue),
      onFailure: new cdk.aws_lambda_destinations.SqsDestination(failureQueue),
    });

    enrichmentQueue.grantSendMessages(enrichmentFunction);
    transactionTable.grantReadWriteData(enrichmentFunction);

    // Add SQS trigger for enrichment
    enrichmentFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(validationQueue, {
        batchSize: 10,
      })
    );

    // Routing Lambda
    const routingFunction = new lambda.Function(this, 'RoutingFunction', {
      functionName: `transaction-routing-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'routing')),
      timeout: lambdaTimeout,
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 10,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        HIGH_VALUE_QUEUE_URL: highValueQueue.queueUrl,
        STANDARD_VALUE_QUEUE_URL: standardValueQueue.queueUrl,
        LOW_VALUE_QUEUE_URL: lowValueQueue.queueUrl,
        TRANSACTION_TABLE: transactionTable.tableName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      onSuccess: new cdk.aws_lambda_destinations.SqsDestination(successQueue),
      onFailure: new cdk.aws_lambda_destinations.SqsDestination(failureQueue),
    });

    highValueQueue.grantSendMessages(routingFunction);
    standardValueQueue.grantSendMessages(routingFunction);
    lowValueQueue.grantSendMessages(routingFunction);
    transactionTable.grantReadWriteData(routingFunction);

    // Add SQS trigger for routing
    routingFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(enrichmentQueue, {
        batchSize: 10,
      })
    );

    // CloudWatch Alarms for Queue Depth
    const createQueueAlarm = (queue: sqs.Queue, queueName: string) => {
      const alarm = new cloudwatch.Alarm(this, `${queueName}DepthAlarm`, {
        alarmName: `${queueName}-depth-${environmentSuffix}`,
        metric: queue.metricApproximateNumberOfMessagesVisible(),
        threshold: 1000,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
      return alarm;
    };

    createQueueAlarm(validationQueue, 'ValidationQueue');
    createQueueAlarm(enrichmentQueue, 'EnrichmentQueue');
    createQueueAlarm(highValueQueue, 'HighValueQueue');
    createQueueAlarm(standardValueQueue, 'StandardValueQueue');
    createQueueAlarm(lowValueQueue, 'LowValueQueue');

    // CloudWatch Alarms for Lambda Errors
    const createLambdaErrorAlarm = (fn: lambda.Function, functionName: string) => {
      const alarm = new cloudwatch.Alarm(this, `${functionName}ErrorAlarm`, {
        alarmName: `${functionName}-errors-${environmentSuffix}`,
        metric: fn.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
      return alarm;
    };

    createLambdaErrorAlarm(webhookFunction, 'WebhookFunction');
    createLambdaErrorAlarm(validatorFunction, 'ValidatorFunction');
    createLambdaErrorAlarm(enrichmentFunction, 'EnrichmentFunction');
    createLambdaErrorAlarm(routingFunction, 'RoutingFunction');

    // Outputs
    new cdk.CfnOutput(this, 'WebhookEndpointUrl', {
      value: webhookUrl.url,
      description: 'Webhook endpoint URL for receiving transactions',
      exportName: `webhook-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionTopicArn', {
      value: transactionTopic.topicArn,
      description: 'SNS Topic ARN for transactions',
      exportName: `transaction-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HighValueQueueUrl', {
      value: highValueQueue.queueUrl,
      description: 'High value queue URL',
      exportName: `high-value-queue-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'StandardValueQueueUrl', {
      value: standardValueQueue.queueUrl,
      description: 'Standard value queue URL',
      exportName: `standard-value-queue-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LowValueQueueUrl', {
      value: lowValueQueue.queueUrl,
      description: 'Low value queue URL',
      exportName: `low-value-queue-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionTableName', {
      value: transactionTable.tableName,
      description: 'DynamoDB table name for transaction state',
      exportName: `transaction-table-${environmentSuffix}`,
    });
  }
}
```

## File: lib/lambda/webhook/index.js

```javascript
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log('Received webhook event:', JSON.stringify(event));

  try {
    // Parse the incoming transaction
    const transaction = JSON.parse(event.body || '{}');

    // Add timestamp
    transaction.receivedAt = new Date().toISOString();
    transaction.transactionId = transaction.transactionId || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Publish to SNS topic
    const command = new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Message: JSON.stringify(transaction),
      Subject: 'New Transaction',
    });

    const response = await snsClient.send(command);
    console.log('Published to SNS:', response.MessageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction received',
        transactionId: transaction.transactionId,
        messageId: response.MessageId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process transaction',
        message: error.message,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
```

## File: lib/lambda/webhook/package.json

```json
{
  "name": "webhook-receiver",
  "version": "1.0.0",
  "description": "Webhook receiver for transaction processing",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sns": "^3.400.0"
  }
}
```

## File: lib/lambda/validator/index.js

```javascript
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Validator received event:', JSON.stringify(event));

  const results = [];

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.Sns.Message);
      console.log('Validating transaction:', message);

      // Validate transaction
      const validationResult = validateTransaction(message);

      if (validationResult.valid) {
        // Store in DynamoDB
        const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

        await dynamoClient.send(new PutItemCommand({
          TableName: process.env.TRANSACTION_TABLE,
          Item: {
            transactionId: { S: message.transactionId },
            status: { S: 'validated' },
            transaction: { S: JSON.stringify(message) },
            validatedAt: { S: new Date().toISOString() },
            ttl: { N: ttl.toString() },
          },
        }));

        // Send to validation queue
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: process.env.VALIDATION_QUEUE_URL,
          MessageBody: JSON.stringify({
            ...message,
            validationStatus: 'valid',
            validatedAt: new Date().toISOString(),
          }),
        }));

        results.push({ transactionId: message.transactionId, status: 'validated' });
      } else {
        console.error('Invalid transaction:', validationResult.errors);
        results.push({ transactionId: message.transactionId, status: 'invalid', errors: validationResult.errors });
      }
    } catch (error) {
      console.error('Error validating transaction:', error);
      throw error; // Let Lambda retry mechanism handle it
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results }),
  };
};

function validateTransaction(transaction) {
  const errors = [];

  if (!transaction.transactionId) {
    errors.push('Missing transactionId');
  }

  if (!transaction.amount || typeof transaction.amount !== 'number') {
    errors.push('Invalid or missing amount');
  }

  if (!transaction.currency) {
    errors.push('Missing currency');
  }

  if (!transaction.customerId) {
    errors.push('Missing customerId');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## File: lib/lambda/validator/package.json

```json
{
  "name": "transaction-validator",
  "version": "1.0.0",
  "description": "Transaction validator",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0"
  }
}
```

## File: lib/lambda/enrichment/index.js

```javascript
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Enrichment received event:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);
      console.log('Enriching transaction:', transaction);

      // Fetch customer data from DynamoDB (simulated)
      const customerData = await getCustomerData(transaction.customerId);

      // Enrich transaction
      const enrichedTransaction = {
        ...transaction,
        customerName: customerData.name,
        customerTier: customerData.tier,
        customerRiskScore: customerData.riskScore,
        enrichedAt: new Date().toISOString(),
      };

      // Update DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: process.env.TRANSACTION_TABLE,
        Key: {
          transactionId: { S: transaction.transactionId },
        },
        UpdateExpression: 'SET #status = :status, enrichedData = :data, enrichedAt = :enrichedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'enriched' },
          ':data': { S: JSON.stringify(customerData) },
          ':enrichedAt': { S: new Date().toISOString() },
        },
      }));

      // Send to enrichment queue
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.ENRICHMENT_QUEUE_URL,
        MessageBody: JSON.stringify(enrichedTransaction),
      }));

      console.log('Transaction enriched:', enrichedTransaction.transactionId);
    } catch (error) {
      console.error('Error enriching transaction:', error);
      throw error;
    }
  }

  return { statusCode: 200 };
};

async function getCustomerData(customerId) {
  // Simulated customer data lookup
  // In production, this would query the actual customer database
  return {
    customerId,
    name: `Customer ${customerId}`,
    tier: 'gold',
    riskScore: 0.2,
  };
}
```

## File: lib/lambda/enrichment/package.json

```json
{
  "name": "transaction-enrichment",
  "version": "1.0.0",
  "description": "Transaction enrichment processor",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0"
  }
}
```

## File: lib/lambda/routing/index.js

```javascript
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('Routing received event:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);
      console.log('Routing transaction:', transaction);

      // Determine target queue based on amount
      let targetQueueUrl;
      let valueCategory;

      if (transaction.amount > 10000) {
        targetQueueUrl = process.env.HIGH_VALUE_QUEUE_URL;
        valueCategory = 'high';
      } else if (transaction.amount >= 1000) {
        targetQueueUrl = process.env.STANDARD_VALUE_QUEUE_URL;
        valueCategory = 'standard';
      } else {
        targetQueueUrl = process.env.LOW_VALUE_QUEUE_URL;
        valueCategory = 'low';
      }

      // Add routing metadata
      const routedTransaction = {
        ...transaction,
        valueCategory,
        routedAt: new Date().toISOString(),
      };

      // Update DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: process.env.TRANSACTION_TABLE,
        Key: {
          transactionId: { S: transaction.transactionId },
        },
        UpdateExpression: 'SET #status = :status, valueCategory = :category, routedAt = :routedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'routed' },
          ':category': { S: valueCategory },
          ':routedAt': { S: new Date().toISOString() },
        },
      }));

      // Send to appropriate value queue
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: targetQueueUrl,
        MessageBody: JSON.stringify(routedTransaction),
      }));

      console.log(`Transaction routed to ${valueCategory} queue:`, transaction.transactionId);
    } catch (error) {
      console.error('Error routing transaction:', error);
      throw error;
    }
  }

  return { statusCode: 200 };
};
```

## File: lib/lambda/routing/package.json

```json
{
  "name": "transaction-routing",
  "version": "1.0.0",
  "description": "Transaction routing processor",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0"
  }
}
```