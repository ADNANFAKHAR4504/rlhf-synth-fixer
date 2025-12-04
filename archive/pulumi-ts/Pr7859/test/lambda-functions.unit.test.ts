describe('Lambda Functions', () => {
  describe('payment-validator', () => {
    it('should export a handler function', () => {
      const paymentValidator = require('../lib/lambda/payment-validator/index');
      expect(paymentValidator.handler).toBeDefined();
      expect(typeof paymentValidator.handler).toBe('function');
    });

    it('should handle events correctly', async () => {
      const paymentValidator = require('../lib/lambda/payment-validator/index');
      const event = { transactionId: 'test-123' };
      const result = await paymentValidator.handler(event);
      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
    });

    it('should handle missing transactionId', async () => {
      const paymentValidator = require('../lib/lambda/payment-validator/index');
      const event = {};
      const result = await paymentValidator.handler(event);
      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
    });
  });

  describe('fraud-detector', () => {
    it('should export a handler function', () => {
      const fraudDetector = require('../lib/lambda/fraud-detector/index');
      expect(fraudDetector.handler).toBeDefined();
      expect(typeof fraudDetector.handler).toBe('function');
    });

    it('should handle events correctly', async () => {
      const fraudDetector = require('../lib/lambda/fraud-detector/index');
      const event = { transactionId: 'test-456' };
      const result = await fraudDetector.handler(event);
      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
    });

    it('should return risk score', async () => {
      const fraudDetector = require('../lib/lambda/fraud-detector/index');
      const event = { transactionId: 'test-789' };
      const result = await fraudDetector.handler(event);
      const body = JSON.parse(result.body);
      expect(body.data).toBeDefined();
      expect(body.data.riskScore).toBeDefined();
      expect(typeof body.data.riskScore).toBe('number');
    });
  });

  describe('notification-sender', () => {
    it('should export a handler function', () => {
      const notificationSender = require('../lib/lambda/notification-sender/index');
      expect(notificationSender.handler).toBeDefined();
      expect(typeof notificationSender.handler).toBe('function');
    });

    it('should handle events correctly', async () => {
      const notificationSender = require('../lib/lambda/notification-sender/index');
      const event = { transactionId: 'test-101', notificationType: 'email' };
      const result = await notificationSender.handler(event);
      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
    });

    it('should handle different notification types', async () => {
      const notificationSender = require('../lib/lambda/notification-sender/index');
      const event = { transactionId: 'test-102', notificationType: 'sms' };
      const result = await notificationSender.handler(event);
      const body = JSON.parse(result.body);
      expect(body.data).toBeDefined();
      expect(body.data.notificationType).toBe('sms');
    });

    it('should use default notification type', async () => {
      const notificationSender = require('../lib/lambda/notification-sender/index');
      const event = { transactionId: 'test-103' };
      const result = await notificationSender.handler(event);
      const body = JSON.parse(result.body);
      expect(body.data).toBeDefined();
      expect(body.data.notificationType).toBe('email');
    });
  });
});
