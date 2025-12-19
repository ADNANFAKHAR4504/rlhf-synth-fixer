import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * Extract target group name from ARN
 * @param arn - Target group ARN
 * @returns Target group name or empty string
 */
export function extractTargetGroupName(arn: string): string {
  if (!arn) return '';
  const parts = arn.split(':').pop();
  return parts ? parts.split('/')[1] || '' : '';
}

/**
 * Extract load balancer name from ARN
 * @param arn - Load balancer ARN
 * @returns Load balancer name or empty string
 */
export function extractLoadBalancerName(arn: string): string {
  if (!arn) return '';
  const parts = arn.split(':').pop();
  return parts ? parts.split('/').slice(1, 4).join('/') : '';
}

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  autoScalingGroupName: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  constructor(name: string, args: CloudWatchStackArgs, opts?: ResourceOptions) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    // SNS Topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `${name}-alarms-${args.environmentSuffix}`,
      {
        displayName: `${name} CloudWatch Alarms`,
        tags: {
          Name: `${name}-alarms-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // High CPU Utilization Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _highCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-high-cpu-${args.environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors EC2 cpu utilization',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          AutoScalingGroupName: args.autoScalingGroupName,
        },
        treatMissingData: 'notBreaching',
        tags: args.tags,
      },
      { parent: this }
    );

    // Target Group Unhealthy Hosts Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unhealthyTargetsAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-unhealthy-targets-${args.environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when targets become unhealthy',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          TargetGroup: args.targetGroupArn.apply(extractTargetGroupName),
          LoadBalancer: args.albArn.apply(extractLoadBalancerName),
        },
        treatMissingData: 'notBreaching',
        tags: args.tags,
      },
      { parent: this }
    );

    // ALB Request Count Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _highRequestCountAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-high-requests-${args.environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'RequestCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Sum',
        threshold: 10000,
        alarmDescription: 'Alert on high request count',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          LoadBalancer: args.albArn.apply(extractLoadBalancerName),
        },
        treatMissingData: 'notBreaching',
        tags: args.tags,
      },
      { parent: this }
    );

    // ALB Target Response Time Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _highLatencyAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-high-latency-${args.environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 2,
        alarmDescription: 'Alert on high response time',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          LoadBalancer: args.albArn.apply(extractLoadBalancerName),
        },
        treatMissingData: 'notBreaching',
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _dashboard = new aws.cloudwatch.Dashboard(
      `${name}-dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `${name}-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([args.autoScalingGroupName, args.targetGroupArn, args.albArn])
          .apply(([asgName, tgArn, albArn]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  x: 0,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/EC2',
                        'CPUUtilization',
                        { stat: 'Average', label: 'Average CPU' },
                      ],
                      ['.', '.', { stat: 'Maximum', label: 'Max CPU' }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'us-east-2',
                    title: 'EC2 CPU Utilization',
                    period: 300,
                    dimensions: {
                      AutoScalingGroupName: asgName,
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 12,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        { stat: 'Average' },
                      ],
                      ['.', 'RequestCount', { stat: 'Sum', yAxis: 'right' }],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'us-east-2',
                    title: 'ALB Performance',
                    period: 300,
                    dimensions: {
                      LoadBalancer: albArn
                        ? albArn
                            .split(':')
                            .pop()
                            ?.split('/')
                            .slice(1, 4)
                            .join('/') || ''
                        : '',
                    },
                  },
                },
                {
                  type: 'metric',
                  x: 0,
                  y: 6,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'HealthyHostCount',
                        { stat: 'Average', label: 'Healthy' },
                      ],
                      [
                        '.',
                        'UnHealthyHostCount',
                        { stat: 'Average', label: 'Unhealthy' },
                      ],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: 'us-east-2',
                    title: 'Target Health',
                    period: 60,
                    dimensions: {
                      TargetGroup: tgArn
                        ? tgArn.split(':').pop()?.split('/')[1] || ''
                        : '',
                      LoadBalancer: albArn
                        ? albArn
                            .split(':')
                            .pop()
                            ?.split('/')
                            .slice(1, 4)
                            .join('/') || ''
                        : '',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
