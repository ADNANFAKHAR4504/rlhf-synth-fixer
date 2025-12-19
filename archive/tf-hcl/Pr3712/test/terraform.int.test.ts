// tests/integration/terraform-integration-tests.ts
// Integration tests for Terraform S3 static website infrastructure
// These tests deploy real AWS resources and validate their functionality

import {
  DeleteObjectsCommand, GetBucketCorsCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand, GetBucketLocationCommand, GetBucketPolicyCommand, GetBucketTaggingCommand, GetBucketVersioningCommand, GetBucketWebsiteCommand, GetPublicAccessBlockCommand, HeadObjectCommand,
  ListObjectsV2Command, PutObjectCommand, S3Client
} from '@aws-sdk/client-s3';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK v3
const s3 = new S3Client({ region: 'us-west-2' });
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 300000; // 5 minutes

interface TerraformOutputs {
  bucket_name: { value: string };
  website_endpoint_url: { value: string };
  bucket_arn: { value: string };
}

describe('Terraform S3 Static Website Integration Tests', () => {
  let terraformOutputs: TerraformOutputs;
  let bucketName: string;
  let websiteEndpoint: string;
  let bucketArn: string;
  const testPrefix = `test-${uuidv4().substring(0, 8)}`;

  beforeAll(async () => {
    console.log('🚀 Starting Terraform integration tests...');
    console.log(`Test prefix: ${testPrefix}`);

    // Ensure we're in the correct directory
    process.chdir(TERRAFORM_DIR);

    // Create a local backend configuration for testing
    console.log('📦 Initializing Terraform...');

    // Create a test-specific provider configuration
    const testProviderConfig = `
terraform {
  required_version = ">= 1.2.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"  
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "random" {}
`;

    // Backup original provider.tf and create test version
    const originalProvider = fs.readFileSync('provider.tf', 'utf8');
    fs.writeFileSync('provider.tf.backup', originalProvider);
    fs.writeFileSync('provider.tf', testProviderConfig);

    // Initialize with local backend
    execSync('terraform init', { stdio: 'pipe' });

    // Apply Terraform configuration
    console.log('🏗️  Deploying infrastructure...');
    execSync('terraform apply -auto-approve', { stdio: 'pipe' });

    // Get outputs
    const outputJson = execSync('terraform output -json', { encoding: 'utf8' });
    terraformOutputs = JSON.parse(outputJson);

    bucketName = terraformOutputs.bucket_name.value;
    websiteEndpoint = terraformOutputs.website_endpoint_url.value;
    bucketArn = terraformOutputs.bucket_arn.value;

    console.log(`✅ Infrastructure deployed successfully!`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Website: ${websiteEndpoint}`);
    console.log(`   ARN: ${bucketArn}`);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('🧹 Cleaning up test resources...');

    try {
      // Empty the bucket first (required for deletion)
      await emptyS3Bucket(bucketName);

      // Destroy Terraform resources
      execSync('terraform destroy -auto-approve', { stdio: 'pipe' });

      // Restore original provider.tf
      if (fs.existsSync('provider.tf.backup')) {
        const originalProvider = fs.readFileSync('provider.tf.backup', 'utf8');
        fs.writeFileSync('provider.tf', originalProvider);
        fs.unlinkSync('provider.tf.backup');
      }

      console.log('✅ Resources cleaned up successfully!');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);

      // Always try to restore provider.tf even if other cleanup fails
      try {
        if (fs.existsSync('provider.tf.backup')) {
          const originalProvider = fs.readFileSync('provider.tf.backup', 'utf8');
          fs.writeFileSync('provider.tf', originalProvider);
          fs.unlinkSync('provider.tf.backup');
        }
      } catch (restoreError) {
        console.error('❌ Error restoring provider.tf:', restoreError);
      }
    }
  }, TEST_TIMEOUT);

  // ============================================================================
  // Infrastructure Deployment Tests
  // ============================================================================
  describe('Infrastructure Deployment', () => {
    test('should successfully deploy all resources via Terraform', () => {
      expect(terraformOutputs).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(websiteEndpoint).toBeDefined();
      expect(bucketArn).toBeDefined();
    });

    test('should have valid bucket name format', () => {
      expect(bucketName).toMatch(/^media-assets-[a-z0-9]{8}$/);
    });

    test('should have valid website endpoint format', () => {
      expect(websiteEndpoint).toMatch(/^media-assets-[a-z0-9]{8}\.s3-website-us-west-2\.amazonaws\.com$/);
    });

    test('should have valid bucket ARN format', () => {
      expect(bucketArn).toMatch(/^arn:aws:s3:::media-assets-[a-z0-9]{8}$/);
    });
  });

  // ============================================================================
  // S3 Bucket Configuration Tests
  // ============================================================================
  describe('S3 Bucket Configuration', () => {
    test('should have bucket with correct region', async () => {
      const command = new GetBucketLocationCommand({ Bucket: bucketName });
      const bucketLocation = await s3.send(command);
      expect(bucketLocation.LocationConstraint).toBe('us-west-2');
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioning = await s3.send(command);
      expect(versioning.Status).toBe('Enabled');
    });

    test('should have server-side encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryption = await s3.send(command);
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have correct tags applied', async () => {
      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const tagging = await s3.send(command);
      const tags = tagging.TagSet?.reduce((acc, tag) => {
        if (tag.Key && tag.Value) {
          acc[tag.Key] = tag.Value;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      expect(tags.Environment).toBe('production');
      expect(tags.Project).toBe('media-launch');
    });

    test('should have public access block configured correctly', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessBlock = await s3.send(command);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(false);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(false);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(false);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(false);
    });
  });

  // ============================================================================
  // Website Configuration Tests
  // ============================================================================
  describe('Website Configuration', () => {
    test('should have static website hosting enabled', async () => {
      const command = new GetBucketWebsiteCommand({ Bucket: bucketName });
      const websiteConfig = await s3.send(command);
      expect(websiteConfig.IndexDocument?.Suffix).toBe('index.html');
      expect(websiteConfig.ErrorDocument?.Key).toBe('error.html');
    });

    test('should have CORS configuration applied', async () => {
      const command = new GetBucketCorsCommand({ Bucket: bucketName });
      const corsConfig = await s3.send(command);
      expect(corsConfig.CORSRules).toHaveLength(1);

      const rule = corsConfig.CORSRules?.[0];
      expect(rule?.AllowedMethods).toContain('GET');
      expect(rule?.AllowedOrigins).toContain('*');
      expect(rule?.AllowedHeaders).toContain('Content-Type');
      expect(rule?.AllowedHeaders).toContain('Authorization');
      expect(rule?.MaxAgeSeconds).toBe(3600);
    });
  });

  // ============================================================================
  // Lifecycle Configuration Tests
  // ============================================================================
  describe('Lifecycle Configuration', () => {
    test('should have lifecycle rule for Standard-IA transition', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const lifecycleConfig = await s3.send(command);
      expect(lifecycleConfig.Rules).toHaveLength(1);

      const rule = lifecycleConfig.Rules?.[0];
      expect(rule?.ID).toBe('transition_to_standard_ia');
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Transitions).toHaveLength(1);
      expect(rule?.Transitions?.[0].Days).toBe(30);
      expect(rule?.Transitions?.[0].StorageClass).toBe('STANDARD_IA');
    });
  });

  // ============================================================================
  // Bucket Policy Tests
  // ============================================================================
  describe('Bucket Policy', () => {
    test('should have public read policy configured', async () => {
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const bucketPolicy = await s3.send(command);
      const policy = JSON.parse(bucketPolicy.Policy || '{}');

      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(1);

      const statement = policy.Statement[0];
      expect(statement.Sid).toBe('PublicReadGetObject');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Resource).toBe(`${bucketArn}/*`);
    });
  });

  // ============================================================================
  // Website Functionality Tests
  // ============================================================================
  describe('Website Functionality', () => {
    beforeAll(async () => {
      // Upload test files
      await uploadTestFiles(bucketName);
    });

    test('should serve index.html as default document', async () => {
      const response = await fetch(`http://${websiteEndpoint}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      const content = await response.text();
      expect(content).toContain('<title>Test Media Assets</title>');
    });

    test('should serve error.html for 404s', async () => {
      const response = await fetch(`http://${websiteEndpoint}/nonexistent.html`);
      expect(response.status).toBe(404);

      const content = await response.text();
      expect(content).toContain('<title>Page Not Found</title>');
    });

    test('should serve static assets with correct CORS headers', async () => {
      const response = await fetch(`http://${websiteEndpoint}/test.css`, {
        method: 'GET',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });

    test('should serve different file types correctly', async () => {
      // Test CSS file
      const cssResponse = await fetch(`http://${websiteEndpoint}/test.css`);
      expect(cssResponse.status).toBe(200);
      expect(cssResponse.headers.get('content-type')).toContain('text/css');

      // Test JavaScript file
      const jsResponse = await fetch(`http://${websiteEndpoint}/test.js`);
      expect(jsResponse.status).toBe(200);
      expect(jsResponse.headers.get('content-type')).toContain('application/javascript');
    });
  });

  // ============================================================================
  // Storage Class Transition Tests (Future)
  // ============================================================================
  describe('Storage Class Transition', () => {
    test('should have lifecycle rule configured for future transitions', async () => {
      // Note: Actual transition testing would require waiting 30+ days
      // This test validates the configuration is in place

      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const lifecycleConfig = await s3.send(command);
      const rule = lifecycleConfig.Rules?.[0];

      expect(rule?.Transitions?.[0].Days).toBe(30);
      expect(rule?.Transitions?.[0].StorageClass).toBe('STANDARD_IA');

      // Verify no expiration rules (objects should not be deleted)
      expect(rule?.Expiration).toBeUndefined();
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================
  describe('Security Configuration', () => {
    test('should allow public read access to objects', async () => {
      const testKey = 'public-read-test.txt';
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'This is a public read test',
        ContentType: 'text/plain'
      });
      await s3.send(putCommand);

      const response = await fetch(`http://${websiteEndpoint}/${testKey}`);
      expect(response.status).toBe(200);

      const content = await response.text();
      expect(content).toBe('This is a public read test');
    });

    test('should have server-side encryption for uploaded objects', async () => {
      const testKey = 'encryption-test.txt';
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'This is an encryption test'
      });
      await s3.send(putCommand);

      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      const headObject = await s3.send(headCommand);

      expect(headObject.ServerSideEncryption).toBe('AES256');
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

async function uploadTestFiles(bucketName: string): Promise<void> {
  const testFiles = [
    {
      key: 'index.html',
      body: `<!DOCTYPE html>
<html>
<head>
    <title>Test Media Assets</title>
    <link rel="stylesheet" href="test.css">
</head>
<body>
    <h1>Welcome to Test Media Assets</h1>
    <p>This is a test deployment of our static website.</p>
    <script src="test.js"></script>
</body>
</html>`,
      contentType: 'text/html'
    },
    {
      key: 'error.html',
      body: `<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The requested page could not be found.</p>
</body>
</html>`,
      contentType: 'text/html'
    },
    {
      key: 'test.css',
      body: `body {
    font-family: Arial, sans-serif;
    margin: 40px;
    background-color: #f5f5f5;
}
h1 {
    color: #333;
    text-align: center;
}`,
      contentType: 'text/css'
    },
    {
      key: 'test.js',
      body: `console.log('Test JavaScript file loaded successfully');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
});`,
      contentType: 'application/javascript'
    }
  ];

  for (const file of testFiles) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: file.key,
      Body: file.body,
      ContentType: file.contentType
    });
    await s3.send(command);
  }

  console.log(`✅ Uploaded ${testFiles.length} test files to bucket`);
}

async function emptyS3Bucket(bucketName: string): Promise<void> {
  try {
    // List all objects in the bucket
    const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
    const listedObjects = await s3.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return;
    }

    // Delete all objects
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key! }))
      }
    });

    await s3.send(deleteCommand);

    // If there are more objects, recursively delete them
    if (listedObjects.IsTruncated) {
      await emptyS3Bucket(bucketName);
    }
  } catch (error) {
    console.error(`Error emptying bucket ${bucketName}:`, error);
    throw error;
  }
}
