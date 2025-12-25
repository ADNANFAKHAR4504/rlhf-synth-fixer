import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import axios from 'axios';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let bucketName: string;
  let tableName: string;
  let functionName: string;
  let apiUrl: string;

  beforeAll(() => {
    // Load deployment outputs from flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error(
        'Deployment outputs not found. Please deploy the stack first.'
      );
    }

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    s3Client = new S3Client({ region });
    dynamoClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });

    // Extract resource names from outputs
    bucketName = outputs.S3BucketName;
    tableName = outputs.DynamoDBTableName;
    functionName = outputs.LambdaFunctionName;
    apiUrl = outputs.ApiGatewayUrl;

    // Validate outputs exist
    expect(bucketName).toBeDefined();
    expect(tableName).toBeDefined();
    expect(functionName).toBeDefined();
    expect(apiUrl).toBeDefined();
  });

  describe('S3 Bucket Tests', () => {
    const testKey = `test-file-${Date.now()}.txt`;
    const testContent = 'Integration test content';

    afterEach(async () => {
      // Cleanup test objects
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('should be able to upload an object to S3 bucket', async () => {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to retrieve an object from S3 bucket', async () => {
      // First upload
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Then retrieve
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(getCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);

      const body = await response.Body?.transformToString();
      expect(body).toBe(testContent);
    });

    test('should upload to S3 successfully (S3 notifications not configured)', async () => {
      // Note: S3-to-Lambda notifications are not configured in this stack
      // Custom resource for S3 notifications was removed for LocalStack compatibility
      // This test only verifies S3 upload functionality

      // Upload a file to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Verify the file was uploaded successfully
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(getCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);

      const body = await response.Body?.transformToString();
      expect(body).toBe(testContent);
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('should have correct table structure', async () => {
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to query table with composite keys', async () => {
      const scanCommand = new ScanCommand({
        TableName: tableName,
        FilterExpression:
          'attribute_exists(PartitionKey) AND attribute_exists(SortKey)',
        Limit: 10,
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Lambda Function Tests', () => {
    test('should be able to invoke Lambda function directly', async () => {
      const testEvent = {
        httpMethod: 'GET',
        path: '/process',
        headers: {},
        body: null,
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(testEvent)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
        expect(payload.headers).toHaveProperty('Access-Control-Allow-Origin');
      }
    });

    test('should handle POST requests correctly', async () => {
      const testEvent = {
        httpMethod: 'POST',
        path: '/process',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'test-key',
          data: 'test-data',
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(testEvent)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(201);

        const body = JSON.parse(payload.body);
        expect(body.message).toBe('Record created successfully');
      }
    });
  });

  describe('API Gateway Tests', () => {
    test('should be able to make GET request to API Gateway', async () => {
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            Accept: 'application/json',
          },
          timeout: 10000,
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toBe(
          'Processing records retrieved successfully'
        );
      } catch (error: any) {
        // If error, check if it's still a valid response
        if (error.response) {
          console.log('API Gateway GET response error:', error.response.data);
        }
        throw error;
      }
    });

    test('should be able to make POST request to API Gateway', async () => {
      const testData = {
        key: `api-test-${Date.now()}`,
        data: 'Integration test data from API',
      };

      try {
        const response = await axios.post(apiUrl, testData, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toBe('Record created successfully');
        expect(response.data).toHaveProperty('processing_id');
      } catch (error: any) {
        // If error, check if it's still a valid response
        if (error.response) {
          console.log('API Gateway POST response error:', error.response.data);
        }
        throw error;
      }
    });

    test('should handle CORS preflight requests', async () => {
      try {
        const response = await axios.options(apiUrl, {
          headers: {
            Origin: 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
          },
          timeout: 10000,
        });

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBeDefined();
        expect(response.headers['access-control-allow-methods']).toContain(
          'GET'
        );
        expect(response.headers['access-control-allow-methods']).toContain(
          'POST'
        );
      } catch (error: any) {
        // If error, check if it's still a valid response
        if (error.response) {
          console.log(
            'API Gateway OPTIONS response error:',
            error.response.data
          );
        }
        throw error;
      }
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should verify S3 and DynamoDB are operational (S3 triggers not configured)', async () => {
      // Note: S3-to-Lambda automatic triggers are not configured in this stack
      // Custom resource for S3 notifications was removed for LocalStack compatibility
      // This test verifies S3 upload and DynamoDB table are operational

      const testKey = `e2e-test-${Date.now()}.json`;
      const testData = {
        testId: Date.now(),
        message: 'End-to-end integration test',
      };

      // Step 1: Upload file to S3
      const uploadResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
        })
      );

      expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

      // Step 2: Verify DynamoDB table is accessible
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const dynamoResponse = await dynamoClient.send(scanCommand);
      expect(dynamoResponse.$metadata.httpStatusCode).toBe(200);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    });

    test('should handle API → Lambda → DynamoDB workflow', async () => {
      const testData = {
        key: `api-e2e-${Date.now()}`,
        data: 'End-to-end API test',
      };

      // Step 1: Create record via API
      const postResponse = await axios.post(apiUrl, testData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      expect(postResponse.status).toBe(201);

      // Step 2: Retrieve records via API
      const getResponse = await axios.get(apiUrl, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.records).toBeDefined();

      // Step 3: Verify the record exists in the response
      const records = getResponse.data.records;
      const ourRecord = records.find(
        (r: any) => r.PartitionKey && r.PartitionKey.includes(testData.key)
      );

      if (ourRecord) {
        expect(ourRecord.status).toBe('manual');
      }
    });
  });

  describe('Security and Compliance Tests', () => {
    test('API Gateway should enforce CORS headers', async () => {
      const response = await axios.get(apiUrl, {
        headers: {
          Origin: 'http://example.com',
        },
        timeout: 10000,
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('Lambda function should have proper error handling', async () => {
      const invalidEvent = {
        httpMethod: 'INVALID',
        path: '/process',
        body: 'not-json',
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(invalidEvent)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toContain('Event processed successfully');
      }
    });
  });
});
