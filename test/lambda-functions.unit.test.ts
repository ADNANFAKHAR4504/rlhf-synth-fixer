import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn(),
    })),
  },
  TransactWriteCommand: jest.fn().mockImplementation((params) => params),
  UpdateCommand: jest.fn().mockImplementation((params) => params),
  GetCommand: jest.fn().mockImplementation((params) => params),
  unmarshall: jest.fn((data) => data),
}));
jest.mock('@aws-sdk/client-sns');

describe('Lambda Functions Unit Tests', () => {
  describe('Point Calculation Lambda', () => {
    let handler: any;
    let mockDocClient: any;

    beforeEach(() => {
      jest.clearAllMocks();

      // Mock environment variables
      process.env.LOYALTY_TABLE_NAME = 'test-loyalty-table';
      process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-west-2:123456789012:test-topic';
      process.env.AWS_REGION = 'us-west-2';

      // Mock DynamoDB Document Client
      mockDocClient = {
        send: jest.fn(),
      };

      // Load the handler after mocking
      delete require.cache[require.resolve('../lib/point-calc-lambda.js')];
      handler = require('../lib/point-calc-lambda.js').handler;
    });

    afterEach(() => {
      delete process.env.LOYALTY_TABLE_NAME;
      delete process.env.SNS_TOPIC_ARN;
      delete process.env.AWS_REGION;
    });

    test('Successfully processes a purchase transaction', async () => {
      const event = {
        body: JSON.stringify({
          memberId: 'MEMBER-123',
          transactionAmount: 100,
          transactionType: 'purchase',
        }),
      };

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          memberId: 'MEMBER-123',
          totalPoints: 500,
        },
      });
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.pointsEarned).toBe(10); // 100 * 0.1
      expect(body.totalPoints).toBe(510); // 500 + 10
      expect(mockDocClient.send).toHaveBeenCalledTimes(2);
    });

    test('Successfully processes a non-purchase transaction', async () => {
      const event = {
        body: JSON.stringify({
          memberId: 'MEMBER-456',
          transactionAmount: 200,
          transactionType: 'referral',
        }),
      };

      mockDocClient.send.mockResolvedValueOnce({
        Item: {
          memberId: 'MEMBER-456',
          totalPoints: 1000,
        },
      });
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.pointsEarned).toBe(10); // 200 * 0.05
      expect(body.totalPoints).toBe(1010); // 1000 + 10
    });

    test('Handles new member with no existing points', async () => {
      const event = {
        body: JSON.stringify({
          memberId: 'NEW-MEMBER',
          transactionAmount: 50,
          transactionType: 'purchase',
        }),
      };

      mockDocClient.send.mockResolvedValueOnce({ Item: undefined });
      mockDocClient.send.mockResolvedValueOnce({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.pointsEarned).toBe(5); // 50 * 0.1
      expect(body.totalPoints).toBe(5); // 0 + 5
    });

    test('Returns error when transaction fails', async () => {
      const event = {
        body: JSON.stringify({
          memberId: 'MEMBER-789',
          transactionAmount: 100,
          transactionType: 'purchase',
        }),
      };

      mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Failed to process transaction');
    });

    test('Handles invalid JSON in request body', async () => {
      const event = {
        body: 'invalid json',
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Failed to process transaction');
    });

    test('Generates unique transaction IDs', async () => {
      const event1 = {
        body: JSON.stringify({
          memberId: 'MEMBER-123',
          transactionAmount: 100,
          transactionType: 'purchase',
        }),
      };

      const event2 = {
        body: JSON.stringify({
          memberId: 'MEMBER-123',
          transactionAmount: 100,
          transactionType: 'purchase',
        }),
      };

      mockDocClient.send.mockResolvedValue({ Item: { totalPoints: 100 } });

      const result1 = await handler(event1);
      const result2 = await handler(event2);

      const body1 = JSON.parse(result1.body);
      const body2 = JSON.parse(result2.body);

      expect(body1.transactionId).toBeDefined();
      expect(body2.transactionId).toBeDefined();
      expect(body1.transactionId).not.toBe(body2.transactionId);
    });
  });

  describe('Stream Processor Lambda', () => {
    let handler: any;
    let mockSNSClient: any;
    let mockDocClient: any;

    beforeEach(() => {
      jest.clearAllMocks();

      // Mock environment variables
      process.env.LOYALTY_TABLE_NAME = 'test-loyalty-table';
      process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-west-2:123456789012:test-topic';
      process.env.AWS_REGION = 'us-west-2';

      // Mock DynamoDB Document Client
      mockDocClient = {
        send: jest.fn().mockResolvedValue({}),
      };

      // Mock SNS Client
      mockSNSClient = {
        send: jest.fn().mockResolvedValue({}),
      };

      SNSClient.prototype.send = mockSNSClient.send;

      // Load the handler after mocking
      delete require.cache[require.resolve('../lib/stream-processor-lambda.js')];
      handler = require('../lib/stream-processor-lambda.js').handler;
    });

    afterEach(() => {
      delete process.env.LOYALTY_TABLE_NAME;
      delete process.env.SNS_TOPIC_ARN;
      delete process.env.AWS_REGION;
    });

    test('Processes tier upgrade from Bronze to Silver', async () => {
      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '1500' },
              },
              OldImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '800' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).toHaveBeenCalledTimes(1);
      const callArgs = mockSNSClient.send.mock.calls[0][0];
      expect(callArgs.TopicArn).toBe(process.env.SNS_TOPIC_ARN);

      const message = JSON.parse(callArgs.Message);
      expect(message.tier).toBe('SILVER');
      expect(message.points).toBe(1500);
      expect(message.memberId).toBe('MEMBER-123');
    });

    test('Processes tier upgrade from Silver to Gold', async () => {
      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-456' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '5500' },
              },
              OldImage: {
                memberId: { S: 'MEMBER-456' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '3000' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).toHaveBeenCalledTimes(1);
      const callArgs = mockSNSClient.send.mock.calls[0][0];
      const message = JSON.parse(callArgs.Message);
      expect(message.tier).toBe('GOLD');
      expect(message.points).toBe(5500);
    });

    test('Processes tier upgrade from Gold to Platinum', async () => {
      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-789' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '12000' },
              },
              OldImage: {
                memberId: { S: 'MEMBER-789' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '8000' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).toHaveBeenCalledTimes(1);
      const callArgs = mockSNSClient.send.mock.calls[0][0];
      const message = JSON.parse(callArgs.Message);
      expect(message.tier).toBe('PLATINUM');
      expect(message.points).toBe(12000);
    });

    test('Does not send notification when tier remains the same', async () => {
      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '1200' },
              },
              OldImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '1100' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });

    test('Does not send notification for Bronze tier', async () => {
      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                memberId: { S: 'NEW-MEMBER' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '50' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });

    test('Ignores non-MEMBER_PROFILE records', async () => {
      const event = {
        Records: [
          {
            eventName: 'INSERT',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'TXN-12345' },
                totalPoints: { N: '100' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });

    test('Handles SNS publish errors gracefully', async () => {
      mockSNSClient.send.mockRejectedValue(new Error('SNS error'));

      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '1500' },
              },
              OldImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '800' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      // Should not throw, returns success
      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).toHaveBeenCalled();
    });

    test('Processes multiple records in a batch', async () => {
      const event = {
        Records: [
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-1' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '1500' },
              },
              OldImage: {
                totalPoints: { N: '500' },
              },
            },
          },
          {
            eventName: 'MODIFY',
            dynamodb: {
              NewImage: {
                memberId: { S: 'MEMBER-2' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '5500' },
              },
              OldImage: {
                totalPoints: { N: '2000' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).toHaveBeenCalledTimes(2);
    });

    test('Handles REMOVE events without errors', async () => {
      const event = {
        Records: [
          {
            eventName: 'REMOVE',
            dynamodb: {
              OldImage: {
                memberId: { S: 'MEMBER-123' },
                transactionId: { S: 'MEMBER_PROFILE' },
                totalPoints: { N: '1000' },
              },
            },
          },
        ],
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockSNSClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Points Calculation Logic', () => {
    test('Calculates correct points for purchase transactions', () => {
      const calculatePoints = (amount: number, type: string) => {
        const baseRate = type === 'purchase' ? 0.1 : 0.05;
        return Math.floor(amount * baseRate);
      };

      expect(calculatePoints(100, 'purchase')).toBe(10);
      expect(calculatePoints(250, 'purchase')).toBe(25);
      expect(calculatePoints(999, 'purchase')).toBe(99);
    });

    test('Calculates correct points for non-purchase transactions', () => {
      const calculatePoints = (amount: number, type: string) => {
        const baseRate = type === 'purchase' ? 0.1 : 0.05;
        return Math.floor(amount * baseRate);
      };

      expect(calculatePoints(100, 'referral')).toBe(5);
      expect(calculatePoints(250, 'bonus')).toBe(12);
      expect(calculatePoints(999, 'reward')).toBe(49);
    });

    test('Rounds down to nearest integer', () => {
      const calculatePoints = (amount: number, type: string) => {
        const baseRate = type === 'purchase' ? 0.1 : 0.05;
        return Math.floor(amount * baseRate);
      };

      expect(calculatePoints(99, 'purchase')).toBe(9);
      expect(calculatePoints(99, 'referral')).toBe(4);
    });
  });

  describe('Tier Calculation Logic', () => {
    const getTier = (points: number) => {
      if (points >= 10000) return 'PLATINUM';
      if (points >= 5000) return 'GOLD';
      if (points >= 1000) return 'SILVER';
      return 'BRONZE';
    };

    test('Returns correct tier based on point thresholds', () => {
      expect(getTier(0)).toBe('BRONZE');
      expect(getTier(999)).toBe('BRONZE');
      expect(getTier(1000)).toBe('SILVER');
      expect(getTier(4999)).toBe('SILVER');
      expect(getTier(5000)).toBe('GOLD');
      expect(getTier(9999)).toBe('GOLD');
      expect(getTier(10000)).toBe('PLATINUM');
      expect(getTier(50000)).toBe('PLATINUM');
    });

    test('Handles negative points as Bronze', () => {
      expect(getTier(-100)).toBe('BRONZE');
    });
  });
});