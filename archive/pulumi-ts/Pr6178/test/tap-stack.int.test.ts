/**
 * Integration tests for TapStack
 *
 * These tests verify the deployed infrastructure using stack outputs.
 * They test the complete transaction processing pipeline end-to-end.
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as AWS from 'aws-sdk';

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
const lambda = new AWS.Lambda();

// Load stack outputs
let stackOutputs: any;

beforeAll(() => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (fs.existsSync(outputsPath)) {
    stackOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } else {
    console.warn('Stack outputs not found. Skipping integration tests.');
    stackOutputs = null;
  }
});

describe('Transaction Processing Pipeline Integration Tests', () => {
  // Skip all tests if stack outputs not available
  const testIf = (condition: boolean) => (condition ? test : test.skip);

  describe('API Gateway Webhook Endpoint', () => {
    testIf(stackOutputs)('should accept valid transaction', async () => {
      const apiUrl = `https://${stackOutputs.apiUrl}`;

      const validTransaction = {
        transactionId: `test-${Date.now()}`,
        amount: 1500.00,
        userId: 'user123',
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(apiUrl, validTransaction, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('transactionId', validTransaction.transactionId);
      expect(response.data).toHaveProperty('messageId');
    }, 30000);

    testIf(stackOutputs)('should reject invalid transaction', async () => {
      const apiUrl = `https://${stackOutputs.apiUrl}`;

      const invalidTransaction = {
        transactionId: 'missing-required-fields',
        // Missing amount, userId, timestamp
      };

      try {
        await axios.post(apiUrl, invalidTransaction, {
          headers: { 'Content-Type': 'application/json' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data).toHaveProperty('details');
      }
    }, 30000);

    testIf(stackOutputs)('should reject malformed JSON', async () => {
      const apiUrl = `https://${stackOutputs.apiUrl}`;

      try {
        await axios.post(apiUrl, 'not valid json', {
          headers: { 'Content-Type': 'application/json' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    }, 30000);

    testIf(stackOutputs)('should handle concurrent requests', async () => {
      const apiUrl = `https://${stackOutputs.apiUrl}`;

      const requests = Array.from({ length: 10 }, (_, i) => {
        const transaction = {
          transactionId: `concurrent-${Date.now()}-${i}`,
          amount: 100.00 * (i + 1),
          userId: `user${i}`,
          timestamp: new Date().toISOString(),
        };

        return axios.post(apiUrl, transaction, {
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(202);
        expect(response.data).toHaveProperty('transactionId');
      });
    }, 60000);
  });

  describe('DynamoDB Data Storage', () => {
    testIf(stackOutputs)('should store enriched transaction', async () => {
      const tableName = stackOutputs.tableName;
      const apiUrl = `https://${stackOutputs.apiUrl}`;

      const transaction = {
        transactionId: `dynamo-test-${Date.now()}`,
        amount: 5000.00,
        userId: 'test-user',
        timestamp: new Date().toISOString(),
      };

      // Send transaction
      const response = await axios.post(apiUrl, transaction, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(202);

      // Wait for processing (SNS -> Lambda -> DynamoDB)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Query DynamoDB
      const result = await dynamodb
        .get({
          TableName: tableName,
          Key: {
            transactionId: transaction.transactionId,
            timestamp: transaction.timestamp,
          },
        })
        .promise();

      expect(result.Item).toBeDefined();
      expect(result.Item).toHaveProperty('transactionId', transaction.transactionId);
      expect(result.Item).toHaveProperty('amount', transaction.amount);
      expect(result.Item).toHaveProperty('status', 'processed');
      expect(result.Item).toHaveProperty('riskLevel');
      expect(result.Item).toHaveProperty('processedAt');
      expect(result.Item).toHaveProperty('enrichmentData');
    }, 30000);

    testIf(stackOutputs)('should apply correct risk levels', async () => {
      const tableName = stackOutputs.tableName;
      const apiUrl = `https://${stackOutputs.apiUrl}`;

      const testCases = [
        { amount: 500, expectedRisk: 'low' },
        { amount: 5000, expectedRisk: 'medium' },
        { amount: 15000, expectedRisk: 'high' },
      ];

      for (const testCase of testCases) {
        const transaction = {
          transactionId: `risk-test-${Date.now()}-${testCase.amount}`,
          amount: testCase.amount,
          userId: 'risk-test-user',
          timestamp: new Date().toISOString(),
        };

        await axios.post(apiUrl, transaction, {
          headers: { 'Content-Type': 'application/json' },
        });

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const result = await dynamodb
          .get({
            TableName: tableName,
            Key: {
              transactionId: transaction.transactionId,
              timestamp: transaction.timestamp,
            },
          })
          .promise();

        expect(result.Item).toBeDefined();
        expect(result.Item?.riskLevel).toBe(testCase.expectedRisk);
      }
    }, 90000);
  });

  describe('Lambda Functions', () => {
    testIf(stackOutputs)('should have validation Lambda deployed', async () => {
      const functionArn = stackOutputs.validationLambdaArn;
      const functionName = functionArn.split(':').pop();

      const result = await lambda
        .getFunction({
          FunctionName: functionName,
        })
        .promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.Runtime).toBe('nodejs18.x');
      expect(result.Configuration?.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    testIf(stackOutputs)('should have processing Lambda deployed', async () => {
      const functionArn = stackOutputs.processingLambdaArn;
      const functionName = functionArn.split(':').pop();

      const result = await lambda
        .getFunction({
          FunctionName: functionName,
        })
        .promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.Runtime).toBe('nodejs18.x');
      expect(result.Configuration?.TracingConfig?.Mode).toBe('Active');
      expect(result.Configuration?.DeadLetterConfig).toBeDefined();
    }, 30000);
  });

  describe('Error Handling and DLQ', () => {
    testIf(stackOutputs)('should have DLQ configured', async () => {
      const dlqUrl = stackOutputs.dlqUrl;

      const attributes = await sqs
        .getQueueAttributes({
          QueueUrl: dlqUrl,
          AttributeNames: ['MessageRetentionPeriod', 'VisibilityTimeout'],
        })
        .promise();

      expect(attributes.Attributes).toBeDefined();
      expect(attributes.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(attributes.Attributes?.VisibilityTimeout).toBe('300'); // 5 minutes
    }, 30000);
  });

  describe('Stack Outputs', () => {
    testIf(stackOutputs)('should have all required outputs', () => {
      expect(stackOutputs).toHaveProperty('apiUrl');
      expect(stackOutputs).toHaveProperty('tableName');
      expect(stackOutputs).toHaveProperty('apiGatewayId');
      expect(stackOutputs).toHaveProperty('snsTopicArn');
      expect(stackOutputs).toHaveProperty('dlqUrl');
      expect(stackOutputs).toHaveProperty('validationLambdaArn');
      expect(stackOutputs).toHaveProperty('processingLambdaArn');
    });

    testIf(stackOutputs)('should have properly formatted ARNs', () => {
      expect(stackOutputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(stackOutputs.validationLambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(stackOutputs.processingLambdaArn).toMatch(/^arn:aws:lambda:/);
    });

    testIf(stackOutputs)('should have valid API Gateway URL', () => {
      expect(stackOutputs.apiUrl).toMatch(/\.execute-api\..+\.amazonaws\.com/);
    });

    testIf(stackOutputs)('should have valid SQS queue URL', () => {
      expect(stackOutputs.dlqUrl).toMatch(/^https:\/\/sqs\./);
    });
  });
});

describe('End-to-End Transaction Flow', () => {
  const testIf = (condition: boolean) => (condition ? test : test.skip);

  testIf(stackOutputs)('should process transaction from webhook to database', async () => {
    const apiUrl = `https://${stackOutputs.apiUrl}`;
    const tableName = stackOutputs.tableName;

    const transaction = {
      transactionId: `e2e-${Date.now()}`,
      amount: 2500.00,
      userId: 'e2e-test-user',
      timestamp: new Date().toISOString(),
    };

    // Step 1: Send webhook request
    const apiResponse = await axios.post(apiUrl, transaction, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(apiResponse.status).toBe(202);
    expect(apiResponse.data).toHaveProperty('messageId');

    // Step 2: Wait for async processing
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Step 3: Verify data in DynamoDB
    const dbResult = await dynamodb
      .get({
        TableName: tableName,
        Key: {
          transactionId: transaction.transactionId,
          timestamp: transaction.timestamp,
        },
      })
      .promise();

    expect(dbResult.Item).toBeDefined();
    expect(dbResult.Item).toMatchObject({
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      userId: transaction.userId,
      status: 'processed',
      riskLevel: 'medium',
    });
    expect(dbResult.Item).toHaveProperty('validatedAt');
    expect(dbResult.Item).toHaveProperty('processedAt');
    expect(dbResult.Item).toHaveProperty('enrichmentData');

    // Verify enrichment data structure
    expect(dbResult.Item?.enrichmentData).toHaveProperty('processingTimestamp');
    expect(dbResult.Item?.enrichmentData).toHaveProperty('processingRegion', region);
    expect(dbResult.Item?.enrichmentData).toHaveProperty('version', '1.0');
  }, 45000);
});
