/**
 * CloudWatch alarms and dashboard
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface CloudWatchMonitoringArgs {
  lambdaFunctionNames: pulumi.Input<string>[];
  dynamoTableNames: pulumi.Input<string>[];
  apiGatewayName: pulumi.Input<string>;
  apiGatewayStageName: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchMonitoring extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;

  constructor(
    name: string,
    args: CloudWatchMonitoringArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:CloudWatchMonitoring', name, {}, opts);

    // Lambda error alarms
    args.lambdaFunctionNames.forEach((functionName, index) => {
      new aws.cloudwatch.MetricAlarm(
        `lambda-error-alarm-${index}-${args.environmentSuffix}`,
        {
          name: pulumi.interpolate`lambda-error-alarm-${functionName}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'Errors',
          namespace: 'AWS/Lambda',
          period: 300,
          statistic: 'Average',
          threshold: 0.01, // 1%
          treatMissingData: 'notBreaching',
          dimensions: {
            FunctionName: functionName,
          },
          alarmDescription: 'Lambda error rate exceeds 1%',
          tags: args.tags,
        },
        { parent: this }
      );
    });

    // DynamoDB throttling alarms
    args.dynamoTableNames.forEach((tableName, index) => {
      new aws.cloudwatch.MetricAlarm(
        `dynamo-throttle-alarm-${index}-${args.environmentSuffix}`,
        {
          name: pulumi.interpolate`dynamo-throttle-alarm-${tableName}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'UserErrors',
          namespace: 'AWS/DynamoDB',
          period: 300,
          statistic: 'Sum',
          threshold: 10,
          treatMissingData: 'notBreaching',
          dimensions: {
            TableName: tableName,
          },
          alarmDescription: 'DynamoDB throttling detected',
          tags: args.tags,
        },
        { parent: this }
      );
    });

    // API Gateway 4xx alarm
    new aws.cloudwatch.MetricAlarm(
      `api-4xx-alarm-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`api-4xx-alarm-${args.apiGatewayName}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '4XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 100,
        treatMissingData: 'notBreaching',
        dimensions: {
          ApiName: args.apiGatewayName,
          Stage: args.apiGatewayStageName,
        },
        alarmDescription: 'API Gateway 4xx error rate high',
        tags: args.tags,
      },
      { parent: this }
    );

    // API Gateway 5xx alarm
    new aws.cloudwatch.MetricAlarm(
      `api-5xx-alarm-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`api-5xx-alarm-${args.apiGatewayName}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        dimensions: {
          ApiName: args.apiGatewayName,
          Stage: args.apiGatewayStageName,
        },
        alarmDescription: 'API Gateway 5xx error rate high',
        tags: args.tags,
      },
      { parent: this }
    );

    // Create dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `payment-dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `payment-dashboard-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            args.lambdaFunctionNames,
            args.dynamoTableNames,
            args.apiGatewayName,
            args.apiGatewayStageName,
          ])
          .apply(([lambdaNames, dynamoNames, apiName, stageName]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: lambdaNames.map((name: string) => [
                      'AWS/Lambda',
                      'Invocations',
                      'FunctionName',
                      name,
                    ]),
                    period: 300,
                    stat: 'Sum',
                    region: 'eu-west-1',
                    title: 'Lambda Invocations',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: lambdaNames.map((name: string) => [
                      'AWS/Lambda',
                      'Errors',
                      'FunctionName',
                      name,
                    ]),
                    period: 300,
                    stat: 'Sum',
                    region: 'eu-west-1',
                    title: 'Lambda Errors',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: dynamoNames.map((name: string) => [
                      'AWS/DynamoDB',
                      'ConsumedReadCapacityUnits',
                      'TableName',
                      name,
                    ]),
                    period: 300,
                    stat: 'Sum',
                    region: 'eu-west-1',
                    title: 'DynamoDB Read Capacity',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApiGateway',
                        'Count',
                        'ApiName',
                        apiName,
                        'Stage',
                        stageName,
                      ],
                      [
                        'AWS/ApiGateway',
                        '4XXError',
                        'ApiName',
                        apiName,
                        'Stage',
                        stageName,
                      ],
                      [
                        'AWS/ApiGateway',
                        '5XXError',
                        'ApiName',
                        apiName,
                        'Stage',
                        stageName,
                      ],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: 'eu-west-1',
                    title: 'API Gateway Metrics',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
    });
  }
}
