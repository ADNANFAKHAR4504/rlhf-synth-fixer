/**
 * TapStack Integration Tests
 *
 * End-to-end integration tests using real deployed AWS resources.
 * Tests verify the deployed infrastructure works correctly.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  ListBucketIntelligentTieringConfigurationsCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: { bucketName: string; bucketArn: string };

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  throw new Error(
    `Failed to load deployment outputs from ${outputsPath}. Ensure the stack is deployed.`
  );
}

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs', () => {
    it('should have bucketName output', () => {
      expect(outputs.bucketName).toBeDefined();
      expect(typeof outputs.bucketName).toBe('string');
      expect(outputs.bucketName).toContain('video-bucket');
    });

    it('should have bucketArn output', () => {
      expect(outputs.bucketArn).toBeDefined();
      expect(typeof outputs.bucketArn).toBe('string');
      expect(outputs.bucketArn).toMatch(/^arn:aws:s3:::/);
    });

    it('should have consistent bucket name in ARN', () => {
      expect(outputs.bucketArn).toContain(outputs.bucketName);
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules!.length
      ).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration!.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration!.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration!.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration!.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('S3 Lifecycle Configuration', () => {
    it('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });

    it('should have transition to Standard-IA after 30 days', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const transitionRule = response.Rules!.find((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'STANDARD_IA')
      );

      expect(transitionRule).toBeDefined();
      const transition = transitionRule!.Transitions!.find(
        (t) => t.StorageClass === 'STANDARD_IA'
      );
      expect(transition!.Days).toBe(30);
    });

    it('should have transition to Glacier Instant Retrieval after 90 days', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const transitionRule = response.Rules!.find((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'GLACIER_IR')
      );

      expect(transitionRule).toBeDefined();
      const transition = transitionRule!.Transitions!.find(
        (t) => t.StorageClass === 'GLACIER_IR'
      );
      expect(transition!.Days).toBe(90);
    });

    it('should have multipart upload cleanup rule', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const multipartRule = response.Rules!.find(
        (rule) => rule.AbortIncompleteMultipartUpload
      );

      expect(multipartRule).toBeDefined();
      expect(
        multipartRule!.AbortIncompleteMultipartUpload!.DaysAfterInitiation
      ).toBe(7);
    });

    it('should have noncurrent version expiration rule', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const versionRule = response.Rules!.find(
        (rule) => rule.NoncurrentVersionExpiration
      );

      expect(versionRule).toBeDefined();
      expect(
        versionRule!.NoncurrentVersionExpiration!.NoncurrentDays
      ).toBe(60);
    });
  });

  describe('Intelligent Tiering Configuration', () => {
    it('should have intelligent tiering enabled', async () => {
      const command = new ListBucketIntelligentTieringConfigurationsCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(
        response.IntelligentTieringConfigurationList
      ).toBeDefined();
      expect(
        response.IntelligentTieringConfigurationList!.length
      ).toBeGreaterThan(0);
    });

    it('should have correct tiering configuration', async () => {
      const command = new ListBucketIntelligentTieringConfigurationsCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const config = response.IntelligentTieringConfigurationList![0];

      expect(config.Status).toBe('Enabled');
      expect(config.Tierings).toBeDefined();
      expect(config.Tierings!.length).toBeGreaterThan(0);

      // Check for archive access tier
      const archiveTier = config.Tierings!.find(
        (t) => t.AccessTier === 'ARCHIVE_ACCESS'
      );
      expect(archiveTier).toBeDefined();
      expect(archiveTier!.Days).toBe(90);

      // Check for deep archive access tier
      const deepArchiveTier = config.Tierings!.find(
        (t) => t.AccessTier === 'DEEP_ARCHIVE_ACCESS'
      );
      expect(deepArchiveTier).toBeDefined();
      expect(deepArchiveTier!.Days).toBe(180);
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have bucket size alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `video-bucket-size-alarm`,
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms!.find((a) =>
        a.AlarmName?.includes(outputs.bucketName.split('-').pop()!)
      );

      expect(alarm).toBeDefined();
      expect(alarm!.MetricName).toBe('BucketSizeBytes');
      expect(alarm!.Namespace).toBe('AWS/S3');
    });

    it('should have object count alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `video-bucket-objects-alarm`,
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms!.find((a) =>
        a.AlarmName?.includes(outputs.bucketName.split('-').pop()!)
      );

      expect(alarm).toBeDefined();
      expect(alarm!.MetricName).toBe('NumberOfObjects');
      expect(alarm!.Namespace).toBe('AWS/S3');
    });
  });

  describe('Bucket Operations', () => {
    const testKey = 'integration-test/test-object.txt';
    const testContent = 'Integration test content';

    it('should allow uploading objects', async () => {
      const command = new PutObjectCommand({
        Bucket: outputs.bucketName,
        Key: testKey,
        Body: testContent,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should allow deleting objects', async () => {
      const command = new DeleteObjectCommand({
        Bucket: outputs.bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(204);
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in bucket name', () => {
      const environmentSuffix =
        process.env.ENVIRONMENT_SUFFIX || 'k0p3p5q0';
      expect(outputs.bucketName).toContain(environmentSuffix);
    });

    it('should follow naming convention', () => {
      expect(outputs.bucketName).toMatch(/^video-bucket-[a-z0-9-]+$/);
    });
  });

  describe('Security Validation', () => {
    it('should have encryption at rest enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    it('should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;

      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Cost Optimization Features', () => {
    it('should have storage class transitions configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const rulesWithTransitions = response.Rules!.filter(
        (rule) => rule.Transitions && rule.Transitions.length > 0
      );

      expect(rulesWithTransitions.length).toBeGreaterThan(0);
    });

    it('should have intelligent tiering for automatic optimization', async () => {
      const command = new ListBucketIntelligentTieringConfigurationsCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(
        response.IntelligentTieringConfigurationList
      ).toBeDefined();
      expect(
        response.IntelligentTieringConfigurationList!.length
      ).toBeGreaterThan(0);
    });
  });
});
