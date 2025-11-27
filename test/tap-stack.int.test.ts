import fs from 'fs';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, DescribeSecretCommand, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { IAMClient, GetRoleCommand, GetPolicyCommand, GetGroupCommand, ListAttachedRolePoliciesCommand, ListAttachedGroupPoliciesCommand } from '@aws-sdk/client-iam';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test103';
const region = process.env.AWS_REGION || 'us-east-1';

// Increase timeout for integration tests
jest.setTimeout(120000);

describe('TapStack Security Infrastructure Integration Tests', () => {
  let kmsClient: KMSClient;
  let secretsClient: SecretsManagerClient;
  let iamClient: IAMClient;
  let lambdaClient: LambdaClient;

  beforeAll(() => {
    kmsClient = new KMSClient({ region, maxAttempts: 3, requestTimeout: 10000 });
    secretsClient = new SecretsManagerClient({ region, maxAttempts: 3, requestTimeout: 10000 });
    iamClient = new IAMClient({ region, maxAttempts: 3, requestTimeout: 10000 });
    lambdaClient = new LambdaClient({ region, maxAttempts: 3, requestTimeout: 10000 });
  });

  describe('KMS Key Tests', () => {
    test('KMS key should exist and be accessible', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.KMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('KMS key ARN should match expected format', () => {
      expect(outputs.KMSKeyArn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/);
    });

    test('KMS key alias should match expected format', () => {
      expect(outputs.KMSKeyAlias).toMatch(/^alias\/security\/primary-/);
      expect(outputs.KMSKeyAlias).toContain(environmentSuffix);
    });
  });

  describe('Secrets Manager Tests', () => {
    test('Database credentials secret should exist', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.DatabaseCredentialsSecretArn);
      expect(response.Name).toContain('DatabaseCreds');
    });

    test('Secret should be encrypted with KMS', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBeDefined();
      expect(response.KmsKeyId).toContain(outputs.KMSKeyId);
    });

    test('Secret should have rotation enabled', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationLambdaARN).toBe(outputs.SecretsRotationLambdaArn);
    });

    test('Secret should have rotation rules configured', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    });

    test('Secret value should be retrievable and valid', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.username).toBe('dbadmin');
      expect(secretData.password).toBeDefined();
      expect(secretData.password.length).toBe(32);
    });
  });

  describe('IAM Roles Tests', () => {
    test('Secrets rotation Lambda role should exist', async () => {
      const roleName = outputs.SecretsRotationLambdaArn.split('/').pop()!.replace('Lambda', 'Role');
      const command = new GetRoleCommand({
        RoleName: `FinSecure-Production-Role-SecretsRotation-${environmentSuffix}`
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('SecretsRotation');
    });

    test('Cross-account role should exist', async () => {
      const roleName = outputs.CrossAccountRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Security scanner role should exist', async () => {
      const roleName = outputs.SecurityScannerRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('SecurityScanner');
    });

    test('Cross-account role should have Security Audit policy attached', async () => {
      const roleName = outputs.CrossAccountRoleArn.split('/').pop()!;
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();

      const securityAuditPolicy = response.AttachedPolicies?.find(
        p => p.PolicyName === 'SecurityAudit'
      );
      expect(securityAuditPolicy).toBeDefined();
    });
  });

  describe('IAM Policies Tests', () => {
    test('S3 encryption enforcement policy should exist', async () => {
      const policyArn = outputs.S3EncryptionPolicyArn;
      const command = new GetPolicyCommand({
        PolicyArn: policyArn
      });

      const response = await iamClient.send(command);
      expect(response.Policy).toBeDefined();
      expect(response.Policy?.PolicyName).toContain('S3Encryption');
    });

    test('EC2 encryption boundary policy should exist', async () => {
      const policyArn = outputs.EC2BoundaryPolicyArn;
      const command = new GetPolicyCommand({
        PolicyArn: policyArn
      });

      const response = await iamClient.send(command);
      expect(response.Policy).toBeDefined();
      expect(response.Policy?.PolicyName).toContain('EC2EncryptionBoundary');
    });

    test('policies should be in the correct account', () => {
      expect(outputs.S3EncryptionPolicyArn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
      expect(outputs.EC2BoundaryPolicyArn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });
  });

  describe('IAM Groups Tests', () => {
    test('Security auditors group should exist', async () => {
      const command = new GetGroupCommand({
        GroupName: outputs.SecurityAuditorsGroupName
      });

      const response = await iamClient.send(command);
      expect(response.Group).toBeDefined();
      expect(response.Group?.GroupName).toContain('SecurityAuditors');
    });

    test('Security auditors group should have Security Audit policy attached', async () => {
      const command = new ListAttachedGroupPoliciesCommand({
        GroupName: outputs.SecurityAuditorsGroupName
      });

      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();

      const securityAuditPolicy = response.AttachedPolicies?.find(
        p => p.PolicyName === 'SecurityAudit'
      );
      expect(securityAuditPolicy).toBeDefined();
    });
  });

  describe('Lambda Function Tests', () => {
    test('Secrets rotation Lambda should exist', async () => {
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('SecretsRotation');
    });

    test('Lambda should have correct runtime', async () => {
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    test('Lambda should have appropriate timeout', async () => {
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('Lambda should have correct role attached', async () => {
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toContain('SecretsRotation');
    });
  });

  describe('Resource Integration Tests', () => {
    test('all outputs should be non-empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      });
    });

    test('all ARNs should be in the correct region', () => {
      const arnFields = [
        'KMSKeyArn',
        'DatabaseCredentialsSecretArn',
        'SecretsRotationLambdaArn',
        'CrossAccountRoleArn',
        'SecurityScannerRoleArn'
      ];

      arnFields.forEach(field => {
        const arn = outputs[field];
        if (arn.includes(':')) {
          const arnParts = arn.split(':');
          // KMS and Secrets Manager have region in ARN
          if (field.includes('KMS') || field.includes('Secret') || field.includes('Lambda')) {
            expect(arnParts[3]).toBe(region);
          }
        }
      });
    });

    test('all resource names should include environment suffix', () => {
      // Check names that should contain environmentSuffix
      expect(outputs.SecurityAuditorsGroupName).toContain(environmentSuffix);
      expect(outputs.KMSKeyAlias).toContain(environmentSuffix);
    });

    test('KMS key should be referenced by secret', async () => {
      const secretCommand = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const secretResponse = await secretsClient.send(secretCommand);
      const secretKmsKeyId = secretResponse.KmsKeyId;

      expect(secretKmsKeyId).toContain(outputs.KMSKeyId);
    });
  });

  describe('Security Validation Tests', () => {
    test('KMS key should be in enabled state', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('secret should not be scheduled for deletion', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.DeletedDate).toBeUndefined();
    });

    test('Lambda function should be active', async () => {
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.State).toBe('Active');
    });
  });

  describe('Cross-Resource Dependencies', () => {
    test('secret rotation should reference correct Lambda', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn
      });

      const response = await secretsClient.send(command);
      expect(response.RotationLambdaARN).toBe(outputs.SecretsRotationLambdaArn);
    });

    test('all resources should be deployed in same account', () => {
      const accountIds = new Set();

      // Extract account IDs from ARNs
      [outputs.KMSKeyArn, outputs.DatabaseCredentialsSecretArn, outputs.CrossAccountRoleArn].forEach(arn => {
        const parts = arn.split(':');
        if (parts.length > 4) {
          accountIds.add(parts[4]);
        }
      });

      expect(accountIds.size).toBe(1);
    });
  });
});
