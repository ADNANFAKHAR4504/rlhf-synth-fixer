import {
  AttributeValue,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { randomUUID } from 'crypto';

// Custom type definitions for Lambda events
interface APIGatewayProxyEvent {
  body?: string;
  headers?: { [name: string]: string };
  httpMethod: string;
  path: string;
  queryStringParameters?: { [name: string]: string };
  pathParameters?: { [name: string]: string };
  stageVariables?: { [name: string]: string };
  requestContext: Record<string, unknown>;
  resource: string;
  multiValueHeaders?: { [name: string]: string[] };
  multiValueQueryStringParameters?: { [name: string]: string[] };
  isBase64Encoded: boolean;
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers?: { [header: string]: boolean | number | string };
  multiValueHeaders?: { [header: string]: (boolean | number | string)[] };
  body: string;
  isBase64Encoded?: boolean;
}

interface CreateItemRequest {
  name: string;
  description?: string;
}

interface DynamoDBItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string; // Add index signature for compatibility
}

// Helper function to convert JavaScript object to DynamoDB format
function marshall(
  obj: Record<string, unknown>
): Record<string, AttributeValue> {
  const marshalled: Record<string, AttributeValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      marshalled[key] = { S: value };
    } else if (typeof value === 'number') {
      marshalled[key] = { N: value.toString() };
    } else if (typeof value === 'boolean') {
      marshalled[key] = { BOOL: value };
    } else if (value === null) {
      marshalled[key] = { NULL: true };
    } else if (Array.isArray(value)) {
      // For arrays, we'll convert each item to a simple string representation
      marshalled[key] = { L: value.map(item => ({ S: String(item) })) };
    } else if (typeof value === 'object' && value !== null) {
      // For objects, we'll convert to a simple string representation
      marshalled[key] = { S: JSON.stringify(value) };
    }
  }
  return marshalled;
}

const dynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Create Item function invoked', JSON.stringify(event, null, 2));

  try {
    // Validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const requestBody: CreateItemRequest = JSON.parse(event.body);

    if (!requestBody.name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Name is required' }),
      };
    }

    // Verify access to secrets (demonstrates secrets manager integration)
    try {
      const secretCommand = new GetSecretValueCommand({
        SecretId: process.env.SECRET_ARN,
      });
      await secretsClient.send(secretCommand);
      console.log('Successfully accessed application secrets');
    } catch (error) {
      console.error('Failed to access secrets:', error);
    }

    // Create item in DynamoDB
    const item: DynamoDBItem = {
      id: randomUUID(),
      name: requestBody.name,
      description: requestBody.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const putCommand = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(item),
    });

    await dynamoClient.send(putCommand);

    console.log('Item created successfully:', item.id);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Item created successfully',
        item: item,
      }),
    };
  } catch (error) {
    console.error('Error creating item:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
