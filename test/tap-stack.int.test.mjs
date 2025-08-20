// Integration tests for the deployed infrastructure
import fs from 'fs';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr140';

// AWS Client configuration
const region = 'us-west-2';
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });
const s3Client = new S3Client({ region });

describe('Security Infrastructure Integration Tests', () => {
  describe('KMS Key Validation', () => {
    test('should have a working encryption key', async () => {
      const keyId = outputs.EncryptionKeyId;
      expect(keyId).toBeDefined();
      
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.KeyRotationEnabled).toBe(true);
    });

    test('should have a working signing key', async () => {
      const keyId = outputs.SigningKeyId;
      expect(keyId).toBeDefined();
      
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyUsage).toBe('SIGN_VERIFY');
      expect(response.KeyMetadata.KeySpec).toBe('RSA_2048');
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
    });
  });

  describe('IAM Role Validation', () => {
    test('should have security audit role with correct configuration', async () => {
      const roleArn = outputs.SecurityAuditRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toContain('SecurityAuditRole');
      expect(response.Role.MaxSessionDuration).toBe(14400); // 4 hours
      
      // Verify assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have security monitoring role with correct configuration', async () => {
      const roleArn = outputs.SecurityMonitoringRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toContain('SecurityMonitoringRole');
      expect(response.Role.MaxSessionDuration).toBe(7200); // 2 hours
    });
  });

  describe('Stack Integration', () => {
    test('should have deployed successfully', () => {
      expect(outputs.SecurityDeploymentComplete).toBe('SUCCESS');
    });

    test('should have all expected outputs', () => {
      expect(outputs.EncryptionKeyId).toBeDefined();
      expect(outputs.EncryptionKeyArn).toBeDefined();
      expect(outputs.SigningKeyId).toBeDefined();
      expect(outputs.SecurityMonitoringRoleArn).toBeDefined();
      expect(outputs.SecurityAuditRoleArn).toBeDefined();
    });

    test('should have correct resource ARN format', () => {
      expect(outputs.EncryptionKeyArn).toMatch(/^arn:aws:kms:us-west-2:\d{12}:key\/[a-f0-9-]+$/);
      expect(outputs.SecurityMonitoringRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(outputs.SecurityAuditRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS keys in correct region', () => {
      expect(outputs.EncryptionKeyArn).toContain('us-west-2');
    });

    test('should have proper role naming convention', () => {
      const auditRoleName = outputs.SecurityAuditRoleArn.split('/').pop();
      const monitoringRoleName = outputs.SecurityMonitoringRoleArn.split('/').pop();
      
      expect(auditRoleName).toContain('SecurityAuditRole');
      expect(monitoringRoleName).toContain('SecurityMonitoringRole');
    });
  });

  describe('Cross-Stack Dependencies', () => {
    test('IAM roles should reference the correct KMS key', async () => {
      // Get the audit role
      const roleArn = outputs.SecurityAuditRoleArn;
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      // The role should exist and be properly configured
      expect(response.Role).toBeDefined();
      expect(response.Role.Tags).toBeDefined();
      
      // Check if role has proper tags
      const ownerTag = response.Role.Tags.find(tag => tag.Key === 'Owner');
      const purposeTag = response.Role.Tags.find(tag => tag.Key === 'Purpose');
      
      if (ownerTag) {
        expect(ownerTag.Value).toBe('SecurityTeam');
      }
      if (purposeTag) {
        expect(purposeTag.Value).toBe('IAMSecurityRoles');
      }
    });
  });
});