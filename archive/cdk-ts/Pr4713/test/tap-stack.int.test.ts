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
