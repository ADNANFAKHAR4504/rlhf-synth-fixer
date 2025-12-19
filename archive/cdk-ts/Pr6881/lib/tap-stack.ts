import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(
      this,
      `SharedLayer-${environmentSuffix}`,
      {
        code: lambda.Code.fromAsset('lib/lambda/layers/shared'),
        compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
        description: 'Shared dependencies for stock pattern detection',
        layerVersionName: `shared-dependencies-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create DynamoDB table for trading patterns
    const patternsTable = new dynamodb.Table(
      this,
      `TradingPatternsTable-${environmentSuffix}`,
      {
        tableName: `TradingPatterns-${environmentSuffix}`,
        partitionKey: {
          name: 'patternId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create Dead Letter Queue for AlertProcessor
    const dlq = new sqs.Queue(this, `AlertDLQ-${environmentSuffix}`, {
      queueName: `alert-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(4),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SQS queue for alerts
    const alertQueue = new sqs.Queue(this, `AlertQueue-${environmentSuffix}`, {
      queueName: `AlertQueue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create SNS topic for trading alerts
    const alertTopic = new sns.Topic(
      this,
      `TradingAlertsTopic-${environmentSuffix}`,
      {
        topicName: `TradingAlerts-${environmentSuffix}`,
        displayName: 'Trading Pattern Alerts',
      }
    );

    // Add email subscription (optional - can be configured post-deployment)
    // alertTopic.addSubscription(new subscriptions.EmailSubscription('alerts@example.com'));

    // Create PatternDetector Lambda function
    const patternDetectorFunction = new lambda.Function(
      this,
      `PatternDetector-${environmentSuffix}`,
      {
        functionName: `PatternDetector-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/pattern-detector'),
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        architecture: lambda.Architecture.ARM_64,
        // reservedConcurrentExecutions: 50, // Removed due to AWS account concurrency limits
        tracing: lambda.Tracing.ACTIVE,
        layers: [sharedLayer],
        environment: {
          TABLE_NAME: patternsTable.tableName,
          QUEUE_URL: alertQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to PatternDetector
    patternsTable.grantReadWriteData(patternDetectorFunction);
    alertQueue.grantSendMessages(patternDetectorFunction);

    // Create AlertProcessor Lambda function
    const alertProcessorFunction = new lambda.Function(
      this,
      `AlertProcessor-${environmentSuffix}`,
      {
        functionName: `AlertProcessor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/alert-processor'),
        memorySize: 256,
        timeout: cdk.Duration.seconds(60),
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        layers: [sharedLayer],
        environment: {
          TOPIC_ARN: alertTopic.topicArn,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Add SQS event source to AlertProcessor
    alertProcessorFunction.addEventSource(
      new SqsEventSource(alertQueue, {
        batchSize: 10,
      })
    );

    // Grant permissions to AlertProcessor
    alertTopic.grantPublish(alertProcessorFunction);

    // Create ThresholdChecker Lambda function
    const thresholdCheckerFunction = new lambda.Function(
      this,
      `ThresholdChecker-${environmentSuffix}`,
      {
        functionName: `ThresholdChecker-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/threshold-checker'),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        layers: [sharedLayer],
        environment: {
          TABLE_NAME: patternsTable.tableName,
          QUEUE_URL: alertQueue.queueUrl,
          THRESHOLD_PERCENTAGE: '5',
          THRESHOLD_VOLUME: '10000',
          THRESHOLD_PRICE: '100',
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to ThresholdChecker
    patternsTable.grantReadData(thresholdCheckerFunction);
    alertQueue.grantSendMessages(thresholdCheckerFunction);

    // Create EventBridge rule for threshold checking
    const thresholdCheckRule = new events.Rule(
      this,
      `ThresholdCheckRule-${environmentSuffix}`,
      {
        ruleName: `threshold-check-${environmentSuffix}`,
        description: 'Triggers threshold checker every 5 minutes',
        schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      }
    );

    thresholdCheckRule.addTarget(
      new targets.LambdaFunction(thresholdCheckerFunction)
    );

    // Create API Gateway REST API
    const api = new apigateway.RestApi(
      this,
      `StockPatternsAPI-${environmentSuffix}`,
      {
        restApiName: `stock-patterns-api-${environmentSuffix}`,
        description: 'API for stock pattern detection system',
        deployOptions: {
          stageName: 'prod',
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );

    // Create request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      `RequestValidator-${environmentSuffix}`,
      {
        restApi: api,
        requestValidatorName: 'request-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Create /patterns endpoint
    const patternsResource = api.root.addResource('patterns');
    const patternsIntegration = new apigateway.LambdaIntegration(
      patternDetectorFunction
    );

    const patternsModel = api.addModel('PatternsModel', {
      contentType: 'application/json',
      modelName: 'PatternsModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          symbol: { type: apigateway.JsonSchemaType.STRING },
          price: { type: apigateway.JsonSchemaType.NUMBER },
          volume: { type: apigateway.JsonSchemaType.NUMBER },
          pattern: { type: apigateway.JsonSchemaType.STRING },
        },
        required: ['symbol', 'price', 'volume', 'pattern'],
      },
    });

    patternsResource.addMethod('POST', patternsIntegration, {
      requestValidator,
      requestModels: {
        'application/json': patternsModel,
      },
    });

    patternsResource.addMethod('GET', patternsIntegration);

    // Create /alerts endpoint
    const alertsResource = api.root.addResource('alerts');
    const alertsIntegration = new apigateway.LambdaIntegration(
      alertProcessorFunction
    );

    alertsResource.addMethod('GET', alertsIntegration);

    // Create CloudWatch alarms for Lambda error rates
    const patternDetectorAlarm = new cloudwatch.Alarm(
      this,
      `PatternDetectorErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `PatternDetector-errors-${environmentSuffix}`,
        metric: patternDetectorFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    patternDetectorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    const alertProcessorAlarm = new cloudwatch.Alarm(
      this,
      `AlertProcessorErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `AlertProcessor-errors-${environmentSuffix}`,
        metric: alertProcessorFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    alertProcessorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    const thresholdCheckerAlarm = new cloudwatch.Alarm(
      this,
      `ThresholdCheckerErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `ThresholdChecker-errors-${environmentSuffix}`,
        metric: thresholdCheckerFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    thresholdCheckerAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL for stock patterns API',
      exportName: `ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertQueueUrl', {
      value: alertQueue.queueUrl,
      description: 'SQS Alert Queue URL',
      exportName: `AlertQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: `DLQUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PatternsTableName', {
      value: patternsTable.tableName,
      description: 'DynamoDB Trading Patterns table name',
      exportName: `PatternsTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Trading Alerts topic ARN',
      exportName: `AlertTopicArn-${environmentSuffix}`,
    });
  }
}
