# Infrastructure Analysis and Monitoring System - Pulumi TypeScript Implementation

This implementation provides a comprehensive automated infrastructure analysis system using Pulumi and TypeScript. The system monitors resources across multiple regions, analyzes metrics hourly, generates alerts, and sends notifications to appropriate teams.

## Architecture Overview

The system includes:
1. **CloudWatch Dashboards** - Multi-region monitoring for EC2 metrics
2. **Lambda Analysis Functions** - Hourly metric analysis with 80% threshold detection
3. **CloudWatch Alarms** - Critical threshold monitoring for databases, API Gateway, and Lambda
4. **SNS Topics** - Severity-based team notifications (critical, warning, info)
5. **IAM Roles** - Least-privilege access for Lambda functions
6. **CloudWatch Logs Insights** - Pre-configured queries for error pattern detection
7. **Weekly Reports** - Lambda function generating JSON health reports
8. **Metric Filters** - Custom application and API usage tracking

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { createCloudWatchDashboards } from './cloudwatch-dashboards';
import { createLambdaAnalysisFunctions } from './lambda-analysis';
import { createCloudWatchAlarms } from './cloudwatch-alarms';
import { createSNSTopics } from './sns-topics';
import { createIAMRoles } from './iam-roles';
import { createLogsInsightsQueries } from './logs-insights';
import { createMetricFilters } from './metric-filters';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  monitoringRegions?: string[];
  analysisSchedule?: string;
  reportSchedule?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly dashboardUrls: pulumi.Output<string[]>;
  public readonly snsTopicArns: pulumi.Output<{ [key: string]: string }>;
  public readonly lambdaFunctionArns: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || { Environment: environmentSuffix };
    const monitoringRegions = args.monitoringRegions || ['us-east-1', 'us-west-2'];
    const analysisSchedule = args.analysisSchedule || 'rate(1 hour)';
    const reportSchedule = args.reportSchedule || 'rate(7 days)';

    // Create SNS topics for different severity levels
    const snsTopics = createSNSTopics(environmentSuffix, tags, { parent: this });

    // Create IAM roles for Lambda functions
    const iamRoles = createIAMRoles(environmentSuffix, tags, { parent: this });

    // Create Lambda functions for analysis
    const lambdaFunctions = createLambdaAnalysisFunctions({
      environmentSuffix,
      tags,
      analysisSchedule,
      reportSchedule,
      snsTopicArns: snsTopics.topicArns,
      lambdaRoleArn: iamRoles.lambdaRoleArn,
      monitoringRegions,
    }, { parent: this });

    // Create CloudWatch dashboards
    const dashboards = createCloudWatchDashboards({
      environmentSuffix,
      tags,
      monitoringRegions,
    }, { parent: this });

    // Create CloudWatch alarms
    const alarms = createCloudWatchAlarms({
      environmentSuffix,
      tags,
      snsTopicArns: snsTopics.topicArns,
    }, { parent: this });

    // Create CloudWatch Logs Insights queries
    const logsQueries = createLogsInsightsQueries(environmentSuffix, tags, { parent: this });

    // Create metric filters
    const metricFilters = createMetricFilters(environmentSuffix, tags, { parent: this });

    this.dashboardUrls = dashboards.dashboardUrls;
    this.snsTopicArns = snsTopics.topicArns;
    this.lambdaFunctionArns = lambdaFunctions.functionArns;

    this.registerOutputs({
      dashboardUrls: this.dashboardUrls,
      snsTopicArns: this.snsTopicArns,
      lambdaFunctionArns: this.lambdaFunctionArns,
    });
  }
}
```

## File: lib/sns-topics.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createSNSTopics(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  const criticalTopic = new aws.sns.Topic(`infrastructure-alerts-critical-${environmentSuffix}`, {
    displayName: `Infrastructure Critical Alerts - ${environmentSuffix}`,
    tags: tags,
  }, opts);

  const warningTopic = new aws.sns.Topic(`infrastructure-alerts-warning-${environmentSuffix}`, {
    displayName: `Infrastructure Warning Alerts - ${environmentSuffix}`,
    tags: tags,
  }, opts);

  const infoTopic = new aws.sns.Topic(`infrastructure-alerts-info-${environmentSuffix}`, {
    displayName: `Infrastructure Info Alerts - ${environmentSuffix}`,
    tags: tags,
  }, opts);

  // Create subscriptions (email endpoints would be provided via configuration)
  const criticalSubscription = new aws.sns.TopicSubscription(
    `infrastructure-alerts-critical-sub-${environmentSuffix}`,
    {
      topic: criticalTopic.arn,
      protocol: 'email',
      endpoint: pulumi.output(pulumi.getStack()).apply(stack =>
        `infrastructure-critical-${stack}@example.com`
      ),
    },
    opts
  );

  const warningSubscription = new aws.sns.TopicSubscription(
    `infrastructure-alerts-warning-sub-${environmentSuffix}`,
    {
      topic: warningTopic.arn,
      protocol: 'email',
      endpoint: pulumi.output(pulumi.getStack()).apply(stack =>
        `infrastructure-warning-${stack}@example.com`
      ),
    },
    opts
  );

  const infoSubscription = new aws.sns.TopicSubscription(
    `infrastructure-alerts-info-sub-${environmentSuffix}`,
    {
      topic: infoTopic.arn,
      protocol: 'email',
      endpoint: pulumi.output(pulumi.getStack()).apply(stack =>
        `infrastructure-info-${stack}@example.com`
      ),
    },
    opts
  );

  return {
    topicArns: pulumi.output({
      critical: criticalTopic.arn,
      warning: warningTopic.arn,
      info: infoTopic.arn,
    }),
    topics: {
      critical: criticalTopic,
      warning: warningTopic,
      info: infoTopic,
    },
  };
}
```

## File: lib/iam-roles.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createIAMRoles(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // IAM role for Lambda functions with least-privilege access
  const lambdaRole = new aws.iam.Role(
    `infrastructure-analysis-lambda-role-${environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: tags,
    },
    opts
  );

  // Policy for CloudWatch Metrics read access
  const metricsPolicy = new aws.iam.RolePolicy(
    `infrastructure-analysis-metrics-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:GetMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
              'cloudwatch:DescribeAlarms',
              'cloudwatch:DescribeAlarmsForMetric',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeRegions',
              'rds:DescribeDBInstances',
              'rds:DescribeDBClusters',
              'apigateway:GET',
            ],
            Resource: '*',
          },
        ],
      }),
    },
    opts
  );

  // Policy for CloudWatch Logs
  const logsPolicy = new aws.iam.RolePolicy(
    `infrastructure-analysis-logs-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:StartQuery',
              'logs:GetQueryResults',
              'logs:FilterLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
    },
    opts
  );

  // Policy for SNS publish
  const snsPolicy = new aws.iam.RolePolicy(
    `infrastructure-analysis-sns-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: `arn:aws:sns:*:*:infrastructure-alerts-*-${environmentSuffix}`,
          },
        ],
      }),
    },
    opts
  );

  return {
    lambdaRoleArn: lambdaRole.arn,
    lambdaRole: lambdaRole,
  };
}
```

## File: lib/lambda-analysis.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

interface LambdaAnalysisArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  analysisSchedule: string;
  reportSchedule: string;
  snsTopicArns: pulumi.Output<{ [key: string]: string }>;
  lambdaRoleArn: pulumi.Output<string>;
  monitoringRegions: string[];
}

export function createLambdaAnalysisFunctions(
  args: LambdaAnalysisArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  // Lambda function for hourly metric analysis
  const metricAnalysisFunction = new aws.lambda.Function(
    `infrastructure-metric-analysis-${args.environmentSuffix}`,
    {
      runtime: 'python3.11',
      handler: 'metric_analysis.handler',
      role: args.lambdaRoleArn,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda', 'metric-analysis')),
      }),
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: args.environmentSuffix,
          SNS_TOPIC_CRITICAL: args.snsTopicArns.apply(arns => arns.critical),
          SNS_TOPIC_WARNING: args.snsTopicArns.apply(arns => arns.warning),
          SNS_TOPIC_INFO: args.snsTopicArns.apply(arns => arns.info),
          THRESHOLD_PERCENT: '80',
          MONITORING_REGIONS: args.monitoringRegions.join(','),
        },
      },
      tags: args.tags,
    },
    opts
  );

  // EventBridge rule for hourly execution
  const metricAnalysisRule = new aws.cloudwatch.EventRule(
    `infrastructure-metric-analysis-schedule-${args.environmentSuffix}`,
    {
      scheduleExpression: args.analysisSchedule,
      description: 'Trigger infrastructure metric analysis every hour',
      tags: args.tags,
    },
    opts
  );

  const metricAnalysisTarget = new aws.cloudwatch.EventTarget(
    `infrastructure-metric-analysis-target-${args.environmentSuffix}`,
    {
      rule: metricAnalysisRule.name,
      arn: metricAnalysisFunction.arn,
    },
    opts
  );

  const metricAnalysisPermission = new aws.lambda.Permission(
    `infrastructure-metric-analysis-permission-${args.environmentSuffix}`,
    {
      action: 'lambda:InvokeFunction',
      function: metricAnalysisFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: metricAnalysisRule.arn,
    },
    opts
  );

  // Lambda function for weekly health reports
  const healthReportFunction = new aws.lambda.Function(
    `infrastructure-health-report-${args.environmentSuffix}`,
    {
      runtime: 'python3.11',
      handler: 'health_report.handler',
      role: args.lambdaRoleArn,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda', 'health-report')),
      }),
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: args.environmentSuffix,
          SNS_TOPIC_INFO: args.snsTopicArns.apply(arns => arns.info),
          MONITORING_REGIONS: args.monitoringRegions.join(','),
        },
      },
      tags: args.tags,
    },
    opts
  );

  // EventBridge rule for weekly execution
  const healthReportRule = new aws.cloudwatch.EventRule(
    `infrastructure-health-report-schedule-${args.environmentSuffix}`,
    {
      scheduleExpression: args.reportSchedule,
      description: 'Generate weekly infrastructure health report',
      tags: args.tags,
    },
    opts
  );

  const healthReportTarget = new aws.cloudwatch.EventTarget(
    `infrastructure-health-report-target-${args.environmentSuffix}`,
    {
      rule: healthReportRule.name,
      arn: healthReportFunction.arn,
    },
    opts
  );

  const healthReportPermission = new aws.lambda.Permission(
    `infrastructure-health-report-permission-${args.environmentSuffix}`,
    {
      action: 'lambda:InvokeFunction',
      function: healthReportFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: healthReportRule.arn,
    },
    opts
  );

  return {
    functionArns: pulumi.output([metricAnalysisFunction.arn, healthReportFunction.arn]),
    metricAnalysisFunction,
    healthReportFunction,
  };
}
```

## File: lib/cloudwatch-dashboards.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

interface DashboardArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  monitoringRegions: string[];
}

export function createCloudWatchDashboards(
  args: DashboardArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const dashboards: aws.cloudwatch.Dashboard[] = [];
  const dashboardUrls: pulumi.Output<string>[] = [];

  // Create a dashboard for each region
  args.monitoringRegions.forEach((region) => {
    const dashboard = new aws.cloudwatch.Dashboard(
      `infrastructure-monitoring-${region}-${args.environmentSuffix}`,
      {
        dashboardName: `infrastructure-monitoring-${region}-${args.environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/EC2', 'CPUUtilization', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'EC2 CPU Utilization',
                yAxis: { left: { min: 0, max: 100 } },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['CWAgent', 'mem_used_percent', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'EC2 Memory Utilization',
                yAxis: { left: { min: 0, max: 100 } },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/EC2', 'NetworkIn', { stat: 'Sum', region }],
                  ['AWS/EC2', 'NetworkOut', { stat: 'Sum', region }],
                ],
                period: 300,
                stat: 'Sum',
                region,
                title: 'EC2 Network Traffic',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/RDS', 'DatabaseConnections', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'RDS Database Connections',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/ApiGateway', 'Latency', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'API Gateway Latency',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/Lambda', 'Errors', { stat: 'Sum', region }],
                ],
                period: 300,
                stat: 'Sum',
                region,
                title: 'Lambda Errors',
              },
            },
          ],
        }),
        tags: args.tags,
      },
      opts
    );

    dashboards.push(dashboard);

    // Generate dashboard URL
    const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
    dashboardUrls.push(dashboardUrl);
  });

  return {
    dashboards,
    dashboardUrls: pulumi.all(dashboardUrls),
  };
}
```

## File: lib/cloudwatch-alarms.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

interface AlarmArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  snsTopicArns: pulumi.Output<{ [key: string]: string }>;
}

export function createCloudWatchAlarms(
  args: AlarmArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  // Alarm for database connections
  const dbConnectionAlarm = new aws.cloudwatch.MetricAlarm(
    `infrastructure-db-connections-alarm-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database connections exceed 80',
      alarmActions: [args.snsTopicArns.apply(arns => arns.critical)],
      tags: args.tags,
    },
    opts
  );

  // Alarm for API Gateway latency
  const apiLatencyAlarm = new aws.cloudwatch.MetricAlarm(
    `infrastructure-api-latency-alarm-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Latency',
      namespace: 'AWS/ApiGateway',
      period: 300,
      statistic: 'Average',
      threshold: 1000,
      alarmDescription: 'Alert when API Gateway latency exceeds 1000ms',
      alarmActions: [args.snsTopicArns.apply(arns => arns.critical)],
      tags: args.tags,
    },
    opts
  );

  // Alarm for Lambda error rates
  const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
    `infrastructure-lambda-errors-alarm-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when Lambda errors exceed 10 in 5 minutes',
      alarmActions: [args.snsTopicArns.apply(arns => arns.critical)],
      tags: args.tags,
    },
    opts
  );

  // Warning alarm for EC2 CPU utilization
  const ec2CpuWarningAlarm = new aws.cloudwatch.MetricAlarm(
    `infrastructure-ec2-cpu-warning-alarm-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 3,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      alarmDescription: 'Warning when EC2 CPU exceeds 75%',
      alarmActions: [args.snsTopicArns.apply(arns => arns.warning)],
      tags: args.tags,
    },
    opts
  );

  return {
    alarms: [dbConnectionAlarm, apiLatencyAlarm, lambdaErrorAlarm, ec2CpuWarningAlarm],
  };
}
```

## File: lib/logs-insights.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createLogsInsightsQueries(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // Query for error patterns in application logs
  const errorPatternQuery = new aws.cloudwatch.QueryDefinition(
    `infrastructure-error-pattern-query-${environmentSuffix}`,
    {
      name: `error-pattern-detection-${environmentSuffix}`,
      logGroupNames: [
        '/aws/lambda/*',
        '/aws/apigateway/*',
        '/aws/ecs/*',
      ],
      queryString: `
fields @timestamp, @message, @logStream
| filter @message like /ERROR|Exception|Failed/
| stats count() as error_count by @logStream
| sort error_count desc
| limit 20
      `.trim(),
    },
    opts
  );

  // Query for high latency requests
  const latencyQuery = new aws.cloudwatch.QueryDefinition(
    `infrastructure-high-latency-query-${environmentSuffix}`,
    {
      name: `high-latency-requests-${environmentSuffix}`,
      logGroupNames: [
        '/aws/apigateway/*',
        '/aws/lambda/*',
      ],
      queryString: `
fields @timestamp, @message, @duration
| filter @duration > 1000
| stats count() as slow_requests, avg(@duration) as avg_duration by bin(5m)
| sort slow_requests desc
      `.trim(),
    },
    opts
  );

  // Query for failed API requests
  const failedApiQuery = new aws.cloudwatch.QueryDefinition(
    `infrastructure-failed-api-query-${environmentSuffix}`,
    {
      name: `failed-api-requests-${environmentSuffix}`,
      logGroupNames: [
        '/aws/apigateway/*',
      ],
      queryString: `
fields @timestamp, @message, status
| filter status >= 400
| stats count() as failed_count by status, bin(5m)
| sort failed_count desc
      `.trim(),
    },
    opts
  );

  // Query for Lambda cold starts
  const coldStartQuery = new aws.cloudwatch.QueryDefinition(
    `infrastructure-lambda-cold-start-query-${environmentSuffix}`,
    {
      name: `lambda-cold-starts-${environmentSuffix}`,
      logGroupNames: [
        '/aws/lambda/*',
      ],
      queryString: `
fields @timestamp, @message, @initDuration
| filter @type = "REPORT" and @initDuration > 0
| stats count() as cold_starts, avg(@initDuration) as avg_init_time by bin(1h)
| sort cold_starts desc
      `.trim(),
    },
    opts
  );

  return {
    queries: [errorPatternQuery, latencyQuery, failedApiQuery, coldStartQuery],
  };
}
```

## File: lib/metric-filters.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createMetricFilters(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // Log group for application metrics (example)
  const appLogGroup = new aws.cloudwatch.LogGroup(
    `infrastructure-app-logs-${environmentSuffix}`,
    {
      name: `/aws/infrastructure/app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: tags,
    },
    opts
  );

  // Metric filter for API usage patterns
  const apiUsageFilter = new aws.cloudwatch.LogMetricFilter(
    `infrastructure-api-usage-filter-${environmentSuffix}`,
    {
      name: `api-usage-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, request_id, api_endpoint, status_code, duration]',
      metricTransformation: {
        name: `APIUsageCount-${environmentSuffix}`,
        namespace: `Infrastructure/Custom`,
        value: '1',
        defaultValue: '0',
        unit: 'Count',
        dimensions: {
          Endpoint: '$api_endpoint',
          StatusCode: '$status_code',
        },
      },
    },
    opts
  );

  // Metric filter for custom application errors
  const appErrorFilter = new aws.cloudwatch.LogMetricFilter(
    `infrastructure-app-error-filter-${environmentSuffix}`,
    {
      name: `app-errors-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, level = "ERROR", ...]',
      metricTransformation: {
        name: `ApplicationErrors-${environmentSuffix}`,
        namespace: `Infrastructure/Custom`,
        value: '1',
        defaultValue: '0',
        unit: 'Count',
      },
    },
    opts
  );

  // Metric filter for response time tracking
  const responseTimeFilter = new aws.cloudwatch.LogMetricFilter(
    `infrastructure-response-time-filter-${environmentSuffix}`,
    {
      name: `response-time-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, request_id, api_endpoint, status_code, duration]',
      metricTransformation: {
        name: `APIResponseTime-${environmentSuffix}`,
        namespace: `Infrastructure/Custom`,
        value: '$duration',
        unit: 'Milliseconds',
        dimensions: {
          Endpoint: '$api_endpoint',
        },
      },
    },
    opts
  );

  // Metric filter for business metrics
  const businessMetricFilter = new aws.cloudwatch.LogMetricFilter(
    `infrastructure-business-metric-filter-${environmentSuffix}`,
    {
      name: `business-transactions-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, metric_type = "BUSINESS", metric_name, metric_value]',
      metricTransformation: {
        name: `BusinessMetrics-${environmentSuffix}`,
        namespace: `Infrastructure/Custom`,
        value: '$metric_value',
        defaultValue: '0',
        dimensions: {
          MetricName: '$metric_name',
        },
      },
    },
    opts
  );

  return {
    logGroup: appLogGroup,
    filters: [apiUsageFilter, appErrorFilter, responseTimeFilter, businessMetricFilter],
  };
}
```

## File: lib/lambda/metric-analysis/metric_analysis.py

```python
#!/usr/bin/env python3
"""
Infrastructure Metric Analysis Lambda Function

Analyzes CloudWatch metrics every hour and identifies resources exceeding 80% utilization.
Sends notifications to appropriate SNS topics based on severity.
"""

import os
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Environment variables
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_CRITICAL = os.environ['SNS_TOPIC_CRITICAL']
SNS_TOPIC_WARNING = os.environ['SNS_TOPIC_WARNING']
SNS_TOPIC_INFO = os.environ['SNS_TOPIC_INFO']
THRESHOLD_PERCENT = float(os.environ.get('THRESHOLD_PERCENT', '80'))
MONITORING_REGIONS = os.environ.get('MONITORING_REGIONS', 'us-east-1').split(',')


def get_cloudwatch_client(region: str):
    """Get CloudWatch client for specified region."""
    return boto3.client('cloudwatch', region_name=region)


def get_ec2_client(region: str):
    """Get EC2 client for specified region."""
    return boto3.client('ec2', region_name=region)


def get_sns_client():
    """Get SNS client."""
    return boto3.client('sns')


def get_metric_statistics(
    cloudwatch, namespace: str, metric_name: str, dimensions: List[Dict],
    start_time: datetime, end_time: datetime, period: int = 3600
) -> Optional[float]:
    """
    Retrieve metric statistics from CloudWatch.

    Args:
        cloudwatch: CloudWatch client
        namespace: Metric namespace
        metric_name: Name of the metric
        dimensions: Metric dimensions
        start_time: Start time for metric query
        end_time: End time for metric query
        period: Period in seconds

    Returns:
        Average value or None if no data
    """
    try:
        response = cloudwatch.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            Dimensions=dimensions,
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=['Average']
        )

        if response['Datapoints']:
            # Get the most recent datapoint
            datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'], reverse=True)
            return datapoints[0]['Average']
        return None
    except Exception as e:
        print(f"Error getting metric statistics: {str(e)}")
        return None


def analyze_ec2_instances(region: str, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
    """
    Analyze EC2 instances for high utilization.

    Args:
        region: AWS region
        start_time: Analysis start time
        end_time: Analysis end time

    Returns:
        List of instances exceeding threshold
    """
    cloudwatch = get_cloudwatch_client(region)
    ec2 = get_ec2_client(region)

    issues = []

    try:
        # Get all running instances
        response = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )

        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                instance_name = next(
                    (tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name'),
                    instance_id
                )

                # Check CPU utilization
                cpu_avg = get_metric_statistics(
                    cloudwatch,
                    'AWS/EC2',
                    'CPUUtilization',
                    [{'Name': 'InstanceId', 'Value': instance_id}],
                    start_time,
                    end_time
                )

                if cpu_avg and cpu_avg > THRESHOLD_PERCENT:
                    issues.append({
                        'region': region,
                        'resource_type': 'EC2 Instance',
                        'resource_id': instance_id,
                        'resource_name': instance_name,
                        'metric': 'CPUUtilization',
                        'value': cpu_avg,
                        'threshold': THRESHOLD_PERCENT,
                        'severity': 'critical' if cpu_avg > 90 else 'warning'
                    })
    except Exception as e:
        print(f"Error analyzing EC2 instances in {region}: {str(e)}")

    return issues


def analyze_lambda_functions(region: str, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
    """
    Analyze Lambda functions for high error rates.

    Args:
        region: AWS region
        start_time: Analysis start time
        end_time: Analysis end time

    Returns:
        List of Lambda functions with high error rates
    """
    cloudwatch = get_cloudwatch_client(region)
    lambda_client = boto3.client('lambda', region_name=region)

    issues = []

    try:
        # Get all Lambda functions
        paginator = lambda_client.get_paginator('list_functions')
        for page in paginator.paginate():
            for function in page['Functions']:
                function_name = function['FunctionName']

                # Check error rate
                errors = get_metric_statistics(
                    cloudwatch,
                    'AWS/Lambda',
                    'Errors',
                    [{'Name': 'FunctionName', 'Value': function_name}],
                    start_time,
                    end_time
                )

                invocations = get_metric_statistics(
                    cloudwatch,
                    'AWS/Lambda',
                    'Invocations',
                    [{'Name': 'FunctionName', 'Value': function_name}],
                    start_time,
                    end_time
                )

                if errors and invocations and invocations > 0:
                    error_rate = (errors / invocations) * 100
                    if error_rate > 5:  # 5% error rate threshold
                        issues.append({
                            'region': region,
                            'resource_type': 'Lambda Function',
                            'resource_id': function_name,
                            'resource_name': function_name,
                            'metric': 'ErrorRate',
                            'value': error_rate,
                            'threshold': 5,
                            'severity': 'critical' if error_rate > 10 else 'warning'
                        })
    except Exception as e:
        print(f"Error analyzing Lambda functions in {region}: {str(e)}")

    return issues


def send_notification(sns_client, topic_arn: str, subject: str, message: Dict[str, Any]):
    """
    Send notification to SNS topic.

    Args:
        sns_client: SNS client
        topic_arn: SNS topic ARN
        subject: Email subject
        message: Message payload
    """
    try:
        sns_client.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=json.dumps(message, indent=2, default=str)
        )
        print(f"Notification sent to {topic_arn}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")


def handler(event, context):
    """
    Lambda handler function.

    Analyzes infrastructure metrics and sends notifications for resources
    exceeding utilization thresholds.
    """
    print(f"Starting infrastructure metric analysis for environment: {ENVIRONMENT_SUFFIX}")

    # Define time range (last hour)
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=1)

    all_issues = []

    # Analyze resources in all monitored regions
    for region in MONITORING_REGIONS:
        print(f"Analyzing region: {region}")

        # Analyze EC2 instances
        ec2_issues = analyze_ec2_instances(region, start_time, end_time)
        all_issues.extend(ec2_issues)

        # Analyze Lambda functions
        lambda_issues = analyze_lambda_functions(region, start_time, end_time)
        all_issues.extend(lambda_issues)

    # Group issues by severity
    critical_issues = [issue for issue in all_issues if issue['severity'] == 'critical']
    warning_issues = [issue for issue in all_issues if issue['severity'] == 'warning']

    # Send notifications
    sns = get_sns_client()

    if critical_issues:
        send_notification(
            sns,
            SNS_TOPIC_CRITICAL,
            f"CRITICAL: Infrastructure Issues Detected - {ENVIRONMENT_SUFFIX}",
            {
                'environment': ENVIRONMENT_SUFFIX,
                'timestamp': datetime.utcnow().isoformat(),
                'severity': 'CRITICAL',
                'issue_count': len(critical_issues),
                'issues': critical_issues
            }
        )

    if warning_issues:
        send_notification(
            sns,
            SNS_TOPIC_WARNING,
            f"WARNING: Infrastructure Issues Detected - {ENVIRONMENT_SUFFIX}",
            {
                'environment': ENVIRONMENT_SUFFIX,
                'timestamp': datetime.utcnow().isoformat(),
                'severity': 'WARNING',
                'issue_count': len(warning_issues),
                'issues': warning_issues
            }
        )

    # Send summary to info topic
    summary = {
        'environment': ENVIRONMENT_SUFFIX,
        'timestamp': datetime.utcnow().isoformat(),
        'analysis_period': {
            'start': start_time.isoformat(),
            'end': end_time.isoformat()
        },
        'regions_analyzed': MONITORING_REGIONS,
        'total_issues': len(all_issues),
        'critical_issues': len(critical_issues),
        'warning_issues': len(warning_issues)
    }

    send_notification(
        sns,
        SNS_TOPIC_INFO,
        f"Infrastructure Analysis Summary - {ENVIRONMENT_SUFFIX}",
        summary
    )

    print(f"Analysis complete. Found {len(all_issues)} issues ({len(critical_issues)} critical, {len(warning_issues)} warning)")

    return {
        'statusCode': 200,
        'body': json.dumps(summary)
    }
```

## File: lib/lambda/metric-analysis/requirements.txt

```
boto3>=1.26.0
```

## File: lib/lambda/health-report/health_report.py

```python
#!/usr/bin/env python3
"""
Infrastructure Health Report Lambda Function

Generates weekly infrastructure health reports in JSON format.
Includes metrics, recommendations, and cost analysis.
"""

import os
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Environment variables
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_INFO = os.environ['SNS_TOPIC_INFO']
MONITORING_REGIONS = os.environ.get('MONITORING_REGIONS', 'us-east-1').split(',')


def get_cloudwatch_client(region: str):
    """Get CloudWatch client for specified region."""
    return boto3.client('cloudwatch', region_name=region)


def get_ec2_client(region: str):
    """Get EC2 client for specified region."""
    return boto3.client('ec2', region_name=region)


def get_sns_client():
    """Get SNS client."""
    return boto3.client('sns')


def collect_ec2_metrics(region: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """
    Collect EC2 metrics for the region.

    Args:
        region: AWS region
        start_time: Start time for metrics
        end_time: End time for metrics

    Returns:
        Dictionary containing EC2 metrics
    """
    cloudwatch = get_cloudwatch_client(region)
    ec2 = get_ec2_client(region)

    metrics = {
        'region': region,
        'instance_count': 0,
        'running_instances': 0,
        'stopped_instances': 0,
        'avg_cpu_utilization': 0,
        'instances': []
    }

    try:
        response = ec2.describe_instances()

        total_cpu = 0
        cpu_count = 0

        for reservation in response['Reservations']:
            metrics['instance_count'] += len(reservation['Instances'])

            for instance in reservation['Instances']:
                state = instance['State']['Name']
                instance_id = instance['InstanceId']

                if state == 'running':
                    metrics['running_instances'] += 1
                elif state == 'stopped':
                    metrics['stopped_instances'] += 1

                # Get CPU utilization for running instances
                if state == 'running':
                    try:
                        cpu_response = cloudwatch.get_metric_statistics(
                            Namespace='AWS/EC2',
                            MetricName='CPUUtilization',
                            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                            StartTime=start_time,
                            EndTime=end_time,
                            Period=3600,
                            Statistics=['Average']
                        )

                        if cpu_response['Datapoints']:
                            avg_cpu = sum(dp['Average'] for dp in cpu_response['Datapoints']) / len(cpu_response['Datapoints'])
                            total_cpu += avg_cpu
                            cpu_count += 1

                            metrics['instances'].append({
                                'instance_id': instance_id,
                                'state': state,
                                'avg_cpu': round(avg_cpu, 2)
                            })
                    except Exception as e:
                        print(f"Error getting CPU metrics for {instance_id}: {str(e)}")

        if cpu_count > 0:
            metrics['avg_cpu_utilization'] = round(total_cpu / cpu_count, 2)

    except Exception as e:
        print(f"Error collecting EC2 metrics in {region}: {str(e)}")

    return metrics


def collect_lambda_metrics(region: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """
    Collect Lambda metrics for the region.

    Args:
        region: AWS region
        start_time: Start time for metrics
        end_time: End time for metrics

    Returns:
        Dictionary containing Lambda metrics
    """
    cloudwatch = get_cloudwatch_client(region)
    lambda_client = boto3.client('lambda', region_name=region)

    metrics = {
        'region': region,
        'function_count': 0,
        'total_invocations': 0,
        'total_errors': 0,
        'error_rate': 0,
        'functions': []
    }

    try:
        paginator = lambda_client.get_paginator('list_functions')

        for page in paginator.paginate():
            metrics['function_count'] += len(page['Functions'])

            for function in page['Functions']:
                function_name = function['FunctionName']

                try:
                    # Get invocation count
                    inv_response = cloudwatch.get_metric_statistics(
                        Namespace='AWS/Lambda',
                        MetricName='Invocations',
                        Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                        StartTime=start_time,
                        EndTime=end_time,
                        Period=3600,
                        Statistics=['Sum']
                    )

                    invocations = sum(dp['Sum'] for dp in inv_response['Datapoints']) if inv_response['Datapoints'] else 0

                    # Get error count
                    err_response = cloudwatch.get_metric_statistics(
                        Namespace='AWS/Lambda',
                        MetricName='Errors',
                        Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                        StartTime=start_time,
                        EndTime=end_time,
                        Period=3600,
                        Statistics=['Sum']
                    )

                    errors = sum(dp['Sum'] for dp in err_response['Datapoints']) if err_response['Datapoints'] else 0

                    metrics['total_invocations'] += invocations
                    metrics['total_errors'] += errors

                    if invocations > 0:
                        metrics['functions'].append({
                            'function_name': function_name,
                            'invocations': int(invocations),
                            'errors': int(errors),
                            'error_rate': round((errors / invocations) * 100, 2)
                        })
                except Exception as e:
                    print(f"Error getting metrics for function {function_name}: {str(e)}")

        if metrics['total_invocations'] > 0:
            metrics['error_rate'] = round((metrics['total_errors'] / metrics['total_invocations']) * 100, 2)

    except Exception as e:
        print(f"Error collecting Lambda metrics in {region}: {str(e)}")

    return metrics


def collect_cloudwatch_alarms(region: str) -> Dict[str, Any]:
    """
    Collect CloudWatch alarm states.

    Args:
        region: AWS region

    Returns:
        Dictionary containing alarm states
    """
    cloudwatch = get_cloudwatch_client(region)

    alarm_stats = {
        'region': region,
        'total_alarms': 0,
        'alarm_count': 0,
        'ok_count': 0,
        'insufficient_data_count': 0,
        'alarms': []
    }

    try:
        paginator = cloudwatch.get_paginator('describe_alarms')

        for page in paginator.paginate():
            for alarm in page['MetricAlarms']:
                alarm_stats['total_alarms'] += 1
                state = alarm['StateValue']

                if state == 'ALARM':
                    alarm_stats['alarm_count'] += 1
                elif state == 'OK':
                    alarm_stats['ok_count'] += 1
                else:
                    alarm_stats['insufficient_data_count'] += 1

                if state == 'ALARM':
                    alarm_stats['alarms'].append({
                        'alarm_name': alarm['AlarmName'],
                        'state': state,
                        'reason': alarm.get('StateReason', 'Unknown')
                    })
    except Exception as e:
        print(f"Error collecting alarm data in {region}: {str(e)}")

    return alarm_stats


def generate_recommendations(ec2_metrics: List[Dict], lambda_metrics: List[Dict]) -> List[str]:
    """
    Generate recommendations based on collected metrics.

    Args:
        ec2_metrics: List of EC2 metrics per region
        lambda_metrics: List of Lambda metrics per region

    Returns:
        List of recommendations
    """
    recommendations = []

    # EC2 recommendations
    for region_metrics in ec2_metrics:
        if region_metrics['stopped_instances'] > 0:
            recommendations.append(
                f"Consider terminating {region_metrics['stopped_instances']} stopped instances in {region_metrics['region']} to reduce costs"
            )

        if region_metrics['avg_cpu_utilization'] < 20:
            recommendations.append(
                f"Average CPU utilization in {region_metrics['region']} is {region_metrics['avg_cpu_utilization']}%. Consider downsizing instances."
            )

    # Lambda recommendations
    for region_metrics in lambda_metrics:
        if region_metrics['error_rate'] > 5:
            recommendations.append(
                f"Lambda error rate in {region_metrics['region']} is {region_metrics['error_rate']}%. Review function logs and fix errors."
            )

    if not recommendations:
        recommendations.append("No optimization recommendations at this time. Infrastructure is running efficiently.")

    return recommendations


def handler(event, context):
    """
    Lambda handler function.

    Generates a comprehensive weekly infrastructure health report.
    """
    print(f"Generating weekly health report for environment: {ENVIRONMENT_SUFFIX}")

    # Define time range (last 7 days)
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)

    # Collect metrics from all regions
    ec2_metrics = []
    lambda_metrics = []
    alarm_stats = []

    for region in MONITORING_REGIONS:
        print(f"Collecting metrics for region: {region}")

        ec2_metrics.append(collect_ec2_metrics(region, start_time, end_time))
        lambda_metrics.append(collect_lambda_metrics(region, start_time, end_time))
        alarm_stats.append(collect_cloudwatch_alarms(region))

    # Generate recommendations
    recommendations = generate_recommendations(ec2_metrics, lambda_metrics)

    # Build health report
    health_report = {
        'report_metadata': {
            'environment': ENVIRONMENT_SUFFIX,
            'generated_at': datetime.utcnow().isoformat(),
            'report_period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            },
            'regions': MONITORING_REGIONS
        },
        'ec2_metrics': ec2_metrics,
        'lambda_metrics': lambda_metrics,
        'alarm_stats': alarm_stats,
        'recommendations': recommendations,
        'summary': {
            'total_ec2_instances': sum(m['instance_count'] for m in ec2_metrics),
            'total_lambda_functions': sum(m['function_count'] for m in lambda_metrics),
            'total_alarms': sum(a['total_alarms'] for a in alarm_stats),
            'active_alarms': sum(a['alarm_count'] for a in alarm_stats),
            'recommendation_count': len(recommendations)
        }
    }

    # Send report to SNS
    sns = get_sns_client()

    try:
        sns.publish(
            TopicArn=SNS_TOPIC_INFO,
            Subject=f"Weekly Infrastructure Health Report - {ENVIRONMENT_SUFFIX}",
            Message=json.dumps(health_report, indent=2, default=str)
        )
        print("Health report sent successfully")
    except Exception as e:
        print(f"Error sending health report: {str(e)}")

    print("Health report generation complete")

    return {
        'statusCode': 200,
        'body': json.dumps(health_report)
    }
```

## File: lib/lambda/health-report/requirements.txt

```
boto3>=1.26.0
```

## Summary

This implementation provides a comprehensive infrastructure analysis and monitoring system with:

1. **Multi-region CloudWatch dashboards** monitoring EC2 CPU, memory, and network metrics
2. **Lambda functions** for hourly metric analysis (80% threshold detection) and weekly health reports
3. **CloudWatch alarms** for database connections, API Gateway latency, and Lambda errors
4. **SNS topics** with severity-based routing (critical/warning/info)
5. **IAM roles** with least-privilege access for Lambda functions
6. **CloudWatch Logs Insights queries** for error pattern detection
7. **Metric filters** for custom application metrics and API usage tracking

All resources follow the `environmentSuffix` naming pattern for proper isolation and identification.
