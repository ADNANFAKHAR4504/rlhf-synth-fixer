import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBStreamEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});

interface TradingOrder {
  orderId: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  orderType: 'BUY' | 'SELL';
  status: 'PENDING' | 'PROCESSING' | 'EXECUTED' | 'FAILED';
  timestamp: number;
  processedAt?: string;
  executionPrice?: number;
}

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing order stream event:', JSON.stringify(event));

  const processedOrders: TradingOrder[] = [];
  const failedOrders: string[] = [];

  for (const record of event.Records) {
    try {
      if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
        const newImage = record.dynamodb.NewImage;

        // Extract order details from DynamoDB stream
        const orderId = newImage.orderId?.S || '';
        const userId = newImage.userId?.S || '';
        const symbol = newImage.symbol?.S || '';
        const quantity = parseInt(newImage.quantity?.N || '0');
        const price = parseFloat(newImage.price?.N || '0');
        const orderType = (newImage.orderType?.S as 'BUY' | 'SELL') || 'BUY';
        const timestamp = parseInt(newImage.timestamp?.N || '0');

        console.log(
          `Processing order: ${orderId} for ${symbol} ${orderType} ${quantity} @ ${price}`
        );

        // Simulate order validation
        const isValid = quantity > 0 && price > 0;

        if (!isValid) {
          failedOrders.push(orderId);
          await dynamodb.send(
            new UpdateCommand({
              TableName: process.env.ORDERS_TABLE,
              Key: { orderId, timestamp },
              UpdateExpression:
                'SET #status = :failed, processedAt = :processedAt, failureReason = :reason',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':failed': 'FAILED',
                ':processedAt': new Date().toISOString(),
                ':reason': 'Invalid order parameters',
              },
            })
          );
          continue;
        }

        // Simulate market execution (in real scenario, this would connect to exchange)
        const executionPrice = price * (0.98 + Math.random() * 0.04); // ±2% slippage

        // Update order status to EXECUTED
        const processedOrder: TradingOrder = {
          orderId,
          userId,
          symbol,
          quantity,
          price,
          orderType,
          status: 'EXECUTED',
          timestamp,
          processedAt: new Date().toISOString(),
          executionPrice: parseFloat(executionPrice.toFixed(2)),
        };

        await dynamodb.send(
          new UpdateCommand({
            TableName: process.env.ORDERS_TABLE,
            Key: { orderId, timestamp },
            UpdateExpression:
              'SET #status = :executed, processedAt = :processedAt, executionPrice = :execPrice',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':executed': 'EXECUTED',
              ':processedAt': processedOrder.processedAt,
              ':execPrice': processedOrder.executionPrice,
            },
          })
        );

        // Archive processed order to S3 for audit trail
        if (process.env.TRADING_DATA_BUCKET) {
          const archiveKey = `orders/${new Date().toISOString().split('T')[0]}/${orderId}.json`;
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.TRADING_DATA_BUCKET,
              Key: archiveKey,
              Body: JSON.stringify(processedOrder),
              ContentType: 'application/json',
            })
          );
        }

        // Update market data table with latest execution
        if (process.env.MARKET_DATA_TABLE) {
          await dynamodb.send(
            new PutCommand({
              TableName: process.env.MARKET_DATA_TABLE,
              Item: {
                symbol,
                timestamp: Date.now(),
                lastPrice: executionPrice,
                lastQuantity: quantity,
                orderType,
                updatedAt: new Date().toISOString(),
              },
            })
          );
        }

        processedOrders.push(processedOrder);
        console.log(
          `Order ${orderId} executed successfully at ${executionPrice}`
        );
      } else if (record.eventName === 'MODIFY' && record.dynamodb?.NewImage) {
        // Handle order modifications
        const orderId = record.dynamodb.NewImage.orderId?.S || '';
        console.log(`Order ${orderId} was modified`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing order:', errorMessage);
      const orderId = record.dynamodb?.NewImage?.orderId?.S || 'unknown';
      failedOrders.push(orderId);
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    totalRecords: event.Records.length,
    processedCount: processedOrders.length,
    failedCount: failedOrders.length,
    processedOrders: processedOrders.map(o => ({
      orderId: o.orderId,
      symbol: o.symbol,
      executionPrice: o.executionPrice,
    })),
    failedOrders,
  };

  console.log('Order processing summary:', JSON.stringify(summary));

  return {
    statusCode: 200,
    body: JSON.stringify(summary),
  };
};
