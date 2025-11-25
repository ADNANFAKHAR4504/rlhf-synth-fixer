/**
 * Unit tests for Lambda function handlers
 * Tests webhook-handler.js and price-checker.js logic
 */

// Mock AWS SDK v3 before importing handlers
const mockPutCommand = jest.fn();
const mockScanCommand = jest.fn();
const mockPublishCommand = jest.fn();
const mockDynamoDBSend = jest.fn();
const mockSNSSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: mockDynamoDBSend,
  })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockDynamoDBSend,
    })),
  },
  PutCommand: jest.fn((params) => {
    mockPutCommand(params);
    return params;
  }),
  ScanCommand: jest.fn((params) => {
    mockScanCommand(params);
    return params;
  }),
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => ({
    send: mockSNSSend,
  })),
  PublishCommand: jest.fn((params) => {
    mockPublishCommand(params);
    return params;
  }),
}));

describe('Webhook Handler Lambda', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALERTS_TABLE_NAME = 'test-alerts-table';
    process.env.AWS_REGION = 'us-east-1';

    // Reset mocks
    mockDynamoDBSend.mockResolvedValue({});
    mockPutCommand.mockClear();

    // Require handler after mocks are set up
    delete require.cache[require.resolve('../lib/lambda/webhook-handler.js')];
    handler = require('../lib/lambda/webhook-handler.js').handler;
  });

  describe('Successful webhook processing', () => {
    it('should process valid webhook event', async () => {
      const event = {
        body: JSON.stringify({
          userId: 'user123',
          alertId: 'alert456',
          cryptocurrency: 'BTC',
          targetPrice: 50000,
          currentPrice: 45000,
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('Webhook processed successfully');
      expect(mockPutCommand).toHaveBeenCalled();
    });

    it('should store alert in DynamoDB with correct structure', async () => {
      const event = {
        body: JSON.stringify({
          userId: 'user123',
          alertId: 'alert456',
          cryptocurrency: 'ETH',
          targetPrice: 3000,
          currentPrice: 2500,
        }),
      };

      await handler(event);

      expect(mockPutCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-alerts-table',
          Item: expect.objectContaining({
            userId: 'user123',
            alertId: 'alert456',
            cryptocurrency: 'ETH',
            targetPrice: 3000,
            currentPrice: 2500,
            status: 'active',
          }),
        })
      );
    });

    it('should include timestamp in stored alert', async () => {
      const event = {
        body: JSON.stringify({
          userId: 'user123',
          alertId: 'alert456',
          cryptocurrency: 'BTC',
          targetPrice: 50000,
          currentPrice: 45000,
        }),
      };

      await handler(event);

      const putCall = mockPutCommand.mock.calls[0][0];
      expect(putCall.Item.timestamp).toBeDefined();
      expect(new Date(putCall.Item.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle missing body gracefully', async () => {
      const event = {};

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Missing required fields');
    });

    it('should handle invalid JSON in body', async () => {
      const event = {
        body: 'invalid json {',
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      const event = {
        body: JSON.stringify({
          userId: 'user123',
          alertId: 'alert456',
          cryptocurrency: 'BTC',
          targetPrice: 50000,
          currentPrice: 45000,
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });
  });

  describe('Input validation', () => {
    it('should process webhook with all required fields', async () => {
      const event = {
        body: JSON.stringify({
          userId: 'user123',
          alertId: 'alert456',
          cryptocurrency: 'BTC',
          targetPrice: 50000,
          currentPrice: 45000,
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it('should handle missing optional fields', async () => {
      const event = {
        body: JSON.stringify({
          userId: 'user123',
          alertId: 'alert456',
          cryptocurrency: 'BTC',
          targetPrice: 50000,
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(mockPutCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Item: expect.objectContaining({
            currentPrice: 0, // Default value
          }),
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const event = {
        body: JSON.stringify({
          cryptocurrency: 'BTC',
          targetPrice: 50000,
        }),
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Missing required fields');
    });
  });
});

describe('Price Checker Lambda', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALERTS_TABLE_NAME = 'test-alerts-table';
    process.env.ALERT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.AWS_REGION = 'us-east-1';

    // Reset mocks
    mockDynamoDBSend.mockResolvedValue({
      Items: [
        {
          userId: 'user1',
          alertId: 'alert1',
          cryptocurrency: 'BTC',
          targetPrice: 50000,
          status: 'active',
        },
      ],
    });
    mockSNSSend.mockResolvedValue({});
    mockScanCommand.mockClear();
    mockPublishCommand.mockClear();

    // Mock Math.random to return predictable values
    jest.spyOn(Math, 'random').mockReturnValue(0.6); // Will generate price > 50000

    // Require handler after mocks are set up
    delete require.cache[require.resolve('../lib/lambda/price-checker.js')];
    handler = require('../lib/lambda/price-checker.js').handler;
  });

  afterEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
  });

  describe('Successful price checking', () => {
    it('should scan alerts from DynamoDB', async () => {
      const event = {};

      await handler(event);

      expect(mockScanCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'test-alerts-table',
          FilterExpression: '#status = :active',
        })
      );
    });

    it('should process all active alerts', async () => {
      const event = {};

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('Checked 1 alerts');
    });

    it('should send SNS notification when price target is met', async () => {
      const event = {};

      await handler(event);

      expect(mockPublishCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          Subject: 'Crypto Price Alert Triggered',
        })
      );
    });

    it('should not send notification when price target is not met', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.3); // Will generate price < 50000

      const event = {};

      await handler(event);

      expect(mockPublishCommand).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle DynamoDB scan errors', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('DynamoDB scan error'));

      const event = {};

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });

    it('should handle SNS publish errors', async () => {
      mockSNSSend.mockRejectedValueOnce(new Error('SNS error'));

      const event = {};

      const response = await handler(event);

      // Should still return 500 but not throw
      expect(response.statusCode).toBe(500);
    });

    it('should handle empty scan results', async () => {
      mockDynamoDBSend.mockResolvedValueOnce({ Items: [] });

      const event = {};

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('Checked 0 alerts');
    });
  });

  describe('Notification content', () => {
    it('should include cryptocurrency and prices in notification', async () => {
      const event = {};

      await handler(event);

      const publishCall = mockPublishCommand.mock.calls[0][0];
      expect(publishCall.Message).toContain('BTC');
      expect(publishCall.Message).toContain('50000');
    });

    it('should format price with 2 decimal places', async () => {
      const event = {};

      await handler(event);

      const publishCall = mockPublishCommand.mock.calls[0][0];
      expect(publishCall.Message).toMatch(/\$\d+\.\d{2}/);
    });
  });
});