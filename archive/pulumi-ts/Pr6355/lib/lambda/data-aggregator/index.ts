import { EventBridgeEvent, ScheduledEvent } from 'aws-lambda';
import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({});

const TABLE_NAME = process.env.TABLE_NAME!;

interface ProcessedData {
  symbol: string;
  timestamp: number;
  processed: boolean;
  processingTime: number;
  originalData: Record<string, unknown>;
}

export const handler = async (
  event: EventBridgeEvent<string, ProcessedData> | ScheduledEvent
): Promise<void> => {
  console.log('[INFO] DataAggregator Lambda invoked', JSON.stringify(event));

  try {
    // Check if this is a scheduled event or custom event
    const isScheduled =
      'detail-type' in event && event['detail-type'] === 'Scheduled Event';

    if (isScheduled) {
      console.log('[INFO] Processing scheduled aggregation');

      // Scan table for recent processed data
      const scanResult = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'processed' },
          },
          Limit: 1000,
        })
      );

      const items = scanResult.Items || [];
      console.log(
        `[INFO] Found ${items.length} processed items for aggregation`
      );

      // Perform aggregation logic (placeholder - add your business logic here)
      const aggregatedData = {
        totalItems: items.length,
        timestamp: Date.now(),
        symbols: new Set(items.map(item => item.symbol?.S)).size,
      };

      console.log('[INFO] Aggregation result:', aggregatedData);
    } else {
      // Custom event from DataProcessor
      console.log('[INFO] Processing custom event from DataProcessor');

      const eventDetail = (event as EventBridgeEvent<string, ProcessedData>)
        .detail;
      const { symbol, timestamp } = eventDetail;

      // Query specific symbol data for real-time aggregation
      const queryResult = await dynamodb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'symbol = :symbol',
          ExpressionAttributeValues: {
            ':symbol': { S: symbol },
          },
          ScanIndexForward: false,
          Limit: 100,
        })
      );

      const items = queryResult.Items || [];
      console.log(`[INFO] Found ${items.length} items for symbol: ${symbol}`);

      // Perform symbol-specific aggregation
      const symbolAggregation = {
        symbol,
        itemCount: items.length,
        latestTimestamp: timestamp,
        aggregationTime: Date.now(),
      };

      console.log('[INFO] Symbol aggregation result:', symbolAggregation);
    }

    console.log('[INFO] DataAggregator completed successfully');
  } catch (error) {
    console.error('[ERROR] Error in DataAggregator:', error);
    throw error;
  }
};
