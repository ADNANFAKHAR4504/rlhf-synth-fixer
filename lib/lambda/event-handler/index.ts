import { EventBridgeEvent } from 'aws-lambda';

const REGION = process.env.REGION || 'us-east-2';

interface TradingEvent {
  eventType: string;
  data: Record<string, unknown>;
  sourceRegion: string;
  timestamp: string;
}

export const handler = async (
  event: EventBridgeEvent<string, TradingEvent>
): Promise<void> => {
  console.log(`Received cross-region event in ${REGION}`, event);

  const { 'detail-type': detailType, detail } = event;

  switch (detailType) {
    case 'Trade Executed':
      await handleTradeExecuted(detail);
      break;
    case 'Failover Required':
      await handleFailoverRequired(detail);
      break;
    default:
      console.log(`Unknown event type: ${detailType}`);
  }
};

async function handleTradeExecuted(detail: TradingEvent): Promise<void> {
  console.log('Handling Trade Executed event:', detail);

  // Log the event for audit purposes
  console.log(`Trade from ${detail.sourceRegion} received in ${REGION}`);

  // In a real implementation, you might:
  // - Update local cache
  // - Trigger notifications
  // - Update metrics
}

async function handleFailoverRequired(detail: TradingEvent): Promise<void> {
  console.log('Handling Failover Required event:', detail);

  // Log critical failover event
  console.error(
    `CRITICAL: Failover required from ${detail.sourceRegion} to ${REGION}`
  );

  // In a real implementation, you might:
  // - Trigger Step Functions state machine
  // - Send alerts to operations team
  // - Update status dashboards
}
