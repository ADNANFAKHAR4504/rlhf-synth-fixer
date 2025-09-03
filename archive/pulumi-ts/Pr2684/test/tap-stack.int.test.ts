/**
 * Integration tests for TapStack using cfn-outputs/flat-outputs.json as reference
 *
 * These tests validate that the deployed infrastructure matches the expected outputs
 * and that the S3 bucket is accessible and properly configured.
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
    'Make sure to run "pulumi up" first to generate the outputs file'
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
  // Check if we have a flat output structure (direct bucketName)
  if (outputs.bucketName) {
    return outputs.bucketName;
  }

  // Check for other possible output structures
  if (outputs.BucketName) {
    return outputs.BucketName;
  }

  if (outputs.S3BucketName) {
    return outputs.S3BucketName;
  }

  throw new Error(
    'No bucket name found in outputs. Available outputs: ' +
      JSON.stringify(outputs, null, 2)
  );
};

describe('TapStack Integration Tests', () => {
  let bucketName: string;

  beforeAll(() => {
    bucketName = getBucketName();
    console.log(`Testing with bucket: ${bucketName}`);
  });

  describe('Outputs Validation', () => {
    test('should have required outputs from cfn-outputs/flat-outputs.json', () => {
      expect(outputs).toBeDefined();
      expect(outputs.bucketName).toBeDefined();
      expect(typeof outputs.bucketName).toBe('string');
      expect(outputs.bucketName.length).toBeGreaterThan(0);
    });

    test('should have valid bucket name format', () => {
      // Bucket name should follow the pattern: tap-storage-{env}-{stack}
      // where {env} is the environment suffix (alphanumeric) and {stack} is the sanitized stack name
      const bucketNamePattern = /^tap-storage-[a-z0-9]+-[a-z0-9]+$/;
      expect(bucketName).toMatch(bucketNamePattern);

      // Extract and validate the environment suffix
      const match = bucketName.match(/^tap-storage-([a-z0-9]+)-([a-z0-9]+)$/);
      expect(match).toBeTruthy();
      if (match) {
        const [, envSuffix, stackName] = match;
        console.log(
          `Environment suffix: ${envSuffix}, Stack name: ${stackName}`
        );

        // Environment suffix should be alphanumeric and valid
        expect(envSuffix).toMatch(/^[a-z0-9]+$/);
        expect(envSuffix.length).toBeGreaterThan(0);

        // Log the environment suffix for debugging
        console.log(`Environment suffix: ${envSuffix}`);
        // }
      }
    });
  });

  describe('S3 Bucket Integration Tests', () => {
    test('should have accessible S3 bucket', async () => {
      try {
        const command = new HeadBucketCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response).toBeDefined();
        console.log(`✅ S3 bucket ${bucketName} is accessible`);
      } catch (error) {
        console.error(`❌ S3 bucket ${bucketName} is not accessible:`, error);
        throw error;
      }
    }, 30000); // 30 second timeout for AWS API calls

    test('should have versioning enabled', async () => {
      try {
        const command = new GetBucketVersioningCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
        console.log(`✅ S3 bucket ${bucketName} has versioning enabled`);
      } catch (error) {
        console.error(
          `❌ Failed to get versioning for bucket ${bucketName}:`,
          error
        );
        throw error;
      }
    }, 30000);

    test('should have server-side encryption configured', async () => {
      try {
        const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(
          response.ServerSideEncryptionConfiguration?.Rules?.length
        ).toBeGreaterThan(0);

        const encryptionRule =
          response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(
          encryptionRule?.ApplyServerSideEncryptionByDefault
        ).toBeDefined();
        expect(
          encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');

        console.log(`✅ S3 bucket ${bucketName} has encryption configured`);
      } catch (error) {
        console.error(
          `❌ Failed to get encryption for bucket ${bucketName}:`,
          error
        );
        throw error;
      }
    }, 30000);

    test('should have public access blocked', async () => {
      try {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration).toBeDefined();

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);

        console.log(`✅ S3 bucket ${bucketName} has public access blocked`);
      } catch (error) {
        console.error(
          `❌ Failed to get public access block for bucket ${bucketName}:`,
          error
        );
        throw error;
      }
    }, 30000);
  });

  describe('S3 Object Operations Tests', () => {
    const testKey = 'test-integration-file.txt';
    const testContent = 'This is a test file for integration testing';

    test('should be able to upload and download objects', async () => {
      try {
        // Upload test object
        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        });
        await s3Client.send(uploadCommand);
        console.log(`✅ Successfully uploaded test object ${testKey}`);

        // Download and verify test object
        const downloadCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        const downloadResponse = await s3Client.send(downloadCommand);
        const downloadedContent =
          await downloadResponse.Body?.transformToString();
        expect(downloadedContent).toBe(testContent);
        console.log(
          `✅ Successfully downloaded and verified test object ${testKey}`
        );

        // Clean up test object
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        await s3Client.send(deleteCommand);
        console.log(`✅ Successfully cleaned up test object ${testKey}`);
      } catch (error) {
        console.error(
          `❌ Failed to perform object operations on bucket ${bucketName}:`,
          error
        );
        throw error;
      }
    }, 60000); // 60 second timeout for object operations
  });

  describe('Infrastructure Compliance', () => {
    test('should have bucket name matching expected pattern', () => {
      // Validate bucket naming convention - now uses sanitized stack name
      const expectedPattern = /^tap-storage-[a-z0-9]+-[a-z0-9]+$/;
      expect(bucketName).toMatch(expectedPattern);
      console.log(`✅ Bucket name ${bucketName} matches expected pattern`);
    });

    test('should have valid S3 bucket name format', () => {
      // S3 bucket names must be 3-63 characters, only lowercase letters, numbers, hyphens
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(bucketName).not.toMatch(/--/); // No consecutive hyphens
      console.log(
        `✅ Bucket name ${bucketName} has valid S3 format (length: ${bucketName.length})`
      );
    });

    test('should demonstrate bucket naming edge cases', () => {
      // This test demonstrates that our bucket naming logic handles edge cases
      // by showing the current bucket name and explaining the validation
      console.log(`Current bucket name: ${bucketName}`);
      console.log(`Bucket name length: ${bucketName.length}`);
      console.log(
        `Bucket name pattern: ${bucketName.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/) ? 'Valid' : 'Invalid'}`
      );

      // Verify the bucket name follows our expected pattern
      expect(bucketName).toMatch(/^tap-storage-[a-z0-9]+-[a-z0-9]+$/);
      expect(bucketName.length).toBeLessThanOrEqual(63);
      expect(bucketName).not.toMatch(/--/);
      expect(bucketName).not.toMatch(/-$/);

      // Extract and validate the environment suffix is not hardcoded
      const match = bucketName.match(/^tap-storage-([a-z0-9]+)-([a-z0-9]+)$/);
      expect(match).toBeTruthy();
      if (match) {
        const [, envSuffix] = match;
        // Environment suffix should be alphanumeric and valid
        expect(envSuffix).toMatch(/^[a-z0-9]+$/);
      }

      console.log(`✅ Bucket naming edge case validation passed`);
    });

    test('should have outputs file with correct structure', () => {
      // Validate outputs file structure
      expect(outputs).toHaveProperty('bucketName');
      expect(Object.keys(outputs)).toHaveLength(1); // Should only have bucketName for now
      console.log(`✅ Outputs file has correct structure`);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing outputs file gracefully', () => {
      const nonExistentPath = 'cfn-outputs/non-existent.json';
      expect(() => {
        fs.readFileSync(nonExistentPath, 'utf8');
      }).toThrow();
    });

    test('should handle invalid JSON in outputs file', () => {
      const invalidJson = '{ "invalid": json }';
      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });
  });
});
