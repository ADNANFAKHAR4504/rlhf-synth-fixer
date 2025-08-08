/**
 * cloudWatchComponent.ts
 *
 * This module defines CloudWatch monitoring components including metric alarms
 * and EventBridge rules for auditing purposes.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

/**
 * Arguments for creating CloudWatch monitoring setup
 */
export interface CloudWatchMonitoringArgs {
  /**
   * The environment suffix for resource naming
   */
  environmentSuffix: string;

  /**
   * The name of the S3 bucket to monitor
   */
  bucketName: pulumi.Input<string>;

  /**
   * Optional tags to apply to CloudWatch resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * A component that creates CloudWatch monitoring infrastructure with alarms and logging
 */
export class CloudWatchMonitoring extends pulumi.ComponentResource {
  /**
   * The CloudWatch metric alarm
   */
  public readonly metricAlarm: aws.cloudwatch.MetricAlarm;

  /**
   * The CloudWatch log group for storing alarm events
   */
  public readonly logGroup: aws.cloudwatch.LogGroup;

  /**
   * The EventBridge rule for capturing alarm state changes
   */
  public readonly eventRule: aws.cloudwatch.EventRule;

  /**
   * The EventBridge target that sends events to CloudWatch Logs
   */
  public readonly eventTarget: aws.cloudwatch.EventTarget;

  constructor(
    name: string,
    args: CloudWatchMonitoringArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cloudwatch:CloudWatchMonitoring', name, {}, opts);

    const resourceOpts: pulumi.ResourceOptions = { parent: this };

    // Merge required tags with optional tags
    const allTags = pulumi.all([args.tags || {}]).apply(([userTags]) => ({
      ...userTags,
      Department: 'Security',
      Project: 'PulumiIaCProject',
    }));

    // Create CloudWatch Log Group for storing alarm events
    this.logGroup = new aws.cloudwatch.LogGroup(
      `s3-alarm-logs-${args.environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: allTags,
      },
      resourceOpts
    );

    // Create CloudWatch metric alarm for S3 bucket NumberOfObjects
    this.metricAlarm = new aws.cloudwatch.MetricAlarm(
      `s3-objects-alarm-${args.environmentSuffix}`,
      {
        alarmDescription: `Monitor number of objects in production S3 bucket for ${args.environmentSuffix} environment`,
        metricName: 'NumberOfObjects',
        namespace: 'AWS/S3',
        statistic: 'Average',
        period: 86400, // 24 hours in seconds
        evaluationPeriods: 1,
        threshold: 0,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        dimensions: {
          BucketName: args.bucketName,
          StorageType: 'AllStorageTypes',
        },
        tags: allTags,
      },
      resourceOpts
    );

    // Create EventBridge rule to capture alarm state changes
    this.eventRule = new aws.cloudwatch.EventRule(
      `s3-alarm-rule-${args.environmentSuffix}`,
      {
        description: `Capture alarm state changes for S3 monitoring in ${args.environmentSuffix} environment`,
        eventPattern: JSON.stringify({
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [this.metricAlarm.name],
            state: {
              value: ['ALARM', 'OK', 'INSUFFICIENT_DATA'],
            },
          },
        }),
        tags: allTags,
      },
      resourceOpts
    );

    // Create EventBridge target to send events to CloudWatch Logs
    this.eventTarget = new aws.cloudwatch.EventTarget(
      `s3-alarm-target-${args.environmentSuffix}`,
      {
        rule: this.eventRule.name,
        targetId: 'CloudWatchLogsTarget',
        arn: this.logGroup.arn,
      },
      resourceOpts
    );

    // Register outputs
    this.registerOutputs({
      metricAlarmArn: this.metricAlarm.arn,
      logGroupArn: this.logGroup.arn,
      eventRuleArn: this.eventRule.arn,
    });
  }
}
