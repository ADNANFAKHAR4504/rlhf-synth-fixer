// lib/lambdas/log-processor/index.ts
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { CloudWatchLogsEvent, CloudWatchLogsHandler } from 'aws-lambda';
import { promisify } from 'util';
import * as zlib from 'zlib';

const gunzip = promisify(zlib.gunzip);
const metrics = new Metrics({ namespace: 'PaymentPlatform/Business' });
const logger = new Logger();

interface PaymentLog {
  timestamp: string;
  level: string;
  message: string;
  merchantId?: string;
  merchantTier?: string;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  status?: string;
  responseTime?: number;
  errorCode?: string;
}

export const handler: CloudWatchLogsHandler = async (
  event: CloudWatchLogsEvent
) => {
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const result = await gunzip(payload);
  const logData = JSON.parse(result.toString());

  logger.info('Processing log batch', {
    logGroup: logData.logGroup,
    messageCount: logData.logEvents.length,
  });

  for (const logEvent of logData.logEvents) {
    try {
      const log: PaymentLog = JSON.parse(logEvent.message);

      if (log.merchantId && log.amount) {
        metrics.addMetric('MerchantTransactionVolume', MetricUnit.Count, 1);
        metrics.addMetadata('merchantId', log.merchantId);
        metrics.addMetadata('merchantTier', log.merchantTier || 'Standard');
        metrics.addDimension('MerchantTier', log.merchantTier || 'Standard');

        metrics.addMetric('TransactionAmount', MetricUnit.NoUnit, log.amount);
        metrics.addDimension('Currency', log.currency || 'USD');
        metrics.addDimension('PaymentMethod', log.paymentMethod || 'Unknown');
      }

      if (log.status) {
        if (log.status === 'success') {
          metrics.addMetric('PaymentSuccess', MetricUnit.Count, 1);
        } else if (log.status === 'failed') {
          metrics.addMetric('PaymentFailure', MetricUnit.Count, 1);
          if (log.errorCode) {
            metrics.addDimension('ErrorCode', log.errorCode);
          }
        }
        metrics.addMetric('PaymentAttempts', MetricUnit.Count, 1);
      }

      if (log.responseTime) {
        metrics.addMetric(
          'APIResponseTime',
          MetricUnit.Milliseconds,
          log.responseTime
        );
      }

      if (log.status === 'failed') {
        metrics.addMetric('PaymentFailureRate', MetricUnit.Percent, 1);
      } else if (log.status === 'success') {
        metrics.addMetric('PaymentFailureRate', MetricUnit.Percent, 0);
      }
    } catch (error) {
      logger.error('Failed to parse log event', {
        error,
        message: logEvent.message,
      });
    }
  }

  metrics.publishStoredMetrics();
  return;
};
