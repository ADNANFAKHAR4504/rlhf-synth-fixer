import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

export interface MonitoringConstructProps {
  environmentName: string;
  auroraClusterId: string;
  ecsClusterName: string;
  albArn: string;
  cpuThreshold: number;
  memoryThreshold: number;
  environmentSuffix: string;
}

export class MonitoringConstruct extends Construct {
  public readonly dashboardName: string;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // CloudWatch Dashboard
    const dashboard = new CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `${props.environmentName}-dashboard-${props.environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/RDS',
                  'CPUUtilization',
                  {
                    stat: 'Average',
                    label: 'RDS CPU',
                  },
                ],
                [
                  'AWS/RDS',
                  'DatabaseConnections',
                  {
                    stat: 'Sum',
                    label: 'DB Connections',
                  },
                ],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'Aurora Metrics',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/ECS',
                  'CPUUtilization',
                  {
                    stat: 'Average',
                    label: 'ECS CPU',
                  },
                ],
                [
                  'AWS/ECS',
                  'MemoryUtilization',
                  {
                    stat: 'Average',
                    label: 'ECS Memory',
                  },
                ],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'ECS Metrics',
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
                  {
                    stat: 'Average',
                    label: 'Response Time',
                  },
                ],
                [
                  'AWS/ApplicationELB',
                  'RequestCount',
                  {
                    stat: 'Sum',
                    label: 'Requests',
                  },
                ],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'ALB Metrics',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
        ],
      }),
    });

    // CPU Alarm for ECS
    new CloudwatchMetricAlarm(this, 'cpu-alarm', {
      alarmName: `${props.environmentName}-ecs-cpu-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: props.cpuThreshold,
      alarmDescription: `CPU utilization alarm for ${props.environmentName} ECS cluster`,
      dimensions: {
        ClusterName: props.ecsClusterName,
      },
      tags: {
        Environment: props.environmentName,
      },
    });

    // Memory Alarm for ECS
    new CloudwatchMetricAlarm(this, 'memory-alarm', {
      alarmName: `${props.environmentName}-ecs-memory-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'MemoryUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: props.memoryThreshold,
      alarmDescription: `Memory utilization alarm for ${props.environmentName} ECS cluster`,
      dimensions: {
        ClusterName: props.ecsClusterName,
      },
      tags: {
        Environment: props.environmentName,
      },
    });

    // RDS CPU Alarm
    new CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `${props.environmentName}-rds-cpu-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: props.cpuThreshold,
      alarmDescription: `CPU utilization alarm for ${props.environmentName} Aurora cluster`,
      dimensions: {
        DBClusterIdentifier: props.auroraClusterId,
      },
      tags: {
        Environment: props.environmentName,
      },
    });

    this.dashboardName = dashboard.dashboardName;
  }
}
