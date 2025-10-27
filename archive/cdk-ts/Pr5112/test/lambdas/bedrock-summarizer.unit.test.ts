import { handler } from '../../lib/lambdas/bedrock-summarizer/index';

describe('Bedrock Summarizer Lambda', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Handler Function', () => {
    test('should generate summary successfully', async () => {
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
        riskScore: 85,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should include transaction ID in summary', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-summary-123',
          customerId: 'cust-summary-456',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 75,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('txn-summary-123');
    });

    test('should include customer ID in summary', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-123',
          customerId: 'cust-customer-789',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 80,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('cust-customer-789');
    });

    test('should include risk score in summary', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-risk',
          customerId: 'cust-risk',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 92,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('92');
    });

    test('should log invocation', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-log',
          customerId: 'cust-log',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 70,
      };

      await handler(event, {} as any, {} as any);

      expect(console.log).toHaveBeenCalledWith('Bedrock Summarizer Lambda invoked');
      expect(console.log).toHaveBeenCalledWith('Generating AI summary with Bedrock');
    });

    test('should include timestamp in response', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-time',
          customerId: 'cust-time',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 75,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should generate summary with AML Investigation header', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-header',
          customerId: 'cust-header',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 80,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('AML Investigation Summary');
    });

    test('should include key findings in summary', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-findings',
          customerId: 'cust-findings',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 85,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('Key Findings:');
      expect(result.summary).toContain('1. Transaction analysis completed');
      expect(result.summary).toContain('2. Historical patterns reviewed');
      expect(result.summary).toContain('3. Relationship graph analyzed');
    });

    test('should include recommendation in summary', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-rec',
          customerId: 'cust-rec',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 90,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('Recommendation:');
      expect(result.summary).toContain('Further investigation required');
    });

    test('should handle missing transaction fields', async () => {
      const event = {
        transaction: {
          transactionId: undefined,
          customerId: undefined,
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 75,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    test('should handle error in catch block and log error', async () => {
      // Create a mock that throws during JSON.stringify or string construction
      const mockError = new Error('Bedrock API error');

      // Mock the event to cause an error during summary generation
      const problematicEvent = {
        transaction: {
          transactionId: 'txn-error',
          customerId: 'cust-error',
        },
        athenaResults: {},
        neptuneResults: {},
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
        await expect(handler(problematicEvent, {} as any, {} as any)).rejects.toThrow('Bedrock API error');
        expect(console.error).toHaveBeenCalledWith('Error in Bedrock Summarizer:', mockError);
      } finally {
        global.Date = originalDate;
      }
    });

    test('should handle high risk score', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-high',
          customerId: 'cust-high',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 100,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('100');
    });

    test('should handle low risk score', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-low',
          customerId: 'cust-low',
        },
        athenaResults: {},
        neptuneResults: {},
        riskScore: 0,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toContain('0');
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
          suspiciousPatterns: ['rapid_succession', 'round_amounts'],
        },
        neptuneResults: {},
        riskScore: 88,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toBeDefined();
      expect(result.summary).toContain('88');
    });

    test('should handle complex neptune results', async () => {
      const event = {
        transaction: {
          transactionId: 'txn-neptune-complex',
          customerId: 'cust-neptune-complex',
        },
        athenaResults: {},
        neptuneResults: {
          entities: 100,
          beneficialOwners: 5,
          sanctionedConnections: 2,
          relationshipDepth: 4,
        },
        riskScore: 93,
      };

      const result = await handler(event, {} as any, {} as any);

      expect(result.summary).toBeDefined();
      expect(result.summary).toContain('93');
    });
  });
});
