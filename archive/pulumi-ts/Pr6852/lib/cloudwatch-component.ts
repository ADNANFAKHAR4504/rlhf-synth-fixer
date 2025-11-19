import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface CloudWatchComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
  lambdaFunctionName: pulumi.Input<string>;
  apiGatewayName: pulumi.Input<string>;
  dynamoTableName: pulumi.Input<string>;
  rdsInstanceId: pulumi.Input<string>;
}

/**
 * CloudWatch Component for monitoring and alarms
 */
export class CloudWatchComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly lambdaErrorAlarm: aws.cloudwatch.MetricAlarm;
  public readonly apiGateway5xxAlarm: aws.cloudwatch.MetricAlarm;

  constructor(
    name: string,
    args: CloudWatchComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:monitoring:CloudWatchComponent', name, {}, opts);

    const {
      config,
      tags,
      environmentSuffix,
      lambdaFunctionName,
      apiGatewayName,
      dynamoTableName,
      rdsInstanceId,
    } = args;

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-platform-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            lambdaFunctionName,
            apiGatewayName,
            dynamoTableName,
            rdsInstanceId,
          ])
          .apply(([_lambdaName, _apiName, _tableName, _dbId]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Invocations',
                        { stat: 'Sum', label: 'Lambda Invocations' },
                      ],
                      ['.', 'Errors', { stat: 'Sum', label: 'Lambda Errors' }],
                      [
                        '.',
                        'Duration',
                        { stat: 'Average', label: 'Lambda Duration' },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region || 'us-east-1',
                    title: `Lambda Metrics - ${config.environment}`,
                    yAxis: {
                      left: { min: 0 },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApiGateway',
                        'Count',
                        { stat: 'Sum', label: 'API Requests' },
                      ],
                      ['.', '4XXError', { stat: 'Sum', label: '4XX Errors' }],
                      ['.', '5XXError', { stat: 'Sum', label: '5XX Errors' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region || 'us-east-1',
                    title: `API Gateway Metrics - ${config.environment}`,
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/DynamoDB',
                        'ConsumedReadCapacityUnits',
                        { stat: 'Sum' },
                      ],
                      ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region || 'us-east-1',
                    title: `DynamoDB Metrics - ${config.environment}`,
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/RDS', 'CPUUtilization', { stat: 'Average' }],
                      ['.', 'DatabaseConnections', { stat: 'Average' }],
                      ['.', 'FreeableMemory', { stat: 'Average' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region || 'us-east-1',
                    title: `RDS Metrics - ${config.environment}`,
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create Lambda error alarm
    this.lambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      `lambda-error-alarm-${environmentSuffix}`,
      {
        name: `lambda-error-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: `Lambda error rate alarm for ${config.environment}`,
        dimensions: {
          FunctionName: lambdaFunctionName,
        },
        tags: {
          ...tags,
          Name: `lambda-error-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create API Gateway 5XX alarm with environment-adjusted threshold
    this.apiGateway5xxAlarm = new aws.cloudwatch.MetricAlarm(
      `api-5xx-alarm-${environmentSuffix}`,
      {
        name: `api-5xx-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: config.cloudWatchThreshold,
        alarmDescription: `API Gateway 5XX error alarm for ${config.environment} (threshold: ${config.cloudWatchThreshold})`,
        dimensions: {
          ApiName: apiGatewayName,
        },
        tags: {
          ...tags,
          Name: `api-5xx-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
    });
  }
}
