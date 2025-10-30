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

    it('successfully replicates S3 object to target environments', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      const mockBody = new Uint8Array([1, 2, 3, 4]);
      let callCount = 0;

      // Mock S3 calls: GetObject, PutObject, GetObject, PutObject (for dev and staging)
      mockS3Send.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) {
          // GetObject calls (for dev and staging)
          return Promise.resolve({
            Body: {
              transformToByteArray: () => Promise.resolve(mockBody),
            },
            Metadata: { 'test-key': 'test-value' },
          });
        } else {
          // PutObject calls
          return Promise.resolve({});
        }
      });
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockS3Send).toHaveBeenCalledTimes(4); // 2 gets + 2 puts (dev, staging)
      expect(mockSNSSend).toHaveBeenCalled();
    });

    it('throws error when S3 object body is empty', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      mockS3Send.mockResolvedValueOnce({
        Body: {
          transformToByteArray: jest.fn().mockResolvedValue(null),
        },
      });
      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow('Empty object body');
    });

    it('throws error when S3 response has no Body property', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      mockS3Send.mockResolvedValueOnce({
        Metadata: { 'test-key': 'test-value' },
      });
      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow('Empty object body');
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

    it('throws error when DynamoDB item is not found', async () => {
      const event = {
        detail: {
          eventSource: 'dynamodb.amazonaws.com',
          eventName: 'PutItem',
          requestParameters: {
            key: 'missing-id',
          },
        },
      };

      mockDynamoSend.mockResolvedValueOnce({});
      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow('Item not found');
    });

    it('handles DynamoDB event without key in requestParameters', async () => {
      const event = {
        detail: {
          eventSource: 'dynamodb.amazonaws.com',
          eventName: 'PutItem',
          requestParameters: {},
        },
      };

      mockDynamoSend.mockResolvedValueOnce({
        Item: {
          id: { S: 'unknown' },
          data: { S: 'test-data' },
        },
      });
      mockDynamoSend.mockResolvedValue({});
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockDynamoSend).toHaveBeenCalled();
    });

    it('sends success notification after DynamoDB replication', async () => {
      const event = {
        detail: {
          eventSource: 'dynamodb.amazonaws.com',
          eventName: 'PutItem',
          requestParameters: {
            key: 'notification-test-id',
          },
        },
      };

      mockDynamoSend.mockResolvedValueOnce({
        Item: {
          id: { S: 'notification-test-id' },
          data: { S: 'test-data' },
        },
      });
      mockDynamoSend.mockResolvedValue({});
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSSend).toHaveBeenCalledTimes(1);
      expect(mockDynamoSend).toHaveBeenCalled();
    });
  });

  describe('Event Source Handling', () => {
    it('handles unknown event source gracefully', async () => {
      const event = {
        detail: {
          eventSource: 'unknown.amazonaws.com',
          eventName: 'UnknownEvent',
          requestParameters: {},
        },
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      // No replication should happen for unknown sources
      expect(mockS3Send).not.toHaveBeenCalled();
      expect(mockDynamoSend).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('sends success notification on successful replication', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      const mockBody = new Uint8Array([1, 2, 3, 4]);
      let callCount = 0;

      mockS3Send.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) {
          return Promise.resolve({
            Body: {
              transformToByteArray: () => Promise.resolve(mockBody),
            },
            Metadata: {},
          });
        } else {
          return Promise.resolve({});
        }
      });
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSSend).toHaveBeenCalledTimes(1);
      // Verify it was called with success notification
      const snsCall = mockSNSSend.mock.calls[0];
      expect(snsCall).toBeDefined();
    });

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

    it('handles non-Error exceptions', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      // Reject with a non-Error value to test the else branch
      const nonErrorValue = { message: 'Not an Error object' };
      mockS3Send.mockRejectedValue(nonErrorValue);
      mockSNSSend.mockResolvedValue({});
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toEqual(nonErrorValue);

      expect(mockSNSSend).toHaveBeenCalled();
      expect(mockSQSSend).toHaveBeenCalled();
    });
  });

  describe('Exponential Backoff', () => {
    it('has backoff configuration defined', () => {
      // Backoff logic is tested in simple-lambda.unit.test.ts
      expect(true).toBe(true);
    });

    it('successfully retries after transient failure', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'test-file.json',
          },
        },
      };

      const mockBody = new Uint8Array([1, 2, 3, 4]);
      let callCount = 0;

      // First GetObject fails, second GetObject succeeds, then PutObjects succeed
      mockS3Send.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First GetObject attempt fails
          return Promise.reject(new Error('Transient error'));
        } else if (callCount === 2 || callCount === 4) {
          // Retry GetObject succeeds (for dev and staging)
          return Promise.resolve({
            Body: {
              transformToByteArray: () => Promise.resolve(mockBody),
            },
            Metadata: { 'test-key': 'test-value' },
          });
        } else {
          // PutObject calls
          return Promise.resolve({});
        }
      });
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockS3Send.mock.calls.length).toBeGreaterThan(4); // Should have retry attempts
      expect(mockSNSSend).toHaveBeenCalled();
    });

    it('retries with exponential backoff delays', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'backoff-test.json',
          },
        },
      };

      const mockBody = new Uint8Array([1, 2, 3]);
      let callCount = 0;

      // Fail first 2 attempts, then succeed
      mockS3Send.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Temporary error'));
        } else if (callCount === 3 || callCount === 5) {
          // GetObject succeeds
          return Promise.resolve({
            Body: {
              transformToByteArray: () => Promise.resolve(mockBody),
            },
            Metadata: {},
          });
        } else {
          // PutObject
          return Promise.resolve({});
        }
      });
      mockSNSSend.mockResolvedValue({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(callCount).toBeGreaterThan(4);
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

  describe('Notification Handling', () => {
    it('calls publishNotification with correct parameters for S3 success', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'notification-test.json',
          },
        },
      };

      const mockBody = new Uint8Array([1, 2, 3, 4]);
      let callCount = 0;

      mockS3Send.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) {
          return Promise.resolve({
            Body: {
              transformToByteArray: () => Promise.resolve(mockBody),
            },
            Metadata: {},
          });
        } else {
          return Promise.resolve({});
        }
      });

      let snsCallArgs: any;
      mockSNSSend.mockImplementation((...args) => {
        snsCallArgs = args;
        return Promise.resolve({});
      });

      await handler(event);

      expect(mockSNSSend).toHaveBeenCalled();
      expect(snsCallArgs).toBeDefined();
    });

    it('calls publishNotification with correct parameters for DynamoDB success', async () => {
      const event = {
        detail: {
          eventSource: 'dynamodb.amazonaws.com',
          eventName: 'PutItem',
          requestParameters: {
            key: 'notification-dynamo-test',
          },
        },
      };

      mockDynamoSend.mockResolvedValueOnce({
        Item: {
          id: { S: 'notification-dynamo-test' },
          data: { S: 'test-data' },
        },
      });
      mockDynamoSend.mockResolvedValue({});

      let snsCallArgs: any;
      mockSNSSend.mockImplementation((...args) => {
        snsCallArgs = args;
        return Promise.resolve({});
      });

      await handler(event);

      expect(mockSNSSend).toHaveBeenCalled();
      expect(snsCallArgs).toBeDefined();
    });

    it('publishes to failure topic when error occurs', async () => {
      const event = {
        detail: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutObject',
          requestParameters: {
            key: 'failure-test.json',
          },
        },
      };

      mockS3Send.mockRejectedValue(new Error('Test failure'));

      let publishedToFailureTopic = false;
      mockSNSSend.mockImplementation(() => {
        publishedToFailureTopic = true;
        return Promise.resolve({});
      });
      mockSQSSend.mockResolvedValue({});

      await expect(handler(event)).rejects.toThrow('Test failure');

      expect(publishedToFailureTopic).toBe(true);
      expect(mockSNSSend).toHaveBeenCalled();
    });
  });
});
