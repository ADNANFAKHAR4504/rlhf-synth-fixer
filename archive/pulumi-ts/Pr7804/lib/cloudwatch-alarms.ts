import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

interface AlarmArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  snsTopicArns: pulumi.Output<{
    critical: string;
    warning: string;
    info: string;
  }>;
}

export function createCloudWatchAlarms(
  args: AlarmArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  // Alarm for database connections
  const dbConnectionAlarm = new aws.cloudwatch.MetricAlarm(
    `infra-db-conn-alarm-e4-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database connections exceed 80',
      alarmActions: [args.snsTopicArns.apply(arns => arns.critical)],
      tags: args.tags,
    },
    opts
  );

  // Alarm for API Gateway latency
  const apiLatencyAlarm = new aws.cloudwatch.MetricAlarm(
    `infra-api-latency-alarm-e4-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Latency',
      namespace: 'AWS/ApiGateway',
      period: 300,
      statistic: 'Average',
      threshold: 1000,
      alarmDescription: 'Alert when API Gateway latency exceeds 1000ms',
      alarmActions: [args.snsTopicArns.apply(arns => arns.critical)],
      tags: args.tags,
    },
    opts
  );

  // Alarm for Lambda error rates
  const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
    `infra-lambda-err-alarm-e4-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when Lambda errors exceed 10 in 5 minutes',
      alarmActions: [args.snsTopicArns.apply(arns => arns.critical)],
      tags: args.tags,
    },
    opts
  );

  // Warning alarm for EC2 CPU utilization
  const ec2CpuWarningAlarm = new aws.cloudwatch.MetricAlarm(
    `infra-ec2-cpu-warn-alarm-e4-${args.environmentSuffix}`,
    {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 3,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      alarmDescription: 'Warning when EC2 CPU exceeds 75%',
      alarmActions: [args.snsTopicArns.apply(arns => arns.warning)],
      tags: args.tags,
    },
    opts
  );

  return {
    alarms: [
      dbConnectionAlarm,
      apiLatencyAlarm,
      lambdaErrorAlarm,
      ec2CpuWarningAlarm,
    ],
  };
}
