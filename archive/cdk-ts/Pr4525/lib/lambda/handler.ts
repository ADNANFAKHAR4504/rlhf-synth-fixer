import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

// Initialize AWS SDK clients with proper configuration
const client = new DynamoDBClient({
  region: process.env.REGION || 'us-west-2',
  maxAttempts: 3,
  retryMode: 'adaptive',
});
const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
});

// Initialize PowerTools
const logger = new Logger({ serviceName: 'serverless-function' });
const tracer = new Tracer({ serviceName: 'serverless-function' });

interface User {
  UserId: string;
  name?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

// interface ApiResponse {
//   success: boolean;
//   data?: any;
//   error?: string;
//   message?: string;
//   requestId?: string;
// }

// Validation function
const validateUser = (user: Partial<User>): string[] => {
  const errors: string[] = [];

  if (
    !user.UserId ||
    typeof user.UserId !== 'string' ||
    user.UserId.trim() === ''
  ) {
    errors.push('UserId is required and must be a non-empty string');
  }

  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Email must be a valid email address');
  }

  return errors;
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Add trace annotations
  tracer.putAnnotation('environment', process.env.ENVIRONMENT || 'unknown');
  tracer.putAnnotation('tableName', process.env.TABLE_NAME || 'unknown');

  // Log the incoming event
  logger.info('Received request', {
    requestId: context.awsRequestId,
    path: event.path,
    method: event.httpMethod,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      throw new Error('TABLE_NAME environment variable is not set');
    }

    // Handle GET request
    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId;

      if (userId) {
        // Get specific user
        const segment = tracer.getSegment();
        const subsegment = segment?.addNewSubsegment('DynamoDB GetItem');

        try {
          const result = await dynamoDb.send(
            new GetCommand({
              TableName: tableName,
              Key: { UserId: userId },
            })
          );

          logger.info('User retrieved successfully', { userId });

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin':
                process.env.CORS_ORIGIN || 'https://example.com',
            },
            body: JSON.stringify({
              success: true,
              data: result.Item || null,
            }),
          };
        } finally {
          subsegment?.close();
        }
      } else {
        // For demo purposes, create a sample user
        const sampleUser: User = {
          UserId: `user-${Date.now()}`,
          name: 'Sample User',
          email: 'sample@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const segment = tracer.getSegment();
        const subsegment = segment?.addNewSubsegment('DynamoDB PutItem');

        try {
          await dynamoDb.send(
            new PutCommand({
              TableName: tableName,
              Item: sampleUser,
              ConditionExpression: 'attribute_not_exists(UserId)',
            })
          );

          logger.info('User created successfully', {
            userId: sampleUser.UserId,
          });

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin':
                process.env.CORS_ORIGIN || 'https://example.com',
            },
            body: JSON.stringify({
              success: true,
              message: 'Sample user created',
              data: sampleUser,
            }),
          };
        } catch (error) {
          if ((error as any).name === 'ConditionalCheckFailedException') {
            logger.warn('User already exists', { userId: sampleUser.UserId });
            return {
              statusCode: 409,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin':
                  process.env.CORS_ORIGIN || 'https://example.com',
              },
              body: JSON.stringify({
                success: false,
                error: 'User already exists',
              }),
            };
          }
          throw error;
        } finally {
          subsegment?.close();
        }
      }
    }

    // Handle POST request (if body is provided)
    if (event.httpMethod === 'POST' && event.body) {
      let userData: User;

      try {
        userData = JSON.parse(event.body) as User;
      } catch (error) {
        logger.warn('Invalid JSON in request body', { error: error as Error });
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':
              process.env.CORS_ORIGIN || 'https://example.com',
          },
          body: JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body',
          }),
        };
      }

      // Validate user data
      const validationErrors = validateUser(userData);
      if (validationErrors.length > 0) {
        logger.warn('User validation failed', { errors: validationErrors });
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':
              process.env.CORS_ORIGIN || 'https://example.com',
          },
          body: JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: validationErrors,
          }),
        };
      }

      userData.createdAt = new Date().toISOString();
      userData.updatedAt = new Date().toISOString();

      try {
        await dynamoDb.send(
          new PutCommand({
            TableName: tableName,
            Item: userData,
            ConditionExpression: 'attribute_not_exists(UserId)',
          })
        );

        logger.info('User saved successfully', { userId: userData.UserId });

        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':
              process.env.CORS_ORIGIN || 'https://example.com',
          },
          body: JSON.stringify({
            success: true,
            data: userData,
          }),
        };
      } catch (error) {
        if ((error as any).name === 'ConditionalCheckFailedException') {
          logger.warn('User already exists', { userId: userData.UserId });
          return {
            statusCode: 409,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin':
                process.env.CORS_ORIGIN || 'https://example.com',
            },
            body: JSON.stringify({
              success: false,
              error: 'User already exists',
            }),
          };
        }
        throw error;
      }
    }

    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':
          process.env.CORS_ORIGIN || 'https://example.com',
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
    };
  } catch (error) {
    logger.error('Error processing request', error as Error);
    tracer.addErrorAsMetadata(error as Error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':
          process.env.CORS_ORIGIN || 'https://example.com',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        requestId: context.awsRequestId,
      }),
    };
  }
};
