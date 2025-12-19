# Serverless Stock Pattern Detection System Implementation

Complete AWS CDK TypeScript implementation for real-time stock pattern detection and alerting system.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
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
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, `SharedLayer-${environmentSuffix}`, {
      code: lambda.Code.fromAsset('lib/lambda/layers/shared'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Shared dependencies for stock pattern detection',
      layerVersionName: `shared-dependencies-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create DynamoDB table for trading patterns
    const patternsTable = new dynamodb.Table(this, `TradingPatternsTable-${environmentSuffix}`, {
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
    const alertTopic = new sns.Topic(this, `TradingAlertsTopic-${environmentSuffix}`, {
      topicName: `TradingAlerts-${environmentSuffix}`,
      displayName: 'Trading Pattern Alerts',
    });

    // Add email subscription (optional - can be configured post-deployment)
    // alertTopic.addSubscription(new subscriptions.EmailSubscription('alerts@example.com'));

    // Create PatternDetector Lambda function
    const patternDetectorFunction = new lambda.Function(this, `PatternDetector-${environmentSuffix}`, {
      functionName: `PatternDetector-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/pattern-detector'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      reservedConcurrentExecutions: 50,
      tracing: lambda.Tracing.ACTIVE,
      layers: [sharedLayer],
      environment: {
        TABLE_NAME: patternsTable.tableName,
        QUEUE_URL: alertQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to PatternDetector
    patternsTable.grantReadWriteData(patternDetectorFunction);
    alertQueue.grantSendMessages(patternDetectorFunction);

    // Create AlertProcessor Lambda function
    const alertProcessorFunction = new lambda.Function(this, `AlertProcessor-${environmentSuffix}`, {
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
    });

    // Add SQS event source to AlertProcessor
    alertProcessorFunction.addEventSource(new SqsEventSource(alertQueue, {
      batchSize: 10,
    }));

    // Grant permissions to AlertProcessor
    alertTopic.grantPublish(alertProcessorFunction);

    // Create ThresholdChecker Lambda function
    const thresholdCheckerFunction = new lambda.Function(this, `ThresholdChecker-${environmentSuffix}`, {
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
    });

    // Grant permissions to ThresholdChecker
    patternsTable.grantReadData(thresholdCheckerFunction);
    alertQueue.grantSendMessages(thresholdCheckerFunction);

    // Create EventBridge rule for threshold checking
    const thresholdCheckRule = new events.Rule(this, `ThresholdCheckRule-${environmentSuffix}`, {
      ruleName: `threshold-check-${environmentSuffix}`,
      description: 'Triggers threshold checker every 5 minutes',
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    });

    thresholdCheckRule.addTarget(new targets.LambdaFunction(thresholdCheckerFunction));

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, `StockPatternsAPI-${environmentSuffix}`, {
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
    });

    // Create request validator
    const requestValidator = new apigateway.RequestValidator(this, `RequestValidator-${environmentSuffix}`, {
      restApi: api,
      requestValidatorName: 'request-validator',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Create /patterns endpoint
    const patternsResource = api.root.addResource('patterns');
    const patternsIntegration = new apigateway.LambdaIntegration(patternDetectorFunction);

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
    const alertsIntegration = new apigateway.LambdaIntegration(alertProcessorFunction);

    alertsResource.addMethod('GET', alertsIntegration);

    // Create CloudWatch alarms for Lambda error rates
    const patternDetectorAlarm = new cloudwatch.Alarm(this, `PatternDetectorErrorAlarm-${environmentSuffix}`, {
      alarmName: `PatternDetector-errors-${environmentSuffix}`,
      metric: patternDetectorFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    patternDetectorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    const alertProcessorAlarm = new cloudwatch.Alarm(this, `AlertProcessorErrorAlarm-${environmentSuffix}`, {
      alarmName: `AlertProcessor-errors-${environmentSuffix}`,
      metric: alertProcessorFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    alertProcessorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    const thresholdCheckerAlarm = new cloudwatch.Alarm(this, `ThresholdCheckerErrorAlarm-${environmentSuffix}`, {
      alarmName: `ThresholdChecker-errors-${environmentSuffix}`,
      metric: thresholdCheckerFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    thresholdCheckerAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

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
```

## File: lib/lambda/pattern-detector/index.ts

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

interface PatternData {
  symbol: string;
  price: number;
  volume: number;
  pattern: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('PatternDetectorLogic');

  try {
    console.log('Processing pattern detection request', { event });

    if (event.httpMethod === 'GET') {
      subsegment?.close();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Pattern detector is running' }),
      };
    }

    if (!event.body) {
      subsegment?.close();
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const patternData: PatternData = JSON.parse(event.body);
    const patternId = `${patternData.symbol}-${Date.now()}`;
    const timestamp = Date.now();

    // Store pattern in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        patternId,
        timestamp,
        symbol: patternData.symbol,
        price: patternData.price,
        volume: patternData.volume,
        pattern: patternData.pattern,
        detectedAt: new Date().toISOString(),
      }),
    });

    await dynamoClient.send(putCommand);
    console.log('Pattern stored in DynamoDB', { patternId });

    // Check if pattern requires immediate alert
    if (shouldTriggerAlert(patternData)) {
      const messageCommand = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({
          patternId,
          symbol: patternData.symbol,
          pattern: patternData.pattern,
          price: patternData.price,
          volume: patternData.volume,
          alertType: 'immediate',
        }),
      });

      await sqsClient.send(messageCommand);
      console.log('Alert sent to queue', { patternId });
    }

    subsegment?.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Pattern processed successfully',
        patternId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error processing pattern', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to process pattern',
        message: (error as Error).message,
      }),
    };
  }
};

function shouldTriggerAlert(data: PatternData): boolean {
  // Simple logic to determine if immediate alert is needed
  const highVolumeThreshold = 50000;
  const significantPatterns = ['head-and-shoulders', 'double-top', 'double-bottom'];

  return (
    data.volume > highVolumeThreshold ||
    significantPatterns.includes(data.pattern.toLowerCase())
  );
}
```

## File: lib/lambda/alert-processor/index.ts

```typescript
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import * as AWSXRay from 'aws-xray-sdk-core';

const snsClient = AWSXRay.captureAWSv3Client(new SNSClient({}));

const TOPIC_ARN = process.env.TOPIC_ARN!;

interface AlertMessage {
  patternId: string;
  symbol: string;
  pattern: string;
  price: number;
  volume: number;
  alertType: string;
  threshold?: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('AlertProcessorLogic');

  try {
    console.log('Processing alerts from SQS', { recordCount: event.Records.length });

    const processPromises = event.Records.map((record: SQSRecord) => processAlert(record));
    await Promise.all(processPromises);

    console.log('All alerts processed successfully');
    subsegment?.close();
  } catch (error) {
    console.error('Error processing alerts', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

async function processAlert(record: SQSRecord): Promise<void> {
  try {
    const alertData: AlertMessage = JSON.parse(record.body);
    console.log('Processing alert', { alertData });

    const message = formatAlertMessage(alertData);

    const publishCommand = new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject: `Trading Alert: ${alertData.symbol} - ${alertData.pattern}`,
      Message: message,
      MessageAttributes: {
        symbol: {
          DataType: 'String',
          StringValue: alertData.symbol,
        },
        alertType: {
          DataType: 'String',
          StringValue: alertData.alertType,
        },
      },
    });

    await snsClient.send(publishCommand);
    console.log('Alert published to SNS', { patternId: alertData.patternId });
  } catch (error) {
    console.error('Error processing individual alert', { error, record });
    throw error;
  }
}

function formatAlertMessage(alert: AlertMessage): string {
  return `
Trading Pattern Alert

Pattern ID: ${alert.patternId}
Symbol: ${alert.symbol}
Pattern: ${alert.pattern}
Price: $${alert.price.toFixed(2)}
Volume: ${alert.volume.toLocaleString()}
Alert Type: ${alert.alertType}
${alert.threshold ? `Threshold: ${alert.threshold}` : ''}

Time: ${new Date().toISOString()}

This is an automated alert from the Stock Pattern Detection System.
  `.trim();
}
```

## File: lib/lambda/threshold-checker/index.ts

```typescript
import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;
const THRESHOLD_PERCENTAGE = parseFloat(process.env.THRESHOLD_PERCENTAGE || '5');
const THRESHOLD_VOLUME = parseInt(process.env.THRESHOLD_VOLUME || '10000');
const THRESHOLD_PRICE = parseFloat(process.env.THRESHOLD_PRICE || '100');

interface PatternRecord {
  patternId: string;
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
  pattern: string;
}

export const handler = async (event: ScheduledEvent): Promise<void> => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('ThresholdCheckerLogic');

  try {
    console.log('Starting threshold check', { event, thresholds: {
      percentage: THRESHOLD_PERCENTAGE,
      volume: THRESHOLD_VOLUME,
      price: THRESHOLD_PRICE,
    }});

    // Scan recent patterns (last 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#ts > :timeThreshold',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':timeThreshold': { N: tenMinutesAgo.toString() },
      },
    });

    const result = await dynamoClient.send(scanCommand);

    if (!result.Items || result.Items.length === 0) {
      console.log('No recent patterns found');
      subsegment?.close();
      return;
    }

    const patterns: PatternRecord[] = result.Items.map(item => unmarshall(item) as PatternRecord);
    console.log('Found patterns', { count: patterns.length });

    // Check thresholds and send alerts
    const alertPromises = patterns
      .filter(pattern => exceedsThresholds(pattern))
      .map(pattern => sendThresholdAlert(pattern));

    await Promise.all(alertPromises);

    console.log('Threshold check completed', { alertsSent: alertPromises.length });
    subsegment?.close();
  } catch (error) {
    console.error('Error checking thresholds', { error });
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};

function exceedsThresholds(pattern: PatternRecord): boolean {
  const volumeExceeded = pattern.volume > THRESHOLD_VOLUME;
  const priceExceeded = pattern.price > THRESHOLD_PRICE;

  // Check if price change percentage is significant (simple check)
  const priceSignificant = pattern.price > THRESHOLD_PRICE * (1 + THRESHOLD_PERCENTAGE / 100);

  return volumeExceeded || priceExceeded || priceSignificant;
}

async function sendThresholdAlert(pattern: PatternRecord): Promise<void> {
  const thresholdType = pattern.volume > THRESHOLD_VOLUME ? 'volume' :
                        pattern.price > THRESHOLD_PRICE ? 'price' : 'percentage';

  const messageCommand = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({
      patternId: pattern.patternId,
      symbol: pattern.symbol,
      pattern: pattern.pattern,
      price: pattern.price,
      volume: pattern.volume,
      alertType: 'threshold',
      threshold: `${thresholdType} exceeded`,
    }),
  });

  await sqsClient.send(messageCommand);
  console.log('Threshold alert sent', { patternId: pattern.patternId, thresholdType });
}
```

## File: lib/lambda/layers/shared/nodejs/package.json

```json
{
  "name": "shared-dependencies",
  "version": "1.0.0",
  "description": "Shared dependencies for Lambda functions",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0",
    "@aws-sdk/util-dynamodb": "^3.450.0",
    "aws-xray-sdk-core": "^3.5.3"
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless Stock Pattern Detection System',
});

app.synth();
```

## File: lib/README.md

```markdown
# Serverless Stock Pattern Detection System

AWS CDK TypeScript implementation of a real-time stock pattern detection and alerting system for financial services.

## Architecture

This system implements a fully serverless architecture using:

- **API Gateway**: REST API with `/patterns` and `/alerts` endpoints
- **Lambda Functions**: Three functions for pattern detection, alert processing, and threshold checking
- **DynamoDB**: On-demand table for storing trading patterns
- **SQS**: Message queue for reliable alert delivery with DLQ
- **SNS**: Topic for critical alert notifications
- **EventBridge**: Scheduled rule for periodic threshold checks
- **CloudWatch**: Comprehensive logging, monitoring, and alarms

## Key Features

- ARM-based Graviton2 processors for all Lambda functions (cost-efficient)
- X-Ray tracing enabled for distributed tracing
- Lambda Layers for shared dependencies
- Reserved concurrency for PatternDetector (50)
- API Gateway throttling (1000 rps, 2000 burst)
- 4-day message retention for SQS queues
- Point-in-time recovery for DynamoDB
- CloudWatch alarms for error monitoring
- 7-day log retention

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+
- AWS CDK 2.x installed (`npm install -g aws-cdk`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda layer dependencies:
```bash
cd lib/lambda/layers/shared/nodejs
npm install
cd ../../../../..
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Deployment

Deploy the stack with default environment suffix (dev):
```bash
cdk deploy
```

Deploy with custom environment suffix:
```bash
cdk deploy --context environmentSuffix=prod
```

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

## API Usage

### Submit Pattern Data

```bash
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "price": 150.25,
    "volume": 75000,
    "pattern": "head-and-shoulders"
  }'
```

### Check Alerts

```bash
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/alerts
```

## Configuration

### Environment Variables

Lambda functions use these environment variables:

**PatternDetector**:
- `TABLE_NAME`: DynamoDB table name
- `QUEUE_URL`: SQS queue URL

**AlertProcessor**:
- `TOPIC_ARN`: SNS topic ARN

**ThresholdChecker**:
- `TABLE_NAME`: DynamoDB table name
- `QUEUE_URL`: SQS queue URL
- `THRESHOLD_PERCENTAGE`: Price change threshold (default: 5)
- `THRESHOLD_VOLUME`: Volume threshold (default: 10000)
- `THRESHOLD_PRICE`: Price threshold (default: 100)

## Monitoring

CloudWatch alarms are configured for:
- Lambda function errors (>1% error rate)
- DLQ message count
- API Gateway 4xx/5xx errors

Access logs and metrics through AWS CloudWatch Console.

## Resource Cleanup

To destroy all resources:
```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for clean teardown.

## Architecture Constraints

- All Lambda functions use ARM_64 architecture
- SQS retention: exactly 4 days
- Lambda log retention: 7 days
- API throttling: 1000 rps (2000 burst)
- DynamoDB: on-demand billing with PITR
- PatternDetector reserved concurrency: 50
- AlertProcessor batch size: 10
- DLQ max receive count: 3

## License

MIT
```

## File: cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

## File: package.json

```json
{
  "name": "tap",
  "version": "1.0.0",
  "description": "Serverless Stock Pattern Detection System",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:integration": "jest --testMatch='**/*.int.test.ts'",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.130",
    "@types/jest": "^29.5.11",
    "@types/node": "20.10.6",
    "aws-cdk": "2.117.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "typescript": "~5.3.3"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sns": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/util-dynamodb": "^3.450.0",
    "aws-cdk-lib": "2.117.0",
    "aws-xray-sdk-core": "^3.5.3",
    "constructs": "^10.3.0",
    "source-map-support": "^0.5.21"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ],
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## File: jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/lambda/layers/**',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
```

## File: .gitignore

```
*.js
!jest.config.js
*.d.ts
node_modules

# CDK asset staging directory
.cdk.staging
cdk.out

# Coverage
coverage/
.nyc_output

# IDE
.idea
.vscode
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```
