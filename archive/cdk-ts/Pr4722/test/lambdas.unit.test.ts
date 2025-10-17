import { mockClient } from 'aws-sdk-client-mock';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { unmarshall } from '@aws-sdk/util-dynamodb';

describe('Lambda Functions Unit Tests', () => {
  // Create mock clients at test suite level to avoid circular reference issues
  let ssmMock: any;
  let dynamoDBMock: any;
  let dynamoDBDocMock: any;
  let cloudWatchMock: any;
  let s3Mock: any;
  let snsMock: any;

  beforeAll(() => {
    // Create mocks once for the entire test suite
    ssmMock = mockClient(SSMClient);
    dynamoDBMock = mockClient(DynamoDBClient);
    dynamoDBDocMock = mockClient(DynamoDBDocumentClient);
    cloudWatchMock = mockClient(CloudWatchClient);
    s3Mock = mockClient(S3Client);
    snsMock = mockClient(SNSClient);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    ssmMock.reset();
    dynamoDBMock.reset();
    dynamoDBDocMock.reset();
    cloudWatchMock.reset();
    s3Mock.reset();
    snsMock.reset();
  });

  describe('Authorizer Lambda', () => {
    beforeAll(() => {
      process.env.PARAMETER_STORE_PREFIX = '/marketgrid/dev/test/api-keys/';
    });

    const handler = require('../lib/lambdas/authorizer/index').handler;

    test('allows request with valid API key', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'valid-api-key-123',
        },
      });

      const event = {
        type: 'TOKEN',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/POST/webhook/stripe',
        authorizationToken: 'valid-api-key-123',
        headers: {
          'x-provider': 'stripe',
        },
      };

      const result = await handler(event);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
    });

    test('denies request with invalid API key', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'valid-api-key-123',
        },
      });

      const event = {
        type: 'TOKEN',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/POST/webhook/stripe',
        authorizationToken: 'invalid-api-key',
        headers: {
          'x-provider': 'stripe',
        },
      };

      const result = await handler(event);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('denies request when SSM parameter not found', async () => {
      ssmMock.on(GetParameterCommand).rejects(new Error('ParameterNotFound'));

      const event = {
        type: 'TOKEN',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/POST/webhook/stripe',
        authorizationToken: 'some-api-key',
        headers: {
          'x-provider': 'stripe',
        },
      };

      const result = await handler(event);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('extracts provider from method ARN', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'test-key',
        },
      });

      const event = {
        type: 'TOKEN',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/POST/webhook/paypal',
        authorizationToken: 'test-key',
      };

      await handler(event);

      expect(ssmMock.calls()[0].args[0].input.Name).toContain('paypal');
    });
  });

  describe('Webhook Processor Lambda', () => {
    beforeAll(() => {
      process.env.TRANSACTIONS_TABLE = 'MarketGrid-Transactions-test';
      process.env.STAGE_NAME = 'dev';
    });

    const handler = require('../lib/lambdas/webhook-processor/index').handler;

    test('processes valid webhook from SQS', async () => {
      dynamoDBDocMock.on(PutCommand).resolves({});
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const event = {
        Records: [
          {
            body: JSON.stringify({
              id: 'txn-123',
              vendor_id: 'vendor-456',
              amount: 99.99,
              currency: 'USD',
              provider: 'stripe',
            }),
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(dynamoDBDocMock.calls()).toHaveLength(1);
      expect(cloudWatchMock.calls()).toHaveLength(1);
    });

    test('stores transaction with correct structure in DynamoDB', async () => {
      dynamoDBDocMock.on(PutCommand).resolves({});
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const event = {
        Records: [
          {
            body: JSON.stringify({
              id: 'txn-789',
              vendor_id: 'vendor-123',
              amount: 49.99,
              currency: 'EUR',
              provider: 'paypal',
            }),
          },
        ],
      };

      await handler(event);

      const putCall = dynamoDBDocMock.calls()[0];
      const item = putCall.args[0].input.Item;

      expect(item.transactionId).toBe('txn-789');
      expect(item.vendorId).toBe('vendor-123');
      expect(item.amount).toBe(49.99);
      expect(item.currency).toBe('EUR');
      expect(item.provider).toBe('paypal');
      expect(item.status).toBe('completed');
      expect(item.processedAt).toBeDefined();
    });

    test('processes multiple records in batch', async () => {
      dynamoDBDocMock.on(PutCommand).resolves({});
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const event = {
        Records: [
          {
            body: JSON.stringify({
              id: 'txn-1',
              vendor_id: 'vendor-1',
              amount: 10.00,
              currency: 'USD',
            }),
          },
          {
            body: JSON.stringify({
              id: 'txn-2',
              vendor_id: 'vendor-2',
              amount: 20.00,
              currency: 'USD',
            }),
          },
        ],
      };

      await handler(event);

      expect(dynamoDBDocMock.calls()).toHaveLength(2);
      expect(cloudWatchMock.calls()).toHaveLength(2);
    });

    test('generates transaction ID if not provided', async () => {
      dynamoDBDocMock.on(PutCommand).resolves({});
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const event = {
        Records: [
          {
            body: JSON.stringify({
              vendor_id: 'vendor-123',
              amount: 99.99,
              currency: 'USD',
            }),
          },
        ],
      };

      await handler(event);

      const putCall = dynamoDBDocMock.calls()[0];
      const item = putCall.args[0].input.Item;

      expect(item.transactionId).toMatch(/^txn-\d+-[a-z0-9]+$/);
    });

    test('emits CloudWatch metric for successful transaction', async () => {
      dynamoDBDocMock.on(PutCommand).resolves({});
      cloudWatchMock.on(PutMetricDataCommand).resolves({});

      const event = {
        Records: [
          {
            body: JSON.stringify({
              id: 'txn-metric-test',
              vendor_id: 'vendor-123',
              amount: 99.99,
              currency: 'USD',
            }),
          },
        ],
      };

      await handler(event);

      const metricCall = cloudWatchMock.calls()[0];
      const metricData = metricCall.args[0].input;

      expect(metricData.Namespace).toBe('MarketGrid');
      expect(metricData.MetricData[0].MetricName).toBe('SuccessfulTransactions');
      expect(metricData.MetricData[0].Value).toBe(1);
      expect(metricData.MetricData[0].Unit).toBe('Count');
    });

    test('throws error on DynamoDB failure', async () => {
      dynamoDBDocMock.on(PutCommand).rejects(new Error('DynamoDB error'));

      const event = {
        Records: [
          {
            body: JSON.stringify({
              id: 'txn-error',
              vendor_id: 'vendor-123',
              amount: 99.99,
              currency: 'USD',
            }),
          },
        ],
      };

      await expect(handler(event)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('Webhook Archiver Lambda', () => {
    beforeAll(() => {
      process.env.ARCHIVE_BUCKET = 'marketgrid-webhook-archive-test';
    });

    const handler = require('../lib/lambdas/webhook-archiver/index').handler;

    test('archives webhook from DynamoDB stream', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const event = [
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-123' },
              vendorId: { S: 'vendor-456' },
              amount: { N: '99.99' },
              currency: { S: 'USD' },
              timestamp: { N: '1634567890000' },
              provider: { S: 'stripe' },
              status: { S: 'completed' },
            },
          },
        },
      ];

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Mock.calls()).toHaveLength(1);
    });

    test('creates S3 key with correct date format', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const timestamp = new Date('2025-10-17T12:00:00Z').getTime();

      const event = [
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-date-test' },
              vendorId: { S: 'vendor-123' },
              timestamp: { N: timestamp.toString() },
            },
          },
        },
      ];

      await handler(event);

      const s3Call = s3Mock.calls()[0];
      const key = s3Call.args[0].input.Key;

      expect(key).toMatch(/^webhooks\/\d{4}-\d{2}-\d{2}\/txn-date-test\.json$/);
    });

    test('includes metadata in S3 object', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const event = [
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-metadata' },
              vendorId: { S: 'vendor-789' },
              timestamp: { N: '1634567890000' },
            },
          },
        },
      ];

      await handler(event);

      const s3Call = s3Mock.calls()[0];
      const metadata = s3Call.args[0].input.Metadata;

      expect(metadata.transactionId).toBe('txn-metadata');
      expect(metadata.vendorId).toBe('vendor-789');
      expect(metadata.archivedAt).toBeDefined();
    });

    test('processes multiple stream records', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const event = [
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-1' },
              timestamp: { N: '1634567890000' },
            },
          },
        },
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-2' },
              timestamp: { N: '1634567890000' },
            },
          },
        },
      ];

      await handler(event);

      expect(s3Mock.calls()).toHaveLength(2);
    });

    test('throws error on S3 failure', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 error'));

      const event = [
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-error' },
              timestamp: { N: '1634567890000' },
            },
          },
        },
      ];

      await expect(handler(event)).rejects.toThrow('S3 error');
    });

    test('stores complete transaction data in JSON format', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const event = [
        {
          dynamodb: {
            NewImage: {
              transactionId: { S: 'txn-complete' },
              vendorId: { S: 'vendor-999' },
              amount: { N: '199.99' },
              currency: { S: 'GBP' },
              timestamp: { N: '1634567890000' },
              provider: { S: 'stripe' },
              status: { S: 'completed' },
              rawWebhook: { S: '{"data": "test"}' },
            },
          },
        },
      ];

      await handler(event);

      const s3Call = s3Mock.calls()[0];
      const body = s3Call.args[0].input.Body;
      const parsedBody = JSON.parse(body);

      expect(parsedBody.transactionId).toBe('txn-complete');
      expect(parsedBody.vendorId).toBe('vendor-999');
      expect(parsedBody.amount).toBe(199.99);
      expect(parsedBody.currency).toBe('GBP');
    });
  });

  describe('Vendor Notifier Lambda', () => {
    beforeAll(() => {
      process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    });

    const handler = require('../lib/lambdas/vendor-notifier/index').handler;

    test('publishes notification for new transaction', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-notify' },
                vendorId: { S: 'vendor-111' },
                amount: { N: '149.99' },
                currency: { S: 'USD' },
                timestamp: { N: '1634567890000' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(snsMock.calls()).toHaveLength(1);
    });

    test('includes all transaction details in notification', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-details' },
                vendorId: { S: 'vendor-222' },
                amount: { N: '99.50' },
                currency: { S: 'EUR' },
                timestamp: { N: '1634567890000' },
              },
            },
          },
        ],
      };

      await handler(event);

      const snsCall = snsMock.calls()[0];
      const message = JSON.parse(snsCall.args[0].input.Message);

      expect(message.transactionId).toBe('txn-details');
      expect(message.vendorId).toBe('vendor-222');
      expect(message.amount).toBe(99.50);
      expect(message.currency).toBe('EUR');
      expect(message.message).toContain('New sale for vendor vendor-222');
    });

    test('sets SNS message attributes', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-attrs' },
                vendorId: { S: 'vendor-333' },
                amount: { N: '75.00' },
              },
            },
          },
        ],
      };

      await handler(event);

      const snsCall = snsMock.calls()[0];
      const attributes = snsCall.args[0].input.MessageAttributes;

      expect(attributes.vendorId.StringValue).toBe('vendor-333');
      expect(attributes.transactionId.StringValue).toBe('txn-attrs');
      expect(attributes.amount.StringValue).toBe('75');
    });

    test('includes subject in SNS notification', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-subject' },
                vendorId: { S: 'vendor-444' },
                amount: { N: '50.00' },
              },
            },
          },
        ],
      };

      await handler(event);

      const snsCall = snsMock.calls()[0];
      const subject = snsCall.args[0].input.Subject;

      expect(subject).toBe('New Sale Notification - Transaction txn-subject');
    });

    test('processes multiple INSERT events', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-1' },
                vendorId: { S: 'vendor-1' },
                amount: { N: '10.00' },
              },
            },
          },
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-2' },
                vendorId: { S: 'vendor-2' },
                amount: { N: '20.00' },
              },
            },
          },
        ],
      };

      await handler(event);

      expect(snsMock.calls()).toHaveLength(2);
    });

    test('skips non-INSERT events', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-modify' },
                vendorId: { S: 'vendor-555' },
                amount: { N: '100.00' },
              },
            },
          },
          {
            eventName: 'REMOVE',
            dynamodb: {
              OldImage: {
                transactionId: { S: 'txn-remove' },
              },
            },
          },
        ],
      };

      await handler(event);

      expect(snsMock.calls()).toHaveLength(0);
    });

    test('throws error on SNS failure', async () => {
      snsMock.on(PublishCommand).rejects(new Error('SNS error'));

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-error' },
                vendorId: { S: 'vendor-666' },
                amount: { N: '100.00' },
              },
            },
          },
        ],
      };

      await expect(handler(event)).rejects.toThrow('SNS error');
    });

    test('handles missing vendor ID gracefully', async () => {
      snsMock.on(PublishCommand).resolves({ MessageId: 'msg-123' });

      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                transactionId: { S: 'txn-no-vendor' },
                amount: { N: '100.00' },
              },
            },
          },
        ],
      };

      await handler(event);

      const snsCall = snsMock.calls()[0];
      const attributes = snsCall.args[0].input.MessageAttributes;

      expect(attributes.vendorId.StringValue).toBe('unknown');
    });
  });
});
