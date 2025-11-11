import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface ApiGatewayMonitoringStackProps extends cdk.StackProps {
  readonly apiGatewayName?: string;
}

export class ApiGatewayMonitoringStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: ApiGatewayMonitoringStackProps
  ) {
    super(scope, id, props);

    const apiName = props?.apiGatewayName ?? 'payment-api';

    const latency = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: { ApiName: apiName },
      statistic: 'p95',
      period: cdk.Duration.minutes(1),
    });

    const errorRate = new cloudwatch.MathExpression({
      expression: '100 * errors / requests',
      usingMetrics: {
        errors: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: { ApiName: apiName },
          statistic: 'sum',
          period: cdk.Duration.minutes(1),
        }),
        requests: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: { ApiName: apiName },
          statistic: 'sum',
          period: cdk.Duration.minutes(1),
        }),
      },
      label: 'ErrorRate%',
    });

    const dashboard = new cloudwatch.Dashboard(this, 'ApiGatewayDashboard', {
      dashboardName: `${apiName}-gateway-dashboard`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency (p95)',
        left: [latency],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Error Rate (%)',
        left: [errorRate],
      })
    );

    new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: latency,
      threshold: 500,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'API Gateway latency > 500ms',
    });

    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorRate,
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'API Gateway error rate > 1%',
    });
  }
}
