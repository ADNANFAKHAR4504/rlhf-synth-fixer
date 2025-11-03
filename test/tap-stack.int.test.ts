/**
 * Integration tests for TapStack
 *
 * Tests the deployed EC2 cost optimization infrastructure against real AWS resources.
 * These tests validate that the infrastructure works end-to-end.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

// Load stack outputs
const outputsPath = join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any;

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load stack outputs:', error);
  throw error;
}

describe('TapStack Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have all required stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.stopLambdaArn).toBeDefined();
      expect(outputs.startLambdaArn).toBeDefined();
      expect(outputs.stopRuleArn).toBeDefined();
      expect(outputs.startRuleArn).toBeDefined();
      expect(outputs.managedInstanceIds).toBeDefined();
      expect(outputs.estimatedMonthlySavings).toBeDefined();
    });

    it('should have valid Lambda ARN format', () => {
      expect(outputs.stopLambdaArn).toMatch(
        /^arn:aws:lambda:[\w-]+:\d{12}:function:[\w-]+$/
      );
      expect(outputs.startLambdaArn).toMatch(
        /^arn:aws:lambda:[\w-]+:\d{12}:function:[\w-]+$/
      );
    });

    it('should have valid EventBridge Rule ARN format', () => {
      expect(outputs.stopRuleArn).toMatch(
        /^arn:aws:events:[\w-]+:\d{12}:rule\/[\w-]+$/
      );
      expect(outputs.startRuleArn).toMatch(
        /^arn:aws:events:[\w-]+:\d{12}:rule\/[\w-]+$/
      );
    });

    it('should have managedInstanceIds as an array', () => {
      expect(Array.isArray(outputs.managedInstanceIds)).toBe(true);
    });

    it('should have estimatedMonthlySavings as a number', () => {
      expect(typeof outputs.estimatedMonthlySavings).toBe('number');
      expect(outputs.estimatedMonthlySavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Lambda Functions', () => {
    it('should have deployed stop Lambda function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(outputs.stopLambdaArn);
      expect(response.Configuration?.Runtime).toMatch(/nodejs/);
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(60);
    });

    it('should have deployed start Lambda function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.startLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(
        outputs.startLambdaArn
      );
      expect(response.Configuration?.Runtime).toMatch(/nodejs/);
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(60);
    });

    it('should have correct environment variables in stop function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TARGET_ENVIRONMENTS
      ).toBe('development,staging');
    });

    it('should have correct environment variables in start function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.startLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TARGET_ENVIRONMENTS
      ).toBe('development,staging');
    });

    it('should have IAM role attached to stop function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toMatch(
        /^arn:aws:iam::\d{12}:role\/[\w-]+$/
      );
    });

    it('should have IAM role attached to start function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.startLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toMatch(
        /^arn:aws:iam::\d{12}:role\/[\w-]+$/
      );
    });
  });

  describe('EventBridge Rules', () => {
    it('should have deployed stop rule', async () => {
      const ruleName = outputs.stopRuleArn.split('/').pop();
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.ScheduleExpression).toBe('cron(0 0 ? * MON-FRI *)');
      expect(response.State).toBe('ENABLED');
    });

    it('should have deployed start rule', async () => {
      const ruleName = outputs.startRuleArn.split('/').pop();
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.ScheduleExpression).toBe('cron(0 13 ? * MON-FRI *)');
      expect(response.State).toBe('ENABLED');
    });

    it('should have stop rule targeting stop Lambda', async () => {
      const ruleName = outputs.stopRuleArn.split('/').pop();
      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      expect(response.Targets?.[0].Arn).toBe(outputs.stopLambdaArn);
    });

    it('should have start rule targeting start Lambda', async () => {
      const ruleName = outputs.startRuleArn.split('/').pop();
      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      expect(response.Targets?.[0].Arn).toBe(outputs.startLambdaArn);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group for stop function', async () => {
      const functionName = outputs.stopLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
      expect(response.logGroups?.[0].retentionInDays).toBe(7);
    });

    it('should have log group for start function', async () => {
      const functionName = outputs.startLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
      expect(response.logGroups?.[0].retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have alarm for start function errors', async () => {
      const functionName = outputs.startLambdaArn.split(':').pop();
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'ec2-start-failure-alarm',
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.find(
        a => a.Dimensions?.find(d => d.Value === functionName)
      );
      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Statistic).toBe('Sum');
      expect(alarm?.Threshold).toBe(0);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Lambda Function Invocation', () => {
    it('should be able to invoke stop Lambda function', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.stopLambdaArn,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({})),
      });
      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(
        Buffer.from(response.Payload || '').toString()
      );
      expect(payload).toBeDefined();
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBeDefined();

      const body = JSON.parse(payload.body);
      expect(body.message).toBeDefined();
      expect(body.stoppedInstances).toBeDefined();
    });

    it('should be able to invoke start Lambda function', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.startLambdaArn,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({})),
      });
      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(
        Buffer.from(response.Payload || '').toString()
      );
      expect(payload).toBeDefined();
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBeDefined();

      const body = JSON.parse(payload.body);
      expect(body.message).toBeDefined();
      expect(body.startedInstances).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should have appropriate tags on Lambda functions', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Tags).toBeDefined();
      expect(Object.keys(response.Tags || {}).length).toBeGreaterThan(0);
    });
  });

  describe('Cost Calculation', () => {
    it('should return zero savings when no instances are managed', () => {
      if (outputs.managedInstanceIds.length === 0) {
        expect(outputs.estimatedMonthlySavings).toBe(0);
      } else {
        // If instances exist, savings should be positive
        expect(outputs.estimatedMonthlySavings).toBeGreaterThan(0);
      }
    });

    it('should calculate reasonable savings values', () => {
      // Savings should not be negative or unreasonably high
      expect(outputs.estimatedMonthlySavings).toBeGreaterThanOrEqual(0);
      expect(outputs.estimatedMonthlySavings).toBeLessThan(100000); // Sanity check
    });
  });
});
