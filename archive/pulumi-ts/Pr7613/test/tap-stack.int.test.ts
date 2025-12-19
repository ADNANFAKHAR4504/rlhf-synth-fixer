import * as fs from 'fs';
import * as path from 'path';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

/**
 * Integration tests for Lambda ETL Stack
 * Tests deployed AWS resources using actual stack outputs
 */

describe('Lambda ETL Stack Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';
  const lambdaClient = new LambdaClient({ region });
  const sqsClient = new SQSClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    } else {
      throw new Error(
        'Deployment outputs not found. Please deploy the stack first.'
      );
    }
  });

  describe('Lambda Functions', () => {
    it('should verify API Handler function exists and is configured correctly', async () => {
      const arn = outputs.apiHandlerFunctionArn;
      expect(arn).toBeDefined();

      const functionName = arn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
      expect(response.MemorySize).toBe(512);
      expect(response.Timeout).toBe(30);
      expect(response.TracingConfig?.Mode).toBe('Active');
      expect(response.DeadLetterConfig?.TargetArn).toBeDefined();
    });

    it('should verify Batch Processor function exists and is configured correctly', async () => {
      const arn = outputs.batchProcessorFunctionArn;
      expect(arn).toBeDefined();

      const functionName = arn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
      expect(response.MemorySize).toBe(1024);
      expect(response.Timeout).toBe(300);
      expect(response.TracingConfig?.Mode).toBe('Active');
      expect(response.DeadLetterConfig?.TargetArn).toBeDefined();
    });

    it('should verify Transform function exists and is configured correctly', async () => {
      const arn = outputs.transformFunctionArn;
      expect(arn).toBeDefined();

      const functionName = arn.split(':').pop();
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
      expect(response.MemorySize).toBe(512);
      expect(response.Timeout).toBe(30);
      expect(response.TracingConfig?.Mode).toBe('Active');
      expect(response.DeadLetterConfig?.TargetArn).toBeDefined();
    });
  });

  describe('Dead Letter Queue', () => {
    it('should verify DLQ exists with correct configuration', async () => {
      const queueUrl = outputs.dlqUrl;
      expect(queueUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['MessageRetentionPeriod', 'QueueArn'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(response.Attributes?.QueueArn).toBeDefined();
    });
  });

  describe('Lambda Layer', () => {
    it('should verify Lambda layer exists', async () => {
      const layerArn = outputs.layerArn;
      expect(layerArn).toBeDefined();
      expect(layerArn).toContain('shared-deps-layer');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should verify log groups exist for all Lambda functions', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      // Check each log group individually instead of fetching all
      const logGroupNames = [
        `/aws/lambda/api-handler-${environmentSuffix}`,
        `/aws/lambda/batch-processor-${environmentSuffix}`,
        `/aws/lambda/transform-${environmentSuffix}`,
      ];

      for (const logGroupName of logGroupNames) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });
        const response = await logsClient.send(command);

        expect(response.logGroups?.length).toBeGreaterThan(0);
        expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
      }
    });
  });

  describe('Resource Naming', () => {
    it('should verify all resources use environmentSuffix', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      expect(outputs.apiHandlerFunctionArn).toContain(environmentSuffix);
      expect(outputs.batchProcessorFunctionArn).toContain(environmentSuffix);
      expect(outputs.transformFunctionArn).toContain(environmentSuffix);
      expect(outputs.dlqUrl).toContain(environmentSuffix);
      expect(outputs.layerArn).toContain(environmentSuffix);
    });
  });
});
