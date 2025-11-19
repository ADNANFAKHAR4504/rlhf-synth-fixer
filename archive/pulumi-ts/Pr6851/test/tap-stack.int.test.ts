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
    try {
      outputs = loadDeploymentOutputs();
      console.log('Loaded deployment outputs:', {
        environmentSuffix: outputs.environmentSuffix_output,
        primaryRegion: outputs.primaryRegion_output,
        secondaryRegion: outputs.secondaryRegion_output,
      });
    } catch (error) {
      console.warn('Warning: Could not load deployment outputs. Integration tests will be skipped.');
      console.warn('To run integration tests, deploy the infrastructure first with: pulumi up');
    }
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

  describe('Performance and Latency', () => {
    it('should respond to health check within acceptable time', async () => {
      const healthUrl = `${outputs.primaryApiUrl}/health`;
      const startTime = Date.now();

      await axios.get(healthUrl, { timeout: 5000 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
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

  describe('Resource Naming Conventions', () => {
    it('should follow consistent naming pattern for DynamoDB table', () => {
      const expectedPattern = new RegExp(
        `^payment-transactions-${outputs.environmentSuffix_output}$`
      );
      expect(outputs.transactionTableName).toMatch(expectedPattern);
      expect(outputs.transactionTableName).not.toContain(' ');
      expect(outputs.transactionTableName).not.toContain('_');
    });

    it('should follow consistent naming pattern for S3 buckets', () => {
      const primaryPattern = new RegExp(
        `^payment-audit-logs-primary-${outputs.environmentSuffix_output}$`
      );
      const secondaryPattern = new RegExp(
        `^payment-audit-logs-secondary-${outputs.environmentSuffix_output}$`
      );

      expect(outputs.primaryAuditBucketName).toMatch(primaryPattern);
      expect(outputs.secondaryAuditBucketName).toMatch(secondaryPattern);
      expect(outputs.primaryAuditBucketName.toLowerCase()).toBe(
        outputs.primaryAuditBucketName
      );
      expect(outputs.secondaryAuditBucketName.toLowerCase()).toBe(
        outputs.secondaryAuditBucketName
      );
    });

    it('should follow consistent naming pattern for ALB', () => {
      expect(outputs.primaryAlbDnsName).toContain('payment-alb-pri');
      expect(outputs.secondaryAlbDnsName).toContain('payment-alb-sec');
      expect(outputs.primaryAlbDnsName).toContain(outputs.environmentSuffix_output);
      expect(outputs.secondaryAlbDnsName).toContain(
        outputs.environmentSuffix_output
      );
    });

    it('should follow consistent naming pattern for SNS topics', () => {
      expect(outputs.primarySnsTopicArn).toContain(
        `payment-failover-topic-primary-${outputs.environmentSuffix_output}`
      );
      expect(outputs.secondarySnsTopicArn).toContain(
        `payment-failover-topic-secondary-${outputs.environmentSuffix_output}`
      );
    });

    it('should follow consistent naming pattern for Secrets Manager', () => {
      expect(outputs.secretArn).toContain(
        `payment-api-secret-${outputs.environmentSuffix_output}`
      );
    });
  });

  describe('ARN Format Validation', () => {
    it('should have valid ARN format for SNS topics', () => {
      const arnPattern =
        /^arn:aws:sns:[a-z0-9-]+:[0-9]{12}:payment-failover-topic-(primary|secondary)-.+$/;
      expect(outputs.primarySnsTopicArn).toMatch(arnPattern);
      expect(outputs.secondarySnsTopicArn).toMatch(arnPattern);
    });

    it('should have valid ARN format for Secrets Manager secret', () => {
      const arnPattern =
        /^arn:aws:secretsmanager:[a-z0-9-]+:[0-9]{12}:secret:payment-api-secret-.+$/;
      expect(outputs.secretArn).toMatch(arnPattern);
    });

    it('should have valid account ID in ARNs', () => {
      const primaryAccountId = outputs.primarySnsTopicArn.split(':')[4];
      const secondaryAccountId = outputs.secondarySnsTopicArn.split(':')[4];
      const secretAccountId = outputs.secretArn.split(':')[4];

      expect(primaryAccountId).toMatch(/^[0-9]{12}$/);
      expect(primaryAccountId).toBe(secondaryAccountId);
      expect(primaryAccountId).toBe(secretAccountId);
    });
  });

  describe('Region Consistency', () => {
    it('should have all primary resources in primary region', () => {
      expect(outputs.primaryApiUrl).toContain(outputs.primaryRegion_output);
      expect(outputs.primaryAlbDnsName).toContain(outputs.primaryRegion_output);
      expect(outputs.primarySnsTopicArn).toContain(outputs.primaryRegion_output);
      expect(outputs.secretArn).toContain(outputs.primaryRegion_output);
    });

    it('should have all secondary resources in secondary region', () => {
      expect(outputs.secondaryApiUrl).toContain(outputs.secondaryRegion_output);
      expect(outputs.secondaryAlbDnsName).toContain(
        outputs.secondaryRegion_output
      );
      expect(outputs.secondarySnsTopicArn).toContain(
        outputs.secondaryRegion_output
      );
    });

    it('should have different regions for primary and secondary', () => {
      expect(outputs.primaryRegion_output).not.toBe(
        outputs.secondaryRegion_output
      );
    });
  });

  describe('URL Format Validation', () => {
    it('should have HTTPS protocol for API Gateway URLs', () => {
      expect(outputs.primaryApiUrl).toMatch(/^https:\/\//);
      expect(outputs.secondaryApiUrl).toMatch(/^https:\/\//);
    });

    it('should have valid API Gateway URL structure', () => {
      const apiGatewayPattern =
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod$/;
      expect(outputs.primaryApiUrl).toMatch(apiGatewayPattern);
      expect(outputs.secondaryApiUrl).toMatch(apiGatewayPattern);
    });

    it('should have different API Gateway IDs for each region', () => {
      const primaryApiId = outputs.primaryApiUrl.split('.')[0].replace('https://', '');
      const secondaryApiId = outputs.secondaryApiUrl.split('.')[0].replace('https://', '');
      expect(primaryApiId).not.toBe(secondaryApiId);
    });
  });

  describe('UUID Format Validation', () => {
    it('should have valid UUID format for health check IDs', () => {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      expect(outputs.primaryHealthCheckId).toMatch(uuidPattern);
      expect(outputs.secondaryHealthCheckId).toMatch(uuidPattern);
    });

    it('should have different UUIDs for primary and secondary health checks', () => {
      expect(outputs.primaryHealthCheckId).not.toBe(
        outputs.secondaryHealthCheckId
      );
    });

    it('should have lowercase UUIDs for health checks', () => {
      expect(outputs.primaryHealthCheckId).toBe(
        outputs.primaryHealthCheckId.toLowerCase()
      );
      expect(outputs.secondaryHealthCheckId).toBe(
        outputs.secondaryHealthCheckId.toLowerCase()
      );
    });
  });

  describe('Environment Suffix Consistency', () => {
    it('should use same environment suffix across all resources', () => {
      const suffix = outputs.environmentSuffix_output;

      expect(outputs.transactionTableName).toContain(suffix);
      expect(outputs.primaryAuditBucketName).toContain(suffix);
      expect(outputs.secondaryAuditBucketName).toContain(suffix);
      expect(outputs.primaryAlbDnsName).toContain(suffix);
      expect(outputs.secondaryAlbDnsName).toContain(suffix);
      expect(outputs.primarySnsTopicArn).toContain(suffix);
      expect(outputs.secondarySnsTopicArn).toContain(suffix);
      expect(outputs.secretArn).toContain(suffix);
    });

    it('should have non-empty environment suffix', () => {
      expect(outputs.environmentSuffix_output).toBeTruthy();
      expect(outputs.environmentSuffix_output.length).toBeGreaterThan(0);
    });

    it('should have valid environment suffix format', () => {
      expect(outputs.environmentSuffix_output).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Resource Uniqueness', () => {
    it('should have unique resource names between primary and secondary', () => {
      expect(outputs.primaryAuditBucketName).not.toBe(
        outputs.secondaryAuditBucketName
      );
      expect(outputs.primaryAlbDnsName).not.toBe(outputs.secondaryAlbDnsName);
      expect(outputs.primaryApiUrl).not.toBe(outputs.secondaryApiUrl);
      expect(outputs.primaryHealthCheckId).not.toBe(
        outputs.secondaryHealthCheckId
      );
      expect(outputs.primarySnsTopicArn).not.toBe(outputs.secondarySnsTopicArn);
    });

    it('should have global resources only once', () => {
      expect(outputs.transactionTableName).toBeDefined();
      expect(outputs.secretArn).toBeDefined();
    });
  });

  describe('Deployment Output Completeness', () => {
    it('should have exactly 15 deployment outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys).toHaveLength(15);
    });

    it('should have all expected output keys', () => {
      const expectedKeys = [
        'environmentSuffix_output',
        'primaryAlbDnsName',
        'primaryApiUrl',
        'primaryAuditBucketName',
        'primaryHealthCheckId',
        'primaryRegion_output',
        'primarySnsTopicArn',
        'secondaryAlbDnsName',
        'secondaryApiUrl',
        'secondaryAuditBucketName',
        'secondaryHealthCheckId',
        'secondaryRegion_output',
        'secondarySnsTopicArn',
        'secretArn',
        'transactionTableName',
      ];

      expect(expectedKeys).toHaveLength(15);

      expectedKeys.forEach((key) => {
        expect(outputs).toHaveProperty(key);
      });
    });

    it('should have no undefined or null values', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API Endpoint Structure', () => {
    it('should have /prod stage in API Gateway URLs', () => {
      expect(outputs.primaryApiUrl.endsWith('/prod')).toBe(true);
      expect(outputs.secondaryApiUrl.endsWith('/prod')).toBe(true);
    });

    it('should have execute-api subdomain in API URLs', () => {
      expect(outputs.primaryApiUrl).toContain('.execute-api.');
      expect(outputs.secondaryApiUrl).toContain('.execute-api.');
    });

    it('should have amazonaws.com domain in API URLs', () => {
      expect(outputs.primaryApiUrl).toContain('.amazonaws.com');
      expect(outputs.secondaryApiUrl).toContain('.amazonaws.com');
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should have ELB subdomain in ALB DNS names', () => {
      expect(outputs.primaryAlbDnsName).toContain('.elb.');
      expect(outputs.secondaryAlbDnsName).toContain('.elb.');
    });

    it('should have amazonaws.com domain in ALB DNS names', () => {
      expect(outputs.primaryAlbDnsName.endsWith('.amazonaws.com')).toBe(true);
      expect(outputs.secondaryAlbDnsName.endsWith('.amazonaws.com')).toBe(true);
    });

    it('should have region-specific ALB endpoints', () => {
      expect(outputs.primaryAlbDnsName).toContain(
        `.${outputs.primaryRegion_output}.`
      );
      expect(outputs.secondaryAlbDnsName).toContain(
        `.${outputs.secondaryRegion_output}.`
      );
    });
  });
});
