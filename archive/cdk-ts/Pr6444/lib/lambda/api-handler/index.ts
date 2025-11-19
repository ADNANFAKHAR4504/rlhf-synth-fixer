import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const dynamodb = new DynamoDBClient({});
const sqs = new SQSClient({});

const REGION = process.env.REGION || 'us-east-1';
const SESSION_TABLE_NAME = process.env.SESSION_TABLE_NAME || '';
const TRADE_QUEUE_URL = process.env.TRADE_QUEUE_URL || '';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(`API request in ${REGION}: ${event.httpMethod} ${event.path}`);

  try {
    // Health check endpoint
    if (event.path === '/health' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'healthy',
          region: REGION,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // POST /trades - Submit new trade order
    if (event.path === '/trades' && event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Request body required' }),
        };
      }

      const trade = JSON.parse(event.body);
      const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create session entry
      const sessionCommand = new PutItemCommand({
        TableName: SESSION_TABLE_NAME,
        Item: {
          sessionId: { S: trade.userId || 'anonymous' },
          timestamp: { N: Date.now().toString() },
          orderId: { S: orderId },
          action: { S: 'ORDER_SUBMITTED' },
          region: { S: REGION },
        },
      });

      await dynamodb.send(sessionCommand);

      // Send trade to SQS for processing
      const sqsCommand = new SendMessageCommand({
        QueueUrl: TRADE_QUEUE_URL,
        MessageBody: JSON.stringify({
          orderId,
          ...trade,
          timestamp: Date.now(),
        }),
      });

      await sqs.send(sqsCommand);

      return {
        statusCode: 202,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'submitted',
          region: REGION,
        }),
      };
    }

    // GET /trades - List recent trades for user
    if (event.path === '/trades' && event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId || 'anonymous';

      const queryCommand = new QueryCommand({
        TableName: SESSION_TABLE_NAME,
        KeyConditionExpression: 'sessionId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
        },
        Limit: 20,
        ScanIndexForward: false,
      });

      const result = await dynamodb.send(queryCommand);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades: result.Items || [],
          region: REGION,
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
