import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchDashboardArgs {
  environmentSuffix: string;
  environment: string;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  auroraClusterId: pulumi.Output<string>;
}

export class CloudWatchDashboard extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchDashboardArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:CloudWatchDashboard', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    const region = aws.getRegionOutput().name;

    // Create comprehensive dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `trading-platform-${args.environment}-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            args.ecsClusterName,
            args.ecsServiceName,
            args.albArn,
            args.auroraClusterId,
            region,
          ])
          .apply(([_clusterName, _serviceName, _albArn, _clusterId, reg]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ECS',
                        'CPUUtilization',
                        { stat: 'Average', label: 'ECS CPU' },
                      ],
                      [
                        '.',
                        'MemoryUtilization',
                        { stat: 'Average', label: 'ECS Memory' },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg,
                    title: 'ECS Resource Utilization',
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
                        { stat: 'Average' },
                      ],
                      ['.', 'RequestCount', { stat: 'Sum' }],
                      ['.', 'HTTPCode_Target_2XX_Count', { stat: 'Sum' }],
                      ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
                      ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg,
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
                        { stat: 'Average', label: 'RDS CPU' },
                      ],
                      [
                        '.',
                        'DatabaseConnections',
                        { stat: 'Average', label: 'DB Connections' },
                      ],
                      [
                        '.',
                        'ReadLatency',
                        { stat: 'Average', label: 'Read Latency' },
                      ],
                      [
                        '.',
                        'WriteLatency',
                        { stat: 'Average', label: 'Write Latency' },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg,
                    title: 'Aurora Cluster Metrics',
                  },
                },
                {
                  type: 'log',
                  properties: {
                    query: `SOURCE '/ecs/trading-app-${args.environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20`,
                    region: reg,
                    title: 'Recent ECS Logs',
                  },
                },
              ],
            })
          ),
      },
      defaultResourceOptions
    );

    this.dashboardName = this.dashboard.dashboardName;

    this.registerOutputs({
      dashboardName: this.dashboardName,
    });
  }
}
