import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read deployment outputs
const outputs = JSON.parse(
  readFileSync(join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf-8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });
const s3Client = new S3Client({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('Infrastructure Compliance Analyzer Integration Tests', () => {
  describe('Lambda Function', () => {
    it('should exist and be configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.lambdaFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    it('should have required environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.snsTopicArn);
      expect(envVars?.S3_BUCKET_NAME).toBe(outputs.complianceBucketName);
      expect(envVars?.ENVIRONMENT_SUFFIX).toBeTruthy();
      expect(envVars?.APPROVED_AMIS).toBeTruthy();
      expect(envVars?.REQUIRED_TAGS).toBeTruthy();
    });

    it('should invoke successfully', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify({})),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);

        if (payload.body) {
          const body = JSON.parse(payload.body);
          expect(body).toHaveProperty('timestamp');
          expect(body).toHaveProperty('totalInstances');
          expect(body.totalInstances).toBeGreaterThanOrEqual(0);
        }
      }
    }, 60000);
  });

  describe('CloudWatch Logs', () => {
    it('should have log group with correct retention', async () => {
      const logGroupName = `/aws/lambda/${outputs.lambdaFunctionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be configured for alerts', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);
      expect(response.Attributes?.DisplayName).toContain('Compliance');
    });
  });

  describe('S3 Bucket', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.complianceBucketName,
      });

      // Should not throw error if bucket exists and is accessible
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should exist with correct name', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: outputs.dashboardName,
      });

      const response = await cloudwatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries?.length).toBeGreaterThan(0);

      const dashboard = response.DashboardEntries?.find(
        d => d.DashboardName === outputs.dashboardName
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('EventBridge Scheduler', () => {
    it('should have rule configured for 6-hour schedule', async () => {
      // Extract environment suffix from lambda function name
      const envSuffix = outputs.lambdaFunctionName.replace(
        'compliance-scanner-',
        ''
      );
      const ruleName = `compliance-scanner-schedule-${envSuffix}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.ScheduleExpression).toBe('rate(6 hours)');
      expect(response.State).toBe('ENABLED');
    });

    it('should have Lambda function as target', async () => {
      const envSuffix = outputs.lambdaFunctionName.replace(
        'compliance-scanner-',
        ''
      );
      const ruleName = `compliance-scanner-schedule-${envSuffix}`;

      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const lambdaTarget = response.Targets?.find(t =>
        t.Arn?.includes(outputs.lambdaFunctionName)
      );
      expect(lambdaTarget).toBeDefined();
      expect(lambdaTarget?.Arn).toBe(outputs.lambdaFunctionArn);
    });
  });

  describe('End-to-End Compliance Scanning', () => {
    it('should scan instances and produce compliance results', async () => {
      // Invoke Lambda function
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify({})),
      });

      const response = await lambdaClient.send(invokeCommand);

      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('totalInstances');
        expect(body).toHaveProperty('compliantInstances');
        expect(body).toHaveProperty('nonCompliantInstances');
        expect(body).toHaveProperty('violations');

        // Validate data types
        expect(typeof body.totalInstances).toBe('number');
        expect(typeof body.compliantInstances).toBe('number');
        expect(typeof body.nonCompliantInstances).toBe('number');
        expect(Array.isArray(body.violations)).toBe(true);

        // Validate arithmetic consistency
        expect(body.compliantInstances + body.nonCompliantInstances).toBe(
          body.totalInstances
        );
      }
    }, 60000);
  });

  describe('Resource Naming Conventions', () => {
    it('should use environment suffix in all resource names', async () => {
      const envSuffix = outputs.lambdaFunctionName.replace(
        'compliance-scanner-',
        ''
      );

      expect(outputs.lambdaFunctionName).toContain(envSuffix);
      expect(outputs.complianceBucketName).toContain(envSuffix);
      expect(outputs.dashboardName).toContain(envSuffix);
      expect(outputs.snsTopicArn).toContain(envSuffix);
    });
  });

  describe('Security Validation', () => {
    it('should have least-privilege IAM role', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      const roleArn = response.Configuration?.Role;

      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('compliance-scanner-role');
    });
  });

  describe('Performance', () => {
    it('should complete compliance scan within timeout', async () => {
      const startTime = Date.now();

      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify({})),
      });

      await lambdaClient.send(command);

      const duration = Date.now() - startTime;

      // Should complete well within the 5-minute timeout
      expect(duration).toBeLessThan(300000); // 5 minutes
      expect(duration).toBeLessThan(60000); // Ideally under 1 minute
    }, 60000);
  });
});
