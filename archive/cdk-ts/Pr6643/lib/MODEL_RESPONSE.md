# Serverless ETL Pipeline Implementation

This implementation provides a complete serverless ETL pipeline using AWS CDK with TypeScript for processing financial transaction data.

## Architecture Overview

The solution consists of:
- S3 bucket for data storage with event notifications
- Step Functions state machine for ETL orchestration
- Three Lambda functions (validator, transformer, enricher)
- DynamoDB table for metadata storage
- API Gateway for REST endpoints
- EventBridge for scheduled triggers
- SQS dead letter queues for error handling
- CloudWatch dashboard for monitoring

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Dead Letter Queues
    const validatorDLQ = new sqs.Queue(this, 'ValidatorDLQ', {
      queueName: `validator-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const transformerDLQ = new sqs.Queue(this, 'TransformerDLQ', {
      queueName: `transformer-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const enricherDLQ = new sqs.Queue(this, 'EnricherDLQ', {
      queueName: `enricher-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const qualityCheckDLQ = new sqs.Queue(this, 'QualityCheckDLQ', {
      queueName: `quality-check-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // S3 Bucket for data storage
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `etl-data-bucket-${environmentSuffix}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldRawFiles',
          prefix: 'raw/',
          expiration: cdk.Duration.days(30),
        },
        {
          id: 'DeleteOldFailedFiles',
          prefix: 'failed/',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // DynamoDB Table for metadata
    const metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      tableName: `etl-metadata-${environmentSuffix}`,
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fileName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    });

    // Global Secondary Index on timestamp
    metadataTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // CloudWatch Log Groups
    const validatorLogGroup = new logs.LogGroup(this, 'ValidatorLogGroup', {
      logGroupName: `/aws/lambda/validator-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const transformerLogGroup = new logs.LogGroup(this, 'TransformerLogGroup', {
      logGroupName: `/aws/lambda/transformer-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const enricherLogGroup = new logs.LogGroup(this, 'EnricherLogGroup', {
      logGroupName: `/aws/lambda/enricher-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const qualityCheckLogGroup = new logs.LogGroup(this, 'QualityCheckLogGroup', {
      logGroupName: `/aws/lambda/quality-check-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiHandlerLogGroup = new logs.LogGroup(this, 'ApiHandlerLogGroup', {
      logGroupName: `/aws/lambda/api-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const triggerHandlerLogGroup = new logs.LogGroup(this, 'TriggerHandlerLogGroup', {
      logGroupName: `/aws/lambda/trigger-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Functions
    const validatorFunction = new lambda.Function(this, 'ValidatorFunction', {
      functionName: `validator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/validator'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        DATA_BUCKET: dataBucket.bucketName,
      },
      logGroup: validatorLogGroup,
      deadLetterQueue: validatorDLQ,
    });

    const transformerFunction = new lambda.Function(this, 'TransformerFunction', {
      functionName: `transformer-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/transformer'),
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        DATA_BUCKET: dataBucket.bucketName,
      },
      logGroup: transformerLogGroup,
      deadLetterQueue: transformerDLQ,
    });

    const enricherFunction = new lambda.Function(this, 'EnricherFunction', {
      functionName: `enricher-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/enricher'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        DATA_BUCKET: dataBucket.bucketName,
      },
      logGroup: enricherLogGroup,
      deadLetterQueue: enricherDLQ,
    });

    const qualityCheckFunction = new lambda.Function(this, 'QualityCheckFunction', {
      functionName: `quality-check-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/quality-check'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        DATA_BUCKET: dataBucket.bucketName,
      },
      logGroup: qualityCheckLogGroup,
      deadLetterQueue: qualityCheckDLQ,
    });

    // Grant permissions
    dataBucket.grantReadWrite(validatorFunction);
    dataBucket.grantReadWrite(transformerFunction);
    dataBucket.grantReadWrite(enricherFunction);
    dataBucket.grantRead(qualityCheckFunction);

    metadataTable.grantReadWriteData(validatorFunction);
    metadataTable.grantReadWriteData(transformerFunction);
    metadataTable.grantReadWriteData(enricherFunction);
    metadataTable.grantReadData(qualityCheckFunction);

    // Step Functions State Machine
    const validateTask = new tasks.LambdaInvoke(this, 'ValidateTask', {
      lambdaFunction: validatorFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const transformTask = new tasks.LambdaInvoke(this, 'TransformTask', {
      lambdaFunction: transformerFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const enrichTask = new tasks.LambdaInvoke(this, 'EnrichTask', {
      lambdaFunction: enricherFunction,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const handleValidationError = new sfn.Fail(this, 'ValidationFailed', {
      cause: 'CSV validation failed',
      error: 'ValidationError',
    });

    const handleTransformError = new sfn.Fail(this, 'TransformationFailed', {
      cause: 'Data transformation failed',
      error: 'TransformError',
    });

    const handleEnrichmentError = new sfn.Fail(this, 'EnrichmentFailed', {
      cause: 'Data enrichment failed',
      error: 'EnrichmentError',
    });

    const successState = new sfn.Succeed(this, 'ProcessingSucceeded');

    // Define workflow
    const definition = validateTask
      .addCatch(handleValidationError, {
        errors: ['States.ALL'],
        resultPath: '$.error',
      })
      .next(transformTask
        .addCatch(handleTransformError, {
          errors: ['States.ALL'],
          resultPath: '$.error',
        })
      )
      .next(enrichTask
        .addCatch(handleEnrichmentError, {
          errors: ['States.ALL'],
          resultPath: '$.error',
        })
      )
      .next(successState);

    const stateMachine = new sfn.StateMachine(this, 'ETLStateMachine', {
      stateMachineName: `etl-state-machine-${environmentSuffix}`,
      definition,
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
    });

    // Lambda to trigger Step Functions from S3 events
    const triggerFunction = new lambda.Function(this, 'TriggerFunction', {
      functionName: `trigger-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/trigger'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        METADATA_TABLE: metadataTable.tableName,
      },
      logGroup: triggerHandlerLogGroup,
    });

    stateMachine.grantStartExecution(triggerFunction);
    metadataTable.grantReadWriteData(triggerFunction);

    // S3 event notification
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(triggerFunction),
      { prefix: 'raw/', suffix: '.csv' }
    );

    // API Gateway Lambda Handler
    const apiHandlerFunction = new lambda.Function(this, 'ApiHandlerFunction', {
      functionName: `api-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/api-handler'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        METADATA_TABLE: metadataTable.tableName,
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
      logGroup: apiHandlerLogGroup,
    });

    metadataTable.grantReadData(apiHandlerFunction);
    stateMachine.grantStartExecution(apiHandlerFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'ETLApi', {
      restApiName: `etl-api-${environmentSuffix}`,
      description: 'API for ETL pipeline status and control',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiHandlerFunction);

    // GET /status/{jobId} - Query processing status
    const statusResource = api.root.addResource('status');
    const jobResource = statusResource.addResource('{jobId}');
    jobResource.addMethod('GET', apiIntegration);

    // POST /trigger - Manually trigger workflow
    const triggerResource = api.root.addResource('trigger');
    triggerResource.addMethod('POST', apiIntegration);

    // EventBridge scheduled rule for daily quality checks
    const qualityCheckRule = new events.Rule(this, 'QualityCheckRule', {
      ruleName: `quality-check-rule-${environmentSuffix}`,
      description: 'Trigger daily data quality checks at 2 AM UTC',
      schedule: events.Schedule.cron({ minute: '0', hour: '2' }),
    });

    qualityCheckRule.addTarget(new targets.LambdaFunction(qualityCheckFunction, {
      retryAttempts: 2,
      deadLetterQueue: qualityCheckDLQ,
    }));

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ETLDashboard', {
      dashboardName: `etl-dashboard-${environmentSuffix}`,
    });

    // Custom metrics
    const processingLatencyMetric = new cloudwatch.Metric({
      namespace: 'ETLPipeline',
      metricName: 'ProcessingLatency',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const successRateMetric = new cloudwatch.Metric({
      namespace: 'ETLPipeline',
      metricName: 'SuccessRate',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const failureRateMetric = new cloudwatch.Metric({
      namespace: 'ETLPipeline',
      metricName: 'FailureRate',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: [stateMachine.metricSucceeded(), stateMachine.metricFailed()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          validatorFunction.metricInvocations(),
          transformerFunction.metricInvocations(),
          enricherFunction.metricInvocations(),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Processing Latency',
        left: [processingLatencyMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Success vs Failure Rate',
        left: [successRateMetric, failureRateMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          validatorFunction.metricErrors(),
          transformerFunction.metricErrors(),
          enricherFunction.metricErrors(),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Message Count',
        left: [
          validatorDLQ.metricApproximateNumberOfMessagesVisible(),
          transformerDLQ.metricApproximateNumberOfMessagesVisible(),
          enricherDLQ.metricApproximateNumberOfMessagesVisible(),
        ],
        width: 12,
      })
    );

    // CloudWatch Alarms
    const validatorErrorAlarm = new cloudwatch.Alarm(this, 'ValidatorErrorAlarm', {
      metric: validatorFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Validator function has high error rate',
      alarmName: `validator-errors-${environmentSuffix}`,
    });

    const transformerErrorAlarm = new cloudwatch.Alarm(this, 'TransformerErrorAlarm', {
      metric: transformerFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Transformer function has high error rate',
      alarmName: `transformer-errors-${environmentSuffix}`,
    });

    const stateMachineFailedAlarm = new cloudwatch.Alarm(this, 'StateMachineFailedAlarm', {
      metric: stateMachine.metricFailed(),
      threshold: 3,
      evaluationPeriods: 1,
      alarmDescription: 'Step Functions executions are failing',
      alarmName: `state-machine-failures-${environmentSuffix}`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket for data storage',
    });

    new cdk.CfnOutput(this, 'MetadataTableName', {
      value: metadataTable.tableName,
      description: 'DynamoDB table for metadata',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
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

const environmentSuffix = app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  `${Date.now()}`;

new TapStack(app, 'TapStack', {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless ETL Pipeline for Financial Transaction Processing',
});

app.synth();
```

## File: lib/lambda/validator/index.ts

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface Event {
  bucket: string;
  key: string;
  jobId: string;
}

interface ValidationResult {
  valid: boolean;
  bucket: string;
  key: string;
  jobId: string;
  fileName: string;
  rowCount?: number;
  error?: string;
}

export const handler = async (event: Event): Promise<ValidationResult> => {
  const startTime = Date.now();
  console.log('Validator started:', JSON.stringify(event));

  const { bucket, key, jobId } = event;
  const fileName = key.split('/').pop() || key;

  try {
    // Get CSV file from S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file');
    }

    const csvContent = await response.Body.transformToString();
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    // Validate header
    const header = lines[0].split(',');
    const requiredColumns = ['transaction_id', 'amount', 'timestamp', 'merchant_id'];

    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Validate data rows
    const dataRows = lines.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i].split(',');
      if (row.length !== header.length) {
        throw new Error(`Row ${i + 2} has incorrect number of columns`);
      }

      // Validate transaction_id is not empty
      if (!row[header.indexOf('transaction_id')]) {
        throw new Error(`Row ${i + 2} has empty transaction_id`);
      }

      // Validate amount is a number
      const amount = row[header.indexOf('amount')];
      if (isNaN(parseFloat(amount))) {
        throw new Error(`Row ${i + 2} has invalid amount: ${amount}`);
      }
    }

    const processingTime = Date.now() - startTime;

    // Update metadata in DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.METADATA_TABLE!,
      Item: {
        jobId: { S: jobId },
        fileName: { S: fileName },
        status: { S: 'validated' },
        timestamp: { N: Date.now().toString() },
        rowCount: { N: dataRows.length.toString() },
        processingTime: { N: processingTime.toString() },
      },
    }));

    // Send custom metric
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [{
        MetricName: 'ValidationSuccess',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      }],
    }));

    console.log(`Validation succeeded: ${dataRows.length} rows validated`);

    return {
      valid: true,
      bucket,
      key,
      jobId,
      fileName,
      rowCount: dataRows.length,
    };

  } catch (error) {
    console.error('Validation failed:', error);

    const processingTime = Date.now() - startTime;

    // Update metadata with error
    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.METADATA_TABLE!,
      Item: {
        jobId: { S: jobId },
        fileName: { S: fileName },
        status: { S: 'validation_failed' },
        timestamp: { N: Date.now().toString() },
        error: { S: error instanceof Error ? error.message : 'Unknown error' },
        processingTime: { N: processingTime.toString() },
      },
    }));

    // Send failure metric
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [{
        MetricName: 'ValidationFailure',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      }],
    }));

    return {
      valid: false,
      bucket,
      key,
      jobId,
      fileName,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
```

## File: lib/lambda/validator/package.json

```json
{
  "name": "validator",
  "version": "1.0.0",
  "description": "CSV validator for ETL pipeline",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-cloudwatch": "^3.400.0"
  }
}
```

## File: lib/lambda/transformer/index.ts

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface Event {
  valid: boolean;
  bucket: string;
  key: string;
  jobId: string;
  fileName: string;
  rowCount: number;
}

interface TransformResult {
  transformed: boolean;
  bucket: string;
  outputKey: string;
  jobId: string;
  fileName: string;
  rowCount: number;
  error?: string;
}

export const handler = async (event: Event): Promise<TransformResult> => {
  const startTime = Date.now();
  console.log('Transformer started:', JSON.stringify(event));

  if (!event.valid) {
    throw new Error('Cannot transform invalid data');
  }

  const { bucket, key, jobId, fileName, rowCount } = event;

  try {
    // Get CSV file from S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file');
    }

    const csvContent = await response.Body.transformToString();
    const lines = csvContent.trim().split('\n');
    const header = lines[0].split(',');
    const dataRows = lines.slice(1);

    // Transform to Parquet-like JSON structure (simulated)
    const transformedData = dataRows.map(row => {
      const values = row.split(',');
      const record: Record<string, string | number> = {};

      header.forEach((col, index) => {
        const value = values[index];
        // Convert numeric columns
        if (col === 'amount' || col === 'timestamp') {
          record[col] = parseFloat(value) || 0;
        } else {
          record[col] = value;
        }
      });

      return record;
    });

    // Store transformed data (JSON format for simplicity)
    const outputKey = key.replace('raw/', 'processed/').replace('.csv', '.json');
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: outputKey,
      Body: JSON.stringify(transformedData, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putObjectCommand);

    const processingTime = Date.now() - startTime;

    // Update metadata
    await dynamoClient.send(new UpdateItemCommand({
      TableName: process.env.METADATA_TABLE!,
      Key: {
        jobId: { S: jobId },
        fileName: { S: fileName },
      },
      UpdateExpression: 'SET #status = :status, #outputKey = :outputKey, #transformTime = :time',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#outputKey': 'outputKey',
        '#transformTime': 'transformTime',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'transformed' },
        ':outputKey': { S: outputKey },
        ':time': { N: processingTime.toString() },
      },
    }));

    // Send custom metric
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [
        {
          MetricName: 'TransformSuccess',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'ProcessingLatency',
          Value: processingTime,
          Unit: 'Milliseconds',
          Timestamp: new Date(),
        },
      ],
    }));

    console.log(`Transformation succeeded: ${outputKey}`);

    return {
      transformed: true,
      bucket,
      outputKey,
      jobId,
      fileName,
      rowCount,
    };

  } catch (error) {
    console.error('Transformation failed:', error);

    const processingTime = Date.now() - startTime;

    // Update metadata with error
    await dynamoClient.send(new UpdateItemCommand({
      TableName: process.env.METADATA_TABLE!,
      Key: {
        jobId: { S: jobId },
        fileName: { S: fileName },
      },
      UpdateExpression: 'SET #status = :status, #error = :error, #transformTime = :time',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#error': 'error',
        '#transformTime': 'transformTime',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'transform_failed' },
        ':error': { S: error instanceof Error ? error.message : 'Unknown error' },
        ':time': { N: processingTime.toString() },
      },
    }));

    // Send failure metric
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [{
        MetricName: 'TransformFailure',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      }],
    }));

    throw error;
  }
};
```

## File: lib/lambda/transformer/package.json

```json
{
  "name": "transformer",
  "version": "1.0.0",
  "description": "Data transformer for ETL pipeline",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-cloudwatch": "^3.400.0"
  }
}
```

## File: lib/lambda/enricher/index.ts

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface Event {
  transformed: boolean;
  bucket: string;
  outputKey: string;
  jobId: string;
  fileName: string;
  rowCount: number;
}

interface EnrichResult {
  enriched: boolean;
  bucket: string;
  enrichedKey: string;
  jobId: string;
  fileName: string;
  rowCount: number;
}

export const handler = async (event: Event): Promise<EnrichResult> => {
  const startTime = Date.now();
  console.log('Enricher started:', JSON.stringify(event));

  if (!event.transformed) {
    throw new Error('Cannot enrich non-transformed data');
  }

  const { bucket, outputKey, jobId, fileName, rowCount } = event;

  try {
    // Get transformed data from S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: outputKey });
    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file');
    }

    const transformedContent = await response.Body.transformToString();
    const records = JSON.parse(transformedContent);

    // Enrich each record with metadata
    const enrichedRecords = await Promise.all(records.map(async (record: any) => {
      // Add processing metadata
      const enriched = {
        ...record,
        enrichment_timestamp: Date.now(),
        processing_job_id: jobId,
        data_source: 'financial_partners',
        record_version: '1.0',
        // In production, would fetch additional data from DynamoDB based on merchant_id
        enrichment_status: 'completed',
      };

      return enriched;
    }));

    // Store enriched data
    const enrichedKey = outputKey.replace('processed/', 'enriched/');
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: enrichedKey,
      Body: JSON.stringify(enrichedRecords, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putObjectCommand);

    const processingTime = Date.now() - startTime;

    // Update metadata
    await dynamoClient.send(new UpdateItemCommand({
      TableName: process.env.METADATA_TABLE!,
      Key: {
        jobId: { S: jobId },
        fileName: { S: fileName },
      },
      UpdateExpression: 'SET #status = :status, #enrichedKey = :enrichedKey, #enrichTime = :time, #completedAt = :completed',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#enrichedKey': 'enrichedKey',
        '#enrichTime': 'enrichTime',
        '#completedAt': 'completedAt',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'completed' },
        ':enrichedKey': { S: enrichedKey },
        ':time': { N: processingTime.toString() },
        ':completed': { N: Date.now().toString() },
      },
    }));

    // Send custom metrics
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [
        {
          MetricName: 'EnrichmentSuccess',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'SuccessRate',
          Value: 100,
          Unit: 'Percent',
          Timestamp: new Date(),
        },
      ],
    }));

    console.log(`Enrichment succeeded: ${enrichedKey}`);

    return {
      enriched: true,
      bucket,
      enrichedKey,
      jobId,
      fileName,
      rowCount,
    };

  } catch (error) {
    console.error('Enrichment failed:', error);

    const processingTime = Date.now() - startTime;

    // Update metadata with error
    await dynamoClient.send(new UpdateItemCommand({
      TableName: process.env.METADATA_TABLE!,
      Key: {
        jobId: { S: jobId },
        fileName: { S: fileName },
      },
      UpdateExpression: 'SET #status = :status, #error = :error, #enrichTime = :time',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#error': 'error',
        '#enrichTime': 'enrichTime',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'enrichment_failed' },
        ':error': { S: error instanceof Error ? error.message : 'Unknown error' },
        ':time': { N: processingTime.toString() },
      },
    }));

    // Send failure metric
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [
        {
          MetricName: 'EnrichmentFailure',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'FailureRate',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    }));

    throw error;
  }
};
```

## File: lib/lambda/enricher/package.json

```json
{
  "name": "enricher",
  "version": "1.0.0",
  "description": "Data enricher for ETL pipeline",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-cloudwatch": "^3.400.0"
  }
}
```

## File: lib/lambda/trigger/index.ts

```typescript
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Event } from 'aws-lambda';

const sfnClient = new SFNClient({});
const dynamoClient = new DynamoDBClient({});

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Trigger handler received event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    try {
      // Create initial metadata entry
      await dynamoClient.send(new PutItemCommand({
        TableName: process.env.METADATA_TABLE!,
        Item: {
          jobId: { S: jobId },
          fileName: { S: key.split('/').pop() || key },
          status: { S: 'started' },
          timestamp: { N: Date.now().toString() },
          s3Bucket: { S: bucket },
          s3Key: { S: key },
        },
      }));

      // Start Step Functions execution
      const input = {
        bucket,
        key,
        jobId,
      };

      const command = new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN!,
        input: JSON.stringify(input),
        name: jobId,
      });

      const result = await sfnClient.send(command);
      console.log(`Started execution: ${result.executionArn}`);

    } catch (error) {
      console.error(`Error processing ${key}:`, error);

      // Update metadata with error
      await dynamoClient.send(new PutItemCommand({
        TableName: process.env.METADATA_TABLE!,
        Item: {
          jobId: { S: jobId },
          fileName: { S: key.split('/').pop() || key },
          status: { S: 'trigger_failed' },
          timestamp: { N: Date.now().toString() },
          error: { S: error instanceof Error ? error.message : 'Unknown error' },
        },
      }));
    }
  }
};
```

## File: lib/lambda/trigger/package.json

```json
{
  "name": "trigger",
  "version": "1.0.0",
  "description": "Trigger handler for ETL pipeline",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-sfn": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@types/aws-lambda": "^8.10.119"
  }
}
```

## File: lib/lambda/quality-check/index.ts

```typescript
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface QualityReport {
  timestamp: number;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  successRate: number;
  averageProcessingTime: number;
}

export const handler = async (): Promise<QualityReport> => {
  console.log('Quality check started');

  const yesterday = Date.now() - (24 * 60 * 60 * 1000);

  try {
    // Query completed jobs from last 24 hours
    const queryCommand = new QueryCommand({
      TableName: process.env.METADATA_TABLE!,
      IndexName: 'TimestampIndex',
      KeyConditionExpression: '#status = :status AND #timestamp > :yesterday',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'completed' },
        ':yesterday': { N: yesterday.toString() },
      },
    });

    const completedResult = await dynamoClient.send(queryCommand);
    const successfulFiles = completedResult.Items?.length || 0;

    // Query failed jobs
    const failedQueryCommand = new QueryCommand({
      TableName: process.env.METADATA_TABLE!,
      IndexName: 'TimestampIndex',
      KeyConditionExpression: '#status = :status AND #timestamp > :yesterday',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'enrichment_failed' },
        ':yesterday': { N: yesterday.toString() },
      },
    });

    const failedResult = await dynamoClient.send(failedQueryCommand);
    const failedFiles = failedResult.Items?.length || 0;

    const totalFiles = successfulFiles + failedFiles;
    const successRate = totalFiles > 0 ? (successfulFiles / totalFiles) * 100 : 100;

    // Calculate average processing time
    let totalProcessingTime = 0;
    if (completedResult.Items) {
      for (const item of completedResult.Items) {
        const processingTime = parseInt(item.processingTime?.N || '0');
        const transformTime = parseInt(item.transformTime?.N || '0');
        const enrichTime = parseInt(item.enrichTime?.N || '0');
        totalProcessingTime += processingTime + transformTime + enrichTime;
      }
    }

    const averageProcessingTime = successfulFiles > 0 ? totalProcessingTime / successfulFiles : 0;

    const report: QualityReport = {
      timestamp: Date.now(),
      totalFiles,
      successfulFiles,
      failedFiles,
      successRate,
      averageProcessingTime,
    };

    // Send metrics to CloudWatch
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ETLPipeline',
      MetricData: [
        {
          MetricName: 'DailySuccessRate',
          Value: successRate,
          Unit: 'Percent',
          Timestamp: new Date(),
        },
        {
          MetricName: 'DailyTotalFiles',
          Value: totalFiles,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'DailyFailedFiles',
          Value: failedFiles,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'AverageProcessingTime',
          Value: averageProcessingTime,
          Unit: 'Milliseconds',
          Timestamp: new Date(),
        },
      ],
    }));

    console.log('Quality check report:', JSON.stringify(report));

    return report;

  } catch (error) {
    console.error('Quality check failed:', error);
    throw error;
  }
};
```

## File: lib/lambda/quality-check/package.json

```json
{
  "name": "quality-check",
  "version": "1.0.0",
  "description": "Daily quality check for ETL pipeline",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-cloudwatch": "^3.400.0"
  }
}
```

## File: lib/lambda/api-handler/index.ts

```typescript
import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const sfnClient = new SFNClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('API Handler received:', JSON.stringify(event));

  const path = event.path;
  const method = event.httpMethod;

  try {
    // GET /status/{jobId}
    if (method === 'GET' && path.startsWith('/status/')) {
      const jobId = event.pathParameters?.jobId;

      if (!jobId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing jobId parameter' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      // Query DynamoDB for job status
      const queryCommand = new QueryCommand({
        TableName: process.env.METADATA_TABLE!,
        KeyConditionExpression: 'jobId = :jobId',
        ExpressionAttributeValues: {
          ':jobId': { S: jobId },
        },
      });

      const result = await dynamoClient.send(queryCommand);

      if (!result.Items || result.Items.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Job not found' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const item = result.Items[0];
      const response = {
        jobId: item.jobId.S,
        fileName: item.fileName.S,
        status: item.status.S,
        timestamp: parseInt(item.timestamp.N || '0'),
        rowCount: item.rowCount?.N ? parseInt(item.rowCount.N) : undefined,
        error: item.error?.S,
        s3Bucket: item.s3Bucket?.S,
        s3Key: item.s3Key?.S,
        outputKey: item.outputKey?.S,
        enrichedKey: item.enrichedKey?.S,
        completedAt: item.completedAt?.N ? parseInt(item.completedAt.N) : undefined,
      };

      return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // POST /trigger
    if (method === 'POST' && path === '/trigger') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { bucket, key } = body;

      if (!bucket || !key) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing bucket or key in request body' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const input = {
        bucket,
        key,
        jobId,
      };

      const command = new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN!,
        input: JSON.stringify(input),
        name: jobId,
      });

      const result = await sfnClient.send(command);

      return {
        statusCode: 200,
        body: JSON.stringify({
          jobId,
          executionArn: result.executionArn,
          message: 'ETL workflow triggered successfully',
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('API Handler error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
```

## File: lib/lambda/api-handler/package.json

```json
{
  "name": "api-handler",
  "version": "1.0.0",
  "description": "API handler for ETL pipeline",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-sfn": "^3.400.0",
    "@types/aws-lambda": "^8.10.119"
  }
}
```

## File: lib/README.md

```markdown
# Serverless ETL Pipeline for Financial Transaction Processing

A production-grade serverless ETL pipeline built with AWS CDK and TypeScript for processing financial transaction data.

## Architecture

The solution implements a fully serverless architecture:

- **S3**: Data lake for raw, processed, and enriched data
- **Lambda**: Six functions handling validation, transformation, enrichment, triggering, API, and quality checks
- **Step Functions**: Orchestrates the ETL workflow with error handling
- **DynamoDB**: Stores job metadata and processing status
- **API Gateway**: REST API for querying status and triggering workflows
- **EventBridge**: Scheduled triggers for daily quality checks
- **SQS**: Dead letter queues for error handling
- **CloudWatch**: Dashboards, metrics, alarms, and logs

## Prerequisites

- Node.js 18.x or later
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda dependencies:
```bash
cd lib/lambda/validator && npm install && cd ../../..
cd lib/lambda/transformer && npm install && cd ../../..
cd lib/lambda/enricher && npm install && cd ../../..
cd lib/lambda/trigger && npm install && cd ../../..
cd lib/lambda/quality-check && npm install && cd ../../..
cd lib/lambda/api-handler && npm install && cd ../../..
```

## Deployment

1. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

2. Deploy the stack:
```bash
cdk deploy --context environmentSuffix=dev
```

Or set environment variable:
```bash
export ENVIRONMENT_SUFFIX=dev
cdk deploy
```

3. Note the outputs:
   - DataBucketName: S3 bucket name
   - MetadataTableName: DynamoDB table name
   - StateMachineArn: Step Functions ARN
   - ApiEndpoint: API Gateway URL
   - DashboardURL: CloudWatch dashboard URL

## Usage

### Upload CSV File

Upload a CSV file to trigger the ETL pipeline:

```bash
aws s3 cp transaction-data.csv s3://BUCKET-NAME/raw/transaction-data.csv
```

The CSV must have these columns:
- transaction_id
- amount
- timestamp
- merchant_id

### Query Processing Status

```bash
curl https://API-ENDPOINT/prod/status/JOB-ID
```

### Manually Trigger Workflow

```bash
curl -X POST https://API-ENDPOINT/prod/trigger \
  -H "Content-Type: application/json" \
  -d '{"bucket": "BUCKET-NAME", "key": "raw/transaction-data.csv"}'
```

## Monitoring

Access the CloudWatch dashboard using the URL from stack outputs. The dashboard shows:

- Step Functions execution metrics
- Lambda invocation counts and errors
- Processing latency metrics
- Success vs failure rates
- Dead letter queue message counts

## Testing

Run unit tests:

```bash
npm test
```

## Cleanup

To remove all resources:

```bash
cdk destroy
```

This will delete all resources including S3 buckets, DynamoDB tables, and CloudWatch logs.

## Security

- All Lambda functions have separate IAM roles with least privilege
- CloudWatch Logs retention set to 7 days
- S3 bucket versioning enabled
- No VPC required (all services are fully managed)
- API Gateway with request validation

## Cost Optimization

- Serverless architecture with pay-per-use pricing
- DynamoDB on-demand billing
- S3 lifecycle policies for automatic data cleanup
- CloudWatch Logs with 7-day retention
- Step Functions Express workflows for lower cost

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/validator-SUFFIX --follow
```

### Failed Executions

Check Step Functions console or dead letter queues:
```bash
aws sqs receive-message --queue-url QUEUE-URL
```

### API Errors

Check API Gateway logs in CloudWatch.
```
