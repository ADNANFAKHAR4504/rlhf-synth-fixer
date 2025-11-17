const { Logger } = require('@aws-lambda-powertools/logger');
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');
const { Tracer } = require('@aws-lambda-powertools/tracer');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const logger = new Logger({ serviceName: 'AlertProcessor' });
const metrics = new Metrics({ namespace: 'StockPatternDetection', serviceName: 'AlertProcessor' });
const tracer = new Tracer({ serviceName: 'AlertProcessor' });
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment('AlertProcessing');

  try {
    logger.info('Processing alerts from SQS', { event });

    const records = event.Records || [];
    const results = [];

    for (const record of records) {
      try {
        const message = JSON.parse(record.body);
        const severity = message.severity || 'MEDIUM';

        // Custom metrics
        metrics.addDimension('Severity', severity);
        metrics.addMetric('AlertPriority', MetricUnits.Count, 1);

        // Publish to SNS
        if (severity === 'CRITICAL') {
          await snsClient.send(
            new PublishCommand({
              TopicArn: process.env.ALERT_APPROVAL_TOPIC_ARN,
              Message: JSON.stringify({
                alert: message,
                requiresApproval: true,
              }),
              Subject: 'Critical Alert Requires Approval',
            })
          );
        } else {
          await snsClient.send(
            new PublishCommand({
              TopicArn: process.env.TRADING_ALERTS_TOPIC_ARN,
              Message: JSON.stringify(message),
              Subject: `Trading Alert - ${severity}`,
            })
          );
        }

        results.push({ messageId: record.messageId, status: 'success' });
      } catch (error) {
        logger.error('Error processing record', { error, record });
        results.push({ messageId: record.messageId, status: 'failed' });
      }
    }

    subsegment.close();
    logger.info('Alert processing completed', { results });

    return { batchItemFailures: results.filter((r) => r.status === 'failed').map((r) => ({ itemIdentifier: r.messageId })) };
  } catch (error) {
    logger.error('Error in alert processor', { error });
    subsegment.addError(error);
    subsegment.close();
    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};
