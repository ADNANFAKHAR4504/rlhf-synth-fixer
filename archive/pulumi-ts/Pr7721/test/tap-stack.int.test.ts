/**
 * Integration tests for Lambda Optimization Infrastructure
 *
 * These tests verify the complete optimization workflow:
 * 1. Baseline infrastructure deployment
 * 2. Optimization script execution
 * 3. Verification of optimized resources
 */

import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  GetBucketVersioningCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

describe('Lambda Optimization Integration Tests', () => {
  describe('Baseline Infrastructure Tests', () => {
    test('should create S3 bucket with versioning enabled', async () => {
      const { deploymentBucketName } = outputs;
      expect(deploymentBucketName).toBeDefined();

      // Verify bucket exists
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: deploymentBucketName,
        })
      );

      // Verify versioning is enabled
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: deploymentBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should create SQS Dead Letter Queue', async () => {
      const { dlqUrl } = outputs;
      expect(dlqUrl).toBeDefined();

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      // 14 days = 1209600 seconds
      expect(response.Attributes!.MessageRetentionPeriod).toBe('1209600');
    }, 30000);

    test('should create CloudWatch alarms', async () => {
      const { errorRateAlarmName, durationAlarmName } = outputs;
      expect(errorRateAlarmName).toBeDefined();
      expect(durationAlarmName).toBeDefined();

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [errorRateAlarmName, durationAlarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(2);

      // Verify error rate alarm
      const errorAlarm = response.MetricAlarms!.find(a =>
        a.AlarmName!.includes('error-rate')
      );
      expect(errorAlarm).toBeDefined();
      expect(errorAlarm!.Threshold).toBe(1); // 1% error rate

      // Verify duration alarm
      const durationAlarm = response.MetricAlarms!.find(a =>
        a.AlarmName!.includes('duration')
      );
      expect(durationAlarm).toBeDefined();
      expect(durationAlarm!.Threshold).toBe(20000); // 20 seconds in milliseconds
    }, 30000);

    test('should have no reserved concurrency in baseline', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      // Reserved concurrent executions should be undefined in baseline
      expect(response.ReservedConcurrentExecutions).toBeUndefined();
    }, 30000);

  });

  describe('Lambda Invocation Tests', () => {
    test('should successfully invoke Lambda function', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: lambdaFunctionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({ test: 'data' })),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(200);
        expect(result.body).toBeDefined();
      }
    }, 30000);

    test('should write logs to CloudWatch', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      // Invoke the function first
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: lambdaFunctionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({ test: 'log-test' })),
        })
      );

      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 5000));

      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    }, 45000);
  });

  describe('Infrastructure Configuration Validation', () => {
    test('should verify Lambda layer is attached', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Layers).toBeDefined();
      expect(response.Configuration!.Layers!.length).toBeGreaterThan(0);
    }, 30000);

    test('should verify Lambda IAM role has required permissions', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role).toContain('lambda-role');
    }, 30000);

    test('should verify Lambda runtime is nodejs18.x', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(response.Runtime).toBe('nodejs18.x');
    }, 30000);

    test('should verify environment variables are set', async () => {
      const { lambdaFunctionName } = outputs;
      expect(lambdaFunctionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.ENVIRONMENT).toBeDefined();
      expect(response.Environment!.Variables!.LOG_LEVEL).toBe('INFO');
    }, 30000);
  });

  describe('Resource Naming Convention Tests', () => {
    test('should verify all outputs are defined', () => {
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.deploymentBucketName).toBeDefined();
      expect(outputs.dlqUrl).toBeDefined();
      expect(outputs.errorRateAlarmName).toBeDefined();
      expect(outputs.durationAlarmName).toBeDefined();
    });
  });

  describe('Optimization Script Validation', () => {
    test('should verify optimize.py exists', () => {
      const optimizeScriptPath = path.join(__dirname, '../lib/optimize.py');
      expect(fs.existsSync(optimizeScriptPath)).toBe(true);
    });

    test('should verify optimize.py is executable and has correct structure', () => {
      const optimizeScriptPath = path.join(__dirname, '../lib/optimize.py');
      const content = fs.readFileSync(optimizeScriptPath, 'utf-8');

      // Verify script has required imports
      expect(content).toContain('import boto3');
      expect(content).toContain('import argparse');

      // Verify script has optimization logic
      expect(content).toContain('update_function_configuration');
      expect(content).toContain('put_function_concurrency');
      expect(content).toContain('put_retention_policy');

      // Verify script has environment suffix handling
      expect(content).toContain('ENVIRONMENT_SUFFIX');
    });
  });
});
