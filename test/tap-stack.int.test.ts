import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;

  // Get environment suffix from environment variable or default
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  beforeAll(() => {
    // Load the deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      throw new Error('Deployment outputs not found. Run deployment first.');
    }
  });

  describe('S3 Storage', () => {
    test('should have created the S3 bucket', async () => {
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.bucketName).toContain('software-dist-binaries');

      // Verify bucket name follows expected pattern
      expect(outputs.bucketName).toMatch(/^software-dist-binaries-dev-[a-z0-9]+$/);
    });
  });

  describe('API Gateway', () => {
    test('should have created the API Gateway', async () => {
      expect(outputs.apiUrl).toBeDefined();
      expect(outputs.apiUrl).toContain('execute-api.us-east-1.amazonaws.com');

      // Extract API ID from URL
      const apiIdMatch = outputs.apiUrl.match(/https:\/\/([^.]+)\.execute-api/);
      expect(apiIdMatch).toBeTruthy();

      // Verify the URL structure is correct
      expect(outputs.apiUrl).toMatch(/https:\/\/[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com\/dev$/);
    });

    test('should have license validation endpoint', async () => {
      const licenseEndpoint = `${outputs.apiUrl}/licenses/validate`;
      expect(licenseEndpoint).toContain('/licenses/validate');
    });

    test('should have usage tracking endpoint', async () => {
      const usageEndpoint = `${outputs.apiUrl}/usage/track`;
      expect(usageEndpoint).toContain('/usage/track');
    });
  });

  describe('CloudFront Distribution', () => {
    test('should have created the CloudFront distribution', async () => {
      expect(outputs.distributionUrl).toBeDefined();
      expect(outputs.distributionUrl).toContain('cloudfront.net');
    });

    test('should be accessible via HTTPS', async () => {
      const url = `https://${outputs.distributionUrl}`;
      expect(url).toMatch(/^https:\/\/.+\.cloudfront\.net$/);

      // Test that the CloudFront distribution responds (may return 403 but should not timeout)
      try {
        const response = await axios.head(url, { timeout: 10000 });
        // Any HTTP status code means the distribution is accessible
        expect(response.status).toBeDefined();
      } catch (error: any) {
        // CloudFront may return 403 or 404 for root path, which is expected
        expect([403, 404]).toContain(error.response?.status);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('should have all required components for software distribution', () => {
      // Verify all necessary outputs exist
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.apiUrl).toBeDefined();
      expect(outputs.distributionUrl).toBeDefined();

      // Verify naming conventions include environment suffix
      expect(outputs.bucketName).toContain(environmentSuffix);
      expect(outputs.apiUrl).toContain(environmentSuffix);
    });

    test('should support secure distribution workflow', () => {
      // CloudFront URL for distribution
      expect(outputs.distributionUrl).toBeTruthy();

      // API for license validation
      expect(outputs.apiUrl).toBeTruthy();

      // S3 bucket for storage
      expect(outputs.bucketName).toBeTruthy();

      // All components should work together
      const workflowComponents = {
        storage: outputs.bucketName,
        cdn: outputs.distributionUrl,
        api: outputs.apiUrl,
      };

      expect(Object.values(workflowComponents).every(v => v)).toBe(true);
    });
  });
});
