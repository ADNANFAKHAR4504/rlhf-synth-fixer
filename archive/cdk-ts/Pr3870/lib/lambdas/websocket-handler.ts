import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE_NAME = process.env.CONNECTIONS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const routeKey = event.requestContext.routeKey;

  try {
    switch (routeKey) {
      case '$connect':
        await handleConnect(connectionId!);
        break;
      case '$disconnect':
        await handleDisconnect(connectionId!);
        break;
      case '$default':
        await handleDefault(connectionId!, event.body);
        break;
      default:
        console.log('Unknown route:', routeKey);
    }

    return {
      statusCode: 200,
      body: 'Success',
    };
  } catch (error) {
    console.error('Error handling WebSocket event:', error);
    return {
      statusCode: 500,
      body: 'Failed to process request',
    };
  }
};

async function handleConnect(connectionId: string): Promise<void> {
  console.log('Client connected:', connectionId);

  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

  await docClient.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE_NAME,
      Item: {
        connectionId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    })
  );

  console.log('Connection stored:', connectionId);
}

async function handleDisconnect(connectionId: string): Promise<void> {
  console.log('Client disconnected:', connectionId);

  await docClient.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE_NAME,
      Key: {
        connectionId,
      },
    })
  );

  console.log('Connection removed:', connectionId);
}

async function handleDefault(
  connectionId: string,
  body: string | null
): Promise<void> {
  console.log('Default route called:', connectionId, body);

  // Handle custom messages if needed
  if (body) {
    const message = JSON.parse(body);
    console.log('Received message:', message);

    // You can add custom logic here to handle different message types
  }
}
