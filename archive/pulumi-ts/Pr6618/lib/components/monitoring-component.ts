import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface MonitoringComponentArgs {
  environmentSuffix: string;
  clusterName: pulumi.Input<string>;
  serviceName: pulumi.Input<string>;
  albArn: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
  rdsClusterIdentifier: pulumi.Input<string>;
}

export class MonitoringComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly snsTopic: aws.sns.Topic;
  public readonly alarms: aws.cloudwatch.MetricAlarm[];

  constructor(
    name: string,
    args: MonitoringComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:MonitoringComponent', name, {}, opts);

    // Create SNS Topic for Alerts
    this.snsTopic = new aws.sns.Topic(
      `alerts-topic-${args.environmentSuffix}`,
      {
        name: `alerts-topic-${args.environmentSuffix}-pw`,
        displayName: `Alerts for ${args.environmentSuffix} environment`,
        tags: {
          Name: `alerts-topic-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `trading-platform-${args.environmentSuffix}-pw`,
        dashboardBody: pulumi
          .all([
            args.clusterName,
            args.serviceName,
            args.albArn,
            args.targetGroupArn,
            args.rdsClusterIdentifier,
          ])
          .apply(([cluster, service, albArn, _targetGroup, rdsCluster]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ECS',
                        'CPUUtilization',
                        'ClusterName',
                        cluster,
                        'ServiceName',
                        service,
                      ],
                      ['.', 'MemoryUtilization', '.', '.', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region,
                    title: 'ECS Service Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        'LoadBalancer',
                        albArn.split(':').pop(),
                      ],
                      ['.', 'RequestCount', '.', '.'],
                      ['.', 'HTTPCode_Target_2XX_Count', '.', '.'],
                      ['.', 'HTTPCode_Target_5XX_Count', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: aws.config.region,
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
                        rdsCluster,
                      ],
                      ['.', 'DatabaseConnections', '.', '.'],
                      ['.', 'FreeableMemory', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region,
                    title: 'RDS Aurora Metrics',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CloudWatch Alarms
    this.alarms = [];

    // ECS CPU Alarm
    const ecsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `ecs-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `ecs-cpu-high-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'ECS CPU utilization is too high',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          ClusterName: args.clusterName,
          ServiceName: args.serviceName,
        },
        tags: {
          Name: `ecs-cpu-alarm-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );
    this.alarms.push(ecsCpuAlarm);

    // RDS CPU Alarm
    const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `rds-cpu-high-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBClusterIdentifier: args.rdsClusterIdentifier,
        },
        tags: {
          Name: `rds-cpu-alarm-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );
    this.alarms.push(rdsCpuAlarm);

    // ALB 5XX Alarm
    const alb5xxAlarm = new aws.cloudwatch.MetricAlarm(
      `alb-5xx-alarm-${args.environmentSuffix}`,
      {
        name: `alb-5xx-errors-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'ALB is returning too many 5XX errors',
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: args.albArn,
        },
        tags: {
          Name: `alb-5xx-alarm-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );
    this.alarms.push(alb5xxAlarm);

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
      snsTopicArn: this.snsTopic.arn,
    });
  }
}
