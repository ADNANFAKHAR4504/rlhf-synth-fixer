/**
 * Metric Aggregator Lambda Function
 *
 * Aggregates metrics from 10+ microservices every 60 seconds,
 * calculates rolling averages, and publishes to CloudWatch.
 */
const { CloudWatchClient, PutMetricDataCommand, GetMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const CUSTOM_NAMESPACE = process.env.CUSTOM_NAMESPACE || 'FinanceMetrics';

// Simulated microservices to aggregate from
const MICROSERVICES = [
  'auth-service',
  'payment-service',
  'inventory-service',
  'shipping-service',
  'notification-service',
  'analytics-service',
  'reporting-service',
  'billing-service',
  'customer-service',
  'order-service',
  'fraud-detection-service',
];

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Starting metric aggregation', { event });

  try {
    // 1. Collect metrics from all microservices
    const metricsData = await collectMetricsFromMicroservices();

    // 2. Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(metricsData);

    // 3. Calculate rolling averages
    const rollingAverages = await calculateRollingAverages();

    // 4. Publish metrics to CloudWatch
    await publishMetricsToCloudWatch(aggregatedMetrics, rollingAverages);

    console.log('Metric aggregation completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Metrics aggregated successfully',
        metricsPublished: aggregatedMetrics.length + rollingAverages.length,
      }),
    };
  } catch (error) {
    console.error('Error during metric aggregation', { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Simulate collecting metrics from microservices
 */
async function collectMetricsFromMicroservices() {
  const metrics = [];

  for (const service of MICROSERVICES) {
    // Simulate metric collection (in production, this would call actual service endpoints)
    const serviceMetrics = {
      serviceName: service,
      latency: Math.random() * 1000, // Simulated latency in ms
      errorRate: Math.random() * 0.1, // Simulated error rate (0-10%)
      requestCount: Math.floor(Math.random() * 1000),
      successfulTransactions: Math.floor(Math.random() * 950),
    };

    metrics.push(serviceMetrics);
  }

  return metrics;
}

/**
 * Calculate aggregated metrics across all services
 */
function calculateAggregatedMetrics(metricsData) {
  const totalRequests = metricsData.reduce((sum, m) => sum + m.requestCount, 0);
  const totalSuccessful = metricsData.reduce((sum, m) => sum + m.successfulTransactions, 0);
  const totalErrors = metricsData.reduce((sum, m) => sum + m.requestCount * m.errorRate, 0);

  // Calculate P99 latency (simplified - in production use proper percentile calculation)
  const sortedLatencies = metricsData.map((m) => m.latency).sort((a, b) => a - b);
  const p99Index = Math.floor(sortedLatencies.length * 0.99);
  const p99Latency = sortedLatencies[p99Index] || sortedLatencies[sortedLatencies.length - 1];

  // Calculate average error rate
  const avgErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return [
    {
      MetricName: 'P99Latency',
      Value: p99Latency,
      Unit: 'Milliseconds',
    },
    {
      MetricName: 'ErrorRate',
      Value: avgErrorRate,
      Unit: 'Percent',
    },
    {
      MetricName: 'TotalRequests',
      Value: totalRequests,
      Unit: 'Count',
    },
    {
      MetricName: 'SuccessfulTransactions',
      Value: totalSuccessful,
      Unit: 'Count',
    },
    {
      MetricName: 'TransactionVolume',
      Value: totalRequests,
      Unit: 'Count',
    },
  ];
}

/**
 * Calculate rolling averages from historical data
 */
async function calculateRollingAverages() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    // Query historical data for rolling average calculation
    const command = new GetMetricDataCommand({
      MetricDataQueries: [
        {
          Id: 'm1',
          MetricStat: {
            Metric: {
              Namespace: CUSTOM_NAMESPACE,
              MetricName: 'P99Latency',
            },
            Period: 60,
            Stat: 'Average',
          },
        },
      ],
      StartTime: fiveMinutesAgo,
      EndTime: now,
    });

    const response = await cloudwatch.send(command);

    // Calculate rolling average from historical data
    const values = response.MetricDataResults?.[0]?.Values || [];
    const rollingAverage = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

    return [
      {
        MetricName: 'P99LatencyRollingAvg',
        Value: rollingAverage,
        Unit: 'Milliseconds',
      },
    ];
  } catch (error) {
    console.warn('Failed to calculate rolling averages', { error: error.message });
    return [];
  }
}

/**
 * Publish aggregated metrics to CloudWatch
 */
async function publishMetricsToCloudWatch(aggregatedMetrics, rollingAverages) {
  const allMetrics = [...aggregatedMetrics, ...rollingAverages];

  const metricData = allMetrics.map((metric) => ({
    MetricName: metric.MetricName,
    Value: metric.Value,
    Unit: metric.Unit,
    Timestamp: new Date(),
    Dimensions: [
      {
        Name: 'Environment',
        Value: process.env.ENVIRONMENT_SUFFIX || 'dev',
      },
    ],
  }));

  const command = new PutMetricDataCommand({
    Namespace: CUSTOM_NAMESPACE,
    MetricData: metricData,
  });

  await cloudwatch.send(command);
  console.log('Published metrics to CloudWatch', { count: metricData.length });
}
