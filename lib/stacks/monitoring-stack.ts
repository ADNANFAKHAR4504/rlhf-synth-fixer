import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  primaryCluster: rds.DatabaseCluster;
  secondaryCluster: rds.DatabaseCluster;
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'AuroraDRDashboard', {
      dashboardName: `aurora-dr-monitoring-${suffix}`,
      defaultInterval: cdk.Duration.minutes(5),
    });

    // Replication Lag Widget
    const replicationLagWidget = new cloudwatch.GraphWidget({
      title: 'Global Database Replication Lag',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Replication Lag (ms)',
        }),
      ],
      width: 12,
      height: 6,
    });

    // CPU Utilization Widget
    const cpuWidget = new cloudwatch.GraphWidget({
      title: 'Cluster CPU Utilization',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Primary CPU %',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: props.secondaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Secondary CPU %',
          region: props.secondaryCluster.stack.region,
        }),
      ],
      width: 12,
      height: 6,
    });

    // Database Connections Widget
    const connectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Sum',
          label: 'Primary Connections',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: props.secondaryCluster.clusterIdentifier,
          },
          statistic: 'Sum',
          label: 'Secondary Connections',
          region: props.secondaryCluster.stack.region,
        }),
      ],
      width: 12,
      height: 6,
    });

    // IOPS Widget
    const iopsWidget = new cloudwatch.GraphWidget({
      title: 'Read/Write IOPS',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'VolumeReadIOPs',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Read IOPS',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'VolumeWriteIOPs',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Average',
          label: 'Write IOPS',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Backup Status Widget
    const backupWidget = new cloudwatch.SingleValueWidget({
      title: 'Latest Backup Status',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'SnapshotStorageUsed',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
          },
          statistic: 'Maximum',
        }),
      ],
      width: 6,
      height: 4,
    });

    // Failover Status Widget
    const failoverWidget = new cloudwatch.TextWidget({
      markdown: `# Failover Status
            
**Primary Region:** ${props.primaryCluster.stack.region}  
**Secondary Region:** ${props.secondaryCluster.stack.region}  
**RPO Target:** < 1 minute  
**RTO Target:** < 5 minutes  
            `,
      width: 6,
      height: 4,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      replicationLagWidget,
      cpuWidget,
      connectionsWidget,
      iopsWidget,
      backupWidget,
      failoverWidget
    );

    // Create alarms for critical metrics
    new cloudwatch.Alarm(this, 'HighReplicationLag', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'AuroraGlobalDBReplicationLag',
        dimensionsMap: {
          DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
        },
        statistic: 'Average',
      }),
      threshold: 5000,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmName: 'aurora-dr-high-replication-lag',
      alarmDescription: 'Replication lag exceeds 5 seconds',
    });

    new cloudwatch.Alarm(this, 'BackupFailure', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'BackupRetentionPeriodStorageUsed',
        dimensionsMap: {
          DBClusterIdentifier: props.primaryCluster.clusterIdentifier,
        },
        statistic: 'Minimum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmName: 'aurora-dr-backup-failure',
      alarmDescription: 'Backup storage indicates potential backup failure',
    });
  }
}
