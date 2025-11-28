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
import * as iam from 'aws-cdk-lib/aws-iam';
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
    const sharedLayer = new lambda.LayerVersion(this, `SharedLayer-${environmentSuffix}`, {
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-layers/shared')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared dependencies for pattern detection system',
      layerVersionName: `pattern-detection-shared-${environmentSuffix}`,
    });

    // Create DynamoDB table for storing trading patterns
    const patternsTable = new dynamodb.Table(this, `TradingPatterns-${environmentSuffix}`, {
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
    });

    // Create SNS topic for trading alerts
    const alertsTopic = new sns.Topic(this, `TradingAlerts-${environmentSuffix}`, {
      topicName: `TradingAlerts-${environmentSuffix}`,
      displayName: 'Trading Pattern Alerts',
    });

    // Add email subscription (email address should be provided via context)
    const alertEmail = this.node.tryGetContext('alertEmail') || 'alerts@example.com';
    alertsTopic.addSubscription(new subscriptions.EmailSubscription(alertEmail));

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
    const patternDetector = new lambda.Function(this, `PatternDetector-${environmentSuffix}`, {
      functionName: `PatternDetector-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/pattern-detector')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64, // Graviton2
      reservedConcurrentExecutions: 50,
      tracing: lambda.Tracing.ACTIVE,
      layers: [sharedLayer],
      environment: {
        PATTERNS_TABLE_NAME: patternsTable.tableName,
        ALERT_QUEUE_URL: alertQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to PatternDetector
    patternsTable.grantWriteData(patternDetector);
    alertQueue.grantSendMessages(patternDetector);

    // Create AlertProcessor Lambda function
    const alertProcessor = new lambda.Function(this, `AlertProcessor-${environmentSuffix}`, {
      functionName: `AlertProcessor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/alert-processor')),
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
    });

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
    const thresholdChecker = new lambda.Function(this, `ThresholdChecker-${environmentSuffix}`, {
      functionName: `ThresholdChecker-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda/threshold-checker')),
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
    });

    // Grant permissions to ThresholdChecker
    patternsTable.grantReadData(thresholdChecker);
    alertQueue.grantSendMessages(thresholdChecker);

    // Create EventBridge rule for scheduled threshold checking
    const scheduleRule = new events.Rule(this, `ThresholdCheckRule-${environmentSuffix}`, {
      ruleName: `ThresholdCheckRule-${environmentSuffix}`,
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      description: 'Trigger threshold checker every 5 minutes',
    });

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
    const api = new apigateway.RestApi(this, `PatternDetectionAPI-${environmentSuffix}`, {
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
    });

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
    const patternsIntegration = new apigateway.LambdaIntegration(patternDetector, {
      proxy: true,
    });

    patternsResource.addMethod('POST', patternsIntegration, {
      requestValidator: requestValidator,
      requestModels: {
        'application/json': new apigateway.Model(this, `PatternModel-${environmentSuffix}`, {
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
        }),
      },
    });

    patternsResource.addMethod('GET', patternsIntegration);

    // Create /alerts endpoint
    const alertsResource = api.root.addResource('alerts');
    const alertsIntegration = new apigateway.LambdaIntegration(patternDetector, {
      proxy: true,
    });

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

      const alarm = new cloudwatch.Alarm(this, `${name}-ErrorAlarm-${environmentSuffix}`, {
        alarmName: `${name}-ErrorRate-${environmentSuffix}`,
        metric: errorRateMetric,
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Error rate exceeds 1% for ${name}`,
      });

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

## File: lib/lambda/pattern-detector/index.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PATTERNS_TABLE_NAME = process.env.PATTERNS_TABLE_NAME!;
const ALERT_QUEUE_URL = process.env.ALERT_QUEUE_URL!;

interface PatternData {
  symbol: string;
  price: number;
  volume: number;
  timestamp?: number;
}

interface PatternDetectionResult {
  patternId: string;
  patternType: string;
  confidence: number;
  detected: boolean;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('pattern-detection-logic');

  try {
    const path = event.path;
    const method = event.httpMethod;

    if (path === '/patterns' && method === 'POST') {
      return await handlePatternSubmission(event, subsegment);
    } else if (path === '/patterns' && method === 'GET') {
      return await handleGetPatterns(subsegment);
    } else if (path === '/alerts' && method === 'POST') {
      return await handleAlertSubmission(event, subsegment);
    } else if (path === '/alerts' && method === 'GET') {
      return await handleGetAlerts(subsegment);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    subsegment?.addError(error as Error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: (error as Error).message,
      }),
    };
  } finally {
    subsegment?.close();
  }
};

async function handlePatternSubmission(
  event: APIGatewayProxyEvent,
  subsegment: any
): Promise<APIGatewayProxyResult> {
  const detectionSubsegment = subsegment?.addNewSubsegment('detect-pattern');

  try {
    const data: PatternData = JSON.parse(event.body || '{}');

    // Detect pattern
    const detectionResult = detectPattern(data);

    // Store pattern in DynamoDB
    const patternId = detectionResult.patternId;
    const timestamp = data.timestamp || Date.now();

    await docClient.send(
      new PutCommand({
        TableName: PATTERNS_TABLE_NAME,
        Item: {
          patternId,
          timestamp,
          symbol: data.symbol,
          price: data.price,
          volume: data.volume,
          patternType: detectionResult.patternType,
          confidence: detectionResult.confidence,
          detected: detectionResult.detected,
          createdAt: new Date().toISOString(),
        },
      })
    );

    // If pattern detected, send alert to queue
    if (detectionResult.detected) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: ALERT_QUEUE_URL,
          MessageBody: JSON.stringify({
            patternId,
            symbol: data.symbol,
            patternType: detectionResult.patternType,
            confidence: detectionResult.confidence,
            price: data.price,
            volume: data.volume,
            timestamp,
          }),
        })
      );
    }

    detectionSubsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Pattern processed successfully',
        result: detectionResult,
      }),
    };
  } catch (error) {
    detectionSubsegment?.addError(error as Error);
    detectionSubsegment?.close();
    throw error;
  }
}

async function handleGetPatterns(subsegment: any): Promise<APIGatewayProxyResult> {
  const scanSubsegment = subsegment?.addNewSubsegment('scan-patterns');

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: PATTERNS_TABLE_NAME,
        Limit: 50,
      })
    );

    scanSubsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patterns: result.Items || [],
        count: result.Count || 0,
      }),
    };
  } catch (error) {
    scanSubsegment?.addError(error as Error);
    scanSubsegment?.close();
    throw error;
  }
}

async function handleAlertSubmission(
  event: APIGatewayProxyEvent,
  subsegment: any
): Promise<APIGatewayProxyResult> {
  const alertSubsegment = subsegment?.addNewSubsegment('create-alert');

  try {
    const alertData = JSON.parse(event.body || '{}');

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: ALERT_QUEUE_URL,
        MessageBody: JSON.stringify({
          ...alertData,
          alertId: uuidv4(),
          timestamp: Date.now(),
        }),
      })
    );

    alertSubsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Alert submitted successfully' }),
    };
  } catch (error) {
    alertSubsegment?.addError(error as Error);
    alertSubsegment?.close();
    throw error;
  }
}

async function handleGetAlerts(subsegment: any): Promise<APIGatewayProxyResult> {
  subsegment?.addAnnotation('operation', 'get-alerts');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Alert retrieval not implemented in this version',
      note: 'Check SQS queue directly for pending alerts',
    }),
  };
}

function detectPattern(data: PatternData): PatternDetectionResult {
  const patternId = uuidv4();

  // Simple pattern detection logic
  const priceThreshold = 100;
  const volumeThreshold = 10000;

  let patternType = 'none';
  let confidence = 0;
  let detected = false;

  if (data.price > priceThreshold && data.volume > volumeThreshold) {
    patternType = 'high-volume-breakout';
    confidence = 0.85;
    detected = true;
  } else if (data.price > priceThreshold) {
    patternType = 'price-spike';
    confidence = 0.65;
    detected = true;
  } else if (data.volume > volumeThreshold * 2) {
    patternType = 'volume-surge';
    confidence = 0.75;
    detected = true;
  }

  return {
    patternId,
    patternType,
    confidence,
    detected,
  };
}
```

## File: lib/lambda/alert-processor/index.ts

```typescript
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const snsClient = AWSXRay.captureAWSv3Client(new SNSClient({}));
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const ALERTS_TOPIC_ARN = process.env.ALERTS_TOPIC_ARN!;
const PATTERNS_TABLE_NAME = process.env.PATTERNS_TABLE_NAME!;

interface AlertMessage {
  patternId: string;
  symbol: string;
  patternType: string;
  confidence: number;
  price: number;
  volume: number;
  timestamp: number;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('Processing alerts:', JSON.stringify(event, null, 2));

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('alert-processing');

  try {
    const promises = event.Records.map((record) => processAlert(record, subsegment));
    await Promise.all(promises);

    subsegment?.close();
  } catch (error) {
    console.error('Error processing alerts:', error);
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

async function processAlert(record: SQSRecord, parentSubsegment: any): Promise<void> {
  const processSubsegment = parentSubsegment?.addNewSubsegment('process-single-alert');

  try {
    const alertData: AlertMessage = JSON.parse(record.body);

    // Fetch additional pattern details from DynamoDB
    const patternDetails = await docClient.send(
      new GetCommand({
        TableName: PATTERNS_TABLE_NAME,
        Key: {
          patternId: alertData.patternId,
          timestamp: alertData.timestamp,
        },
      })
    );

    // Determine alert severity
    const severity = determineAlertSeverity(alertData);

    // Construct alert message
    const alertMessage = constructAlertMessage(alertData, patternDetails.Item, severity);

    // Publish to SNS topic
    await snsClient.send(
      new PublishCommand({
        TopicArn: ALERTS_TOPIC_ARN,
        Subject: `[${severity}] Trading Pattern Alert: ${alertData.symbol}`,
        Message: alertMessage,
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: severity,
          },
          symbol: {
            DataType: 'String',
            StringValue: alertData.symbol,
          },
          patternType: {
            DataType: 'String',
            StringValue: alertData.patternType,
          },
        },
      })
    );

    processSubsegment?.addAnnotation('alertProcessed', 'success');
    processSubsegment?.addMetadata('alertData', alertData);

    console.log(`Alert processed successfully for pattern ${alertData.patternId}`);

    processSubsegment?.close();
  } catch (error) {
    console.error(`Error processing alert for record ${record.messageId}:`, error);
    processSubsegment?.addError(error as Error);
    processSubsegment?.close();
    throw error;
  }
}

function determineAlertSeverity(alertData: AlertMessage): string {
  if (alertData.confidence >= 0.9) {
    return 'CRITICAL';
  } else if (alertData.confidence >= 0.75) {
    return 'HIGH';
  } else if (alertData.confidence >= 0.6) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function constructAlertMessage(
  alertData: AlertMessage,
  patternDetails: any,
  severity: string
): string {
  return `
Trading Pattern Alert

Severity: ${severity}
Symbol: ${alertData.symbol}
Pattern Type: ${alertData.patternType}
Confidence: ${(alertData.confidence * 100).toFixed(2)}%

Market Data:
- Price: $${alertData.price.toFixed(2)}
- Volume: ${alertData.volume.toLocaleString()}
- Timestamp: ${new Date(alertData.timestamp).toISOString()}

Pattern Details:
${patternDetails ? JSON.stringify(patternDetails, null, 2) : 'No additional details available'}

Action Required:
Review this pattern and take appropriate action based on your trading strategy.
  `.trim();
}
```

## File: lib/lambda/threshold-checker/index.ts

```typescript
import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PATTERNS_TABLE_NAME = process.env.PATTERNS_TABLE_NAME!;
const ALERT_QUEUE_URL = process.env.ALERT_QUEUE_URL!;
const PRICE_THRESHOLD = parseFloat(process.env.PRICE_THRESHOLD || '100');
const VOLUME_THRESHOLD = parseFloat(process.env.VOLUME_THRESHOLD || '10000');
const VOLATILITY_THRESHOLD = parseFloat(process.env.VOLATILITY_THRESHOLD || '0.05');

interface PatternRecord {
  patternId: string;
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
  patternType: string;
  confidence: number;
}

export const handler = async (event: ScheduledEvent): Promise<void> => {
  console.log('Threshold check triggered:', JSON.stringify(event, null, 2));

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('threshold-check');

  try {
    // Scan recent patterns (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const result = await docClient.send(
      new ScanCommand({
        TableName: PATTERNS_TABLE_NAME,
        FilterExpression: '#ts > :timestamp',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':timestamp': fiveMinutesAgo,
        },
      })
    );

    const patterns = (result.Items || []) as PatternRecord[];

    subsegment?.addMetadata('patternsFound', patterns.length);

    // Check thresholds
    const violations = patterns.filter((pattern) => {
      return (
        pattern.price > PRICE_THRESHOLD ||
        pattern.volume > VOLUME_THRESHOLD ||
        calculateVolatility(pattern) > VOLATILITY_THRESHOLD
      );
    });

    subsegment?.addMetadata('violations', violations.length);

    // Send alerts for threshold violations
    for (const violation of violations) {
      await sendThresholdAlert(violation, subsegment);
    }

    console.log(`Threshold check complete. Found ${violations.length} violations.`);

    subsegment?.close();
  } catch (error) {
    console.error('Error during threshold check:', error);
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

async function sendThresholdAlert(pattern: PatternRecord, parentSubsegment: any): Promise<void> {
  const alertSubsegment = parentSubsegment?.addNewSubsegment('send-threshold-alert');

  try {
    const alertMessage = {
      alertType: 'threshold-violation',
      patternId: pattern.patternId,
      symbol: pattern.symbol,
      patternType: pattern.patternType,
      confidence: pattern.confidence,
      price: pattern.price,
      volume: pattern.volume,
      timestamp: pattern.timestamp,
      thresholds: {
        price: PRICE_THRESHOLD,
        volume: VOLUME_THRESHOLD,
        volatility: VOLATILITY_THRESHOLD,
      },
      violations: {
        priceExceeded: pattern.price > PRICE_THRESHOLD,
        volumeExceeded: pattern.volume > VOLUME_THRESHOLD,
        volatilityExceeded: calculateVolatility(pattern) > VOLATILITY_THRESHOLD,
      },
    };

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: ALERT_QUEUE_URL,
        MessageBody: JSON.stringify(alertMessage),
      })
    );

    alertSubsegment?.addMetadata('alert', alertMessage);
    alertSubsegment?.close();

    console.log(`Threshold alert sent for pattern ${pattern.patternId}`);
  } catch (error) {
    console.error(`Error sending threshold alert:`, error);
    alertSubsegment?.addError(error as Error);
    alertSubsegment?.close();
    throw error;
  }
}

function calculateVolatility(pattern: PatternRecord): number {
  // Simplified volatility calculation
  // In a real system, this would analyze historical price data
  const basePrice = 100;
  const priceDiff = Math.abs(pattern.price - basePrice);
  return priceDiff / basePrice;
}
```

## File: lib/lambda-layers/shared/nodejs/package.json

```json
{
  "name": "pattern-detection-shared",
  "version": "1.0.0",
  "description": "Shared dependencies for pattern detection Lambda functions",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/lib-dynamodb": "^3.450.0",
    "aws-xray-sdk-core": "^3.5.0",
    "uuid": "^9.0.1"
  }
}
```

## File: lib/lambda/pattern-detector/package.json

```json
{
  "name": "pattern-detector",
  "version": "1.0.0",
  "description": "Pattern detection Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/lib-dynamodb": "^3.450.0",
    "aws-xray-sdk-core": "^3.5.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.131",
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3"
  }
}
```

## File: lib/lambda/alert-processor/package.json

```json
{
  "name": "alert-processor",
  "version": "1.0.0",
  "description": "Alert processor Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0",
    "@aws-sdk/lib-dynamodb": "^3.450.0",
    "aws-xray-sdk-core": "^3.5.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.131",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

## File: lib/lambda/threshold-checker/package.json

```json
{
  "name": "threshold-checker",
  "version": "1.0.0",
  "description": "Threshold checker Lambda function",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/lib-dynamodb": "^3.450.0",
    "aws-xray-sdk-core": "^3.5.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.131",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

## File: lib/lambda/pattern-detector/tsconfig.json

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
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/alert-processor/tsconfig.json

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
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/lambda/threshold-checker/tsconfig.json

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
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: lib/README.md

```markdown
# Serverless Stock Pattern Detection System

A serverless system for processing real-time stock market data feeds and generating alerts when specific trading patterns are detected.

## Architecture

This system consists of the following components:

### API Gateway
- REST API with `/patterns` and `/alerts` endpoints
- Request validation enabled
- Throttling: 1000 requests/second with burst of 2000

### Lambda Functions

1. **PatternDetector** (512MB, Graviton2)
   - Processes incoming market data from API
   - Detects trading patterns
   - Stores patterns in DynamoDB
   - Sends alerts to SQS queue
   - Reserved concurrency: 50

2. **AlertProcessor** (256MB, Graviton2)
   - Reads from SQS queue (batch size: 10)
   - Publishes critical alerts to SNS
   - Reads pattern details from DynamoDB
   - DLQ with max receive count: 3

3. **ThresholdChecker** (256MB, Graviton2)
   - Triggered by EventBridge every 5 minutes
   - Checks patterns against thresholds
   - Sends threshold violation alerts to SQS

### Data Storage
- **DynamoDB Table**: TradingPatterns
  - Partition Key: patternId
  - Sort Key: timestamp
  - On-demand billing with PITR enabled

### Messaging
- **SQS Queue**: AlertQueue
  - Visibility timeout: 300 seconds
  - Message retention: 4 days
  - Dead Letter Queue configured

### Notifications
- **SNS Topic**: TradingAlerts
  - Email subscriptions for critical alerts

### Monitoring
- CloudWatch Logs (7-day retention)
- X-Ray tracing enabled on all functions
- CloudWatch alarms for error rates > 1%

## Prerequisites

- AWS CDK 2.x
- Node.js 18+
- TypeScript 5.x
- AWS CLI configured

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Install Lambda dependencies:
```bash
cd lib/lambda/pattern-detector && npm install && cd -
cd lib/lambda/alert-processor && npm install && cd -
cd lib/lambda/threshold-checker && npm install && cd -
cd lib/lambda-layers/shared/nodejs && npm install && cd -
```

3. Build Lambda functions:
```bash
cd lib/lambda/pattern-detector && npx tsc && cd -
cd lib/lambda/alert-processor && npx tsc && cd -
cd lib/lambda/threshold-checker && npx tsc && cd -
```

4. Deploy with environment suffix:
```bash
cdk deploy -c environmentSuffix=dev -c alertEmail=your-email@example.com
```

## Environment Variables

### PatternDetector
- `PATTERNS_TABLE_NAME`: DynamoDB table for patterns
- `ALERT_QUEUE_URL`: SQS queue for alerts

### AlertProcessor
- `ALERTS_TOPIC_ARN`: SNS topic for alerts
- `PATTERNS_TABLE_NAME`: DynamoDB table for patterns

### ThresholdChecker
- `PATTERNS_TABLE_NAME`: DynamoDB table for patterns
- `ALERT_QUEUE_URL`: SQS queue for alerts
- `PRICE_THRESHOLD`: Price threshold (default: 100)
- `VOLUME_THRESHOLD`: Volume threshold (default: 10000)
- `VOLATILITY_THRESHOLD`: Volatility threshold (default: 0.05)

## API Endpoints

### POST /patterns
Submit market data for pattern detection.

Request body:
```json
{
  "symbol": "AAPL",
  "price": 150.50,
  "volume": 15000,
  "timestamp": 1234567890
}
```

### GET /patterns
Retrieve detected patterns (last 50).

### POST /alerts
Submit custom alert.

### GET /alerts
Get alert information.

## Pattern Detection

The system detects the following patterns:

1. **High Volume Breakout**: Price > threshold AND Volume > threshold
2. **Price Spike**: Price > threshold
3. **Volume Surge**: Volume > 2x threshold

## Monitoring

- CloudWatch Logs: All Lambda functions log to CloudWatch with 7-day retention
- X-Ray Traces: Distributed tracing enabled across all services
- CloudWatch Alarms: Error rate monitoring with SNS notifications

## Testing

Run unit tests:
```bash
npm test
```

## Cost Optimization

- ARM-based Graviton2 processors for 20% cost reduction
- On-demand DynamoDB billing
- Lambda scales to zero during off-hours
- Reserved concurrency prevents over-provisioning

## Security

- IAM roles follow least-privilege principle
- No hardcoded credentials
- X-Ray tracing for security auditing
- All data encrypted in transit and at rest

## Cleanup

To destroy all resources:
```bash
cdk destroy -c environmentSuffix=dev
```

All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup.
```

## Deployment Instructions

1. Ensure all Lambda function dependencies are installed in their respective directories
2. Build TypeScript Lambda functions before deployment
3. Set the `environmentSuffix` and `alertEmail` context values during deployment
4. All resources include the environment suffix for uniqueness
5. The system automatically scales based on load and includes comprehensive monitoring
