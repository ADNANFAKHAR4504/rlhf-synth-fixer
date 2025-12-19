import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  albArn: pulumi.Output<string>;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  databaseClusterId: pulumi.Output<string>;
  region: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      albArn,
      ecsClusterName,
      ecsServiceName,
      databaseClusterId,
      region,
      tags,
    } = args;

    // S3 Bucket for Log Export
    const logBucket = new aws.s3.Bucket(
      `payment-logs-${environmentSuffix}`,
      {
        bucket: `payment-logs-${environmentSuffix}`,
        acl: 'private',
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        forceDestroy: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // X-Ray Sampling Rule
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _samplingRule = new aws.xray.SamplingRule(
      `payment-xray-sampling-${environmentSuffix}`,
      {
        ruleName: `payment-sampling-${environmentSuffix}`,
        priority: 1000,
        version: 1,
        reservoirSize: 1,
        fixedRate: 0.1, // 10% sampling rate
        urlPath: '*',
        host: '*',
        httpMethod: '*',
        serviceName: '*',
        serviceType: '*',
        resourceArn: '*',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-xray-sampling-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `payment-dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-dashboard-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            region,
            albArn,
            ecsClusterName,
            ecsServiceName,
            databaseClusterId,
          ])
          .apply(([reg, _alb, _cluster, _service, _dbCluster]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        { stat: 'Average' },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg,
                    title: 'ALB Response Time',
                    yAxis: {
                      left: {
                        label: 'Seconds',
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'HTTPCode_Target_2XX_Count',
                        { stat: 'Sum' },
                      ],
                      ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
                      ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: reg,
                    title: 'HTTP Response Codes',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: reg,
                    title: 'Transaction Volume',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
                      ['.', 'MemoryUtilization', { stat: 'Average' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg,
                    title: 'ECS Resource Utilization',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                      ['.', 'ServerlessDatabaseCapacity', { stat: 'Average' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg,
                    title: 'Database Metrics',
                  },
                },
                {
                  type: 'log',
                  properties: {
                    query: `SOURCE '/ecs/payment-app-${environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 100`,
                    region: reg,
                    title: 'Recent Application Logs',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // SNS Topic for Alarms
    const alarmTopic = new aws.sns.Topic(
      `payment-alarms-${environmentSuffix}`,
      {
        name: `payment-alarms-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-alarms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Alarms
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _highResponseTimeAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-high-response-time-${environmentSuffix}`,
      {
        name: `payment-high-response-time-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1.0,
        alarmDescription: 'Alert when response time exceeds 1 second',
        alarmActions: [alarmTopic.arn],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-high-response-time-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _highErrorRateAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-high-error-rate-${environmentSuffix}`,
      {
        name: `payment-high-error-rate-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when 5XX errors exceed threshold',
        alarmActions: [alarmTopic.arn],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-high-error-rate-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Outputs
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;

    this.registerOutputs({
      dashboardUrl: this.dashboardUrl,
      logBucketName: logBucket.bucket,
    });
  }
}
