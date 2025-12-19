import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface ProjectXMonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  api: apigateway.RestApi;
}

export class ProjectXMonitoringStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ProjectXMonitoringStackProps
  ) {
    super(scope, id, props);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ProjectXDashboard', {
      dashboardName: `projectX-monitoring-${props.environmentSuffix}`,
    });

    // Lambda metrics
    const lambdaDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensionsMap: {
        FunctionName: props.lambdaFunction.functionName,
      },
      statistic: 'Average',
    });

    const lambdaErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: props.lambdaFunction.functionName,
      },
      statistic: 'Sum',
    });

    const lambdaInvocationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: {
        FunctionName: props.lambdaFunction.functionName,
      },
      statistic: 'Sum',
    });

    // API Gateway metrics
    const apiLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: props.api.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Average',
    });

    const api4xxErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: props.api.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Sum',
    });

    const api5xxErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: props.api.restApiName,
        Stage: props.environmentSuffix,
      },
      statistic: 'Sum',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Performance',
        left: [lambdaDurationMetric],
        right: [lambdaInvocationMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaErrorMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [apiLatencyMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Errors',
        left: [api4xxErrorMetric, api5xxErrorMetric],
        width: 12,
        height: 6,
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ProjectXLambdaErrorAlarm', {
      alarmName: `projectX-lambda-errors-${props.environmentSuffix}`,
      metric: lambdaErrorMetric,
      threshold: 5,
      evaluationPeriods: 2,
    });

    new cloudwatch.Alarm(this, 'ProjectXApiLatencyAlarm', {
      alarmName: `projectX-api-high-latency-${props.environmentSuffix}`,
      metric: apiLatencyMetric,
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
    });

    // Note: Output is created at the main stack level
  }
}
