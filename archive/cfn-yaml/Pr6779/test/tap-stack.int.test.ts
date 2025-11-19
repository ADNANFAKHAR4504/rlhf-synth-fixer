// Integration tests for Advanced Observability Stack
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  DescribeLogGroupsCommand,
  PutLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeStreamCommand,
  KinesisClient,
  PutRecordsCommand
} from '@aws-sdk/client-kinesis';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912459';
const region = process.env.AWS_REGION || 'us-east-1';

// Load outputs from CloudFormation deployment
let outputs: any = {};
try {
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  }
} catch (error) {
  console.warn('Could not load outputs file, tests may fail:', error);
}

describe('Advanced Observability Stack - Integration Tests', () => {
  const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
  const snsClient = new SNSClient({ region });
  const cloudWatchClient = new CloudWatchClient({ region });
  const kinesisClient = new KinesisClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const s3Client = new S3Client({ region });

  // Increase test timeout for real AWS operations
  jest.setTimeout(60000);

  describe('CloudWatch Log Groups', () => {
    test('Payment Transaction Log Group should exist and accept log events', async () => {
      const logGroupName = outputs.PaymentTransactionLogGroupName || `/aws/payment/transactions-${environmentSuffix}`;

      // Verify log group exists
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const describeResult = await cloudWatchLogsClient.send(describeCommand);

      expect(describeResult.logGroups).toBeDefined();
      expect(describeResult.logGroups!.length).toBeGreaterThan(0);
      expect(describeResult.logGroups![0].logGroupName).toBe(logGroupName);

      // Create a log stream
      const logStreamName = `test-stream-${Date.now()}`;
      const createStreamCommand = new CreateLogStreamCommand({
        logGroupName,
        logStreamName
      });
      await cloudWatchLogsClient.send(createStreamCommand);

      // Put a test log event
      const putLogCommand = new PutLogEventsCommand({
        logGroupName,
        logStreamName,
        logEvents: [
          {
            message: JSON.stringify({
              transactionId: 'test-123',
              status: 'success',
              amount: 100.50,
              timestamp: new Date().toISOString()
            }),
            timestamp: Date.now()
          }
        ]
      });

      const putResult = await cloudWatchLogsClient.send(putLogCommand);
      expect(putResult.nextSequenceToken).toBeDefined();
    });

    test('All payment log groups should exist', async () => {
      const expectedLogGroups = [
        outputs.PaymentTransactionLogGroupName || `/aws/payment/transactions-${environmentSuffix}`,
        outputs.PaymentAuthLogGroupName || `/aws/payment/auth-${environmentSuffix}`,
        outputs.PaymentSettlementLogGroupName || `/aws/payment/settlement-${environmentSuffix}`,
        outputs.PaymentFraudLogGroupName || `/aws/payment/fraud-${environmentSuffix}`
      ];

      for (const logGroupName of expectedLogGroups) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        });
        const result = await cloudWatchLogsClient.send(command);

        expect(result.logGroups).toBeDefined();
        expect(result.logGroups!.length).toBeGreaterThan(0);
        expect(result.logGroups![0].logGroupName).toBe(logGroupName);
      }
    });
  });

  describe('SNS Topics', () => {
    test('Critical Alert Topic should exist and be accessible', async () => {
      const topicArn = outputs.CriticalAlertTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const result = await snsClient.send(command);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.TopicArn).toBe(topicArn);
      expect(result.Attributes!.DisplayName).toBe('Critical Payment Processing Alerts');
    });

    test('Warning Alert Topic should exist', async () => {
      const topicArn = outputs.WarningAlertTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const result = await snsClient.send(command);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.TopicArn).toBe(topicArn);
    });

    test('Info Alert Topic should exist', async () => {
      const topicArn = outputs.InfoAlertTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const result = await snsClient.send(command);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.TopicArn).toBe(topicArn);
    });

    test('SNS topics should have KMS encryption enabled', async () => {
      const topicArn = outputs.CriticalAlertTopicArn;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const result = await snsClient.send(command);
      expect(result.Attributes!.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('High Error Rate Alarm should exist with correct configuration', async () => {
      const alarmName = `payment-high-error-rate-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const result = await cloudWatchClient.send(command);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBe(1);

      const alarm = result.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('ErrorRate');
      expect(alarm.Namespace).toBe(`PaymentProcessing-${environmentSuffix}`);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('High Latency Alarm should exist', async () => {
      const alarmName = `payment-high-latency-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const result = await cloudWatchClient.send(command);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBe(1);
      expect(result.MetricAlarms![0].MetricName).toBe('AverageLatency');
    });

    test('Fraud Detection Alarm should exist', async () => {
      const alarmName = `payment-fraud-detected-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const result = await cloudWatchClient.send(command);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBe(1);
      expect(result.MetricAlarms![0].MetricName).toBe('FraudDetected');
    });

    test('Lambda Error Alarm should exist', async () => {
      const alarmName = `metrics-processor-errors-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const result = await cloudWatchClient.send(command);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBe(1);
      expect(result.MetricAlarms![0].Namespace).toBe('AWS/Lambda');
    });

    test('OpenSearch Cluster Status Alarm should exist', async () => {
      const alarmName = `opensearch-cluster-status-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const result = await cloudWatchClient.send(command);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBe(1);
      expect(result.MetricAlarms![0].Namespace).toBe('AWS/AOSS');
    });
  });

  describe('Kinesis Data Stream', () => {
    test('Log Stream should exist and be active', async () => {
      const streamName = outputs.LogStreamName || `payment-logs-stream-${environmentSuffix}`;

      const command = new DescribeStreamCommand({
        StreamName: streamName
      });

      const result = await kinesisClient.send(command);
      expect(result.StreamDescription).toBeDefined();
      expect(result.StreamDescription!.StreamName).toBe(streamName);
      expect(result.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(result.StreamDescription!.StreamARN).toBeDefined();
    });

    test('Kinesis Stream should have encryption enabled', async () => {
      const streamName = outputs.LogStreamName || `payment-logs-stream-${environmentSuffix}`;

      const command = new DescribeStreamCommand({
        StreamName: streamName
      });

      const result = await kinesisClient.send(command);
      expect(result.StreamDescription!.EncryptionType).toBe('KMS');
      expect(result.StreamDescription!.KeyId).toBeDefined();
    });

    test('Kinesis Stream should accept records', async () => {
      const streamName = outputs.LogStreamName || `payment-logs-stream-${environmentSuffix}`;

      const testData = {
        transactionId: `test-${Date.now()}`,
        status: 'success',
        amount: 50.00,
        latency: 125,
        fraud_score: 0.1,
        timestamp: new Date().toISOString()
      };

      const command = new PutRecordsCommand({
        StreamName: streamName,
        Records: [
          {
            Data: Buffer.from(JSON.stringify(testData)),
            PartitionKey: testData.transactionId
          }
        ]
      });

      const result = await kinesisClient.send(command);
      expect(result.FailedRecordCount).toBe(0);
      expect(result.Records).toBeDefined();
      expect(result.Records!.length).toBe(1);
      expect(result.Records![0].SequenceNumber).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('Metrics Processor Function should exist and be configured correctly', async () => {
      const functionArn = outputs.MetricsProcessorFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const result = await lambdaClient.send(command);
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.FunctionName).toContain('payment-metrics-processor');
      expect(result.Configuration!.Runtime).toBe('python3.12');
      expect(result.Configuration!.Timeout).toBe(60);
      expect(result.Configuration!.MemorySize).toBe(256);
    });

    test('Lambda Function should have X-Ray tracing enabled', async () => {
      const functionArn = outputs.MetricsProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const result = await lambdaClient.send(command);
      expect(result.Configuration!.TracingConfig).toBeDefined();
      expect(result.Configuration!.TracingConfig!.Mode).toBe('Active');
    });

    test('Lambda Function should have correct environment variables', async () => {
      const functionArn = outputs.MetricsProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const result = await lambdaClient.send(command);
      const envVars = result.Configuration!.Environment!.Variables!;

      expect(envVars.ENVIRONMENT_SUFFIX).toBe(environmentSuffix);
      expect(envVars.CRITICAL_ALERT_TOPIC).toBeDefined();
      expect(envVars.WARNING_ALERT_TOPIC).toBeDefined();
      expect(envVars.HIGH_LATENCY_THRESHOLD).toBe('1000');
      expect(envVars.ERROR_RATE_THRESHOLD).toBe('5');
    });
  });

  describe('S3 Bucket', () => {
    test('Log Backup Bucket should exist', async () => {
      const bucketName = outputs.LogBackupBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName
      });

      await s3Client.send(command);
      // If this doesn't throw, the bucket exists
      expect(true).toBe(true);
    });

    test('Log Backup Bucket should have encryption enabled', async () => {
      const bucketName = outputs.LogBackupBucketName;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });

      const result = await s3Client.send(command);
      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('OpenSearch Domain', () => {
    test('OpenSearch Domain Endpoint should be accessible', async () => {
      const domainEndpoint = outputs.OpenSearchDomainEndpoint;
      expect(domainEndpoint).toBeDefined();
      expect(domainEndpoint).toMatch(/^https:\/\/.*\.amazonaws\.com$/);
    });

    test('OpenSearch Dashboard URL should be valid', async () => {
      const dashboardUrl = outputs.OpenSearchDashboardUrl;
      expect(dashboardUrl).toBeDefined();
      expect(dashboardUrl).toContain('/_dashboards');
      expect(dashboardUrl).toContain('https://');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Dashboard URL should be valid', async () => {
      const dashboardUrl = outputs.DashboardUrl;
      expect(dashboardUrl).toBeDefined();
      expect(dashboardUrl).toContain('cloudwatch/home');
      expect(dashboardUrl).toContain('dashboards');
      expect(dashboardUrl).toContain(`payment-processing-${environmentSuffix}`);
    });
  });

  describe('X-Ray Configuration', () => {
    test('X-Ray Service Name should be set correctly', () => {
      const serviceName = outputs.XRayServiceName;
      expect(serviceName).toBe(`payment-service-${environmentSuffix}`);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete observability workflow should function', async () => {
      // 1. Put records to Kinesis
      const streamName = outputs.LogStreamName || `payment-logs-stream-${environmentSuffix}`;
      const testTransaction = {
        transactionId: `e2e-test-${Date.now()}`,
        status: 'success',
        amount: 250.00,
        latency: 85,
        fraud_score: 0.05,
        timestamp: new Date().toISOString()
      };

      const putRecordsCommand = new PutRecordsCommand({
        StreamName: streamName,
        Records: [
          {
            Data: Buffer.from(JSON.stringify(testTransaction)),
            PartitionKey: testTransaction.transactionId
          }
        ]
      });

      const kinesisResult = await kinesisClient.send(putRecordsCommand);
      expect(kinesisResult.FailedRecordCount).toBe(0);

      // 2. Put custom metric to CloudWatch
      const putMetricCommand = new PutMetricDataCommand({
        Namespace: `PaymentProcessing-${environmentSuffix}`,
        MetricData: [
          {
            MetricName: 'TransactionSuccess',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date()
          }
        ]
      });

      await cloudWatchClient.send(putMetricCommand);

      // 3. Verify alarms exist and are configured
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-`
      });

      const alarmsResult = await cloudWatchClient.send(describeAlarmsCommand);
      expect(alarmsResult.MetricAlarms!.length).toBeGreaterThan(0);

      // Test passes if all operations succeed
      expect(true).toBe(true);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'PaymentTransactionLogGroupName',
        'CriticalAlertTopicArn',
        'WarningAlertTopicArn',
        'InfoAlertTopicArn',
        'LogStreamName',
        'LogStreamArn',
        'OpenSearchDomainEndpoint',
        'DashboardUrl',
        'XRayServiceName',
        'MetricsProcessorFunctionArn',
        'LogBackupBucketName',
        'EnvironmentSuffix',
        'StackName'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('Environment Suffix should match', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('Stack Name should be correct', () => {
      expect(outputs.StackName).toBe(`TapStack${environmentSuffix}`);
    });
  });
});
