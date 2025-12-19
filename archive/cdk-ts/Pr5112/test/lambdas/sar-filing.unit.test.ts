import { handler } from '../../lib/lambdas/sar-filing/index';

describe('SAR Filing Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Handler Function', () => {
    test('should file SAR successfully', async () => {
      const event = {
        investigationId: 'inv-123',
        transaction: {
          transactionId: 'txn-123',
          customerId: 'cust-456',
        },
        summary: 'Suspicious activity detected',
        riskScore: 85,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
    });

    test('should return success message in response body', async () => {
      const event = {
        investigationId: 'inv-456',
        transaction: {
          transactionId: 'txn-456',
          customerId: 'cust-789',
        },
        summary: 'High risk transaction',
        riskScore: 90,
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.message).toBe('SAR filed successfully');
    });

    test('should generate SAR ID in result', async () => {
      const event = {
        investigationId: 'inv-sar-id',
        transaction: {
          transactionId: 'txn-sar-id',
          customerId: 'cust-sar-id',
        },
        summary: 'SAR ID test',
        riskScore: 80,
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result).toBeDefined();
      expect(body.result.sarId).toBeDefined();
      expect(body.result.sarId).toMatch(/^SAR-\d+$/);
    });

    test('should include investigation ID in SAR report', async () => {
      const event = {
        investigationId: 'inv-report-123',
        transaction: {
          transactionId: 'txn-report',
          customerId: 'cust-report',
        },
        summary: 'Report test',
        riskScore: 85,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith(
        'Filing SAR report:',
        expect.stringContaining('inv-report-123')
      );
    });

    test('should log invocation', async () => {
      const event = {
        investigationId: 'inv-log',
        transaction: {
          transactionId: 'txn-log',
          customerId: 'cust-log',
        },
        summary: 'Log test',
        riskScore: 75,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith('SAR Filing Lambda invoked');
    });

    test('should include transaction ID in SAR report', async () => {
      const event = {
        investigationId: 'inv-txn',
        transaction: {
          transactionId: 'txn-in-report',
          customerId: 'cust-txn',
        },
        summary: 'Transaction ID test',
        riskScore: 80,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith(
        'Filing SAR report:',
        expect.stringContaining('txn-in-report')
      );
    });

    test('should include customer ID in SAR report', async () => {
      const event = {
        investigationId: 'inv-cust',
        transaction: {
          transactionId: 'txn-cust',
          customerId: 'cust-in-report',
        },
        summary: 'Customer ID test',
        riskScore: 85,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith(
        'Filing SAR report:',
        expect.stringContaining('cust-in-report')
      );
    });

    test('should include risk score in SAR report', async () => {
      const event = {
        investigationId: 'inv-risk',
        transaction: {
          transactionId: 'txn-risk',
          customerId: 'cust-risk',
        },
        summary: 'Risk score test',
        riskScore: 92,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith(
        'Filing SAR report:',
        expect.stringContaining('92')
      );
    });

    test('should include summary in SAR report', async () => {
      const event = {
        investigationId: 'inv-summary',
        transaction: {
          transactionId: 'txn-summary',
          customerId: 'cust-summary',
        },
        summary: 'Test summary content for SAR',
        riskScore: 88,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith(
        'Filing SAR report:',
        expect.stringContaining('Test summary content for SAR')
      );
    });

    test('should include filedBy field in SAR report', async () => {
      const event = {
        investigationId: 'inv-filed-by',
        transaction: {
          transactionId: 'txn-filed-by',
          customerId: 'cust-filed-by',
        },
        summary: 'Filed by test',
        riskScore: 80,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith(
        'Filing SAR report:',
        expect.stringContaining('automated-aml-system')
      );
    });

    test('should simulate API call with delay', async () => {
      const event = {
        investigationId: 'inv-delay',
        transaction: {
          transactionId: 'txn-delay',
          customerId: 'cust-delay',
        },
        summary: 'Delay test',
        riskScore: 75,
      };

      const startTime = Date.now();
      await handler(event, {} as any, {} as any);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    test('should return status as success', async () => {
      const event = {
        investigationId: 'inv-status',
        transaction: {
          transactionId: 'txn-status',
          customerId: 'cust-status',
        },
        summary: 'Status test',
        riskScore: 85,
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result.status).toBe('success');
    });

    test('should include timestamp in result', async () => {
      const event = {
        investigationId: 'inv-timestamp',
        transaction: {
          transactionId: 'txn-timestamp',
          customerId: 'cust-timestamp',
        },
        summary: 'Timestamp test',
        riskScore: 80,
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result.filedAt).toBeDefined();
      expect(body.result.filedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle missing transaction fields', async () => {
      const event = {
        investigationId: 'inv-missing',
        transaction: {
          transactionId: undefined,
          customerId: undefined,
        },
        summary: 'Missing fields test',
        riskScore: 75,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
    });

    test('should handle error in catch block and log error', async () => {
      const mockError = new Error('FinCEN API error');

      const event = {
        investigationId: 'inv-error',
        transaction: {
          transactionId: 'txn-error',
          customerId: 'cust-error',
        },
        summary: 'Error test',
        riskScore: 80,
      };

      // Mock Date.toISOString to throw an error to trigger catch block
      const originalDate = Date;
      global.Date = class extends originalDate {
        toISOString() {
          throw mockError;
        }
      } as any;

      try {
        await expect(handler(event, {} as any, {} as any)).rejects.toThrow('FinCEN API error');
        expect(console.error).toHaveBeenCalledWith('Error filing SAR:', mockError);
      } finally {
        global.Date = originalDate;
      }
    });

    test('should file SAR for high risk score', async () => {
      const event = {
        investigationId: 'inv-high-risk',
        transaction: {
          transactionId: 'txn-high-risk',
          customerId: 'cust-high-risk',
        },
        summary: 'Extremely high risk transaction detected',
        riskScore: 100,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('SAR filed successfully');
    });

    test('should file SAR for medium risk score', async () => {
      const event = {
        investigationId: 'inv-medium-risk',
        transaction: {
          transactionId: 'txn-medium-risk',
          customerId: 'cust-medium-risk',
        },
        summary: 'Medium risk transaction requiring SAR filing',
        riskScore: 80,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
    });

    test('should handle complex summary', async () => {
      const event = {
        investigationId: 'inv-complex',
        transaction: {
          transactionId: 'txn-complex',
          customerId: 'cust-complex',
        },
        summary: `Complex investigation summary with multiple lines
          - Historical pattern analysis completed
          - Entity relationship graph analyzed
          - Multiple red flags identified
          - Recommendation: File SAR immediately`,
        riskScore: 95,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.result.sarId).toBeDefined();
    });
  });
});
