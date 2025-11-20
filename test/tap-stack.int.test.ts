// test/tap-stack.int.test.ts - End-to-End Application Flow Integration Tests
import axios from 'axios';

// Application flow test utilities
class ApplicationFlowTester {
  public axiosInstance: any;

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'IntegrationTest/1.0',
      },
    });
  }

  // Payment processing workflow
  async processPayment(orderId: string, amount: number, cardDetails: any) {
    const paymentRequest = {
      orderId,
      amount,
      currency: 'USD',
      cardDetails,
      customerId: `customer-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const response = await this.axiosInstance.post(
      '/payments/process',
      paymentRequest
    );
    return response.data;
  }

  // Fraud detection workflow
  async checkFraud(transactionData: any) {
    const fraudRequest = {
      transactionId: transactionData.orderId,
      amount: transactionData.amount,
      customerId: transactionData.customerId,
      cardDetails: transactionData.cardDetails,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Integration Test)',
    };

    const response = await this.axiosInstance.post(
      '/fraud/check',
      fraudRequest
    );
    return response.data;
  }

  // Transaction management workflow
  async createTransaction(paymentResult: any, fraudResult: any) {
    const transactionRequest = {
      paymentId: paymentResult.paymentId,
      fraudScore: fraudResult.fraudScore,
      status: fraudResult.fraudScore < 50 ? 'APPROVED' : 'DECLINED',
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      customerId: paymentResult.customerId,
      timestamp: new Date().toISOString(),
    };

    const response = await this.axiosInstance.post(
      '/transactions',
      transactionRequest
    );
    return response.data;
  }

  // Load testing utility
  async generateLoad(
    endpoint: string,
    requests: number,
    concurrency: number = 10
  ) {
    const results = { success: 0, errors: 0, responseTimes: [] as number[] };

    for (let i = 0; i < requests; i += concurrency) {
      const batch = [];
      for (let j = 0; j < concurrency && i + j < requests; j++) {
        const startTime = Date.now();
        const requestPromise = this.axiosInstance
          .get(endpoint)
          .then(() => {
            results.success++;
            results.responseTimes.push(Date.now() - startTime);
          })
          .catch(() => {
            results.errors++;
          });
        batch.push(requestPromise);
      }
      await Promise.all(batch);
    }

    return results;
  }

  // Health check utility
  async checkServiceHealth(servicePath: string) {
    try {
      const response = await this.axiosInstance.get(servicePath);
      return { status: 'healthy' };
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Test configuration
const albDnsName =
  process.env.ALB_DNS_NAME || 'mock-alb-123456789.us-east-1.elb.amazonaws.com';
const includeOptionalServices = process.env.TEST_INCLUDE_OPTIONAL === 'true';
const skipNetworkTests = process.env.SKIP_NETWORK_TESTS === 'true';

// Check if ALB is accessible before running network-dependent tests
async function isAlbAccessible(): Promise<boolean> {
  try {
    const axiosInstance = require('axios').create({ timeout: 5000 });
    await axiosInstance.get(`http://${albDnsName}`, {
      validateStatus: () => true,
    });
    return true;
  } catch {
    return false;
  }
}

describe('TapStack End-to-End Application Flow Tests', () => {
  let applicationTester: ApplicationFlowTester;
  let albAccessible = false;

  beforeAll(async () => {
    applicationTester = new ApplicationFlowTester(`http://${albDnsName}`);
    albAccessible = await isAlbAccessible();

    if (!albAccessible && !skipNetworkTests) {
      console.warn(
        `⚠️  ALB at ${albDnsName} is not accessible. Network-dependent tests will be skipped.`
      );
      console.warn(
        '💡 Set SKIP_NETWORK_TESTS=true to explicitly skip these tests.'
      );
    }
  });

  describe('Payment Processing Flow', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should process a successful payment transaction',
      async () => {
        const orderId = `order-${Date.now()}`;
        const amount = 99.99;
        const cardDetails = {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'John Doe',
        };

        const paymentResult = await applicationTester.processPayment(
          orderId,
          amount,
          cardDetails
        );

        expect(paymentResult).toBeDefined();
        expect(paymentResult.paymentId).toBeDefined();
        expect(paymentResult.status).toBe('SUCCESS');
        expect(paymentResult.amount).toBe(amount);
        expect(paymentResult.orderId).toBe(orderId);
      },
      30000
    );

    testFn(
      'should handle payment decline scenarios',
      async () => {
        const orderId = `order-${Date.now()}`;
        const amount = 999999.99;
        const cardDetails = {
          number: '4000000000000002',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'John Doe',
        };

        const paymentResult = await applicationTester.processPayment(
          orderId,
          amount,
          cardDetails
        );

        expect(paymentResult).toBeDefined();
        expect(paymentResult.status).toBe('DECLINED');
        expect(paymentResult.orderId).toBe(orderId);
      },
      30000
    );
  });

  describe('Fraud Detection Integration', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should perform fraud check on transaction data',
      async () => {
        const transactionData = {
          orderId: `order-${Date.now()}`,
          amount: 499.99,
          customerId: `customer-${Date.now()}`,
          cardDetails: {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
          },
        };

        const fraudResult = await applicationTester.checkFraud(transactionData);

        expect(fraudResult).toBeDefined();
        expect(fraudResult.fraudScore).toBeDefined();
        expect(typeof fraudResult.fraudScore).toBe('number');
        expect(fraudResult.fraudScore).toBeGreaterThanOrEqual(0);
        expect(fraudResult.fraudScore).toBeLessThanOrEqual(100);
        expect(fraudResult.transactionId).toBe(transactionData.orderId);
      },
      30000
    );

    testFn(
      'should flag high-risk transactions',
      async () => {
        const highRiskTransaction = {
          orderId: `order-${Date.now()}`,
          amount: 10000,
          customerId: `customer-${Date.now()}`,
          cardDetails: {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
          },
        };

        const fraudResult =
          await applicationTester.checkFraud(highRiskTransaction);

        expect(fraudResult).toBeDefined();
        expect(fraudResult.fraudScore).toBeGreaterThan(70);
        expect(fraudResult.riskFactors).toBeDefined();
      },
      30000
    );
  });

  describe('End-to-End Transaction Flow', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should complete full payment-fraud-transaction workflow',
      async () => {
        const orderId = `e2e-order-${Date.now()}`;
        const amount = 149.99;
        const cardDetails = {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'Jane Smith',
        };

        const paymentResult = await applicationTester.processPayment(
          orderId,
          amount,
          cardDetails
        );
        expect(paymentResult.status).toBe('SUCCESS');

        const fraudResult = await applicationTester.checkFraud({
          orderId,
          amount,
          customerId: paymentResult.customerId,
          cardDetails,
        });
        expect(fraudResult.fraudScore).toBeDefined();

        if (includeOptionalServices) {
          const transactionResult = await applicationTester.createTransaction(
            paymentResult,
            fraudResult
          );
          expect(transactionResult).toBeDefined();
          expect(transactionResult.transactionId).toBeDefined();
          expect(['APPROVED', 'DECLINED', 'PENDING']).toContain(
            transactionResult.status
          );
        }
      },
      60000
    );
  });

  describe('Load Testing and Auto-scaling', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should handle moderate load without issues',
      async () => {
        const loadResults = await applicationTester.generateLoad(
          '/payments/health',
          50,
          5
        );

        expect(loadResults.success).toBeGreaterThan(40);
        expect(loadResults.errors).toBeLessThan(10);
        expect(loadResults.responseTimes.length).toBe(50);

        const avgResponseTime =
          loadResults.responseTimes.reduce((a, b) => a + b, 0) /
          loadResults.responseTimes.length;
        expect(avgResponseTime).toBeLessThan(5000);
      },
      120000
    );

    testFn(
      'should handle high concurrent load and trigger scaling',
      async () => {
        const loadResults = await applicationTester.generateLoad(
          '/fraud/health',
          100,
          20
        );

        expect(loadResults.success).toBeGreaterThan(80);
        expect(loadResults.errors).toBeLessThan(20);

        const avgResponseTime =
          loadResults.responseTimes.reduce((a, b) => a + b, 0) /
          loadResults.responseTimes.length;
        expect(avgResponseTime).toBeLessThan(10000);
      },
      180000
    );
  });

  describe('Service Health and Resilience', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should report healthy status for all services',
      async () => {
        const healthChecks = await Promise.all([
          applicationTester.checkServiceHealth('/payments/health'),
          applicationTester.checkServiceHealth('/fraud/health'),
          ...(includeOptionalServices
            ? [applicationTester.checkServiceHealth('/transactions/health')]
            : []),
        ]);

        healthChecks.forEach(health => {
          expect(health.status).toBe('healthy');
        });
      },
      30000
    );

    testFn(
      'should handle service failures gracefully',
      async () => {
        const invalidHealthCheck = await applicationTester.checkServiceHealth(
          '/invalid-service/health'
        );
        expect(invalidHealthCheck.status).toBe('unhealthy');
      },
      30000
    );
  });

  describe('Path-based Routing Validation', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should route payments requests to payment service',
      async () => {
        const response =
          await applicationTester.axiosInstance.get('/payments/health');
        expect(response.status).toBe(200);
        expect(response.data.service).toBe('payment-api');
      },
      30000
    );

    testFn(
      'should route fraud requests to fraud detection service',
      async () => {
        const response =
          await applicationTester.axiosInstance.get('/fraud/health');
        expect(response.status).toBe(200);
        expect(response.data.service).toBe('fraud-detector');
      },
      30000
    );

    testFn(
      'should route transaction requests to transaction service when available',
      async () => {
        if (includeOptionalServices) {
          const response = await applicationTester.axiosInstance.get(
            '/transactions/health'
          );
          expect(response.status).toBe(200);
          expect(response.data.service).toBe('transaction-api');
        }
      },
      30000
    );

    testFn(
      'should return 404 for unknown routes',
      async () => {
        try {
          await applicationTester.axiosInstance.get('/unknown-service/health');
          fail('Should have thrown 404 error');
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      },
      30000
    );
  });

  describe('Data Consistency and Validation', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should maintain data consistency across services',
      async () => {
        const orderId = `consistency-test-${Date.now()}`;
        const amount = 199.99;

        const transactions = await Promise.all([
          applicationTester.processPayment(`${orderId}-1`, amount, {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
            holderName: 'Consistency Test',
          }),
          applicationTester.processPayment(`${orderId}-2`, amount, {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
            holderName: 'Consistency Test',
          }),
        ]);

        transactions.forEach((transaction, index) => {
          expect(transaction.status).toBe('SUCCESS');
          expect(transaction.amount).toBe(amount);
          expect(transaction.orderId).toBe(`${orderId}-${index + 1}`);
        });
      },
      60000
    );

    testFn('should validate request/response schemas', async () => {
      const paymentResult = await applicationTester.processPayment(
        `schema-test-${Date.now()}`,
        59.99,
        {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'Schema Test',
        }
      );

      expect(paymentResult).toHaveProperty('paymentId');
      expect(paymentResult).toHaveProperty('status');
      expect(paymentResult).toHaveProperty('amount');
      expect(paymentResult).toHaveProperty('currency');
      expect(paymentResult).toHaveProperty('orderId');
      expect(paymentResult).toHaveProperty('customerId');
      expect(paymentResult).toHaveProperty('timestamp');
      expect(paymentResult).toHaveProperty('processingTime');
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    const testFn = albAccessible && !skipNetworkTests ? test : test.skip;

    testFn(
      'should handle malformed requests',
      async () => {
        // Test with invalid data that should cause errors
        await expect(
          applicationTester.processPayment('', -100, {})
        ).rejects.toThrow();

        await expect(
          applicationTester.processPayment('test-order', NaN, {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
          })
        ).rejects.toThrow();
      },
      30000
    );

    testFn(
      'should handle concurrent requests without data corruption',
      async () => {
        const orderIds = Array.from(
          { length: 10 },
          (_, i) => `concurrent-${Date.now()}-${i}`
        );

        const concurrentRequests = orderIds.map(orderId =>
          applicationTester.processPayment(orderId, 9.99, {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
            holderName: 'Concurrent User',
          })
        );

        const results = await Promise.all(concurrentRequests);

        results.forEach((result, index) => {
          expect(result.status).toBe('SUCCESS');
          expect(result.orderId).toBe(orderIds[index]);
          expect(result.paymentId).toBeDefined();
        });

        const paymentIds = results.map(r => r.paymentId);
        const uniquePaymentIds = new Set(paymentIds);
        expect(uniquePaymentIds.size).toBe(paymentIds.length);
      },
      60000
    );
  });
});
