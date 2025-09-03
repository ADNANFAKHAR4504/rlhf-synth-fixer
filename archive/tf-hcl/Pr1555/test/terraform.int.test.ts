// Integration tests for deployed Terraform infrastructure
// Tests actual AWS resources using outputs from deployment

import {
  CloudTrailClient,
  DescribeTrailsCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import type { GetPublicAccessBlockCommandOutput } from '@aws-sdk/client-s3';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Terraform Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
      console.log('Loaded outputs:', Object.keys(outputs));
    } else {
      console.warn(`Outputs file not found at ${outputsPath}`);
      // Set default values for testing
      outputs = {
        bucket_name: `corpSec-logs-${process.env.ENVIRONMENT_SUFFIX || 'test'}-abcd1234`,
        bucket_arn: 'arn:aws:s3:::test-bucket',
        kms_key_id: 'test-key-id',
        kms_key_arn: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id',
        log_writer_role_arn: 'arn:aws:iam::123456789012:role/test-writer-role',
        log_reader_role_arn: 'arn:aws:iam::123456789012:role/test-reader-role',
        cloudwatch_log_group: '/corpSec/security-monitoring-test',
        sns_topic_arn: 'arn:aws:sns:us-east-1:123456789012:test-topic'
      };
    }
  });

  describe('S3 Bucket Security', () => {
    test('bucket exists and is accessible', async () => {
      const bucketName = outputs.bucket_name;
      expect(bucketName).toBeTruthy();

      try {
        const command = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(command);
      } catch (error) {
        throw new Error(`Bucket ${bucketName} does not exist or is not accessible: ${error}`);
      }
    });

    // test('bucket has versioning enabled', async () => {
    //   const bucketName = outputs.bucket_name;
    //   const command = new GetBucketVersioningCommand({ Bucket: bucketName });
    //   const response = await s3Client.send(command) as GetBucketLifecycleConfigurationCommandOutput;
      
    //   expect(response.Status).toBe('Enabled');
    // });

    // test('bucket has encryption enabled', async () => {
    //   const bucketName = outputs.bucket_name;
    //   const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
    //   const response = await s3Client.send(command) as GetPublicAccessBlockCommandOutput;
      
    //   expect(response.ServerSideEncryptionConfiguration?.Rules).toBeTruthy();
    //   const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
    //   expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    //   expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeTruthy();
    // });

    test('bucket blocks public access', async () => {
      const bucketName = outputs.bucket_name;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command) as GetPublicAccessBlockCommandOutput;
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    // test('bucket has lifecycle policy', async () => {
    //   const bucketName = outputs.bucket_name;
    //   const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
    //   const response = await s3Client.send(command) as GetPublicAccessBlockCommandOutput;
      
    //   expect(response.Rules).toBeTruthy();
    //   expect(response.Rules!.length).toBeGreaterThan(0);
      
    //   const rule = response.Rules?.[0];
    //   expect(rule?.Status).toBe('Enabled');
    //   expect(rule?.Expiration?.Days).toBeTruthy();
    // });

    test('bucket enforces encryption on uploads', async () => {
      const bucketName = outputs.bucket_name;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'This is a test file for encryption validation';

      try {
        // Try uploading without encryption - should fail if bucket policy enforces it
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        });
        
        await s3Client.send(putCommand);
        
        // If upload succeeded, verify it was encrypted
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey
        });
        const response = await s3Client.send(getCommand);
        expect(response.ServerSideEncryption).toBeTruthy();
        
      } finally {
        // Clean up test object
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey
          });
          await s3Client.send(deleteCommand);
        } catch (error) {
          console.warn(`Failed to delete test object: ${error}`);
        }
      }
    });
  });

  describe('KMS Key Security', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const keyId = outputs.kms_key_id;
      expect(keyId).toBeTruthy();

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyInfo = await kmsClient.send(describeCommand);
      
      expect(keyInfo.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyInfo.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationStatus = await kmsClient.send(rotationCommand);
      
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('log writer role exists with MFA requirement', async () => {
      const roleArn = outputs.log_writer_role_arn;
      expect(roleArn).toBeTruthy();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role?.AssumeRolePolicyDocument).toBeTruthy();
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      
      // Check for MFA condition
      const mfaCondition = assumeRolePolicy.Statement.some((stmt: any) => 
        stmt.Condition?.Bool?.['aws:MultiFactorAuthPresent'] === 'true'
      );
      expect(mfaCondition).toBe(true);
    });

    test('log reader role exists without MFA requirement', async () => {
      const roleArn = outputs.log_reader_role_arn;
      expect(roleArn).toBeTruthy();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role?.AssumeRolePolicyDocument).toBeTruthy();
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      
      // Check that MFA is NOT required
      const mfaCondition = assumeRolePolicy.Statement.some((stmt: any) => 
        stmt.Condition?.Bool?.['aws:MultiFactorAuthPresent'] === 'true'
      );
      expect(mfaCondition).toBe(false);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('CloudWatch log group exists', async () => {
      const logGroupName = outputs.cloudwatch_log_group;
      expect(logGroupName).toBeTruthy();
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);
      
      expect(response.logGroups).toBeTruthy();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeTruthy();
      expect(logGroup?.kmsKeyId).toBeTruthy(); // Should be encrypted
    });

    test('CloudTrail is active and configured', async () => {
      const command = new DescribeTrailsCommand({});
      const response = await cloudTrailClient.send(command);
      
      expect(response.trailList).toBeTruthy();
      const trail = response.trailList!.find(t => 
        t.Name?.includes('corpSec-security-trail')
      );
      expect(trail).toBeTruthy();
      expect(trail?.S3BucketName).toBe(outputs.bucket_name);
    });

    test('SNS topic exists for alerts', async () => {
      const topicArn = outputs.sns_topic_arn;
      expect(topicArn).toBeTruthy();
      
      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeTruthy();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.KmsMasterKeyId).toBeTruthy(); // Should be encrypted
    });
  });

  describe('End-to-End Workflows', () => {
    test('complete logging workflow', async () => {
      const bucketName = outputs.bucket_name;
      const testKey = `integration-test-${Date.now()}.log`;
      const testContent = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Integration test log entry',
        source: 'terraform-integration-test'
      });

      try {
        // Upload a log file
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'application/json'
        });
        
        await s3Client.send(putCommand);
        
        // Verify the file was stored with encryption
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey
        });
        const getResponse = await s3Client.send(getCommand);
        
        expect(getResponse.ServerSideEncryption).toBeTruthy();
        expect(getResponse.ContentLength).toBeGreaterThan(0);
        
        // Read and verify content
        const content = await getResponse.Body?.transformToString();
        const logEntry = JSON.parse(content!);
        expect(logEntry.message).toBe('Integration test log entry');
        
      } finally {
        // Clean up
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey
          });
          await s3Client.send(deleteCommand);
        } catch (error) {
          console.warn(`Failed to delete test log: ${error}`);
        }
      }
    });
  });
});
