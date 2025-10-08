import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Context } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { normalizeEvent } from './normalize-event';

type APIGatewayProxyResult = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

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
    'Access-Control-Allow-Origin':
      process.env.ALLOWED_ORIGINS ?? 'https://localhost:3000',
  },
  body: JSON.stringify(payload),
});

export const handler = async (
  event: unknown,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const normalized = normalizeEvent(event);
  const tableName = process.env.PRODUCT_TABLE_NAME;
  const notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN;

  if (!tableName || !notificationTopicArn) {
    console.error(
      'Missing required environment variables for product service.',
      {
        tableName,
        notificationTopicArn,
      }
    );
    return respond(500, { message: 'Service misconfiguration detected.' });
  }

  try {
    const method = normalized.httpMethod?.toUpperCase();
    const productId = normalized.pathParameters?.productId;

    switch (method) {
      case 'GET': {
        if (productId) {
          const result = await dynamoDocumentClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { productId },
            })
          );
          if (!result.Item) {
            return respond(404, { message: 'Product not found.' });
          }
          return respond(200, result.Item);
        }

        const list = await dynamoDocumentClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: 'byEntityType',
            KeyConditionExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
              ':entityType': 'PRODUCT',
            },
            ProjectionExpression:
              'productId, #name, price, inventory, updatedAt',
            ExpressionAttributeNames: {
              '#name': 'name',
            },
            Limit: 50,
            ScanIndexForward: false,
          })
        );

        return respond(200, list.Items ?? []);
      }
      case 'POST': {
        if (!normalized.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(normalized.body) as {
          name?: string;
          description?: string;
          price?: number;
          inventory?: number;
        };

        if (
          !payload.name ||
          payload.price === undefined ||
          payload.inventory === undefined
        ) {
          return respond(422, {
            message: 'name, price, and inventory are required.',
          });
        }
        if (payload.price < 0 || payload.inventory < 0) {
          return respond(422, {
            message: 'price and inventory must be positive values.',
          });
        }

        const productItem = {
          productId: `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          entityType: 'PRODUCT',
          name: payload.name,
          description: payload.description ?? '',
          price: Number(payload.price.toFixed(2)),
          inventory: Math.floor(payload.inventory),
        };

        await dynamoDocumentClient.send(
          new PutCommand({
            TableName: tableName,
            Item: productItem,
            ConditionExpression: 'attribute_not_exists(productId)',
          })
        );

        await snsClient.send(
          new PublishCommand({
            TopicArn: notificationTopicArn,
            Subject: 'product.created',
            Message: JSON.stringify({
              productId: productItem.productId,
              price: productItem.price,
            }),
            MessageAttributes: {
              severity: { DataType: 'String', StringValue: 'info' },
              correlationId: {
                DataType: 'String',
                StringValue: context.awsRequestId,
              },
            },
          })
        );

        return respond(201, { productId: productItem.productId });
      }
      case 'PUT': {
        if (!productId) {
          return respond(400, {
            message: 'productId path parameter is required.',
          });
        }
        if (!normalized.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(normalized.body) as {
          name?: string;
          description?: string;
          price?: number;
          inventory?: number;
        };

        if (
          payload.price !== undefined &&
          (Number.isNaN(payload.price) || payload.price < 0)
        ) {
          return respond(422, { message: 'price must be a positive number.' });
        }
        if (
          payload.inventory !== undefined &&
          (Number.isNaN(payload.inventory) || payload.inventory < 0)
        ) {
          return respond(422, {
            message: 'inventory must be a positive integer.',
          });
        }

        const expressionAttributeNames: Record<string, string> = {
          '#updatedAt': 'updatedAt',
        };
        const expressionAttributeValues: Record<string, unknown> = {
          ':updatedAt': new Date().toISOString(),
        };
        const expressionSegments: string[] = [];

        if (payload.name) {
          expressionAttributeNames['#name'] = 'name';
          expressionAttributeValues[':name'] = payload.name;
          expressionSegments.push('#name = :name');
        }
        if (payload.description !== undefined) {
          expressionAttributeNames['#description'] = 'description';
          expressionAttributeValues[':description'] = payload.description;
          expressionSegments.push('#description = :description');
        }
        if (payload.price !== undefined) {
          expressionAttributeNames['#price'] = 'price';
          expressionAttributeValues[':price'] = Number(
            payload.price.toFixed(2)
          );
          expressionSegments.push('#price = :price');
        }
        if (payload.inventory !== undefined) {
          expressionAttributeNames['#inventory'] = 'inventory';
          expressionAttributeValues[':inventory'] = Math.floor(
            payload.inventory
          );
          expressionSegments.push('#inventory = :inventory');
        }

        if (!expressionSegments.length) {
          return respond(422, { message: 'No updates supplied.' });
        }

        expressionSegments.push('#updatedAt = :updatedAt');

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { productId },
            UpdateExpression: `SET ${expressionSegments.join(', ')}`,
            ConditionExpression: 'attribute_exists(productId)',
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
          })
        );

        return respond(200, { message: 'Product updated successfully.' });
      }
      case 'DELETE': {
        if (!productId) {
          return respond(400, {
            message: 'productId path parameter is required.',
          });
        }

        await dynamoDocumentClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { productId },
            ConditionExpression: 'attribute_exists(productId)',
          })
        );

        return {
          statusCode: 204,
          headers: {
            'Access-Control-Allow-Origin':
              process.env.ALLOWED_ORIGINS ?? 'https://localhost:3000',
          },
          body: '',
        };
      }
      default:
        return respond(405, { message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    console.error('Unhandled error in product service.', { error });
    return respond(500, { message: 'Internal server error.' });
  }
};

// Duplicate local test handler removed to avoid redeclaration of `handler`.
// The module exports the full Lambda handler implemented above.
