import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION });
const dynamodb = DynamoDBDocumentClient.from(client);

interface ApplicationRecord {
  id: string;
  timestamp: number;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * CRUD operations handler for application records
 * Supports creating, reading, updating, and deleting records in DynamoDB
 * Also supports querying by status using GSI
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('CRUD Event:', JSON.stringify(event));

  const { httpMethod, pathParameters, body, queryStringParameters } = event;
  const tableName = process.env.DYNAMODB_TABLE_NAME;

  if (!tableName) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Table name not configured' }),
    };
  }

  try {
    let response: unknown;
    let statusCode = 200;

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get specific item by ID
          if (!pathParameters.timestamp) {
            return {
              statusCode: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                error: 'timestamp parameter is required for GET by ID',
              }),
            };
          }

          const result = await dynamodb.send(
            new GetCommand({
              TableName: tableName,
              Key: {
                id: pathParameters.id,
                timestamp: parseInt(pathParameters.timestamp),
              },
            })
          );

          if (!result.Item) {
            statusCode = 404;
            response = { error: 'Item not found' };
          } else {
            response = result.Item;
          }
        } else if (queryStringParameters?.status) {
          // Query by status using GSI
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'StatusIndex',
              KeyConditionExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':status': queryStringParameters.status,
              },
              Limit: 50,
              ScanIndexForward: false, // Sort by timestamp descending
            })
          );
          response = {
            items: queryResult.Items || [],
            count: queryResult.Count,
          };
        } else {
          // Scan all items
          const scanResult = await dynamodb.send(
            new ScanCommand({
              TableName: tableName,
              Limit: 20,
            })
          );
          response = {
            items: scanResult.Items || [],
            count: scanResult.Count,
          };
        }
        break;

      case 'POST':
        // Create new item
        const inputData = JSON.parse(body || '{}');

        // Validate required fields
        if (!inputData.title) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'title field is required',
            }),
          };
        }

        const newItem: ApplicationRecord = {
          id: inputData.id || `item-${Date.now()}`,
          timestamp: Date.now(),
          status: inputData.status || 'pending',
          title: inputData.title,
          description: inputData.description,
          data: inputData.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: inputData.createdBy || 'system',
        };

        await dynamodb.send(
          new PutCommand({
            TableName: tableName,
            Item: newItem,
          })
        );

        statusCode = 201;
        response = {
          message: 'Item created successfully',
          item: newItem,
        };
        break;

      case 'PUT':
        // Update existing item
        if (!pathParameters?.id || !pathParameters?.timestamp) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'id and timestamp parameters are required for update',
            }),
          };
        }

        const updateData = JSON.parse(body || '{}');

        // Build update expression
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};

        if (updateData.title) {
          updateExpressions.push('#title = :title');
          expressionAttributeNames['#title'] = 'title';
          expressionAttributeValues[':title'] = updateData.title;
        }

        if (updateData.description !== undefined) {
          updateExpressions.push('#description = :description');
          expressionAttributeNames['#description'] = 'description';
          expressionAttributeValues[':description'] = updateData.description;
        }

        if (updateData.status) {
          updateExpressions.push('#status = :status');
          expressionAttributeNames['#status'] = 'status';
          expressionAttributeValues[':status'] = updateData.status;
        }

        if (updateData.data) {
          updateExpressions.push('#data = :data');
          expressionAttributeNames['#data'] = 'data';
          expressionAttributeValues[':data'] = updateData.data;
        }

        // Always update the updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        if (updateExpressions.length === 1) {
          // Only updatedAt is being updated
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'No valid fields to update',
            }),
          };
        }

        const updateResult = await dynamodb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              id: pathParameters.id,
              timestamp: parseInt(pathParameters.timestamp),
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
          })
        );

        response = {
          message: 'Item updated successfully',
          item: updateResult.Attributes,
        };
        break;

      case 'DELETE':
        // Delete item
        if (!pathParameters?.id || !pathParameters?.timestamp) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'id and timestamp parameters are required for deletion',
            }),
          };
        }

        await dynamodb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              id: pathParameters.id,
              timestamp: parseInt(pathParameters.timestamp),
            },
          })
        );

        response = {
          message: 'Item deleted successfully',
          id: pathParameters.id,
          timestamp: pathParameters.timestamp,
        };
        break;

      default:
        statusCode = 405;
        response = { error: `Method ${httpMethod} not supported` };
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
      }),
    };
  }
};
