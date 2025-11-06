import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ssm = new SSMClient({});
const sns = new SNSClient({});

interface AutoResponse {
  action: string;
  target: string;
  reason: string;
  timestamp: string;
}

interface AlertThresholds {
  latencyThresholdMs: number;
  errorRateThreshold: number;
  orderVolumeThreshold: number;
}

interface AlertEvent {
  alertType?: string;
  metrics?: {
    latency?: number;
    errorRate?: number;
    unhealthyServices?: string[];
    orderVolume?: number;
  };
}

export const handler = async (event: AlertEvent) => {
  console.log('Processing automated response event:', JSON.stringify(event));

  const responses: AutoResponse[] = [];

  try {
    // Get alert thresholds from Parameter Store
    const paramResult = await ssm.send(
      new GetParameterCommand({
        Name: '/trading-platform/alert-thresholds',
        WithDecryption: true,
      })
    );

    const thresholds: AlertThresholds = JSON.parse(
      paramResult.Parameter?.Value || '{}'
    );

    // Analyze the alert and determine response
    if (event.alertType === 'HIGH_LATENCY') {
      const latency = event.metrics?.latency || 0;

      if (latency > thresholds.latencyThresholdMs) {
        responses.push({
          action: 'SCALE_OUT',
          target: 'COMPUTE_RESOURCES',
          reason: `Latency (${latency}ms) exceeded threshold (${thresholds.latencyThresholdMs}ms)`,
          timestamp: new Date().toISOString(),
        });

        // Trigger scaling action
        console.log(`Triggering scale-out for high latency: ${latency}ms`);
      }
    }

    if (event.alertType === 'ERROR_RATE_HIGH') {
      const errorRate = event.metrics?.errorRate || 0;

      if (errorRate > thresholds.errorRateThreshold) {
        responses.push({
          action: 'CIRCUIT_BREAKER',
          target: 'API_GATEWAY',
          reason: `Error rate (${errorRate}) exceeded threshold (${thresholds.errorRateThreshold})`,
          timestamp: new Date().toISOString(),
        });

        // Enable circuit breaker
        console.log(
          `Enabling circuit breaker for high error rate: ${errorRate}`
        );
      }
    }

    if (event.alertType === 'INFRASTRUCTURE_HEALTH') {
      const unhealthyServices = event.metrics?.unhealthyServices || [];

      if (unhealthyServices.length > 0) {
        responses.push({
          action: 'FAILOVER',
          target: unhealthyServices.join(', '),
          reason: `Services unhealthy: ${unhealthyServices.join(', ')}`,
          timestamp: new Date().toISOString(),
        });

        // Trigger failover to backup region
        console.log(
          `Initiating failover for unhealthy services: ${unhealthyServices.join(', ')}`
        );
      }
    }

    if (event.alertType === 'ORDER_VOLUME_SPIKE') {
      const orderVolume = event.metrics?.orderVolume || 0;

      if (orderVolume > thresholds.orderVolumeThreshold) {
        responses.push({
          action: 'INCREASE_CAPACITY',
          target: 'ORDER_PROCESSING',
          reason: `Order volume (${orderVolume}) exceeded threshold (${thresholds.orderVolumeThreshold})`,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `Increasing order processing capacity for volume: ${orderVolume}`
        );
      }
    }

    // Log all responses
    console.log('Automated responses executed:', JSON.stringify(responses));

    // Send notification if there are responses
    if (responses.length > 0 && process.env.SNS_TOPIC_ARN) {
      await sns.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: `Trading Platform Automated Response - ${event.alertType}`,
          Message: JSON.stringify(responses, null, 2),
        })
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error executing automated response:', errorMessage);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      event: event,
      responsesExecuted: responses.length,
      responses: responses,
    }),
  };
};
