import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

export interface CloudWatchConstructProps {
  environmentSuffix: string;
  ecsClusterName: string;
  ecsServiceName: string;
  albTargetGroupArn: string;
  rdsClusterIdentifier: string;
  alarmThresholds: {
    cpuUtilization: number;
    memoryUtilization: number;
    targetResponseTime: number;
    unhealthyHostCount: number;
    databaseConnections: number;
  };
  tags?: Record<string, string>;
}

export class CloudWatchConstruct extends Construct {
  public readonly dashboard: CloudwatchDashboard;
  public readonly alarms: CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, props: CloudWatchConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      ecsClusterName,
      ecsServiceName,
      albTargetGroupArn,
      rdsClusterIdentifier,
      alarmThresholds,
      tags = {},
    } = props;

    this.alarms = [];

    // Extract target group name from ARN
    const targetGroupName = albTargetGroupArn.split(':').pop()!;

    // Create dashboard
    this.dashboard = new CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `trading-app-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/ECS',
                  'CPUUtilization',
                  'ServiceName',
                  ecsServiceName,
                  'ClusterName',
                  ecsClusterName,
                ],
                ['.', 'MemoryUtilization', '.', '.', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'ECS Service Metrics',
              yAxis: {
                left: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/ApplicationELB',
                  'TargetResponseTime',
                  'TargetGroup',
                  targetGroupName,
                ],
                ['.', 'RequestCount', '.', '.'],
                ['.', 'UnHealthyHostCount', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'ALB Metrics',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/RDS',
                  'CPUUtilization',
                  'DBClusterIdentifier',
                  rdsClusterIdentifier,
                ],
                ['.', 'DatabaseConnections', '.', '.'],
                ['.', 'FreeableMemory', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'RDS Cluster Metrics',
            },
          },
        ],
      }),
    });

    // Create alarms
    const cpuAlarm = new CloudwatchMetricAlarm(this, 'ecs-cpu-alarm', {
      alarmName: `ecs-cpu-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: alarmThresholds.cpuUtilization,
      dimensions: {
        ServiceName: ecsServiceName,
        ClusterName: ecsClusterName,
      },
      alarmDescription: `CPU utilization exceeded ${alarmThresholds.cpuUtilization}% for ${environmentSuffix}`,
      tags: {
        Name: `ecs-cpu-alarm-${environmentSuffix}`,
        ...tags,
      },
    });
    this.alarms.push(cpuAlarm);

    const memoryAlarm = new CloudwatchMetricAlarm(this, 'ecs-memory-alarm', {
      alarmName: `ecs-memory-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'MemoryUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: alarmThresholds.memoryUtilization,
      dimensions: {
        ServiceName: ecsServiceName,
        ClusterName: ecsClusterName,
      },
      alarmDescription: `Memory utilization exceeded ${alarmThresholds.memoryUtilization}% for ${environmentSuffix}`,
      tags: {
        Name: `ecs-memory-alarm-${environmentSuffix}`,
        ...tags,
      },
    });
    this.alarms.push(memoryAlarm);

    const responseTimeAlarm = new CloudwatchMetricAlarm(
      this,
      'alb-response-time-alarm',
      {
        alarmName: `alb-response-time-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: alarmThresholds.targetResponseTime,
        dimensions: {
          TargetGroup: targetGroupName,
        },
        alarmDescription: `Target response time exceeded ${alarmThresholds.targetResponseTime}s for ${environmentSuffix}`,
        tags: {
          Name: `alb-response-time-alarm-${environmentSuffix}`,
          ...tags,
        },
      }
    );
    this.alarms.push(responseTimeAlarm);

    const unhealthyHostAlarm = new CloudwatchMetricAlarm(
      this,
      'alb-unhealthy-host-alarm',
      {
        alarmName: `alb-unhealthy-hosts-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Maximum',
        threshold: alarmThresholds.unhealthyHostCount,
        dimensions: {
          TargetGroup: targetGroupName,
        },
        alarmDescription: `Unhealthy host count exceeded ${alarmThresholds.unhealthyHostCount} for ${environmentSuffix}`,
        tags: {
          Name: `alb-unhealthy-host-alarm-${environmentSuffix}`,
          ...tags,
        },
      }
    );
    this.alarms.push(unhealthyHostAlarm);

    const dbConnectionsAlarm = new CloudwatchMetricAlarm(
      this,
      'rds-connections-alarm',
      {
        alarmName: `rds-connections-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: alarmThresholds.databaseConnections,
        dimensions: {
          DBClusterIdentifier: rdsClusterIdentifier,
        },
        alarmDescription: `Database connections exceeded ${alarmThresholds.databaseConnections} for ${environmentSuffix}`,
        tags: {
          Name: `rds-connections-alarm-${environmentSuffix}`,
          ...tags,
        },
      }
    );
    this.alarms.push(dbConnectionsAlarm);
  }
}
