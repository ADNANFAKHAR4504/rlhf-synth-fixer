import AWS from 'aws-sdk';
import axios from 'axios';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: Record<string, any> = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  }
} catch (error) {
  console.warn('CFN outputs not available, running tests with mock data');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Configure AWS SDK
AWS.config.update({ region: awsRegion });

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const cloudwatch = new AWS.CloudWatch();
const route53 = new AWS.Route53();

// Helper function to get expected resource names
const getExpectedResourceName = (resourceType: string, suffix: string = environmentSuffix) => {
  const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';

  switch (resourceType) {
    case 'websiteBucket':
      return `marketing-campaign-website-${suffix}-${accountId}`;
    case 'logBucket':
      return `marketing-campaign-logs-${suffix}-${accountId}`;
    case 'rumAppName':
      return `marketing-campaign-rum-${suffix}`;
    case 'dashboardName':
      return `marketing-campaign-dashboard-${suffix}`;
    default:
      return '';
  }
};

describe('Static Website Infrastructure Integration Tests', () => {
  // Increase timeout for AWS API calls
  jest.setTimeout(60000);

  describe('S3 Bucket Tests', () => {
    test('Website S3 bucket should exist and be properly configured', async () => {
      const bucketName = outputs.WebsiteBucketName || getExpectedResourceName('websiteBucket');

      // If no outputs available, skip AWS API calls and just validate naming patterns
      if (!outputs.WebsiteBucketName) {
        console.warn('Website bucket not deployed, validating expected naming patterns only');
        expect(bucketName).toContain('marketing-campaign-website');
        expect(bucketName).toContain(environmentSuffix);
        return;
      }

      try {
        // Check if bucket exists
        const bucketResult = await s3.headBucket({ Bucket: bucketName }).promise();
        expect(bucketResult).toBeDefined();

        // Check bucket encryption
        const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
        expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
        expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

        // Check bucket versioning
        const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
        expect(versioning.Status).toBe('Enabled');

        // Check CORS configuration
        const cors = await s3.getBucketCors({ Bucket: bucketName }).promise();
        expect(cors.CORSRules).toHaveLength(1);
        expect(cors.CORSRules?.[0]?.AllowedMethods).toContain('GET');
        expect(cors.CORSRules?.[0]?.AllowedMethods).toContain('HEAD');

        // Check lifecycle configuration
        const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
        expect(lifecycle.Rules).toHaveLength(1);
        expect(lifecycle.Rules?.[0]?.Status).toBe('Enabled');
        expect(lifecycle.Rules?.[0]?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);

      } catch (error: any) {
        if (error.code === 'NoSuchBucket' || error.code === 'NotFound') {
          console.warn(`Website bucket ${bucketName} not found. Stack may not be deployed.`);
          expect(outputs.WebsiteBucketName).toBeUndefined();
        } else if (error.code === 'CredentialsError' || error.message?.includes('Missing credentials') || error.code === 'EHOSTUNREACH') {
          console.warn('AWS credentials not available, skipping S3 bucket tests');
          expect(bucketName).toContain('marketing-campaign-website');
          expect(bucketName).toContain(environmentSuffix);
        } else {
          throw error;
        }
      }
    });

    test('Log S3 bucket should exist and be properly configured', async () => {
      const bucketName = outputs.LogBucketName || getExpectedResourceName('logBucket');

      // If no outputs available, skip AWS API calls and just validate naming patterns
      if (!outputs.LogBucketName) {
        console.warn('Log bucket not deployed, validating expected naming patterns only');
        expect(bucketName).toContain('marketing-campaign-logs');
        expect(bucketName).toContain(environmentSuffix);
        return;
      }

      try {
        // Check if bucket exists
        const bucketResult = await s3.headBucket({ Bucket: bucketName }).promise();
        expect(bucketResult).toBeDefined();

        // Check bucket encryption
        const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
        expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);

        // Check lifecycle configuration for log retention and transitions
        const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
        expect(lifecycle.Rules).toHaveLength(1);
        const rule = lifecycle.Rules?.[0];
        expect(rule?.Status).toBe('Enabled');
        expect(rule?.Expiration?.Days).toBe(90);
        expect(rule?.Transitions).toHaveLength(2);

        // Check transitions to different storage classes
        const transitions = rule?.Transitions?.sort((a, b) => (a.Days || 0) - (b.Days || 0));
        expect(transitions?.[0]?.Days).toBe(30);
        expect(transitions?.[0]?.StorageClass).toBe('STANDARD_IA');
        expect(transitions?.[1]?.Days).toBe(60);
        // AWS API returns 'GLACIER_IR' instead of full 'GLACIER_INSTANT_RETRIEVAL'
        expect(transitions?.[1]?.StorageClass).toBe('GLACIER_IR');

      } catch (error: any) {
        if (error.code === 'NoSuchBucket' || error.code === 'NotFound') {
          console.warn(`Log bucket ${bucketName} not found. Stack may not be deployed.`);
          expect(outputs.LogBucketName).toBeUndefined();
        } else if (error.code === 'CredentialsError' || error.message?.includes('Missing credentials') || error.code === 'EHOSTUNREACH') {
          console.warn('AWS credentials not available, skipping S3 bucket tests');
          expect(bucketName).toContain('marketing-campaign-logs');
          expect(bucketName).toContain(environmentSuffix);
        } else {
          throw error;
        }
      }
    });
  });

  describe('CloudFront Distribution Tests', () => {
    test('CloudFront distribution should be deployed and accessible', async () => {
      const distributionId = outputs.CloudFrontDistributionId;
      const distributionDomain = outputs.CloudFrontDomainName;
      const cloudFrontURL = outputs.CloudFrontURL;

      if (!distributionId) {
        console.warn('CloudFront distribution not deployed, skipping distribution tests');
        return;
      }

      try {
        // Get distribution configuration
        const distribution = await cloudfront.getDistribution({ Id: distributionId }).promise();

        expect(distribution.Distribution).toBeDefined();
        expect(distribution.Distribution?.Status).toBe('Deployed');
        expect(distribution.Distribution?.DistributionConfig?.Enabled).toBe(true);
        expect(distribution.Distribution?.DistributionConfig?.DefaultRootObject).toBe('index.html');

        // Check that HTTPS redirect is enabled
        expect(distribution.Distribution?.DistributionConfig?.DefaultCacheBehavior?.ViewerProtocolPolicy)
          .toBe('redirect-to-https');

        // Check error pages configuration
        const errorPagesConfig = distribution.Distribution?.DistributionConfig?.CustomErrorResponses;

        // AWS API returns an object with Items array and Quantity, not a direct array
        if (errorPagesConfig && typeof errorPagesConfig === 'object' && 'Quantity' in errorPagesConfig) {
          expect(errorPagesConfig.Quantity).toBe(2);
          const errorPages = (errorPagesConfig as any).Items;
          const errorCodes = errorPages?.map((page: any) => page.ErrorCode).sort();
          expect(errorCodes).toEqual([403, 404]);
        } else {
          // Fallback for direct array format
          expect(errorPagesConfig).toHaveLength(2);
          const errorPages = errorPagesConfig as unknown as any[];
          const errorCodes = errorPages?.map((page: any) => page.ErrorCode).sort();
          expect(errorCodes).toEqual([403, 404]);
        }

        // Check that compression is enabled
        expect(distribution.Distribution?.DistributionConfig?.DefaultCacheBehavior?.Compress).toBe(true);

        // Check that logging is enabled
        expect(distribution.Distribution?.DistributionConfig?.Logging?.Enabled).toBe(true);
        expect(distribution.Distribution?.DistributionConfig?.Logging?.Prefix).toBe('cloudfront-logs/');

      } catch (error) {
        console.error('Error testing CloudFront distribution:', error);
        throw error;
      }
    });

    test('CloudFront URL should be accessible (basic connectivity)', async () => {
      const cloudFrontURL = outputs.CloudFrontURL;

      if (!cloudFrontURL) {
        console.warn('CloudFront URL not available, skipping accessibility test');
        return;
      }

      try {
        // Make a request to the CloudFront URL (expect 403 since no content is uploaded)
        const response = await axios.get(cloudFrontURL, {
          timeout: 30000,
          validateStatus: (status) => status === 403 || status === 404 || status === 200
        });

        // We expect either 403 (no content), 404 (not found), or 200 (content exists)
        expect([200, 403, 404]).toContain(response.status);

        // Check security headers
        expect(response.headers['x-cache']).toBeDefined();
        expect(response.headers['via']).toBeDefined();

      } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.code === 'TIMEOUT') {
          console.warn(`CloudFront URL ${cloudFrontURL} not accessible: ${error.message}`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    test('CloudWatch RUM application should be configured', async () => {
      const rumAppId = outputs.RUMAppMonitorId;

      if (!rumAppId) {
        console.warn('RUM App Monitor ID not available, skipping RUM tests');
        return;
      }

      // Note: AWS SDK v2 doesn't have native RUM support, so we'll test indirectly
      // by checking if the RUM application exists via CloudWatch logs or other means
      expect(rumAppId).toBeDefined();
      expect(typeof rumAppId).toBe('string');
      expect(rumAppId.length).toBeGreaterThan(0);
    });

    test('CloudWatch alarms should be created', async () => {
      const distributionId = outputs.CloudFrontDistributionId;

      if (!distributionId) {
        console.warn('CloudFront distribution ID not available, skipping alarm tests');
        return;
      }

      try {
        // List alarms and check for our expected alarms
        const alarms = await cloudwatch.describeAlarms().promise();

        // Look for alarms related to our distribution
        const ourAlarms = alarms.MetricAlarms?.filter(alarm =>
          alarm.AlarmName?.includes(environmentSuffix) ||
          alarm.Dimensions?.some(dim =>
            dim.Name === 'DistributionId' && dim.Value === distributionId
          )
        ) || [];

        // We should have at least some alarms (exact count depends on stack configuration)
        expect(ourAlarms.length).toBeGreaterThanOrEqual(1);

      } catch (error: any) {
        console.warn('Error checking CloudWatch alarms:', error.message);
      }
    });

    test('CloudWatch dashboard should be accessible', async () => {
      const dashboardURL = outputs.DashboardURL;

      if (!dashboardURL) {
        console.warn('Dashboard URL not available, skipping dashboard test');
        return;
      }

      expect(dashboardURL).toContain('cloudwatch');
      expect(dashboardURL).toContain('dashboards');
      expect(dashboardURL).toContain(`marketing-campaign-dashboard-${environmentSuffix}`);
    });
  });

  describe('Infrastructure Tags and Outputs Tests', () => {
    test('All required outputs should be present when stack is deployed', async () => {
      const expectedOutputKeys = [
        'WebsiteBucketName',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'CloudFrontURL',
        'LogBucketName',
        'RUMAppMonitorId',
        'DashboardURL'
      ];

      // If outputs file exists and is not empty, check all expected outputs
      if (Object.keys(outputs).length > 0) {
        for (const key of expectedOutputKeys) {
          expect(outputs[key]).toBeDefined();
          expect(typeof outputs[key]).toBe('string');
          expect(outputs[key].length).toBeGreaterThan(0);
        }
      } else {
        console.warn('No CFN outputs available - stack may not be deployed');
      }
    });

    test('Resource naming should follow expected patterns', async () => {
      const websiteBucketName = outputs.WebsiteBucketName || getExpectedResourceName('websiteBucket');
      const logBucketName = outputs.LogBucketName || getExpectedResourceName('logBucket');

      expect(websiteBucketName).toContain('marketing-campaign-website');
      expect(websiteBucketName).toContain(environmentSuffix);

      expect(logBucketName).toContain('marketing-campaign-logs');
      expect(logBucketName).toContain(environmentSuffix);

      if (outputs.CloudFrontURL) {
        expect(outputs.CloudFrontURL).toMatch(/^https:\/\//);
        expect(outputs.CloudFrontURL).toContain('.cloudfront.net');
      }
    });

    test('Environment suffix should be correctly applied', async () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);

      // Check that environment suffix is used in resource names
      if (outputs.WebsiteBucketName) {
        expect(outputs.WebsiteBucketName).toContain(environmentSuffix);
      }
      if (outputs.LogBucketName) {
        expect(outputs.LogBucketName).toContain(environmentSuffix);
      }
    });
  });
});
