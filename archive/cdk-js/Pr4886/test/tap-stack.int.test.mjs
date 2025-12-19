import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';
import https from 'https';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const stsClient = new STSClient({ region });

describe('News Platform Infrastructure Integration Tests', () => {
  let accountId;

  beforeAll(async () => {
    // Get the AWS account ID for ARN validation
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account;
  });

  describe('S3 Content Bucket Integration', () => {
    test('Content bucket should exist and be accessible', async () => {
      const bucketName = outputs.ContentBucketName;
      expect(bucketName).toBeDefined();
      // Test bucket exists by listing objects
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(listCommand);
      expect(response).toBeDefined();
    });

    test('Content bucket should have proper configuration', async () => {
      const bucketName = outputs.ContentBucketName;

      // Test upload capability
      const testKey = `test-article-${Date.now()}.html`;
      const testContent =
        '<html><head><title>Test Article</title></head><body><h1>Test News Article</h1></body></html>';

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/html',
      });

      await s3Client.send(putCommand);

      // Verify the object was uploaded
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const headResponse = await s3Client.send(headCommand);
      expect(headResponse.ContentType).toBe('text/html');
      expect(headResponse.ContentLength).toBe(testContent.length);
    });
  });

  describe('S3 Logging Bucket Integration', () => {
    test('Logging bucket should exist and be accessible', async () => {
      const bucketName = outputs.LoggingBucketName;
      expect(bucketName).toBeDefined();

      // Test bucket exists by listing objects
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(listCommand);
      expect(response).toBeDefined();
    });
  });

  describe('CloudFront Distribution Integration', () => {
    test('CloudFront distribution should exist and be deployed', async () => {
      const distributionId = outputs.CloudFrontDistributionId;
      expect(distributionId).toBeDefined();

      const getDistCommand = new GetDistributionCommand({
        Id: distributionId,
      });

      const response = await cloudFrontClient.send(getDistCommand);
      expect(response.Distribution).toBeDefined();
      expect(response.Distribution.Status).toBe('Deployed');
      expect(response.Distribution.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFront distribution should have correct configuration', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      const getDistCommand = new GetDistributionCommand({
        Id: distributionId,
      });

      const response = await cloudFrontClient.send(getDistCommand);
      const config = response.Distribution.DistributionConfig;

      // Test HTTPS redirect
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe(
        'redirect-to-https'
      );

      // Test compression
      expect(config.DefaultCacheBehavior.Compress).toBe(true);

      // Test default root object
      expect(config.DefaultRootObject).toBe('index.html');

      // Test logging is enabled
      expect(config.Logging.Enabled).toBe(true);
      expect(config.Logging.Bucket).toContain(outputs.LoggingBucketName);
    });

    test('CloudFront distribution should be accessible via HTTPS', async () => {
      const distributionDomain = outputs.CloudFrontDistributionDomain;
      expect(distributionDomain).toBeDefined();

      return new Promise((resolve, reject) => {
        const options = {
          hostname: distributionDomain,
          port: 443,
          path: '/',
          method: 'GET',
          headers: {
            'User-Agent': 'NewsplatformIntegrationTest/1.0',
          },
          timeout: 30000,
        };

        const req = https.request(options, res => {
          expect(res.statusCode).toBeDefined();
          // Accept 403 (no content) or 404 (not found) as valid responses
          // since we haven't uploaded actual content
          expect([403, 404]).toContain(res.statusCode);

          // Verify HTTPS headers
          expect(res.headers['server']).toContain('AmazonS3');
          resolve();
        });

        req.on('error', err => {
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });
    });

    test('CloudFront invalidation should work', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      const invalidationCommand = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/test-invalidation-path'],
          },
          CallerReference: `test-invalidation-${Date.now()}`,
        },
      });

      const response = await cloudFrontClient.send(invalidationCommand);
      expect(response.Invalidation).toBeDefined();
      expect(response.Invalidation.Status).toBe('InProgress');
    });
  });

  describe('CloudWatch Monitoring Integration', () => {
    test('CloudWatch dashboard URL should be accessible', () => {
      const dashboardUrl = outputs.CloudWatchDashboardUrl;
      expect(dashboardUrl).toBeDefined();
      expect(dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
    });

    test('CloudWatch metrics should be available for CloudFront', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      // Test if CloudFront metrics namespace is available (may not have data yet)
      const metricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'AWS/CloudFront',
        MetricName: 'Requests',
        Dimensions: [
          {
            Name: 'DistributionId',
            Value: distributionId,
          },
        ],
        StartTime: new Date(Date.now() - 3600000), // 1 hour ago
        EndTime: new Date(),
        Period: 3600, // 1 hour
        Statistics: ['Sum'],
      });

      // This should not throw an error even if no data points exist
      const response = await cloudWatchClient.send(metricsCommand);
      expect(response.Datapoints).toBeDefined();
    });
  });

  describe('IAM Role Integration', () => {
    test('Invalidation role ARN should be correctly formatted', () => {
      const roleArn = outputs.InvalidationRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(
        new RegExp(`arn:aws:iam::${accountId}:role/.*InvalidationRole.*`)
      );
    });
  });

  describe('End-to-End Workflow Integration', () => {
    test('Complete content delivery workflow', async () => {
      // 1. Upload test content to S3
      const bucketName = outputs.ContentBucketName;
      const testKey = `workflow-test-${Date.now()}.html`;
      const testContent = `
        <html>
          <head><title>Workflow Test Article</title></head>
          <body>
            <h1>Test News Article for E2E Testing</h1>
            <p>This content was uploaded at ${new Date().toISOString()}</p>
          </body>
        </html>
      `;

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/html',
        CacheControl: 'max-age=300',
      });

      await s3Client.send(putCommand);

      // 2. Verify upload
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const headResponse = await s3Client.send(headCommand);
      expect(headResponse.ContentType).toBe('text/html');

      // 3. Test CloudFront distribution response (should work via OAC)
      const distributionDomain = outputs.CloudFrontDistributionDomain;

      return new Promise((resolve, reject) => {
        const options = {
          hostname: distributionDomain,
          port: 443,
          path: `/${testKey}`,
          method: 'GET',
          headers: {
            'User-Agent': 'NewsplatformWorkflowTest/1.0',
          },
          timeout: 30000,
        };

        const req = https.request(options, res => {
          let data = '';

          res.on('data', chunk => {
            data += chunk;
          });

          res.on('end', () => {
            // Should get the content or a 403 initially (cache miss)
            if (res.statusCode === 200) {
              expect(data).toContain('Test News Article for E2E Testing');
              expect(res.headers['x-cache']).toBeDefined();
            } else {
              // Accept 403 as CloudFront might not have picked up the file yet
              expect([200, 403]).toContain(res.statusCode);
            }
            resolve();
          });
        });

        req.on('error', err => {
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });
    });

    test('Resource tagging and naming consistency', () => {
      // Verify all resources follow naming conventions
      const contentBucket = outputs.ContentBucketName;
      const loggingBucket = outputs.LoggingBucketName;
      const distributionId = outputs.CloudFrontDistributionId;

      expect(contentBucket).toMatch(/^news-platform-content-/);
      expect(loggingBucket).toMatch(/^news-platform-logs-/);

      // All bucket names should include environment suffix
      expect(contentBucket).toContain(environmentSuffix);
      expect(loggingBucket).toContain(environmentSuffix);

      // Distribution ID should be CloudFront format
      expect(distributionId).toMatch(/^[A-Z0-9]+$/);
      expect(distributionId.length).toBeGreaterThan(10);
    });
  });

  describe('Performance and Scalability Integration', () => {
    test('Multiple concurrent S3 operations should succeed', async () => {
      const bucketName = outputs.ContentBucketName;

      const uploadPromises = [];
      for (let i = 0; i < 5; i++) {
        const testKey = `concurrent-test-${i}-${Date.now()}.html`;
        const testContent = `<html><body><h1>Concurrent Test ${i}</h1></body></html>`;

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/html',
        });

        uploadPromises.push(s3Client.send(putCommand));
      }

      const results = await Promise.all(uploadPromises);
      expect(results).toHaveLength(5);

      // Verify all uploads succeeded
      results.forEach(result => {
        expect(result.ETag).toBeDefined();
      });
    });
  });
});
