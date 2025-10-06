import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME || 'events-table';
const BUCKET_NAME = process.env.BUCKET_NAME || 'lambda-code-bucket';

interface Event {
  id: string;
  timestamp: string;
  data: Record<string, unknown>;
  method: string;
  path: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, pathParameters, body } = event;

    // Log to S3 for audit purposes
    await logToS3(event);

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getEvent(pathParameters.id);
        }
        return await listEvents();

      case 'POST':
        return await createEvent(body);

      case 'DELETE':
        if (pathParameters?.id) {
          return await deleteEvent(pathParameters.id);
        }
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Event ID is required for deletion' }),
        };

      default:
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error processing request:', error);
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

async function logToS3(event: APIGatewayProxyEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const key = `logs/${timestamp.split('T')[0]}/${timestamp}-${uuidv4()}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(event),
        ContentType: 'application/json',
      })
    );
    console.log(`Logged event to S3: ${key}`);
  } catch (error) {
    console.error('Failed to log to S3:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

async function createEvent(
  body: string | null
): Promise<APIGatewayProxyResult> {
  if (!body || body.trim() === '' || body === 'null') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  let eventData;
  try {
    eventData = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  if (!eventData || Object.keys(eventData).length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body cannot be empty' }),
    };
  }

  const eventId = uuidv4();
  const timestamp = new Date().toISOString();

  const item: Event = {
    id: eventId,
    timestamp,
    data: eventData,
    method: 'POST',
    path: '/api/events',
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Event created successfully',
      event: item,
    }),
  };
}

async function getEvent(id: string): Promise<APIGatewayProxyResult> {
  // Query for items with this id (partition key)
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Event not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.Items[0]),
  };
}

async function listEvents(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100,
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: result.Items || [],
      count: result.Count || 0,
    }),
  };
}

async function deleteEvent(id: string): Promise<APIGatewayProxyResult> {
  // First, query to get the item with its timestamp
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
      Limit: 1,
    })
  );

  if (!queryResult.Items || queryResult.Items.length === 0) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Event not found' }),
    };
  }

  const item = queryResult.Items[0];

  // Now delete using both id and timestamp
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        id: item.id,
        timestamp: item.timestamp,
      },
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Event deleted successfully' }),
  };
}
