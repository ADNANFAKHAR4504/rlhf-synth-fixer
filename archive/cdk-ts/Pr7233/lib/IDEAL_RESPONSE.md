# Serverless Stock Pattern Detection System - CDK TypeScript Implementation

This implementation provides a complete serverless stock pattern detection system using AWS CDK with TypeScript.

## Architecture Overview

The system consists of:
- API Gateway REST API for pattern and alert submissions
- Three Lambda functions: PatternDetector, AlertProcessor, and ThresholdChecker
- DynamoDB table for pattern storage
- SQS queue with DLQ for alert processing
- EventBridge rule for scheduled threshold checking
- SNS topic for critical alerts
- Lambda Layer for shared dependencies
- CloudWatch monitoring and X-Ray tracing

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(
      this,
      `SharedLayer-${environmentSuffix}`,
      {
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda-layers/shared')
        ),
        compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
        description: 'Shared dependencies for pattern detection system',
        layerVersionName: `pattern-detection-shared-${environmentSuffix}`,
      }
    );

    // Create DynamoDB table for storing trading patterns
    const patternsTable = new dynamodb.Table(
      this,
      `TradingPatterns-${environmentSuffix}`,
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

    // Create SNS topic for trading alerts
    const alertsTopic = new sns.Topic(
      this,
      `TradingAlerts-${environmentSuffix}`,
      {
        topicName: `TradingAlerts-${environmentSuffix}`,
        displayName: 'Trading Pattern Alerts',
      }
    );

    // Add email subscription (email address should be provided via context)
    const alertEmail =
      this.node.tryGetContext('alertEmail') || 'alerts@example.com';
    alertsTopic.addSubscription(
      new subscriptions.EmailSubscription(alertEmail)
    );

    // Create Dead Letter Queue for AlertProcessor
    const alertDLQ = new sqs.Queue(this, `AlertDLQ-${environmentSuffix}`, {
      queueName: `AlertDLQ-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(4),
    });

    // Create SQS queue for alert processing
    const alertQueue = new sqs.Queue(this, `AlertQueue-${environmentSuffix}`, {
      queueName: `AlertQueue-${environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: alertDLQ,
        maxReceiveCount: 3,
      },
    });

    // Create PatternDetector Lambda function
    const patternDetector = new lambda.Function(
      this,
      `PatternDetector-${environmentSuffix}`,
      {
        functionName: `PatternDetector-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda/pattern-detector')
        ),
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        architecture: lambda.Architecture.ARM_64, // Graviton2
        // Removed reservedConcurrentExecutions to avoid AWS account limit issues
        // AWS requires at least 100 unreserved concurrent executions
        tracing: lambda.Tracing.ACTIVE,
        layers: [sharedLayer],
        environment: {
          PATTERNS_TABLE_NAME: patternsTable.tableName,
          ALERT_QUEUE_URL: alertQueue.queueUrl,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to PatternDetector
    patternsTable.grantWriteData(patternDetector);
    alertQueue.grantSendMessages(patternDetector);

    // Create AlertProcessor Lambda function
    const alertProcessor = new lambda.Function(
      this,
      `AlertProcessor-${environmentSuffix}`,
      {
        functionName: `AlertProcessor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda/alert-processor')
        ),
        memorySize: 256,
        timeout: cdk.Duration.seconds(60),
        architecture: lambda.Architecture.ARM_64, // Graviton2
        tracing: lambda.Tracing.ACTIVE,
        layers: [sharedLayer],
        environment: {
          ALERTS_TOPIC_ARN: alertsTopic.topicArn,
          PATTERNS_TABLE_NAME: patternsTable.tableName,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Configure SQS event source for AlertProcessor
    alertProcessor.addEventSource(
      new SqsEventSource(alertQueue, {
        batchSize: 10,
      })
    );

    // Grant permissions to AlertProcessor
    alertsTopic.grantPublish(alertProcessor);
    patternsTable.grantReadData(alertProcessor);

    // Create ThresholdChecker Lambda function
    const thresholdChecker = new lambda.Function(
      this,
      `ThresholdChecker-${environmentSuffix}`,
      {
        functionName: `ThresholdChecker-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda/threshold-checker')
        ),
        memorySize: 256,
        timeout: cdk.Duration.seconds(60),
        architecture: lambda.Architecture.ARM_64, // Graviton2
        tracing: lambda.Tracing.ACTIVE,
        layers: [sharedLayer],
        environment: {
          PATTERNS_TABLE_NAME: patternsTable.tableName,
          ALERT_QUEUE_URL: alertQueue.queueUrl,
          PRICE_THRESHOLD: '100',
          VOLUME_THRESHOLD: '10000',
          VOLATILITY_THRESHOLD: '0.05',
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to ThresholdChecker
    patternsTable.grantReadData(thresholdChecker);
    alertQueue.grantSendMessages(thresholdChecker);

    // Create EventBridge rule for scheduled threshold checking
    const scheduleRule = new events.Rule(
      this,
      `ThresholdCheckRule-${environmentSuffix}`,
      {
        ruleName: `ThresholdCheckRule-${environmentSuffix}`,
        schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
        description: 'Trigger threshold checker every 5 minutes',
      }
    );

    // Add custom event pattern to match requirements
    scheduleRule.addEventPattern({
      source: ['aws.events'],
      detailType: ['Scheduled Event'],
      detail: {
        // Custom event pattern with 3 matching conditions
        eventType: ['threshold-check'],
        priority: ['high'],
        enabled: ['true'],
      },
    });

    scheduleRule.addTarget(new targets.LambdaFunction(thresholdChecker));

    // Create API Gateway REST API
    const api = new apigateway.RestApi(
      this,
      `PatternDetectionAPI-${environmentSuffix}`,
      {
        restApiName: `PatternDetectionAPI-${environmentSuffix}`,
        description: 'API for stock pattern detection system',
        deployOptions: {
          stageName: 'prod',
          tracingEnabled: true,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
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
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Create /patterns endpoint
    const patternsResource = api.root.addResource('patterns');
    const patternsIntegration = new apigateway.LambdaIntegration(
      patternDetector,
      {
        proxy: true,
      }
    );

    patternsResource.addMethod('POST', patternsIntegration, {
      requestValidator: requestValidator,
      requestModels: {
        'application/json': new apigateway.Model(
          this,
          `PatternModel-${environmentSuffix}`,
          {
            restApi: api,
            contentType: 'application/json',
            modelName: `PatternModel${environmentSuffix}`,
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              required: ['symbol', 'price', 'volume'],
              properties: {
                symbol: { type: apigateway.JsonSchemaType.STRING },
                price: { type: apigateway.JsonSchemaType.NUMBER },
                volume: { type: apigateway.JsonSchemaType.NUMBER },
                timestamp: { type: apigateway.JsonSchemaType.NUMBER },
              },
            },
          }
        ),
      },
    });

    patternsResource.addMethod('GET', patternsIntegration);

    // Create /alerts endpoint
    const alertsResource = api.root.addResource('alerts');
    const alertsIntegration = new apigateway.LambdaIntegration(
      patternDetector,
      {
        proxy: true,
      }
    );

    alertsResource.addMethod('POST', alertsIntegration, {
      requestValidator: requestValidator,
    });

    alertsResource.addMethod('GET', alertsIntegration);

    // Create CloudWatch alarms for Lambda error rates
    const createErrorAlarm = (fn: lambda.Function, name: string) => {
      const errorMetric = fn.metricErrors({
        statistic: 'sum',
        period: cdk.Duration.minutes(5),
      });

      const invocationMetric = fn.metricInvocations({
        statistic: 'sum',
        period: cdk.Duration.minutes(5),
      });

      const errorRateMetric = new cloudwatch.MathExpression({
        expression: '(errors / invocations) * 100',
        usingMetrics: {
          errors: errorMetric,
          invocations: invocationMetric,
        },
        period: cdk.Duration.minutes(5),
      });

      const alarm = new cloudwatch.Alarm(
        this,
        `${name}-ErrorAlarm-${environmentSuffix}`,
        {
          alarmName: `${name}-ErrorRate-${environmentSuffix}`,
          metric: errorRateMetric,
          threshold: 1,
          evaluationPeriods: 2,
          datapointsToAlarm: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `Error rate exceeds 1% for ${name}`,
        }
      );

      alarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertsTopic));
    };

    createErrorAlarm(patternDetector, 'PatternDetector');
    createErrorAlarm(alertProcessor, 'AlertProcessor');
    createErrorAlarm(thresholdChecker, 'ThresholdChecker');

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL for pattern detection system',
      exportName: `ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertQueueUrl', {
      value: alertQueue.queueUrl,
      description: 'SQS Queue URL for alert processing',
      exportName: `AlertQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PatternsTableName', {
      value: patternsTable.tableName,
      description: 'DynamoDB table name for trading patterns',
      exportName: `PatternsTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: alertsTopic.topicArn,
      description: 'SNS topic ARN for trading alerts',
      exportName: `AlertsTopicArn-${environmentSuffix}`,
    });
  }
}
```
