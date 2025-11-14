import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  region: string;
  availabilityZones: string[];
  targetGroupArn: pulumi.Input<string>;
  albArn: pulumi.Input<string>;
  autoScalingGroupName: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly unhealthyTargetAlarm: aws.cloudwatch.MetricAlarm;
  public readonly targetResponseTimeAlarm: aws.cloudwatch.MetricAlarm;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    // Create SNS Topic for notifications
    this.snsTopic = new aws.sns.Topic(
      `failover-alerts-${args.environmentSuffix}`,
      {
        displayName: `Failover Alerts - ${args.environmentSuffix}`,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `failover-alerts-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for unhealthy targets
    // Triggers when any AZ has less than 2 healthy targets
    this.unhealthyTargetAlarm = new aws.cloudwatch.MetricAlarm(
      `unhealthy-targets-${args.environmentSuffix}`,
      {
        name: `unhealthy-targets-${args.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: args.availabilityZones.length * 2, // Less than 2 per AZ
        treatMissingData: 'breaching',
        alarmDescription: 'Alert when any AZ has less than 2 healthy targets',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        dimensions: {
          TargetGroup: pulumi.output(args.targetGroupArn).apply(arn => {
            const parts = arn.split(':');
            return parts[parts.length - 1];
          }),
          LoadBalancer: pulumi.output(args.albArn).apply(arn => {
            const parts = arn.split(':loadbalancer/');
            return parts[parts.length - 1];
          }),
        },
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `unhealthy-targets-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for target response time
    this.targetResponseTimeAlarm = new aws.cloudwatch.MetricAlarm(
      `target-response-time-${args.environmentSuffix}`,
      {
        name: `target-response-time-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1.0, // 1 second
        treatMissingData: 'notBreaching',
        alarmDescription: 'Alert when target response time exceeds 1 second',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        dimensions: {
          TargetGroup: pulumi.output(args.targetGroupArn).apply(arn => {
            const parts = arn.split(':');
            return parts[parts.length - 1];
          }),
          LoadBalancer: pulumi.output(args.albArn).apply(arn => {
            const parts = arn.split(':loadbalancer/');
            return parts[parts.length - 1];
          }),
        },
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `target-response-time-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `failover-monitoring-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([args.targetGroupArn, args.albArn, args.autoScalingGroupName])
          .apply(([_tgArn, _lbArn, asgName]) => {
            return JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'HealthyHostCount',
                        { stat: 'Average' },
                      ],
                      ['.', 'UnHealthyHostCount', { stat: 'Average' }],
                    ],
                    period: 60,
                    stat: 'Average',
                    region: args.region,
                    title: 'Target Health',
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
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        { stat: 'Average' },
                      ],
                    ],
                    period: 60,
                    stat: 'Average',
                    region: args.region,
                    title: 'Target Response Time',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum' }],
                    ],
                    period: 60,
                    stat: 'Sum',
                    region: args.region,
                    title: 'Request Count',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/AutoScaling',
                        'GroupDesiredCapacity',
                        'AutoScalingGroupName',
                        asgName,
                      ],
                      ['.', 'GroupInServiceInstances', '.', '.'],
                    ],
                    period: 60,
                    stat: 'Average',
                    region: args.region,
                    title: 'Auto Scaling Group',
                  },
                },
              ],
            });
          }),
      },
      { parent: this }
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      unhealthyTargetAlarmName: this.unhealthyTargetAlarm.name,
      dashboardName: dashboard.dashboardName,
    });
  }
}
