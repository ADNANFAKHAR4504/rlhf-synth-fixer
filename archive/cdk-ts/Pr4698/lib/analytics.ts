import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';

export interface AnalyticsStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class AnalyticsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AnalyticsStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SmartAgriculture');
    cdk.Tags.of(this).add('CostCenter', 'IoT-Department');

    // ----------------------------------------
    // 1. Data Ingestion & Archival
    // ----------------------------------------

    // KMS key for S3 bucket encryption
    const kmsKey = new kms.Key(
      this,
      `SensorDataEncryptionKey-${environmentSuffix}`,
      {
        enableKeyRotation: true,
        description: 'KMS key for sensor data encryption',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // S3 bucket for raw data archival
    const rawDataBucket = new s3.Bucket(
      this,
      `RawSensorDataBucket-${environmentSuffix}`,
      {
        bucketName: `raw-sensor-data-${environmentSuffix}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            transitions: [
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(30),
              },
            ],
          },
        ],
      }
    );

    // Log groups with 7-day retention
    const validationLambdaLogGroup = new logs.LogGroup(
      this,
      `ValidationLambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/validation-lambda-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const transformationLambdaLogGroup = new logs.LogGroup(
      this,
      `TransformationLambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/transformation-lambda-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ----------------------------------------
    // 3. Data Storage & Analytics (created before Lambda to pass as env var)
    // ----------------------------------------

    // Kinesis stream for DynamoDB changes
    const kinesisStream = new kinesis.Stream(
      this,
      `SensorDataStream-${environmentSuffix}`,
      {
        streamName: `sensor-data-stream-${environmentSuffix}`,
        encryption: kinesis.StreamEncryption.KMS,
        encryptionKey: kmsKey,
        shardCount: 1,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // DynamoDB table with Kinesis Data Streams integration
    const sensorDataTable = new dynamodb.Table(
      this,
      `SensorDataTable-${environmentSuffix}`,
      {
        tableName: `sensor-data-table-${environmentSuffix}`,
        partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        timeToLiveAttribute: 'expirationTime',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        kinesisStream: kinesisStream,
      }
    );

    // Validation Lambda function
    const validationLambda = new nodejs.NodejsFunction(
      this,
      `ValidationLambda-${environmentSuffix}`,
      {
        functionName: `validation-lambda-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, 'src/validation-lambda.ts'),
        handler: 'handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
        },
        logGroup: validationLambdaLogGroup,
      }
    );

    // Grant Lambda permission to write to S3 and use KMS key
    rawDataBucket.grantWrite(validationLambda);
    kmsKey.grantEncryptDecrypt(validationLambda);

    // API Gateway with request validation
    const api = new apigateway.RestApi(
      this,
      `SensorDataApi-${environmentSuffix}`,
      {
        restApiName: `sensor-data-api-${environmentSuffix}`,
        description: 'API for sensor data ingestion',
        deployOptions: {
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
        },
      }
    );

    // API key authentication
    const apiKey = api.addApiKey(`SensorApiKey-${environmentSuffix}`);
    const usagePlan = api.addUsagePlan(
      `SensorApiUsagePlan-${environmentSuffix}`,
      {
        name: `sensor-api-usage-plan-${environmentSuffix}`,
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

    // JSON Schema model for request validation
    const sensorDataModel = api.addModel(
      `SensorDataModel-${environmentSuffix}`,
      {
        contentType: 'application/json',
        modelName: `SensorDataModel${environmentSuffix}`,
        schema: {
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['deviceId', 'timestamp'],
          properties: {
            deviceId: { type: apigateway.JsonSchemaType.STRING },
            timestamp: { type: apigateway.JsonSchemaType.STRING },
            moisture: { type: apigateway.JsonSchemaType.NUMBER },
            pH: { type: apigateway.JsonSchemaType.NUMBER },
          },
        },
      }
    );

    // API endpoint with validation model
    const sensorResource = api.root.addResource('sensor');
    sensorResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(validationLambda),
      {
        apiKeyRequired: true,
        requestValidator: new apigateway.RequestValidator(
          this,
          `SensorDataValidator-${environmentSuffix}`,
          {
            restApi: api,
            validateRequestBody: true,
          }
        ),
        requestModels: {
          'application/json': sensorDataModel,
        },
      }
    );

    // ----------------------------------------
    // 2. Event-Driven Processing
    // ----------------------------------------

    // Dead-Letter Queue for failed transformation events
    const dlq = new sqs.Queue(this, `TransformationDLQ-${environmentSuffix}`, {
      queueName: `sensor-data-transformation-dlq-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Transformation Lambda function
    const transformationLambda = new nodejs.NodejsFunction(
      this,
      `TransformationLambda-${environmentSuffix}`,
      {
        functionName: `transformation-lambda-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, 'src/transformation-lambda.ts'),
        handler: 'handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          DYNAMODB_TABLE: sensorDataTable.tableName,
        },
        logGroup: transformationLambdaLogGroup,
        deadLetterQueue: dlq,
      }
    );

    // Grant permissions
    rawDataBucket.grantRead(transformationLambda);
    kmsKey.grantDecrypt(transformationLambda);
    sensorDataTable.grantWriteData(transformationLambda);

    // Configure S3 event notification to trigger transformation Lambda
    rawDataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(transformationLambda)
    );

    // ----------------------------------------
    // 4. Configuration and Observability
    // ----------------------------------------

    // CloudWatch Alarm for transformation Lambda error rate
    const transformationLambdaErrors = transformationLambda.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const transformationLambdaInvocations =
      transformationLambda.metricInvocations({
        period: cdk.Duration.minutes(5),
      });

    const errorRateMetric = new cloudwatch.MathExpression({
      expression: 'errors / invocations * 100',
      usingMetrics: {
        errors: transformationLambdaErrors,
        invocations: transformationLambdaInvocations,
      },
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(
      this,
      `TransformationLambdaErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `transformation-lambda-error-alarm-${environmentSuffix}`,
        metric: errorRateMetric,
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alarm if the error rate exceeds 1% over 5 minutes',
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // Stack outputs
    // API Gateway outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'URL of the API Gateway endpoint',
      exportName: `ApiEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `ApiId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication',
      exportName: `ApiKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiResourcePath', {
      value: '/sensor',
      description: 'API Gateway resource path for sensor data',
      exportName: `ApiResourcePath-${environmentSuffix}`,
    });

    // S3 and KMS outputs
    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: rawDataBucket.bucketName,
      description: 'Name of the raw sensor data bucket',
      exportName: `RawDataBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RawDataBucketArn', {
      value: rawDataBucket.bucketArn,
      description: 'ARN of the raw sensor data bucket',
      exportName: `RawDataBucketArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `KmsKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: kmsKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `KmsKeyArn-${environmentSuffix}`,
    });

    // Lambda outputs
    new cdk.CfnOutput(this, 'ValidationLambdaName', {
      value: validationLambda.functionName,
      description: 'Name of the validation Lambda function',
      exportName: `ValidationLambdaName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ValidationLambdaArn', {
      value: validationLambda.functionArn,
      description: 'ARN of the validation Lambda function',
      exportName: `ValidationLambdaArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransformationLambdaName', {
      value: transformationLambda.functionName,
      description: 'Name of the transformation Lambda function',
      exportName: `TransformationLambdaName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransformationLambdaArn', {
      value: transformationLambda.functionArn,
      description: 'ARN of the transformation Lambda function',
      exportName: `TransformationLambdaArn-${environmentSuffix}`,
    });

    // DynamoDB outputs
    new cdk.CfnOutput(this, 'SensorDataTableName', {
      value: sensorDataTable.tableName,
      description: 'Name of the DynamoDB sensor data table',
      exportName: `SensorDataTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SensorDataTableArn', {
      value: sensorDataTable.tableArn,
      description: 'ARN of the DynamoDB sensor data table',
      exportName: `SensorDataTableArn-${environmentSuffix}`,
    });

    // Kinesis outputs
    new cdk.CfnOutput(this, 'KinesisStreamName', {
      value: kinesisStream.streamName,
      description: 'Name of the Kinesis data stream',
      exportName: `KinesisStreamName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: kinesisStream.streamArn,
      description: 'ARN of the Kinesis data stream',
      exportName: `KinesisStreamArn-${environmentSuffix}`,
    });

    // SQS DLQ outputs
    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: dlq.queueUrl,
      description: 'URL of the dead-letter queue',
      exportName: `DeadLetterQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: dlq.queueArn,
      description: 'ARN of the dead-letter queue',
      exportName: `DeadLetterQueueArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueName', {
      value: dlq.queueName,
      description: 'Name of the dead-letter queue',
      exportName: `DeadLetterQueueName-${environmentSuffix}`,
    });

    // CloudWatch outputs
    new cdk.CfnOutput(this, 'ValidationLambdaLogGroupName', {
      value: validationLambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group for validation Lambda',
      exportName: `ValidationLambdaLogGroupName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransformationLambdaLogGroupName', {
      value: transformationLambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group for transformation Lambda',
      exportName: `TransformationLambdaLogGroupName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmName', {
      value: `transformation-lambda-error-alarm-${environmentSuffix}`,
      description: 'Name of the CloudWatch alarm for error rate',
      exportName: `AlarmName-${environmentSuffix}`,
    });

    // AWS Region output
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region where resources are deployed',
      exportName: `Region-${environmentSuffix}`,
    });
  }
}
