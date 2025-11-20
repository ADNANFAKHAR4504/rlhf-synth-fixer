// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSEvent, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-rds-data';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const rdsClient = new RDSDataClient({});

const DB_CLUSTER_ARN = process.env.DB_CLUSTER_ARN!;
const DB_SECRET_ARN = process.env.DB_SECRET_ARN!;
const SESSION_TABLE_NAME = process.env.SESSION_TABLE_NAME!;
const REGION = process.env.REGION!;

interface TradeOrder {
  tradeId: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
}

export const handler = async (event: SQSEvent, _context: Context) => {
  console.log('Processing trade orders', {
    region: REGION,
    recordCount: event.Records.length,
  });

  const results = [];

  for (const record of event.Records) {
    try {
      const order: TradeOrder = JSON.parse(record.body);
      console.log('Processing order', { order });

      // Validate session
      const sessionResult = await docClient.send(
        new GetCommand({
          TableName: SESSION_TABLE_NAME,
          Key: { sessionId: order.userId },
        })
      );

      if (!sessionResult.Item) {
        throw new Error(`Invalid session for user ${order.userId}`);
      }

      // Store trade in Aurora
      const sql = `
        INSERT INTO trades (trade_id, user_id, symbol, quantity, price, timestamp, region)
        VALUES (:tradeId, :userId, :symbol, :quantity, :price, :timestamp, :region)
      `;

      await rdsClient.send(
        new ExecuteStatementCommand({
          resourceArn: DB_CLUSTER_ARN,
          secretArn: DB_SECRET_ARN,
          sql,
          parameters: [
            { name: 'tradeId', value: { stringValue: order.tradeId } },
            { name: 'userId', value: { stringValue: order.userId } },
            { name: 'symbol', value: { stringValue: order.symbol } },
            { name: 'quantity', value: { longValue: order.quantity } },
            { name: 'price', value: { doubleValue: order.price } },
            { name: 'timestamp', value: { stringValue: order.timestamp } },
            { name: 'region', value: { stringValue: REGION } },
          ],
        })
      );

      // Update session activity
      await docClient.send(
        new PutCommand({
          TableName: SESSION_TABLE_NAME,
          Item: {
            sessionId: order.userId,
            lastActivity: new Date().toISOString(),
            lastTradeId: order.tradeId,
            region: REGION,
          },
        })
      );

      results.push({ success: true, tradeId: order.tradeId });
      console.log('Trade processed successfully', { tradeId: order.tradeId });
    } catch (error) {
      console.error('Failed to process trade', { error, record });
      results.push({ success: false, error: (error as Error).message });
      throw error; // Re-throw to mark SQS message as failed
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Trade orders processed',
      results,
      region: REGION,
    }),
  };
};
