/**
 * Unit tests for Lambda function handlers
 * Tests webhook-handler.js and price-checker.js logic
 */

// Mock AWS SDK and X-Ray before importing handlers
jest.mock('aws-sdk', () => {
  const mockDocumentClient = {
    put: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
    scan: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: [
          {
            userId: 'user1',
            alertId: 'alert1',
            cryptocurrency: 'BTC',
            targetPrice: 50000,
            status: 'active',
          },
        ],
      }),
    }),
  };

  const mockSNS = {
    publish: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
  };

  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient),
    },
    SNS: jest.fn(() => mockSNS),
  };
});

jest.mock('aws-xray-sdk-core', () => ({
  getSegment: jest.fn(() => ({
    addNewSubsegment: jest.fn(() => ({
      addAnnotation: jest.fn(),
      addError: jest.fn(),
      close: jest.fn(),
    })),
  })),
}));

describe('Webhook Handler Lambda', () => {
  let handler: any;
  let mockDocumentClient: any;
  let mockXRay: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALERTS_TABLE_NAME = 'test-alerts-table';

    // Require handler after mocks are set up
    delete require.cache[require.resolve('../lib/lambda/webhook-handler.js')];
    handler = require('../lib/lambda/webhook-handler.js').handler;

    const AWS = require('aws-sdk');
    mockDocumentClient = new AWS.DynamoDB.DocumentClient();
    mockXRay = require('aws-xray-sdk-core');
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
      expect(mockDocumentClient.put).toHaveBeenCalled();
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

      expect(mockDocumentClient.put).toHaveBeenCalledWith(
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

      const putCall = mockDocumentClient.put.mock.calls[0][0];
      expect(putCall.Item.timestamp).toBeDefined();
      expect(new Date(putCall.Item.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should create X-Ray subsegment for tracing', async () => {
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

      expect(mockXRay.getSegment).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle missing body gracefully', async () => {
      const event = {};

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
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
      mockDocumentClient.put.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

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
    });
  });
});

describe('Price Checker Lambda', () => {
  let handler: any;
  let mockDocumentClient: any;
  let mockSNS: any;
  let mockXRay: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALERTS_TABLE_NAME = 'test-alerts-table';
    process.env.ALERT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';

    // Mock Math.random for predictable testing
    jest.spyOn(Math, 'random').mockReturnValue(0.6);

    // Require handler after mocks are set up
    delete require.cache[require.resolve('../lib/lambda/price-checker.js')];
    handler = require('../lib/lambda/price-checker.js').handler;

    const AWS = require('aws-sdk');
    mockDocumentClient = new AWS.DynamoDB.DocumentClient();
    mockSNS = new AWS.SNS();
    mockXRay = require('aws-xray-sdk-core');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful price checking', () => {
    it('should scan alerts from DynamoDB', async () => {
      const event = {};

      await handler(event);

      expect(mockDocumentClient.scan).toHaveBeenCalledWith(
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
      // Mock random to return high price
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const event = {};

      await handler(event);

      expect(mockSNS.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          Subject: 'Crypto Price Alert Triggered',
        })
      );
    });

    it('should not send notification when price target is not met', async () => {
      // Mock random to return low price
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      const event = {};

      await handler(event);

      expect(mockSNS.publish).not.toHaveBeenCalled();
    });

    it('should create X-Ray subsegment for tracing', async () => {
      const event = {};

      await handler(event);

      expect(mockXRay.getSegment).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle DynamoDB scan errors', async () => {
      mockDocumentClient.scan.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB scan error')),
      });

      const event = {};

      await expect(handler(event)).rejects.toThrow('DynamoDB scan error');
    });

    it('should handle SNS publish errors', async () => {
      // Mock high price to trigger notification
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      mockSNS.publish.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('SNS error')),
      });

      const event = {};

      await expect(handler(event)).rejects.toThrow('SNS error');
    });

    it('should handle empty scan results', async () => {
      mockDocumentClient.scan.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({ Items: [] }),
      });

      const event = {};

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('Checked 0 alerts');
    });
  });

  describe('Notification content', () => {
    it('should include cryptocurrency and prices in notification', async () => {
      // Mock high price to trigger notification
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const event = {};

      await handler(event);

      const publishCall = mockSNS.publish.mock.calls[0][0];
      expect(publishCall.Message).toContain('BTC');
      expect(publishCall.Message).toContain('50000');
    });

    it('should format price with 2 decimal places', async () => {
      // Mock high price to trigger notification
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const event = {};

      await handler(event);

      const publishCall = mockSNS.publish.mock.calls[0][0];
      expect(publishCall.Message).toMatch(/\$\d+\.\d{2}/);
    });
  });
});
