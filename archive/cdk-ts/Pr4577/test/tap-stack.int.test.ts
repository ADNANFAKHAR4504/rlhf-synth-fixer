// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// AWS SDK clients
const dynamoClient = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const lambdaClient = new LambdaClient({ region });

// Extract outputs
const apiEndpoint =
  outputs.ApiEndpoint || outputs.TapRestApidev2Endpoint5853073A;
const s3BucketName = outputs.S3BucketName;
const dynamoTableName = outputs.DynamoDBTableName;
const secretName = outputs.SecretName;
const vpcId = outputs.VpcId;

// Lambda function names
const mainLambdaName = `tap-main-function-${environmentSuffix}`;
const crudLambdaName = `tap-crud-function-${environmentSuffix}`;
const fileProcessingLambdaName = `tap-file-processing-function-${environmentSuffix}`;

// Helper function to invoke Lambda functions directly
// This is needed because API Gateway is private (VPC endpoint only)
async function invokeLambda(
  functionName: string,
  path: string,
  method: string,
  body?: unknown,
  pathParameters?: Record<string, string>,
  queryStringParameters?: Record<string, string>
): Promise<{ status: number; data: unknown; headers: Record<string, string> }> {
  const event = {
    httpMethod: method,
    path: `/${environmentSuffix}/${path}`,
    pathParameters: pathParameters || null,
    queryStringParameters: queryStringParameters || null,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  };

  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(event),
  });

  const response = await lambdaClient.send(command);
  const payload = JSON.parse(new TextDecoder().decode(response.Payload));

  return {
    status: payload.statusCode || 200,
    data: payload.body ? JSON.parse(payload.body) : {},
    headers: payload.headers || {},
  };
}

// Test data cleanup helpers
const createdItemIds: Array<{ id: string; timestamp: number }> = [];
const createdFileIds: string[] = [];

afterAll(async () => {
  // Clean up created DynamoDB items
  for (const item of createdItemIds) {
    try {
      await dynamodb.send(
        new DeleteCommand({
          TableName: dynamoTableName,
          Key: item,
        })
      );
    } catch (error) {
      console.warn('Failed to cleanup item:', item, error);
    }
  }

  // Clean up created S3 files
  for (const fileId of createdFileIds) {
    try {
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: s3BucketName,
          Prefix: `uploads/${fileId}/`,
        })
      );

      if (listResult.Contents) {
        for (const object of listResult.Contents) {
          if (object.Key) {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: s3BucketName,
                Key: object.Key,
              })
            );
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup file:', fileId, error);
    }
  }
});

describe(`TAP Stack Integration Tests - ${environmentSuffix}`, () => {
  describe('Infrastructure Validation', () => {
    test('DynamoDB table exists and is accessible', async () => {
      const result = await dynamoClient.send(
        new DescribeTableCommand({ TableName: dynamoTableName })
      );

      expect(result.Table).toBeDefined();
      expect(result.Table?.TableName).toBe(dynamoTableName);
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
          expect.objectContaining({
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          }),
        ])
      );
    });

    test('DynamoDB table has StatusIndex GSI', async () => {
      const result = await dynamoClient.send(
        new DescribeTableCommand({ TableName: dynamoTableName })
      );

      expect(result.Table?.GlobalSecondaryIndexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'StatusIndex',
          }),
        ])
      );
    });

    test('S3 bucket exists and is accessible', async () => {
      const result = await s3Client.send(
        new HeadBucketCommand({ Bucket: s3BucketName })
      );

      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('Secrets Manager secret exists and is accessible', async () => {
      const result = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      expect(result.Name).toBe(secretName);
      expect(result.ARN).toBeDefined();
    });

    test('Lambda functions are accessible', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');
      expect(result.status).toBeLessThan(500);
    });
  });

  describe('Health Check Lambda (Main Handler)', () => {
    test('returns health status for all services', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        status: 'healthy',
        environment: environmentSuffix,
        region: region,
        timestamp: expect.any(String),
        services: expect.arrayContaining([
          expect.objectContaining({
            service: 'DynamoDB',
            status: 'healthy',
          }),
          expect.objectContaining({
            service: 'S3',
            status: 'healthy',
          }),
          expect.objectContaining({
            service: 'Secrets Manager',
            status: 'healthy',
          }),
        ]),
      });
    });

    test('includes CORS headers', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Content-Type']).toContain('application/json');
    });
  });

  describe('CRUD Lambda Operations', () => {
    test('creates a new item via POST', async () => {
      const newItem = {
        title: `Integration Test Item ${Date.now()}`,
        description: 'Test item created by integration tests',
        status: 'active',
        data: { testField: 'testValue' },
      };

      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'POST',
        newItem
      );

      expect(result.status).toBe(201);
      expect(result.data).toMatchObject({
        message: 'Item created successfully',
        item: expect.objectContaining({
          id: expect.any(String),
          timestamp: expect.any(Number),
          title: newItem.title,
          description: newItem.description,
          status: 'active',
        }),
      });

      // Track for cleanup
      const createdItem = (
        result.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });
    });

    test('retrieves items by status using GSI', async () => {
      // Create a test item first
      const newItem = {
        title: `Test for Query ${Date.now()}`,
        status: 'pending',
      };

      const createResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'POST',
        newItem
      );
      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });

      // Query by status
      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'GET',
        undefined,
        undefined,
        { status: 'pending' }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        items: expect.any(Array),
        count: expect.any(Number),
      });

      const items = (result.data as { items: Array<{ status: string }> }).items;
      expect(items.every(item => item.status === 'pending')).toBe(true);
    });

    test('updates an existing item via PUT', async () => {
      // Create item first
      const createResult = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        title: 'Item to Update',
      });

      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });

      // Update the item
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: 'completed',
      };

      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'PUT',
        updateData,
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        message: 'Item updated successfully',
        item: expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated description',
          status: 'completed',
        }),
      });
    });

    test('deletes an item via DELETE', async () => {
      // Create item first
      const createResult = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        title: 'Item to Delete',
      });

      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;

      // Delete the item
      const result = await invokeLambda(
        crudLambdaName,
        'crud',
        'DELETE',
        undefined,
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        message: 'Item deleted successfully',
        id: createdItem.id,
      });

      // Remove from cleanup array since it's already deleted
      const index = createdItemIds.findIndex(
        item =>
          item.id === createdItem.id && item.timestamp === createdItem.timestamp
      );
      if (index > -1) {
        createdItemIds.splice(index, 1);
      }
    });

    test('returns 400 for POST without required title field', async () => {
      const result = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        description: 'Missing title',
      });

      expect(result.status).toBe(400);
      expect(result.data).toMatchObject({
        error: 'title field is required',
      });
    });

    test('scans all items when no query parameters provided', async () => {
      const result = await invokeLambda(crudLambdaName, 'crud', 'GET');

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        items: expect.any(Array),
        count: expect.any(Number),
      });
    });
  });

  describe('File Processing Lambda', () => {
    test('uploads a file to S3 and creates metadata', async () => {
      const fileData = {
        fileName: `test-file-${Date.now()}.txt`,
        content: 'Test file content for integration testing',
        contentType: 'text/plain',
        uploadedBy: 'integration-test',
        tags: ['test', 'integration'],
      };

      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );

      expect(result.status).toBe(201);
      expect(result.data).toMatchObject({
        message: 'File uploaded successfully',
        file: expect.objectContaining({
          id: expect.any(String),
          fileName: fileData.fileName,
          status: 'uploaded',
          contentType: 'text/plain',
          downloadUrl: expect.stringContaining('amazonaws.com'),
        }),
      });

      // Track for cleanup
      const uploadedFile = (
        result.data as { file: { id: string; timestamp: number } }
      ).file;
      createdFileIds.push(uploadedFile.id);
      createdItemIds.push({
        id: uploadedFile.id,
        timestamp: uploadedFile.timestamp,
      });
    });

    test('retrieves file metadata and download URL', async () => {
      // Upload file first
      const fileData = {
        fileName: `retrieve-test-${Date.now()}.txt`,
        content: 'Content for retrieval test',
        contentType: 'text/plain',
      };

      const uploadResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );
      const uploadedFile = (
        uploadResult.data as { file: { id: string; timestamp: number } }
      ).file;
      createdFileIds.push(uploadedFile.id);
      createdItemIds.push({
        id: uploadedFile.id,
        timestamp: uploadedFile.timestamp,
      });

      // Retrieve file
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        { filename: uploadedFile.id }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        id: uploadedFile.id,
        fileName: fileData.fileName,
        downloadUrl: expect.stringContaining('amazonaws.com'),
      });
    });

    test('lists files by status', async () => {
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        undefined,
        { status: 'uploaded' }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        files: expect.any(Array),
        count: expect.any(Number),
      });

      const files = (result.data as { files: Array<{ status: string }> }).files;
      expect(files.every(file => file.status === 'uploaded')).toBe(true);
    });

    test('deletes file from S3 and metadata', async () => {
      // Upload file first
      const fileData = {
        fileName: `delete-test-${Date.now()}.txt`,
        content: 'Content to be deleted',
        contentType: 'text/plain',
      };

      const uploadResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );
      const uploadedFile = (
        uploadResult.data as { file: { id: string; timestamp: number } }
      ).file;

      // Delete file
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'DELETE',
        undefined,
        { filename: uploadedFile.id }
      );

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject({
        message: 'File deleted successfully',
        fileId: uploadedFile.id,
      });

      // Remove from cleanup arrays
      const fileIndex = createdFileIds.indexOf(uploadedFile.id);
      if (fileIndex > -1) {
        createdFileIds.splice(fileIndex, 1);
      }
      const itemIndex = createdItemIds.findIndex(
        item => item.id === uploadedFile.id
      );
      if (itemIndex > -1) {
        createdItemIds.splice(itemIndex, 1);
      }
    });

    test('validates file content type', async () => {
      const fileData = {
        fileName: `invalid-${Date.now()}.exe`,
        content: 'Invalid content',
        contentType: 'application/x-msdownload',
      };

      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        fileData
      );

      expect(result.status).toBe(400);
      expect(result.data).toMatchObject({
        error: expect.stringContaining('Content type'),
        allowedTypes: expect.any(Array),
      });
    });

    test('returns 404 for non-existent file', async () => {
      const result = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        { filename: 'non-existent-file' }
      );

      expect(result.status).toBe(404);
      expect(result.data).toMatchObject({
        error: 'File not found',
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('API endpoint uses HTTPS', () => {
      expect(apiEndpoint).toMatch(/^https:\/\//);
    });

    test('API endpoint includes environment suffix in path', () => {
      expect(apiEndpoint).toContain(environmentSuffix);
    });

    test('Lambda returns CORS headers on all responses', async () => {
      const result = await invokeLambda(mainLambdaName, 'health', 'GET');

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('End-to-End Workflows', () => {
    test('complete CRUD workflow: create -> update -> query -> delete', async () => {
      // 1. Create
      const createResult = await invokeLambda(crudLambdaName, 'crud', 'POST', {
        title: 'E2E Test Item',
        status: 'pending',
      });
      expect(createResult.status).toBe(201);

      const createdItem = (
        createResult.data as { item: { id: string; timestamp: number } }
      ).item;
      createdItemIds.push({
        id: createdItem.id,
        timestamp: createdItem.timestamp,
      });

      // 2. Update
      const updateResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'PUT',
        { status: 'completed' },
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );
      expect(updateResult.status).toBe(200);

      // 3. Query by new status
      const queryResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'GET',
        undefined,
        undefined,
        { status: 'completed' }
      );
      expect(queryResult.status).toBe(200);
      const items = (queryResult.data as { items: Array<{ id: string }> })
        .items;
      expect(items.some(item => item.id === createdItem.id)).toBe(true);

      // 4. Delete
      const deleteResult = await invokeLambda(
        crudLambdaName,
        'crud',
        'DELETE',
        undefined,
        { id: createdItem.id, timestamp: createdItem.timestamp.toString() }
      );
      expect(deleteResult.status).toBe(200);

      // Remove from cleanup
      const index = createdItemIds.findIndex(
        item => item.id === createdItem.id
      );
      if (index > -1) {
        createdItemIds.splice(index, 1);
      }
    });

    test('complete file workflow: upload -> retrieve -> delete', async () => {
      // 1. Upload
      const uploadResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'POST',
        {
          fileName: `e2e-test-${Date.now()}.json`,
          content: JSON.stringify({ test: 'data' }),
          contentType: 'application/json',
        }
      );
      expect(uploadResult.status).toBe(201);

      const uploadedFile = (
        uploadResult.data as {
          file: { id: string; timestamp: number; downloadUrl: string };
        }
      ).file;
      createdFileIds.push(uploadedFile.id);
      createdItemIds.push({
        id: uploadedFile.id,
        timestamp: uploadedFile.timestamp,
      });

      // 2. Retrieve
      const retrieveResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'GET',
        undefined,
        { filename: uploadedFile.id }
      );
      expect(retrieveResult.status).toBe(200);
      expect(
        (retrieveResult.data as { downloadUrl: string }).downloadUrl
      ).toBeDefined();

      // 3. Verify presigned URL works
      const downloadResponse = await fetch(uploadedFile.downloadUrl);
      expect(downloadResponse.ok).toBe(true);

      // 4. Delete
      const deleteResult = await invokeLambda(
        fileProcessingLambdaName,
        'files',
        'DELETE',
        undefined,
        { filename: uploadedFile.id }
      );
      expect(deleteResult.status).toBe(200);

      // Remove from cleanup
      const fileIndex = createdFileIds.indexOf(uploadedFile.id);
      if (fileIndex > -1) {
        createdFileIds.splice(fileIndex, 1);
      }
      const itemIndex = createdItemIds.findIndex(
        item => item.id === uploadedFile.id
      );
      if (itemIndex > -1) {
        createdItemIds.splice(itemIndex, 1);
      }
    });
  });
});
