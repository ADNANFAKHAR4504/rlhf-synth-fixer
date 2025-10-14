import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly logGroupArns: pulumi.Output<string[]>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly lambdaErrorAlarmArn: pulumi.Output<string>;
  public readonly apiGatewayThrottleAlarmArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create CloudWatch log groups
    const edgeLambdaLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/license-verify-edge-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const licenseApiLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/license-api-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const usageTrackingLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/usage-tracking-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const apiGatewayLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/apigateway/software-dist-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    // Create CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `software-dist-dashboard-${environmentSuffix}`,
      {
        dashboardName: `software-distribution-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/Lambda',
                    'Invocations',
                    { stat: 'Sum', label: 'License Verifications' },
                  ],
                  ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
                  ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Lambda Performance',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/ApiGateway',
                    '4XXError',
                    { stat: 'Sum', label: '4XX Errors' },
                  ],
                  ['.', '5XXError', { stat: 'Sum', label: '5XX Errors' }],
                  ['.', 'Count', { stat: 'Sum', label: 'API Calls' }],
                ],
                period: 300,
                stat: 'Sum',
                region: 'us-east-1',
                title: 'API Gateway Metrics',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/CloudFront',
                    'Requests',
                    { stat: 'Sum', label: 'Total Requests' },
                  ],
                  [
                    '.',
                    'BytesDownloaded',
                    { stat: 'Sum', label: 'Bytes Downloaded' },
                  ],
                  [
                    '.',
                    '4xxErrorRate',
                    { stat: 'Average', label: '4xx Error Rate' },
                  ],
                  [
                    '.',
                    '5xxErrorRate',
                    { stat: 'Average', label: '5xx Error Rate' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'CloudFront Distribution',
              },
            },
            {
              type: 'log',
              properties: {
                query: `SOURCE '/aws/lambda/license-verify-edge-${environmentSuffix}'
                | fields @timestamp, @message
                | filter @message like /ERROR/
                | sort @timestamp desc
                | limit 20`,
                region: 'us-east-1',
                title: 'Recent Errors',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create metric alarms
    new aws.cloudwatch.MetricAlarm(
      `high-error-rate-${environmentSuffix}`,
      {
        alarmDescription: 'Alert when Lambda error rate is high',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `api-throttling-${environmentSuffix}`,
      {
        alarmDescription: 'Alert when API is being throttled',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: '4XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 100,
        treatMissingData: 'notBreaching',
        tags,
      },
      { parent: this }
    );

    // Create CloudWatch Alarms
    const lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `lambda-error-alarm-${environmentSuffix}`,
      {
        name: `lambda-high-errors-${environmentSuffix}`,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        treatMissingData: 'notBreaching',
        tags,
      },
      { parent: this }
    );

    this.lambdaErrorAlarmArn = lambdaErrorAlarm.arn;

    const apiGatewayThrottleAlarm = new aws.cloudwatch.MetricAlarm(
      `api-throttle-alarm-${environmentSuffix}`,
      {
        name: `api-high-throttles-${environmentSuffix}`,
        metricName: 'ThrottledRequests',
        namespace: 'AWS/ApiGateway',
        statistic: 'Sum',
        period: 300,
        evaluationPeriods: 2,
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        treatMissingData: 'notBreaching',
        tags,
      },
      { parent: this }
    );

    this.apiGatewayThrottleAlarmArn = apiGatewayThrottleAlarm.arn;

    this.logGroupArns = pulumi.all([
      edgeLambdaLogGroup.arn,
      licenseApiLogGroup.arn,
      usageTrackingLogGroup.arn,
      apiGatewayLogGroup.arn,
    ]);

    this.dashboardName = dashboard.dashboardName;

    this.registerOutputs({
      logGroupArns: this.logGroupArns,
      dashboardName: this.dashboardName,
    });
  }
}
