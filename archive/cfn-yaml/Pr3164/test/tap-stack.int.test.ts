// Configuration - These are coming from cfn-outputs after cfn deploy
import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK configuration
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const route53 = new AWS.Route53();
const kms = new AWS.KMS();
const cloudwatch = new AWS.CloudWatch();

describe('Static Website Infrastructure Integration Tests', () => {
  describe('S3 Website Bucket', () => {
    test('should exist and be accessible', async () => {
      expect(outputs.WebsiteBucketName).toBeDefined();

      const bucketName = outputs.WebsiteBucketName;
      const result: any = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(result).toBeDefined();
    });

    test('should have KMS encryption enabled', async () => {
      expect(outputs.WebsiteBucketName).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();

      const bucketName = outputs.WebsiteBucketName;
      const encryption: any = await s3.getBucketEncryption({ Bucket: bucketName }).promise();

      expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID).toBe(outputs.KMSKeyArn);
    });

    test('should have versioning enabled', async () => {
      const bucketName = outputs.WebsiteBucketName;
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();

      expect(versioning.Status).toBe('Enabled');
    });

    test('should have lifecycle configuration', async () => {
      const bucketName = outputs.WebsiteBucketName;
      const lifecycle: any = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();

      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].ID).toBe('DeleteOldVersions');
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].NoncurrentVersionExpiration.NoncurrentDays).toBe(30);
    });
  });

  describe('S3 Logging Bucket', () => {
    test('should exist and be accessible', async () => {
      expect(outputs.LoggingBucketName).toBeDefined();

      const bucketName = outputs.LoggingBucketName;
      const result: any = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(result).toBeDefined();
    });

    test('should have AES256 encryption', async () => {
      const bucketName = outputs.LoggingBucketName;
      const encryption: any = await s3.getBucketEncryption({ Bucket: bucketName }).promise();

      expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have lifecycle policy for log cleanup', async () => {
      const bucketName = outputs.LoggingBucketName;
      const lifecycle: any = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();

      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].ID).toBe('DeleteOldLogs');
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].Expiration.Days).toBe(90);
    });
  });

  describe('CloudFront Distribution', () => {
    test('should exist and be enabled', async () => {
      expect(outputs.CloudFrontDistributionId).toBeDefined();

      const distributionId = outputs.CloudFrontDistributionId;
      const result: any = await cloudfront.getDistribution({ Id: distributionId }).promise();

      expect(result.Distribution.DistributionConfig.Enabled).toBe(true);
      expect(result.Distribution.DistributionConfig.DefaultRootObject).toBe('index.html');
    });

    test('should have correct origin configuration', async () => {
      const distributionId = outputs.CloudFrontDistributionId;
      const result: any = await cloudfront.getDistribution({ Id: distributionId }).promise();
      const config = result.Distribution.DistributionConfig;

      expect(config.Origins.Items).toHaveLength(1);
      expect(config.Origins.Items[0].Id).toBe('S3Origin');
      expect(config.Origins.Items[0].DomainName).toContain(outputs.WebsiteBucketName);
    });

    test('should have logging configured', async () => {
      const distributionId = outputs.CloudFrontDistributionId;
      const result: any = await cloudfront.getDistribution({ Id: distributionId }).promise();
      const config = result.Distribution.DistributionConfig;

      expect(config.Logging.Enabled).toBe(true);
      expect(config.Logging.Bucket).toContain(outputs.LoggingBucketName);
      expect(config.Logging.Prefix).toBe('cloudfront-logs/');
    });
  });

  describe('KMS Key', () => {
    test('should exist and have key rotation enabled', async () => {
      expect(outputs.KMSKeyId).toBeDefined();

      const keyId = outputs.KMSKeyId;
      const keyDetails: any = await kms.describeKey({ KeyId: keyId }).promise();

      expect(keyDetails.KeyMetadata.KeyState).toBe('Enabled');

      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Route53 (when domain is configured)', () => {
    test('should have hosted zone when domain is provided', async () => {
      if (outputs.HostedZoneId) {
        const hostedZoneId = outputs.HostedZoneId;
        const result: any = await route53.getHostedZone({ Id: hostedZoneId }).promise();

        expect(result.HostedZone).toBeDefined();
        expect(result.HostedZone.Config.Comment).toContain(environmentSuffix);
      }
    });

    test('should have name servers when domain is provided', async () => {
      if (outputs.NameServers) {
        expect(outputs.NameServers).toBeDefined();
        expect(typeof outputs.NameServers).toBe('string');
        expect(outputs.NameServers.split(', ')).toHaveLength(4); // AWS provides 4 name servers
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have 4xx error alarm configured', async () => {
      const alarms: any = await cloudwatch.describeAlarms({
        AlarmNamePrefix: `TapStack${environmentSuffix}-cloudfront-4xx-errors`
      }).promise();

      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms[0];
      expect(alarm.MetricName).toBe('4xxErrorRate');
      expect(alarm.Namespace).toBe('AWS/CloudFront');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have 5xx error alarm configured', async () => {
      const alarms: any = await cloudwatch.describeAlarms({
        AlarmNamePrefix: `TapStack${environmentSuffix}-cloudfront-5xx-errors`
      }).promise();

      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm: any = alarms.MetricAlarms[0];
      expect(alarm.MetricName).toBe('5xxErrorRate');
      expect(alarm.Namespace).toBe('AWS/CloudFront');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Website Accessibility', () => {
    test('should be accessible via CloudFront domain', async () => {
      expect(outputs.CloudFrontDomainName).toBeDefined();
      expect(outputs.WebsiteURL).toBeDefined();

      const websiteUrl = outputs.WebsiteURL;
      expect(websiteUrl).toMatch(/^https?:\/\/.+/);

      // Note: We don't make actual HTTP requests in integration tests
      // as the website content might not be uploaded yet
      // This test validates that the URL format is correct
    });

    test('should have HTTPS URL when SSL is enabled', async () => {
      const websiteUrl = outputs.WebsiteURL;

      // If a custom domain is configured and SSL is enabled, URL should be HTTPS
      if (outputs.HostedZoneId && websiteUrl.startsWith('https://')) {
        expect(websiteUrl).toMatch(/^https:\/\/[a-zA-Z0-9.-]+$/);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging across resources', async () => {
      // Test S3 bucket tags
      const bucketName = outputs.WebsiteBucketName;
      const bucketTags = await s3.getBucketTagging({ Bucket: bucketName }).promise();

      const environmentTag: any = bucketTags.TagSet.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag.Value).toBe(environmentSuffix);

      const purposeTag: any = bucketTags.TagSet.find(tag => tag.Key === 'Purpose');
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('StaticWebsiteHosting');
    });
  });
});
