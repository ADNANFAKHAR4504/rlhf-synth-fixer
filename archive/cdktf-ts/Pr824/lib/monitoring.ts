import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { Construct } from 'constructs';

export interface MonitoringProps {
  provider: any;
  environment: string;
  asgName: string;
  dbIdentifier: string;
  scaleUpPolicyArn?: string;
  scaleDownPolicyArn?: string;
  albTargetGroupName?: string;
}

export class Monitoring extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    // SNS Topic for alerts
    const topic = new SnsTopic(this, `${id}-alerts`, {
      provider: props.provider,
      name: `${props.environment}-alerts`,
    });

    // Log group for application
    new CloudwatchLogGroup(this, `${id}-app-logs`, {
      provider: props.provider,
      name: `/app/${props.environment}`,
      retentionInDays: 30,
    });

    // Log group for database
    new CloudwatchLogGroup(this, `${id}-db-logs`, {
      provider: props.provider,
      name: `/db/${props.environment}`,
      retentionInDays: 30,
    });

    // CPU Utilization Alarm for ASG with scaling policies
    new CloudwatchMetricAlarm(this, `${id}-cpu-alarm`, {
      provider: props.provider,
      alarmName: `${props.environment}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'High CPU usage detected',
      dimensions: { AutoScalingGroupName: props.asgName },
      alarmActions: props.scaleUpPolicyArn
        ? [topic.arn, props.scaleUpPolicyArn]
        : [topic.arn],
      okActions: props.scaleDownPolicyArn ? [props.scaleDownPolicyArn] : [],
    });

    // FreeStorageSpace Alarm for RDS — only if dbIdentifier is non-empty
    if (props.dbIdentifier && props.dbIdentifier.trim().length > 0) {
      new CloudwatchMetricAlarm(this, `${id}-db-storage-alarm`, {
        provider: props.provider,
        alarmName: `${props.environment}-low-storage`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 2000000000, // 2 GB
        alarmDescription: 'Low RDS storage space detected',
        dimensions: { DBInstanceIdentifier: props.dbIdentifier },
        alarmActions: [topic.arn],
      });

      // RDS Backup Verification Alarm
      new CloudwatchMetricAlarm(this, `${id}-db-backup-alarm`, {
        provider: props.provider,
        alarmName: `${props.environment}-rds-backup-check`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'BackupStorageBilled',
        namespace: 'AWS/RDS',
        period: 86400, // 1 day
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'RDS backup storage usage unexpectedly low',
        dimensions: { DBInstanceIdentifier: props.dbIdentifier },
        alarmActions: [topic.arn],
      });
    }

    // ALB Target Health Alarm (optional)
    if (
      props.albTargetGroupName &&
      props.albTargetGroupName.trim().length > 0
    ) {
      new CloudwatchMetricAlarm(this, `${id}-alb-health-alarm`, {
        provider: props.provider,
        alarmName: `${props.environment}-alb-unhealthy-hosts`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'One or more ALB targets are unhealthy',
        dimensions: { TargetGroupName: props.albTargetGroupName },
        alarmActions: [topic.arn],
      });
    }
  }
}
