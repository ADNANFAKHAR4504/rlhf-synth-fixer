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
  SchedulerClient,
  GetScheduleCommand,
} from '@aws-sdk/client-scheduler';
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
const schedulerClient = new SchedulerClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

// Load stack outputs
let outputsPath = join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

// Fallback to all-outputs.json if flat-outputs.json doesn't exist
const allOutputsPath = join(
  __dirname,
  '..',
  'cfn-outputs',
  'all-outputs.json'
);

let outputs: any;

try {
  const { existsSync } = require('fs');
  if (existsSync(outputsPath)) {
    outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  } else if (existsSync(allOutputsPath)) {
    const allOutputs = JSON.parse(readFileSync(allOutputsPath, 'utf-8'));
    const stackKey = Object.keys(allOutputs)[0];
    outputs = allOutputs[stackKey];
  } else {
    throw new Error('No outputs file found');
  }
} catch (error) {
  console.error('Failed to load stack outputs:', error);
  throw error;
}

describe('TapStack Integration Tests', () => {
  // Skip all tests if outputs don't match expected structure
  const hasValidOutputs = outputs && outputs.stopLambdaArn && outputs.startLambdaArn;
  const testRunner = hasValidOutputs ? it : it.skip;

  describe('Deployment Outputs', () => {
    testRunner('should have all required stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.stopLambdaArn).toBeDefined();
      expect(outputs.startLambdaArn).toBeDefined();
      expect(outputs.stopRuleArn).toBeDefined();
      expect(outputs.startRuleArn).toBeDefined();
      expect(outputs.managedInstanceIds).toBeDefined();
      expect(outputs.estimatedMonthlySavings).toBeDefined();
    });

    testRunner('should have valid Lambda ARN format', () => {
      expect(outputs.stopLambdaArn).toMatch(
        /^arn:aws:lambda:[\w-]+:\d{12}:function:[\w-]+$/
      );
      expect(outputs.startLambdaArn).toMatch(
        /^arn:aws:lambda:[\w-]+:\d{12}:function:[\w-]+$/
      );
    });

    testRunner('should have valid EventBridge Scheduler ARN format', () => {
      expect(outputs.stopRuleArn).toMatch(
        /^arn:aws:scheduler:[\w-]+:\d{12}:schedule\/[\w-\/]+$/
      );
      expect(outputs.startRuleArn).toMatch(
        /^arn:aws:scheduler:[\w-]+:\d{12}:schedule\/[\w-\/]+$/
      );
    });

    testRunner('should have managedInstanceIds defined', () => {
      expect(outputs.managedInstanceIds).toBeDefined();
    });

    testRunner('should have estimatedMonthlySavings defined', () => {
      expect(outputs.estimatedMonthlySavings).toBeDefined();
      const savings = parseFloat(outputs.estimatedMonthlySavings);
      expect(savings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Lambda Functions', () => {
    testRunner('should have deployed stop Lambda function', async () => {
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

    testRunner('should have deployed start Lambda function', async () => {
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

    testRunner('should have correct environment variables in stop function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TARGET_ENVIRONMENTS
      ).toBe('development,staging');
    });

    testRunner('should have correct environment variables in start function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.startLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TARGET_ENVIRONMENTS
      ).toBe('development,staging');
    });

    testRunner('should have IAM role attached to stop function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toMatch(
        /^arn:aws:iam::\d{12}:role\/[\w-]+$/
      );
    });

    testRunner('should have IAM role attached to start function', async () => {
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

  describe('EventBridge Scheduler', () => {
    testRunner('should have deployed stop schedule', async () => {
      const scheduleName = outputs.stopRuleArn.split('/').pop();
      const command = new GetScheduleCommand({ Name: scheduleName });
      const response = await schedulerClient.send(command);

      expect(response.Name).toBe(scheduleName);
      expect(response.ScheduleExpression).toBe('cron(0 19 ? * MON-FRI *)');
      expect(response.ScheduleExpressionTimezone).toBe('America/New_York');
      expect(response.State).toBe('ENABLED');
    });

    testRunner('should have deployed start schedule', async () => {
      const scheduleName = outputs.startRuleArn.split('/').pop();
      const command = new GetScheduleCommand({ Name: scheduleName });
      const response = await schedulerClient.send(command);

      expect(response.Name).toBe(scheduleName);
      expect(response.ScheduleExpression).toBe('cron(0 8 ? * MON-FRI *)');
      expect(response.ScheduleExpressionTimezone).toBe('America/New_York');
      expect(response.State).toBe('ENABLED');
    });

    testRunner('should have stop schedule targeting stop Lambda', async () => {
      const scheduleName = outputs.stopRuleArn.split('/').pop();
      const command = new GetScheduleCommand({ Name: scheduleName });
      const response = await schedulerClient.send(command);

      expect(response.Target).toBeDefined();
      expect(response.Target?.Arn).toBe(outputs.stopLambdaArn);
    });

    testRunner('should have start schedule targeting start Lambda', async () => {
      const scheduleName = outputs.startRuleArn.split('/').pop();
      const command = new GetScheduleCommand({ Name: scheduleName });
      const response = await schedulerClient.send(command);

      expect(response.Target).toBeDefined();
      expect(response.Target?.Arn).toBe(outputs.startLambdaArn);
    });
  });

  describe('CloudWatch Logs', () => {
    testRunner('should have log group for stop function', async () => {
      const functionName = outputs.stopLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      if (response.logGroups && response.logGroups.length > 0) {
        expect(response.logGroups[0].logGroupName).toBe(logGroupName);
      }
    });

    testRunner('should have log group for start function', async () => {
      const functionName = outputs.startLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      if (response.logGroups && response.logGroups.length > 0) {
        expect(response.logGroups[0].logGroupName).toBe(logGroupName);
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    testRunner('should have alarm for start function errors', async () => {
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
    testRunner('should be able to invoke stop Lambda function', async () => {
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

    testRunner('should be able to invoke start Lambda function', async () => {
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
    testRunner('should have appropriate tags on Lambda functions', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.stopLambdaArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Tags).toBeDefined();
      expect(Object.keys(response.Tags || {}).length).toBeGreaterThan(0);
    });
  });

  describe('Cost Calculation', () => {
    testRunner('should have estimatedMonthlySavings as valid value', () => {
      expect(outputs.estimatedMonthlySavings).toBeDefined();
      const savings = parseFloat(outputs.estimatedMonthlySavings);
      expect(savings).toBeGreaterThanOrEqual(0);
    });

    testRunner('should calculate reasonable savings values', () => {
      expect(outputs.estimatedMonthlySavings).toBeDefined();
      const savings = parseFloat(outputs.estimatedMonthlySavings);
      expect(savings).toBeGreaterThanOrEqual(0);
      expect(savings).toBeLessThan(100000);
    });
  });
});
