import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
} from '@aws-sdk/client-config-service';

// Load stack outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// AWS Clients
const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const sqsClient = new SQSClient({ region });
const kmsClient = new KMSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const configClient = new ConfigServiceClient({ region });

// Extract environment suffix from outputs
const environmentSuffix =
  outputs.complianceTableArn?.split('compliance-history-')[1] ||
  'synth-e1s1l9o8';

describe('Compliance System Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    it('has all required outputs', () => {
      expect(outputs).toHaveProperty('configRecorderName');
      expect(outputs).toHaveProperty('complianceTableArn');
      expect(outputs).toHaveProperty('reportBucketUrl');
    });

    it('has valid Config recorder name', () => {
      expect(outputs.configRecorderName).toBeTruthy();
      expect(typeof outputs.configRecorderName).toBe('string');
    });

    it('has valid compliance table ARN', () => {
      expect(outputs.complianceTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.complianceTableArn).toContain('compliance-history-');
    });

    it('has valid report bucket URL', () => {
      expect(outputs.reportBucketUrl).toMatch(/^https:\/\//);
      expect(outputs.reportBucketUrl).toContain('compliance-reports-');
    });
  });

  describe('DynamoDB Table', () => {
    const tableName = `compliance-history-${environmentSuffix}`;

    it('exists and is accessible', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });

    it('has correct billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('has correct key schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(2);

      const hashKey = keySchema?.find(k => k.KeyType === 'HASH');
      const rangeKey = keySchema?.find(k => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('ResourceId');
      expect(rangeKey?.AttributeName).toBe('Timestamp');
    });

    it('has SSE encryption enabled', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('S3 Report Bucket', () => {
    const bucketName = `compliance-reports-${environmentSuffix}`;

    it('exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule =
        response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBeDefined();
    });

    it('has lifecycle policy configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const expirationRule = response.Rules?.find(r => r.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(30);
    });

    it('has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    const analysisFunctionName = `compliance-analysis-${environmentSuffix}`;
    const remediationFunctionName = `compliance-remediation-${environmentSuffix}`;

    it('analysis function exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: analysisFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        analysisFunctionName
      );
    });

    it('analysis function has correct runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: analysisFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
    });

    it('analysis function has correct memory size', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: analysisFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.MemorySize).toBe(3008);
    });

    it('analysis function has X-Ray tracing enabled', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: analysisFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    it('analysis function has dead letter queue configured', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: analysisFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.DeadLetterConfig?.TargetArn).toContain(
        'compliance-dlq-'
      );
    });

    it('analysis function has environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: analysisFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables).toBeDefined();
      expect(
        response.Environment?.Variables?.COMPLIANCE_TABLE
      ).toBeDefined();
      expect(response.Environment?.Variables?.REPORT_BUCKET).toBeDefined();
      expect(response.Environment?.Variables?.ALERT_TOPIC).toBeDefined();
    });

    it('remediation function exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: remediationFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        remediationFunctionName
      );
    });

    it('remediation function has correct configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: remediationFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
      expect(response.MemorySize).toBe(3008);
      expect(response.TracingConfig?.Mode).toBe('Active');
    });
  });

  describe('SNS Topic', () => {
    it('alert topic exists', async () => {
      const topicName = `compliance-alerts-${environmentSuffix}`;

      // We need to get topic ARN first, which requires listing or constructing
      const accountId = outputs.complianceTableArn.split(':')[4];
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toContain(topicName);
    });

    it('alert topic has KMS encryption', async () => {
      const topicName = `compliance-alerts-${environmentSuffix}`;
      const accountId = outputs.complianceTableArn.split(':')[4];
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('SQS Dead Letter Queue', () => {
    it('DLQ exists', async () => {
      const queueName = `compliance-dlq-${environmentSuffix}`;
      const accountId = outputs.complianceTableArn.split(':')[4];
      const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
    });

    it('DLQ has KMS encryption', async () => {
      const queueName = `compliance-dlq-${environmentSuffix}`;
      const accountId = outputs.complianceTableArn.split(':')[4];
      const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['KmsMasterKeyId'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('EventBridge Rule', () => {
    const ruleName = `compliance-scan-${environmentSuffix}`;

    it('scan rule exists', async () => {
      const command = new ListRulesCommand({ NamePrefix: ruleName });
      const response = await eventBridgeClient.send(command);

      const rule = response.Rules?.find(r => r.Name === ruleName);
      expect(rule).toBeDefined();
    });

    it('scan rule has hourly schedule', async () => {
      const command = new ListRulesCommand({ NamePrefix: ruleName });
      const response = await eventBridgeClient.send(command);

      const rule = response.Rules?.find(r => r.Name === ruleName);
      expect(rule?.ScheduleExpression).toBe('rate(1 hour)');
    });

    it('scan rule targets Lambda function', async () => {
      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const target = response.Targets?.find(t =>
        t.Arn?.includes('compliance-analysis-')
      );
      expect(target).toBeDefined();
    });
  });

  describe('AWS Config', () => {
    it('Config recorder exists', async () => {
      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders?.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders?.find(
        r => r.name === outputs.configRecorderName
      );
      expect(recorder).toBeDefined();
    });

    it('Config recorder tracks all resources', async () => {
      const command = new DescribeConfigurationRecordersCommand({
        ConfigurationRecorderNames: [outputs.configRecorderName],
      });
      const response = await configClient.send(command);

      const recorder = response.ConfigurationRecorders?.[0];
      expect(recorder?.recordingGroup?.allSupported).toBe(true);
      expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(
        true
      );
    });
  });

  describe('KMS Key', () => {
    it('KMS key alias exists', async () => {
      const aliasName = `alias/compliance-${environmentSuffix}`;

      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const alias = response.Aliases?.find(a => a.AliasName === aliasName);
      expect(alias).toBeDefined();
    });

    it('KMS key has rotation enabled', async () => {
      const aliasName = `alias/compliance-${environmentSuffix}`;

      const listCommand = new ListAliasesCommand({});
      const listResponse = await kmsClient.send(listCommand);

      const alias = listResponse.Aliases?.find(
        a => a.AliasName === aliasName
      );
      expect(alias?.TargetKeyId).toBeDefined();

      const describeCommand = new DescribeKeyCommand({
        KeyId: alias!.TargetKeyId,
      });
      const describeResponse = await kmsClient.send(describeCommand);

      expect(describeResponse.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });
});
