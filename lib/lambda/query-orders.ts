/* eslint-disable import/no-extraneous-dependencies */
import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Initialize AWS SDK client
const dynamoClient = new DynamoDBClient({});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    'Processing query orders request',
    JSON.stringify(event, null, 2)
  );

  try {
    const { customerId, restaurantId, status, limit } =
      event.queryStringParameters || {};

    let command;

    if (customerId) {
      // Query orders by customer ID using GSI
      command = new QueryCommand({
        TableName: process.env.ORDERS_TABLE_NAME,
        IndexName: 'CustomerIdIndex',
        KeyConditionExpression: 'customerId = :customerId',
        ExpressionAttributeValues: {
          ':customerId': { S: customerId },
        },
        Limit: limit ? parseInt(limit, 10) : 50,
        ScanIndexForward: false, // Latest orders first
      });
    } else if (restaurantId) {
      // Query orders by restaurant ID using GSI
      command = new QueryCommand({
        TableName: process.env.ORDERS_TABLE_NAME,
        IndexName: 'RestaurantIdIndex',
        KeyConditionExpression: 'restaurantId = :restaurantId',
        ExpressionAttributeValues: {
          ':restaurantId': { S: restaurantId },
        },
        Limit: limit ? parseInt(limit, 10) : 50,
        ScanIndexForward: false, // Latest orders first
      });
    } else {
      // Scan all orders (use with caution in production)
      command = new ScanCommand({
        TableName: process.env.ORDERS_TABLE_NAME,
        Limit: limit ? parseInt(limit, 10) : 50,
      });
    }

    // Add status filter if specified
    if (status) {
      command.input.FilterExpression = '#status = :status';
      command.input.ExpressionAttributeNames = {
        '#status': 'status',
      };
      command.input.ExpressionAttributeValues = {
        ...command.input.ExpressionAttributeValues,
        ':status': { S: status },
      };
    }

    const result = await dynamoClient.send(command);

    // Transform DynamoDB items to regular objects
    const items = 'Items' in result ? result.Items : [];
    const orders = (items || []).map(item => ({
      orderId: item.orderId?.S,
      customerId: item.customerId?.S,
      restaurantId: item.restaurantId?.S,
      items: item.items?.S ? JSON.parse(item.items.S) : [],
      totalAmount: item.totalAmount?.N ? parseFloat(item.totalAmount.N) : 0,
      deliveryAddress: item.deliveryAddress?.S
        ? JSON.parse(item.deliveryAddress.S)
        : null,
      status: item.status?.S,
      createdAt: item.createdAt?.S,
      updatedAt: item.updatedAt?.S,
    }));

    console.log(`Retrieved ${orders.length} orders`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      },
      body: JSON.stringify({
        success: true,
        orders,
        count: orders.length,
        hasMore: !!(result as { LastEvaluatedKey?: unknown }).LastEvaluatedKey,
      }),
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error querying orders', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to query orders',
        error: errorMessage,
      }),
    };
  }
};
