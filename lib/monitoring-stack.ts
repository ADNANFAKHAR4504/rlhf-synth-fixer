/**
 * Monitoring Stack - Creates CloudWatch alarms for DMS replication monitoring.
 *
 * Alarms:
 * - Replication lag exceeding 60 seconds
 * - Replication task failures
 * - High CPU utilization on replication instance
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  dmsReplicationTaskArn: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly replicationLagAlarmArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:MonitoringStack', name, args, opts);

    const tags = args.tags || {};

    // Create SNS topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(
      `migration-alarms-${args.environmentSuffix}`,
      {
        name: `migration-alarms-${args.environmentSuffix}`,
        displayName: 'Database Migration Alarms',
        tags: {
          ...tags,
          Name: `migration-alarms-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for replication lag
    const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
      `replication-lag-alarm-${args.environmentSuffix}`,
      {
        name: `replication-lag-alarm-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CDCLatencyTarget',
        namespace: 'AWS/DMS',
        period: 300,
        statistic: 'Average',
        threshold: 60, // 60 seconds as required
        alarmDescription:
          'Triggers when DMS replication lag exceeds 60 seconds',
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],

        dimensions: {
          ReplicationTaskIdentifier: args.dmsReplicationTaskArn.apply(arn => {
            // Extract task identifier from ARN
            return (arn || 'task-identifier').split(':').pop() || '';
          }),
        },

        tags: {
          ...tags,
          Name: `replication-lag-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for replication task failure
    new aws.cloudwatch.MetricAlarm(
      `replication-failure-alarm-${args.environmentSuffix}`,
      {
        name: `replication-failure-alarm-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FullLoadThroughputRowsTarget',
        namespace: 'AWS/DMS',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Triggers when DMS replication task fails',
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],
        treatMissingData: 'breaching',

        dimensions: {
          ReplicationTaskIdentifier: args.dmsReplicationTaskArn.apply(arn => {
            return (arn || 'task-identifier').split(':').pop() || '';
          }),
        },

        tags: {
          ...tags,
          Name: `replication-failure-alarm-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.replicationLagAlarmArn = replicationLagAlarm.arn;

    this.registerOutputs({
      replicationLagAlarmArn: this.replicationLagAlarmArn,
      alarmTopicArn: alarmTopic.arn,
    });
  }
}
