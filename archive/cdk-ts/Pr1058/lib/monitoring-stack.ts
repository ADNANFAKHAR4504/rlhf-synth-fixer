import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  encryptionKey: kms.Key;
}

export class MonitoringStack extends cdk.Stack {
  public readonly logGroup: logs.LogGroup;
  public readonly alertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create CloudWatch log group
    // Note: KMS encryption removed due to permission issues with CloudWatch Logs service
    this.logGroup = new logs.LogGroup(
      this,
      `secure-${props.environmentSuffix}-logs`,
      {
        logGroupName: `/aws/ec2/secure-${props.environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // SNS topic for alerts
    this.alertsTopic = new sns.Topic(
      this,
      `secure-${props.environmentSuffix}-alerts`,
      {
        topicName: `secure-${props.environmentSuffix}-security-alerts`,
        masterKey: props.encryptionKey,
      }
    );

    // CloudWatch dashboard for security monitoring
    const dashboard = new cloudwatch.Dashboard(
      this,
      `secure-${props.environmentSuffix}-dashboard`,
      {
        dashboardName: `secure-${props.environmentSuffix}-security-monitoring`,
      }
    );

    // Add VPC Flow Logs monitoring widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'VPC Flow Logs - Rejected Connections',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/VPC-FlowLogs',
            metricName: 'PacketsDropped',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // CloudWatch alarm for high rejected connections
    const rejectedConnectionsAlarm = new cloudwatch.Alarm(
      this,
      `secure-${props.environmentSuffix}-rejected-connections`,
      {
        alarmName: `secure-${props.environmentSuffix}-high-rejected-connections`,
        alarmDescription: 'High number of rejected VPC connections detected',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/VPC-FlowLogs',
          metricName: 'PacketsDropped',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 100,
        evaluationPeriods: 2,
      }
    );

    rejectedConnectionsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alertsTopic)
    );

    // Apply tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('ProjectName', 'secure-infrastructure');
    cdk.Tags.of(this).add('CostCenter', 'security-team');
  }
}
