import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  database: rds.DatabaseInstance;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'DatabaseAlerts', {
      displayName: `Retail Database Alerts - ${props.environmentSuffix}`,
      topicName: `retail-db-alerts-${props.environmentSuffix}`,
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'DatabaseDashboard', {
      dashboardName: `retail-database-${props.environmentSuffix}`,
    });

    // CPU Utilization Widget
    const cpuWidget = new cloudwatch.GraphWidget({
      title: 'CPU Utilization',
      left: [props.database.metricCPUUtilization()],
      width: 12,
      height: 6,
    });

    // Database Connections Widget
    const connectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [props.database.metricDatabaseConnections()],
      width: 12,
      height: 6,
    });

    // Free Storage Space Widget
    const storageWidget = new cloudwatch.GraphWidget({
      title: 'Free Storage Space',
      left: [props.database.metricFreeStorageSpace()],
      width: 12,
      height: 6,
    });

    // Read/Write IOPS Widget
    const iopsWidget = new cloudwatch.GraphWidget({
      title: 'Read/Write IOPS',
      left: [
        props.database.metricReadIOPS({ label: 'Read IOPS' }),
        props.database.metricWriteIOPS({ label: 'Write IOPS' }),
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(cpuWidget, connectionsWidget);
    dashboard.addWidgets(storageWidget, iopsWidget);

    // Create CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: props.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when CPU utilization exceeds 80%',
    });
    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const storageAlarm = new cloudwatch.Alarm(this, 'LowStorageAlarm', {
      metric: props.database.metricFreeStorageSpace(),
      threshold: 2 * 1024 * 1024 * 1024, // 2 GB in bytes
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when free storage space falls below 2GB',
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
    storageAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const connectionAlarm = new cloudwatch.Alarm(this, 'HighConnectionsAlarm', {
      metric: props.database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when database connections exceed 80',
    });
    connectionAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Output dashboard URL
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
