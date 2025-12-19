const { Logger } = require('@aws-lambda-powertools/logger');
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');
const { Tracer } = require('@aws-lambda-powertools/tracer');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const logger = new Logger({ serviceName: 'ThresholdChecker' });
const metrics = new Metrics({ namespace: 'StockPatternDetection', serviceName: 'ThresholdChecker' });
const tracer = new Tracer({ serviceName: 'ThresholdChecker' });
const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment('ThresholdChecking');

  try {
    logger.info('Checking thresholds', { event });

    const errorThreshold = parseFloat(process.env.ERROR_THRESHOLD || '0.01');
    const confidenceThreshold = parseFloat(process.env.PATTERN_CONFIDENCE_THRESHOLD || '0.85');

    // Scan trading patterns table
    const scanResult = await dynamoClient.send(
      new ScanCommand({
        TableName: process.env.TRADING_PATTERNS_TABLE,
        Limit: 100,
      })
    );

    const alertCount = scanResult.Items?.length || 0;
    metrics.addMetric('ThresholdChecks', MetricUnits.Count, 1);
    metrics.addMetric('PatternsEvaluated', MetricUnits.Count, alertCount);

    // Send alerts to queue if thresholds exceeded
    if (alertCount > 10) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: process.env.ALERT_QUEUE_URL,
          MessageBody: JSON.stringify({
            type: 'threshold_exceeded',
            count: alertCount,
            threshold: confidenceThreshold,
            timestamp: new Date().toISOString(),
          }),
        })
      );
    }

    subsegment.close();
    logger.info('Threshold check completed', { alertCount });

    return {
      statusCode: 200,
      body: JSON.stringify({ alertCount, thresholdExceeded: alertCount > 10 }),
    };
  } catch (error) {
    logger.error('Error in threshold checker', { error });
    subsegment.addError(error);
    subsegment.close();
    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};
