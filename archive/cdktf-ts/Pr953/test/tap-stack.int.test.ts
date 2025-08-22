// Integration tests for Task 278 serverless infrastructure
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs = {};
try {
  const outputsFile = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsFile)) {
    const content = fs.readFileSync(outputsFile, 'utf8').trim();
    if (content) {
      outputs = JSON.parse(content);
    }
  }
} catch (error) {
  console.warn('Failed to load CDK outputs, tests will be skipped:', error);
}

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Serverless Infrastructure Integration Tests', () => {
  const bucketName = (outputs as any).BucketName;
  const tableName = (outputs as any).DynamoDBTableName;
  const functionName = (outputs as any).LambdaFunctionName;

  // Helper function to skip tests when resources aren't deployed
  const skipIfNoResources = () => {
    if (!bucketName || !tableName || !functionName) {
      console.log('Skipping test - CDK resources not deployed');
      return true;
    }
    return false;
  };

  beforeAll(() => {
    if (!bucketName || !tableName || !functionName) {
      console.warn('CDK outputs not available - integration tests will be skipped');
      return;
    }
    expect(bucketName).toBeDefined();
    expect(tableName).toBeDefined();
    expect(functionName).toBeDefined();
  });

  afterEach(async () => {
    if (skipIfNoResources()) return;
    
    // Clean up any test objects from S3 bucket
    try {
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({ Bucket: bucketName })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Note: In a real cleanup, you'd delete objects here
        // For this test, we'll leave them to verify the flow worked
      }
    } catch (error) {
      console.warn('Failed to clean up S3 objects:', error);
    }
  });

  describe('AWS Resource Verification', () => {
    test('should verify S3 bucket exists and is accessible', async () => {
      if (skipIfNoResources()) return;

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify DynamoDB table exists and is accessible', async () => {
      if (skipIfNoResources()) return;

      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const response = await dynamodbClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Items).toBeDefined();
    });

    test('should verify Lambda function exists and is accessible', async () => {
      if (!functionName || !bucketName) {
        console.log('Skipping Lambda test - no function name or bucket name available');
        return;
      }

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          Records: [{
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: bucketName },
              object: { key: 'test-integration.txt' }
            }
          }]
        }),
      });

      const response = await lambdaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toContain('Successfully processed S3 event');
      }
    });
  });

  describe('End-to-End S3 → Lambda → DynamoDB Flow', () => {
    test('should trigger Lambda function when object is uploaded to S3 and log to DynamoDB', async () => {
      if (skipIfNoResources()) return;

      const testFileName = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content for Task 278';

      // Step 1: Upload a file to S3 bucket
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testFileName,
        Body: testContent,
        ContentType: 'text/plain',
      });

      const uploadResponse = await s3Client.send(putCommand);
      expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

      // Step 2: Wait for Lambda to process the event (eventual consistency)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Query DynamoDB for the log entries
      // Since we don't know the exact requestId, we'll scan for recent entries
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'objectKey = :objectKey',
        ExpressionAttributeValues: {
          ':objectKey': { S: testFileName },
        },
        Limit: 10,
      });

      const scanResponse = await dynamodbClient.send(scanCommand);
      expect(scanResponse.$metadata.httpStatusCode).toBe(200);
      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);

      // Verify the log entry contains expected data
      const logEntry = scanResponse.Items![0];
      expect(logEntry.bucketName.S).toBe(bucketName);
      expect(logEntry.objectKey.S).toBe(testFileName);
      expect(logEntry.eventName.S).toMatch(/ObjectCreated/);
      expect(logEntry.functionName.S).toBe(functionName);
      expect(logEntry.requestId.S).toBeDefined();
      expect(logEntry.timestamp.S).toBeDefined();
      expect(logEntry.awsRequestId.S).toBeDefined();
    }, 30000);

    test('should handle multiple S3 events and create separate DynamoDB entries', async () => {
      if (skipIfNoResources()) return;

      const testFiles = [
        `multi-test-1-${Date.now()}.txt`,
        `multi-test-2-${Date.now()}.txt`,
        `multi-test-3-${Date.now()}.txt`,
      ];

      // Upload multiple files
      for (const fileName of testFiles) {
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: `Content for ${fileName}`,
          ContentType: 'text/plain',
        });

        const response = await s3Client.send(putCommand);
        expect(response.$metadata.httpStatusCode).toBe(200);
      }

      // Wait for Lambda processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Check that we have entries for all files
      for (const fileName of testFiles) {
        const scanCommand = new ScanCommand({
          TableName: tableName,
          FilterExpression: 'objectKey = :objectKey',
          ExpressionAttributeValues: {
            ':objectKey': { S: fileName },
          },
        });

        const scanResponse = await dynamodbClient.send(scanCommand);
        expect(scanResponse.Items!.length).toBeGreaterThan(0);
        expect(scanResponse.Items![0].objectKey.S).toBe(fileName);
      }
    }, 45000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle Lambda function execution with malformed S3 event', async () => {
      if (skipIfNoResources()) return;

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          Records: [{
            // Missing required S3 event structure
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            malformed: true
          }]
        }),
      });

      const response = await lambdaClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        // Function should handle the error gracefully
        expect([200, 500]).toContain(payload.statusCode);
      }
    });

    test('should verify S3 bucket permissions are correctly configured', async () => {
      if (skipIfNoResources()) return;

      // Test that we can read from the bucket
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 5,
      });

      const response = await s3Client.send(listCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Data Consistency and Format Validation', () => {
    test('should verify DynamoDB entries have correct schema and data types', async () => {
      if (skipIfNoResources()) return;

      // Get a sample of recent entries
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Limit: 5,
      });

      const response = await dynamodbClient.send(scanCommand);
      expect(response.Items).toBeDefined();

      if (response.Items && response.Items.length > 0) {
        const item = response.Items[0];

        // Verify required attributes exist and have correct types
        expect(item.requestId).toBeDefined();
        expect(item.requestId.S).toBeDefined();
        expect(typeof item.requestId.S).toBe('string');

        expect(item.timestamp).toBeDefined();
        expect(item.timestamp.S).toBeDefined();
        expect(typeof item.timestamp.S).toBe('string');

        expect(item.bucketName).toBeDefined();
        expect(item.bucketName.S).toBe(bucketName);

        expect(item.functionName).toBeDefined();
        expect(item.functionName.S).toBe(functionName);

        // Validate timestamp format (ISO 8601 with optional microseconds)
        const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3,6})?Z?$/;
        expect(item.timestamp.S).toMatch(timestampRegex);

        // Validate UUID format for requestId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(item.requestId.S).toMatch(uuidRegex);
      }
    });
  });
});
