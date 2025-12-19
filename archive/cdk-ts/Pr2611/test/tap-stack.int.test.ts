/**
 * Integration Tests for TapStack S3 Bucket
 *
 * These tests require the CloudFormation stack to be deployed first.
 * Run the following commands before running these tests:
 *
 * 1. npm run cdk:deploy (or cdk deploy)
 * 2. npm run test:integration
 *
 * The tests will read the bucket name from cfn-outputs/flat-outputs.json
 * which is generated after successful deployment.
 */

import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  console.log(
    'Successfully loaded CloudFormation outputs from cfn-outputs/flat-outputs.json'
  );
} catch (error) {
  console.error(
    'Failed to load CloudFormation outputs from cfn-outputs/flat-outputs.json'
  );
  console.error(
    'Make sure to run "npm run cdk:deploy" first to generate the outputs file'
  );
  console.error('Error:', error);
  process.exit(1);
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Get bucket name from CloudFormation outputs
const getBucketName = (): string => {
  // Check if we have a flat output structure (direct BucketName)
  if (outputs.BucketName) {
    return outputs.BucketName;
  }

  // Try different possible output key formats for nested structure
  const possibleKeys = [
    `TestTapStack${environmentSuffix.charAt(0).toUpperCase() + environmentSuffix.slice(1)}`,
    `TapStack${environmentSuffix.charAt(0).toUpperCase() + environmentSuffix.slice(1)}`,
    `TapStack`,
    `TestTapStack`,
  ];

  for (const key of possibleKeys) {
    if (outputs[key]?.BucketName) {
      return outputs[key].BucketName;
    }
  }

  // If no bucket name found, log available outputs for debugging
  console.log(
    'Available CloudFormation outputs:',
    JSON.stringify(outputs, null, 2)
  );
  throw new Error(
    `Bucket name not found in CloudFormation outputs for environment: ${environmentSuffix}. Available keys: ${Object.keys(outputs).join(', ')}`
  );
};

describe('TapStack S3 Bucket Integration Tests', () => {
  let bucketName: string;

  beforeAll(async () => {
    bucketName = getBucketName();
    console.log(`Testing S3 bucket: ${bucketName}`);
  });

  describe('S3 Bucket Existence and Configuration', () => {
    test('should have a valid bucket that exists', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('S3 Bucket Operations', () => {
    const testKey = 'test-object.txt';
    const testContent = 'Hello, S3! This is a test object.';

    test('should be able to upload an object', async () => {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });

      const response = await s3Client.send(command);
      expect(response.ETag).toBeDefined();
      expect(response.VersionId).toBeDefined(); // Should have version ID due to versioning
    });

    test('should be able to retrieve an uploaded object', async () => {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(command);
      const bodyContents = await response.Body?.transformToString();

      expect(bodyContents).toBe(testContent);
      expect(response.VersionId).toBeDefined();
    });

    test('should be able to delete an object', async () => {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(command);
      expect(response.VersionId).toBeDefined();
    });

    test('should maintain object versions after deletion', async () => {
      // Upload object again
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });
      await s3Client.send(putCommand);

      // Delete object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);

      // Try to get the deleted object (should fail)
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });

      await expect(s3Client.send(getCommand)).rejects.toThrow();
    });
  });

  describe('Bucket Naming Convention', () => {
    test('should follow the expected naming pattern', () => {
      const expectedPattern = new RegExp(
        `^my-bucket-${environmentSuffix}-\\d+$`
      );
      expect(bucketName).toMatch(expectedPattern);
    });

    test('should have a valid timestamp in the name', () => {
      const timestampMatch = bucketName.match(/\d+$/);
      expect(timestampMatch).toBeTruthy();

      const timestamp = parseInt(timestampMatch![0]);
      const currentTime = Date.now();

      // Timestamp should be reasonable (not too old, not in the future)
      expect(timestamp).toBeGreaterThan(currentTime - 86400000); // Within last 24 hours
      expect(timestamp).toBeLessThan(currentTime + 1000); // Not more than 1 second in future
    });
  });

  describe('Environment Configuration', () => {
    test('should use the correct environment suffix', () => {
      expect(bucketName).toContain(`-${environmentSuffix}-`);
    });

    test('should be accessible in the correct AWS region', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });
});
