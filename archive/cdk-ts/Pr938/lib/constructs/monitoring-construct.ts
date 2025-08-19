import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  enableLogging: boolean;
  vpc: ec2.Vpc;
  logRetentionDays: number;
}

export class MonitoringConstruct extends Construct {
  public readonly applicationLogGroup: logs.LogGroup;
  public readonly infrastructureLogGroup?: logs.LogGroup;
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create application log group
    this.applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${props.environmentSuffix}`,
      retention: props.logRetentionDays as logs.RetentionDays,
    });

    // Create infrastructure log group for additional logging
    if (props.enableLogging) {
      this.infrastructureLogGroup = new logs.LogGroup(
        this,
        'InfrastructureLogGroup',
        {
          logGroupName: `/aws/infrastructure/${props.environmentSuffix}`,
          retention: props.logRetentionDays as logs.RetentionDays,
        }
      );
    }

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `infrastructure-alerts-${props.environmentSuffix}`,
      displayName: `Infrastructure Alerts - ${props.environmentSuffix.toUpperCase()}`,
    });

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: `Infrastructure-${props.environmentSuffix}`,
    });

    // Add VPC metrics to dashboard
    const vpcWidget = new cloudwatch.GraphWidget({
      title: 'VPC Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/VPC',
          metricName: 'PacketDropCount',
          dimensionsMap: {
            VpcId: props.vpc.vpcId,
          },
          statistic: 'Sum',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add log metrics widget
    const logWidget = new cloudwatch.LogQueryWidget({
      title: 'Application Logs',
      logGroupNames: [this.applicationLogGroup.logGroupName],
      queryLines: [
        'fields @timestamp, @message',
        'filter @message like /ERROR/',
        'sort @timestamp desc',
        'limit 100',
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(vpcWidget);
    this.dashboard.addWidgets(logWidget);

    // Create alarms for critical metrics
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `HighErrorRate-${props.environmentSuffix}`,
      alarmDescription: 'Alarm for high error rate in application logs',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Logs',
        metricName: 'ErrorCount',
        dimensionsMap: {
          LogGroupName: this.applicationLogGroup.logGroupName,
        },
        statistic: 'Sum',
      }),
      threshold: props.environmentSuffix === 'prod' ? 10 : 25,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Add alarm action
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Add tags
    const resources = [this.applicationLogGroup, this.alertTopic];
    if (this.infrastructureLogGroup)
      resources.push(this.infrastructureLogGroup);

    resources.forEach(resource => {
      resource.node.addMetadata('Environment', props.environmentSuffix);
      resource.node.addMetadata('Component', 'Monitoring');
    });
  }
}
