import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    // Handle POST - Create webhook
    if (event.httpMethod === 'POST') {
      const webhookId = uuidv4();
      const timestamp = Date.now();
      const expiryTime = timestamp + 7 * 24 * 60 * 60 * 1000; // 7 days from now

      const body = JSON.parse(event.body || '{}');

      // Store webhook in DynamoDB
      await dynamoClient.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: {
            webhookId: { S: webhookId },
            timestamp: { N: timestamp.toString() },
            expiryTime: { N: Math.floor(expiryTime / 1000).toString() },
            payload: { S: JSON.stringify(body) },
            status: { S: 'pending' },
          },
        })
      );

      // Send message to SQS for processing
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            webhookId,
            payload: body,
          }),
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          webhookId,
          message: 'Webhook received and queued for processing',
        }),
      };
    }

    // Handle GET - Query webhook status
    if (event.httpMethod === 'GET') {
      const webhookId = event.queryStringParameters?.webhookId;

      if (!webhookId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'webhookId query parameter is required',
          }),
        };
      }

      const result = await dynamoClient.send(
        new GetItemCommand({
          TableName: TABLE_NAME,
          Key: {
            webhookId: { S: webhookId },
          },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Webhook not found',
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          webhookId: result.Item.webhookId.S,
          status: result.Item.status.S,
          timestamp: result.Item.timestamp.N,
          processedAt: result.Item.processedAt?.N || null,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
