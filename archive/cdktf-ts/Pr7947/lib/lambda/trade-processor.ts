import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

interface TradeOrder {
  orderId: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  orderType: 'BUY' | 'SELL';
  timestamp: string;
}

export async function handler(
  event: SQSEvent,
  _context: unknown
): Promise<unknown> {
  const region = process.env.REGION || 'us-east-1';
  const sessionTable = process.env.SESSION_TABLE;
  const auditBucket = process.env.AUDIT_BUCKET;

  console.log(
    `Processing ${event.Records.length} trade orders in region ${region}`
  );

  const results = await Promise.allSettled(
    event.Records.map(record =>
      processTradeOrder(record, sessionTable!, auditBucket!)
    )
  );

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;

  console.log(`Processed: ${successCount} successful, ${failureCount} failed`);

  if (failureCount > 0) {
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);

    console.error('Processing errors:', errors);
    throw new Error(`Failed to process ${failureCount} orders`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Trade orders processed successfully',
      region,
      processed: successCount,
    }),
  };
}

async function processTradeOrder(
  record: SQSRecord,
  sessionTable: string,
  auditBucket: string
): Promise<void> {
  try {
    const order: TradeOrder = JSON.parse(record.body);

    console.log(`Processing order ${order.orderId} for user ${order.userId}`);

    // Validate order
    if (!order.orderId || !order.userId || !order.symbol) {
      throw new Error('Invalid order: missing required fields');
    }

    // Update session data in DynamoDB global table
    await dynamodb.send(
      new PutItemCommand({
        TableName: sessionTable,
        Item: {
          userId: { S: order.userId },
          sessionId: { S: `session-${Date.now()}` },
          lastActivity: { S: new Date().toISOString() },
          lastOrder: { S: order.orderId },
          region: { S: process.env.REGION || 'us-east-1' },
        },
      })
    );

    // Log to audit bucket
    const auditLog = {
      orderId: order.orderId,
      userId: order.userId,
      symbol: order.symbol,
      quantity: order.quantity,
      price: order.price,
      orderType: order.orderType,
      timestamp: order.timestamp,
      processedAt: new Date().toISOString(),
      region: process.env.REGION || 'us-east-1',
      messageId: record.messageId,
    };

    await s3.send(
      new PutObjectCommand({
        Bucket: auditBucket,
        Key: `orders/${order.orderId}-${Date.now()}.json`,
        Body: JSON.stringify(auditLog),
        ContentType: 'application/json',
      })
    );

    console.log(`Successfully processed order ${order.orderId}`);
  } catch (error) {
    console.error('Failed to process order:', error);
    throw error;
  }
}
