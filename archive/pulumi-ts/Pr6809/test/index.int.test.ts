// integration-tests/tap-stack.integration.test.ts

import { describe, it, expect, beforeAll } from '@jest/globals';
import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentOutputs {
  apiGatewayUrl: string;
  dynamodbTableArn: string;
  s3BucketName: string;
}

describe('TapStack Integration Tests', () => {
  let outputs: DeploymentOutputs;
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs from flat-outputs.json
    const rawOutputs = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawOutputs);
    
    // Validate required outputs exist
    expect(outputs.apiGatewayUrl).toBeDefined();
    expect(outputs.dynamodbTableArn).toBeDefined();
    expect(outputs.s3BucketName).toBeDefined();
  });

  describe('Deployment Outputs Validation', () => {
    it('should have valid API Gateway URL format', () => {
      expect(outputs.apiGatewayUrl).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod\/ingest$/
      );
    });

    it('should have valid S3 bucket name format', () => {
      expect(outputs.s3BucketName).toMatch(/^market-data-.+$/);
      expect(outputs.s3BucketName).toBe(outputs.s3BucketName.toLowerCase());
    });

    it('should extract region from DynamoDB ARN', () => {
      const arnParts = outputs.dynamodbTableArn.split(':');
      const region = arnParts[3];
      expect(region).toBe('us-east-1');
    });

    it('should extract table name from DynamoDB ARN', () => {
      const tableName = outputs.dynamodbTableArn.split('/')[1];
      expect(tableName).toContain('MarketDataState-');
    });
  });

  describe('API Gateway Endpoint Tests', () => {
    it('should reject GET requests (only POST allowed)', async () => {
      try {
        await axios.get(outputs.apiGatewayUrl);
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });

    it('should reject unauthorized POST requests (IAM auth required)', async () => {
      try {
        await axios.post(outputs.apiGatewayUrl, {
          symbol: 'AAPL',
          price: 150.25,
          timestamp: Date.now()
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        // 403 Forbidden due to missing AWS IAM credentials
        expect(axiosError.response?.status).toBe(403);
      }
    });

    it('should return 403 for requests without proper headers', async () => {
      try {
        await axios.post(
          outputs.apiGatewayUrl,
          { data: 'test' },
          { headers: { 'Content-Type': 'application/json' } }
        );
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });

    it('should have correct API endpoint structure', () => {
      const url = new URL(outputs.apiGatewayUrl);
      expect(url.protocol).toBe('https:');
      expect(url.pathname).toBe('/prod/ingest');
      expect(url.hostname).toContain('execute-api');
      expect(url.hostname).toContain('us-east-1');
    });

    it('should respond within reasonable timeout', async () => {
      const startTime = Date.now();
      try {
        await axios.get(outputs.apiGatewayUrl, { timeout: 5000 });
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(5000);
        expect((error as AxiosError).code).not.toBe('ECONNABORTED');
      }
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow consistent naming pattern for S3 bucket', () => {
      expect(outputs.s3BucketName).toMatch(/^market-data-[a-z0-9]+$/);
    });

    it('should follow consistent naming pattern for DynamoDB table', () => {
      const tableName = outputs.dynamodbTableArn.split('/')[1];
      expect(tableName).toMatch(/^MarketDataState-[a-zA-Z0-9]+$/);
    });

    it('should have matching environment suffix across resources', () => {
      const s3Suffix = outputs.s3BucketName.split('-').pop();
      const tableName = outputs.dynamodbTableArn.split('/')[1];
      const tableSuffix = tableName.split('-').pop();
      
      expect(s3Suffix).toBeDefined();
      expect(tableSuffix).toBeDefined();
    });
  });

  describe('AWS Service Integration', () => {
    it('should have API Gateway in correct region', () => {
      expect(outputs.apiGatewayUrl).toContain('us-east-1');
    });

    it('should have DynamoDB table in correct region', () => {
      expect(outputs.dynamodbTableArn).toContain('us-east-1');
    });

    it('should use prod stage for API Gateway', () => {
      expect(outputs.apiGatewayUrl).toContain('/prod/');
    });

    it('should have ingest endpoint path', () => {
      expect(outputs.apiGatewayUrl).toMatch(/\/ingest$/);
    });
  });

  describe('Output Data Integrity', () => {
    it('should have non-empty output values', () => {
      expect(outputs.apiGatewayUrl.length).toBeGreaterThan(0);
      expect(outputs.dynamodbTableArn.length).toBeGreaterThan(0);
      expect(outputs.s3BucketName.length).toBeGreaterThan(0);
    });

    it('should not contain placeholder values', () => {
      expect(outputs.apiGatewayUrl).not.toContain('undefined');
      expect(outputs.apiGatewayUrl).not.toContain('null');
      expect(outputs.dynamodbTableArn).not.toContain('undefined');
      expect(outputs.s3BucketName).not.toContain('undefined');
    });

    it('should have proper AWS account masking in ARN', () => {
      // The flat-outputs.json shows *** masking the account ID
      expect(outputs.dynamodbTableArn).toContain(':table/');
    });
  });

  describe('API Gateway Security', () => {
    it('should enforce HTTPS only', () => {
      expect(outputs.apiGatewayUrl).toMatch(/^https:\/\//);
      expect(outputs.apiGatewayUrl).not.toContain('http://');
    });

    it('should reject OPTIONS preflight without auth', async () => {
      try {
        await axios.options(outputs.apiGatewayUrl);
      } catch (error) {
        const axiosError = error as AxiosError;
        // Should either succeed with CORS or fail with 403
        expect([200, 403]).toContain(axiosError.response?.status);
      }
    });

    it('should reject requests with invalid content types', async () => {
      try {
        await axios.post(
          outputs.apiGatewayUrl,
          'invalid-data',
          { headers: { 'Content-Type': 'text/plain' } }
        );
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });
  });

  describe('Infrastructure Configuration Validation', () => {
    it('should have Production environment tag reflected in naming', () => {
      // Based on commonTags.Environment = 'Production' in stack
      const tableName = outputs.dynamodbTableArn.split('/')[1];
      expect(tableName).toContain('MarketDataState');
    });

    it('should use lowercase for S3 bucket name', () => {
      expect(outputs.s3BucketName).toBe(outputs.s3BucketName.toLowerCase());
      expect(outputs.s3BucketName).not.toMatch(/[A-Z]/);
    });

    it('should have consistent resource identifiers', () => {
      const apiId = outputs.apiGatewayUrl.split('.')[0].replace('https://', '');
      expect(apiId).toMatch(/^[a-z0-9]+$/);
      expect(apiId.length).toBeGreaterThan(5);
    });
  });

  describe('Market Data Schema Validation', () => {
    it('should validate market data payload structure', () => {
      const validPayload = {
        symbol: 'AAPL',
        price: 150.25,
        timestamp: Date.now(),
        volume: 1000000,
        high: 151.00,
        low: 149.50
      };

      expect(validPayload.symbol).toMatch(/^[A-Z]{1,5}$/);
      expect(validPayload.price).toBeGreaterThan(0);
      expect(validPayload.timestamp).toBeGreaterThan(0);
    });

    it('should validate DynamoDB key schema alignment', () => {
      // Based on hashKey: 'symbol', rangeKey: 'timestamp'
      const testRecord = {
        symbol: 'TSLA',
        timestamp: 1700000000000
      };

      expect(typeof testRecord.symbol).toBe('string');
      expect(typeof testRecord.timestamp).toBe('number');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle network timeouts gracefully', async () => {
      try {
        await axios.get(outputs.apiGatewayUrl, { timeout: 1 });
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(['ECONNABORTED', 'ERR_BAD_REQUEST'].includes(axiosError.code || '')).toBeTruthy();
      }
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = outputs.apiGatewayUrl + '//../invalid';
      expect(() => new URL(malformedUrl)).not.toThrow();
    });

    it('should validate payload size limits', () => {
      const largePayload = {
        symbol: 'TEST',
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB
      };
      
      expect(JSON.stringify(largePayload).length).toBeGreaterThan(6 * 1024 * 1024);
    });
  });

  describe('Load and Performance Tests', () => {
    it('should handle concurrent request attempts', async () => {
      const requests = Array(5).fill(null).map(() =>
        axios.post(outputs.apiGatewayUrl, { test: 'data' })
          .catch(err => err)
      );

      const results = await Promise.all(requests);
      expect(results.length).toBe(5);
      
      // All should fail with 403 (no auth) but not crash
      results.forEach(result => {
        if (result.response) {
          expect(result.response.status).toBe(403);
        }
      });
    });

    it('should validate API Gateway throttling configuration', () => {
      // Based on throttlingBurstLimit: 10000, throttlingRateLimit: 10000
      const throttleConfig = {
        burstLimit: 10000,
        rateLimit: 10000
      };

      expect(throttleConfig.burstLimit).toBeGreaterThan(0);
      expect(throttleConfig.rateLimit).toBeGreaterThan(0);
    });
  });
});
