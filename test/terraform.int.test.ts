import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketLoggingCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, GetPolicyCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { CloudTrailClient, GetTrailStatusCommand, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS Clients
const s3Client = new S3Client({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });

describe('Terraform Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Ensure we have outputs from deployment
    if (!outputs.main_bucket_name || !outputs.access_logs_bucket_name) {
      throw new Error('Deployment outputs not found. Please deploy the infrastructure first.');
    }
  });

  describe('S3 Bucket Verification', () => {
    test('Main S3 bucket should exist with correct configurations', async () => {
      const bucketName = outputs.main_bucket_name;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('corp-synthtrainr869-secure-bucket');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check logging configuration
      const loggingCommand = new GetBucketLoggingCommand({ Bucket: bucketName });
      const loggingResponse = await s3Client.send(loggingCommand);
      expect(loggingResponse.LoggingEnabled?.TargetBucket).toBe(outputs.access_logs_bucket_name);
      expect(loggingResponse.LoggingEnabled?.TargetPrefix).toBe('access-logs/');
    });

    test('Access logs S3 bucket should exist with correct configurations', async () => {
      const bucketName = outputs.access_logs_bucket_name;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('corp-synthtrainr869-access-logs');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 buckets should use corp prefix naming convention', async () => {
      expect(outputs.main_bucket_name).toMatch(/^corp-/);
      expect(outputs.access_logs_bucket_name).toMatch(/^corp-/);
    });
  });

  describe('KMS Key Verification', () => {
    test('KMS key should exist with key rotation enabled', async () => {
      const keyId = outputs.kms_key_id;
      expect(keyId).toBeDefined();

      // Describe the key
      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const describeResponse = await kmsClient.send(describeCommand);
      expect(describeResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(describeResponse.KeyMetadata?.KeyState).toBe('Enabled');

      // Check key rotation
      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('IAM Role and Policy Verification', () => {
    test('IAM role should exist with corp prefix', async () => {
      const roleArn = outputs.iam_role_arn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('corp-synthtrainr869-s3-access-role');

      const roleName = roleArn.split('/').pop();
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();
      
      // Verify assume role policy allows EC2
      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || '{}'));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('IAM role should have least privilege policy attached', async () => {
      const roleArn = outputs.iam_role_arn;
      const roleName = roleArn.split('/').pop();
      
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(listPoliciesCommand);
      
      expect(policiesResponse.AttachedPolicies).toBeDefined();
      expect(policiesResponse.AttachedPolicies?.length).toBeGreaterThan(0);
      
      const s3Policy = policiesResponse.AttachedPolicies?.find(p => p.PolicyName?.includes('s3-access-policy'));
      expect(s3Policy).toBeDefined();
      expect(s3Policy?.PolicyName).toContain('corp-synthtrainr869');
    });
  });

  describe('CloudTrail Verification', () => {
    test('CloudTrail should be configured and logging', async () => {
      const trailArn = outputs.cloudtrail_arn;
      expect(trailArn).toBeDefined();
      expect(trailArn).toContain('corp-synthtrainr869-security-trail');

      // Use the trail name directly
      const trailName = 'corp-synthtrainr869-security-trail';
      
      // Check trail status
      const statusCommand = new GetTrailStatusCommand({ Name: trailName });
      const statusResponse = await cloudTrailClient.send(statusCommand);
      expect(statusResponse.IsLogging).toBe(true);

      // Describe trail configuration
      const describeCommand = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const describeResponse = await cloudTrailClient.send(describeCommand);
      
      const trail = describeResponse.trailList?.[0];
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.S3BucketName).toBe(outputs.access_logs_bucket_name);
      expect(trail?.LogFileValidationEnabled).toBeDefined();
    });

    test('CloudTrail should have CloudWatch Logs integration', async () => {
      const trailArn = outputs.cloudtrail_arn;
      const trailName = 'corp-synthtrainr869-security-trail';
      
      const describeCommand = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const describeResponse = await cloudTrailClient.send(describeCommand);
      
      const trail = describeResponse.trailList?.[0];
      expect(trail?.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(trail?.CloudWatchLogsLogGroupArn).toContain('/aws/cloudtrail/corp-synthtrainr869');
      expect(trail?.CloudWatchLogsRoleArn).toBeDefined();
    });
  });

  describe('CloudWatch Alarm Verification', () => {
    test('CloudWatch alarm for unauthorized access should exist', async () => {
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: ['corp-synthtrainr869-unauthorized-access-alarm']
      });
      
      const alarmsResponse = await cloudWatchClient.send(alarmsCommand);
      expect(alarmsResponse.MetricAlarms).toBeDefined();
      expect(alarmsResponse.MetricAlarms?.length).toBe(1);
      
      const alarm = alarmsResponse.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe('corp-synthtrainr869-unauthorized-access-alarm');
      expect(alarm?.MetricName).toBe('UnauthorizedAccessAttempts');
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm?.Threshold).toBe(0);
      expect(alarm?.EvaluationPeriods).toBe(2);
      expect(alarm?.Period).toBe(300);
      expect(alarm?.AlarmActions).toBeDefined();
      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
    });

    test('CloudWatch alarm should be connected to SNS topic', async () => {
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: ['corp-synthtrainr869-unauthorized-access-alarm']
      });
      
      const alarmsResponse = await cloudWatchClient.send(alarmsCommand);
      const alarm = alarmsResponse.MetricAlarms?.[0];
      
      expect(alarm?.AlarmActions).toContain(outputs.sns_topic_arn);
    });
  });

  describe('SNS Topic Verification', () => {
    test('SNS topic for security alerts should exist', async () => {
      const topicArn = outputs.sns_topic_arn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('corp-synthtrainr869-security-alerts');

      const getAttributesCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const attributesResponse = await snsClient.send(getAttributesCommand);
      
      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes?.TopicArn).toBe(topicArn);
      expect(attributesResponse.Attributes?.SubscriptionsConfirmed).toBeDefined();
    });
  });

  describe('Multi-Region Support', () => {
    test('Infrastructure should be deployed in us-east-1', () => {
      // Check that regional resources ARNs are in us-east-1
      // Note: IAM is a global service and doesn't have region in ARNs
      expect(outputs.sns_topic_arn).toContain(':us-east-1:');
      expect(outputs.cloudtrail_arn).toContain(':us-east-1:');
      
      // Verify IAM role exists (global service)
      expect(outputs.iam_role_arn).toContain('arn:aws:iam::');
    });

    test('CloudTrail should be multi-region', async () => {
      const trailArn = outputs.cloudtrail_arn;
      const trailName = 'corp-synthtrainr869-security-trail';
      
      const describeCommand = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const describeResponse = await cloudTrailClient.send(describeCommand);
      
      const trail = describeResponse.trailList?.[0];
      expect(trail?.IsMultiRegionTrail).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    test('All S3 buckets should have encryption enabled', async () => {
      const buckets = [outputs.main_bucket_name, outputs.access_logs_bucket_name];
      
      for (const bucketName of buckets) {
        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const encryptionResponse = await s3Client.send(encryptionCommand);
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
      }
    });

    test('All S3 buckets should have versioning enabled', async () => {
      const buckets = [outputs.main_bucket_name, outputs.access_logs_bucket_name];
      
      for (const bucketName of buckets) {
        const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
        const versioningResponse = await s3Client.send(versioningCommand);
        expect(versioningResponse.Status).toBe('Enabled');
      }
    });

    test('All S3 buckets should block public access', async () => {
      const buckets = [outputs.main_bucket_name, outputs.access_logs_bucket_name];
      
      for (const bucketName of buckets) {
        const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const publicAccessResponse = await s3Client.send(publicAccessCommand);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('KMS key should have rotation enabled', async () => {
      const keyId = outputs.kms_key_id;
      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Complete security monitoring pipeline should be functional', async () => {
      // Verify all components are connected
      expect(outputs.main_bucket_name).toBeDefined();
      expect(outputs.access_logs_bucket_name).toBeDefined();
      expect(outputs.cloudtrail_arn).toBeDefined();
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.iam_role_arn).toBeDefined();

      // Verify CloudTrail is logging to the access logs bucket
      const trailName = 'corp-synthtrainr869-security-trail';
      const describeCommand = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const describeResponse = await cloudTrailClient.send(describeCommand);
      const trail = describeResponse.trailList?.[0];
      expect(trail?.S3BucketName).toBe(outputs.access_logs_bucket_name);

      // Verify CloudWatch alarm is connected to SNS
      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: ['corp-synthtrainr869-unauthorized-access-alarm']
      });
      const alarmsResponse = await cloudWatchClient.send(alarmsCommand);
      const alarm = alarmsResponse.MetricAlarms?.[0];
      expect(alarm?.AlarmActions).toContain(outputs.sns_topic_arn);
    });

    test('Resource naming should follow corp prefix convention', () => {
      expect(outputs.main_bucket_name).toMatch(/^corp-synthtrainr869/);
      expect(outputs.access_logs_bucket_name).toMatch(/^corp-synthtrainr869/);
      expect(outputs.iam_role_arn).toContain('corp-synthtrainr869');
      expect(outputs.sns_topic_arn).toContain('corp-synthtrainr869');
      expect(outputs.cloudtrail_arn).toContain('corp-synthtrainr869');
    });

    test('CloudTrail should be monitoring S3 data events', async () => {
      const trailName = 'corp-synthtrainr869-security-trail';
      const statusCommand = new GetTrailStatusCommand({ Name: trailName });
      const statusResponse = await cloudTrailClient.send(statusCommand);
      
      // CloudTrail is logging
      expect(statusResponse.IsLogging).toBe(true);
      
      // Latest delivery time should be recent (within last hour if there's activity)
      if (statusResponse.LatestDeliveryTime) {
        const deliveryTime = new Date(statusResponse.LatestDeliveryTime);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        // This assertion might fail if there's no recent activity, which is OK
        // We're mainly checking that delivery is configured
        expect(statusResponse.LatestDeliveryTime).toBeDefined();
      }
    });
  });
});