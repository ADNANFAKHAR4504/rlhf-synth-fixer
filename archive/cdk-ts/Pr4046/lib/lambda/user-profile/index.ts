import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = process.env.TABLE_NAME!;
const USERNAME_INDEX = process.env.USERNAME_INDEX!;

// Response helper
const createResponse = (
  statusCode: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

// User interface
interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Main Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));

  try {
    const { httpMethod, resource, pathParameters, body } = event;

    // Route based on HTTP method and resource
    switch (resource) {
      case '/users':
        if (httpMethod === 'POST') {
          return await createUser(body);
        }
        break;

      case '/users/{userId}':
        const userId = pathParameters?.userId;
        if (!userId) {
          return createResponse(400, { error: 'Missing userId parameter' });
        }

        switch (httpMethod) {
          case 'GET':
            return await getUserById(userId);
          case 'PUT':
            return await updateUser(userId, body);
          case 'DELETE':
            return await deleteUser(userId);
        }
        break;

      case '/users/username/{username}':
        const username = pathParameters?.username;
        if (!username) {
          return createResponse(400, { error: 'Missing username parameter' });
        }
        if (httpMethod === 'GET') {
          return await getUserByUsername(username);
        }
        break;
    }

    return createResponse(404, { error: 'Resource not found' });
  } catch (error) {
    console.error('Handler error:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create a new user
async function createUser(body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const userData = JSON.parse(body);

    // Validate required fields
    if (!userData.username || !userData.email || !userData.fullName) {
      return createResponse(400, {
        error: 'Missing required fields: username, email, fullName',
      });
    }

    // Validate email format
    if (!validateEmail(userData.email)) {
      return createResponse(400, { error: 'Invalid email format' });
    }

    // Check if username already exists
    const existingUser = await queryUserByUsername(userData.username);
    if (existingUser) {
      return createResponse(409, { error: 'Username already exists' });
    }

    const user: User = {
      userId: uuidv4(),
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      address: userData.address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(user),
      ConditionExpression: 'attribute_not_exists(userId)',
    });

    await dynamoClient.send(command);
    console.log('User created successfully:', user.userId);

    return createResponse(201, { message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);

    if (error instanceof ConditionalCheckFailedException) {
      return createResponse(409, { error: 'User already exists' });
    }

    throw error;
  }
}

// Get user by ID
async function getUserById(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return createResponse(404, { error: 'User not found' });
    }

    const user = unmarshall(result.Item) as User;
    console.log('User retrieved successfully:', userId);

    return createResponse(200, { user });
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}

// Get user by username using GSI
async function getUserByUsername(
  username: string
): Promise<APIGatewayProxyResult> {
  try {
    const user = await queryUserByUsername(username);

    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    console.log('User retrieved by username successfully:', username);
    return createResponse(200, { user });
  } catch (error) {
    console.error('Get user by username error:', error);
    throw error;
  }
}

// Helper function to query user by username
async function queryUserByUsername(username: string): Promise<User | null> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: USERNAME_INDEX,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: marshall({
      ':username': username,
    }),
    Limit: 1,
  });

  const result = await dynamoClient.send(command);

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return unmarshall(result.Items[0]) as User;
}

// Update user
async function updateUser(
  userId: string,
  body: string | null
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updates = JSON.parse(body);

    // Build update expression dynamically
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    // Add fields to update
    const allowedUpdates = ['email', 'fullName', 'phoneNumber', 'address'];

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        if (field === 'email' && !validateEmail(updates[field])) {
          return createResponse(400, { error: 'Invalid email format' });
        }

        const placeholder = `#${field}`;
        expressionAttributeNames[placeholder] = field;
        expressionAttributeValues[`:${field}`] = updates[field];
        updateExpressions.push(`${placeholder} = :${field}`);
      }
    }

    const command = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamoClient.send(command);
    const updatedUser = result.Attributes
      ? unmarshall(result.Attributes)
      : null;

    console.log('User updated successfully:', userId);
    return createResponse(200, {
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof ConditionalCheckFailedException) {
      return createResponse(404, { error: 'User not found' });
    }

    throw error;
  }
}

// Delete user
async function deleteUser(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_OLD',
    });

    const result = await dynamoClient.send(command);

    if (!result.Attributes) {
      return createResponse(404, { error: 'User not found' });
    }

    console.log('User deleted successfully:', userId);
    return createResponse(200, { message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof ConditionalCheckFailedException) {
      return createResponse(404, { error: 'User not found' });
    }

    throw error;
  }
}
