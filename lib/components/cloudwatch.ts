import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchComponentArgs {
  ecsClusterName: pulumi.Input<string>;
  ecsServiceName: pulumi.Input<string>;
  rdsClusterId: pulumi.Input<string>;
  albArn: pulumi.Input<string>;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class CloudWatchComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;

  constructor(
    name: string,
    args: CloudWatchComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:CloudWatchComponent', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `trading-dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `trading-dashboard-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            args.ecsClusterName,
            args.ecsServiceName,
            args.rdsClusterId,
            args.albArn,
          ])
          .apply(([_clusterName, _serviceName, clusterId, _albArn]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
                      ['.', 'MemoryUtilization', { stat: 'Average' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region,
                    title: 'ECS Cluster Metrics',
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
                        'AWS/RDS',
                        'CPUUtilization',
                        { stat: 'Average', DBClusterIdentifier: clusterId },
                      ],
                      [
                        '.',
                        'DatabaseConnections',
                        { stat: 'Average', DBClusterIdentifier: clusterId },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region,
                    title: 'RDS Cluster Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        { stat: 'Average' },
                      ],
                      ['.', 'RequestCount', { stat: 'Sum' }],
                      ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region,
                    title: 'ALB Metrics',
                  },
                },
              ],
            })
          ),
      },
      defaultResourceOptions
    );

    // CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `ecs-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `ecs-high-cpu-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'ECS CPU utilization is too high',
        tags: args.tags,
      },
      defaultResourceOptions
    );

    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `rds-high-cpu-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        dimensions: {
          DBClusterIdentifier: args.rdsClusterId,
        },
        tags: args.tags,
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
    });
  }
}
