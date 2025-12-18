import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface DocumentUploadRequest {
  fileName: string;
  content: string;
  contentType?: string;
}

interface DocumentMetadata {
  documentId: string;
  uploadTimestamp: number;
  fileName: string;
  bucket: string;
  key: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  status: string;
  userId: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('API handler event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, body, requestContext } = event;
  const userId = requestContext.authorizer?.userId || 'anonymous';

  try {
    if (httpMethod === 'POST' && path === '/documents') {
      // Document upload
      const requestBody: DocumentUploadRequest = JSON.parse(body || '{}');
      const { fileName, content, contentType } = requestBody;

      if (!fileName || !content) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'fileName and content are required' }),
        };
      }

      // Validate file size (max 10MB)
      const contentSize = Buffer.byteLength(content, 'base64');
      if (contentSize > 10 * 1024 * 1024) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        };
      }

      // Validate file name
      if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid file name' }),
        };
      }

      // Validate content type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'image/jpeg',
        'image/png',
      ];
      if (contentType && !allowedTypes.includes(contentType)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unsupported content type' }),
        };
      }

      const documentId = randomUUID();
      const key = `documents/${userId}/${documentId}-${fileName}`;

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.DOCUMENTS_BUCKET,
          Key: key,
          Body: Buffer.from(content, 'base64'),
          ContentType: contentType || 'application/octet-stream',
          Metadata: {
            userId,
            documentId,
          },
        })
      );

      // Store metadata in DynamoDB
      const uploadTimestamp = Date.now();
      const item: DocumentMetadata = {
        documentId,
        uploadTimestamp,
        fileName,
        bucket: process.env.DOCUMENTS_BUCKET!,
        key,
        size: Buffer.byteLength(content, 'base64'),
        contentType: contentType || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        userId,
      };

      await docClient.send(
        new PutCommand({
          TableName: process.env.DOCUMENTS_TABLE,
          Item: item,
        })
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          message: 'Document uploaded successfully',
          key,
        }),
      };
    }

    if (httpMethod === 'GET' && path.startsWith('/documents/')) {
      // Document retrieval
      const pathParts = path.split('/');
      const documentId = pathParts[2];

      // If uploadTimestamp is provided in the path, use it for exact lookup
      if (pathParts.length > 3) {
        const uploadTimestamp = parseInt(pathParts[3], 10);
        const result = await docClient.send(
          new GetCommand({
            TableName: process.env.DOCUMENTS_TABLE,
            Key: {
              documentId,
              uploadTimestamp,
            },
          })
        );

        if (!result.Item) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Document not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.Item),
        };
      } else {
        // If only documentId is provided, query for the most recent version
        const result = await docClient.send(
          new QueryCommand({
            TableName: process.env.DOCUMENTS_TABLE,
            KeyConditionExpression: 'documentId = :documentId',
            ExpressionAttributeValues: {
              ':documentId': documentId,
            },
            ScanIndexForward: false, // Most recent first
            Limit: 1,
          })
        );

        if (!result.Items || result.Items.length === 0) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Document not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.Items[0]),
        };
      }
    }

    if (httpMethod === 'GET' && path === '/documents') {
      // List documents using GSI for efficient querying
      const queryParams = {
        TableName: process.env.DOCUMENTS_TABLE,
        IndexName: 'userId-uploadTimestamp-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Most recent first
        Limit: 50,
      };

      const result = await docClient.send(new QueryCommand(queryParams));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: result.Items,
          count: result.Count,
          lastEvaluatedKey: result.LastEvaluatedKey,
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error: any) {
    console.error('API handler error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Validation error',
          details: error.message,
        }),
      };
    }

    if (error.name === 'ResourceNotFoundException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Resource not found' }),
      };
    }

    if (error.name === 'AccessDeniedException') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Default error response
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: event.requestContext?.requestId || 'unknown',
      }),
    };
  }
};
