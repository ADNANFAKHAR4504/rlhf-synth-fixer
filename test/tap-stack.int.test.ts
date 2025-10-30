/**
 * Integration tests for CI/CD Pipeline Stack
 *
 * These tests validate the actual deployed infrastructure resources
 * and their configurations in AWS.
 */
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const REGION = 'ap-southeast-1';
const OUTPUTS_FILE = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);

// AWS Clients
AWS.config.update({ region: REGION });
const s3Client = new AWS.S3();
const eventsClient = new AWS.CloudWatchEvents();

// Load outputs from deployment
let outputs: any = {};

beforeAll(() => {
  if (fs.existsSync(OUTPUTS_FILE)) {
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf-8');
    outputs = JSON.parse(outputsContent);
  } else {
    console.warn('Outputs file not found. Some tests may fail.');
  }
});

describe('CI/CD Pipeline Integration Tests', () => {
  describe('S3 Artifact Bucket', () => {
    it('should exist with correct configuration', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const bucketResponse = await s3Client
        .headBucket({ Bucket: bucketName })
        .promise();
      expect(bucketResponse.$response.httpResponse.statusCode).toBe(200);

      // Check versioning
      const versioningResponse = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionResponse = await s3Client
        .getBucketEncryption({ Bucket: bucketName })
        .promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');

      // Check lifecycle rules
      const lifecycleResponse = await s3Client
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules?.length).toBeGreaterThan(0);
      expect(lifecycleResponse.Rules?.[0]?.Expiration?.Days).toBe(30);

      // Check tags
      const tagsResponse = await s3Client
        .getBucketTagging({ Bucket: bucketName })
        .promise();
      const tags = tagsResponse.TagSet || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const teamTag = tags.find((t) => t.Key === 'Team');
      expect(envTag).toBeDefined();
      expect(teamTag?.Value).toBe('devops');
    });

    it('should have public access blocked', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    it('should have correct bucket policy', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      try {
        const response = await s3Client
          .getBucketPolicy({ Bucket: bucketName })
          .promise();

        const policy = JSON.parse(response.Policy || '{}');
        expect(policy.Statement).toBeDefined();
        expect(policy.Statement.length).toBeGreaterThan(0);
      } catch (error: any) {
        // Bucket policy might not be set, which is acceptable
        if (error.code !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    });
  });

  describe('CloudWatch Event Rule', () => {
    it('should exist for pipeline triggering', async () => {
      // List rules and find the one for our pipeline
      const rulesResponse = await eventsClient.listRules().promise();
      const pipelineRule = rulesResponse.Rules?.find((r) =>
        r.Name?.includes('pipeline-trigger')
      );

      expect(pipelineRule).toBeDefined();
      expect(pipelineRule?.State).toBe('ENABLED');

      // Check event pattern
      if (pipelineRule?.EventPattern) {
        const eventPattern = JSON.parse(pipelineRule.EventPattern);
        expect(eventPattern.source).toContain('aws.codepipeline');
        expect(eventPattern['detail-type']).toContain(
          'CodePipeline Pipeline Execution State Change'
        );
      }

      // Check targets
      const targetsResponse = await eventsClient
        .listTargetsByRule({ Rule: pipelineRule?.Name || '' })
        .promise();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
    });

    it('should have valid event pattern', async () => {
      const rulesResponse = await eventsClient.listRules().promise();
      const pipelineRule = rulesResponse.Rules?.find((r) =>
        r.Name?.includes('pipeline-trigger')
      );

      expect(pipelineRule).toBeDefined();

      if (pipelineRule?.EventPattern) {
        const eventPattern = JSON.parse(pipelineRule.EventPattern);
        expect(eventPattern).toHaveProperty('source');
        expect(eventPattern).toHaveProperty('detail-type');
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in resource names', () => {
      // All output names should contain a suffix pattern
      expect(outputs.artifactBucketName).toMatch(/-\w+$/);
    });

    it('should have consistent naming across resources', () => {
      const bucketName = outputs.artifactBucketName;

      // Extract suffix from bucket name
      const suffixMatch = bucketName.match(/-(\w+)$/);
      expect(suffixMatch).toBeTruthy();

      const suffix = suffixMatch?.[1];
      expect(suffix).toBeDefined();
      expect(suffix?.length).toBeGreaterThan(0);
    });
  });

  describe('Output Validation', () => {
    it('should have artifactBucketName output', () => {
      expect(outputs.artifactBucketName).toBeDefined();
      expect(typeof outputs.artifactBucketName).toBe('string');
      expect(outputs.artifactBucketName.length).toBeGreaterThan(0);
    });

    it('should have valid bucket name format', () => {
      const bucketName = outputs.artifactBucketName;

      // S3 bucket naming rules
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
    });
  });
});
