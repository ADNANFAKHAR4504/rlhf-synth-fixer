import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore express is installed at compile time
import express, { Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore express is installed at compile time
import serverless from 'serverless-http';
import { Readable } from 'stream';

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env['AWS_REGION'] || 'us-east-1',
});
const dynamoClient = new DynamoDBClient({
  region: process.env['AWS_REGION'] || 'us-east-1',
});
const ssmClient = new SSMClient({
  region: process.env['AWS_REGION'] || 'us-east-1',
});

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS middleware
app.use((req: Request, res: Response, next: any): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Amz-Date, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Middleware for logging
app.use((req: Request, _: Response, next: any) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.body,
  });
  next();
});

// Health check endpoint
app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env['FUNCTION_VERSION'] || 'unknown',
  });
});

// Get S3 object
app.get('/s3/object/:bucket/:key(*)', async (req: Request, res: Response) => {
  try {
    const { bucket, key } = req.params;
    console.log(`Getting object from S3: ${bucket}/${key}`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (response.Body) {
      const stream = response.Body as Readable;
      const chunks: Uint8Array[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const content = buffer.toString('utf-8');

      res.json({
        success: true,
        data: {
          bucket,
          key,
          content,
          contentType: response.ContentType,
          contentLength: response.ContentLength,
          lastModified: response.LastModified,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Object not found',
      });
    }
  } catch (error: any) {
    console.error('S3 GET error:', error);
    res.status(error.$metadata?.httpStatusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Put S3 object
app.put(
  '/s3/object/:bucket/:key(*)',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { bucket, key } = req.params;
      const { content, contentType = 'application/octet-stream' } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          error: 'Content is required',
        });
        return;
      }

      console.log(`Putting object to S3: ${bucket}/${key}`);

      // Decode base64 content if it's a string, otherwise use as-is
      let bodyContent: Buffer;
      if (typeof content === 'string') {
        // Try to decode as base64, fallback to UTF-8 if it fails
        try {
          bodyContent = Buffer.from(content, 'base64');
        } catch {
          bodyContent = Buffer.from(content, 'utf-8');
        }
      } else {
        bodyContent = Buffer.from(content);
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bodyContent,
        ContentType: contentType,
        // Use KMS if key id is provided (bucket enforces KMS in this stack)
        ServerSideEncryption: process.env['DATA_BUCKET_KMS_KEY_ID']
          ? 'aws:kms'
          : 'AES256',
        SSEKMSKeyId: process.env['DATA_BUCKET_KMS_KEY_ID'] || undefined,
        Metadata: {
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'lambda-api',
        },
      });

      const response = await s3Client.send(command);

      res.json({
        success: true,
        data: {
          bucket,
          key,
          etag: response.ETag,
          versionId: response.VersionId,
        },
      });
    } catch (error: any) {
      console.error('S3 PUT error:', error);
      res.status(error.$metadata?.httpStatusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get DynamoDB item
app.get('/dynamodb/item/:table/:key', async (req: Request, res: Response) => {
  try {
    const { table, key } = req.params;
    console.log(`Getting item from DynamoDB: ${table}/${key}`);

    if (!key) {
      res.status(400).json({
        success: false,
        error: 'Key is required',
      });
      return;
    }

    const command = new GetItemCommand({
      TableName: table,
      Key: {
        id: { S: key || '' },
      },
    });

    const response = await dynamoClient.send(command);

    if (response.Item) {
      res.json({
        success: true,
        data: {
          table,
          key,
          item: response.Item,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }
  } catch (error: any) {
    console.error('DynamoDB GET error:', error);
    res.status(error.$metadata?.httpStatusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Put DynamoDB item
app.put('/dynamodb/item/:table/:key', async (req: Request, res: Response) => {
  try {
    const { table, key } = req.params;
    const { data } = req.body;

    console.log(`Putting item to DynamoDB: ${table}/${key}`);

    const item: any = {
      id: { S: key },
      timestamp: { N: Date.now().toString() },
      lastModified: { S: new Date().toISOString() },
    };

    // Add custom data fields
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(field => {
        const value = data[field];
        if (typeof value === 'string') {
          item[field] = { S: value };
        } else if (typeof value === 'number') {
          item[field] = { N: value.toString() };
        } else if (typeof value === 'boolean') {
          item[field] = { BOOL: value };
        }
      });
    }

    const command = new PutItemCommand({
      TableName: table,
      Item: item,
      ReturnValues: 'ALL_OLD',
    });

    const response = await dynamoClient.send(command);

    res.json({
      success: true,
      data: {
        table,
        key,
        previousItem: response.Attributes,
        newItem: item,
      },
    });
  } catch (error: any) {
    console.error('DynamoDB PUT error:', error);
    res.status(error.$metadata?.httpStatusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get parameter from Parameter Store
app.get('/parameter/:name(*)', async (req: Request, res: Response) => {
  try {
    // Decode URL-encoded parameter name (handles slashes and special chars)
    const name = decodeURIComponent(req.params['name'] || '');

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Name is required',
      });
      return;
    }

    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);

    res.json({
      success: true,
      data: {
        name: response.Parameter?.Name,
        value: response.Parameter?.Value,
        type: response.Parameter?.Type,
      },
    });
  } catch (error: any) {
    console.error('SSM GET error:', error);
    res.status(error.$metadata?.httpStatusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler for unmatched routes
app.use((req: Request, res: Response): void => {
  console.error(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use((err: any, _: Request, res: Response): void => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  });
});

// Export handler with proper error handling
export const handler = serverless(app, {
  response: {
    isBase64Encoded: true,
  },
});
