/**
 * monitoring-stack.ts
 *
 * This module defines CloudWatch dashboard for monitoring payment processing
 * Lambda functions and DynamoDB metrics.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  validatorFunctionName: pulumi.Input<string>;
  processorFunctionName: pulumi.Input<string>;
  notifierFunctionName: pulumi.Input<string>;
  dynamoTableName: pulumi.Input<string>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      validatorFunctionName,
      processorFunctionName,
      notifierFunctionName,
      dynamoTableName,
    } = args;

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `payment-dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-monitoring-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            validatorFunctionName,
            processorFunctionName,
            notifierFunctionName,
            dynamoTableName,
          ])
          .apply(([validator, processor, notifier, table]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  x: 0,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/Lambda', 'Invocations', 'FunctionName', validator],
                      ['AWS/Lambda', 'Invocations', 'FunctionName', processor],
                      ['AWS/Lambda', 'Invocations', 'FunctionName', notifier],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'ap-southeast-1',
                    title: 'Lambda Invocations',
                    period: 300,
                    stat: 'Sum',
                    yAxis: {
                      left: {
                        label: 'Count',
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 12,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/Lambda', 'Errors', 'FunctionName', validator],
                      ['AWS/Lambda', 'Errors', 'FunctionName', processor],
                      ['AWS/Lambda', 'Errors', 'FunctionName', notifier],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'ap-southeast-1',
                    title: 'Lambda Errors',
                    period: 300,
                    stat: 'Sum',
                    yAxis: {
                      left: {
                        label: 'Count',
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 0,
                  y: 6,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/Lambda', 'Duration', 'FunctionName', validator],
                      ['AWS/Lambda', 'Duration', 'FunctionName', processor],
                      ['AWS/Lambda', 'Duration', 'FunctionName', notifier],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'ap-southeast-1',
                    title: 'Lambda Duration (ms)',
                    period: 300,
                    stat: 'Average',
                    yAxis: {
                      left: {
                        label: 'Milliseconds',
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 12,
                  y: 6,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/DynamoDB',
                        'ConsumedReadCapacityUnits',
                        'TableName',
                        table,
                      ],
                      [
                        'AWS/DynamoDB',
                        'ConsumedWriteCapacityUnits',
                        'TableName',
                        table,
                      ],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'ap-southeast-1',
                    title: 'DynamoDB Capacity Units',
                    period: 300,
                    stat: 'Sum',
                    yAxis: {
                      left: {
                        label: 'Units',
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 0,
                  y: 12,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/DynamoDB', 'UserErrors', 'TableName', table],
                      ['AWS/DynamoDB', 'SystemErrors', 'TableName', table],
                    ],
                    view: 'timeSeries',
                    stacked: true,
                    region: 'ap-southeast-1',
                    title: 'DynamoDB Errors',
                    period: 300,
                    stat: 'Sum',
                    yAxis: {
                      left: {
                        label: 'Count',
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 12,
                  y: 12,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/Lambda',
                        'ConcurrentExecutions',
                        'FunctionName',
                        validator,
                      ],
                      [
                        'AWS/Lambda',
                        'ConcurrentExecutions',
                        'FunctionName',
                        processor,
                      ],
                      [
                        'AWS/Lambda',
                        'ConcurrentExecutions',
                        'FunctionName',
                        notifier,
                      ],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'ap-southeast-1',
                    title: 'Lambda Concurrent Executions',
                    period: 300,
                    stat: 'Maximum',
                    yAxis: {
                      left: {
                        label: 'Count',
                      },
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Construct dashboard URL
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#dashboards:name=${this.dashboard.dashboardName}`;

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
