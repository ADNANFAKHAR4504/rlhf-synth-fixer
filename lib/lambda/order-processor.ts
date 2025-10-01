/* eslint-disable import/no-extraneous-dependencies */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { randomUUID } from 'crypto';
import { captureAWSv3Client } from 'aws-xray-sdk-core';
/* eslint-enable import/no-extraneous-dependencies */

// Initialize AWS SDK clients with X-Ray tracing
const dynamodbClient = captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamodbClient);
const ssmClient = captureAWSv3Client(new SSMClient({}));
const sqsClient = captureAWSv3Client(new SQSClient({}));

// Initialize Powertools
const logger = new Logger({ serviceName: 'order-processor' });
const metrics = new Metrics({
  namespace: 'FoodDelivery',
  serviceName: 'order-processor',
});

interface Order {
  orderId?: string;
  customerId: string;
  items: OrderItem[];
  deliveryAddress: Address;
  status?: string;
  totalAmount?: number;
  createdAt?: number;
  updatedAt?: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Address {
  street: string;
  city: string;
  zipCode: string;
}

interface ApiConfig {
  maxOrdersPerHour: number;
  defaultTimeout: number;
  retryAttempts: number;
}

interface FeatureFlags {
  expressDelivery: boolean;
  loyaltyProgram: boolean;
  multiplePayments: boolean;
}

// Cache for SSM parameters
let apiConfig: ApiConfig | null = null;
let featureFlags: FeatureFlags | null = null;
let lastFetched = 0;
const CACHE_TTL = 300000; // 5 minutes

async function getApiConfig(): Promise<ApiConfig> {
  const now = Date.now();
  if (apiConfig && now - lastFetched < CACHE_TTL) {
    return apiConfig;
  }

  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: process.env.API_CONFIG_PARAM!,
        WithDecryption: false,
      })
    );
    apiConfig = JSON.parse(response.Parameter?.Value || '{}');
    lastFetched = now;
    return apiConfig!;
  } catch (error) {
    logger.error('Failed to fetch API config', error as Error);
    throw error;
  }
}

async function getFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now();
  if (featureFlags && now - lastFetched < CACHE_TTL) {
    return featureFlags;
  }

  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: process.env.FEATURE_FLAGS_PARAM!,
        WithDecryption: true,
      })
    );
    featureFlags = JSON.parse(response.Parameter?.Value || '{}');
    lastFetched = now;
    return featureFlags!;
  } catch (error) {
    logger.error('Failed to fetch feature flags', error as Error);
    throw error;
  }
}

async function calculateTotalAmount(items: OrderItem[]): Promise<number> {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

async function sendToDLQ(order: Order, error: Error): Promise<void> {
  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.DLQ_URL!,
        MessageBody: JSON.stringify({
          order,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      })
    );
  } catch (dlqError) {
    logger.error('Failed to send to DLQ', dlqError as Error);
  }
}

const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Add cold start metric
  metrics.addMetric('ColdStart', MetricUnit.Count, 1);

  try {
    // Log request
    logger.info('Processing request', {
      method: event.httpMethod,
      path: event.path,
      requestId: event.requestContext.requestId,
    });

    // Get configurations
    const [config, flags] = await Promise.all([
      getApiConfig(),
      getFeatureFlags(),
    ]);

    logger.info('Loaded configurations', { config, flags });

    if (event.httpMethod === 'POST') {
      // Create new order
      const order: Order = JSON.parse(event.body || '{}');
      order.orderId = randomUUID();
      order.status = 'pending';
      order.totalAmount = await calculateTotalAmount(order.items);
      order.createdAt = Date.now();
      order.updatedAt = Date.now();

      // Add custom metrics
      metrics.addMetric('OrderCreated', MetricUnit.Count, 1);
      metrics.addMetric('OrderValue', MetricUnit.NoUnit, order.totalAmount);

      // Store in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME!,
          Item: {
            ...order,
            timestamp: order.createdAt,
          },
        })
      );

      logger.info('Order created successfully', { orderId: order.orderId });

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify({
          message: 'Order created successfully',
          orderId: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount,
        }),
      };
    } else if (event.httpMethod === 'PUT') {
      // Update existing order
      const orderId = event.pathParameters?.orderId;
      const updates: Partial<Order> = JSON.parse(event.body || '{}');

      if (!orderId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Order ID is required' }),
        };
      }

      // Build update expression
      const updateExpression = 'SET #status = :status, #updatedAt = :updatedAt';
      const expressionAttributeNames: Record<string, string> = {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      };
      const expressionAttributeValues: Record<string, unknown> = {
        ':status': updates.status || 'processing',
        ':updatedAt': Date.now(),
      };

      await docClient.send(
        new UpdateCommand({
          TableName: process.env.TABLE_NAME!,
          Key: {
            orderId: orderId,
            timestamp: Number(event.queryStringParameters?.timestamp),
          },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );

      metrics.addMetric('OrderUpdated', MetricUnit.Count, 1);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': event.requestContext.requestId,
        },
        body: JSON.stringify({
          message: 'Order updated successfully',
          orderId: orderId,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    logger.error('Error processing request', error as Error);
    metrics.addMetric('ProcessingError', MetricUnit.Count, 1);

    // Send failed orders to DLQ
    if (event.body) {
      await sendToDLQ(JSON.parse(event.body), error as Error);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: event.requestContext.requestId,
      }),
    };
  } finally {
    metrics.publishStoredMetrics();
  }
};

export const handler = lambdaHandler;
