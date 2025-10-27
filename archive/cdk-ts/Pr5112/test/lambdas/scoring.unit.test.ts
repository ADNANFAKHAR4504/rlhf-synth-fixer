import { handler } from '../../lib/lambdas/scoring/index';

describe('Scoring Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Handler Function', () => {
    test('should process scoring request successfully', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-123',
          customerId: 'cust-456',
        },
        athenaResults: {
          historicalCount: 150,
        },
        neptuneResults: {
          relationshipDepth: 3,
        },
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.rulesApplied).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should return normalized risk score between 0 and 100', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-123',
          customerId: 'cust-456',
        },
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    test('should calculate higher risk score with athena results', async () => {
      const eventWithAthena = {
        transaction: {
          transactionId: 'txn-athena',
          customerId: 'cust-athena',
        },
        athenaResults: {
          suspicious: true,
          count: 100,
        },
        neptuneResults: {},
      };

      const result = await handler(eventWithAthena, {} as any, {} as any);

      expect(result.riskScore).toBeGreaterThan(0);
    });

    test('should calculate higher risk score with neptune results', async () => {
      const eventWithNeptune = {
        transaction: {
          transactionId: 'txn-neptune',
          customerId: 'cust-neptune',
        },
        athenaResults: {},
        neptuneResults: {
          connections: 50,
          suspicious: true,
        },
      };

      const result = await handler(eventWithNeptune, {} as any, {} as any);

      expect(result.riskScore).toBeGreaterThan(0);
    });

    test('should calculate risk score with both athena and neptune results', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-both',
          customerId: 'cust-both',
        },
        athenaResults: {
          historicalCount: 200,
        },
        neptuneResults: {
          relationshipDepth: 4,
        },
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.riskScore).toBeGreaterThan(0);
    });

    test('should log Aurora query attempt', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-log',
          customerId: 'cust-log',
        },
        athenaResults: {},
        neptuneResults: {},
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith('Querying Aurora for AML rules');
    });

    test('should include timestamp in response', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-timestamp',
          customerId: 'cust-timestamp',
        },
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle empty transaction object', async () => {
      const event = {
        transaction: {},
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeDefined();
    });

    test('should handle missing transaction fields', async () => {
      const event = {
        transaction: {
          transactionId: undefined,
          customerId: undefined,
        },
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle error in catch block and log error', async () => {
      const mockError = new Error('Scoring error');

      const event = {
        transaction: {
          transactionId: 'txn-error',
          customerId: 'cust-error',
        },
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
        await expect(handler(event, {} as any, {} as any)).rejects.toThrow('Scoring error');
        expect(console.error).toHaveBeenCalledWith('Error in scoring Lambda:', mockError);
      } finally {
        global.Date = originalDate;
      }
    });

    test('should return number of rules applied', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-rules',
          customerId: 'cust-rules',
        },
        athenaResults: {},
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.rulesApplied).toBeDefined();
      expect(typeof result.rulesApplied).toBe('number');
    });

    test('should handle complex athena results', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-complex',
          customerId: 'cust-complex',
        },
        athenaResults: {
          totalTransactions: 1000,
          averageAmount: 5000,
          largestTransaction: 50000,
          internationalCount: 25,
          highRiskCountries: ['XX', 'YY'],
        },
        neptuneResults: {},
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle complex neptune results', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-complex-neptune',
          customerId: 'cust-complex-neptune',
        },
        athenaResults: {},
        neptuneResults: {
          entities: 100,
          beneficialOwners: 5,
          sanctionedConnections: 0,
          relationshipDepth: 4,
          riskScore: 65,
        },
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });
  });
});
