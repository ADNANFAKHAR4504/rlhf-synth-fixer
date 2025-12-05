import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createLogsInsightsQueries(
  environmentSuffix: string,
  appLogGroup: aws.cloudwatch.LogGroup,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // Query for error patterns in application logs
  const errorPatternQuery = new aws.cloudwatch.QueryDefinition(
    `infra-err-pattern-query-e4-${environmentSuffix}`,
    {
      name: `err-pattern-e4-${environmentSuffix}`,
      logGroupNames: [appLogGroup.name],
      queryString: `
fields @timestamp, @message, @logStream
| filter @message like /ERROR|Exception|Failed/
| stats count() as error_count by @logStream
| sort error_count desc
| limit 20
      `.trim(),
    },
    opts
  );

  // Query for high latency requests
  const latencyQuery = new aws.cloudwatch.QueryDefinition(
    `infra-latency-query-e4-${environmentSuffix}`,
    {
      name: `latency-req-e4-${environmentSuffix}`,
      logGroupNames: [appLogGroup.name],
      queryString: `
fields @timestamp, @message, @duration
| filter @duration > 1000
| stats count() as slow_requests, avg(@duration) as avg_duration by bin(5m)
| sort slow_requests desc
      `.trim(),
    },
    opts
  );

  // Query for failed API requests
  const failedApiQuery = new aws.cloudwatch.QueryDefinition(
    `infra-failed-api-query-e4-${environmentSuffix}`,
    {
      name: `failed-api-e4-${environmentSuffix}`,
      logGroupNames: [appLogGroup.name],
      queryString: `
fields @timestamp, @message, status
| filter status >= 400
| stats count() as failed_count by status, bin(5m)
| sort failed_count desc
      `.trim(),
    },
    opts
  );

  // Query for Lambda cold starts
  const coldStartQuery = new aws.cloudwatch.QueryDefinition(
    `infra-cold-start-query-e4-${environmentSuffix}`,
    {
      name: `cold-starts-e4-${environmentSuffix}`,
      logGroupNames: [appLogGroup.name],
      queryString: `
fields @timestamp, @message, @initDuration
| filter @type = "REPORT" and @initDuration > 0
| stats count() as cold_starts, avg(@initDuration) as avg_init_time by bin(1h)
| sort cold_starts desc
      `.trim(),
    },
    opts
  );

  return {
    queries: [errorPatternQuery, latencyQuery, failedApiQuery, coldStartQuery],
  };
}
