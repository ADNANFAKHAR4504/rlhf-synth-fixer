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
    `infrastructure-api-usage-filter-${environmentSuffix}`,
    {
      name: `api-usage-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, request_id, api_endpoint, status_code, duration]',
      metricTransformation: {
        name: `APIUsageCount-${environmentSuffix}`,
        namespace: 'Infrastructure/Custom',
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
    `infrastructure-app-error-filter-${environmentSuffix}`,
    {
      name: `app-errors-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, level = "ERROR", ...]',
      metricTransformation: {
        name: `ApplicationErrors-${environmentSuffix}`,
        namespace: 'Infrastructure/Custom',
        value: '1',
        defaultValue: '0',
        unit: 'Count',
      },
    },
    opts
  );

  // Metric filter for response time tracking
  const responseTimeFilter = new aws.cloudwatch.LogMetricFilter(
    `infrastructure-response-time-filter-${environmentSuffix}`,
    {
      name: `response-time-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern: '[timestamp, request_id, api_endpoint, status_code, duration]',
      metricTransformation: {
        name: `APIResponseTime-${environmentSuffix}`,
        namespace: 'Infrastructure/Custom',
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
    `infrastructure-business-metric-filter-${environmentSuffix}`,
    {
      name: `business-transactions-${environmentSuffix}`,
      logGroupName: appLogGroup.name,
      pattern:
        '[timestamp, metric_type = "BUSINESS", metric_name, metric_value]',
      metricTransformation: {
        name: `BusinessMetrics-${environmentSuffix}`,
        namespace: 'Infrastructure/Custom',
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
