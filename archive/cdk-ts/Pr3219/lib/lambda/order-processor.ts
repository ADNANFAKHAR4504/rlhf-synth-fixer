/* eslint-disable import/no-extraneous-dependencies */
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';

// Initialize AWS SDK clients
const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

interface Order {
  customerId: string;
  restaurantId: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    zipCode: string;
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Processing order request', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          message: 'Request body is required',
        }),
      };
    }

    const order: Order = JSON.parse(event.body);

    // Basic validation
    if (
      !order.customerId ||
      !order.restaurantId ||
      !order.items ||
      order.items.length === 0
    ) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          message:
            'Missing required fields: customerId, restaurantId, or items',
        }),
      };
    }

    // Generate order ID
    const orderId = randomUUID();

    // Create order in DynamoDB
    const orderItem = {
      orderId: { S: orderId },
      customerId: { S: order.customerId },
      restaurantId: { S: order.restaurantId },
      items: { S: JSON.stringify(order.items) },
      totalAmount: { N: order.totalAmount.toString() },
      deliveryAddress: { S: JSON.stringify(order.deliveryAddress) },
      status: { S: 'pending' },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
    };

    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.ORDERS_TABLE_NAME,
        Item: orderItem,
        ConditionExpression: 'attribute_not_exists(orderId)',
      })
    );

    console.log('Order created successfully', { orderId });

    // Send to processing queue if configured
    if (process.env.PROCESSING_QUEUE_URL) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: process.env.PROCESSING_QUEUE_URL,
          MessageBody: JSON.stringify({ orderId, action: 'process' }),
          MessageAttributes: {
            orderType: {
              StringValue: 'food_delivery',
              DataType: 'String',
            },
          },
        })
      );
      console.log('Order sent to processing queue', { orderId });
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      },
      body: JSON.stringify({
        success: true,
        orderId,
        status: 'pending',
        message: 'Order created successfully',
      }),
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing order', error);

    // Send to DLQ for retry if configured
    if (process.env.DLQ_URL) {
      try {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: process.env.DLQ_URL,
            MessageBody: JSON.stringify({
              originalEvent: event,
              error: errorMessage,
              timestamp: new Date().toISOString(),
            }),
          })
        );
      } catch (dlqError: unknown) {
        console.error('Failed to send to DLQ', dlqError);
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to process order',
        error: errorMessage,
      }),
    };
  }
};
