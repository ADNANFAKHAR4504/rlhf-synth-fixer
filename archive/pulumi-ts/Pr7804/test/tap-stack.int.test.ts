import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeQueryDefinitionsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-east-1';

describe('Infrastructure Analysis and Monitoring System - Integration Tests', () => {
  describe('CloudWatch Dashboards', () => {
    it('should have created dashboards in monitored regions', async () => {
      const dashboardUrls = JSON.parse(outputs.dashboardUrls);
      expect(Array.isArray(dashboardUrls)).toBe(true);
      expect(dashboardUrls.length).toBeGreaterThan(0);
    });

    it('should verify dashboard exists and is accessible', async () => {
      const dashboardUrls = JSON.parse(outputs.dashboardUrls);
      const firstDashboardUrl = dashboardUrls[0];

      // Extract dashboard name from URL
      const dashboardNameMatch = firstDashboardUrl.match(/name=([^&]+)/);
      expect(dashboardNameMatch).not.toBeNull();

      const dashboardName = dashboardNameMatch![1];
      const cloudwatch = new CloudWatchClient({ region });

      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const response = await cloudwatch.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();

      // Verify dashboard has the expected widgets
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(Array.isArray(dashboardBody.widgets)).toBe(true);
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });

    it('should have dashboards monitoring EC2, RDS, API Gateway, and Lambda', async () => {
      const dashboardUrls = JSON.parse(outputs.dashboardUrls);
      const firstDashboardUrl = dashboardUrls[0];

      const dashboardNameMatch = firstDashboardUrl.match(/name=([^&]+)/);
      const dashboardName = dashboardNameMatch![1];

      const cloudwatch = new CloudWatchClient({ region });
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const response = await cloudwatch.send(command);
      const dashboardBody = JSON.parse(response.DashboardBody!);

      // Check for expected metrics
      const bodyString = JSON.stringify(dashboardBody);
      expect(bodyString).toContain('CPUUtilization');
      expect(bodyString).toContain('mem_used_percent');
      expect(bodyString).toContain('NetworkIn');
      expect(bodyString).toContain('DatabaseConnections');
      expect(bodyString).toContain('Latency');
      expect(bodyString).toContain('Errors');
    });
  });

  describe('Lambda Functions', () => {
    it('should have created Lambda functions for analysis', async () => {
      const functionArns = JSON.parse(outputs.lambdaFunctionArns);
      expect(Array.isArray(functionArns)).toBe(true);
      expect(functionArns.length).toBe(2);
    });

    it('should verify metric analysis Lambda function', async () => {
      const functionArns = JSON.parse(outputs.lambdaFunctionArns);
      const metricAnalysisFunctionArn = functionArns.find((arn: string) =>
        arn.includes('metric-analysis')
      );
      expect(metricAnalysisFunctionArn).toBeDefined();

      const lambda = new LambdaClient({ region });
      const functionName = metricAnalysisFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambda.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('metric_analysis.handler');
      expect(response.Configuration!.Timeout).toBe(300);
      expect(response.Configuration!.MemorySize).toBe(512);

      // Verify environment variables
      const envVars = response.Configuration!.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars!.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(envVars!.SNS_TOPIC_CRITICAL).toBeDefined();
      expect(envVars!.SNS_TOPIC_WARNING).toBeDefined();
      expect(envVars!.SNS_TOPIC_INFO).toBeDefined();
      expect(envVars!.THRESHOLD_PERCENT).toBe('80');
      expect(envVars!.MONITORING_REGIONS).toBeDefined();
    });

    it('should verify health report Lambda function', async () => {
      const functionArns = JSON.parse(outputs.lambdaFunctionArns);
      const healthReportFunctionArn = functionArns.find((arn: string) =>
        arn.includes('health-report')
      );
      expect(healthReportFunctionArn).toBeDefined();

      const lambda = new LambdaClient({ region });
      const functionName = healthReportFunctionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambda.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('health_report.handler');
      expect(response.Configuration!.Timeout).toBe(300);
      expect(response.Configuration!.MemorySize).toBe(512);

      // Verify environment variables
      const envVars = response.Configuration!.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars!.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(envVars!.SNS_TOPIC_INFO).toBeDefined();
      expect(envVars!.MONITORING_REGIONS).toBeDefined();
    });
  });

  describe('SNS Topics', () => {
    it('should have created SNS topics for different severity levels', async () => {
      const snsTopicArns = JSON.parse(outputs.snsTopicArns);
      expect(snsTopicArns).toBeDefined();
      expect(snsTopicArns.critical).toBeDefined();
      expect(snsTopicArns.warning).toBeDefined();
      expect(snsTopicArns.info).toBeDefined();
    });

    it('should verify critical SNS topic', async () => {
      const snsTopicArns = JSON.parse(outputs.snsTopicArns);
      const sns = new SNSClient({ region });

      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArns.critical,
      });

      const response = await sns.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(snsTopicArns.critical);
      expect(response.Attributes!.DisplayName).toContain('Critical');
    });

    it('should verify warning SNS topic', async () => {
      const snsTopicArns = JSON.parse(outputs.snsTopicArns);
      const sns = new SNSClient({ region });

      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArns.warning,
      });

      const response = await sns.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(snsTopicArns.warning);
      expect(response.Attributes!.DisplayName).toContain('Warning');
    });

    it('should verify info SNS topic', async () => {
      const snsTopicArns = JSON.parse(outputs.snsTopicArns);
      const sns = new SNSClient({ region });

      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArns.info,
      });

      const response = await sns.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(snsTopicArns.info);
      expect(response.Attributes!.DisplayName).toContain('Info');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have CloudWatch alarms available in the account', async () => {
      const cloudwatch = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({});

      const response = await cloudwatch.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(Array.isArray(response.MetricAlarms)).toBe(true);
    });
  });

  describe('CloudWatch Logs Insights Queries', () => {
    it('should have created Logs Insights query definitions', async () => {
      const logs = new CloudWatchLogsClient({ region });
      const command = new DescribeQueryDefinitionsCommand({});

      const response = await logs.send(command);
      expect(response.queryDefinitions).toBeDefined();

      const stackQueries = response.queryDefinitions!.filter(
        query =>
          query.name?.includes('dev')
      );

      expect(stackQueries.length).toBeGreaterThanOrEqual(4);
    });

    it('should verify error pattern detection query exists', async () => {
      const logs = new CloudWatchLogsClient({ region });
      const command = new DescribeQueryDefinitionsCommand({});

      const response = await logs.send(command);
      const errorQuery = response.queryDefinitions!.find(query =>
        query.name?.includes('err-pattern-e4')
      );

      expect(errorQuery).toBeDefined();
      expect(errorQuery!.queryString).toContain('ERROR');
      expect(errorQuery!.queryString).toContain('Exception');
      expect(errorQuery!.queryString).toContain('Failed');
    });

    it('should verify high latency requests query exists', async () => {
      const logs = new CloudWatchLogsClient({ region });
      const command = new DescribeQueryDefinitionsCommand({});

      const response = await logs.send(command);
      const latencyQuery = response.queryDefinitions!.find(query =>
        query.name?.includes('latency-req-e4')
      );

      expect(latencyQuery).toBeDefined();
      expect(latencyQuery!.queryString).toContain('@duration');
      expect(latencyQuery!.queryString).toContain('1000');
    });
  });

  describe('Metric Filters', () => {
    it('should have created metric filters for custom metrics', async () => {
      const logs = new CloudWatchLogsClient({ region });
      const command = new DescribeMetricFiltersCommand({});

      const response = await logs.send(command);
      expect(response.metricFilters).toBeDefined();

      const stackFilters = response.metricFilters!.filter(
        filter =>
          filter.filterName?.includes('dev')
      );

      expect(stackFilters.length).toBeGreaterThanOrEqual(4);
    });

    it('should verify API usage metric filter exists', async () => {
      const logs = new CloudWatchLogsClient({ region });
      const command = new DescribeMetricFiltersCommand({});

      const response = await logs.send(command);
      const apiFilter = response.metricFilters!.find(filter =>
        filter.filterName?.includes('api-use-e4')
      );

      expect(apiFilter).toBeDefined();
      expect(apiFilter!.metricTransformations).toBeDefined();
      expect(apiFilter!.metricTransformations![0].metricNamespace).toBe(
        'Infra/Custom'
      );
    });

    it('should verify application error metric filter exists', async () => {
      const logs = new CloudWatchLogsClient({ region });
      const command = new DescribeMetricFiltersCommand({});

      const response = await logs.send(command);
      const errorFilter = response.metricFilters!.find(filter =>
        filter.filterName?.includes('app-err-e4')
      );

      expect(errorFilter).toBeDefined();
      expect(errorFilter!.metricTransformations).toBeDefined();
      expect(errorFilter!.metricTransformations![0].metricNamespace).toBe(
        'Infra/Custom'
      );
    });
  });

  describe('End-to-End Monitoring Workflow', () => {
    it('should have complete monitoring stack deployed', () => {
      const dashboardUrls = JSON.parse(outputs.dashboardUrls);
      const functionArns = JSON.parse(outputs.lambdaFunctionArns);
      const snsTopicArns = JSON.parse(outputs.snsTopicArns);

      expect(dashboardUrls.length).toBeGreaterThan(0);
      expect(functionArns.length).toBe(2);
      expect(snsTopicArns.critical).toBeDefined();
      expect(snsTopicArns.warning).toBeDefined();
      expect(snsTopicArns.info).toBeDefined();
    });

    it('should verify Lambda functions have proper IAM permissions', async () => {
      const functionArns = JSON.parse(outputs.lambdaFunctionArns);
      const lambda = new LambdaClient({ region });

      for (const arn of functionArns) {
        const functionName = arn.split(':').pop();
        const command = new GetFunctionCommand({
          FunctionName: functionName,
        });

        const response = await lambda.send(command);
        expect(response.Configuration!.Role).toBeDefined();
        expect(response.Configuration!.Role).toContain('iam');
        expect(response.Configuration!.Role).toContain('role');
      }
    });
  });
});
