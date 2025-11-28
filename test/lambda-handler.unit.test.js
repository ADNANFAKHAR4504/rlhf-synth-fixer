const { handler } = require('../lib/lambda-handler');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockQuery = jest.fn();
  const mockPublish = jest.fn();

  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        query: mockQuery
      }))
    },
    SNS: jest.fn(() => ({
      publish: mockPublish
    }))
  };
});

describe('Lambda Handler Unit Tests', () => {
  let mockQuery;
  let mockPublish;
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.DYNAMODB_TABLE_NAME = 'test-table';
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const AWS = require('aws-sdk');
    mockQuery = new AWS.DynamoDB.DocumentClient().query;
    mockPublish = new AWS.SNS().publish;

    // Set up default successful responses
    mockQuery.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: [
          { userId: 'test-user', alertId: 'alert-1', cryptocurrency: 'BTC', targetPrice: 50000 }
        ]
      })
    });

    mockPublish.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'test-message-id'
      })
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Basic Functionality', () => {
    test('should export handler function', () => {
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    test('should process event with default userId', async () => {
      const event = {};
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toBe('Price check processed successfully');
    });

    test('should process event with specified userId', async () => {
      const event = { userId: 'custom-user' };
      const result = await handler(event);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-table',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': 'custom-user'
          }
        })
      );
      expect(result.statusCode).toBe(200);
    });

    test('should return correct status code on success', async () => {
      const event = { userId: 'test-user' };
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
    });

    test('should return JSON body with message', async () => {
      const event = { userId: 'test-user' };
      const result = await handler(event);

      const body = JSON.parse(result.body);
      expect(body.message).toBeDefined();
      expect(body.message).toBe('Price check processed successfully');
    });

    test('should return alerts checked count', async () => {
      const event = { userId: 'test-user' };
      const result = await handler(event);

      const body = JSON.parse(result.body);
      expect(body.alertsChecked).toBeDefined();
      expect(body.alertsChecked).toBe(1);
    });
  });

  describe('DynamoDB Integration', () => {
    test('should query DynamoDB with correct parameters', async () => {
      const event = { userId: 'user-123' };
      await handler(event);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith({
        TableName: 'test-table',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'user-123'
        }
      });
    });

    test('should use DYNAMODB_TABLE_NAME from environment', async () => {
      const event = { userId: 'test-user' };
      await handler(event);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: process.env.DYNAMODB_TABLE_NAME
        })
      );
    });

    test('should handle empty results from DynamoDB', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: []
        })
      });

      const event = { userId: 'user-with-no-alerts' };
      const result = await handler(event);

      const body = JSON.parse(result.body);
      expect(body.alertsChecked).toBe(0);
    });

    test('should handle multiple alerts', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { userId: 'test-user', alertId: 'alert-1', cryptocurrency: 'BTC', targetPrice: 50000 },
            { userId: 'test-user', alertId: 'alert-2', cryptocurrency: 'ETH', targetPrice: 3000 },
            { userId: 'test-user', alertId: 'alert-3', cryptocurrency: 'ADA', targetPrice: 2 }
          ]
        })
      });

      const event = { userId: 'test-user' };
      const result = await handler(event);

      const body = JSON.parse(result.body);
      expect(body.alertsChecked).toBe(3);
    });
  });

  describe('SNS Notifications', () => {
    test('should send SNS notification when price threshold is met', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 51000
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledTimes(1);
      expect(mockPublish).toHaveBeenCalledWith({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: 'Price alert triggered! BTC reached 51000',
        Subject: 'Cryptocurrency Price Alert'
      });
    });

    test('should not send notification when price threshold not met', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 49000
      };

      await handler(event);

      expect(mockPublish).not.toHaveBeenCalled();
    });

    test('should not send notification when priceAlert is missing', async () => {
      const event = {
        userId: 'test-user',
        currentPrice: 51000
      };

      await handler(event);

      expect(mockPublish).not.toHaveBeenCalled();
    });

    test('should not send notification when currentPrice is missing', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        }
      };

      await handler(event);

      expect(mockPublish).not.toHaveBeenCalled();
    });

    test('should send notification with correct cryptocurrency name', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'ETH',
          targetPrice: 3000
        },
        currentPrice: 3100
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: 'Price alert triggered! ETH reached 3100'
        })
      );
    });

    test('should use SNS_TOPIC_ARN from environment', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 51000
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: process.env.SNS_TOPIC_ARN
        })
      );
    });

    test('should send notification when price equals target (boundary condition)', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 50000
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when DynamoDB query fails', async () => {
      const dynamoError = new Error('DynamoDB connection failed');
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(dynamoError)
      });

      const event = { userId: 'test-user' };

      await expect(handler(event)).rejects.toThrow('DynamoDB connection failed');
    });

    test('should throw error when SNS publish fails', async () => {
      const snsError = new Error('SNS publish failed');
      mockPublish.mockReturnValue({
        promise: jest.fn().mockRejectedValue(snsError)
      });

      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 51000
      };

      await expect(handler(event)).rejects.toThrow('SNS publish failed');
    });

    test('should throw error when query promise rejects', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Query failed'))
      });

      const event = { userId: 'test-user' };

      await expect(handler(event)).rejects.toThrow('Query failed');
    });

    test('should throw error when both DynamoDB and SNS fail', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB failed'))
      });

      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 51000
      };

      await expect(handler(event)).rejects.toThrow('DynamoDB failed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle event with only priceAlert (no currentPrice)', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        }
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockPublish).not.toHaveBeenCalled();
    });

    test('should handle event with only currentPrice (no priceAlert)', async () => {
      const event = {
        userId: 'test-user',
        currentPrice: 51000
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockPublish).not.toHaveBeenCalled();
    });

    test('should handle empty event object', async () => {
      const event = {};
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockQuery).toHaveBeenCalled();
    });

    test('should use default userId when not provided', async () => {
      const event = {};
      await handler(event);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: {
            ':userId': 'test-user'
          }
        })
      );
    });

    test('should handle very large alertsChecked count', async () => {
      const largeItems = Array(1000).fill(null).map((_, i) => ({
        userId: 'test-user',
        alertId: `alert-${i}`,
        cryptocurrency: 'BTC',
        targetPrice: 50000
      }));

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: largeItems
        })
      });

      const event = { userId: 'test-user' };
      const result = await handler(event);

      const body = JSON.parse(result.body);
      expect(body.alertsChecked).toBe(1000);
    });

    test('should handle cryptocurrency with special characters', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC-USD',
          targetPrice: 50000
        },
        currentPrice: 51000
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: 'Price alert triggered! BTC-USD reached 51000'
        })
      );
    });

    test('should handle very large price values', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 1000000
        },
        currentPrice: 1000001
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: 'Price alert triggered! BTC reached 1000001'
        })
      );
    });

    test('should handle decimal price values', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'ETH',
          targetPrice: 3000.50
        },
        currentPrice: 3000.75
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });

    test('should handle price exactly at boundary', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 50000
      };

      await handler(event);

      expect(mockPublish).toHaveBeenCalledTimes(1);
    });

    test('should handle price just below boundary', async () => {
      const event = {
        userId: 'test-user',
        priceAlert: {
          cryptocurrency: 'BTC',
          targetPrice: 50000
        },
        currentPrice: 49999.99
      };

      await handler(event);

      expect(mockPublish).not.toHaveBeenCalled();
    });
  });
});
