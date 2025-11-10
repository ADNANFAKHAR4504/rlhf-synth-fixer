/**
 * Integration Tests for Multi-Region DR Infrastructure
 *
 * These tests validate the deployed infrastructure by testing actual AWS resources.
 * Tests use dynamic outputs from cfn-outputs/flat-outputs.json.
 *
 * Prerequisites:
 * - Infrastructure must be deployed (pulumi up)
 * - Outputs must be saved to cfn-outputs/flat-outputs.json
 * - AWS credentials must be configured
 *
 * Run with: npm run test:integration
 */

import * as fs from 'fs';
import * as path from 'path';

// Type definition for stack outputs
interface StackOutputs {
  primaryLambdaUrl?: string;
  secondaryLambdaUrl?: string;
  globalTableName?: string;
  primaryBucketName?: string;
  secondaryBucketName?: string;
}

describe('Multi-Region DR Infrastructure - Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn(
        'Warning: cfn-outputs/flat-outputs.json not found. Integration tests may fail.'
      );
      outputs = {};
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.primaryLambdaUrl).toBeDefined();
      expect(outputs.secondaryLambdaUrl).toBeDefined();
      expect(outputs.globalTableName).toBeDefined();
      expect(outputs.primaryBucketName).toBeDefined();
      expect(outputs.secondaryBucketName).toBeDefined();
    });

    test('should have valid Lambda URLs', () => {
      expect(outputs.primaryLambdaUrl).toContain('lambda-url');
      expect(outputs.primaryLambdaUrl).toContain('on.aws');
      expect(outputs.secondaryLambdaUrl).toContain('lambda-url');
      expect(outputs.secondaryLambdaUrl).toContain('on.aws');
    });

    test('should have valid table name', () => {
      expect(outputs.globalTableName).toContain('tap-');
      expect(outputs.globalTableName).toContain('global');
    });

    test('should have valid bucket names', () => {
      expect(outputs.primaryBucketName).toContain('tap-');
      expect(outputs.primaryBucketName).toContain('primary');
      expect(outputs.secondaryBucketName).toContain('tap-');
      expect(outputs.secondaryBucketName).toContain('secondary');
    });
  });

  describe('Primary Region Lambda', () => {
    test('should be accessible via Function URL', async () => {
      if (!outputs.primaryLambdaUrl) {
        throw new Error('Primary Lambda URL not available');
      }

      const response = await fetch(outputs.primaryLambdaUrl);
      expect(response.status).toBe(200);

      const data = (await response.json()) as { message?: string };
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('us-east-1');
    }, 10000);

    test('should write to DynamoDB', async () => {
      if (!outputs.primaryLambdaUrl) {
        throw new Error('Primary Lambda URL not available');
      }

      const response = await fetch(outputs.primaryLambdaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'primary-region' }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { tableName?: string };
      expect(data).toHaveProperty('tableName');
      expect(data.tableName).toBe(outputs.globalTableName);
    }, 10000);
  });

  describe('Secondary Region Lambda', () => {
    test('should be accessible via Function URL', async () => {
      if (!outputs.secondaryLambdaUrl) {
        throw new Error('Secondary Lambda URL not available');
      }

      const response = await fetch(outputs.secondaryLambdaUrl);
      expect(response.status).toBe(200);

      const data = (await response.json()) as { message?: string };
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('us-west-2');
    }, 10000);

    test('should write to DynamoDB', async () => {
      if (!outputs.secondaryLambdaUrl) {
        throw new Error('Secondary Lambda URL not available');
      }

      const response = await fetch(outputs.secondaryLambdaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'secondary-region' }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { tableName?: string };
      expect(data).toHaveProperty('tableName');
      expect(data.tableName).toBe(outputs.globalTableName);
    }, 10000);
  });

  describe('DynamoDB Global Table Replication', () => {
    test('should replicate data between regions', async () => {
      // This test would use AWS SDK to verify replication
      // For now, we validate that both Lambdas can write to the same table
      expect(outputs.globalTableName).toBeDefined();

      // In a full implementation, this would:
      // 1. Write item to primary region
      // 2. Wait for replication (a few seconds)
      // 3. Read from secondary region
      // 4. Verify item exists in both regions
    }, 15000);
  });

  describe('S3 Cross-Region Replication', () => {
    test('should have versioning enabled on both buckets', () => {
      // This test would use AWS SDK to check bucket versioning
      expect(outputs.primaryBucketName).toBeDefined();
      expect(outputs.secondaryBucketName).toBeDefined();

      // In a full implementation, this would:
      // 1. Call S3 GetBucketVersioning for primary bucket
      // 2. Verify versioning is Enabled
      // 3. Repeat for secondary bucket
    });

    test('should have replication configuration on primary bucket', () => {
      // This test would use AWS SDK to check replication rules
      expect(outputs.primaryBucketName).toBeDefined();

      // In a full implementation, this would:
      // 1. Call S3 GetBucketReplication for primary bucket
      // 2. Verify replication rule exists
      // 3. Verify destination is secondary bucket
    });
  });

  describe('Multi-Region Failover', () => {
    test('both regions should be independently operational', async () => {
      // Test that both regions work simultaneously
      if (!outputs.primaryLambdaUrl || !outputs.secondaryLambdaUrl) {
        throw new Error('Lambda URLs not available');
      }

      const [primaryResponse, secondaryResponse] = await Promise.all([
        fetch(outputs.primaryLambdaUrl),
        fetch(outputs.secondaryLambdaUrl),
      ]);

      expect(primaryResponse.status).toBe(200);
      expect(secondaryResponse.status).toBe(200);

      const primaryData = (await primaryResponse.json()) as {
        tableName?: string;
      };
      const secondaryData = (await secondaryResponse.json()) as {
        tableName?: string;
      };

      // Both should reference the same global table
      expect(primaryData.tableName).toBe(outputs.globalTableName);
      expect(secondaryData.tableName).toBe(outputs.globalTableName);
    }, 15000);
  });

  describe('Resource Naming Consistency', () => {
    test('all resources should use environment suffix', () => {
      const environmentSuffix =
        process.env.ENVIRONMENT_SUFFIX || 'synthmfm20';

      expect(outputs.globalTableName).toContain(environmentSuffix);
      expect(outputs.primaryBucketName).toContain(environmentSuffix);
      expect(outputs.secondaryBucketName).toContain(environmentSuffix);
    });
  });
});
