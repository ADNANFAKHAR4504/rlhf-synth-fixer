import * as fs from 'fs';
import * as path from 'path';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { IAMClient, GetRoleCommand, GetPolicyCommand } from '@aws-sdk/client-iam';

describe('CloudWatch Monitoring Stack Integration Tests', () => {
  let outputs: any;
  const region = 'ca-central-1';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('CloudWatch Log Group', () => {
    test('Log group exists with correct retention', async () => {
      const client = new CloudWatchLogsClient({ region });
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      });
      const response = await client.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.LogGroupName);
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function exists with correct configuration', async () => {
      const client = new LambdaClient({ region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await client.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.LambdaFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.MemorySize).toBe(256);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic exists with encryption enabled', async () => {
      const client = new SNSClient({ region });
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
      expect(response.Attributes?.KmsMasterKeyId).toBe('alias/aws/sns');
    });
  });

  describe('CloudWatch Alarm', () => {
    test('Alarm exists with correct threshold configuration', async () => {
      const client = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({
        AlarmNames: [outputs.AlarmName],
      });
      const response = await client.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(outputs.AlarmName);
      expect(alarm.Threshold).toBe(10);
      expect(alarm.Period).toBe(300);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Dashboard exists', async () => {
      const client = new CloudWatchClient({ region });
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: outputs.DashboardName,
      });
      const response = await client.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries?.length).toBeGreaterThan(0);
      const dashboard = response.DashboardEntries!.find(
        (d) => d.DashboardName === outputs.DashboardName
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('Metric Filter', () => {
    test('Metric filter exists on log group', async () => {
      const client = new CloudWatchLogsClient({ region });
      const command = new DescribeMetricFiltersCommand({
        logGroupName: outputs.LogGroupName,
        filterNamePrefix: outputs.MetricFilterName,
      });
      const response = await client.send(command);

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters?.length).toBeGreaterThan(0);
      const filter = response.metricFilters![0];
      expect(filter.filterName).toBe(outputs.MetricFilterName);
    });
  });

  describe('IAM Resources', () => {
    test('Lambda execution role exists', async () => {
      const client = new IAMClient({ region });
      const command = new GetRoleCommand({
        RoleName: outputs.IAMRoleName,
      });
      const response = await client.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(outputs.IAMRoleName);
    });
  });
});
