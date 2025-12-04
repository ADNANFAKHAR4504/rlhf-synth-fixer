import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createMetricFilters(
  environmentSuffix: string,
  appLogGroup: aws.cloudwatch.LogGroup,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // Metric filter for API usage patterns
  const apiUsageFilter = new aws.cloudwatch.LogMetricFilter(
    `infra-api-use-e4-${environmentSuffix}`,
    {
      name: `api-use-e4-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, request_id, api_endpoint, status_code, duration]',
      metricTransformation: {
        name: `APIUseCount-e4-${environmentSuffix}`,
        namespace: 'Infra/Custom',
        value: '1',
        unit: 'Count',
        dimensions: {
          Endpoint: '$api_endpoint',
          StatusCode: '$status_code',
        },
      },
    },
    opts
  );

  // Metric filter for custom application errors
  const appErrorFilter = new aws.cloudwatch.LogMetricFilter(
    `infra-app-err-e4-${environmentSuffix}`,
    {
      name: `app-err-e4-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, level = "ERROR", ...]',
      metricTransformation: {
        name: `AppErrors-e4-${environmentSuffix}`,
        namespace: 'Infra/Custom',
        value: '1',
        defaultValue: '0',
        unit: 'Count',
      },
    },
    opts
  );

  // Metric filter for response time tracking
  const responseTimeFilter = new aws.cloudwatch.LogMetricFilter(
    `infra-resp-time-e4-${environmentSuffix}`,
    {
      name: `resp-time-e4-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, request_id, api_endpoint, status_code, duration]',
      metricTransformation: {
        name: `APIRespTime-e4-${environmentSuffix}`,
        namespace: 'Infra/Custom',
        value: '$duration',
        unit: 'Milliseconds',
        dimensions: {
          Endpoint: '$api_endpoint',
        },
      },
    },
    opts
  );

  // Metric filter for business metrics
  const businessMetricFilter = new aws.cloudwatch.LogMetricFilter(
    `infra-biz-metric-e4-${environmentSuffix}`,
    {
      name: `biz-txn-e4-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern:
        '[timestamp, metric_type = "BUSINESS", metric_name, metric_value]',
      metricTransformation: {
        name: `BizMetrics-e4-${environmentSuffix}`,
        namespace: 'Infra/Custom',
        value: '$metric_value',
        dimensions: {
          MetricName: '$metric_name',
        },
      },
    },
    opts
  );

  return {
    filters: [
      apiUsageFilter,
      appErrorFilter,
      responseTimeFilter,
      businessMetricFilter,
    ],
  };
}
