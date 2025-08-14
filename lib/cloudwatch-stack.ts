import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  lambdaFunctionName: pulumi.Output<string>;
  apiGatewayName: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly logGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    // Create CloudWatch Log Group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(
      `tap-lambda-logs-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${args.lambdaFunctionName}`,
        retentionInDays: 14,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `tap-alarms-${args.environmentSuffix}`,
      {
        name: `tap-serverless-alarms-${args.environmentSuffix}`,
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch alarm for Lambda errors
    new aws.cloudwatch.MetricAlarm(
      `tap-lambda-error-alarm-${args.environmentSuffix}`,
      {
        name: `tap-lambda-errors-${args.environmentSuffix}`,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        dimensions: {
          FunctionName: args.lambdaFunctionName,
        },
        alarmActions: [alarmTopic.arn],
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch alarm for Lambda duration
    new aws.cloudwatch.MetricAlarm(
      `tap-lambda-duration-alarm-${args.environmentSuffix}`,
      {
        name: `tap-lambda-duration-${args.environmentSuffix}`,
        metricName: 'Duration',
        namespace: 'AWS/Lambda',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 25000, // 25 seconds
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          FunctionName: args.lambdaFunctionName,
        },
        alarmActions: [alarmTopic.arn],
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch alarm for API Gateway 4XX errors
    new aws.cloudwatch.MetricAlarm(
      `tap-api-4xx-alarm-${args.environmentSuffix}`,
      {
        name: `tap-api-4xx-errors-${args.environmentSuffix}`,
        metricName: '4XXError',
        namespace: 'AWS/ApiGateway',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          ApiName: args.apiGatewayName,
        },
        alarmActions: [alarmTopic.arn],
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch alarm for API Gateway 5XX errors
    new aws.cloudwatch.MetricAlarm(
      `tap-api-5xx-alarm-${args.environmentSuffix}`,
      {
        name: `tap-api-5xx-errors-${args.environmentSuffix}`,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 1,
        threshold: 1,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        dimensions: {
          ApiName: args.apiGatewayName,
        },
        alarmActions: [alarmTopic.arn],
        tags: args.tags,
      },
      { parent: this }
    );

    this.logGroupArn = logGroup.arn;

    this.registerOutputs({
      logGroupArn: this.logGroupArn,
    });
  }
}
