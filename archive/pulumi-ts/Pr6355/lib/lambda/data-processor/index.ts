import { SQSEvent } from 'aws-lambda';
import {
  DynamoDBClient,
  UpdateItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

const dynamodb = new DynamoDBClient({});
const eventbridge = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('[INFO] DataProcessor Lambda invoked', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { symbol, timestamp } = message;

      console.log(`[INFO] Processing message for symbol: ${symbol}`);

      // Get current state from DynamoDB (for validation/business logic)
      await dynamodb.send(
        new GetItemCommand({
          TableName: TABLE_NAME,
          Key: {
            symbol: { S: symbol },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      // Perform processing logic (placeholder - add your business logic here)
      const processedData = {
        symbol,
        timestamp,
        processed: true,
        processingTime: Date.now(),
        originalData: message,
      };

      // Update DynamoDB with processed status
      await dynamodb.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: {
            symbol: { S: symbol },
            timestamp: { N: timestamp.toString() },
          },
          UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'processed' },
            ':processedAt': { N: Date.now().toString() },
          },
        })
      );

      // Send custom event to EventBridge for DataAggregator
      await eventbridge.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: 'market.analytics.processor',
              DetailType: 'MarketDataProcessed',
              Detail: JSON.stringify(processedData),
            },
          ],
        })
      );

      console.log(
        `[INFO] Successfully processed message for symbol: ${symbol}`
      );
    } catch (error) {
      console.error('[ERROR] Error processing SQS message:', error);
      // Message will be sent to DLQ after max retries
      throw error;
    }
  }
};
