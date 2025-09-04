import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  processingFunction: lambda.Function;
  streamingFunction: lambda.Function;
  api: apigateway.RestApi;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix, processingFunction, streamingFunction, api } =
      props;

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `serverless-alerts-${environmentSuffix}`,
      displayName: `Serverless Alerts - ${environmentSuffix}`,
    });

    // Ensure topic can be destroyed
    alertTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `serverless-dashboard-${environmentSuffix}`,
    });

    // Lambda metrics widgets
    const lambdaMetricsWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Function Metrics',
      left: [
        processingFunction.metricInvocations({
          label: 'Processing Invocations',
        }),
        streamingFunction.metricInvocations({ label: 'Streaming Invocations' }),
      ],
      right: [
        processingFunction.metricErrors({ label: 'Processing Errors' }),
        streamingFunction.metricErrors({ label: 'Streaming Errors' }),
      ],
    });

    const lambdaDurationWidget = new cloudwatch.GraphWidget({
      title: 'Lambda Duration',
      left: [
        processingFunction.metricDuration({ label: 'Processing Duration' }),
        streamingFunction.metricDuration({ label: 'Streaming Duration' }),
      ],
    });

    // API Gateway metrics widgets
    const apiMetricsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Metrics',
      left: [api.metricCount({ label: 'Request Count' })],
      right: [
        api.metricClientError({ label: '4XX Errors' }),
        api.metricServerError({ label: '5XX Errors' }),
      ],
    });

    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        api.metricLatency({ label: 'Latency' }),
        api.metricIntegrationLatency({ label: 'Integration Latency' }),
      ],
    });

    // Custom metrics widget for application metrics
    const customMetricsWidget = new cloudwatch.GraphWidget({
      title: 'Custom Application Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'ServerlessApp/Processing',
          metricName: 'RequestCount',
          dimensionsMap: {
            Environment: environmentSuffix,
          },
          label: 'Processing Requests',
          statistic: 'Sum',
        }),
        new cloudwatch.Metric({
          namespace: 'ServerlessApp/Streaming',
          metricName: 'StreamingRequestCount',
          dimensionsMap: {
            Environment: environmentSuffix,
          },
          label: 'Streaming Requests',
          statistic: 'Sum',
        }),
      ],
    });

    // Add widgets to dashboard
    dashboard.addWidgets(lambdaMetricsWidget, lambdaDurationWidget);
    dashboard.addWidgets(apiMetricsWidget, apiLatencyWidget);
    dashboard.addWidgets(customMetricsWidget);

    // CloudWatch Alarms
    const processingErrorAlarm = new cloudwatch.Alarm(
      this,
      'ProcessingFunctionHighErrors',
      {
        alarmName: `processing-function-high-errors-${environmentSuffix}`,
        alarmDescription: 'Processing function error rate is high',
        metric: processingFunction.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 10,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    const streamingErrorAlarm = new cloudwatch.Alarm(
      this,
      'StreamingFunctionHighErrors',
      {
        alarmName: `streaming-function-high-errors-${environmentSuffix}`,
        alarmDescription: 'Streaming function error rate is high',
        metric: streamingFunction.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiGatewayHighErrors', {
      alarmName: `api-gateway-high-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 5XX error rate is high',
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 20,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    const apiLatencyAlarm = new cloudwatch.Alarm(
      this,
      'ApiGatewayHighLatency',
      {
        alarmName: `api-gateway-high-latency-${environmentSuffix}`,
        alarmDescription: 'API Gateway latency is high',
        metric: api.metricLatency({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 2000, // 2 seconds
        evaluationPeriods: 3,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    // Add SNS actions to alarms
    const snsAction = new cloudwatchActions.SnsAction(alertTopic);
    processingErrorAlarm.addAlarmAction(snsAction);
    streamingErrorAlarm.addAlarmAction(snsAction);
    apiErrorAlarm.addAlarmAction(snsAction);
    apiLatencyAlarm.addAlarmAction(snsAction);

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });
  }
}
