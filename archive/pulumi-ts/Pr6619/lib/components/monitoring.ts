import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, TagsConfig } from '../types';

export interface MonitoringComponentArgs {
  environmentSuffix: string;
  envConfig: EnvironmentConfig;
  tags: TagsConfig;
  dbInstanceId: pulumi.Output<string>;
  lambdaFunctionName: pulumi.Output<string>;
  dynamoTableName: pulumi.Output<string>;
  apiId: pulumi.Output<string>;
}

export class MonitoringComponent extends pulumi.ComponentResource {
  public readonly rdsAlarm: aws.cloudwatch.MetricAlarm;
  public readonly lambdaErrorAlarm: aws.cloudwatch.MetricAlarm;
  public readonly lambdaThrottleAlarm: aws.cloudwatch.MetricAlarm;
  public readonly apiErrorAlarm: aws.cloudwatch.MetricAlarm;
  public readonly dashboard: aws.cloudwatch.Dashboard;

  constructor(
    name: string,
    args: MonitoringComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:MonitoringComponent', name, {}, opts);

    const {
      environmentSuffix,
      envConfig,
      tags,
      dbInstanceId,
      lambdaFunctionName,
      dynamoTableName,
      apiId,
    } = args;

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(
      `payment-alarms-${environmentSuffix}`,
      {
        name: `payment-alarms-${environmentSuffix}`,
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for RDS CPU usage with environment-specific thresholds
    this.rdsAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `payment-rds-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: envConfig.rdsAlarmThreshold,
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],
        alarmDescription: `RDS CPU utilization exceeds ${envConfig.rdsAlarmThreshold}% in ${envConfig.environment}`,
        dimensions: {
          DBInstanceIdentifier: dbInstanceId,
        },
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // Lambda error rate alarm
    this.lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-lambda-error-alarm-${environmentSuffix}`,
      {
        name: `payment-lambda-error-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],
        alarmDescription: `Lambda function error count exceeds threshold in ${envConfig.environment}`,
        dimensions: {
          FunctionName: lambdaFunctionName,
        },
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // Lambda throttle alarm
    this.lambdaThrottleAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-lambda-throttle-alarm-${environmentSuffix}`,
      {
        name: `payment-lambda-throttle-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Throttles',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],
        alarmDescription: `Lambda function throttle count exceeds threshold in ${envConfig.environment}`,
        dimensions: {
          FunctionName: lambdaFunctionName,
        },
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // API Gateway 5xx error alarm
    this.apiErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-api-5xx-alarm-${environmentSuffix}`,
      {
        name: `payment-api-5xx-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],
        alarmDescription: `API Gateway 5xx error count exceeds threshold in ${envConfig.environment}`,
        dimensions: {
          ApiId: apiId,
        },
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `payment-dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-dashboard-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([dbInstanceId, lambdaFunctionName, dynamoTableName, apiId])
          .apply(([_dbId, _funcName, _tableName, _apId]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/RDS',
                        'CPUUtilization',
                        { stat: 'Average', period: 300 },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'RDS CPU Utilization',
                    yAxis: {
                      left: {
                        min: 0,
                        max: 100,
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Invocations',
                        { stat: 'Sum', period: 300 },
                      ],
                      ['.', 'Errors', { stat: 'Sum', period: 300 }],
                      ['.', 'Duration', { stat: 'Average', period: 300 }],
                      ['.', 'Throttles', { stat: 'Sum', period: 300 }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'Lambda Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApiGateway', 'Count', { stat: 'Sum', period: 300 }],
                      ['.', '4XXError', { stat: 'Sum', period: 300 }],
                      ['.', '5XXError', { stat: 'Sum', period: 300 }],
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
                        'AWS/DynamoDB',
                        'ConsumedReadCapacityUnits',
                        { stat: 'Sum', period: 300 },
                      ],
                      [
                        '.',
                        'ConsumedWriteCapacityUnits',
                        { stat: 'Sum', period: 300 },
                      ],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: 'us-east-1',
                    title: 'DynamoDB Metrics',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.registerOutputs({
      alarmTopicArn: alarmTopic.arn,
      dashboardName: this.dashboard.dashboardName,
    });
  }
}
