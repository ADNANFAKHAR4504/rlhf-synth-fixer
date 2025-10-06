import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDocumentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);
const snsClient = new SNSClient({});

const respond = (
  statusCode: number,
  payload: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(payload),
});

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const orderTableName = process.env.ORDER_TABLE_NAME;
  const productTableName = process.env.PRODUCT_TABLE_NAME;
  const userTableName = process.env.USER_TABLE_NAME;
  const topicArn = process.env.NOTIFICATION_TOPIC_ARN;

  if (!orderTableName || !productTableName || !userTableName || !topicArn) {
    console.error(
      'Missing required environment configuration for order service.',
      {
        orderTableName,
        productTableName,
        userTableName,
        topicArn,
      }
    );
    return respond(500, { message: 'Service misconfiguration detected.' });
  }

  try {
    const method = event.httpMethod?.toUpperCase();
    const orderId = event.pathParameters?.orderId;

    switch (method) {
      case 'GET': {
        if (orderId) {
          const order = await dynamoDocumentClient.send(
            new GetCommand({
              TableName: orderTableName,
              Key: { orderId },
            })
          );

          if (!order.Item) {
            return respond(404, { message: 'Order not found.' });
          }

          return respond(200, order.Item);
        }

        const list = await dynamoDocumentClient.send(
          new ScanCommand({
            TableName: orderTableName,
            Limit: 50,
          })
        );

        return respond(200, list.Items ?? []);
      }
      case 'POST': {
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }
        const payload = JSON.parse(event.body) as {
          userId?: string;
          productId?: string;
          quantity?: number;
        };

        if (!payload.userId || !payload.productId || !payload.quantity) {
          return respond(422, {
            message: 'userId, productId, and quantity are required.',
          });
        }
        if (payload.quantity <= 0) {
          return respond(422, {
            message: 'quantity must be greater than zero.',
          });
        }

        const [user, product] = await Promise.all([
          dynamoDocumentClient.send(
            new GetCommand({
              TableName: userTableName,
              Key: { userId: payload.userId },
            })
          ),
          dynamoDocumentClient.send(
            new GetCommand({
              TableName: productTableName,
              Key: { productId: payload.productId },
            })
          ),
        ]);

        if (!user.Item) {
          return respond(404, { message: `User ${payload.userId} not found.` });
        }
        if (!product.Item) {
          return respond(404, {
            message: `Product ${payload.productId} not found.`,
          });
        }

        const availableInventory = product.Item.inventory as number | undefined;
        if (
          availableInventory === undefined ||
          availableInventory < payload.quantity
        ) {
          return respond(409, { message: 'Insufficient product inventory.' });
        }

        const orderRecord = {
          orderId: `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          productId: payload.productId,
          userId: payload.userId,
          quantity: payload.quantity,
          unitPrice: product.Item.price,
          totalPrice: Number(
            (product.Item.price * payload.quantity).toFixed(2)
          ),
          status: 'CREATED',
          createdAt: new Date().toISOString(),
          audit: {
            traceId: context.awsRequestId,
          },
        };

        await dynamoDocumentClient.send(
          new PutCommand({
            TableName: orderTableName,
            Item: orderRecord,
            ConditionExpression: 'attribute_not_exists(orderId)',
          })
        );

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: productTableName,
            Key: { productId: payload.productId },
            ConditionExpression: 'inventory >= :requested',
            UpdateExpression:
              'SET inventory = inventory - :requested, #updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':requested': payload.quantity,
              ':updatedAt': new Date().toISOString(),
            },
            ExpressionAttributeNames: {
              '#updatedAt': 'updatedAt',
            },
          })
        );

        await snsClient.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: 'order.created',
            Message: JSON.stringify({
              orderId: orderRecord.orderId,
              userId: orderRecord.userId,
              totalPrice: orderRecord.totalPrice,
            }),
            MessageAttributes: {
              eventType: { DataType: 'String', StringValue: 'order' },
              severity: { DataType: 'String', StringValue: 'high' },
            },
          })
        );

        return respond(201, { orderId: orderRecord.orderId });
      }
      case 'PATCH': {
        if (!orderId) {
          return respond(400, {
            message: 'orderId path parameter is required.',
          });
        }
        if (!event.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(event.body) as {
          status?: 'SHIPPED' | 'CANCELLED';
        };
        if (!payload.status) {
          return respond(422, { message: 'status field is required.' });
        }

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: orderTableName,
            Key: { orderId },
            UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
            ConditionExpression: 'attribute_exists(orderId)',
            ExpressionAttributeNames: {
              '#status': 'status',
              '#updatedAt': 'updatedAt',
            },
            ExpressionAttributeValues: {
              ':status': payload.status,
              ':updatedAt': new Date().toISOString(),
            },
          })
        );

        return respond(200, { message: 'Order status updated.' });
      }
      default:
        return respond(405, { message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    console.error('Unhandled error in order service.', { error });
    return respond(500, { message: 'Internal server error.' });
  }
};
