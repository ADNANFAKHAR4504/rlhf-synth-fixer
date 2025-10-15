import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface MonitoringStackProps extends cdk.StackProps {
  dlq: sqs.IQueue;
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly dlqAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create an SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'TradingAlertTopic', {
      topicName: `trading-alerts-${suffix}`,
      displayName: 'Trading System Alerts',
    });

    // Create a CloudWatch alarm for DLQ messages
    this.dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `TradingEventsDLQNotEmpty-${suffix}`,
      alarmDescription:
        'Alarm if there are any messages in the Dead Letter Queue',
      metric: props.dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Configure the alarm action to notify the SNS topic
    this.dlqAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alertTopic)
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'DLQAlarmArn', {
      value: this.dlqAlarm.alarmArn,
      description: 'ARN of the DLQ Messages Alarm',
      exportName: `trading-dlq-alarm-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'DLQAlarmName', {
      value: this.dlqAlarm.alarmName,
      description: 'Name of the DLQ Messages Alarm',
      exportName: `trading-dlq-alarm-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'ARN of the Alert SNS Topic',
      exportName: `trading-alert-topic-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicName', {
      value: this.alertTopic.topicName,
      description: 'Name of the Alert SNS Topic',
      exportName: `trading-alert-topic-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmThreshold', {
      value: '0',
      description: 'Alarm threshold for DLQ messages',
      exportName: `trading-alarm-threshold-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmEvaluationPeriods', {
      value: '1',
      description: 'Number of evaluation periods for the alarm',
      exportName: `trading-alarm-eval-periods-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmComparisonOperator', {
      value: 'GREATER_THAN_THRESHOLD',
      description: 'Comparison operator for the alarm',
      exportName: `trading-alarm-operator-${suffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmMetricName', {
      value: 'ApproximateNumberOfMessagesVisible',
      description: 'CloudWatch metric name for the alarm',
      exportName: `trading-alarm-metric-${suffix}`,
    });

    new cdk.CfnOutput(this, 'MonitoredQueueArn', {
      value: props.dlq.queueArn,
      description: 'ARN of the queue being monitored',
      exportName: `trading-monitored-queue-arn-${suffix}`,
    });
  }
}
