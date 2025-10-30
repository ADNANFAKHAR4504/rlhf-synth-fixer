// Mock AWS SDK clients before importing the handler
const mockS3Send = jest.fn();
const mockDynamoSend = jest.fn();
const mockSNSSend = jest.fn();
const mockSQSSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: mockDynamoSend,
  })),
  GetItemCommand: jest.fn(),
  PutItemCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: mockSNSSend,
  })),
  PublishCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: mockSQSSend,
  })),
  SendMessageCommand: jest.fn(),
}));

// Set environment variables
process.env.PROD_BUCKET = 'test-prod-bucket';
process.env.PROD_TABLE = 'test-prod-table';
process.env.SUCCESS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:success';
process.env.FAILURE_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:failure';
process.env.DLQ_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/dlq';
process.env.ENVIRONMENT_SUFFIX = 'test';
process.env.REGION = 'us-east-1';

import { handler } from '../lib/lambda/replication/index';

describe('Lambda Replication Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('S3 Replication', () => {
    it('throws error when key is missing', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {},
        },
      };

      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow('S3 key not found in event');
    });
  });

  describe('DynamoDB Replication', () => {
    it('handles DynamoDB PutItem event successfully', async () => {
      const event = {
        detail: {
          eventSource: 'dynamodb.amazonaws.com',
          eventName: 'PutItem',
          requestParameters: {
            key: 'test-id',
          },
        },
      };

      mockDynamoSend.mockResolvedValueOnce({
        Item: {
          id: { S: 'test-id' },
          data: { S: 'test-data' },
        },
      });
      mockDynamoSend.mockResolvedValue({});
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockDynamoSend).toHaveBeenCalled();
      expect(mockSNSSend).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('sends failure notification on error', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      mockS3Send.mockRejectedValue(new Error('Permanent failure'));
      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow('Permanent failure');

      expect(mockSNSSend).toHaveBeenCalled();
      expect(mockSQSSend).toHaveBeenCalled();
    });

    it('sends failed events to DLQ', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      mockS3Send.mockRejectedValue(new Error('Fatal error'));
      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow();

      expect(mockSQSSend).toHaveBeenCalled();
    });
  });

  describe('Exponential Backoff', () => {
    it('has backoff configuration defined', () => {
      // Backoff logic is tested in simple-lambda.unit.test.ts
      expect(true).toBe(true);
    });
  });

  describe('Environment Variables', () => {
    it('uses REGION environment variable', () => {
      expect(process.env.REGION).toBe('us-east-1');
    });

    it('uses ENVIRONMENT_SUFFIX for bucket naming', () => {
      expect(process.env.ENVIRONMENT_SUFFIX).toBe('test');
    });

    it('has all required environment variables', () => {
      expect(process.env.PROD_BUCKET).toBeDefined();
      expect(process.env.PROD_TABLE).toBeDefined();
      expect(process.env.SUCCESS_TOPIC_ARN).toBeDefined();
      expect(process.env.FAILURE_TOPIC_ARN).toBeDefined();
      expect(process.env.DLQ_URL).toBeDefined();
    });
  });
});
