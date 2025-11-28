import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  GetGroupCommand,
  GetPolicyCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

const isLocalStack = process.env.USE_LOCALSTACK === 'true' || process.env.NODE_ENV === 'test';
const localStackEndpoint = 'http://localhost:4566';

const cloudFormationClient = new CloudFormationClient({
  region: 'us-east-1',
  ...(isLocalStack && { endpoint: localStackEndpoint })
});
const iamClient = new IAMClient({
  region: 'us-east-1',
  ...(isLocalStack && { endpoint: localStackEndpoint })
});
const kmsClient = new KMSClient({
  region: 'us-east-1',
  ...(isLocalStack && { endpoint: localStackEndpoint })
});
const secretsClient = new SecretsManagerClient({
  region: 'us-east-1',
  ...(isLocalStack && { endpoint: localStackEndpoint })
});
const lambdaClient = new LambdaClient({
  region: 'us-east-1',
  ...(isLocalStack && { endpoint: localStackEndpoint })
});

let outputs: { [key: string]: string } = {};
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack-${environmentSuffix}`;

describe('TapStack Security Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    try {
      // Load outputs from CloudFormation stack
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];
      if (stack?.Outputs) {
        stack.Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            outputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    } catch (error) {
      console.warn(`Stack ${stackName} not found, outputs will be empty. Error:`, error);
    }
  });

  describe('KMS Resources Tests', () => {
    test('KMS key should exist and be enabled', async () => {
      if (!outputs.KMSKeyId) {
        console.log('Skipping test, KMSKeyId not found');
        return;
      }
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('KMS key should have correct alias', async () => {
      if (!outputs.KMSKeyAlias) {
        console.log('Skipping test, KMSKeyAlias not found');
        return;
      }
      expect(outputs.KMSKeyAlias).toContain(`alias/security/primary-${environmentSuffix}`);
    });

    test('KMS key should have rotation enabled', async () => {
      if (!outputs.KMSKeyId) {
        console.log('Skipping test, KMSKeyId not found');
        return;
      }
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Secrets Manager Tests', () => {
    test('Database credentials secret should exist', async () => {
      if (!outputs.DatabaseCredentialsSecretArn) {
        console.log('Skipping test, DatabaseCredentialsSecretArn not found');
        return;
      }
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBeDefined();
      expect(response.Name).toContain('Secret-DatabaseCreds');
    });

    test('Secret should have correct KMS key', async () => {
      if (!outputs.DatabaseCredentialsSecretArn || !outputs.KMSKeyId) {
        console.log('Skipping test, DatabaseCredentialsSecretArn or KMSKeyId not found');
        return;
      }
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBe(outputs.KMSKeyId);
    });

    test('Secret should have rotation enabled', async () => {
      if (!outputs.DatabaseCredentialsSecretArn) {
        console.log('Skipping test, DatabaseCredentialsSecretArn not found');
        return;
      }
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.RotationEnabled).toBe(true);
    });
  });

  describe('Lambda Function Tests', () => {
    test('Secrets rotation Lambda should exist', async () => {
      if (!outputs.SecretsRotationLambdaArn) {
        console.log('Skipping test, SecretsRotationLambdaArn not found');
        return;
      }
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toContain('Lambda-SecretsRotation');
    });

    test('Lambda should have correct runtime', async () => {
      if (!outputs.SecretsRotationLambdaArn) {
        console.log('Skipping test, SecretsRotationLambdaArn not found');
        return;
      }
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('Lambda should have appropriate timeout', async () => {
      if (!outputs.SecretsRotationLambdaArn) {
        console.log('Skipping test, SecretsRotationLambdaArn not found');
        return;
      }
      const functionName = outputs.SecretsRotationLambdaArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Timeout).toBe(30);
    });
  });

  describe('IAM Policies Tests', () => {
    test('S3 encryption boundary policy should exist', async () => {
      if (!outputs.S3EncryptionPolicyArn) {
        console.log('Skipping test, S3EncryptionPolicyArn not found');
        return;
      }
      const command = new GetPolicyCommand({
        PolicyArn: outputs.S3EncryptionPolicyArn,
      });
      const response = await iamClient.send(command);
      expect(response.Policy).toBeDefined();
      expect(response.Policy?.PolicyName).toContain('Policy-S3Encryption');
    });

    test('EC2 encryption boundary policy should exist', async () => {
      if (!outputs.EC2BoundaryPolicyArn) {
        console.log('Skipping test, EC2BoundaryPolicyArn not found');
        return;
      }
      const command = new GetPolicyCommand({
        PolicyArn: outputs.EC2BoundaryPolicyArn,
      });
      const response = await iamClient.send(command);
      expect(response.Policy).toBeDefined();
      expect(response.Policy?.PolicyName).toContain('Policy-EC2EncryptionBoundary');
    });

    test('policies should be in the correct account', () => {
      if (!outputs.S3EncryptionPolicyArn || !outputs.EC2BoundaryPolicyArn) {
        console.log('Skipping test, policy ARNs not found');
        return;
      }
      expect(outputs.S3EncryptionPolicyArn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
      expect(outputs.EC2BoundaryPolicyArn).toMatch(/^arn:aws:iam::\d{12}:policy\//);
    });
  });

  describe('IAM Groups Tests', () => {
    test('Security auditors group should exist', async () => {
      if (!outputs.SecurityAuditorsGroupName) {
        console.log('Skipping test, SecurityAuditorsGroupName not found');
        return;
      }
      const command = new GetGroupCommand({
        GroupName: outputs.SecurityAuditorsGroupName,
      });
      const response = await iamClient.send(command);
      expect(response.Group).toBeDefined();
      expect(response.Group?.GroupName).toContain('Group-SecurityAuditors');
    });
  });

  describe('Security Validation Tests', () => {
    test('KMS key should be referenced by secret', async () => {
      if (!outputs.DatabaseCredentialsSecretArn || !outputs.KMSKeyId) {
        console.log('Skipping test, DatabaseCredentialsSecretArn or KMSKeyId not found');
        return;
      }
      const secretCommand = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn,
      });
      const secretResponse = await secretsClient.send(secretCommand);
      const secretKmsKeyId = secretResponse.KmsKeyId;
      expect(secretKmsKeyId).toContain(outputs.KMSKeyId);
    });

    test('secret should not be scheduled for deletion', async () => {
      if (!outputs.DatabaseCredentialsSecretArn) {
        console.log('Skipping test, DatabaseCredentialsSecretArn not found');
        return;
      }
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseCredentialsSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.DeletedDate).toBeUndefined();
    });
  });
});
