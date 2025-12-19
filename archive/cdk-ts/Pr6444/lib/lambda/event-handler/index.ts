import { EventBridgeEvent } from 'aws-lambda';

const REGION = process.env.REGION || 'us-east-1';

interface TradingEvent {
  eventType: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export const handler = async (
  event: EventBridgeEvent<string, TradingEvent>
): Promise<void> => {
  console.log(`Received platform event in ${REGION}`, event);

  const { 'detail-type': detailType, detail } = event;

  switch (detailType) {
    case 'Trade Executed':
      await handleTradeExecuted(detail);
      break;
    case 'System Alert':
      await handleSystemAlert(detail);
      break;
    default:
      console.log(`Unknown event type: ${detailType}`);
  }
};

async function handleTradeExecuted(detail: TradingEvent): Promise<void> {
  console.log('Handling Trade Executed event:', detail);

  // Log the event for audit purposes
  console.log(`Trade executed in ${REGION} at ${detail.timestamp}`);

  // In a real implementation, you might:
  // - Update local cache
  // - Trigger notifications
  // - Update metrics
}

async function handleSystemAlert(detail: TradingEvent): Promise<void> {
  console.log('Handling System Alert event:', detail);

  // Log critical system alert
  console.warn(`ALERT: System event in ${REGION}`, detail);

  // In a real implementation, you might:
  // - Send alerts to operations team
  // - Update status dashboards
  // - Trigger automated remediation
}
