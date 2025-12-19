import { handler } from '../../lib/lambdas/evidence-archiver/index';

describe('Evidence Archiver Lambda', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    process.env = {
      ...originalEnv,
      OPENSEARCH_ENDPOINT: 'https://test-endpoint.us-east-1.aoss.amazonaws.com',
      OPENSEARCH_COLLECTION: 'test-collection',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('Handler Function', () => {
    test('should archive evidence successfully', async () => {
      const event = {
        investigationId: 'inv-123',
        transaction: {
          transactionId: 'txn-123',
          customerId: 'cust-456',
        },
        summary: 'Investigation summary',
        riskScore: 85,
        athenaResults: {
          historicalCount: 150,
        },
        neptuneResults: {
          relationshipDepth: 3,
        },
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
    });

    test('should include investigation details in response', async () => {
      const event = {
        investigationId: 'inv-456',
        transaction: {
          transactionId: 'txn-456',
          customerId: 'cust-789',
        },
        summary: 'High-risk transaction detected',
        riskScore: 90,
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.message).toBe('Evidence archived successfully');
      expect(body.result).toBeDefined();
      expect(body.result.investigationId).toBe('inv-456');
    });

    test('should use OpenSearch endpoint from environment variable', async () => {
      const event = {
        investigationId: 'inv-env',
        transaction: {
          transactionId: 'txn-env',
          customerId: 'cust-env',
        },
        summary: 'Test summary',
        riskScore: 70,
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result.endpoint).toBe('https://test-endpoint.us-east-1.aoss.amazonaws.com');
    });

    test('should use OpenSearch collection from environment variable', async () => {
      const event = {
        investigationId: 'inv-collection',
        transaction: {
          transactionId: 'txn-collection',
          customerId: 'cust-collection',
        },
        summary: 'Test collection',
        riskScore: 75,
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result.collection).toBe('test-collection');
    });

    test('should log archiving attempt', async () => {
      const event = {
        investigationId: 'inv-log',
        transaction: {
          transactionId: 'txn-log',
          customerId: 'cust-log',
        },
        summary: 'Logging test',
        riskScore: 80,
        athenaResults: {},
        neptuneResults: {},
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith('Evidence Archiver Lambda invoked');
      expect(console.log).toHaveBeenCalledWith(
        'Archiving evidence to OpenSearch:',
        expect.any(String)
      );
    });

    test('should include timestamp in archived evidence', async () => {
      const event = {
        investigationId: 'inv-timestamp',
        transaction: {
          transactionId: 'txn-timestamp',
          customerId: 'cust-timestamp',
        },
        summary: 'Timestamp test',
        riskScore: 85,
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result.timestamp).toBeDefined();
      expect(body.result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle complete evidence package', async () => {
      const event = {
        investigationId: 'inv-complete',
        transaction: {
          transactionId: 'txn-complete',
          customerId: 'cust-complete',
        },
        summary: 'Complete investigation summary with all details',
        riskScore: 95,
        athenaResults: {
          totalTransactions: 1000,
          averageAmount: 5000,
          highRiskTransactions: 25,
        },
        neptuneResults: {
          entities: 50,
          relationshipDepth: 4,
          sanctionedConnections: 2,
        },
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.result.status).toBe('archived');
    });

    test('should handle error in catch block and log error', async () => {
      const mockError = new Error('OpenSearch API error');

      const event = {
        investigationId: 'inv-error',
        transaction: {
          transactionId: 'txn-error',
          customerId: 'cust-error',
        },
        summary: 'Error test',
        riskScore: 80,
        athenaResults: {},
        neptuneResults: {},
      };

      // Mock Date.toISOString to throw an error to trigger catch block
      const originalDate = Date;
      global.Date = class extends originalDate {
        toISOString() {
          throw mockError;
        }
      } as any;

      try {
        await expect(handler(event, {} as any, {} as any)).rejects.toThrow('OpenSearch API error');
        expect(console.error).toHaveBeenCalledWith('Error archiving evidence:', mockError);
      } finally {
        global.Date = originalDate;
      }
    });

    test('should return status as archived', async () => {
      const event = {
        investigationId: 'inv-status',
        transaction: {
          transactionId: 'txn-status',
          customerId: 'cust-status',
        },
        summary: 'Status test',
        riskScore: 85,
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.result.status).toBe('archived');
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
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
    });

    test('should archive evidence with high risk score', async () => {
      const event = {
        investigationId: 'inv-high-risk',
        transaction: {
          transactionId: 'txn-high',
          customerId: 'cust-high',
        },
        summary: 'High risk transaction detected with multiple red flags',
        riskScore: 100,
        athenaResults: {
          suspicious: true,
        },
        neptuneResults: {
          sanctioned: true,
        },
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Evidence archived successfully');
    });

    test('should archive evidence with low risk score', async () => {
      const event = {
        investigationId: 'inv-low-risk',
        transaction: {
          transactionId: 'txn-low',
          customerId: 'cust-low',
        },
        summary: 'Low risk transaction for record keeping',
        riskScore: 10,
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(200);
    });

    test('should include all evidence fields in package', async () => {
      const event = {
        investigationId: 'inv-fields',
        transaction: {
          transactionId: 'txn-fields',
          customerId: 'cust-fields',
        },
        summary: 'Complete evidence package',
        riskScore: 85,
        athenaResults: { data: 'athena' },
        neptuneResults: { data: 'neptune' },
      };

      await handler(event, {} as any, {} as any);

      // Verify console.log was called with the evidence package
      expect(console.log).toHaveBeenCalledWith(
        'Archiving evidence to OpenSearch:',
        expect.stringContaining('investigationId')
      );
    });
  });
});
