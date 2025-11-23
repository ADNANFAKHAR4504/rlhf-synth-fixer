import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  rdsInstanceId: pulumi.Output<string>;
  backupBucketName: pulumi.Output<string>;
  lambdaFunctionName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    // Create SNS topic
    const snsTopic = new aws.sns.Topic(
      `backup-alerts-${args.environmentSuffix}`,
      {
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch alarm for backup failures
    new aws.cloudwatch.MetricAlarm(
      `rds-backup-failed-${args.environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'BackupRetentionPeriod',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when RDS backup fails',
        alarmActions: [snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsInstanceId,
        },
      },
      { parent: this }
    );

    // CloudWatch alarm for Lambda errors
    new aws.cloudwatch.MetricAlarm(
      `lambda-errors-${args.environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert when backup Lambda fails',
        alarmActions: [snsTopic.arn],
        dimensions: {
          FunctionName: args.lambdaFunctionName,
        },
      },
      { parent: this }
    );

    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
