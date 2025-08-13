import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  userDataProcessor: lambda.Function;
  orderDataProcessor: lambda.Function;
  analyticsProcessor: lambda.Function;
  userDataTable: dynamodb.Table;
  orderDataTable: dynamodb.Table;
  analyticsTable: dynamodb.Table;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${props.environmentSuffix}-serverless-alerts-synth`,
      displayName: 'Serverless Infrastructure Alerts',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `${props.environmentSuffix}-serverless-dashboard-synth`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Invocations',
            left: [
              props.userDataProcessor.metricInvocations(),
              props.orderDataProcessor.metricInvocations(),
              props.analyticsProcessor.metricInvocations(),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Errors',
            left: [
              props.userDataProcessor.metricErrors(),
              props.orderDataProcessor.metricErrors(),
              props.analyticsProcessor.metricErrors(),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Duration',
            left: [
              props.userDataProcessor.metricDuration(),
              props.orderDataProcessor.metricDuration(),
              props.analyticsProcessor.metricDuration(),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'DynamoDB Read/Write Capacity',
            left: [
              props.userDataTable.metricConsumedReadCapacityUnits(),
              props.orderDataTable.metricConsumedReadCapacityUnits(),
            ],
            right: [
              props.userDataTable.metricConsumedWriteCapacityUnits(),
              props.orderDataTable.metricConsumedWriteCapacityUnits(),
            ],
          }),
        ],
      ],
    });

    // CloudWatch Alarms for Lambda Functions
    const userDataProcessorErrorAlarm = new cloudwatch.Alarm(
      this,
      'UserDataProcessorErrorAlarm',
      {
        alarmName: `${props.environmentSuffix}-userdataprocessor-errors-synth`,
        alarmDescription: 'Alarm for User Data Processor Lambda errors',
        metric: props.userDataProcessor.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    userDataProcessorErrorAlarm.addAlarmAction({
      bind: () => ({
        alarmActionArn: alertTopic.topicArn,
      }),
    });

    const orderDataProcessorErrorAlarm = new cloudwatch.Alarm(
      this,
      'OrderDataProcessorErrorAlarm',
      {
        alarmName: `${props.environmentSuffix}-orderdataprocessor-errors-synth`,
        alarmDescription: 'Alarm for Order Data Processor Lambda errors',
        metric: props.orderDataProcessor.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    orderDataProcessorErrorAlarm.addAlarmAction({
      bind: () => ({
        alarmActionArn: alertTopic.topicArn,
      }),
    });

    // CloudWatch Application Signals for enhanced observability
    // Note: This would require additional setup for Application Signals
    // For now, we're enabling enhanced monitoring through custom metrics

    // EventBridge rule to trigger analytics processor daily
    const dailyAnalyticsRule = new events.Rule(this, 'DailyAnalyticsRule', {
      ruleName: `${props.environmentSuffix}-daily-analytics-synth`,
      description: 'Triggers analytics processor daily',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // 2 AM daily
      }),
    });

    dailyAnalyticsRule.addTarget(
      new targets.LambdaFunction(props.analyticsProcessor)
    );

    // Output monitoring resources
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${cdk.Stack.of(this).region}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });
  }
}
