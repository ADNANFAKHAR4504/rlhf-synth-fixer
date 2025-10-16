import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const s3Client = new S3Client({ region: process.env.REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

interface FileMetadata {
  id: string;
  timestamp: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  fileName: string;
  fileKey: string;
  fileSize: number;
  contentType: string;
  uploadedBy?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

/**
 * File processing handler that manages file uploads to S3 and tracks metadata in DynamoDB
 * Supports file validation, metadata tracking, and secure file access
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('File Processing Event:', JSON.stringify(event));

  const bucketName = process.env.S3_BUCKET_NAME;
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const { httpMethod, body, pathParameters, queryStringParameters } = event;

  if (!bucketName || !tableName) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Bucket name or table name not configured',
      }),
    };
  }

  try {
    let response: unknown;
    let statusCode = 200;

    switch (httpMethod) {
      case 'POST':
        // Upload file with metadata tracking
        const fileData = JSON.parse(body || '{}');

        // Validation
        if (!fileData.fileName) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'fileName is required',
            }),
          };
        }

        const contentType = fileData.contentType || 'application/octet-stream';
        if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: `Content type ${contentType} not allowed`,
              allowedTypes: ALLOWED_CONTENT_TYPES,
            }),
          };
        }

        const content = fileData.content || '';
        const fileSize = Buffer.byteLength(content, 'utf8');

        if (fileSize > MAX_FILE_SIZE) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: `File size ${fileSize} exceeds maximum ${MAX_FILE_SIZE} bytes`,
            }),
          };
        }

        const fileId = `file-${Date.now()}`;
        const fileKey = `uploads/${fileId}/${fileData.fileName}`;

        // Upload to S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: content,
            ContentType: contentType,
            Metadata: {
              uploadedBy: fileData.uploadedBy || 'system',
              uploadTimestamp: new Date().toISOString(),
            },
          })
        );

        // Store metadata in DynamoDB
        const metadata: FileMetadata = {
          id: fileId,
          timestamp: Date.now(),
          status: 'uploaded',
          fileName: fileData.fileName,
          fileKey: fileKey,
          fileSize: fileSize,
          contentType: contentType,
          uploadedBy: fileData.uploadedBy || 'system',
          tags: fileData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await dynamodb.send(
          new PutCommand({
            TableName: tableName,
            Item: metadata,
          })
        );

        // Generate presigned URL for download
        const downloadUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
          }),
          { expiresIn: 3600 } // 1 hour
        );

        statusCode = 201;
        response = {
          message: 'File uploaded successfully',
          file: {
            ...metadata,
            downloadUrl,
          },
        };
        break;

      case 'GET':
        if (pathParameters?.filename) {
          // Get specific file metadata and generate presigned URL
          const getFileId = pathParameters.filename;

          // Query DynamoDB for file metadata
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              KeyConditionExpression: 'id = :id',
              ExpressionAttributeValues: {
                ':id': getFileId,
              },
            })
          );

          if (!queryResult.Items || queryResult.Items.length === 0) {
            statusCode = 404;
            response = { error: 'File not found' };
          } else {
            const fileMetadata = queryResult.Items[0] as FileMetadata;

            // Generate presigned URL
            const downloadUrl = await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: bucketName,
                Key: fileMetadata.fileKey,
              }),
              { expiresIn: 3600 }
            );

            response = {
              ...fileMetadata,
              downloadUrl,
            };
          }
        } else if (queryStringParameters?.status) {
          // Query files by status using GSI
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
            })
          );

          response = {
            files: queryResult.Items || [],
            count: queryResult.Count,
          };
        } else {
          // List all file metadata from DynamoDB
          const queryResult = await dynamodb.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'StatusIndex',
              KeyConditionExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':status': 'uploaded',
              },
              Limit: 20,
            })
          );

          response = {
            files: queryResult.Items || [],
            count: queryResult.Count,
          };
        }
        break;

      case 'DELETE':
        // Delete file from S3 and metadata from DynamoDB
        if (!pathParameters?.filename) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'File ID required for deletion',
            }),
          };
        }

        const deleteFileId = pathParameters.filename;

        // Get file metadata
        const deleteQueryResult = await dynamodb.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
              ':id': deleteFileId,
            },
          })
        );

        if (!deleteQueryResult.Items || deleteQueryResult.Items.length === 0) {
          statusCode = 404;
          response = { error: 'File not found' };
        } else {
          const fileMetadata = deleteQueryResult.Items[0] as FileMetadata;

          // Delete from S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fileMetadata.fileKey,
            })
          );

          // Delete from DynamoDB
          await dynamodb.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                id: fileMetadata.id,
                timestamp: fileMetadata.timestamp,
              },
            })
          );

          response = {
            message: 'File deleted successfully',
            fileId: deleteFileId,
          };
        }
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
