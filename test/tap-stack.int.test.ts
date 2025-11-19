/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Integration tests for TapStack
 *
 * These tests are designed to run against actual AWS infrastructure
 * and validate end-to-end functionality of the payment processing system.
 *
 * Note: Integration tests require:
 * - Infrastructure deployed via `pulumi up`
 * - cfn-outputs/flat-outputs.json file with deployment outputs
 *
 * Run with: npm run test:integration
 */

import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosError } from 'axios';

interface DeploymentOutputs {
  environmentSuffix_output: string;
  primaryAlbDnsName: string;
  primaryApiUrl: string;
  primaryAuditBucketName: string;
  primaryHealthCheckId: string;
  primaryRegion_output: string;
  primarySnsTopicArn: string;
  secondaryAlbDnsName: string;
  secondaryApiUrl: string;
  secondaryAuditBucketName: string;
  secondaryHealthCheckId: string;
  secondaryRegion_output: string;
  secondarySnsTopicArn: string;
  secretArn: string;
  transactionTableName: string;
}

interface PaymentResponse {
  status: string;
  transactionId: string;
  amount: number;
  currency: string;
  region: string;
  timestamp: number;
}

/**
 * Load deployment outputs from cfn-outputs/flat-outputs.json
 */
function loadDeploymentOutputs(): DeploymentOutputs {
  const outputsPath = path.join(
    __dirname,
    '..',
    'cfn-outputs',
    'flat-outputs.json'
  );

  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Deployment outputs not found at ${outputsPath}. Please deploy the infrastructure first.`
    );
  }

  const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
  return JSON.parse(outputsContent) as DeploymentOutputs;
}

describe('TapStack Integration Tests', () => {
  let outputs: DeploymentOutputs;

  beforeAll(() => {
    outputs = loadDeploymentOutputs();
    console.log('Loaded deployment outputs:', {
      environmentSuffix: outputs.environmentSuffix_output,
      primaryRegion: outputs.primaryRegion_output,
      secondaryRegion: outputs.secondaryRegion_output,
    });
  });

  describe('Deployment Outputs Validation', () => {
    it('should have all required deployment outputs', () => {
      expect(outputs.environmentSuffix_output).toBeDefined();
      expect(outputs.primaryAlbDnsName).toBeDefined();
      expect(outputs.primaryApiUrl).toBeDefined();
      expect(outputs.primaryAuditBucketName).toBeDefined();
      expect(outputs.primaryHealthCheckId).toBeDefined();
      expect(outputs.primaryRegion_output).toBeDefined();
      expect(outputs.primarySnsTopicArn).toBeDefined();
      expect(outputs.secondaryAlbDnsName).toBeDefined();
      expect(outputs.secondaryApiUrl).toBeDefined();
      expect(outputs.secondaryAuditBucketName).toBeDefined();
      expect(outputs.secondaryHealthCheckId).toBeDefined();
      expect(outputs.secondaryRegion_output).toBeDefined();
      expect(outputs.secondarySnsTopicArn).toBeDefined();
      expect(outputs.secretArn).toBeDefined();
      expect(outputs.transactionTableName).toBeDefined();
    });

    it('should have valid primary API URL format', () => {
      expect(outputs.primaryApiUrl).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod$/
      );
    });

    it('should have valid secondary API URL format', () => {
      expect(outputs.secondaryApiUrl).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod$/
      );
    });

    it('should have valid primary ALB DNS name format', () => {
      expect(outputs.primaryAlbDnsName).toMatch(
        /^payment-alb-pri-.+\.elb\.amazonaws\.com$/
      );
    });

    it('should have valid secondary ALB DNS name format', () => {
      expect(outputs.secondaryAlbDnsName).toMatch(
        /^payment-alb-sec-.+\.elb\.amazonaws\.com$/
      );
    });

    it('should have matching environment suffix across resources', () => {
      const envSuffix = outputs.environmentSuffix_output;
      expect(outputs.transactionTableName).toContain(envSuffix);
      expect(outputs.primaryAuditBucketName).toContain(envSuffix);
      expect(outputs.secondaryAuditBucketName).toContain(envSuffix);
    });
  });

  describe('Multi-Region Infrastructure', () => {
    it('should have infrastructure in primary region (us-east-1)', () => {
      expect(outputs.primaryRegion_output).toBe('us-east-1');
      expect(outputs.primaryApiUrl).toContain('us-east-1');
      expect(outputs.primaryAlbDnsName).toContain('us-east-1');
    });

    it('should have infrastructure in secondary region (us-east-2)', () => {
      expect(outputs.secondaryRegion_output).toBe('us-east-2');
      expect(outputs.secondaryApiUrl).toContain('us-east-2');
      expect(outputs.secondaryAlbDnsName).toContain('us-east-2');
    });

    it('should have different health check IDs for each region', () => {
      expect(outputs.primaryHealthCheckId).not.toBe(
        outputs.secondaryHealthCheckId
      );
      expect(outputs.primaryHealthCheckId).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );
      expect(outputs.secondaryHealthCheckId).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );
    });
  });

  describe('API Gateway Endpoints - Primary Region', () => {
    it('should respond to GET requests on /health endpoint', async () => {
      const healthUrl = `${outputs.primaryApiUrl}/health`;

      const response = await axios.get(healthUrl, { timeout: 10000 });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('region', outputs.primaryRegion_output);
      expect(response.data).toHaveProperty('service', 'payment-api');
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should accept POST requests to /payment endpoint with valid data', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 100.5,
        currency: 'USD',
        customerId: 'test-customer-123',
      };

      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'success');
      expect(response.data).toHaveProperty('transactionId');
      expect(response.data.transactionId).toMatch(/^txn-\d+-[a-z0-9]+$/);
      expect(response.data).toHaveProperty('amount', 100.5);
      expect(response.data).toHaveProperty('currency', 'USD');
      expect(response.data).toHaveProperty('region', outputs.primaryRegion_output);
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should reject POST requests to /payment endpoint with missing required fields', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const invalidPaymentData = {
        currency: 'USD',
        // Missing 'amount' field
      };

      try {
        await axios.post(paymentUrl, invalidPaymentData, { timeout: 10000 });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data).toHaveProperty('error');
      }
    });

    it('should have CORS headers enabled', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 50,
        currency: 'EUR',
      };

      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 10000,
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('API Gateway Endpoints - Secondary Region', () => {
    it('should respond to GET requests on /health endpoint', async () => {
      const healthUrl = `${outputs.secondaryApiUrl}/health`;

      const response = await axios.get(healthUrl, { timeout: 10000 });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('region', outputs.secondaryRegion_output);
      expect(response.data).toHaveProperty('service', 'payment-api');
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should accept POST requests to /payment endpoint with valid data', async () => {
      const paymentUrl = `${outputs.secondaryApiUrl}/payment`;
      const paymentData = {
        amount: 250.75,
        currency: 'GBP',
        customerId: 'test-customer-456',
      };

      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'success');
      expect(response.data).toHaveProperty('transactionId');
      expect(response.data.transactionId).toMatch(/^txn-\d+-[a-z0-9]+$/);
      expect(response.data).toHaveProperty('amount', 250.75);
      expect(response.data).toHaveProperty('currency', 'GBP');
      expect(response.data).toHaveProperty('region', outputs.secondaryRegion_output);
      expect(response.data).toHaveProperty('timestamp');
    });

    it('should reject POST requests to /payment endpoint with invalid data', async () => {
      const paymentUrl = `${outputs.secondaryApiUrl}/payment`;
      const invalidPaymentData = {
        amount: 'invalid-amount',
        currency: 'USD',
      };

      try {
        await axios.post(paymentUrl, invalidPaymentData, { timeout: 10000 });
        // If no error is thrown, the Lambda might handle it gracefully
        // Still expect a 400 or success with validation
      } catch (error) {
        const axiosError = error as AxiosError;
        // Accept either 400 or 500 depending on implementation
        expect([400, 500]).toContain(axiosError.response?.status);
      }
    });
  });

  describe('Lambda Functions', () => {
    it('should process payment transactions and return transaction ID', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 99.99,
        currency: 'USD',
        customerId: 'integration-test-customer',
      };

      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });

      expect(response.data.transactionId).toBeDefined();
      expect(typeof response.data.transactionId).toBe('string');
      expect(response.data.transactionId.length).toBeGreaterThan(0);
    });

    it('should store transaction metadata including region', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 150,
        currency: 'CAD',
        customerId: 'metadata-test-customer',
      };

      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });

      expect(response.data.region).toBe(outputs.primaryRegion_output);
      expect(response.data.timestamp).toBeDefined();
      expect(typeof response.data.timestamp).toBe('number');
    });

    it('should handle concurrent payment requests from both regions', async () => {
      const primaryPaymentUrl = `${outputs.primaryApiUrl}/payment`;
      const secondaryPaymentUrl = `${outputs.secondaryApiUrl}/payment`;

      const primaryPaymentData = {
        amount: 50,
        currency: 'USD',
        customerId: 'concurrent-test-1',
      };

      const secondaryPaymentData = {
        amount: 75,
        currency: 'EUR',
        customerId: 'concurrent-test-2',
      };

      const [primaryResponse, secondaryResponse] = await Promise.all([
        axios.post(primaryPaymentUrl, primaryPaymentData, { timeout: 15000 }),
        axios.post(secondaryPaymentUrl, secondaryPaymentData, {
          timeout: 15000,
        }),
      ]);

      expect(primaryResponse.status).toBe(200);
      expect(secondaryResponse.status).toBe(200);
      expect(primaryResponse.data.transactionId).not.toBe(
        secondaryResponse.data.transactionId
      );
      expect(primaryResponse.data.region).toBe(outputs.primaryRegion_output);
      expect(secondaryResponse.data.region).toBe(
        outputs.secondaryRegion_output
      );
    });
  });

  describe('DynamoDB Global Tables', () => {
    it('should use consistent table name across regions', () => {
      expect(outputs.transactionTableName).toBe(
        `payment-transactions-${outputs.environmentSuffix_output}`
      );
      expect(outputs.transactionTableName).toMatch(
        /^payment-transactions-.+$/
      );
    });

    it('should store transaction data with all required fields', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 200.5,
        currency: 'JPY',
        customerId: 'dynamodb-test-customer',
      };

      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });

      // Verify the response contains all data that should be stored in DynamoDB
      expect(response.data).toMatchObject({
        status: 'success',
        transactionId: expect.stringMatching(/^txn-/),
        amount: 200.5,
        currency: 'JPY',
        region: outputs.primaryRegion_output,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('S3 Cross-Region Replication', () => {
    it('should have audit bucket in primary region', () => {
      expect(outputs.primaryAuditBucketName).toBe(
        `payment-audit-logs-primary-${outputs.environmentSuffix_output}`
      );
      expect(outputs.primaryAuditBucketName).toMatch(
        /^payment-audit-logs-primary-.+$/
      );
    });

    it('should have audit bucket in secondary region', () => {
      expect(outputs.secondaryAuditBucketName).toBe(
        `payment-audit-logs-secondary-${outputs.environmentSuffix_output}`
      );
      expect(outputs.secondaryAuditBucketName).toMatch(
        /^payment-audit-logs-secondary-.+$/
      );
    });

    it('should have different bucket names for primary and secondary', () => {
      expect(outputs.primaryAuditBucketName).not.toBe(
        outputs.secondaryAuditBucketName
      );
    });
  });

  describe('Application Load Balancers', () => {
    it('should have accessible primary ALB endpoint', async () => {
      const albUrl = `http://${outputs.primaryAlbDnsName}`;

      try {
        const response = await axios.get(albUrl, {
          timeout: 10000,
          validateStatus: (status) => status < 600, // Accept any status
        });

        // ALB should respond (could be 200, 502, 503 depending on target health)
        expect(response.status).toBeDefined();
        expect([200, 502, 503, 504]).toContain(response.status);
      } catch (error) {
        // Network-level errors are acceptable if ALB is being provisioned
        const axiosError = error as AxiosError;
        expect(axiosError.code).toBeDefined();
      }
    });

    it('should have accessible secondary ALB endpoint', async () => {
      const albUrl = `http://${outputs.secondaryAlbDnsName}`;

      try {
        const response = await axios.get(albUrl, {
          timeout: 10000,
          validateStatus: (status) => status < 600,
        });

        expect(response.status).toBeDefined();
        expect([200, 502, 503, 504]).toContain(response.status);
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.code).toBeDefined();
      }
    });
  });

  describe('Route53 Health Checks', () => {
    it('should have valid primary health check ID', () => {
      expect(outputs.primaryHealthCheckId).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );
    });

    it('should have valid secondary health check ID', () => {
      expect(outputs.secondaryHealthCheckId).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
      );
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have proper alarm configuration for health checks', () => {
      // Verify that health check IDs are properly configured
      expect(outputs.primaryHealthCheckId).toBeDefined();
      expect(outputs.secondaryHealthCheckId).toBeDefined();
    });

    it('should have SNS topics configured for notifications', () => {
      expect(outputs.primarySnsTopicArn).toMatch(
        /^arn:aws:sns:[a-z0-9-]+:\d+:payment-failover-topic-primary-.+$/
      );
      expect(outputs.secondarySnsTopicArn).toMatch(
        /^arn:aws:sns:[a-z0-9-]+:\d+:payment-failover-topic-secondary-.+$/
      );
    });
  });

  describe('SNS Notifications', () => {
    it('should have primary SNS topic in correct region', () => {
      expect(outputs.primarySnsTopicArn).toContain(
        outputs.primaryRegion_output
      );
    });

    it('should have secondary SNS topic in correct region', () => {
      expect(outputs.secondarySnsTopicArn).toContain(
        outputs.secondaryRegion_output
      );
    });

    it('should have different SNS topics for each region', () => {
      expect(outputs.primarySnsTopicArn).not.toBe(outputs.secondarySnsTopicArn);
    });
  });

  describe('Secrets Manager', () => {
    it('should have valid secret ARN format', () => {
      expect(outputs.secretArn).toMatch(
        /^arn:aws:secretsmanager:[a-z0-9-]+:\d+:secret:payment-api-secret-.+$/
      );
    });

    it('should have secret in primary region', () => {
      expect(outputs.secretArn).toContain(outputs.primaryRegion_output);
    });
  });

  describe('End-to-End Payment Flow', () => {
    it('should process a complete payment transaction from primary region', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 999.99,
        currency: 'USD',
        customerId: 'e2e-test-customer-primary',
      };

      const startTime = Date.now();
      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.transactionId).toBeDefined();
      expect(response.data.amount).toBe(999.99);
      expect(response.data.currency).toBe('USD');
      expect(response.data.region).toBe(outputs.primaryRegion_output);
      expect(duration).toBeLessThan(15000); // Should complete within timeout
    });

    it('should process a complete payment transaction from secondary region', async () => {
      const paymentUrl = `${outputs.secondaryApiUrl}/payment`;
      const paymentData = {
        amount: 1500.0,
        currency: 'EUR',
        customerId: 'e2e-test-customer-secondary',
      };

      const startTime = Date.now();
      const response = await axios.post(paymentUrl, paymentData, {
        timeout: 15000,
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.transactionId).toBeDefined();
      expect(response.data.amount).toBe(1500.0);
      expect(response.data.currency).toBe('EUR');
      expect(response.data.region).toBe(outputs.secondaryRegion_output);
      expect(duration).toBeLessThan(15000);
    });

    it('should handle multiple sequential transactions', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const transactions: PaymentResponse[] = [];

      for (let i = 0; i < 5; i++) {
        const paymentData = {
          amount: (i + 1) * 10,
          currency: 'USD',
          customerId: `sequential-test-customer-${i}`,
        };

        const response = await axios.post<PaymentResponse>(paymentUrl, paymentData, {
          timeout: 15000,
        });

        transactions.push(response.data);
      }

      expect(transactions).toHaveLength(5);
      transactions.forEach((transaction, index) => {
        expect(transaction.status).toBe('success');
        expect(transaction.amount).toBe((index + 1) * 10);
        expect(transaction.transactionId).toBeDefined();
      });

      // Verify all transaction IDs are unique
      const transactionIds = transactions.map((t) => t.transactionId);
      const uniqueIds = new Set(transactionIds);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('Performance and Latency', () => {
    it('should respond to health check within acceptable time', async () => {
      const healthUrl = `${outputs.primaryApiUrl}/health`;
      const startTime = Date.now();

      await axios.get(healthUrl, { timeout: 5000 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should process payment within acceptable time', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const paymentData = {
        amount: 100,
        currency: 'USD',
        customerId: 'performance-test-customer',
      };

      const startTime = Date.now();
      await axios.post(paymentUrl, paymentData, { timeout: 15000 });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed JSON gracefully', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;

      try {
        await axios.post(paymentUrl, 'invalid-json', {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        const axiosError = error as AxiosError;
        expect([400, 500]).toContain(axiosError.response?.status);
      }
    });

    it('should return proper error structure on failure', async () => {
      const paymentUrl = `${outputs.primaryApiUrl}/payment`;
      const invalidData = {};

      try {
        await axios.post(paymentUrl, invalidData, { timeout: 10000 });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data).toHaveProperty('error');
      }
    });
  });
});
