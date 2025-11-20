import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringProps {
  environment: string;
  environmentSuffix: string;
  clusterIdentifier: pulumi.Input<string>;
  rdsAlarmThreshold: number;
}

export class MonitoringComponent extends pulumi.ComponentResource {
  public cpuAlarm: aws.cloudwatch.MetricAlarm;

  constructor(
    name: string,
    props: MonitoringProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:MonitoringComponent', name, {}, opts);

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `alarm-topic-${props.environment}-${props.environmentSuffix}`,
      {
        name: `payments-alarms-${props.environment}-${props.environmentSuffix}`,
        tags: {
          Name: `payments-alarms-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // RDS CPU alarm
    this.cpuAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${props.environment}-${props.environmentSuffix}`,
      {
        name: `payments-rds-cpu-${props.environment}-${props.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: props.rdsAlarmThreshold,
        alarmDescription: `RDS CPU usage above ${props.rdsAlarmThreshold}% for ${props.environment}`,
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: props.clusterIdentifier,
        },
        tags: {
          Name: `rds-cpu-alarm-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      alarmTopicArn: alarmTopic.arn,
      cpuAlarmArn: this.cpuAlarm.arn,
    });
  }
}
