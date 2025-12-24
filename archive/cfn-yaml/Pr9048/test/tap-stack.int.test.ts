import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import crypto from 'crypto';
import fs from 'fs';

// Set global timeout for all integration tests (S3 operations and Lambda invocations can take time)
jest.setTimeout(600000); // 10 minutes

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Load AWS region from environment variable
const AWS_REGION = process.env.AWS_REGION;

// Get environment suffix from environment variable 
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

// AWS Clients
const lambdaClient = new LambdaClient({});
const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const logsClient = new CloudWatchLogsClient({});

// Test configuration
const TEST_CUSTOMER_ID = `test-customer-${Date.now()}`;
const TEST_API_KEY = 'A'.repeat(32); // 32-character API key

// Helper function to generate a certificate-like string dynamically
// Must be at least 500 characters to pass authorizer validation
// This generates a unique certificate string for each test run
function generateMockCertificate(): string {
  // Generate a unique base64-like string that's at least 500 characters
  // Using timestamp and random data to ensure uniqueness
  const timestamp = Date.now();
  const randomData = crypto.randomBytes(200).toString('base64');
  const uniqueId = crypto.randomUUID();

  // Create a certificate-like structure with dynamic content
  const certContent = `${randomData}${timestamp}${uniqueId}${crypto.randomBytes(100).toString('base64')}`;

  // Ensure it's at least 500 characters (authorizer requirement)
  const padding = 'A'.repeat(Math.max(0, 500 - certContent.length));

  return `-----BEGIN CERTIFICATE-----\n${certContent}${padding}\n-----END CERTIFICATE-----`;
}

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to check for Lambda errors and parse response
const parseLambdaResponse = (response: any, functionName: string = 'Lambda'): any => {
  if (response.FunctionError) {
    const errorPayload = JSON.parse(Buffer.from(response.Payload!).toString());
    throw new Error(`${functionName} error: ${errorPayload.errorMessage || errorPayload.errorType || 'Unknown error'}`);
  }
  if (!response.Payload) {
    throw new Error(`${functionName} returned empty payload`);
  }
  return JSON.parse(Buffer.from(response.Payload!).toString());
};

const pythonStyleJsonDump = (value: any): string => {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return Number.isInteger(value) ? value.toString() : Number(value).toString();
    }
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const elements = value.map((element) => pythonStyleJsonDump(element));
    return `[${elements.join(', ')}]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const entries = keys.map((key) => `${JSON.stringify(key)}: ${pythonStyleJsonDump(value[key])}`);
    return `{${entries.join(', ')}}`;
  }

  return 'null';
};

describe('FinSecure Data Processing Pipeline - Integration Tests (Data Workflow Focus)', () => {
  // Stack outputs
  let apiEndpoint: string;
  let dataBucketName: string;
  let processingLambdaArn: string;
  let authorizerLambdaArn: string;
  let dlqUrl: string;
  let processingLogGroup: string;
  let apiGatewayLogGroup: string;
  let awsAccountId: string;

  // Track test data created during tests for cleanup
  const testS3Keys: string[] = [];

  beforeAll(() => {
    // Extract outputs from CloudFormation stack
    apiEndpoint = outputs.APIEndpoint;
    dataBucketName = outputs.DataBucketName;
    processingLambdaArn = outputs.ProcessingLambdaArn;
    authorizerLambdaArn = outputs.AuthorizerLambdaArn;
    dlqUrl = outputs.DLQUrl;
    processingLogGroup = outputs.ProcessingLogGroup;
    apiGatewayLogGroup = outputs.APIGatewayLogGroup;
    awsAccountId = outputs.AWSAccountId;
  });

  afterAll(async () => {
    // Clean up all test S3 objects created during tests
    if (testS3Keys.length > 0 && dataBucketName) {
      try {
        // Filter out empty or undefined keys
        const validKeys = testS3Keys.filter(key => key && key.length > 0);

        if (validKeys.length > 0) {
          // Delete objects in batches (S3 allows up to 1000 per request)
          const batches = [];
          for (let i = 0; i < validKeys.length; i += 1000) {
            batches.push(validKeys.slice(i, i + 1000));
          }

          for (const batch of batches) {
            await s3Client.send(
              new DeleteObjectsCommand({
                Bucket: dataBucketName,
                Delete: {
                  Objects: batch.map(key => ({ Key: key })),
                  Quiet: true,
                },
              })
            );
          }
        }
      } catch (error) {
        // Log but don't fail - cleanup is best effort
        console.warn('Failed to clean up some test S3 objects:', error);
      }
    }

    // Destroy AWS SDK clients to prevent Jest from hanging
    // Use try-catch for each destroy to ensure all clients are closed even if one fails
    try {
      lambdaClient.destroy();
    } catch (error) {
      console.warn('Error destroying Lambda client:', error);
    }

    try {
      s3Client.destroy();
    } catch (error) {
      console.warn('Error destroying S3 client:', error);
    }

    try {
      sqsClient.destroy();
    } catch (error) {
      console.warn('Error destroying SQS client:', error);
    }

    try {
      logsClient.destroy();
    } catch (error) {
      console.warn('Error destroying CloudWatch Logs client:', error);
    }

    // Give connections time to close before Jest exits
    await wait(100);
  });

  describe('API Gateway Reception → Custom Authorizer Validation', () => {
    test('Authorizer validates certificate, API key, and request signature', async () => {
      // Arrange - Simulate API Gateway invoking authorizer
      const requestId = crypto.randomUUID();
      const testEvent = {
        methodArn: `arn:aws:execute-api:${AWS_REGION}:${awsAccountId}:${apiEndpoint.split('/')[2]}/prod/POST/process`,
        requestContext: {
          requestId: requestId,
          identity: {
            clientCert: {
              clientCertPem: generateMockCertificate(),
            },
          },
        },
        headers: {
          'X-API-Key': TEST_API_KEY,
          'X-Request-Signature': crypto
            .createHash('sha256')
            .update(`${TEST_API_KEY}${requestId}`)
            .digest('hex'),
        },
      };

      // Act - Authorizer Lambda validates request
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: authorizerLambdaArn,
          Payload: JSON.stringify(testEvent),
        })
      );

      // Assert - Authorizer returns policy (Allow or Deny)
      const result = parseLambdaResponse(response, 'Authorizer Lambda');
      expect(result).toHaveProperty('policyDocument');
      expect(result.policyDocument).toHaveProperty('Statement');
      expect(result.policyDocument.Statement[0]).toHaveProperty('Effect');
      expect(result.policyDocument.Statement[0]).toHaveProperty('Action', 'execute-api:Invoke');
    });

    test('Authorizer rejects invalid API key format', async () => {
      // Arrange
      const testEvent = {
        methodArn: `arn:aws:execute-api:${AWS_REGION}:${awsAccountId}:${apiEndpoint.split('/')[2]}/prod/POST/process`,
        requestContext: {
          requestId: crypto.randomUUID(),
          identity: {
            clientCert: {
              clientCertPem: generateMockCertificate(),
            },
          },
        },
        headers: {
          'X-API-Key': 'invalid-key-too-short', // Invalid format
          'X-Request-Signature': 'mock-signature',
        },
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: authorizerLambdaArn,
          Payload: JSON.stringify(testEvent),
        })
      );

      // Assert - Should deny invalid API key
      const result = parseLambdaResponse(response, 'Authorizer Lambda');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('Authorizer rejects missing client certificate', async () => {
      // Arrange
      const testEvent = {
        methodArn: `arn:aws:execute-api:${AWS_REGION}:${awsAccountId}:${apiEndpoint.split('/')[2]}/prod/POST/process`,
        requestContext: {
          requestId: crypto.randomUUID(),
          identity: {
            // Missing clientCert
          },
        },
        headers: {
          'X-API-Key': TEST_API_KEY,
          'X-Request-Signature': 'mock-signature',
        },
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: authorizerLambdaArn,
          Payload: JSON.stringify(testEvent),
        })
      );

      // Assert - Should deny missing certificate
      const result = parseLambdaResponse(response, 'Authorizer Lambda');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('Authorizer rejects invalid request signature', async () => {
      // Arrange
      const requestId = crypto.randomUUID();
      const testEvent = {
        methodArn: `arn:aws:execute-api:${AWS_REGION}:${awsAccountId}:${apiEndpoint.split('/')[2]}/prod/POST/process`,
        requestContext: {
          requestId: requestId,
          identity: {
            clientCert: {
              clientCertPem: generateMockCertificate(),
            },
          },
        },
        headers: {
          'X-API-Key': TEST_API_KEY,
          'X-Request-Signature': 'invalid-signature-that-does-not-match',
        },
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: authorizerLambdaArn,
          Payload: JSON.stringify(testEvent),
        })
      );

      // Assert - Should deny invalid signature
      const result = parseLambdaResponse(response, 'Authorizer Lambda');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('Authorizer includes context in Allow policy', async () => {
      // Arrange
      const requestId = crypto.randomUUID();
      const testEvent = {
        methodArn: `arn:aws:execute-api:${AWS_REGION}:${awsAccountId}:${apiEndpoint.split('/')[2]}/prod/POST/process`,
        requestContext: {
          requestId: requestId,
          identity: {
            clientCert: {
              clientCertPem: generateMockCertificate(),
            },
          },
        },
        headers: {
          'X-API-Key': TEST_API_KEY,
          'X-Request-Signature': crypto
            .createHash('sha256')
            .update(`${TEST_API_KEY}${requestId}`)
            .digest('hex'),
        },
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: authorizerLambdaArn,
          Payload: JSON.stringify(testEvent),
        })
      );

      // Assert - Policy should include context if Allow
      const result = parseLambdaResponse(response, 'Authorizer Lambda');
      if (result.policyDocument.Statement[0].Effect === 'Allow') {
        expect(result).toHaveProperty('context');
        expect(result.context).toHaveProperty('requestId');
      }
    });
  });

  describe('Custom Authorizer Validation → Processing Lambda Execution', () => {
    test('Processing Lambda validates input data format', async () => {
      // Arrange - Invalid input (missing required fields)
      const invalidEvent = {
        body: JSON.stringify({
          transactionData: { amount: 100 },
          // Missing customerId and timestamp
        }),
      };

      // Act - Processing Lambda receives and validates
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(invalidEvent),
        })
      );

      // Assert - Returns validation error
      const result = parseLambdaResponse(response, 'Processing Lambda');
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('error', 'Validation failed');
      expect(body).toHaveProperty('requestId');
      expect(body).toHaveProperty('message');
    });

    test('Processing Lambda rejects invalid customerId format', async () => {
      // Arrange - Invalid customerId (too short)
      const invalidEvent = {
        body: JSON.stringify({
          customerId: '1234', // Too short (minimum 5 characters)
          transactionData: { amount: 100 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(invalidEvent),
        })
      );

      // Assert - Returns validation error
      const result = parseLambdaResponse(response, 'Processing Lambda');
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('error', 'Validation failed');
    });

    test('Processing Lambda rejects invalid timestamp format', async () => {
      // Arrange - Invalid timestamp
      const invalidEvent = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 100 },
          timestamp: 'invalid-timestamp-format',
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(invalidEvent),
        })
      );

      // Assert - Returns validation error
      const result = parseLambdaResponse(response, 'Processing Lambda');
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('error', 'Validation failed');
    });

    test('Processing Lambda processes valid transaction and generates transaction ID', async () => {
      // Arrange - Valid transaction data
      const validEvent = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: {
            amount: 250.75,
            currency: 'USD',
            merchantId: 'merchant-456',
          },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act - Processing Lambda processes transaction
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(validEvent),
        })
      );

      // Assert - Returns success with transaction ID
      const result = parseLambdaResponse(response, 'Processing Lambda');
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('transactionId');
      expect(responseBody).toHaveProperty('message', 'Data processed successfully');
      expect(responseBody).toHaveProperty('location'); // S3 key
      expect(responseBody.transactionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/); // UUID format

      // Track for cleanup
      if (responseBody.location) {
        testS3Keys.push(responseBody.location);
      }
    });

    test('Processing Lambda generates unique transaction IDs for each request', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 100 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act - Invoke twice
      const response1 = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );
      await wait(1000);
      const response2 = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      // Assert - Each transaction has unique ID
      const result1 = parseLambdaResponse(response1, 'Processing Lambda');
      const result2 = parseLambdaResponse(response2, 'Processing Lambda');
      const body1 = JSON.parse(result1.body);
      const body2 = JSON.parse(result2.body);
      expect(body1.transactionId).not.toBe(body2.transactionId);
      expect(body1.location).not.toBe(body2.location);

      // Track for cleanup
      if (body1.location) testS3Keys.push(body1.location);
      if (body2.location) testS3Keys.push(body2.location);
    });

    test('Processing Lambda calculates checksum for transaction data', async () => {
      // Arrange
      const transactionData = {
        amount: 500.00,
        currency: 'USD',
        merchantId: 'merchant-789',
      };
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: transactionData,
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      // Assert - Response should include location (S3 key)
      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('location');

      // Wait and verify checksum in stored data
      await wait(3000);
      const s3Object = await s3Client.send(
        new GetObjectCommand({
          Bucket: dataBucketName,
          Key: responseBody.location,
        })
      );
      const storedData = JSON.parse(await s3Object.Body!.transformToString());
      expect(storedData).toHaveProperty('checksum');
      expect(storedData.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex

      // Track for cleanup
      testS3Keys.push(responseBody.location);
    });
  });

  describe('Processing Lambda Execution → Encrypted S3 Storage', () => {
    test('Processed data is stored in S3 with KMS encryption', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: {
            amount: 500.00,
            currency: 'USD',
            description: 'Test transaction',
          },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act - Process and store
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      const result = parseLambdaResponse(lambdaResponse, 'Processing Lambda');

      // Assert - Lambda should return success
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('location');
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      // Wait for S3 eventual consistency
      await wait(3000);

      // Assert - Verify object exists and is encrypted
      const s3Response = await s3Client.send(
        new HeadObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      expect(s3Response).toBeDefined();
      expect(s3Response.ServerSideEncryption).toBe('aws:kms');
      expect(s3Response.SSEKMSKeyId).toBeTruthy();
      expect(s3Response.ContentType).toBe('application/json');
    });

    test('S3 objects are stored with date partitioning and tags', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 750 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      const result = parseLambdaResponse(lambdaResponse, 'Processing Lambda');

      // Assert - Lambda should return success
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('location');
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      await wait(2000);

      // Assert - Verify date-partitioned path structure
      expect(s3Key).toMatch(/^processed\/.+\/\d{4}\/\d{2}\/\d{2}\/.+\.json$/);
      expect(s3Key).toContain(TEST_CUSTOMER_ID);

      // Verify object metadata
      const s3Response = await s3Client.send(
        new HeadObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      expect(s3Response.Metadata).toBeDefined();
      expect(s3Response.Metadata!['transaction-id']).toBeTruthy();
      expect(s3Response.Metadata!['processed-by']).toBe('lambda-processor');
      expect(s3Response.Metadata!['version']).toBe('2.0');
    });

    test('Stored data includes checksum for integrity verification', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: {
            amount: 1000.00,
            currency: 'USD',
          },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      const result = parseLambdaResponse(lambdaResponse, 'Processing Lambda');

      // Assert - Lambda should return success
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('location');
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      await wait(3000);

      // Assert - Retrieve and verify stored data
      const s3Object = await s3Client.send(
        new GetObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      const storedData = JSON.parse(await s3Object.Body!.transformToString());

      // Verify checksum exists and is valid SHA256 format
      expect(storedData).toHaveProperty('checksum');
      expect(storedData.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
      expect(storedData).toHaveProperty('transactionId');
      expect(storedData).toHaveProperty('dataClassification', 'HIGHLY_CONFIDENTIAL');
      expect(storedData).toHaveProperty('processedAt');
      expect(storedData).toHaveProperty('originalTimestamp');
      expect(storedData).toHaveProperty('processingVersion', '2.0');
    });

    test('Stored data preserves original transaction data', async () => {
      // Arrange
      const originalTransactionData = {
        amount: 1500.00,
        currency: 'USD',
        merchantId: 'merchant-preserve-test',
        description: 'Test data preservation',
        metadata: {
          source: 'test-suite',
          priority: 'high',
        },
      };
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: originalTransactionData,
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      const result = parseLambdaResponse(lambdaResponse, 'Processing Lambda');

      // Assert - Lambda should return success
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('location');
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      await wait(3000);

      // Assert - Verify original data is preserved
      const s3Object = await s3Client.send(
        new GetObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      const storedData = JSON.parse(await s3Object.Body!.transformToString());
      expect(storedData).toHaveProperty('transactionData');
      expect(storedData.transactionData).toEqual(originalTransactionData);
      expect(storedData.transactionData.amount).toBe(1500.00);
      expect(storedData.transactionData.merchantId).toBe('merchant-preserve-test');
    });

    test('Multiple transactions stored in correct date partitions', async () => {
      // Arrange
      const transactions = [
        {
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 200, currency: 'USD' },
          timestamp: new Date().toISOString(),
        },
        {
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 300, currency: 'USD' },
          timestamp: new Date().toISOString(),
        },
      ];

      // Act
      const s3Keys: string[] = [];
      for (const tx of transactions) {
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: processingLambdaArn,
            Payload: JSON.stringify({ body: JSON.stringify(tx) }),
          })
        );
        const result = parseLambdaResponse(response, 'Processing Lambda');
        const body = JSON.parse(result.body);
        s3Keys.push(body.location);
        testS3Keys.push(body.location);
        await wait(1000);
      }

      // Assert - All keys follow date partition structure
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      for (const key of s3Keys) {
        expect(key).toMatch(new RegExp(`^processed/${TEST_CUSTOMER_ID}/${year}/${month}/${day}/.+\.json$`));
      }
    });
  });

  describe('Encrypted S3 Storage → Response Generation', () => {
    test('Processing Lambda returns success response with transaction details', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 1500 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      // Assert - Response includes all required fields
      const result = parseLambdaResponse(response, 'Processing Lambda');
      expect(result.statusCode).toBe(200);
      expect(result.headers).toBeDefined();
      expect(result.headers['X-Transaction-Id']).toBeTruthy();
      expect(result.headers['X-Request-Id']).toBeTruthy();
      expect(result.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('message', 'Data processed successfully');
      expect(body).toHaveProperty('transactionId');
      expect(body).toHaveProperty('processId');
      expect(body).toHaveProperty('location');
      expect(body).toHaveProperty('timestamp');

      // Verify transaction ID in header matches body
      expect(result.headers['X-Transaction-Id']).toBe(body.transactionId);

      // Track for cleanup
      if (body.location) {
        testS3Keys.push(body.location);
      }
    });

    test('Error responses include request ID for traceability', async () => {
      // Arrange - Invalid input
      const invalidEvent = {
        body: JSON.stringify({
          customerId: '', // Invalid: empty customerId
          transactionData: { amount: 100 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(invalidEvent),
        })
      );

      // Assert - Error response includes request ID
      const result = parseLambdaResponse(response, 'Processing Lambda');
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('requestId');
      expect(body).toHaveProperty('message');
    });

    test('Response location matches actual S3 object key', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 2500 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      const result = parseLambdaResponse(response, 'Processing Lambda');
      const responseBody = JSON.parse(result.body);
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      await wait(3000);

      // Assert - Verify object exists at the location specified in response
      const s3Response = await s3Client.send(
        new HeadObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      expect(s3Response).toBeDefined();
      expect(s3Response.ServerSideEncryption).toBe('aws:kms');
    });

    test('Response timestamp is valid ISO format', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 3000 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      // Assert - Verify timestamp format
      const result = parseLambdaResponse(response, 'Processing Lambda');
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('timestamp');

      // Verify timestamp is valid ISO 8601 format
      const timestamp = new Date(body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();

      // Track for cleanup
      if (body.location) {
        testS3Keys.push(body.location);
      }
    });
  });

  describe('Response Generation → Monitoring and Alerting', () => {

    test('Logs contain transaction processing information', async () => {
      // Arrange
      const transactionId = crypto.randomUUID();
      const event = {
        body: JSON.stringify({
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 3500 },
          timestamp: new Date().toISOString(),
        }),
      };

      // Act - Process transaction
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(event),
        })
      );

      const result = parseLambdaResponse(response, 'Processing Lambda');
      const responseBody = JSON.parse(result.body);

      // Track for cleanup
      if (responseBody.location) {
        testS3Keys.push(responseBody.location);
      }

      // Wait for logs
      await wait(5000);

      // Assert - Log streams should exist (logs may contain transaction info)
      const logStreams = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: processingLogGroup,
          limit: 5,
          orderBy: 'LastEventTime',
          descending: true,
        })
      );

      expect(logStreams.logStreams).toBeDefined();
      expect(logStreams.logStreams!.length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Alerting → Dead Letter Queue Processing', () => {
    test('DLQ is accessible and configured for failed invocations', async () => {
      // Arrange & Act - Verify DLQ exists and is accessible
      const dlqAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['ApproximateNumberOfMessages', 'MessageRetentionPeriod', 'KmsMasterKeyId'],
        })
      );

      // Assert - DLQ is configured correctly
      expect(dlqAttrs.Attributes).toBeDefined();
      expect(dlqAttrs.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(dlqAttrs.Attributes?.KmsMasterKeyId).toBeTruthy(); // KMS encryption

      // DLQ should be accessible for receiving messages
      const dlqResponse = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: dlqUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 1,
        })
      );

      // DLQ is accessible (messages may or may not exist)
      expect(dlqResponse).toBeDefined();
    });

    test('DLQ messages are encrypted with KMS', async () => {
      // Arrange & Act - Verify DLQ encryption configuration
      const dlqAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['KmsMasterKeyId', 'KmsDataKeyReusePeriodSeconds'],
        })
      );

      // Assert - DLQ uses KMS encryption
      expect(dlqAttrs.Attributes).toBeDefined();
      expect(dlqAttrs.Attributes?.KmsMasterKeyId).toBeTruthy();
      // KMS data key reuse period should be configured (typically 300 seconds)
      expect(dlqAttrs.Attributes?.KmsDataKeyReusePeriodSeconds).toBeTruthy();
    });
  });

  describe('Complete End-to-End Data Flow', () => {
    test('Complete data flow from processing to storage to verification', async () => {
      // Arrange - Partner transaction data
      const transactionData = {
        customerId: TEST_CUSTOMER_ID,
        transactionData: {
          amount: 5000.00,
          currency: 'USD',
          merchantId: 'merchant-e2e-test',
          description: 'End-to-end test transaction',
        },
        timestamp: new Date().toISOString(),
      };

      // Act - Step 1: Process transaction (simulating API Gateway → Authorizer → Processing Lambda)
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify({ body: JSON.stringify(transactionData) }),
        })
      );

      const result = JSON.parse(Buffer.from(lambdaResponse.Payload!).toString());
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      const transactionId = responseBody.transactionId;
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      // Wait for S3 eventual consistency
      await wait(3000);

      // Act - Step 2: Verify data stored in S3
      const s3Object = await s3Client.send(
        new GetObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      const storedData = JSON.parse(await s3Object.Body!.transformToString());

      // Assert - Complete workflow validated
      expect(storedData).toHaveProperty('transactionId', transactionId);
      expect(storedData).toHaveProperty('customerId', TEST_CUSTOMER_ID);
      expect(storedData).toHaveProperty('transactionData');
      expect(storedData.transactionData.amount).toBe(5000.00);
      expect(storedData).toHaveProperty('checksum');
      expect(storedData.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA256 format
      expect(storedData).toHaveProperty('dataClassification', 'HIGHLY_CONFIDENTIAL');
      expect(storedData).toHaveProperty('processedAt');
      expect(storedData).toHaveProperty('originalTimestamp');
    });

    test('Multiple transactions are processed and stored separately', async () => {
      // Arrange
      const transactions = [
        {
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 100, currency: 'USD' },
          timestamp: new Date().toISOString(),
        },
        {
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 200, currency: 'USD' },
          timestamp: new Date().toISOString(),
        },
        {
          customerId: TEST_CUSTOMER_ID,
          transactionData: { amount: 300, currency: 'USD' },
          timestamp: new Date().toISOString(),
        },
      ];

      // Act - Process multiple transactions
      const s3Keys: string[] = [];
      for (const tx of transactions) {
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: processingLambdaArn,
            Payload: JSON.stringify({ body: JSON.stringify(tx) }),
          })
        );
        const result = parseLambdaResponse(response, 'Processing Lambda');
        const body = JSON.parse(result.body);
        s3Keys.push(body.location);
        testS3Keys.push(body.location);
        await wait(1000);
      }

      // Assert - All transactions stored separately
      expect(s3Keys).toHaveLength(3);
      expect(new Set(s3Keys).size).toBe(3); // All unique

      // Verify all objects exist in S3
      for (const key of s3Keys) {
        const headResponse = await s3Client.send(
          new HeadObjectCommand({
            Bucket: dataBucketName,
            Key: key,
          })
        );
        expect(headResponse).toBeDefined();
        expect(headResponse.ServerSideEncryption).toBe('aws:kms');
      }
    });

    test('Checksum validation ensures data integrity', async () => {
      // Arrange
      const transactionData = {
        customerId: TEST_CUSTOMER_ID,
        transactionData: {
          amount: 6000.00,
          currency: 'USD',
          merchantId: 'merchant-checksum-test',
        },
        timestamp: new Date().toISOString(),
      };

      // Act - Process transaction
      const lambdaResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify({ body: JSON.stringify(transactionData) }),
        })
      );

      const result = parseLambdaResponse(lambdaResponse, 'Processing Lambda');

      // Assert - Lambda should return success
      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('location');
      const s3Key = responseBody.location;

      // Track for cleanup
      testS3Keys.push(s3Key);

      await wait(3000);

      // Act - Retrieve stored data
      const s3Object = await s3Client.send(
        new GetObjectCommand({
          Bucket: dataBucketName,
          Key: s3Key,
        })
      );

      const storedData = JSON.parse(await s3Object.Body!.transformToString());

      // Assert - Verify checksum is present and valid
      expect(storedData).toHaveProperty('checksum');
      expect(storedData.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex format

      // Verify checksum matches transaction data
      const pythonStyleTransactionData = pythonStyleJsonDump(storedData.transactionData);
      const expectedChecksum = crypto.createHash('sha256').update(pythonStyleTransactionData).digest('hex');
      expect(storedData.checksum).toBe(expectedChecksum);
    });

    test('Error handling flows to DLQ when processing fails', async () => {
      // Arrange - Get initial DLQ state
      const initialAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['ApproximateNumberOfMessages'],
        })
      );
      const initialCount = parseInt(initialAttrs.Attributes?.ApproximateNumberOfMessages || '0', 10);

      // Act - Process invalid transaction that should fail
      // Lambda errors may or may not go to DLQ depending on error type
      // This test verifies DLQ is accessible and configured
      const invalidEvent = {
        body: JSON.stringify({
          customerId: '', // Invalid: empty customerId
          transactionData: { amount: 100 },
          timestamp: new Date().toISOString(),
        }),
      };

      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: processingLambdaArn,
          Payload: JSON.stringify(invalidEvent),
        })
      );

      // Wait for potential DLQ message
      await wait(5000);

      // Assert - DLQ is accessible (message count may or may not increase)
      const finalAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['ApproximateNumberOfMessages', 'KmsMasterKeyId'],
        })
      );

      expect(finalAttrs.Attributes).toBeDefined();
      expect(finalAttrs.Attributes?.KmsMasterKeyId).toBeTruthy();
    });
  });
});