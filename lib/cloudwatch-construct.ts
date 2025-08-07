import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export interface CloudwatchConstructProps {
  environment: string;
  instanceId: string;
  commonTags: { [key: string]: string };
}

export class CloudwatchConstruct extends Construct {
  public readonly dashboardUrl: string;
  public readonly snsTopicArn: string;

  constructor(scope: Construct, id: string, config: CloudwatchConstructProps) {
    super(scope, id);

    const topic = new aws.snsTopic.SnsTopic(this, 'AlertsTopic', {
      name: `${config.environment}-infrastructure-alerts`,
      tags: config.commonTags,
    });

    new aws.cloudwatchDashboard.CloudwatchDashboard(this, 'Dashboard', {
      dashboardName: `${config.environment}-infrastructure-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['AWS/EC2', 'CPUUtilization', 'InstanceId', config.instanceId],
                ['.', 'NetworkIn', '.', '.'],
                ['.', 'NetworkOut', '.', '.'],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-west-2',
              title: 'EC2 Instance Metrics',
              period: 300,
            },
          },
        ],
      }),
    });

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'HighCpuAlarm', {
      alarmName: `${config.environment}-high-cpu-utilization`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: config.environment === 'production' ? 80 : 90,
      alarmDescription: 'This metric monitors EC2 CPU utilization',
      alarmActions: [topic.arn],
      dimensions: {
        InstanceId: config.instanceId,
      },
      tags: config.commonTags,
    });

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'InstanceHealthAlarm',
      {
        alarmName: `${config.environment}-instance-health-check`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'StatusCheckFailed',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription: 'This metric monitors EC2 health check',
        alarmActions: [topic.arn],
        dimensions: {
          InstanceId: config.instanceId,
        },
        tags: config.commonTags,
      }
    );

    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'AppLogGroup', {
      name: `/aws/application/${config.environment}`,
      retentionInDays: config.environment === 'production' ? 365 : 30,
      tags: config.commonTags,
    });

    this.dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=${config.environment}-infrastructure-dashboard`;
    this.snsTopicArn = topic.arn;
  }
}
