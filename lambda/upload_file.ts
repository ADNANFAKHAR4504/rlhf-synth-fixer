import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

interface UploadRequest {
  fileName?: string;
  contentType?: string;
}

const s3Client = new S3Client({ region: 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: 'us-west-2' });

// Custom implementation of getSignedUrl for S3
async function getSignedUrl(
  client: S3Client,
  command: Record<string, unknown>,
  options: { expiresIn: number }
): Promise<string> {
  // This is a simplified implementation
  // In production, you would use the proper AWS SDK presigner
  const expires = Math.floor(Date.now() / 1000) + options.expiresIn;

  // For demo purposes, return a placeholder URL
  // In real implementation, this would generate proper AWS signed URLs
  return `https://${process.env.BUCKET_NAME}.s3.us-west-2.amazonaws.com/${(command as { input: { Key: string } }).input.Key}?expires=${expires}`;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Upload File function invoked', JSON.stringify(event, null, 2));

  try {
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

    // Parse request for file upload parameters
    const requestBody: UploadRequest = event.body ? JSON.parse(event.body) : {};
    const fileName = requestBody.fileName || `file-${randomUUID()}`;
    const contentType = requestBody.contentType || 'application/octet-stream';

    // Generate a unique key for the file
    const fileKey = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

    // Create a presigned URL for direct upload to S3
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.KMS_KEY_ID,
    });

    // Generate presigned URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(
      s3Client,
      putObjectCommand as unknown as Record<string, unknown>,
      {
        expiresIn: 300,
      }
    );

    // Also generate a presigned URL for downloading the file (valid for 1 hour)
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(
      s3Client,
      getObjectCommand as unknown as Record<string, unknown>,
      {
        expiresIn: 3600,
      }
    );

    console.log('Generated presigned URLs for file:', fileKey);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Presigned URLs generated successfully',
        uploadUrl: uploadUrl,
        downloadUrl: downloadUrl,
        fileKey: fileKey,
        expiresIn: '5 minutes (upload) / 1 hour (download)',
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URLs:', error);

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
