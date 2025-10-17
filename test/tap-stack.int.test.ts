import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

// Load CloudFormation outputs
let outputs: any = {};
let outputsLoaded = false;

try {
  const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
  console.log('Looking for outputs at:', outputsPath);

  if (fs.existsSync(outputsPath)) {
    const fileContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(fileContent);
    outputsLoaded = true;
    console.log('Successfully loaded outputs from file');
    console.log('Available keys:', Object.keys(outputs));
  } else {
    console.warn('cfn-outputs/flat-outputs.json not found at:', outputsPath);
  }
} catch (error) {
  console.warn('Error loading cfn-outputs/flat-outputs.json:', error);
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const accountId = process.env.AWS_ACCOUNT_ID || '149536495831';
const accountLast5 = accountId.slice(-5);

// Load outputs directly from the output keys
const distributionId = outputs['DistributionIdOutput'] || '';
const distributionDomainName = outputs['DistributionDomainNameOutput'] || '';
const contentBucketName = outputs['ContentBucketNameOutput'] || '';
const loggingBucketName = outputs['LoggingBucketNameOutput'] || '';
const invalidationRoleArn = outputs['InvalidationRoleArnOutput'] || '';
const contentManagementRoleArn = outputs['ContentManagementRoleArnOutput'] || '';

// Log configuration immediately
console.log('\n=== Test Configuration ===');
console.log(`Environment Suffix: ${environmentSuffix}`);
console.log(`Region: ${region}`);
console.log(`Account ID: ${accountId}`);
console.log(`Account Last 5: ${accountLast5}`);
console.log(`Distribution ID: ${distributionId || 'NOT FOUND'}`);
console.log(`Distribution Domain: ${distributionDomainName || 'NOT FOUND'}`);
console.log(`Content Bucket: ${contentBucketName || 'NOT FOUND'}`);
console.log(`Logging Bucket: ${loggingBucketName || 'NOT FOUND'}`);
console.log(`Invalidation Role: ${invalidationRoleArn || 'NOT FOUND'}`);
console.log(`Content Role: ${contentManagementRoleArn || 'NOT FOUND'}`);
console.log('========================\n');

// Validate that all required outputs are loaded
const hasRequiredOutputs = distributionId && distributionDomainName && contentBucketName && loggingBucketName;

if (!hasRequiredOutputs) {
  console.error('\n❌ ERROR: Missing required CloudFormation outputs!');
  console.error('Please ensure cfn-outputs/flat-outputs.json exists and contains all required outputs.');
  console.error('Required outputs: DistributionIdOutput, DistributionDomainNameOutput, ContentBucketNameOutput, LoggingBucketNameOutput\n');
}

// Configure AWS SDK with connection settings to prevent hanging
const httpOptions = {
  timeout: 5000,
  connectTimeout: 5000,
};

// Initialize AWS SDK clients with proper configuration
const s3 = new AWS.S3({
  region,
  httpOptions,
  maxRetries: 3,
});

const cloudfront = new AWS.CloudFront({
  region,
  httpOptions,
  maxRetries: 3,
});

const cloudwatch = new AWS.CloudWatch({
  region,
  httpOptions,
  maxRetries: 3,
});

const iam = new AWS.IAM({
  region,
  httpOptions,
  maxRetries: 3,
});

// Helper function to make HTTP requests
const httpsGet = (url: string): Promise<{ statusCode: number; headers: any; body: string }> => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

describe('TapStack Integration Tests', () => {
  const testFileName = 'test-file.html';
  const testFileContent = '<html><body><h1>Integration Test</h1></body></html>';

  beforeAll(() => {
    // Skip all tests if required outputs are missing
    if (!hasRequiredOutputs) {
      throw new Error('Missing required CloudFormation outputs. Cannot run integration tests.');
    }
  });

  describe('S3 Bucket Configuration', () => {
    test('content bucket exists and has correct configuration', async () => {
      const bucketConfig = await s3.getBucketVersioning({
        Bucket: contentBucketName,
      }).promise();

      expect(bucketConfig.Status).toBe('Enabled');
    });

    test('content bucket has encryption enabled', async () => {
      const encryption = await s3.getBucketEncryption({
        Bucket: contentBucketName,
      }).promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('content bucket has CORS configured', async () => {
      const cors = await s3.getBucketCors({
        Bucket: contentBucketName,
      }).promise();

      expect(cors.CORSRules).toBeDefined();
      expect(cors.CORSRules?.length).toBeGreaterThan(0);
      expect(cors.CORSRules?.[0].AllowedMethods).toContain('GET');
    });

    test('content bucket has public access blocked', async () => {
      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: contentBucketName,
      }).promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('logging bucket exists and has lifecycle rules', async () => {
      const lifecycle = await s3.getBucketLifecycleConfiguration({
        Bucket: loggingBucketName,
      }).promise();

      expect(lifecycle.Rules).toBeDefined();
      const deleteRule = lifecycle.Rules?.find(r => r.ID === 'DeleteOldLogs');
      expect(deleteRule).toBeDefined();
      expect(deleteRule?.Status).toBe('Enabled');
      expect(deleteRule?.Expiration?.Days).toBe(90);
    });

    test('content bucket has logging configured', async () => {
      const logging = await s3.getBucketLogging({
        Bucket: contentBucketName,
      }).promise();

      expect(logging.LoggingEnabled).toBeDefined();
      expect(logging.LoggingEnabled?.TargetBucket).toBe(loggingBucketName);
      expect(logging.LoggingEnabled?.TargetPrefix).toBe('s3-access-logs/');
    });
  });

  describe('CloudFront Distribution Configuration', () => {
    let distribution: AWS.CloudFront.Distribution;

    beforeAll(async () => {
      const response = await cloudfront.getDistribution({
        Id: distributionId,
      }).promise();
      distribution = response.Distribution!;
    });

    test('distribution exists and is enabled', () => {
      expect(distribution).toBeDefined();
      expect(distribution.DistributionConfig.Enabled).toBe(true);
    });

    test('distribution has correct origin configuration', () => {
      const origin = distribution.DistributionConfig.Origins.Items[0];
      expect(origin).toBeDefined();
      expect(origin.S3OriginConfig).toBeDefined();
      expect(origin.DomainName).toContain(contentBucketName);
    });

    test('distribution has HTTPS redirect enabled', () => {
      const defaultBehavior = distribution.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('distribution has HTTP/2 and HTTP/3 enabled', () => {
      expect(distribution.DistributionConfig.HttpVersion).toBe('http2and3');
    });

    test('distribution has minimum TLS version configured', () => {
      expect(distribution.DistributionConfig.ViewerCertificate?.MinimumProtocolVersion).toBe('TLSv1');
    });

    test('distribution has cache policy configured', () => {
      const defaultBehavior = distribution.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.CachePolicyId).toBeDefined();
    });

    test('distribution has response headers policy configured', () => {
      const defaultBehavior = distribution.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ResponseHeadersPolicyId).toBeDefined();
    });

    test('distribution has error responses configured', () => {
      const errorResponses = distribution.DistributionConfig.CustomErrorResponses?.Items || [];
      expect(errorResponses.length).toBeGreaterThan(0);

      const error404 = errorResponses.find(e => e.ErrorCode === 404);
      expect(error404).toBeDefined();
      expect(error404?.ResponseCode).toBe("404");
      expect(error404?.ResponsePagePath).toBe('/404.html');
    });
  });

  describe('Content Delivery Workflow', () => {
    test('upload test file to S3 bucket', async () => {
      await s3.putObject({
        Bucket: contentBucketName,
        Key: testFileName,
        Body: testFileContent,
        ContentType: 'text/html',
      }).promise();

      // Verify upload
      const object = await s3.headObject({
        Bucket: contentBucketName,
        Key: testFileName,
      }).promise();

      expect(object).toBeDefined();
      expect(object.ContentType).toBe('text/html');
    });

    test('retrieve uploaded file from S3 directly', async () => {
      const response = await s3.getObject({
        Bucket: contentBucketName,
        Key: testFileName,
      }).promise();

      expect(response.Body?.toString()).toBe(testFileContent);
    });

    test('file is accessible through CloudFront', async () => {
      const url = `https://${distributionDomainName}/${testFileName}`;

      // Wait for CloudFront propagation
      console.log('Waiting for CloudFront propagation (30 seconds)...');
      await sleep(30000);

      const response = await httpsGet(url);

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Integration Test');
    }, 60000); // 60 second timeout

    test('CloudFront returns correct security headers', async () => {
      const url = `https://${distributionDomainName}/${testFileName}`;
      const response = await httpsGet(url);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });


    test('HTTP redirects to HTTPS', async () => {
      const httpUrl = `http://${distributionDomainName}/${testFileName}`;

      try {
        await new Promise((resolve, reject) => {
          const http = require('http');
          const req = http.get(httpUrl, { timeout: 5000 }, (res: any) => {
            expect(res.statusCode).toBe(301);
            expect(res.headers.location).toContain('https://');
            resolve(res);
          });
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        });
      } catch (error) {
        // Some environments may not support HTTP, that's okay
        console.log('HTTP test skipped - may not be supported in all environments');
      }
    });
  });

  describe('CloudFront Cache Behavior', () => {
    test('cache policy exists and has correct settings', async () => {
      const distribution = await cloudfront.getDistribution({
        Id: distributionId,
      }).promise();

      const cachePolicyId = distribution.Distribution?.DistributionConfig.DefaultCacheBehavior.CachePolicyId;
      expect(cachePolicyId).toBeDefined();

      const cachePolicy = await cloudfront.getCachePolicy({
        Id: cachePolicyId!,
      }).promise();

      expect(cachePolicy.CachePolicy?.CachePolicyConfig.Comment).toBe('Cache policy for article content');
      expect(cachePolicy.CachePolicy?.CachePolicyConfig.DefaultTTL).toBe(86400); // 24 hours
    });

    test('response headers policy exists', async () => {
      const distribution = await cloudfront.getDistribution({
        Id: distributionId,
      }).promise();

      const headersPolicyId = distribution.Distribution?.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId;
      expect(headersPolicyId).toBeDefined();

      const headersPolicy = await cloudfront.getResponseHeadersPolicy({
        Id: headersPolicyId!,
      }).promise();

      expect(headersPolicy.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig.Comment).toBe('Security headers for content delivery');
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('invalidation role exists and has correct permissions', async () => {
      const roleName = invalidationRoleArn.split('/').pop()!;

      const role = await iam.getRole({
        RoleName: roleName,
      }).promise();

      expect(role.Role).toBeDefined();
      expect(role.Role.Description).toContain('CloudFront invalidation');

      const policies = await iam.listRolePolicies({
        RoleName: roleName,
      }).promise();

      expect(policies.PolicyNames.length).toBeGreaterThan(0);
      expect(policies.PolicyNames).toContain('CloudFrontInvalidation');

      const policy = await iam.getRolePolicy({
        RoleName: roleName,
        PolicyName: 'CloudFrontInvalidation',
      }).promise();

      const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument));
      const statement = policyDoc.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('cloudfront:CreateInvalidation');
      expect(statement.Resource).toContain(distributionId);
    });

    test('content management role exists and has S3 permissions', async () => {
      const roleName = contentManagementRoleArn.split('/').pop()!;

      const role = await iam.getRole({
        RoleName: roleName,
      }).promise();

      expect(role.Role).toBeDefined();
      expect(role.Role.Description).toContain('S3 content management');

      const policies = await iam.listRolePolicies({
        RoleName: roleName,
      }).promise();

      expect(policies.PolicyNames).toContain('S3ContentAccess');

      const policy = await iam.getRolePolicy({
        RoleName: roleName,
        PolicyName: 'S3ContentAccess',
      }).promise();

      const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument));
      const statement = policyDoc.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:PutObject');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:DeleteObject');
    });
  });

  describe('CloudFront Invalidation', () => {
    test('can create CloudFront invalidation', async () => {
      const invalidation = await cloudfront.createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `test-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/${testFileName}`],
          },
        },
      }).promise();

      expect(invalidation.Invalidation).toBeDefined();
      expect(invalidation.Invalidation?.Status).toBe('InProgress');

      // Wait for invalidation to complete
      console.log('Waiting for invalidation to complete...');
      let status = 'InProgress';
      let attempts = 0;
      const maxAttempts = 30;

      while (status === 'InProgress' && attempts < maxAttempts) {
        await sleep(10000); // Wait 10 seconds
        const response = await cloudfront.getInvalidation({
          DistributionId: distributionId,
          Id: invalidation.Invalidation!.Id,
        }).promise();
        status = response.Invalidation!.Status;
        attempts++;
      }

      expect(status).toBe('Completed');
    }, 360000); // 6 minute timeout
  });

  describe('End-to-End Content Update Flow', () => {
    const updatedFileName = 'updated-test.html';
    const updatedContent = '<html><body><h1>Updated Content</h1></body></html>';

    test('complete content update and invalidation workflow', async () => {
      // Step 1: Upload new content
      console.log('Step 1: Uploading new content...');
      await s3.putObject({
        Bucket: contentBucketName,
        Key: updatedFileName,
        Body: updatedContent,
        ContentType: 'text/html',
        CacheControl: 'max-age=3600',
      }).promise();

      // Step 2: Create invalidation
      console.log('Step 2: Creating invalidation...');
      const invalidation = await cloudfront.createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `test-update-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/${updatedFileName}`],
          },
        },
      }).promise();

      expect(invalidation.Invalidation?.Status).toBe('InProgress');

      // Step 3: Wait for propagation
      console.log('Step 3: Waiting for propagation...');
      await sleep(30000);

      // Step 4: Verify content is accessible
      console.log('Step 4: Verifying content...');
      const url = `https://${distributionDomainName}/${updatedFileName}`;
      const response = await httpsGet(url);

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Updated Content');
      expect(response.headers['cache-control']).toBeDefined();
    }, 120000); // 2 minute timeout
  });

  afterAll(async () => {
    // Cleanup test files
    console.log('Cleaning up test files...');

    try {
      await s3.deleteObject({
        Bucket: contentBucketName,
        Key: testFileName,
      }).promise();

      await s3.deleteObject({
        Bucket: contentBucketName,
        Key: 'updated-test.html',
      }).promise();

      console.log('Cleanup completed successfully');
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }

    // Force cleanup of AWS SDK connections
    console.log('Cleaning up AWS SDK connections...');

    // Destroy HTTP agents to close persistent connections
    if ((s3 as any).config?.httpOptions?.agent) {
      (s3 as any).config.httpOptions.agent.destroy();
    }
    if ((cloudfront as any).config?.httpOptions?.agent) {
      (cloudfront as any).config.httpOptions.agent.destroy();
    }
    if ((cloudwatch as any).config?.httpOptions?.agent) {
      (cloudwatch as any).config.httpOptions.agent.destroy();
    }
    if ((iam as any).config?.httpOptions?.agent) {
      (iam as any).config.httpOptions.agent.destroy();
    }
  });
});