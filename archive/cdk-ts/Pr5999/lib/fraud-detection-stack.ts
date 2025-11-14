import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
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
    const fraudThresholdParam = new ssm.StringParameter(
      this,
      `FraudThresholdParam-${environmentSuffix}`,
      {
        parameterName: `/fraud-detection/${environmentSuffix}/fraud-threshold`,
        stringValue: '1000',
        description: 'Fraud detection threshold amount',
      }
    );

    const alertEmailParam = new ssm.StringParameter(
      this,
      `AlertEmailParam-${environmentSuffix}`,
      {
        parameterName: `/fraud-detection/${environmentSuffix}/alert-email`,
        stringValue: 'security@example.com',
        description: 'Email address for fraud alerts',
      }
    );

    // Create DynamoDB table for transaction history
    const transactionTable = new dynamodb.Table(
      this,
      `TransactionHistory-${environmentSuffix}`,
      {
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
      }
    );

    // Create SNS topic for fraud alerts
    const fraudAlertTopic = new sns.Topic(
      this,
      `FraudAlerts-${environmentSuffix}`,
      {
        topicName: `FraudAlerts-${environmentSuffix}`,
        displayName: 'Fraud Detection Alerts',
      }
    );

    // Create SQS FIFO queue for transaction processing
    const transactionQueue = new sqs.Queue(
      this,
      `TransactionQueue-${environmentSuffix}`,
      {
        queueName: `TransactionQueue-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        visibilityTimeout: cdk.Duration.minutes(6),
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    // Create dead letter queues for each Lambda function
    const validatorDLQ = new sqs.Queue(
      this,
      `ValidatorDLQ-${environmentSuffix}`,
      {
        queueName: `transaction-validator-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    const processorDLQ = new sqs.Queue(
      this,
      `ProcessorDLQ-${environmentSuffix}`,
      {
        queueName: `fifo-processor-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    const alertHandlerDLQ = new sqs.Queue(
      this,
      `AlertHandlerDLQ-${environmentSuffix}`,
      {
        queueName: `alert-handler-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    const batchProcessorDLQ = new sqs.Queue(
      this,
      `BatchProcessorDLQ-${environmentSuffix}`,
      {
        queueName: `batch-processor-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    // Lambda function for transaction validation
    const transactionValidator = new lambda.Function(
      this,
      `TransactionValidator-${environmentSuffix}`,
      {
        functionName: `transaction-validator-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/transaction-validator'),
        memorySize: 1024,
        timeout: cdk.Duration.minutes(5),
        tracing: lambda.Tracing.ACTIVE,
        deadLetterQueue: validatorDLQ,
        environment: {
          TRANSACTION_QUEUE_URL: transactionQueue.queueUrl,
          FRAUD_ALERT_TOPIC_ARN: fraudAlertTopic.topicArn,
          FRAUD_THRESHOLD_PARAM: fraudThresholdParam.parameterName,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to transaction validator
    transactionQueue.grantSendMessages(transactionValidator);
    fraudAlertTopic.grantPublish(transactionValidator);
    fraudThresholdParam.grantRead(transactionValidator);
    transactionValidator.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Lambda function for FIFO queue processing
    const fifoProcessor = new lambda.Function(
      this,
      `FIFOProcessor-${environmentSuffix}`,
      {
        functionName: `fifo-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/fifo-processor'),
        memorySize: 512,
        timeout: cdk.Duration.minutes(5),
        tracing: lambda.Tracing.ACTIVE,
        deadLetterQueue: processorDLQ,
        environment: {
          TRANSACTION_TABLE_NAME: transactionTable.tableName,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Add SQS event source to FIFO processor
    fifoProcessor.addEventSource(
      new lambda_event_sources.SqsEventSource(transactionQueue, {
        batchSize: 10,
      })
    );

    // Grant permissions to FIFO processor
    transactionTable.grantWriteData(fifoProcessor);
    transactionQueue.grantConsumeMessages(fifoProcessor);
    fifoProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Lambda function for fraud alert handling
    const alertHandler = new lambda.Function(
      this,
      `AlertHandler-${environmentSuffix}`,
      {
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
      }
    );

    // Subscribe alert handler to SNS topic
    fraudAlertTopic.addSubscription(
      new subscriptions.LambdaSubscription(alertHandler)
    );

    // Grant permissions to alert handler
    alertEmailParam.grantRead(alertHandler);
    alertHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Lambda function for batch processing
    const batchProcessor = new lambda.Function(
      this,
      `BatchProcessor-${environmentSuffix}`,
      {
        functionName: `batch-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/batch-processor'),
        memorySize: 512,
        timeout: cdk.Duration.minutes(5),
        tracing: lambda.Tracing.ACTIVE,
        deadLetterQueue: batchProcessorDLQ,
        environment: {
          TRANSACTION_TABLE_NAME: transactionTable.tableName,
          FRAUD_ALERT_TOPIC_ARN: fraudAlertTopic.topicArn,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to batch processor
    transactionTable.grantReadData(batchProcessor);
    fraudAlertTopic.grantPublish(batchProcessor);
    batchProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Create EventBridge rule for hourly batch processing
    const batchProcessingRule = new events.Rule(
      this,
      `BatchProcessingRule-${environmentSuffix}`,
      {
        ruleName: `batch-processing-${environmentSuffix}`,
        description: 'Triggers batch processing Lambda every hour',
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '*',
        }),
      }
    );

    batchProcessingRule.addTarget(new targets.LambdaFunction(batchProcessor));

    // Create API Gateway REST API
    const api = new apigateway.RestApi(
      this,
      `FraudDetectionAPI-${environmentSuffix}`,
      {
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
      }
    );

    // Create API key
    const apiKey = new apigateway.ApiKey(
      this,
      `FraudDetectionAPIKey-${environmentSuffix}`,
      {
        apiKeyName: `fraud-detection-key-${environmentSuffix}`,
        description: 'API key for fraud detection system',
      }
    );

    // Create usage plan
    const usagePlan = new apigateway.UsagePlan(
      this,
      `FraudDetectionUsagePlan-${environmentSuffix}`,
      {
        name: `fraud-detection-usage-plan-${environmentSuffix}`,
        description: 'Usage plan for fraud detection API',
        throttle: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
      }
    );

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Create /transactions resource
    const transactions = api.root.addResource('transactions');

    // Create POST method with API key requirement
    transactions.addMethod(
      'POST',
      new apigateway.LambdaIntegration(transactionValidator, {
        proxy: true,
      }),
      {
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
      }
    );

    // Grant API Gateway permission to invoke Lambda
    transactionValidator.grantInvoke(
      new iam.ServicePrincipal('apigateway.amazonaws.com', {
        conditions: {
          ArnLike: {
            'aws:SourceArn': `arn:aws:execute-api:${stack.region}:${stack.account}:${api.restApiId}/*/*`,
          },
        },
      })
    );

    // Create CloudWatch alarms for Lambda functions
    this.createLambdaAlarm(
      transactionValidator,
      environmentSuffix,
      'TransactionValidator'
    );
    this.createLambdaAlarm(fifoProcessor, environmentSuffix, 'FIFOProcessor');
    this.createLambdaAlarm(alertHandler, environmentSuffix, 'AlertHandler');
    this.createLambdaAlarm(batchProcessor, environmentSuffix, 'BatchProcessor');

    // Stack outputs
    this.apiEndpoint = new cdk.CfnOutput(
      stack,
      `ApiEndpoint-${environmentSuffix}`,
      {
        value: api.url,
        description: 'API Gateway endpoint URL',
        exportName: `FraudDetectionApiEndpoint-${environmentSuffix}`,
      }
    );

    this.tableNameOutput = new cdk.CfnOutput(
      stack,
      `TableName-${environmentSuffix}`,
      {
        value: transactionTable.tableName,
        description: 'DynamoDB table name',
        exportName: `TransactionTableName-${environmentSuffix}`,
      }
    );

    this.topicArnOutput = new cdk.CfnOutput(
      stack,
      `TopicArn-${environmentSuffix}`,
      {
        value: fraudAlertTopic.topicArn,
        description: 'SNS topic ARN',
        exportName: `FraudAlertTopicArn-${environmentSuffix}`,
      }
    );

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

    const alarm = new cloudwatch.Alarm(
      this,
      `${functionType}ErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `${functionType}-error-rate-${environmentSuffix}`,
        alarmDescription: `${functionType} error rate exceeds 1% over 5 minutes`,
        metric: errorRate,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    return alarm;
  }
}
