# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/s3-processor.ts

```typescript
import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

interface ProcessingResult {
  bucket: string;
  key: string;
  size: number;
  contentType: string;
  status: string;
  processingTimeMs: number;
}

/**
 * S3 Event Processor Lambda Function
 *
 * This function is triggered when objects are created in the S3 bucket.
 * It performs validation, metadata extraction, and logging of the processed objects.
 */
export const handler = async (
  event: S3Event,
  context: Context
): Promise<void> => {
  console.log('Lambda invoked with request ID:', context.awsRequestId);
  console.log('Event received:', JSON.stringify(event, null, 2));

  const results: ProcessingResult[] = [];
  const errors: string[] = [];

  try {
    // Process each S3 record in the event
    for (const record of event.Records) {
      const startTime = Date.now();

      try {
        const result = await processS3Record(record);
        results.push({
          ...result,
          processingTimeMs: Date.now() - startTime,
        });

        console.log(`Successfully processed: ${result.key}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const key = record.s3.object.key;

        console.error(`Error processing object ${key}:`, {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          record: JSON.stringify(record),
        });

        errors.push(`Failed to process ${key}: ${errorMessage}`);
      }
    }

    // Log summary
    console.log('Processing Summary:', {
      totalRecords: event.Records.length,
      successful: results.length,
      failed: errors.length,
      results,
    });

    // If there were any errors, throw to trigger DLQ and CloudWatch alarm
    if (errors.length > 0) {
      throw new Error(
        `Processing completed with ${errors.length} error(s): ${errors.join('; ')}`
      );
    }
  } catch (error) {
    console.error('Fatal error in Lambda execution:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error; // Re-throw to trigger retry and DLQ
  }
};

/**
 * Process a single S3 event record
 */
async function processS3Record(
  record: S3EventRecord
): Promise<ProcessingResult> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const size = record.s3.object.size;

  console.log(`Processing object: s3://${bucket}/${key}`);

  // Validate object key
  validateObjectKey(key);

  // Get detailed object metadata
  const metadata = await getObjectMetadata(bucket, key);

  // Perform dummy processing tasks
  await performDummyProcessing(bucket, key, size);

  return {
    bucket,
    key,
    size,
    contentType: metadata.ContentType || 'unknown',
    status: 'completed',
    processingTimeMs: 0, // Will be set by caller
  };
}

/**
 * Validate the S3 object key
 */
function validateObjectKey(key: string): void {
  // Check for empty key
  if (!key || key.trim().length === 0) {
    throw new Error('Object key cannot be empty');
  }

  // Check for suspicious patterns
  if (key.includes('..')) {
    throw new Error('Object key contains invalid path traversal pattern');
  }

  // Check minimum size requirement (e.g., not just file extension)
  if (key.length < 3) {
    throw new Error('Object key is too short');
  }

  console.log(`Object key validation passed: ${key}`);
}

/**
 * Get detailed metadata about the S3 object
 */
async function getObjectMetadata(bucket: string, key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    console.log('Object metadata:', {
      ContentType: response.ContentType,
      ContentLength: response.ContentLength,
      LastModified: response.LastModified,
      ETag: response.ETag,
      VersionId: response.VersionId,
      StorageClass: response.StorageClass,
    });

    return response;
  } catch (error) {
    console.error('Error fetching object metadata:', error);
    throw new Error(
      `Failed to get metadata for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Perform dummy processing tasks on the object
 */
async function performDummyProcessing(
  bucket: string,
  key: string,
  size: number
): Promise<void> {
  console.log(`Starting dummy processing for ${key}...`);

  // Simulate processing delay based on file size
  const processingDelay = Math.min(size / 1000, 1000); // Max 1 second
  await new Promise(resolve => setTimeout(resolve, processingDelay));

  // Log processing details
  console.log('Dummy processing completed:', {
    bucket,
    key,
    size,
    fileType: getFileType(key),
    isLargeFile: size > 1024 * 1024, // > 1 MB
    estimatedProcessingTime: `${processingDelay}ms`,
  });

  // Simulate additional processing steps
  await simulateDataValidation(key);
  await simulateMetadataExtraction(key);

  console.log(`Dummy processing completed for ${key}`);
}

/**
 * Get file type from key
 */
function getFileType(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
}

/**
 * Simulate data validation
 */
async function simulateDataValidation(key: string): Promise<void> {
  console.log(`Validating data for ${key}...`);

  // Simulate validation delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Random validation failure for testing (5% chance)
  if (Math.random() < 0.05) {
    throw new Error(`Data validation failed for ${key}`);
  }

  console.log(`Data validation passed for ${key}`);
}

/**
 * Simulate metadata extraction
 */
async function simulateMetadataExtraction(key: string): Promise<void> {
  console.log(`Extracting metadata for ${key}...`);

  // Simulate extraction delay
  await new Promise(resolve => setTimeout(resolve, 50));

  const extractedMetadata = {
    fileName: key.split('/').pop(),
    fileExtension: getFileType(key),
    processedAt: new Date().toISOString(),
    environment: process.env.ENVIRONMENT || 'unknown',
  };

  console.log('Extracted metadata:', extractedMetadata);
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  bucketName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add stack-level tags
    Tags.of(this).add('Environment', 'Production');
    Tags.of(this).add('iac-rlhf-amazon', 'true');

    // ==============================================
    // SQS Dead Letter Queue for Lambda
    // ==============================================
    const deadLetterQueue = new sqs.Queue(this, 'LambdaDLQ', {
      queueName: `lambda-dlq-${environmentSuffix}`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // ==============================================
    // S3 Bucket Configuration
    // ==============================================
    const bucketName =
      props?.bucketName ||
      `serverless-bucket-${this.account}-${environmentSuffix}`;

    const bucket = new s3.Bucket(this, 'ServerlessS3Bucket', {
      bucketName: bucketName,

      // Enable server-side encryption with AES-256
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Enable versioning
      versioned: true,

      // Configure lifecycle policy
      lifecycleRules: [
        {
          id: 'MoveToGlacierAfter30Days',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],

      // Block public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Enforce SSL/TLS
      enforceSSL: true,

      // Set removal policy (for non-production, you might want DESTROY)
      removalPolicy: RemovalPolicy.RETAIN,

      // Enable access logs (optional but recommended for production)
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Add bucket policy to enforce HTTPS-only connections
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // ==============================================
    // IAM Role for Lambda Function
    // ==============================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for S3 triggered Lambda function',
      roleName: `lambda-s3-processor-role-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific S3 permissions (least privilege)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:HeadObject'],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // Add SQS permissions for DLQ
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    // ==============================================
    // Lambda Function
    // ==============================================
    const lambdaFunction = new NodejsFunction(this, 'S3ProcessorFunction', {
      functionName: `s3-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda', 's3-processor.ts'),
      timeout: Duration.seconds(15),
      memorySize: 256,
      role: lambdaRole,
      environment: {
        NODE_ENV: 'production',
        ENVIRONMENT: environmentSuffix,
      },
      deadLetterQueueEnabled: true,
      deadLetterQueue: deadLetterQueue,
      maxEventAge: Duration.hours(6),
      retryAttempts: 2,
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // ==============================================
    // S3 Event Notification
    // ==============================================
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction)
    );

    // Grant Lambda permission to read from bucket (using CDK helper)
    bucket.grantRead(lambdaFunction);

    // ==============================================
    // CloudWatch Alarm
    // ==============================================

    // Create SNS topic for alarm notifications (optional)
    const alarmTopic = new sns.Topic(this, 'LambdaAlarmTopic', {
      topicName: `lambda-errors-topic-${environmentSuffix}`,
      displayName: 'Lambda Error Notifications',
    });

    // Create CloudWatch alarm for Lambda errors
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-high-${environmentSuffix}`,
      alarmDescription:
        'Triggered when Lambda function errors exceed threshold',
      metric: lambdaFunction.metricErrors({
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm action to send notification
    errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Additional alarm for DLQ messages
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `lambda-dlq-messages-${environmentSuffix}`,
      alarmDescription: 'Triggered when messages are sent to DLQ',
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible({
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ==============================================
    // CloudFormation Outputs
    // ==============================================
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: bucket.bucketArn,
      description: 'ARN of the S3 bucket',
      exportName: `${this.stackName}-S3BucketArn`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'URL of the Dead Letter Queue',
      exportName: `${this.stackName}-DLQUrl`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarm notifications',
      exportName: `${this.stackName}-AlarmTopicArn`,
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SQSClient,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { setTimeout as setTimeoutPromise } from 'timers/promises';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const sqsClient = new SQSClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('TapStack Integration Tests', () => {
  const bucketName = outputs.S3BucketName;
  const lambdaFunctionName = outputs.LambdaFunctionName;
  const lambdaFunctionArn = outputs.LambdaFunctionArn;
  const dlqUrl = outputs.DLQUrl;
  const alarmTopicArn = outputs.AlarmTopicArn;

  describe('S3 Bucket', () => {
    test('Should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('Should have server-side encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('Should have lifecycle policy configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();

      const glacierRule = response.Rules?.find(
        (rule) => rule.ID === 'MoveToGlacierAfter30Days'
      );
      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Status).toBe('Enabled');
      expect(glacierRule?.Transitions).toBeDefined();
      expect(glacierRule?.Transitions?.[0]?.Days).toBe(30);
      expect(glacierRule?.Transitions?.[0]?.StorageClass).toBe('GLACIER');
    });

    test('Should enforce HTTPS-only access', async () => {
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();

      const policy = JSON.parse(response.Policy!);
      const denyInsecureStatement = policy.Statement.find(
        (stmt: any) =>
          stmt.Sid === 'DenyInsecureConnections' ||
          (stmt.Effect === 'Deny' &&
            stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false')
      );
      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Effect).toBe('Deny');
    });
  });

  describe('Lambda Function', () => {
    test('Should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.FunctionArn).toBe(lambdaFunctionArn);
    });

    test('Should have correct runtime configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Handler).toBe('index.handler');
      expect(response.Timeout).toBe(15);
      expect(response.MemorySize).toBe(256);
    });

    test('Should have dead letter queue configured', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.DeadLetterConfig?.TargetArn).toBeDefined();
      expect(response.DeadLetterConfig?.TargetArn).toContain('lambda-dlq');
    });

    test('Should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    test('Should have correct environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.NODE_ENV).toBe('production');
      expect(response.Environment?.Variables?.ENVIRONMENT).toBe(
        environmentSuffix
      );
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('Should exist and be accessible', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test('Should have KMS encryption enabled', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['KmsMasterKeyId'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toContain('alias/aws/sqs');
    });

    test('Should have message retention period of 14 days', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['MessageRetentionPeriod'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600');
    });
  });

  describe('SNS Topic', () => {
    test('Should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: alarmTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test('Should have correct display name', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: alarmTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe(
        'Lambda Error Notifications'
      );
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should have Lambda error alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-errors-high-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(1);
      expect(alarm.Statistic).toBe('Sum');
    });

    test('Should have DLQ messages alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-dlq-messages-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(alarm.Namespace).toBe('AWS/SQS');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.Period).toBe(300);
    });

    test('Lambda error alarm should have SNS action', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-errors-high-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions).toHaveLength(1);
      expect(alarm.AlarmActions![0]).toBe(alarmTopicArn);
    });

    test('DLQ alarm should have SNS action', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`lambda-dlq-messages-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions).toHaveLength(1);
      expect(alarm.AlarmActions![0]).toBe(alarmTopicArn);
    });
  });

  describe('S3 to Lambda Integration', () => {
    const testObjectKey = `test-object-${Date.now()}.txt`;

    test('Should trigger Lambda function when object is created in S3', async () => {
      // Upload a test file to S3
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testObjectKey,
        Body: 'Test content for Lambda trigger',
        ContentType: 'text/plain',
      });
      await s3Client.send(putCommand);

      // Wait for Lambda to process the event (give it some time)
      await setTimeoutPromise(10000); // 10 seconds

      // Check CloudWatch Logs for Lambda execution
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const now = Date.now();
      const startTime = now - 60000; // 1 minute ago

      const logsCommand = new FilterLogEventsCommand({
        logGroupName,
        startTime,
        endTime: now,
        filterPattern: `"${testObjectKey}"`,
      });

      const logsResponse = await logsClient.send(logsCommand);
      expect(logsResponse.events).toBeDefined();
      expect(logsResponse.events!.length).toBeGreaterThan(0);

      // Verify the log contains expected processing messages
      const logMessages = logsResponse.events!.map((e) => e.message).join('\n');
      expect(logMessages).toContain(testObjectKey);
    }, 30000); // 30 second timeout for this test
  });

  describe('Error Handling and DLQ', () => {
    test('DLQ should be empty initially', async () => {
      const command = new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      });
      const response = await sqsClient.send(command);
      expect(response.Messages || []).toHaveLength(0);
    });
  });

  describe('Resource Tags', () => {
    test('Lambda function should have required tags', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Tags).toBeDefined();
      expect(response.Tags?.Environment).toBe('Production');
      expect(response.Tags?.['iac-rlhf-amazon']).toBe('true');
    });
  });

  describe('Multi-Environment Support', () => {
    test('Resources should use environment suffix in names', () => {
      expect(bucketName).toContain(environmentSuffix);
      expect(lambdaFunctionName).toContain(environmentSuffix);
      expect(dlqUrl).toContain(environmentSuffix);
      expect(alarmTopicArn).toContain(environmentSuffix);
    });

    test('Resources should be deployed in correct region', () => {
      expect(lambdaFunctionArn).toContain(region);
      expect(dlqUrl).toContain(region);
      expect(alarmTopicArn).toContain(region);
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Tags', () => {
    test('Should have Environment tag set to Production', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });
    });

    test('Should have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'iac-rlhf-amazon', Value: 'true' },
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('Should create exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Should have server-side encryption with AES-256', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('Should have lifecycle rule to transition to Glacier after 30 days', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'MoveToGlacierAfter30Days',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('Should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Should have access logging enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          LogFilePrefix: 'access-logs/',
        },
      });
    });

    test('Should enforce SSL/TLS', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('Should create main Lambda function', () => {
      // NodejsFunction may create additional custom resource Lambda functions
      // So we just verify our main function exists with correct properties
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
      });
    });

    test('Should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
      });
    });

    test('Should have correct handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });

    test('Should have timeout of 15 seconds', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 15,
      });
    });

    test('Should have memory size of 256 MB', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256,
      });
    });

    test('Should have dead letter queue configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });

    test('Should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'production',
            ENVIRONMENT: environmentSuffix,
          },
        },
      });
    });

    test('Should have EventInvokeConfig with retry attempts and max event age', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2,
        MaximumEventAgeInSeconds: 21600,
      });
    });
  });

  describe('IAM Role', () => {
    test('Should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('Should have AWSLambdaBasicExecutionRole managed policy', () => {
      const roles = template.findResources('AWS::IAM::Role');

      // Verify at least one Lambda role has the managed policy
      const hasBasicExecutionRole = Object.values(roles).some((role: any) => {
        // Check if role is for Lambda
        const isLambdaRole = role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
        );

        if (!isLambdaRole) return false;

        const arns = role.Properties?.ManagedPolicyArns || [];
        return arns.some((arn: any) => {
          if (typeof arn === 'string') {
            return arn.includes('AWSLambdaBasicExecutionRole');
          }
          if (typeof arn === 'object' && arn['Fn::Join']) {
            const parts = arn['Fn::Join'];
            if (Array.isArray(parts) && parts.length >= 2 && Array.isArray(parts[1])) {
              return parts[1].some((part: any) =>
                typeof part === 'string' && part.includes('AWSLambdaBasicExecutionRole')
              );
            }
          }
          return false;
        });
      });

      expect(hasBasicExecutionRole).toBe(true);
    });

    test('Should have S3 read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:HeadObject'],
            }),
          ]),
        },
      });
    });

    test('Should have SQS permissions for DLQ', () => {
      const policies = template.findResources('AWS::IAM::Policy');

      // Find a policy that contains SQS permissions
      const hasSqsPermissions = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('sqs:SendMessage')
        );
      });

      expect(hasSqsPermissions).toBe(true);
    });

    test('Should have X-Ray tracing permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');

      // Find a policy that contains X-Ray permissions
      const hasXrayPermissions = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('xray:PutTraceSegments')
        );
      });

      expect(hasXrayPermissions).toBe(true);
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('Should create exactly one SQS queue', () => {
      template.resourceCountIs('AWS::SQS::Queue', 1);
    });

    test('Should have KMS encryption enabled', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });

    test('Should have message retention period of 14 days', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });
  });

  describe('SNS Topic', () => {
    test('Should create exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('Should have display name configured', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Lambda Error Notifications',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should create exactly two CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('Should have Lambda error alarm with correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        Period: 300, // 5 minutes
        EvaluationPeriods: 1,
        Statistic: 'Sum',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Should have DLQ messages alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
        Threshold: 1,
        Period: 300,
        EvaluationPeriods: 1,
      });
    });

    test('Lambda error alarm should have SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        AlarmActions: Match.anyValue(),
      });
    });

    test('DLQ alarm should have SNS action', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        AlarmActions: Match.anyValue(),
      });
    });
  });

  describe('S3 Event Notification', () => {
    test('Should have Lambda permission for S3 to invoke function', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });

    test('Should configure S3 bucket notification', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Should have S3 Bucket ARN output', () => {
      template.hasOutput('S3BucketArn', {
        Description: 'ARN of the S3 bucket',
      });
    });

    test('Should have S3 Bucket Name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the S3 bucket',
      });
    });

    test('Should have Lambda Function ARN output', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'ARN of the Lambda function',
      });
    });

    test('Should have Lambda Function Name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Name of the Lambda function',
      });
    });

    test('Should have DLQ URL output', () => {
      template.hasOutput('DLQUrl', {
        Description: 'URL of the Dead Letter Queue',
      });
    });

    test('Should have Alarm Topic ARN output', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'ARN of the SNS topic for alarm notifications',
      });
    });
  });

  describe('Environment Suffix Support', () => {
    test('Should use environment suffix in resource names', () => {
      // Create a new app instance to avoid synthesis conflicts
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'lambda-dlq-prod',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-errors-topic-prod',
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-processor-prod',
      });
    });

    test('Should use environment suffix from CDK context', () => {
      // Create a new app instance with context
      const customApp = new cdk.App({
        context: {
          environmentSuffix: 'qa',
        },
      });
      const customStack = new TapStack(customApp, 'ContextStack');
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'lambda-dlq-qa',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-errors-topic-qa',
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-processor-qa',
      });
    });

    test('Should default to "dev" when no suffix provided', () => {
      // Create stack without props or context - should fall back to 'dev'
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'DefaultStack');
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'lambda-dlq-dev',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-errors-topic-dev',
      });

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 's3-processor-dev',
      });
    });
  });

  describe('Custom Bucket Name Support', () => {
    test('Should use custom bucket name when provided', () => {
      // Create a new app instance to avoid synthesis conflicts
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomBucketStack', {
        environmentSuffix: 'test',
        bucketName: 'my-custom-bucket-name',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'my-custom-bucket-name',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('Should create expected number of resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      // Note: Lambda function count may be > 1 due to custom resource handlers
      // We verify the main Lambda function exists in other tests
      template.resourceCountIs('AWS::SQS::Queue', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      // Lambda::Permission count may vary due to custom resources
      template.resourceCountIs('AWS::Lambda::EventInvokeConfig', 1);
    });
  });
});

```

## ./cdk.json

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
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
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
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
