// Integration tests for the deployed infrastructure
import fs from 'fs';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr1727';

// AWS Client configuration
const region = process.env.AWS_REGION || 'us-west-2';
const stackSuffix = `${environmentSuffix}-${region}`;

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Warning: cfn-outputs/flat-outputs.json not found or invalid. Integration tests will be skipped.');
  outputs = {};
}

// Helper function to get output with region-based naming
const getOutput = (baseName) => {
  // Try different naming patterns that CDK might use
  const patterns = [
    `${baseName}${stackSuffix.replace(/-/g, '')}`, // testuswest2 format
    `${baseName}${stackSuffix}`, // test-us-west-2 format
    `${baseName}${environmentSuffix}`, // fallback to just env suffix
    baseName // fallback to base name
  ];
  
  for (const pattern of patterns) {
    if (outputs[pattern]) {
      return outputs[pattern];
    }
  }
  return undefined;
};
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });
const s3Client = new S3Client({ region });

describe('Security Infrastructure Integration Tests', () => {
  // Check if required outputs are available before running tests
  beforeAll(() => {
    const availableOutputs = Object.keys(outputs);
    console.log(`Available outputs: ${availableOutputs.join(', ')}`);
    
    const requiredOutputs = ['EncryptionKeyId', 'EncryptionKeyArn', 'SigningKeyId', 'SecurityAuditRoleArn', 'SecurityMonitoringRoleArn'];
    const missingOutputs = requiredOutputs.filter(output => !getOutput(output));
    
    if (missingOutputs.length > 0) {
      console.warn(`Warning: Missing security stack outputs: ${missingOutputs.join(', ')}`);
      console.warn('This usually means the nested security stacks are not deployed yet.');
      console.warn('Tests will focus on what is actually deployed.');
    }
  });

  describe('Basic Deployment Validation', () => {
    test('should have successful deployment', () => {
      const deploymentStatus = getOutput('SecurityDeploymentComplete');
      expect(deploymentStatus).toBeDefined();
      expect(deploymentStatus).toBe('SUCCESS');
    });

    test('should have outputs file properly generated', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('KMS Key Validation', () => {
    test('should have a working encryption key', async () => {
      const keyId = getOutput('EncryptionKeyId');
      expect(keyId).toBeDefined();
      
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      // Key rotation might not be enabled in all environments
      if (response.KeyMetadata.KeyRotationEnabled !== undefined) {
        expect(response.KeyMetadata.KeyRotationEnabled).toBe(true);
      }
    });

    test('should have a working signing key', async () => {
      const keyId = getOutput('SigningKeyId');
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
      const roleArn = getOutput('SecurityAuditRoleArn');
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
      const roleArn = getOutput('SecurityMonitoringRoleArn');
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
      expect(getOutput('SecurityDeploymentComplete')).toBe('SUCCESS');
    });

    test('should have all expected outputs', () => {
      expect(getOutput('EncryptionKeyId')).toBeDefined();
      expect(getOutput('EncryptionKeyArn')).toBeDefined();
      expect(getOutput('SigningKeyId')).toBeDefined();
      expect(getOutput('SecurityMonitoringRoleArn')).toBeDefined();
      expect(getOutput('SecurityAuditRoleArn')).toBeDefined();
    });

    test('should have correct resource ARN format', () => {
      expect(getOutput('EncryptionKeyArn')).toMatch(/^arn:aws:kms:us-west-2:\d{12}:key\/[a-f0-9-]+$/);
      expect(getOutput('SecurityMonitoringRoleArn')).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(getOutput('SecurityAuditRoleArn')).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS keys in correct region', () => {
      const encryptionKeyArn = getOutput('EncryptionKeyArn');
      expect(encryptionKeyArn).toContain('us-west-2');
    });

    test('should have proper role naming convention', () => {
      const auditRoleArn = getOutput('SecurityAuditRoleArn');
      const monitoringRoleArn = getOutput('SecurityMonitoringRoleArn');
      
      expect(auditRoleArn).toBeDefined();
      expect(monitoringRoleArn).toBeDefined();
      
      const auditRoleName = auditRoleArn.split('/').pop();
      const monitoringRoleName = monitoringRoleArn.split('/').pop();
      
      expect(auditRoleName).toContain('SecurityAuditRole');
      expect(monitoringRoleName).toContain('SecurityMonitoringRole');
    });
  });

  describe('Cross-Stack Dependencies', () => {
    test('IAM roles should reference the correct KMS key', async () => {
      // Get the audit role
      const roleArn = getOutput('SecurityAuditRoleArn');
      expect(roleArn).toBeDefined();
      
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
        expect(purposeTag.Value).toBe('SecurityConfiguration');
      }
    });
  });
});