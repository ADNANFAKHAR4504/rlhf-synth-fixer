import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `serverless-api-alerts-${environmentSuffix}`,
      displayName: 'Serverless API Alerts',
    });

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        alarmName: `lambda-duration-${environmentSuffix}`,
        alarmDescription: 'Lambda function duration exceeds threshold',
        metric: props.lambdaFunction.metricDuration({
          statistic: 'Average',
        }),
        threshold: 5000, // 5 seconds
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // Lambda Error Rate Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Lambda function error rate is too high',
      metric: props.lambdaFunction.metricErrors({
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // Lambda Throttles Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottleAlarm',
      {
        alarmName: `lambda-throttles-${environmentSuffix}`,
        alarmDescription: 'Lambda function is being throttled',
        metric: props.lambdaFunction.metricThrottles({
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // API Gateway 4XX Errors Alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxErrorAlarm', {
      alarmName: `api-4xx-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 4XX error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    api4xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // API Gateway 5XX Errors Alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxErrorAlarm', {
      alarmName: `api-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'API Gateway 5XX error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.apiGateway.restApiName,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
    api5xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alertTopic)
    );

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'ServerlessApiDashboard', {
      dashboardName: `serverless-api-dashboard-${environmentSuffix}`,
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          props.lambdaFunction.metricInvocations(),
          props.lambdaFunction.metricErrors(),
          props.lambdaFunction.metricThrottles(),
        ],
        right: [props.lambdaFunction.metricDuration()],
        width: 12,
        height: 6,
      })
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Sum',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            dimensionsMap: {
              ApiName: props.apiGateway.restApiName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Add tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Service', 'ServerlessAPI');
    cdk.Tags.of(this).add('Component', 'Monitoring');

    // Output SNS Topic ARN
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `${this.stackName}-AlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${this.stackName}-DashboardUrl`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: this.dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name',
      exportName: `${this.stackName}-DashboardName`,
    });
  }
}
