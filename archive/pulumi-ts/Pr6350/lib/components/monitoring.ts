/**
 * MonitoringStack - CloudWatch logs, dashboard, alarms, SNS
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  validatorLambdaName: pulumi.Output<string>;
  processorLambdaName: pulumi.Output<string>;
  notifierLambdaName: pulumi.Output<string>;
  tableName: pulumi.Output<string>;
  apiGatewayId: pulumi.Output<string>;
  apiGatewayStageName: pulumi.Output<string>;
  flowLogGroupName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      validatorLambdaName,
      processorLambdaName,
      notifierLambdaName,
      tableName,
      apiGatewayId,
      apiGatewayStageName,
      tags,
    } = args;

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(
      `payment-notifications-${environmentSuffix}`,
      {
        name: `payment-notifications-${environmentSuffix}`,
        displayName: 'Payment Processing Notifications',
        tags,
      },
      { parent: this }
    );

    this.snsTopicArn = snsTopic.arn;

    // Email subscription (configure email address as needed)
    new aws.sns.TopicSubscription(
      `payment-email-subscription-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: 'payments-team@example.com', // Replace with actual email
      },
      { parent: this }
    );

    // CloudWatch Log Groups for Lambda functions
    new aws.cloudwatch.LogGroup(
      `validator-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${validatorLambdaName}`,
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `processor-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${processorLambdaName}`,
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `notifier-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${notifierLambdaName}`,
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    // CloudWatch Alarms for Lambda errors
    new aws.cloudwatch.MetricAlarm(
      `validator-alarm-${environmentSuffix}`,
      {
        name: `payment-validator-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Average',
        threshold: 0.01, // 1% error rate
        alarmDescription: 'Alert when validator Lambda error rate exceeds 1%',
        alarmActions: [snsTopic.arn],
        dimensions: {
          FunctionName: validatorLambdaName,
        },
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `processor-alarm-${environmentSuffix}`,
      {
        name: `payment-processor-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Average',
        threshold: 0.01, // 1% error rate
        alarmDescription: 'Alert when processor Lambda error rate exceeds 1%',
        alarmActions: [snsTopic.arn],
        dimensions: {
          FunctionName: processorLambdaName,
        },
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `notifier-alarm-${environmentSuffix}`,
      {
        name: `payment-notifier-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Average',
        threshold: 0.01, // 1% error rate
        alarmDescription: 'Alert when notifier Lambda error rate exceeds 1%',
        alarmActions: [snsTopic.arn],
        dimensions: {
          FunctionName: notifierLambdaName,
        },
        tags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `payment-dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-processing-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            validatorLambdaName,
            processorLambdaName,
            notifierLambdaName,
            tableName,
            apiGatewayId,
            apiGatewayStageName,
          ])
          .apply(([validator, processor, notifier, table, apiId, stage]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    title: 'Lambda Invocations',
                    region: 'eu-south-2',
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Invocations',
                        'FunctionName',
                        validator,
                        { stat: 'Sum', label: 'Validator' },
                      ],
                      [
                        'AWS/Lambda',
                        'Invocations',
                        'FunctionName',
                        processor,
                        { stat: 'Sum', label: 'Processor' },
                      ],
                      [
                        'AWS/Lambda',
                        'Invocations',
                        'FunctionName',
                        notifier,
                        { stat: 'Sum', label: 'Notifier' },
                      ],
                    ],
                    period: 300,
                    yAxis: {
                      left: { min: 0 },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    title: 'Lambda Error Rates',
                    region: 'eu-south-2',
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Errors',
                        'FunctionName',
                        validator,
                        { stat: 'Average', label: 'Validator' },
                      ],
                      [
                        'AWS/Lambda',
                        'Errors',
                        'FunctionName',
                        processor,
                        { stat: 'Average', label: 'Processor' },
                      ],
                      [
                        'AWS/Lambda',
                        'Errors',
                        'FunctionName',
                        notifier,
                        { stat: 'Average', label: 'Notifier' },
                      ],
                    ],
                    period: 300,
                    yAxis: {
                      left: { min: 0, max: 1 },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    title: 'DynamoDB Read/Write Capacity',
                    region: 'eu-south-2',
                    metrics: [
                      [
                        'AWS/DynamoDB',
                        'ConsumedReadCapacityUnits',
                        'TableName',
                        table,
                        { stat: 'Sum', label: 'Read' },
                      ],
                      [
                        'AWS/DynamoDB',
                        'ConsumedWriteCapacityUnits',
                        'TableName',
                        table,
                        { stat: 'Sum', label: 'Write' },
                      ],
                    ],
                    period: 300,
                    yAxis: {
                      left: { min: 0 },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    title: 'API Gateway Requests',
                    region: 'eu-south-2',
                    metrics: [
                      [
                        'AWS/ApiGateway',
                        'Count',
                        'ApiName',
                        apiId,
                        'Stage',
                        stage,
                        { stat: 'Sum', label: 'Requests' },
                      ],
                      [
                        'AWS/ApiGateway',
                        '4XXError',
                        'ApiName',
                        apiId,
                        'Stage',
                        stage,
                        { stat: 'Sum', label: '4XX Errors' },
                      ],
                      [
                        'AWS/ApiGateway',
                        '5XXError',
                        'ApiName',
                        apiId,
                        'Stage',
                        stage,
                        { stat: 'Sum', label: '5XX Errors' },
                      ],
                    ],
                    period: 300,
                    yAxis: {
                      left: { min: 0 },
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=eu-south-2#dashboards:name=${dashboard.dashboardName}`;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
