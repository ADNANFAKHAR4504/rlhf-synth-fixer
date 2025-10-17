import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.TABLE_NAME!;

interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  pathParameters?: { [key: string]: string };
  body?: string;
  requestContext: {
    requestId: string;
  };
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}

interface EducationalContent {
  contentId: string;
  title: string;
  description: string;
  contentType: string;
  subject: string;
  gradeLevel: string;
  contentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { httpMethod, path, pathParameters } = event;

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight response' }),
      };
    }

    // Route to appropriate handler
    if (path === '/content' && httpMethod === 'GET') {
      return await listContent(headers);
    }

    if (path === '/content' && httpMethod === 'POST') {
      return await createContent(event, headers);
    }

    if (path.startsWith('/content/') && httpMethod === 'GET') {
      const contentId = pathParameters?.id;
      if (!contentId) {
        return errorResponse(400, 'Missing content ID', headers);
      }
      return await getContent(contentId, headers);
    }

    if (path.startsWith('/content/') && httpMethod === 'PUT') {
      const contentId = pathParameters?.id;
      if (!contentId) {
        return errorResponse(400, 'Missing content ID', headers);
      }
      return await updateContent(contentId, event, headers);
    }

    if (path.startsWith('/content/') && httpMethod === 'DELETE') {
      const contentId = pathParameters?.id;
      if (!contentId) {
        return errorResponse(400, 'Missing content ID', headers);
      }
      return await deleteContent(contentId, headers);
    }

    return errorResponse(404, 'Route not found', headers);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : 'Internal server error',
      headers
    );
  }
};

async function listContent(headers: {
  [key: string]: string;
}): Promise<APIGatewayProxyResult> {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100,
    });

    const response = await dynamoClient.send(command);
    const items = response.Items?.map(item => unmarshall(item)) || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error listing content:', error);
    throw error;
  }
}

async function createContent(
  event: APIGatewayProxyEvent,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return errorResponse(400, 'Missing request body', headers);
    }

    const body = JSON.parse(event.body);
    const { title, description, contentType, subject, gradeLevel } = body;

    // Validation
    if (!title || !contentType || !subject || !gradeLevel) {
      return errorResponse(400, 'Missing required fields', headers);
    }

    const contentId = `content-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const content: EducationalContent = {
      contentId,
      title,
      description: description || '',
      contentType,
      subject,
      gradeLevel,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(content),
    });

    await dynamoClient.send(command);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
}

async function getContent(
  contentId: string,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    const response = await dynamoClient.send(command);

    if (!response.Item) {
      return errorResponse(404, 'Content not found', headers);
    }

    const content = unmarshall(response.Item);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(content),
    };
  } catch (error) {
    console.error('Error getting content:', error);
    throw error;
  }
}

async function updateContent(
  contentId: string,
  event: APIGatewayProxyEvent,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return errorResponse(400, 'Missing request body', headers);
    }

    const body = JSON.parse(event.body);
    const { title, description, contentType, subject, gradeLevel } = body;

    // Check if content exists
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    const getResponse = await dynamoClient.send(getCommand);
    if (!getResponse.Item) {
      return errorResponse(404, 'Content not found', headers);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: Record<string, string> = {};

    if (title) {
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = title;
    }

    if (description !== undefined) {
      updateExpressions.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (contentType) {
      updateExpressions.push('#contentType = :contentType');
      expressionAttributeNames['#contentType'] = 'contentType';
      expressionAttributeValues[':contentType'] = contentType;
    }

    if (subject) {
      updateExpressions.push('#subject = :subject');
      expressionAttributeNames['#subject'] = 'subject';
      expressionAttributeValues[':subject'] = subject;
    }

    if (gradeLevel) {
      updateExpressions.push('#gradeLevel = :gradeLevel');
      expressionAttributeNames['#gradeLevel'] = 'gradeLevel';
      expressionAttributeValues[':gradeLevel'] = gradeLevel;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateCommand = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ReturnValues: 'ALL_NEW',
    });

    const updateResponse = await dynamoClient.send(updateCommand);
    const updatedContent = unmarshall(updateResponse.Attributes!);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedContent),
    };
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

async function deleteContent(
  contentId: string,
  headers: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    // Check if content exists
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    const getResponse = await dynamoClient.send(getCommand);
    if (!getResponse.Item) {
      return errorResponse(404, 'Content not found', headers);
    }

    const deleteCommand = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ contentId }),
    });

    await dynamoClient.send(deleteCommand);

    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
}

function errorResponse(
  statusCode: number,
  message: string,
  headers: { [key: string]: string }
): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error: message }),
  };
}
