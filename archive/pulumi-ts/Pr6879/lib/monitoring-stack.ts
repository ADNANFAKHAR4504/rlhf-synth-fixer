/**
 * Monitoring Stack - CloudWatch Alarms
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  dmsReplicationTaskArn: pulumi.Output<string>;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  rdsClusterId: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class MonitoringStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:MonitoringStack', name, {}, opts);

    // Create SNS topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(
      `alarm-topic-${args.environmentSuffix}`,
      {
        name: `migration-alarms-${args.environmentSuffix}`,
        tags: {
          ...args.tags,
          Name: `alarm-topic-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for DMS replication lag
    new aws.cloudwatch.MetricAlarm(
      `dms-lag-alarm-${args.environmentSuffix}`,
      {
        name: `dms-replication-lag-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CDCLatencyTarget',
        namespace: 'AWS/DMS',
        period: 60,
        statistic: 'Average',
        threshold: 60,
        alarmDescription: 'DMS replication lag exceeds 60 seconds',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          ReplicationTaskIdentifier: args.dmsReplicationTaskArn.apply(arn => {
            const parts = arn.split(':');
            return parts[parts.length - 1];
          }),
        },
        tags: {
          ...args.tags,
          Name: `dms-lag-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for ECS task health
    new aws.cloudwatch.MetricAlarm(
      `ecs-task-alarm-${args.environmentSuffix}`,
      {
        name: `ecs-unhealthy-tasks-${args.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 3,
        alarmDescription: 'ECS healthy task count below 3',
        alarmActions: [alarmTopic.arn],
        treatMissingData: 'breaching',
        tags: {
          ...args.tags,
          Name: `ecs-task-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for RDS CPU utilization
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
        alarmDescription: 'RDS CPU utilization exceeds 80%',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: args.rdsClusterId,
        },
        tags: {
          ...args.tags,
          Name: `rds-cpu-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for RDS storage
    new aws.cloudwatch.MetricAlarm(
      `rds-storage-alarm-${args.environmentSuffix}`,
      {
        name: `rds-low-storage-${args.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeableMemory',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 1000000000, // 1 GB in bytes
        alarmDescription: 'RDS freeable memory below 1 GB',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: args.rdsClusterId,
        },
        tags: {
          ...args.tags,
          Name: `rds-storage-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for ECS service CPU utilization
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
        alarmDescription: 'ECS service CPU utilization exceeds 80%',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          ClusterName: args.ecsClusterName,
          ServiceName: args.ecsServiceName,
        },
        tags: {
          ...args.tags,
          Name: `ecs-cpu-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
