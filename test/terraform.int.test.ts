// Integration tests for deployed Terraform infrastructure
// Tests validate actual deployed AWS resources

import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectLockConfigurationCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';

import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const REGION = 'us-east-1';

describe('Audit Logging Infrastructure Integration Tests', () => {
  describe('KMS Encryption', () => {
    const kmsClient = new KMSClient({ region: REGION });

    test('KMS key exists and is enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key rotation is enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('CloudWatch Logs', () => {
    const logsClient = new CloudWatchLogsClient({ region: REGION });

    test('audit events log group exists and is encrypted', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.cloudwatch_log_group_name);
      expect(logGroup.kmsKeyId).toBeDefined();
    });

    test('log group has correct retention period', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(3653); // 10 years
    });
  });

  describe('S3 Bucket Configuration', () => {
    const s3Client = new S3Client({ region: REGION });

    test('S3 bucket exists', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 versioning is enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 encryption is configured with KMS', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(outputs.kms_key_id);
    });

    test('S3 Object Lock is configured with GOVERNANCE mode', async () => {
      const command = new GetObjectLockConfigurationCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.ObjectLockConfiguration).toBeDefined();
      expect(response.ObjectLockConfiguration!.Rule).toBeDefined();
      expect(response.ObjectLockConfiguration!.Rule!.DefaultRetention!.Mode).toBe('GOVERNANCE');
      expect(response.ObjectLockConfiguration!.Rule!.DefaultRetention!.Years).toBe(10);
    });

    test('S3 public access is blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    const lambdaClient = new LambdaClient({ region: REGION });

    test('Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(outputs.lambda_function_name);
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Timeout).toBe(300);
      expect(response.Configuration!.MemorySize).toBe(512);
    });

  });

  describe('SNS Topic', () => {
    const snsClient = new SNSClient({ region: REGION });

    test('SNS topic exists and is encrypted', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('EventBridge Configuration', () => {
    const eventsClient = new EventBridgeClient({ region: REGION });

    test('EventBridge rule for critical events exists', async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.eventbridge_rule_critical_events,
      });
      const response = await eventsClient.send(command);

      expect(response.Name).toBe(outputs.eventbridge_rule_critical_events);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    test('EventBridge rule has SNS and CloudWatch Logs targets', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: outputs.eventbridge_rule_critical_events,
      });
      const response = await eventsClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThanOrEqual(2);

      const targetArns = response.Targets!.map(t => t.Arn);
      expect(targetArns).toContain(outputs.sns_topic_arn);
    });
  });

  describe('End-to-End Workflow', () => {
    const logsClient = new CloudWatchLogsClient({ region: REGION });

    test('can write logs to CloudWatch', async () => {
      const logStreamName = `test-stream-${Date.now()}`;

      // Create log stream
      const createStreamCommand = new CreateLogStreamCommand({
        logGroupName: outputs.cloudwatch_log_group_name,
        logStreamName,
      });
      await logsClient.send(createStreamCommand);

      // Put log events
      const putLogsCommand = new PutLogEventsCommand({
        logGroupName: outputs.cloudwatch_log_group_name,
        logStreamName,
        logEvents: [
          {
            message: JSON.stringify({
              eventType: 'TEST',
              requestId: 'test-123',
              transactionId: 'txn-456',
              timestamp: new Date().toISOString(),
            }),
            timestamp: Date.now(),
          },
        ],
      });
      const response = await logsClient.send(putLogsCommand);

      expect(response.nextSequenceToken).toBeDefined();

      // Verify log stream exists
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName: outputs.cloudwatch_log_group_name,
        logStreamNamePrefix: logStreamName,
      });
      const describeResponse = await logsClient.send(describeCommand);

      expect(describeResponse.logStreams).toBeDefined();
      expect(describeResponse.logStreams!.length).toBe(1);
      expect(describeResponse.logStreams![0].logStreamName).toBe(logStreamName);
    }, 60000);
  });
});
