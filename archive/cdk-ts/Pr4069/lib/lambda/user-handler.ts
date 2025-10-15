/**
 * Lambda Handler for TAP Stack - User Management
 * Interacts with DynamoDB to perform CRUD operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Get table name from environment variable
const TABLE_NAME = process.env.USERTABLE_TABLE_NAME!;
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

interface DirectInvocationEvent {
  action: string;
  userId?: string;
  id?: string;
  data?: Record<string, unknown>;
  message?: string;
}

/**
 * Main Lambda handler
 * Supports API Gateway proxy integration and direct invocations
 */
export const handler = async (
  event: APIGatewayProxyEvent | DirectInvocationEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // Log the incoming event
  if (LOG_LEVEL === 'DEBUG') {
    console.log('Event:', JSON.stringify(event, null, 2));
  }

  try {
    // Handle direct Lambda invocations (for testing)
    if ('action' in event) {
      return await handleDirectInvocation(event as DirectInvocationEvent);
    }

    // Handle API Gateway proxy requests
    if ('httpMethod' in event) {
      return await handleApiGatewayRequest(event as APIGatewayProxyEvent);
    }

    // Default test response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Lambda function is working',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle direct Lambda invocations (for testing)
 */
async function handleDirectInvocation(
  event: DirectInvocationEvent
): Promise<APIGatewayProxyResult> {
  console.log(`Direct invocation - Action: ${event.action}`);

  switch (event.action) {
    case 'putItem':
      return await createUser(event.userId || event.id || '', event.data || {});

    case 'getItem':
      return await getUser(event.userId || event.id || '');

    case 'deleteItem':
      return await deleteUser(event.userId || event.id || '');

    case 'test':
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Test successful',
          tableName: TABLE_NAME,
          environment: ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
      };

    case 'log':
      console.log('Log test:', event.message || 'Test log message');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Log written successfully',
        }),
      };

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Unknown action',
          action: event.action,
        }),
      };
  }
}

/**
 * Handle API Gateway proxy requests
 */
async function handleApiGatewayRequest(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;
  const pathParameters = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  console.log(`API Gateway request: ${method} ${path}`);

  // Route the request
  if (path === '/items' && method === 'GET') {
    return await listUsers(event.queryStringParameters);
  }

  if (path === '/items' && method === 'POST') {
    return await createUser(body.userId, body);
  }

  if (path.startsWith('/items/') && method === 'GET') {
    const userId = pathParameters.id || path.split('/').pop() || '';
    return await getUser(userId);
  }

  if (path.startsWith('/items/') && method === 'PUT') {
    const userId = pathParameters.id || path.split('/').pop() || '';
    return await updateUser(userId, body);
  }

  if (path.startsWith('/items/') && method === 'DELETE') {
    const userId = pathParameters.id || path.split('/').pop() || '';
    return await deleteUser(userId);
  }

  if (path === '/health' && method === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'healthy',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Route not found
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'Not found',
      path,
      method,
    }),
  };
}

/**
 * Create a new user
 */
async function createUser(
  userId: string,
  data: Record<string, unknown>
): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  const item = {
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    environment: ENVIRONMENT,
  };

  console.log(`Creating user: ${userId}`);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'User created successfully',
      userId,
      item,
    }),
  };
}

/**
 * Get a user by ID
 */
async function getUser(userId: string): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  console.log(`Getting user: ${userId}`);

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'User not found',
        userId,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      user: result.Item,
    }),
  };
}

/**
 * Update a user
 */
async function updateUser(
  userId: string,
  data: Record<string, unknown>
): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  console.log(`Updating user: ${userId}`);

  // Build update expression
  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.keys(data).forEach((key, index) => {
    if (key !== 'userId') {
      updateExpressionParts.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = data[key];
    }
  });

  // Add updatedAt timestamp
  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'User updated successfully',
      userId,
    }),
  };
}

/**
 * Delete a user
 */
async function deleteUser(userId: string): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  console.log(`Deleting user: ${userId}`);

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'User deleted successfully',
      userId,
    }),
  };
}

/**
 * List all users (with pagination support)
 */
async function listUsers(
  queryParams: { [name: string]: string | undefined } | null = null
): Promise<APIGatewayProxyResult> {
  const limit = parseInt(queryParams?.limit || '50', 10);

  console.log(`Listing users (limit: ${limit})`);

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: limit,
    })
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      users: result.Items || [],
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    }),
  };
}
