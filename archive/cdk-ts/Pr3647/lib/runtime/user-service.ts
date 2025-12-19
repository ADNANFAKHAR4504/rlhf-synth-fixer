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
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
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
const secretsClient = new SecretsManagerClient({});

let cachedSecret: string | undefined;

const respond = (
  statusCode: number,
  payload: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin':
      process.env.ALLOWED_ORIGINS ?? 'https://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(payload),
});

async function resolveApiKey(secretArn: string): Promise<string> {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    })
  );

  if (!secret.SecretString) {
    throw new Error(
      'Secret payload is empty. Ensure the secret contains an apiKey attribute.'
    );
  }

  const parsedSecret = JSON.parse(secret.SecretString) as { apiKey?: string };
  if (!parsedSecret.apiKey) {
    throw new Error('apiKey field missing from secret payload.');
  }

  cachedSecret = parsedSecret.apiKey;
  return cachedSecret;
}

export const handler = async (
  event: unknown,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const normalized = normalizeEvent(event);
  const tableName = process.env.USER_TABLE_NAME;
  const notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN;
  const apiSecretArn = process.env.API_SECRET_ARN;

  if (!tableName || !notificationTopicArn || !apiSecretArn) {
    console.error('Missing required environment configuration.', {
      tableName,
      notificationTopicArn,
      apiSecretArn,
    });
    return respond(500, { message: 'Service misconfiguration detected.' });
  }

  try {
    const method = normalized.httpMethod?.toUpperCase();
    const userId = normalized.pathParameters?.userId;

    switch (method) {
      case 'GET': {
        if (userId) {
          const result = await dynamoDocumentClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { userId },
            })
          );

          if (!result.Item) {
            return respond(404, { message: 'User not found.' });
          }

          return respond(200, result.Item);
        }

        const list = await dynamoDocumentClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: 'byEntityType',
            KeyConditionExpression: 'entityType = :entityType',
            ExpressionAttributeValues: {
              ':entityType': 'USER',
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
          email?: string;
        };
        if (!payload.name || !payload.email) {
          return respond(422, {
            message: 'Both name and email fields are required.',
          });
        }

        const userItem = {
          userId: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          entityType: 'USER',
          name: payload.name,
          email: payload.email.toLowerCase(),
          audit: {
            traceId: context.awsRequestId,
          },
        };

        await dynamoDocumentClient.send(
          new PutCommand({
            TableName: tableName,
            Item: userItem,
            ConditionExpression: 'attribute_not_exists(userId)',
          })
        );

        const apiKey = await resolveApiKey(apiSecretArn);
        await snsClient.send(
          new PublishCommand({
            TopicArn: notificationTopicArn,
            Subject: 'user.created',
            Message: JSON.stringify({
              userId: userItem.userId,
              email: userItem.email,
            }),
            MessageAttributes: {
              purpose: { DataType: 'String', StringValue: 'lifecycle-event' },
              apiKey: {
                DataType: 'String',
                StringValue: apiKey.substring(0, 4).padEnd(8, '*'),
              },
            },
          })
        );

        return respond(201, { userId: userItem.userId });
      }
      case 'PUT': {
        if (!userId) {
          return respond(400, {
            message: 'userId path parameter is required.',
          });
        }
        if (!normalized.body) {
          return respond(400, { message: 'Missing request body.' });
        }

        const payload = JSON.parse(normalized.body) as {
          name?: string;
          email?: string;
        };
        if (!payload.name && !payload.email) {
          return respond(422, {
            message: 'Provide at least one attribute to update.',
          });
        }

        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};

        if (payload.name) {
          updateExpressions.push('#name = :name');
          expressionAttributeNames['#name'] = 'name';
          expressionAttributeValues[':name'] = payload.name;
        }
        if (payload.email) {
          updateExpressions.push('#email = :email');
          expressionAttributeNames['#email'] = 'email';
          expressionAttributeValues[':email'] = payload.email.toLowerCase();
        }

        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        await dynamoDocumentClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { userId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(userId)',
            ReturnValues: 'ALL_NEW',
          })
        );

        return respond(200, { message: 'User updated successfully.' });
      }
      case 'DELETE': {
        if (!userId) {
          return respond(400, {
            message: 'userId path parameter is required.',
          });
        }

        await dynamoDocumentClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { userId },
            ConditionExpression: 'attribute_exists(userId)',
          })
        );

        return {
          statusCode: 204,
          headers: {
            'Access-Control-Allow-Origin':
              process.env.ALLOWED_ORIGINS ?? 'https://localhost:3000',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: '',
        };
      }
      default:
        return respond(405, { message: `Unsupported method: ${method}` });
    }
  } catch (error) {
    console.error('Unhandled error in user service.', { error });
    return respond(500, { message: 'Internal server error.' });
  }
};
