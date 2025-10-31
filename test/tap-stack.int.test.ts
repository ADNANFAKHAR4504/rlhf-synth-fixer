import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import fs from 'fs';
import path from 'path';

// Load stack outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const outputsData = fs.readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(outputsData);
}

const region = process.env.AWS_REGION || 'ap-southeast-1';
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });

describe('S3 Access Control System Integration Tests', () => {
  describe('Bucket Existence and Configuration', () => {
    test('Public bucket should exist', async () => {
      const bucketName = outputs.publicBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Internal bucket should exist', async () => {
      const bucketName = outputs.internalBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Confidential bucket should exist', async () => {
      const bucketName = outputs.confidentialBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Bucket Versioning Configuration', () => {
    test('Public bucket should have versioning enabled', async () => {
      const bucketName = outputs.publicBucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('Internal bucket should have versioning enabled', async () => {
      const bucketName = outputs.internalBucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('Confidential bucket should have versioning enabled', async () => {
      const bucketName = outputs.confidentialBucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Bucket Encryption Configuration', () => {
    test('Public bucket should use SSE-S3 encryption', async () => {
      const bucketName = outputs.publicBucketName;
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('Internal bucket should use SSE-S3 encryption', async () => {
      const bucketName = outputs.internalBucketName;
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('Confidential bucket should use SSE-KMS encryption', async () => {
      const bucketName = outputs.confidentialBucketName;
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toBeDefined();
    });
  });

  describe('Bucket Lifecycle Configuration', () => {
    test('Public bucket should have Glacier transition rule', async () => {
      const bucketName = outputs.publicBucketName;
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules!.find((r) => r.ID === 'glacier-transition');
      expect(rule).toBeDefined();
      expect(rule!.Status).toBe('Enabled');
      expect(rule!.Transitions).toBeDefined();
      expect(rule!.Transitions![0].Days).toBe(90);
      expect(rule!.Transitions![0].StorageClass).toBe('GLACIER');
    });

    test('Internal bucket should have Glacier transition rule', async () => {
      const bucketName = outputs.internalBucketName;
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules!.find((r) => r.ID === 'glacier-transition');
      expect(rule).toBeDefined();
      expect(rule!.Status).toBe('Enabled');
      expect(rule!.Transitions).toBeDefined();
      expect(rule!.Transitions![0].Days).toBe(90);
      expect(rule!.Transitions![0].StorageClass).toBe('GLACIER');
    });

    test('Confidential bucket should have Glacier transition rule', async () => {
      const bucketName = outputs.confidentialBucketName;
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules!.find((r) => r.ID === 'glacier-transition');
      expect(rule).toBeDefined();
      expect(rule!.Status).toBe('Enabled');
      expect(rule!.Transitions).toBeDefined();
      expect(rule!.Transitions![0].Days).toBe(90);
      expect(rule!.Transitions![0].StorageClass).toBe('GLACIER');
    });
  });

  describe('Public Access Block Configuration', () => {
    test('Public bucket should block all public access', async () => {
      const bucketName = outputs.publicBucketName;
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

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

    test('Internal bucket should block all public access', async () => {
      const bucketName = outputs.internalBucketName;
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

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

    test('Confidential bucket should block all public access', async () => {
      const bucketName = outputs.confidentialBucketName;
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

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

  describe('Bucket Policy - HTTPS Enforcement', () => {
    test('Public bucket should enforce HTTPS', async () => {
      const bucketName = outputs.publicBucketName;
      const response = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();

      const httpsStatement = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureTransport'
      );
      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Effect).toBe('Deny');
      expect(httpsStatement.Condition).toBeDefined();
      expect(httpsStatement.Condition.Bool).toBeDefined();
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe(
        'false'
      );
    });

    test('Internal bucket should enforce HTTPS', async () => {
      const bucketName = outputs.internalBucketName;
      const response = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();

      const httpsStatement = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureTransport'
      );
      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Effect).toBe('Deny');
      expect(httpsStatement.Condition).toBeDefined();
      expect(httpsStatement.Condition.Bool).toBeDefined();
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe(
        'false'
      );
    });

    test('Confidential bucket should enforce HTTPS', async () => {
      const bucketName = outputs.confidentialBucketName;
      const response = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();

      const httpsStatement = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureTransport'
      );
      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Effect).toBe('Deny');
      expect(httpsStatement.Condition).toBeDefined();
      expect(httpsStatement.Condition.Bool).toBeDefined();
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe(
        'false'
      );
    });
  });

  describe('IAM Roles Configuration', () => {
    test('Developer role should exist', async () => {
      const roleArn = outputs.developerRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Analyst role should exist', async () => {
      const roleArn = outputs.analystRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Admin role should exist', async () => {
      const roleArn = outputs.adminRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('IAM Role Policies', () => {
    test('Developer role should have correct permissions', async () => {
      const roleArn = outputs.developerRoleArn;
      const roleName = roleArn.split('/').pop();

      // List inline policies to get the actual policy name
      const listResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
      expect(listResponse.PolicyNames).toBeDefined();
      expect(listResponse.PolicyNames!.length).toBeGreaterThan(0);

      const policyName = listResponse.PolicyNames![0];
      const response = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        })
      );

      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThan(0);
    });

    test('Analyst role should have correct permissions', async () => {
      const roleArn = outputs.analystRoleArn;
      const roleName = roleArn.split('/').pop();

      // List inline policies to get the actual policy name
      const listResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
      expect(listResponse.PolicyNames).toBeDefined();
      expect(listResponse.PolicyNames!.length).toBeGreaterThan(0);

      const policyName = listResponse.PolicyNames![0];
      const response = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        })
      );

      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThan(0);
    });

    test('Admin role should have correct permissions', async () => {
      const roleArn = outputs.adminRoleArn;
      const roleName = roleArn.split('/').pop();

      // List inline policies to get the actual policy name
      const listResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
      expect(listResponse.PolicyNames).toBeDefined();
      expect(listResponse.PolicyNames!.length).toBeGreaterThan(0);

      const policyName = listResponse.PolicyNames![0];
      const response = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        })
      );

      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('Access Logging Configuration', () => {
    test('Public bucket should have logging enabled to audit bucket', async () => {
      const bucketName = outputs.publicBucketName;
      const response = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toContain('audit-logs');
      expect(response.LoggingEnabled!.TargetPrefix).toBe('public-bucket-logs/');
    });

    test('Internal bucket should have logging enabled to audit bucket', async () => {
      const bucketName = outputs.internalBucketName;
      const response = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toContain('audit-logs');
      expect(response.LoggingEnabled!.TargetPrefix).toBe('internal-bucket-logs/');
    });

    test('Confidential bucket should have logging enabled to audit bucket', async () => {
      const bucketName = outputs.confidentialBucketName;
      const response = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toContain('audit-logs');
      expect(response.LoggingEnabled!.TargetPrefix).toBe(
        'confidential-bucket-logs/'
      );
    });
  });
});
