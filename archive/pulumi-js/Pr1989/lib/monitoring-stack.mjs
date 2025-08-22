/**
 * monitoring-stack.mjs
 *
 * Creates CloudWatch alarms and monitoring for the web application
 * with 2025 enhanced monitoring capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class MonitoringStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'monitoring' };

    // SNS topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(
      `webapp-alarms-${environmentSuffix}`,
      {
        name: `webapp-alarms-${environmentSuffix}`,
        tags: { ...tags, Name: `webapp-alarms-${environmentSuffix}` },
      },
      { parent: this }
    );

    // CloudWatch alarm for high CPU utilization on Auto Scaling Group
    new aws.cloudwatch.MetricAlarm(
      `webapp-high-cpu-alarm-${environmentSuffix}`,
      {
        name: `webapp-high-cpu-alarm-${environmentSuffix}`,
        description: `High CPU utilization alarm for webapp Auto Scaling Group in ${environmentSuffix}`,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        statistic: 'Average',
        period: 300, // 5 minutes
        evaluationPeriods: 2,
        threshold: 80,
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          AutoScalingGroupName: args.autoScalingGroup.name,
        },
        alarmActions: [alarmTopic.arn],
        okActions: [alarmTopic.arn],
        treatMissingData: 'notBreaching',
        tags: { ...tags, Name: `webapp-high-cpu-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    // CloudWatch alarm for individual instance high CPU (2025 feature)
    new aws.cloudwatch.MetricAlarm(
      `webapp-instance-cpu-alarm-${environmentSuffix}`,
      {
        name: `webapp-instance-cpu-alarm-${environmentSuffix}`,
        description: `Individual instance high CPU utilization alarm for webapp in ${environmentSuffix}`,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 80,
        comparisonOperator: 'GreaterThanThreshold',
        // This will alarm if ANY instance in the ASG exceeds 80% CPU
        dimensions: {
          AutoScalingGroupName: args.autoScalingGroup.name,
        },
        alarmActions: [alarmTopic.arn],
        okActions: [alarmTopic.arn],
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `webapp-instance-cpu-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for ALB target health
    new aws.cloudwatch.MetricAlarm(
      `webapp-unhealthy-targets-alarm-${environmentSuffix}`,
      {
        name: `webapp-unhealthy-targets-alarm-${environmentSuffix}`,
        description: `Unhealthy targets alarm for webapp ALB in ${environmentSuffix}`,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        alarmActions: [alarmTopic.arn],
        okActions: [alarmTopic.arn],
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `webapp-unhealthy-targets-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for ALB response time (2025 performance monitoring)
    new aws.cloudwatch.MetricAlarm(
      `webapp-high-response-time-alarm-${environmentSuffix}`,
      {
        name: `webapp-high-response-time-alarm-${environmentSuffix}`,
        description: `High response time alarm for webapp ALB in ${environmentSuffix}`,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 1.0, // 1 second
        comparisonOperator: 'GreaterThanThreshold',
        alarmActions: [alarmTopic.arn],
        okActions: [alarmTopic.arn],
        treatMissingData: 'notBreaching',
        tags: {
          ...tags,
          Name: `webapp-high-response-time-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Dashboard (2025 enhanced monitoring)
    new aws.cloudwatch.Dashboard(
      `webapp-dashboard-${environmentSuffix}`,
      {
        dashboardName: `webapp-dashboard-${environmentSuffix}`,
        dashboardBody: args.autoScalingGroup.name.apply(asgName =>
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
                      'AutoScalingGroupName',
                      asgName,
                    ],
                  ],
                  period: 300,
                  stat: 'Average',
                  region: 'us-east-1',
                  title: 'EC2 CPU Utilization',
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
                x: 0,
                y: 6,
                width: 12,
                height: 6,
                properties: {
                  metrics: [
                    ['AWS/ApplicationELB', 'RequestCount'],
                    ['.', 'TargetResponseTime'],
                    ['.', 'HTTPCode_Target_2XX_Count'],
                    ['.', 'HTTPCode_Target_4XX_Count'],
                    ['.', 'HTTPCode_Target_5XX_Count'],
                  ],
                  period: 300,
                  stat: 'Sum',
                  region: 'us-east-1',
                  title: 'ALB Metrics',
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    this.registerOutputs({
      alarmTopicArn: alarmTopic.arn,
      dashboardUrl: pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=webapp-dashboard-${environmentSuffix}`,
    });
  }
}

