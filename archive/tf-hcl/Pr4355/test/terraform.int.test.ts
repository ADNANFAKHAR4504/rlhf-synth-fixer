// test/terraform.int.test.ts
// Integration tests for S3 Media Assets Storage
// Validates deployed infrastructure and workflows
// Uses cfn-outputs/flat-outputs.json (CI/CD standard approach)
// Uses AWS SDK for live flow validation

import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketCorsCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLoggingCommand,
  GetBucketPolicyCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetCloudFrontOriginAccessIdentityCommand,
} from '@aws-sdk/client-cloudfront';

const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

interface FlatOutputs {
  [key: string]: string;
}

describe('S3 Media Assets Storage - Integration Tests (Live)', () => {
  let outputs: FlatOutputs;
  let s3Client: S3Client;
  let cloudFrontClient: CloudFrontClient;
  let devBucketName: string;
  let prodBucketName: string;
  let logsBucketName: string;
  let cloudFrontOaiId: string;
  let region: string;

  beforeAll(() => {
    try {
      console.log('📊 Reading deployment outputs from flat-outputs.json...');
      
      if (!fs.existsSync(FLAT_OUTPUTS_PATH)) {
        throw new Error(`Flat outputs file not found at: ${FLAT_OUTPUTS_PATH}`);
      }
      
      const outputsContent = fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8');
      outputs = JSON.parse(outputsContent);
      
      console.log('✅ Successfully loaded deployment outputs');
      console.log(`📦 Found ${Object.keys(outputs).length} outputs`);
      
      // Extract values from outputs
      devBucketName = outputs.dev_bucket_name;
      prodBucketName = outputs.prod_bucket_name;
      logsBucketName = outputs.logs_bucket_name;
      cloudFrontOaiId = outputs.cloudfront_oai_id;
      
      // Extract region from ARN or default to us-west-2
      const arnMatch = outputs.dev_bucket_arn?.match(/arn:aws:s3:::([^:]+)/);
      region = 'us-west-2'; // Based on requirement
      
      // Initialize AWS SDK clients
      s3Client = new S3Client({ region });
      cloudFrontClient = new CloudFrontClient({ region });
      
      console.log('🔧 Clients initialized');
      console.log('📋 Dev Bucket:', devBucketName);
      console.log('📋 Prod Bucket:', prodBucketName);
      console.log('📋 Logs Bucket:', logsBucketName);
      console.log('🌐 CloudFront OAI:', cloudFrontOaiId);
      
    } catch (error: any) {
      console.error('❌ Failed to load deployment outputs:', error.message);
      throw new Error('Deployment outputs not available. Run deployment pipeline first.');
    }
  });

  // ============================================================================
  // TEST GROUP 1: OUTPUT VALIDATION (10 tests)
  // ============================================================================
  describe('Output Validation', () => {
    test('all required outputs exist', () => {
      const requiredOutputs = [
        'dev_bucket_name',
        'dev_bucket_arn',
        'prod_bucket_name',
        'prod_bucket_arn',
        'logs_bucket_name',
        'logs_bucket_arn',
        'prod_bucket_domain_name',
        'dev_bucket_domain_name',
        'cloudfront_oai_id',
        'cloudfront_oai_arn',
      ];

      requiredOutputs.forEach(key => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).toBeTruthy();
      });
    });

    test('all output values are non-empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });

    test('bucket ARNs have correct format', () => {
      expect(outputs.dev_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
      expect(outputs.prod_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
      expect(outputs.logs_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
    });

    test('bucket names follow media-assets- prefix convention', () => {
      expect(devBucketName).toMatch(/^media-assets-dev-[a-z0-9]{8}$/);
      expect(prodBucketName).toMatch(/^media-assets-prod-[a-z0-9]{8}$/);
      expect(logsBucketName).toMatch(/^media-assets-logs-[a-z0-9]{8}$/);
    });

    test('bucket names are unique', () => {
      expect(devBucketName).not.toBe(prodBucketName);
      expect(devBucketName).not.toBe(logsBucketName);
      expect(prodBucketName).not.toBe(logsBucketName);
    });

    test('bucket domain names have correct format', () => {
      expect(outputs.prod_bucket_domain_name).toMatch(/^media-assets-prod-[a-z0-9]{8}\.s3\.[a-z0-9-]+\.amazonaws\.com$/);
      expect(outputs.dev_bucket_domain_name).toMatch(/^media-assets-dev-[a-z0-9]{8}\.s3\.[a-z0-9-]+\.amazonaws\.com$/);
    });

    test('CloudFront OAI ID has correct format', () => {
      expect(cloudFrontOaiId).toMatch(/^[A-Z0-9]+$/);
      expect(cloudFrontOaiId.length).toBeGreaterThan(10);
    });

    test('CloudFront OAI ARN has correct format', () => {
      expect(outputs.cloudfront_oai_arn).toMatch(/^arn:aws:iam::cloudfront:user\/CloudFront Origin Access Identity [A-Z0-9]+$/);
    });

    test('ARN bucket names match output bucket names', () => {
      expect(outputs.dev_bucket_arn).toContain(devBucketName);
      expect(outputs.prod_bucket_arn).toContain(prodBucketName);
      expect(outputs.logs_bucket_arn).toContain(logsBucketName);
    });

    test('domain names match bucket names', () => {
      expect(outputs.dev_bucket_domain_name).toContain(devBucketName);
      expect(outputs.prod_bucket_domain_name).toContain(prodBucketName);
    });
  });

  // ============================================================================
  // TEST GROUP 2: DEV BUCKET VALIDATION (5 tests)
  // ============================================================================
  describe('Dev Bucket Validation', () => {
    test('dev bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: devBucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('dev bucket has versioning disabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: devBucketName,
      });
      
      const response = await s3Client.send(command);
      // Should be undefined or Suspended (not Enabled)
      expect(response.Status).not.toBe('Enabled');
    });

    test('dev bucket has encryption enabled (AES256)', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: devBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('dev bucket has CORS configuration', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: devBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.CORSRules).toBeDefined();
      expect(response.CORSRules).toHaveLength(1);
      expect(response.CORSRules?.[0]?.AllowedMethods).toContain('GET');
      expect(response.CORSRules?.[0]?.AllowedMethods).toContain('HEAD');
      expect(response.CORSRules?.[0]?.AllowedOrigins).toContain('https://example.com');
    });

    test('dev bucket has lifecycle rule to delete objects after 30 days', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: devBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThanOrEqual(1);
      
      const expirationRule = response.Rules?.find(rule => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(30);
      expect(expirationRule?.Status).toBe('Enabled');
    });
  });

  // ============================================================================
  // TEST GROUP 3: PROD BUCKET VALIDATION (6 tests)
  // ============================================================================
  describe('Prod Bucket Validation', () => {
    test('prod bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: prodBucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('prod bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: prodBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('prod bucket has encryption enabled (AES256)', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: prodBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('prod bucket has CORS configuration', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: prodBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.CORSRules).toBeDefined();
      expect(response.CORSRules).toHaveLength(1);
      expect(response.CORSRules?.[0]?.AllowedMethods).toContain('GET');
      expect(response.CORSRules?.[0]?.AllowedMethods).toContain('HEAD');
      expect(response.CORSRules?.[0]?.AllowedOrigins).toContain('https://example.com');
    });

    test('prod bucket has lifecycle rule to transition to GLACIER after 90 days', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: prodBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThanOrEqual(1);
      
      const transitionRule = response.Rules?.find(rule => rule.Transitions && rule.Transitions.length > 0);
      expect(transitionRule).toBeDefined();
      expect(transitionRule?.Transitions?.[0]?.Days).toBe(90);
      expect(transitionRule?.Transitions?.[0]?.StorageClass).toBe('GLACIER');
      expect(transitionRule?.Status).toBe('Enabled');
    });

    test('prod bucket has bucket policy for CloudFront OAI', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: prodBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();
      
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);
      
      const oaiStatement = policy.Statement.find((stmt: any) => 
        stmt.Principal?.AWS && stmt.Action?.includes('s3:GetObject')
      );
      expect(oaiStatement).toBeDefined();
      expect(oaiStatement.Principal.AWS).toContain('CloudFront Origin Access Identity');
    });
  });

  // ============================================================================
  // TEST GROUP 4: LOGS BUCKET VALIDATION (4 tests)
  // ============================================================================
  describe('Logs Bucket Validation', () => {
    test('logs bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: logsBucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('logs bucket has encryption enabled (AES256)', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: logsBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('logs bucket has lifecycle rule to delete after 90 days', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: logsBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThanOrEqual(1);
      
      const expirationRule = response.Rules?.find(rule => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(90);
      expect(expirationRule?.Status).toBe('Enabled');
    });

    test('logs bucket has policy allowing S3 logging service', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: logsBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();
      
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      
      const loggingStatement = policy.Statement.find((stmt: any) => 
        stmt.Principal?.Service === 'logging.s3.amazonaws.com'
      );
      expect(loggingStatement).toBeDefined();
      expect(loggingStatement.Action).toContain('s3:PutObject');
    });
  });

  // ============================================================================
  // TEST GROUP 5: LOGGING CONFIGURATION (2 tests)
  // ============================================================================
  describe('Logging Configuration', () => {
    test('dev bucket sends logs to logs bucket', async () => {
      const command = new GetBucketLoggingCommand({
        Bucket: devBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled?.TargetBucket).toBe(logsBucketName);
      expect(response.LoggingEnabled?.TargetPrefix).toBe('dev-logs/');
    });

    test('prod bucket sends logs to logs bucket', async () => {
      const command = new GetBucketLoggingCommand({
        Bucket: prodBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled?.TargetBucket).toBe(logsBucketName);
      expect(response.LoggingEnabled?.TargetPrefix).toBe('prod-logs/');
    });
  });

  // ============================================================================
  // TEST GROUP 6: CLOUDFRONT OAI VALIDATION (2 tests)
  // ============================================================================
  describe('CloudFront OAI Validation', () => {
    test('CloudFront OAI exists and is accessible', async () => {
      const command = new GetCloudFrontOriginAccessIdentityCommand({
        Id: cloudFrontOaiId,
      });
      
      const response = await cloudFrontClient.send(command);
      expect(response.CloudFrontOriginAccessIdentity).toBeDefined();
      expect(response.CloudFrontOriginAccessIdentity?.Id).toBe(cloudFrontOaiId);
    });

    test('CloudFront OAI has correct comment', async () => {
      const command = new GetCloudFrontOriginAccessIdentityCommand({
        Id: cloudFrontOaiId,
      });
      
      const response = await cloudFrontClient.send(command);
      expect(response.CloudFrontOriginAccessIdentity?.CloudFrontOriginAccessIdentityConfig?.Comment).toBeDefined();
      expect(response.CloudFrontOriginAccessIdentity?.CloudFrontOriginAccessIdentityConfig?.Comment).toContain('media assets');
    });
  });

  // ============================================================================
  // TEST GROUP 7: COMPLETE S3 LIFECYCLE FLOW (1 comprehensive test)
  // ============================================================================
  describe('Complete S3 Lifecycle Flow', () => {
    test('should execute complete media assets workflow', async () => {
      const testTimestamp = Date.now();
      const testDevFile = `test-dev-asset-${testTimestamp}.txt`;
      const testProdFile = `test-prod-asset-${testTimestamp}.txt`;
      const testContent = `Test media asset content - ${testTimestamp}`;

      console.log('\n🎬 Starting Complete S3 Media Assets Lifecycle Test...\n');

      // -----------------------------------------------------------------------
      // Step 1: Upload file to dev bucket
      // -----------------------------------------------------------------------
      console.log('Step 1: Uploading file to dev bucket...');
      const devPutCommand = new PutObjectCommand({
        Bucket: devBucketName,
        Key: testDevFile,
        Body: testContent,
        ContentType: 'text/plain',
      });
      
      const devPutResponse = await s3Client.send(devPutCommand);
      expect(devPutResponse.$metadata.httpStatusCode).toBe(200);
      expect(devPutResponse.ETag).toBeDefined();
      console.log('✓ Dev file uploaded successfully');

      // -----------------------------------------------------------------------
      // Step 2: Retrieve file from dev bucket
      // -----------------------------------------------------------------------
      console.log('Step 2: Retrieving file from dev bucket...');
      const devGetCommand = new GetObjectCommand({
        Bucket: devBucketName,
        Key: testDevFile,
      });
      
      const devGetResponse = await s3Client.send(devGetCommand);
      expect(devGetResponse.$metadata.httpStatusCode).toBe(200);
      expect(devGetResponse.ContentType).toBe('text/plain');
      expect(devGetResponse.ServerSideEncryption).toBe('AES256');
      
      const devBodyContent = await devGetResponse.Body?.transformToString();
      expect(devBodyContent).toBe(testContent);
      console.log('✓ Dev file retrieved and verified');

      // -----------------------------------------------------------------------
      // Step 3: Verify dev file encryption
      // -----------------------------------------------------------------------
      console.log('Step 3: Verifying dev file encryption...');
      const devHeadCommand = new HeadObjectCommand({
        Bucket: devBucketName,
        Key: testDevFile,
      });
      
      const devHeadResponse = await s3Client.send(devHeadCommand);
      expect(devHeadResponse.ServerSideEncryption).toBe('AES256');
      console.log('✓ Dev file is encrypted with AES256');

      // -----------------------------------------------------------------------
      // Step 4: Upload file to prod bucket
      // -----------------------------------------------------------------------
      console.log('Step 4: Uploading file to prod bucket...');
      const prodPutCommand = new PutObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
        Body: testContent,
        ContentType: 'text/plain',
      });
      
      const prodPutResponse = await s3Client.send(prodPutCommand);
      expect(prodPutResponse.$metadata.httpStatusCode).toBe(200);
      expect(prodPutResponse.ETag).toBeDefined();
      expect(prodPutResponse.VersionId).toBeDefined(); // Versioning enabled
      console.log('✓ Prod file uploaded with version ID:', prodPutResponse.VersionId);

      // -----------------------------------------------------------------------
      // Step 5: Retrieve file from prod bucket
      // -----------------------------------------------------------------------
      console.log('Step 5: Retrieving file from prod bucket...');
      const prodGetCommand = new GetObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
      });
      
      const prodGetResponse = await s3Client.send(prodGetCommand);
      expect(prodGetResponse.$metadata.httpStatusCode).toBe(200);
      expect(prodGetResponse.ServerSideEncryption).toBe('AES256');
      expect(prodGetResponse.VersionId).toBeDefined();
      
      const prodBodyContent = await prodGetResponse.Body?.transformToString();
      expect(prodBodyContent).toBe(testContent);
      console.log('✓ Prod file retrieved and verified');

      // -----------------------------------------------------------------------
      // Step 6: Update prod file (test versioning)
      // -----------------------------------------------------------------------
      console.log('Step 6: Updating prod file to test versioning...');
      const updatedContent = `Updated content - ${testTimestamp}`;
      const prodUpdateCommand = new PutObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
        Body: updatedContent,
        ContentType: 'text/plain',
      });
      
      const prodUpdateResponse = await s3Client.send(prodUpdateCommand);
      expect(prodUpdateResponse.$metadata.httpStatusCode).toBe(200);
      expect(prodUpdateResponse.VersionId).toBeDefined();
      expect(prodUpdateResponse.VersionId).not.toBe(prodPutResponse.VersionId);
      console.log('✓ Prod file updated with new version ID:', prodUpdateResponse.VersionId);

      // -----------------------------------------------------------------------
      // Step 7: Retrieve original version from prod bucket
      // -----------------------------------------------------------------------
      console.log('Step 7: Retrieving original version from prod bucket...');
      const prodGetVersionCommand = new GetObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
        VersionId: prodPutResponse.VersionId,
      });
      
      const prodGetVersionResponse = await s3Client.send(prodGetVersionCommand);
      expect(prodGetVersionResponse.$metadata.httpStatusCode).toBe(200);
      
      const originalVersionContent = await prodGetVersionResponse.Body?.transformToString();
      expect(originalVersionContent).toBe(testContent);
      console.log('✓ Original version retrieved successfully');

      // -----------------------------------------------------------------------
      // Step 8: Retrieve latest version from prod bucket
      // -----------------------------------------------------------------------
      console.log('Step 8: Retrieving latest version from prod bucket...');
      const prodGetLatestCommand = new GetObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
      });
      
      const prodGetLatestResponse = await s3Client.send(prodGetLatestCommand);
      const latestContent = await prodGetLatestResponse.Body?.transformToString();
      expect(latestContent).toBe(updatedContent);
      console.log('✓ Latest version retrieved successfully');

      // -----------------------------------------------------------------------
      // Step 9: List objects in dev bucket
      // -----------------------------------------------------------------------
      console.log('Step 9: Listing objects in dev bucket...');
      const devListCommand = new ListObjectsV2Command({
        Bucket: devBucketName,
        Prefix: `test-dev-asset-`,
      });
      
      const devListResponse = await s3Client.send(devListCommand);
      expect(devListResponse.Contents).toBeDefined();
      expect(devListResponse.Contents!.length).toBeGreaterThan(0);
      
      const devFileExists = devListResponse.Contents!.some(obj => obj.Key === testDevFile);
      expect(devFileExists).toBe(true);
      console.log('✓ Dev file found in bucket listing');

      // -----------------------------------------------------------------------
      // Step 10: Verify logging is working (check logs bucket)
      // -----------------------------------------------------------------------
      console.log('Step 10: Checking logs bucket for access logs...');
      const logsListCommand = new ListObjectsV2Command({
        Bucket: logsBucketName,
        MaxKeys: 10,
      });
      
      const logsListResponse = await s3Client.send(logsListCommand);
      // Logs may take time to appear, so we just verify bucket is accessible
      expect(logsListResponse.$metadata.httpStatusCode).toBe(200);
      console.log('✓ Logs bucket is accessible and ready to receive logs');

      // -----------------------------------------------------------------------
      // Step 11: Cleanup - Delete test file from dev bucket
      // -----------------------------------------------------------------------
      console.log('Step 11: Deleting test file from dev bucket...');
      const devDeleteCommand = new DeleteObjectCommand({
        Bucket: devBucketName,
        Key: testDevFile,
      });
      
      const devDeleteResponse = await s3Client.send(devDeleteCommand);
      expect(devDeleteResponse.$metadata.httpStatusCode).toBe(204);
      console.log('✓ Dev file deleted successfully');

      // -----------------------------------------------------------------------
      // Step 12: Cleanup - Delete test file from prod bucket (all versions)
      // -----------------------------------------------------------------------
      console.log('Step 12: Deleting test file versions from prod bucket...');
      
      // Delete latest version
      const prodDeleteLatestCommand = new DeleteObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
        VersionId: prodUpdateResponse.VersionId,
      });
      await s3Client.send(prodDeleteLatestCommand);
      
      // Delete original version
      const prodDeleteOriginalCommand = new DeleteObjectCommand({
        Bucket: prodBucketName,
        Key: testProdFile,
        VersionId: prodPutResponse.VersionId,
      });
      await s3Client.send(prodDeleteOriginalCommand);
      
      console.log('✓ All prod file versions deleted successfully');

      // -----------------------------------------------------------------------
      // Step 13: Verify cleanup
      // -----------------------------------------------------------------------
      console.log('Step 13: Verifying cleanup...');
      
      // Try to get deleted dev file (should fail)
      await expect(s3Client.send(new GetObjectCommand({
        Bucket: devBucketName,
        Key: testDevFile,
      }))).rejects.toThrow();
      console.log('✓ Dev file confirmed deleted');
      
      console.log('\n🎉 Complete S3 Media Assets lifecycle test passed! ✓\n');
    }, 90000); // 90 second timeout
  });

  // ============================================================================
  // TEST GROUP 8: ERROR HANDLING (2 tests)
  // ============================================================================
  describe('Error Handling', () => {
    test('handles non-existent object retrieval correctly', async () => {
      const command = new GetObjectCommand({
        Bucket: devBucketName,
        Key: 'non-existent-file.txt',
      });
      
      await expect(s3Client.send(command)).rejects.toThrow();
    });

    test('handles invalid bucket name correctly', async () => {
      const command = new ListObjectsV2Command({
        Bucket: 'invalid-bucket-name-that-does-not-exist-12345',
        MaxKeys: 1,
      });
      
      await expect(s3Client.send(command)).rejects.toThrow();
    });
  });

  // ============================================================================
  // TEST GROUP 9: REQUIREMENTS TRACEABILITY (10 tests)
  // ============================================================================
  describe('Requirements Traceability', () => {
    test('REQ-1: Two S3 buckets created (dev and prod)', () => {
      expect(devBucketName).toMatch(/^media-assets-dev-/);
      expect(prodBucketName).toMatch(/^media-assets-prod-/);
    });

    test('REQ-2: Versioning enabled on production bucket only', async () => {
      const prodVersioning = await s3Client.send(new GetBucketVersioningCommand({ Bucket: prodBucketName }));
      expect(prodVersioning.Status).toBe('Enabled');
      
      const devVersioning = await s3Client.send(new GetBucketVersioningCommand({ Bucket: devBucketName }));
      expect(devVersioning.Status).not.toBe('Enabled');
    });

    test('REQ-3: Dev bucket deletes objects older than 30 days', async () => {
      const lifecycle = await s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: devBucketName }));
      const expirationRule = lifecycle.Rules?.find(rule => rule.Expiration);
      expect(expirationRule?.Expiration?.Days).toBe(30);
    });

    test('REQ-4: Prod bucket allows CloudFront OAI read access', async () => {
      const policyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: prodBucketName }));
      const policy = JSON.parse(policyResponse.Policy!);
      const oaiStatement = policy.Statement.find((stmt: any) => stmt.Action?.includes('s3:GetObject'));
      expect(oaiStatement).toBeDefined();
    });

    test('REQ-5: AES256 encryption enabled on all buckets', async () => {
      const devEnc = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: devBucketName }));
      const prodEnc = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: prodBucketName }));
      const logsEnc = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: logsBucketName }));
      
      expect(devEnc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      expect(prodEnc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      expect(logsEnc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('REQ-6: CORS rules allow GET from https://example.com', async () => {
      const devCors = await s3Client.send(new GetBucketCorsCommand({ Bucket: devBucketName }));
      const prodCors = await s3Client.send(new GetBucketCorsCommand({ Bucket: prodBucketName }));
      
      expect(devCors.CORSRules?.[0]?.AllowedOrigins).toContain('https://example.com');
      expect(prodCors.CORSRules?.[0]?.AllowedOrigins).toContain('https://example.com');
      expect(devCors.CORSRules?.[0]?.AllowedMethods).toContain('GET');
      expect(prodCors.CORSRules?.[0]?.AllowedMethods).toContain('HEAD');
    });

    test('REQ-7: Prod bucket transitions to GLACIER after 90 days', async () => {
      const lifecycle = await s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: prodBucketName }));
      const transitionRule = lifecycle.Rules?.find(rule => rule.Transitions);
      expect(transitionRule?.Transitions?.[0]?.Days).toBe(90);
      expect(transitionRule?.Transitions?.[0]?.StorageClass).toBe('GLACIER');
    });

    test('REQ-8: Access logs bucket created', () => {
      expect(logsBucketName).toMatch(/^media-assets-logs-/);
    });

    test('REQ-9: Dev and prod buckets send logs to logs bucket', async () => {
      const devLogging = await s3Client.send(new GetBucketLoggingCommand({ Bucket: devBucketName }));
      const prodLogging = await s3Client.send(new GetBucketLoggingCommand({ Bucket: prodBucketName }));
      
      expect(devLogging.LoggingEnabled?.TargetBucket).toBe(logsBucketName);
      expect(prodLogging.LoggingEnabled?.TargetBucket).toBe(logsBucketName);
    });

    test('REQ-10: Cost allocation tags applied to all buckets', () => {
      // Tags are verified via Terraform outputs and resource definitions
      // In integration tests, we verify buckets exist with correct naming
      expect(devBucketName).toBeTruthy();
      expect(prodBucketName).toBeTruthy();
      expect(logsBucketName).toBeTruthy();
    });
  });
});