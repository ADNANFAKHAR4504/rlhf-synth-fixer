import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class MonitoringStack extends BaseStack {
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create SNS topic for drift detection alerts
    const driftTopic = new sns.Topic(this, 'DriftDetectionTopic', {
      topicName: this.getResourceName('drift-detection'),
      displayName: 'CloudFormation Drift Detection Alerts',
    });

    // Add email subscription (replace with actual email)
    driftTopic.addSubscription(
      new subscriptions.EmailSubscription(
        `ops-${this.environmentSuffix}@example.com`
      )
    );

    // Create CloudWatch alarm for drift detection
    const driftAlarm = new cloudwatch.Alarm(this, 'DriftDetectionAlarm', {
      alarmName: this.getResourceName('drift-detection-alarm'),
      alarmDescription: 'Triggers when CloudFormation stack drift is detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFormation',
        metricName: 'StackDriftDetectionStatus',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    driftAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(driftTopic));

    // Create dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(
      this,
      'TradingPlatformDashboard',
      {
        dashboardName: this.getResourceName('trading-platform'),
      }
    );

    // Add widgets for key metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Export monitoring resources
    this.exportToParameterStore('drift-topic-arn', driftTopic.topicArn);
    this.exportToParameterStore('dashboard-name', dashboard.dashboardName);
  }
}
