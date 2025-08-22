import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  instances: ec2.Instance[];
  database: rds.DatabaseInstance;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `webapp-alarms-${props.environmentSuffix}`,
      displayName: 'Web Application Alarms',
    });

    // Create CloudWatch dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `WebApp-Dashboard-${props.environmentSuffix}`,
    });

    // Create alarms for EC2 instances
    props.instances.forEach((instance, index) => {
      // CPU Utilization alarm
      const cpuAlarm = new cloudwatch.Alarm(this, `CpuAlarm${index + 1}`, {
        alarmName: `webapp-cpu-${index + 1}-${props.environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: instance.instanceId,
          },
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });
      cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      // Status Check alarm
      const statusAlarm = new cloudwatch.Alarm(
        this,
        `StatusAlarm${index + 1}`,
        {
          alarmName: `webapp-status-${index + 1}-${props.environmentSuffix}`,
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'StatusCheckFailed',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
          }),
          threshold: 1,
          evaluationPeriods: 1,
        }
      );
      statusAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(this.alarmTopic)
      );
    });

    // Database monitoring
    const dbConnections = new cloudwatch.Alarm(this, 'DbConnectionsAlarm', {
      alarmName: `webapp-db-connections-${props.environmentSuffix}`,
      metric: props.database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
    });
    dbConnections.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: props.instances.map(
          instance =>
            new cloudwatch.Metric({
              namespace: 'AWS/EC2',
              metricName: 'CPUUtilization',
              dimensionsMap: {
                InstanceId: instance.instanceId,
              },
            })
        ),
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [props.database.metricDatabaseConnections()],
        width: 12,
        height: 6,
      })
    );

    // Add tags
    cdk.Tags.of(this.alarmTopic).add('Component', 'Monitoring');
    cdk.Tags.of(this.alarmTopic).add('Environment', props.environmentSuffix);
  }
}
