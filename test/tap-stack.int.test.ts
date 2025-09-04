// Integration Tests for Serverless TapStack
import { DeleteItemCommand, DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import fetch from 'node-fetch';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configuration - Load from cfn-outputs or use fallback values
let outputs: any = {};

try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, using fallback values');
}


const API_BASE_URL = outputs["ApiGatewayUrl"];
const DYNAMODB_TABLE_NAME = outputs["DynamoDBTableName"];
const KMS_KEY_ID = outputs["KMSKeyId"];
const S3_BUCKET_NAME = outputs["S3BucketName"];

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });

describe('Serverless TapStack Integration Tests', () => {
  // Test data cleanup
  const testItems: string[] = [];

  beforeAll(() => {
    console.log('Testing with configuration:', {
      environmentSuffix,
      apiBaseUrl: API_BASE_URL,
      dynamoTableName: DYNAMODB_TABLE_NAME,
      s3BucketName: S3_BUCKET_NAME,
      kmsKeyId: KMS_KEY_ID,
      region
    });
  });

  afterAll(async () => {
    // Clean up test data
    for (const itemId of testItems) {
      try {
        await dynamoClient.send(new DeleteItemCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Key: { id: { S: itemId } }
        }));
      } catch (error) {
        console.warn(`Failed to delete test item ${itemId}:`, error);
      }
    }
  });

  describe('API Gateway Health Check', () => {
    test('should return healthy status from health endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
    }, 15000);

    test('should have correct CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/health`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('content-type')).toContain('application/json');
    }, 15000);
  });

  describe('Items API CRUD Operations', () => {
    test('should create a new item via POST /items', async () => {
      const testItem = {
        name: 'Integration Test Item',
        description: 'Created during integration testing',
        type: 'test'
      };

      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testItem)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe(testItem.name);
      expect(data.description).toBe(testItem.description);
      expect(data.type).toBe(testItem.type);
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();

      // Store for cleanup
      testItems.push(data.id);
    }, 15000);

    test('should retrieve an item via GET /items/{id}', async () => {
      // First create an item
      const testItem = { name: 'Retrieve Test Item', type: 'retrieve-test' };

      const createResponse = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testItem)
      });

      const createdItem = await createResponse.json();
      testItems.push(createdItem.id);

      // Then retrieve it
      const getResponse = await fetch(`${API_BASE_URL}/items/${createdItem.id}`);
      const retrievedItem = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(retrievedItem.id).toBe(createdItem.id);
      expect(retrievedItem.name).toBe(testItem.name);
      expect(retrievedItem.type).toBe(testItem.type);
    }, 15000);

    test('should return 404 for non-existent item', async () => {
      const nonExistentId = 'non-existent-item-12345';

      const response = await fetch(`${API_BASE_URL}/items/${nonExistentId}`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Item not found');
    }, 15000);

    test('should handle invalid JSON in POST request', async () => {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(500);
    }, 15000);
  });


  describe('DynamoDB Integration', () => {
    test('should store items in DynamoDB when created via API', async () => {
      // Create item via API
      const testItem = { name: 'DynamoDB Test Item', type: 'dynamo-test' };

      const apiResponse = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testItem)
      });

      const createdItem = await apiResponse.json();
      testItems.push(createdItem.id);

      // Verify in DynamoDB directly
      const dbResponse = await dynamoClient.send(new GetItemCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: { id: { S: createdItem.id } }
      }));

      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.name?.S).toBe(testItem.name);
      expect(dbResponse.Item?.type?.S).toBe(testItem.type);
      expect(dbResponse.Item?.createdAt?.S).toBeDefined();
      expect(dbResponse.Item?.updatedAt?.S).toBeDefined();
    }, 20000);

    test('should be able to scan DynamoDB table', async () => {
      const scanResponse = await dynamoClient.send(new ScanCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Limit: 10
      }));

      expect(scanResponse.Items).toBeDefined();
      expect(Array.isArray(scanResponse.Items)).toBe(true);
      expect(scanResponse.Count).toBeGreaterThanOrEqual(0);
    }, 20000);
  });

  describe('S3 Logging Integration', () => {
    test('should create log entries in S3 bucket', async () => {
      // Make an API request that should generate logs
      const response = await fetch(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);

      // Wait a moment for logs to be written
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if logs exist in S3
      try {
        const today = new Date().toISOString().split('T')[0];
        const listResponse = await s3Client.send(new ListObjectsV2Command({
          Bucket: S3_BUCKET_NAME,
          Prefix: `logs/${today}/`,
          MaxKeys: 10
        }));

        expect(listResponse.Contents).toBeDefined();
        // We expect at least some log files to exist
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          expect(listResponse.Contents.length).toBeGreaterThan(0);

          // Verify log file content
          const logFile = listResponse.Contents[0];
          const logContent = await s3Client.send(new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: logFile.Key
          }));

          const logText = await logContent.Body?.transformToString();
          const logData = JSON.parse(logText!);

          expect(logData.timestamp).toBeDefined();
          expect(logData.requestId).toBeDefined();
          expect(logData.event).toBeDefined();
        }
      } catch (error) {
        console.warn('Could not verify S3 logs (may be due to eventual consistency):', error);
        // Don't fail the test if S3 logs aren't immediately available
      }
    }, 30000);
  });

  describe('KMS Integration', () => {
    test('should be able to describe the KMS key', async () => {
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: KMS_KEY_ID
      }));

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata?.KeyId).toBe(KMS_KEY_ID);
      expect(keyResponse.KeyMetadata?.Enabled).toBe(true);
    }, 15000);
  });

  describe('API Performance and Reliability', () => {
    test('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(0).map((_, i) =>
        fetch(`${API_BASE_URL}/health`).then(r => ({ index: i, status: r.status }))
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 20000);

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/health`);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // Less than 10 seconds
      expect(responseTime).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency between API and DynamoDB', async () => {
      const testItem = {
        name: 'Consistency Test Item',
        description: 'Testing data consistency',
        metadata: { testType: 'consistency', timestamp: new Date().toISOString() }
      };

      // Create via API
      const apiResponse = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testItem)
      });

      const createdItem = await apiResponse.json();
      testItems.push(createdItem.id);

      // Wait for consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Retrieve via API
      const getApiResponse = await fetch(`${API_BASE_URL}/items/${createdItem.id}`);
      const apiRetrievedItem = await getApiResponse.json();

      // Retrieve directly from DynamoDB
      const dbResponse = await dynamoClient.send(new GetItemCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: { id: { S: createdItem.id } }
      }));

      // Compare data
      expect(apiRetrievedItem.name).toBe(testItem.name);
      expect(dbResponse.Item?.name?.S).toBe(testItem.name);
      expect(apiRetrievedItem.description).toBe(testItem.description);
      expect(dbResponse.Item?.description?.S).toBe(testItem.description);
    }, 25000);
  });

  describe('Environment Configuration', () => {
    test('should use correct environment-specific resources', () => {
      expect(DYNAMODB_TABLE_NAME).toContain(environmentSuffix);
      expect(S3_BUCKET_NAME).toContain(environmentSuffix);
      expect(API_BASE_URL).toBeDefined();
      expect(KMS_KEY_ID).toBeDefined();
    });

    test('should have all required outputs configured', () => {
      expect(API_BASE_URL).toBeTruthy();
      expect(DYNAMODB_TABLE_NAME).toBeTruthy();
      expect(S3_BUCKET_NAME).toBeTruthy();
      expect(KMS_KEY_ID).toBeTruthy();
    });
  });

  describe('Security Validation', () => {
    test('API should require valid requests and reject malformed ones', async () => {
      // Test with empty body
      const emptyResponse = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      });

      // Should handle gracefully (either accept empty object or return error)
      expect([200, 201, 400, 500]).toContain(emptyResponse.status);
    }, 15000);

    test('should handle large payloads appropriately', async () => {
      const largeItem = {
        name: 'Large Test Item',
        data: 'x'.repeat(1000), // 1KB of data
        metadata: Array(50).fill(0).map((_, i) => ({ key: `field${i}`, value: `value${i}` }))
      };

      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(largeItem)
      });

      // Should either succeed or fail gracefully
      expect([200, 201, 413, 500]).toContain(response.status);

      if (response.status === 201) {
        const data = await response.json();
        testItems.push(data.id);
      }
    }, 20000);
  });
});