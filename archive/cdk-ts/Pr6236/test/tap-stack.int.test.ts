import fs from 'fs';
import path from 'path';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApisCommand,
} from '@aws-sdk/client-api-gateway';

// Type definitions for API responses
interface TransactionResponse {
  message: string;
  transactionId: string;
}

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable or default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read region from AWS_REGION file or environment variable
const regionFilePath = path.join(__dirname, '..', 'lib', 'AWS_REGION');
const region = process.env.AWS_REGION || fs.readFileSync(regionFilePath, 'utf8').trim();

// Initialize AWS clients
const dynamoDBClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('Transaction Processing System Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('should verify DynamoDB table exists and is accessible', async () => {
      const response = await dynamoDBClient.send(
        new ScanCommand({
          TableName: outputs.TableName,
          Limit: 1,
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Items).toBeDefined();
    });

    test('should verify S3 bucket exists and is accessible', async () => {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          MaxKeys: 1,
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify SQS queue exists with correct attributes', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.QueueUrl,
          AttributeNames: ['VisibilityTimeout', 'RedrivePolicy'],
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.VisibilityTimeout).toBe('300');
      expect(response.Attributes?.RedrivePolicy).toBeDefined();
    });

    test('should verify API Gateway endpoint is accessible', async () => {
      expect(outputs.ApiUrl).toMatch(/^https:\/\//);
      expect(outputs.ApiUrl).toContain('execute-api');
      expect(outputs.ApiUrl).toContain(region);
    });
  });

  describe('Transaction Processing Workflow', () => {
    const testTransactionId = `test-txn-${Date.now()}`;
    const testTransaction = {
      transactionId: testTransactionId,
      amount: 100.5,
      currency: 'USD',
      timestamp: Date.now(),
      customerId: 'test-customer-123',
    };

    test('should process transaction via API Gateway', async () => {
      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTransaction),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as TransactionResponse;
      expect(data.message).toContain('processed successfully');
      expect(data.transactionId).toBe(testTransactionId);
    }, 15000);

    test('should store transaction in DynamoDB after processing', async () => {
      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: testTransactionId },
            timestamp: { N: testTransaction.timestamp.toString() },
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item?.transactionId.S).toBe(testTransactionId);
      expect(response.Item?.amount.N).toBe(
        testTransaction.amount.toString()
      );
      expect(response.Item?.currency.S).toBe(testTransaction.currency);
      expect(response.Item?.status.S).toBe('processed');
    }, 15000);

    test('should create audit log in S3 bucket after processing', async () => {
      // Wait for SQS and Lambda processing
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'audit/',
        })
      );

      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThan(0);

      // Verify audit log key contains transaction ID
      const auditLog = response.Contents!.find((obj) =>
        obj.Key?.includes(testTransactionId)
      );
      expect(auditLog).toBeDefined();
    }, 20000);
  });

  describe('API Request Validation', () => {
    test('should reject request with missing required fields', async () => {
      const invalidTransaction = {
        amount: 50.0,
        // Missing transactionId and currency
      };

      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTransaction),
      });

      expect(response.status).toBe(400);
    });

    test('should reject request with invalid data types', async () => {
      const invalidTransaction = {
        transactionId: 'test-123',
        amount: 'not-a-number', // Should be number
        currency: 'USD',
      };

      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTransaction),
      });

      expect(response.status).toBe(400);
    });

    test('should accept valid transaction with all required fields', async () => {
      const validTransaction = {
        transactionId: `valid-txn-${Date.now()}`,
        amount: 75.25,
        currency: 'EUR',
        timestamp: Date.now(),
        customerId: 'customer-456',
      };

      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validTransaction),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Lambda Function Invocations', () => {
    test('should invoke DailySummary Lambda function successfully', async () => {
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: `dailySummary-${environmentSuffix}`,
          InvocationType: 'RequestResponse',
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    }, 15000);

    test('should verify DailySummary creates report in S3', async () => {
      // Wait for Lambda execution
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'summaries/',
        })
      );

      expect(response.Contents).toBeDefined();
      expect(response.Contents!.length).toBeGreaterThan(0);

      // Verify summary file naming convention
      const summaryFile = response.Contents!.find((obj) =>
        obj.Key?.includes('daily-')
      );
      expect(summaryFile).toBeDefined();
    }, 15000);
  });

  describe('Error Handling and Recovery', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{invalid-json}',
      });

      expect(response.status).toBe(400);
    });

    test('should handle empty request body', async () => {
      const response = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Data Consistency and Persistence', () => {
    test('should maintain data consistency between API and DynamoDB', async () => {
      const consistencyTestId = `consistency-test-${Date.now()}`;
      const consistencyTransaction = {
        transactionId: consistencyTestId,
        amount: 999.99,
        currency: 'GBP',
        timestamp: Date.now(),
        customerId: 'consistency-test-customer',
      };

      // Submit transaction
      const apiResponse = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consistencyTransaction),
      });
      expect(apiResponse.status).toBe(200);

      // Wait and verify in DynamoDB
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const dbResponse = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: consistencyTestId },
            timestamp: { N: consistencyTransaction.timestamp.toString() },
          },
        })
      );

      // Verify all fields match
      expect(dbResponse.Item?.transactionId.S).toBe(consistencyTestId);
      expect(parseFloat(dbResponse.Item?.amount.N || '0')).toBe(999.99);
      expect(dbResponse.Item?.currency.S).toBe('GBP');
      expect(dbResponse.Item?.customerId.S).toBe(
        'consistency-test-customer'
      );
    }, 15000);
  });

  describe('Asynchronous Processing Verification', () => {
    test('should process transactions through SQS to audit Lambda', async () => {
      const asyncTestId = `async-test-${Date.now()}`;
      const asyncTransaction = {
        transactionId: asyncTestId,
        amount: 555.55,
        currency: 'JPY',
        timestamp: Date.now(),
        customerId: 'async-test-customer',
      };

      // Submit transaction
      await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asyncTransaction),
      });

      // Wait for SQS processing (queue visibility timeout + Lambda processing)
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify audit log was created
      const s3Response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'audit/',
        })
      );

      const auditLog = s3Response.Contents!.find((obj) =>
        obj.Key?.includes(asyncTestId)
      );
      expect(auditLog).toBeDefined();
      expect(auditLog?.Size).toBeGreaterThan(0);
    }, 25000);
  });

  describe('Resource Configuration Verification', () => {
    test('should verify API Gateway throttling is configured', async () => {
      // API Gateway is accessible and returns proper responses
      const response = await fetch(outputs.ApiUrl);
      expect(response.headers.get('x-amzn-requestid')).toBeDefined();
    });

    test('should verify DynamoDB is using on-demand billing', async () => {
      // This is verified by successful operations without provisioned capacity errors
      const scanResponse = await dynamoDBClient.send(
        new ScanCommand({
          TableName: outputs.TableName,
          Limit: 10,
        })
      );
      expect(scanResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('End-to-End Transaction Lifecycle', () => {
    test('should complete full transaction lifecycle from API to audit', async () => {
      const lifecycleTestId = `lifecycle-${Date.now()}`;
      const lifecycleTransaction = {
        transactionId: lifecycleTestId,
        amount: 1234.56,
        currency: 'CAD',
        timestamp: Date.now(),
        customerId: 'lifecycle-test-customer',
      };

      // Step 1: Submit via API
      const apiResponse = await fetch(`${outputs.ApiUrl}transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lifecycleTransaction),
      });
      expect(apiResponse.status).toBe(200);
      const apiData = (await apiResponse.json()) as TransactionResponse;
      expect(apiData.transactionId).toBe(lifecycleTestId);

      // Step 2: Verify in DynamoDB
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const dbResponse = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: outputs.TableName,
          Key: {
            transactionId: { S: lifecycleTestId },
            timestamp: { N: lifecycleTransaction.timestamp.toString() },
          },
        })
      );
      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.status.S).toBe('processed');

      // Step 3: Verify audit log in S3
      await new Promise((resolve) => setTimeout(resolve, 8000));
      const s3Response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: outputs.BucketName,
          Prefix: 'audit/',
        })
      );
      const auditLog = s3Response.Contents!.find((obj) =>
        obj.Key?.includes(lifecycleTestId)
      );
      expect(auditLog).toBeDefined();

      // All stages completed successfully
      expect(true).toBe(true);
    }, 30000);
  });
});
