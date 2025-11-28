/**
 * monitoring-stack.ts
 *
 * Defines CloudWatch alarms and SNS topics for monitoring and alerting.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface MonitoringStackArgs {
  region: string;
  lambdaFunctionName: pulumi.Input<string>;
  auroraClusterId: pulumi.Input<string>;
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly lambdaErrorAlarm: aws.cloudwatch.MetricAlarm;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const region = args.region;
    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create SNS topic for alerts
    this.snsTopic = new aws.sns.Topic(
      `${name}-alerts`,
      {
        name: `${name}-alerts-${envSuffix}-e7`,
        displayName: 'DR Infrastructure Alerts',
        tags: {
          ...tags,
          Name: `${name}-sns-topic-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    // Create email subscription (placeholder email)
    new aws.sns.TopicSubscription(
      `${name}-email-subscription`,
      {
        topic: this.snsTopic.arn,
        protocol: 'email',
        endpoint: 'alerts@example.com',
      },
      { parent: this }
    );

    // Lambda error alarm
    this.lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-lambda-errors`,
      {
        name: `${name}-lambda-errors-${envSuffix}-e7`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when Lambda function errors exceed threshold',
        dimensions: {
          FunctionName: args.lambdaFunctionName,
        },
        alarmActions: [this.snsTopic.arn],
        tags: {
          ...tags,
          Region: region,
        },
      },
      { parent: this }
    );

    // Lambda duration alarm
    new aws.cloudwatch.MetricAlarm(
      `${name}-lambda-duration`,
      {
        name: `${name}-lambda-duration-${envSuffix}-e7`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Average',
        threshold: 25000, // 25 seconds
        alarmDescription: 'Alert when Lambda execution time is high',
        dimensions: {
          FunctionName: args.lambdaFunctionName,
        },
        alarmActions: [this.snsTopic.arn],
        tags: {
          ...tags,
          Region: region,
        },
      },
      { parent: this }
    );

    // Aurora CPU alarm
    new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-cpu`,
      {
        name: `${name}-aurora-cpu-${envSuffix}-e7`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when Aurora CPU is high',
        dimensions: {
          DBClusterIdentifier: args.auroraClusterId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: {
          ...tags,
          Region: region,
        },
      },
      { parent: this }
    );

    // Aurora database connections alarm
    new aws.cloudwatch.MetricAlarm(
      `${name}-aurora-connections`,
      {
        name: `${name}-aurora-connections-${envSuffix}-e7`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 100,
        alarmDescription: 'Alert when Aurora connections are high',
        dimensions: {
          DBClusterIdentifier: args.auroraClusterId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: {
          ...tags,
          Region: region,
        },
      },
      { parent: this }
    );

    this.snsTopicArn = this.snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      lambdaErrorAlarmName: this.lambdaErrorAlarm.name,
    });
  }
}
