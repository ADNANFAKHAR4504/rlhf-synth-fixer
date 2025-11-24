/**
 * monitoring.ts
 *
 * CloudWatch monitoring component with alarms and log groups
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringComponentArgs {
  environmentSuffix: string;
  environment: string;
  lambdaFunctionName: pulumi.Input<string>;
  databaseClusterName: pulumi.Input<string>;
  errorThreshold: number;
  latencyThreshold: number;
  logRetentionDays: number;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringComponent extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: MonitoringComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:Monitoring', name, args, opts);

    const {
      environmentSuffix,
      environment,
      lambdaFunctionName,
      databaseClusterName,
      errorThreshold,
      latencyThreshold,
      logRetentionDays,
      tags,
    } = args;

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `alarm-topic-${environmentSuffix}`,
      {
        name: `alarm-topic-${environment}-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // Lambda error alarm
    new aws.cloudwatch.MetricAlarm(
      `lambda-error-alarm-${environmentSuffix}`,
      {
        name: `lambda-errors-${environment}-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: errorThreshold,
        alarmDescription: `Lambda function errors exceeded ${errorThreshold} in ${environment}`,
        alarmActions: [alarmTopic.arn],
        dimensions: {
          FunctionName: lambdaFunctionName,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Lambda duration alarm
    new aws.cloudwatch.MetricAlarm(
      `lambda-duration-alarm-${environmentSuffix}`,
      {
        name: `lambda-duration-${environment}-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Average',
        threshold: latencyThreshold,
        alarmDescription: `Lambda function duration exceeded ${latencyThreshold}ms in ${environment}`,
        alarmActions: [alarmTopic.arn],
        dimensions: {
          FunctionName: lambdaFunctionName,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Database CPU alarm
    new aws.cloudwatch.MetricAlarm(
      `db-cpu-alarm-${environmentSuffix}`,
      {
        name: `db-cpu-${environment}-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: `Database CPU utilization exceeded 80% in ${environment}`,
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: databaseClusterName,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Database connection alarm
    new aws.cloudwatch.MetricAlarm(
      `db-connection-alarm-${environmentSuffix}`,
      {
        name: `db-connections-${environment}-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: environment === 'prod' ? 200 : 100,
        alarmDescription: `Database connections exceeded threshold in ${environment}`,
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: databaseClusterName,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Create application log group
    new aws.cloudwatch.LogGroup(
      `app-logs-${environmentSuffix}`,
      {
        name: `/aws/application/${environment}-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: tags,
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
