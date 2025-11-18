/**
 * monitoring.ts
 *
 * CloudWatch alarms for DMS, ECS, and RDS monitoring
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  dmsReplicationTaskArn: pulumi.Output<string>;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  rdsClusterId: pulumi.Output<string>;
  tags?: { [key: string]: string };
}

export class MonitoringStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    // SNS Topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `alarm-topic-${args.environmentSuffix}`,
      {
        name: `payment-alarms-${args.environmentSuffix}`,
        tags: {
          Name: `payment-alarm-topic-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // DMS Replication Lag Alarm
    const dmsTaskId = args.dmsReplicationTaskArn.apply(
      arn => arn.split(':').pop() || ''
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dmsLagAlarm = new aws.cloudwatch.MetricAlarm(
      `dms-lag-alarm-${args.environmentSuffix}`,
      {
        name: `payment-dms-lag-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CDCLatencySource',
        namespace: 'AWS/DMS',
        period: 300,
        statistic: 'Average',
        threshold: 60,
        alarmDescription: 'Alert when DMS replication lag exceeds 60 seconds',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          ReplicationTaskIdentifier: dmsTaskId,
        },
        tags: {
          Name: `payment-dms-lag-alarm-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // ECS Task Health Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ecsTaskAlarm = new aws.cloudwatch.MetricAlarm(
      `ecs-task-alarm-${args.environmentSuffix}`,
      {
        name: `payment-ecs-tasks-${args.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'RunningTaskCount',
        namespace: 'ECS/ContainerInsights',
        period: 300,
        statistic: 'Average',
        threshold: 3,
        alarmDescription: 'Alert when ECS running tasks fall below 3',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          ClusterName: args.ecsClusterName,
          ServiceName: args.ecsServiceName,
        },
        tags: {
          Name: `payment-ecs-task-alarm-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // RDS CPU Utilization Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `payment-rds-cpu-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when RDS CPU utilization exceeds 80%',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: args.rdsClusterId,
        },
        tags: {
          Name: `payment-rds-cpu-alarm-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // RDS Storage Alarm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rdsStorageAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-storage-alarm-${args.environmentSuffix}`,
      {
        name: `payment-rds-storage-${args.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 10737418240, // 10 GB in bytes
        alarmDescription: 'Alert when RDS free storage is less than 10 GB',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: args.rdsClusterId,
        },
        tags: {
          Name: `payment-rds-storage-alarm-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
