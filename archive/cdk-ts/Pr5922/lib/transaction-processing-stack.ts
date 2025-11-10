import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import * as path from 'path';

interface TransactionProcessingStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TransactionProcessingStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: TransactionProcessingStackProps
  ) {
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
    transactionTopic.addSubscription(
      new subscriptions.LambdaSubscription(validatorFunction)
    );

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
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });
      return alarm;
    };

    createQueueAlarm(validationQueue, 'ValidationQueue');
    createQueueAlarm(enrichmentQueue, 'EnrichmentQueue');
    createQueueAlarm(highValueQueue, 'HighValueQueue');
    createQueueAlarm(standardValueQueue, 'StandardValueQueue');
    createQueueAlarm(lowValueQueue, 'LowValueQueue');

    // CloudWatch Alarms for Lambda Errors
    const createLambdaErrorAlarm = (
      fn: lambda.Function,
      functionName: string
    ) => {
      const alarm = new cloudwatch.Alarm(this, `${functionName}ErrorAlarm`, {
        alarmName: `${functionName}-errors-${environmentSuffix}`,
        metric: fn.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
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
