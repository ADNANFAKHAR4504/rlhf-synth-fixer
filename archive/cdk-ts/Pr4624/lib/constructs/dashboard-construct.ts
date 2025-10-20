import * as cdk from 'aws-cdk-lib';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface DashboardConstructProps {
  environmentSuffix: string;
  alarms?: cw.Alarm[];
}

export class DashboardConstruct extends Construct {
  public readonly dashboard: cw.Dashboard;

  constructor(scope: Construct, id: string, props: DashboardConstructProps) {
    super(scope, id);

    this.dashboard = new cw.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `${cdk.Stack.of(this).stackName}-Dashboard-${props.environmentSuffix}`,
      periodOverride: cw.PeriodOverride.AUTO,
      defaultInterval: cdk.Duration.minutes(5),
    });

    // API Gateway Widgets
    const apiGatewayWidgets = this.createApiGatewayWidgets();

    // Lambda Widgets
    const lambdaWidgets = this.createLambdaWidgets();

    // RDS Widgets
    const rdsWidgets = this.createRdsWidgets();

    // Alarm Status Widget (if alarms are provided)
    if (props.alarms && props.alarms.length > 0) {
      const alarmWidget = this.createAlarmStatusWidget(props.alarms);
      this.dashboard.addWidgets(alarmWidget);
    }

    // Add widgets to dashboard
    this.dashboard.addWidgets(...apiGatewayWidgets);
    this.dashboard.addWidgets(...lambdaWidgets);
    this.dashboard.addWidgets(...rdsWidgets);
  }

  private createApiGatewayWidgets(): cw.IWidget[] {
    const requestCount = new cw.GraphWidget({
      title: 'API Gateway - Request Count',
      left: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const latency = new cw.GraphWidget({
      title: 'API Gateway - Latency',
      left: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          statistic: 'p99',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const errors = new cw.GraphWidget({
      title: 'API Gateway - Error Rates',
      left: [
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cw.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    return [
      new cw.TextWidget({
        markdown: '# API Gateway Metrics',
        width: 24,
        height: 1,
      }),
      requestCount,
      latency,
      errors,
    ];
  }

  private createLambdaWidgets(): cw.IWidget[] {
    const invocations = new cw.GraphWidget({
      title: 'Lambda - Invocations',
      left: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 8,
      height: 6,
    });

    const duration = new cw.GraphWidget({
      title: 'Lambda - Duration',
      left: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Duration',
          statistic: 'Maximum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 8,
      height: 6,
    });

    const errors = new cw.GraphWidget({
      title: 'Lambda - Errors & Throttles',
      left: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Throttles',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 8,
      height: 6,
    });

    const concurrentExecutions = new cw.SingleValueWidget({
      title: 'Lambda - Concurrent Executions',
      metrics: [
        new cw.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'ConcurrentExecutions',
          statistic: 'Maximum',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 6,
      height: 3,
    });

    return [
      new cw.TextWidget({
        markdown: '# Lambda Function Metrics',
        width: 24,
        height: 1,
      }),
      invocations,
      duration,
      errors,
      concurrentExecutions,
    ];
  }

  private createRdsWidgets(): cw.IWidget[] {
    const cpuUtilization = new cw.GraphWidget({
      title: 'RDS - CPU Utilization',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const connections = new cw.GraphWidget({
      title: 'RDS - Database Connections',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const latency = new cw.GraphWidget({
      title: 'RDS - Read/Write Latency',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadLatency',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      right: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'WriteLatency',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    const iops = new cw.GraphWidget({
      title: 'RDS - IOPS',
      left: [
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'ReadIOPS',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        new cw.Metric({
          namespace: 'AWS/RDS',
          metricName: 'WriteIOPS',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
      width: 12,
      height: 6,
    });

    return [
      new cw.TextWidget({
        markdown: '# RDS Database Metrics',
        width: 24,
        height: 1,
      }),
      cpuUtilization,
      connections,
      latency,
      iops,
    ];
  }

  private createAlarmStatusWidget(alarms: cw.Alarm[]): cw.IWidget {
    return new cw.AlarmStatusWidget({
      title: 'Alarm Status',
      alarms: alarms,
      width: 24,
      height: 4,
    });
  }
}
