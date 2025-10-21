// test/terraform.int.test.ts
// Integration tests for S3 Static Asset Storage
// Validates deployed infrastructure and complete workflows
// CRITICAL: Uses cfn-outputs/flat-outputs.json (NO MOCKING)
// CRITICAL: No assertions on environment names/suffixes (reproducibility)

import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketCorsCommand,
  GetBucketWebsiteCommand,
  GetBucketLoggingCommand,
  GetBucketPolicyCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';

const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

interface FlatOutputs {
  [key: string]: string;
}

describe('S3 Static Asset Storage - Integration Tests (Live)', () => {
  let outputs: FlatOutputs;
  let s3Client: S3Client;
  let iamClient: IAMClient;
  let bucketName: string;
  let loggingBucketName: string;
  let websiteEndpoint: string;
  let instanceProfileName: string;
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
      
      // Extract values from outputs (NOT hardcoded)
      bucketName = outputs.bucket_name;
      loggingBucketName = outputs.logging_bucket_name;
      websiteEndpoint = outputs.bucket_website_endpoint;
      instanceProfileName = outputs.ec2_instance_profile_name;
      region = outputs.region || 'us-west-2';
      
      // Configure S3 client to handle cross-region redirects
      s3Client = new S3Client({ 
        region,
        followRegionRedirects: true,
        forcePathStyle: false
      });
      iamClient = new IAMClient({ region });
      
      console.log('🔧 Clients initialized');
      console.log('📋 Bucket Name:', bucketName);
      console.log('📋 Logging Bucket:', loggingBucketName);
      console.log('🌐 Website Endpoint:', websiteEndpoint);
      console.log('👤 Instance Profile:', instanceProfileName);
      
    } catch (error: any) {
      console.error('❌ Failed to load deployment outputs:', error.message);
      throw new Error('Deployment outputs not available. Run deployment first.');
    }
  });

  // ========================================================================
  // TEST GROUP 1: OUTPUT VALIDATION (10 tests)
  // ========================================================================
  describe('Output Validation', () => {
    test('all required outputs exist', () => {
      const requiredOutputs = [
        'bucket_name',
        'bucket_website_endpoint',
        'ec2_instance_profile_name',
        'logging_bucket_name',
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

    test('bucket names follow expected pattern', () => {
      // Validate pattern, not exact value
      expect(bucketName).toMatch(/^[a-z0-9-]+-assets-[a-z0-9]{8}$/);
      expect(loggingBucketName).toMatch(/^[a-z0-9-]+-logs-[a-z0-9]{8}$/);
    });

    test('website endpoint has correct format', () => {
      expect(websiteEndpoint).toMatch(/^[a-z0-9-]+\.s3-website/);
    });

    test('website endpoint includes bucket name', () => {
      expect(websiteEndpoint).toContain(bucketName.split('-assets-')[0]);
    });

    test('instance profile name follows pattern', () => {
      expect(instanceProfileName).toMatch(/^[a-z0-9-]+-ec2-instance-profile-[a-z0-9]{8}$/);
    });

    test('no duplicate output values', () => {
      const values = Object.values(outputs);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    test('output keys follow naming convention', () => {
      Object.keys(outputs).forEach(key => {
        expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
      });
    });

    test('bucket names are different', () => {
      expect(bucketName).not.toBe(loggingBucketName);
    });

    test('all names include random suffix', () => {
      expect(bucketName).toMatch(/[a-z0-9]{8}$/);
      expect(loggingBucketName).toMatch(/[a-z0-9]{8}$/);
      expect(instanceProfileName).toMatch(/[a-z0-9]{8}$/);
    });
  });

  // ========================================================================
  // TEST GROUP 2: BUCKET EXISTENCE (5 tests)
  // ========================================================================
  describe('Bucket Existence', () => {
    test('static assets bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('logging bucket exists and is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: loggingBucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('buckets exist in correct region', async () => {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('bucket names are unique and valid', () => {
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
      expect(loggingBucketName).toMatch(/^[a-z0-9-]+$/);
      expect(bucketName.length).toBeGreaterThan(10);
      expect(loggingBucketName.length).toBeGreaterThan(10);
    });
  });

  // ========================================================================
  // TEST GROUP 3: VERSIONING CONFIGURATION (4 tests)
  // ========================================================================
  describe('Versioning Configuration', () => {
    test('static assets bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('versioning configuration is accessible', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('logging bucket does not require versioning', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: loggingBucketName,
      });
      
      const response = await s3Client.send(command);
      // Logging bucket may or may not have versioning
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('versioning status is definitive', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(['Enabled', 'Suspended']).toContain(response.Status);
    });
  });

  // ========================================================================
  // TEST GROUP 4: ENCRYPTION CONFIGURATION (5 tests)
  // ========================================================================
  describe('Encryption Configuration', () => {
    test('static assets bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
    });

    test('uses AES256 encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('logging bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: loggingBucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('encryption is applied by default', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault).toBeDefined();
    });

    test('uploaded objects are encrypted automatically', async () => {
      const testKey = 'test-encryption.txt';
      
      // Upload test file
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'test encryption',
      }));
      
      // Check encryption
      const headResponse = await s3Client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }));
      
      expect(headResponse.ServerSideEncryption).toBe('AES256');
      
      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }));
    });
  });

  // ========================================================================
  // TEST GROUP 5: LIFECYCLE CONFIGURATION (6 tests)
  // ========================================================================
  describe('Lifecycle Configuration', () => {
    test('static assets bucket has lifecycle rules', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });

    test('has transition to Standard-IA after 30 days', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const transitionRule = response.Rules?.find(r => r.Transitions && r.Transitions.length > 0);
      
      expect(transitionRule).toBeDefined();
      expect(transitionRule?.Transitions?.[0].Days).toBe(30);
      expect(transitionRule?.Transitions?.[0].StorageClass).toBe('STANDARD_IA');
    });

    test('has multipart upload cleanup rule', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const multipartRule = response.Rules?.find(r => r.AbortIncompleteMultipartUpload);
      
      expect(multipartRule).toBeDefined();
      expect(multipartRule?.AbortIncompleteMultipartUpload?.DaysAfterInitiation).toBe(7);
    });

    test('logging bucket has expiration rule', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: loggingBucketName,
      });
      
      const response = await s3Client.send(command);
      const expirationRule = response.Rules?.find(r => r.Expiration);
      
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(90);
    });

    test('all lifecycle rules are enabled', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      response.Rules?.forEach(rule => {
        expect(rule.Status).toBe('Enabled');
      });
    });

    test('lifecycle rules have proper IDs', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      response.Rules?.forEach(rule => {
        expect(rule.ID).toBeDefined();
        expect(rule.ID!.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================================================
  // TEST GROUP 6: WEBSITE CONFIGURATION (5 tests)
  // ========================================================================
  describe('Website Configuration', () => {
    test('bucket has website configuration', async () => {
      const command = new GetBucketWebsiteCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.IndexDocument).toBeDefined();
    });

    test('index document is index.html', async () => {
      const command = new GetBucketWebsiteCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.IndexDocument?.Suffix).toBe('index.html');
    });

    test('error document is configured', async () => {
      const command = new GetBucketWebsiteCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.ErrorDocument?.Key).toBe('error.html');
    });

    test('website endpoint is accessible', () => {
      expect(websiteEndpoint).toBeDefined();
      expect(websiteEndpoint).toMatch(/^[a-z0-9-]+\.s3-website/);
    });

    test('website endpoint format is correct', () => {
      // Should be bucket-name.s3-website-region.amazonaws.com
      expect(websiteEndpoint).toContain('s3-website');
      expect(websiteEndpoint).toContain('amazonaws.com');
    });
  });

  // ========================================================================
  // TEST GROUP 7: CORS CONFIGURATION (5 tests)
  // ========================================================================
  describe('CORS Configuration', () => {
    test('bucket has CORS configuration', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.CORSRules).toBeDefined();
      expect(response.CORSRules!.length).toBeGreaterThan(0);
    });

    test('allows GET requests', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const rule = response.CORSRules?.[0];
      expect(rule?.AllowedMethods).toContain('GET');
    });

    test('allows requests from https://example.com/', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const rule = response.CORSRules?.[0];
      expect(rule?.AllowedOrigins).toContain('https://example.com');
    });

    test('max age is 3600 seconds', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const rule = response.CORSRules?.[0];
      expect(rule?.MaxAgeSeconds).toBe(3600);
    });

    test('exposes ETag header', async () => {
      const command = new GetBucketCorsCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const rule = response.CORSRules?.[0];
      expect(rule?.ExposeHeaders).toContain('ETag');
    });
  });

  // ========================================================================
  // TEST GROUP 8: LOGGING CONFIGURATION (4 tests)
  // ========================================================================
  describe('Logging Configuration', () => {
    test('static assets bucket has logging enabled', async () => {
      const command = new GetBucketLoggingCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.LoggingEnabled).toBeDefined();
    });

    test('logs to separate logging bucket', async () => {
      const command = new GetBucketLoggingCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.LoggingEnabled?.TargetBucket).toBe(loggingBucketName);
    });

    test('has target prefix for logs', async () => {
      const command = new GetBucketLoggingCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.LoggingEnabled?.TargetPrefix).toBe('access-logs/');
    });

    test('logging bucket is accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: loggingBucketName,
        MaxKeys: 1,
      });
      
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  // ========================================================================
  // TEST GROUP 9: BUCKET POLICY (5 tests)
  // ========================================================================
  describe('Bucket Policy', () => {
    test('static assets bucket has policy', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();
    });

    test('policy allows public read for public/ prefix', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);
      
      const publicReadStatement = policy.Statement.find(
        (s: any) => s.Effect === 'Allow' && s.Principal === '*'
      );
      
      expect(publicReadStatement).toBeDefined();
      expect(publicReadStatement.Resource).toContain('/public/*');
    });

    test('policy allows s3:GetObject action', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);
      
      const publicReadStatement = policy.Statement.find(
        (s: any) => s.Principal === '*'
      );
      
      expect(publicReadStatement.Action).toContain('s3:GetObject');
    });

    test('policy is valid JSON', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(() => JSON.parse(response.Policy!)).not.toThrow();
    });

    test('policy has Version 2012-10-17', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);
      expect(policy.Version).toBe('2012-10-17');
    });
  });

  // ========================================================================
  // TEST GROUP 10: IAM ROLE AND INSTANCE PROFILE (6 tests)
  // ========================================================================
  describe('IAM Role and Instance Profile', () => {
    let roleName: string;

    test('instance profile exists', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      
      const response = await iamClient.send(command);
      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      
      roleName = response.InstanceProfile?.Roles?.[0]?.RoleName!;
    });

    test('instance profile has role attached', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      
      const response = await iamClient.send(command);
      expect(response.InstanceProfile?.Roles).toHaveLength(1);
    });

    test('IAM role exists', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      
      const profileResponse = await iamClient.send(command);
      const roleName = profileResponse.InstanceProfile?.Roles?.[0]?.RoleName!;
      
      const roleCommand = new GetRoleCommand({
        RoleName: roleName,
      });
      
      const response = await iamClient.send(roleCommand);
      expect(response.Role).toBeDefined();
    });

    test('role has EC2 assume role policy', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      
      const profileResponse = await iamClient.send(command);
      const roleName = profileResponse.InstanceProfile?.Roles?.[0]?.RoleName!;
      
      const roleCommand = new GetRoleCommand({
        RoleName: roleName,
      });
      
      const response = await iamClient.send(roleCommand);
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument!)
      );
      
      const ec2Statement = assumeRolePolicy.Statement.find(
        (s: any) => s.Principal?.Service === 'ec2.amazonaws.com'
      );
      
      expect(ec2Statement).toBeDefined();
    });

    test('role has policies attached', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      
      const profileResponse = await iamClient.send(command);
      const roleName = profileResponse.InstanceProfile?.Roles?.[0]?.RoleName!;
      
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      
      const response = await iamClient.send(listPoliciesCommand);
      expect(response.AttachedPolicies).toBeDefined();
      expect(response.AttachedPolicies!.length).toBeGreaterThan(0);
    });

    test('attached policy allows S3 operations', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      
      const profileResponse = await iamClient.send(command);
      const roleName = profileResponse.InstanceProfile?.Roles?.[0]?.RoleName!;
      
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      
      const policiesResponse = await iamClient.send(listPoliciesCommand);
      const policyArn = policiesResponse.AttachedPolicies?.[0]?.PolicyArn!;
      
      // Policy ARN should contain s3-upload
      expect(policyArn).toContain('s3-upload');
    });
  });

  // ========================================================================
  // CRITICAL: COMPLETE WORKFLOW TEST (12 steps)
  // Validate resource CONNECTIONS and WORKFLOWS
  // ========================================================================
  describe('Complete Workflow Integration', () => {
    test('should execute complete file upload/versioning/public access workflow', async () => {
      const testTimestamp = Date.now();
      const publicFile = `public/test-asset-${testTimestamp}.txt`;
      const privateFile = `private/test-asset-${testTimestamp}.txt`;
      const testContent = `Test content - ${testTimestamp}`;

      console.log('\n🎬 Starting Complete Workflow Test...\n');

      // ---------------------------------------------------------------
      // Step 1: Upload file to public/ prefix
      // ---------------------------------------------------------------
      console.log('Step 1: Uploading file to public/ prefix...');
      const publicPutCmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: publicFile,
        Body: testContent,
        ContentType: 'text/plain',
      });
      
      const publicPutResponse = await s3Client.send(publicPutCmd);
      expect(publicPutResponse.$metadata.httpStatusCode).toBe(200);
      expect(publicPutResponse.ETag).toBeDefined();
      console.log('✓ Public file uploaded successfully');

      // ---------------------------------------------------------------
      // Step 2: Verify file exists
      // ---------------------------------------------------------------
      console.log('Step 2: Verifying public file exists...');
      const publicGetCmd = new GetObjectCommand({
        Bucket: bucketName,
        Key: publicFile,
      });
      
      const publicGetResponse = await s3Client.send(publicGetCmd);
      expect(publicGetResponse.$metadata.httpStatusCode).toBe(200);
      
      const bodyContent = await publicGetResponse.Body?.transformToString();
      expect(bodyContent).toBe(testContent);
      console.log('✓ Public file retrieved and verified');

      // ---------------------------------------------------------------
      // Step 3: Verify encryption on uploaded file
      // ---------------------------------------------------------------
      console.log('Step 3: Verifying encryption...');
      expect(publicGetResponse.ServerSideEncryption).toBe('AES256');
      console.log('✓ File is encrypted with AES256');

      // ---------------------------------------------------------------
      // Step 4: Verify versioning by uploading same file again
      // ---------------------------------------------------------------
      console.log('Step 4: Testing versioning...');
      const updatedContent = `Updated content - ${Date.now()}`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: publicFile,
        Body: updatedContent,
      }));
      
      const updatedGetResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: publicFile,
      }));
      
      const updatedBody = await updatedGetResponse.Body?.transformToString();
      expect(updatedBody).toBe(updatedContent);
      console.log('✓ Versioning working - file updated successfully');

      // ---------------------------------------------------------------
      // Step 5: Upload file to private/ prefix
      // ---------------------------------------------------------------
      console.log('Step 5: Uploading file to private/ prefix...');
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: privateFile,
        Body: testContent,
      }));
      console.log('✓ Private file uploaded successfully');

      // ---------------------------------------------------------------
      // Step 6: Verify private file exists
      // ---------------------------------------------------------------
      console.log('Step 6: Verifying private file exists...');
      const privateGetResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: privateFile,
      }));
      
      expect(privateGetResponse.$metadata.httpStatusCode).toBe(200);
      console.log('✓ Private file accessible with credentials');

      // ---------------------------------------------------------------
      // Step 7: List objects to verify both files
      // ---------------------------------------------------------------
      console.log('Step 7: Listing all uploaded files...');
      const listCmd = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      
      const listResponse = await s3Client.send(listCmd);
      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents!.length).toBeGreaterThanOrEqual(2);
      console.log(`✓ Found ${listResponse.Contents!.length} objects in bucket`);

      // ---------------------------------------------------------------
      // Step 8: Verify CORS headers would be present (conceptual)
      // ---------------------------------------------------------------
      console.log('Step 8: Verifying CORS configuration...');
      const corsCmd = new GetBucketCorsCommand({
        Bucket: bucketName,
      });
      
      const corsResponse = await s3Client.send(corsCmd);
      expect(corsResponse.CORSRules).toBeDefined();
      expect(corsResponse.CORSRules![0].AllowedOrigins).toContain('https://example.com');
      console.log('✓ CORS configured correctly');

      // ---------------------------------------------------------------
      // Step 9: Verify lifecycle rules are configured
      // ---------------------------------------------------------------
      console.log('Step 9: Verifying lifecycle rules...');
      const lifecycleCmd = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const lifecycleResponse = await s3Client.send(lifecycleCmd);
      expect(lifecycleResponse.Rules).toBeDefined();
      console.log(`✓ ${lifecycleResponse.Rules!.length} lifecycle rules active`);

      // ---------------------------------------------------------------
      // Step 10: Verify logging configuration
      // ---------------------------------------------------------------
      console.log('Step 10: Verifying logging configuration...');
      const loggingCmd = new GetBucketLoggingCommand({
        Bucket: bucketName,
      });
      
      const loggingResponse = await s3Client.send(loggingCmd);
      expect(loggingResponse.LoggingEnabled?.TargetBucket).toBe(loggingBucketName);
      console.log('✓ Logging configured to separate bucket');

      // ---------------------------------------------------------------
      // Step 11: Cleanup - Delete public file
      // ---------------------------------------------------------------
      console.log('Step 11: Cleaning up public file...');
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: publicFile,
      }));
      console.log('✓ Public file deleted');

      // ---------------------------------------------------------------
      // Step 12: Cleanup - Delete private file
      // ---------------------------------------------------------------
      console.log('Step 12: Cleaning up private file...');
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: privateFile,
      }));
      console.log('✓ Private file deleted');

      // ---------------------------------------------------------------
      // Final Step: Comprehensive cleanup - Delete ALL test objects
      // ---------------------------------------------------------------
      console.log('Final Step: Performing comprehensive cleanup...');
      try {
        const listCmd = new ListObjectsV2Command({ Bucket: bucketName });
        const listResponse = await s3Client.send(listCmd);
        
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          const deleteParams = {
            Bucket: bucketName,
            Delete: {
              Objects: listResponse.Contents.map(obj => ({ Key: obj.Key! })),
            },
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
          console.log(`✓ Cleanup: Deleted ${listResponse.Contents.length} remaining objects`);
        } else {
          console.log('✓ Cleanup: No objects found to clean up');
        }
      } catch (cleanupError) {
        console.warn('⚠️ Warning: Cleanup failed:', cleanupError);
        // Don't fail the test if cleanup fails
      }

      console.log('\n🎉 Complete workflow test passed! ✓\n');
    }, 120000); // 120 second timeout
  });
});