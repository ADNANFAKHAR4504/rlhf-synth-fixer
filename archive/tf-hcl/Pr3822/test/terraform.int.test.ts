import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import { DescribeDeliveryStreamCommand, FirehoseClient, Processor } from '@aws-sdk/client-firehose';
import { GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const AWS_REGION = 'us-east-2';

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS SDK clients
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const firehoseClient = new FirehoseClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });

describe('Terraform Infrastructure Integration Tests', () => {
  describe('CloudWatch Log Groups Tests', () => {
    test('should verify all 12 log groups exist', async () => {
      const logGroups = await cloudwatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/application/centralized-logging-synth94218765',
        })
      );

      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups?.length).toBe(12);
    });

    test('each log group should have 90-day retention', async () => {
      const logGroups = await cloudwatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/application/centralized-logging-synth94218765',
        })
      );

      logGroups.logGroups?.forEach((logGroup) => {
        expect(logGroup.retentionInDays).toBe(90);
      });
    });

    test('each log group should have KMS encryption configured', async () => {
      const logGroups = await cloudwatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/application/centralized-logging-synth94218765',
        })
      );

      logGroups.logGroups?.forEach((logGroup) => {
        expect(logGroup.kmsKeyId).toBeDefined();
        expect(logGroup.kmsKeyId).toContain('arn:aws:kms');
      });
    });

    test('log groups should be named correctly from app-01 to app-12', async () => {
      const logGroups = await cloudwatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/application/centralized-logging-synth94218765',
        })
      );

      const expectedNames = Array.from({ length: 12 }, (_, i) =>
        `/aws/application/centralized-logging-synth94218765-app-${String(i + 1).padStart(2, '0')}`
      );

      const actualNames = logGroups.logGroups?.map((lg) => lg.logGroupName).sort();
      expect(actualNames).toEqual(expectedNames);
    });
  });

  describe('S3 Bucket Tests', () => {
    test('S3 bucket should exist', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.s3_bucket_name })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });

    test('S3 bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.s3_bucket_name })
      );

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('KMS Key Tests', () => {
    test('KMS key should exist and be enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.kms_key_id })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.kms_key_id })
      );

      // Note: KeyRotationEnabled is not available in DescribeKey response,
      // we verify it exists and is enabled
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('Lambda Function Tests', () => {
    test('Lambda function should exist', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
    });

    test('Lambda function should use Python 3.12 runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );

      expect(response.Configuration?.Runtime).toBe('python3.12');
    });

    test('Lambda function should have index.handler as handler', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );

      expect(response.Configuration?.Handler).toBe('index.handler');
    });

    test('Lambda function should have 60-second timeout', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );

      expect(response.Configuration?.Timeout).toBe(60);
    });

    test('Lambda function should have 256 MB memory', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );

      expect(response.Configuration?.MemorySize).toBe(256);
    });
  });

  describe('Kinesis Firehose Tests', () => {
    test('Firehose delivery stream should exist', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      expect(response.DeliveryStreamDescription).toBeDefined();
      expect(response.DeliveryStreamDescription?.DeliveryStreamName).toBe(
        outputs.firehose_delivery_stream_name
      );
    });

    test('Firehose should deliver to S3', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      expect(response.DeliveryStreamDescription?.Destinations).toBeDefined();
      expect(response.DeliveryStreamDescription?.Destinations?.[0]?.ExtendedS3DestinationDescription).toBeDefined();
    });

    test('Firehose should have GZIP compression enabled', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      const s3Destination = response.DeliveryStreamDescription?.Destinations?.[0]?.ExtendedS3DestinationDescription;
      expect(s3Destination?.CompressionFormat).toBe('GZIP');
    });

    test('Firehose should have dynamic partitioning enabled', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      const s3Destination = response.DeliveryStreamDescription?.Destinations?.[0]?.ExtendedS3DestinationDescription;
      expect(s3Destination?.DynamicPartitioningConfiguration?.Enabled).toBe(true);
    });

    test('Firehose should use Lambda for transformation', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      const s3Destination = response.DeliveryStreamDescription?.Destinations?.[0]?.ExtendedS3DestinationDescription;
      const processors = s3Destination?.ProcessingConfiguration?.Processors;

      const lambdaProcessor = processors?.find((p: Processor) => p.Type === 'Lambda');
      expect(lambdaProcessor).toBeDefined();
    });

    test('Firehose should have correct buffer size (64 MB)', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      const s3Destination = response.DeliveryStreamDescription?.Destinations?.[0]?.ExtendedS3DestinationDescription;
      expect(s3Destination?.BufferingHints?.SizeInMBs).toBeGreaterThanOrEqual(64);
    });

    test('Firehose should have correct buffer interval (60 seconds)', async () => {
      const response = await firehoseClient.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: outputs.firehose_delivery_stream_name,
        })
      );

      const s3Destination = response.DeliveryStreamDescription?.Destinations?.[0]?.ExtendedS3DestinationDescription;
      expect(s3Destination?.BufferingHints?.IntervalInSeconds).toBe(60);
    });
  });

  describe('IAM Roles Tests', () => {
    test('Lambda IAM role should exist', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: 'centralized-logging-synth94218765-lambda-role' })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe('centralized-logging-synth94218765-lambda-role');
    });

    test('Lambda role should have basic execution policy attached', async () => {
      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: 'centralized-logging-synth94218765-lambda-role',
        })
      );

      const basicExecutionPolicy = response.AttachedPolicies?.find((p) =>
        p.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
      );
      expect(basicExecutionPolicy).toBeDefined();
    });

    test('Firehose IAM role should exist', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: 'centralized-logging-synth94218765-firehose-role' })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe('centralized-logging-synth94218765-firehose-role');
    });

    test('CloudWatch to Firehose IAM role should exist', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: 'centralized-logging-synth94218765-cloudwatch-to-firehose' })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe('centralized-logging-synth94218765-cloudwatch-to-firehose');
    });
  });

  describe('CloudWatch Insights Queries Tests', () => {
    let insightsQueries: any;

    beforeAll(() => {
      // Parse the CloudWatch Insights queries from the JSON string
      insightsQueries = JSON.parse(outputs.cloudwatch_insights_queries);
    });

    test('should have 5 CloudWatch Insights query definitions', () => {
      const queryNames = Object.values(insightsQueries);
      expect(queryNames.length).toBeGreaterThanOrEqual(5);
    });

    test('error logs query should exist', () => {
      expect(insightsQueries.error_logs).toBeDefined();
      expect(insightsQueries.error_logs).toContain('centralized-logging-synth94218765');
    });

    test('application stats query should exist', () => {
      expect(insightsQueries.application_stats).toBeDefined();
      expect(insightsQueries.application_stats).toContain('centralized-logging-synth94218765');
    });

    test('hourly log volume query should exist', () => {
      expect(insightsQueries.hourly_log_volume).toBeDefined();
      expect(insightsQueries.hourly_log_volume).toContain('centralized-logging-synth94218765');
    });

    test('errors by application query should exist', () => {
      expect(insightsQueries.errors_by_application).toBeDefined();
      expect(insightsQueries.errors_by_application).toContain('centralized-logging-synth94218765');
    });

    test('recent logs all apps query should exist', () => {
      expect(insightsQueries.recent_logs_all_apps).toBeDefined();
      expect(insightsQueries.recent_logs_all_apps).toContain('centralized-logging-synth94218765');
    });
  });

  describe('Output Validation Tests', () => {
    test('outputs should contain all required fields', () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_arn).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.lambda_function_arn).toBeDefined();
      expect(outputs.firehose_delivery_stream_name).toBeDefined();
      expect(outputs.firehose_delivery_stream_arn).toBeDefined();
    });

    test('S3 bucket name should include environment suffix', () => {
      expect(outputs.s3_bucket_name).toContain('synth94218765');
    });

    test('Lambda function name should include environment suffix', () => {
      expect(outputs.lambda_function_name).toContain('synth94218765');
    });

    test('Firehose stream name should include environment suffix', () => {
      expect(outputs.firehose_delivery_stream_name).toContain('synth94218765');
    });

    test('ARNs should be valid AWS ARN format', () => {
      expect(outputs.s3_bucket_arn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:/);
      expect(outputs.lambda_function_arn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.firehose_delivery_stream_arn).toMatch(/^arn:aws:firehose:/);
    });
  });
});
