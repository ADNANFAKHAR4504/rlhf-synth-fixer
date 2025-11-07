import fs from 'fs';
import path from 'path';
import {
  IAMClient,
  GetRoleCommand,
  SimulatePrincipalPolicyCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetResourcePolicyCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  AccessAnalyzerClient,
  GetAnalyzerCommand,
} from '@aws-sdk/client-accessanalyzer';

// Load outputs from flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = outputs.awsRegion || 'ap-northeast-1';

// Initialize AWS SDK clients
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const analyzerClient = new AccessAnalyzerClient({ region });

describe('TapStack Integration Tests - Live Resources', () => {
  describe('KMS Keys', () => {
    test('data encryption key should exist with rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.dataEncryptionKeyId })
      );
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.dataEncryptionKeyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('secrets encryption key should exist with rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.secretsEncryptionKeyId })
      );
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.secretsEncryptionKeyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('logs encryption key should exist with rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.logsEncryptionKeyId })
      );
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.logsEncryptionKeyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('admin role should exist with correct max session duration', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.adminRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.adminRoleName);
      expect(response.Role?.MaxSessionDuration).toBe(3600);
      expect(response.Role?.Arn).toBe(outputs.adminRoleArn);
    }, 30000);

    test('developer role should exist with restricted permissions', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.developerRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.developerRoleName);
      expect(response.Role?.MaxSessionDuration).toBe(14400);
    }, 30000);

    test('audit role should exist with read-only permissions', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.auditRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.auditRoleName);
      expect(response.Role?.MaxSessionDuration).toBe(43200);
    }, 30000);

    test('service account role should exist for Lambda', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.serviceAccountRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.serviceAccountRoleName);
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain(
        'lambda.amazonaws.com'
      );
    }, 30000);

    test('admin role should have MFA enforcement', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.adminRoleName })
      );
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      const denyStatement = assumeRolePolicy.Statement.find(
        (s: any) => s.Effect === 'Deny'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe(
        'false'
      );
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('audit bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.auditBucketName })
      );
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('data bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.dataBucketName })
      );
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('audit bucket should have KMS encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.auditBucketName })
      );
      expect(response.ServerSideEncryptionConfiguration?.Rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    test('data bucket should have KMS encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.dataBucketName })
      );
      expect(response.ServerSideEncryptionConfiguration?.Rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    test('audit bucket should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.auditBucketName })
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('data bucket should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.dataBucketName })
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    }, 30000);

    test('audit bucket should have secure transport policy', async () => {
      const response = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: outputs.auditBucketName })
      );
      const policy = JSON.parse(response.Policy || '{}');
      const denyInsecureStatement = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('database credentials secret should exist with rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.dbSecretArn })
      );
      expect(response.ARN).toBe(outputs.dbSecretArn);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    }, 30000);

    test('API keys secret should exist with rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.apiKeySecretArn })
      );
      expect(response.ARN).toBe(outputs.apiKeySecretArn);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(90);
    }, 30000);

    test('service tokens secret should exist with rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.serviceTokenSecretArn })
      );
      expect(response.ARN).toBe(outputs.serviceTokenSecretArn);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(90);
    }, 30000);

    test('secrets should use KMS encryption', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.dbSecretArn })
      );
      expect(response.KmsKeyId).toBe(outputs.secretsEncryptionKeyArn);
    }, 30000);

    test('database secret should have cross-account deny policy', async () => {
      const response = await secretsClient.send(
        new GetResourcePolicyCommand({ SecretId: outputs.dbSecretArn })
      );
      const policy = JSON.parse(response.ResourcePolicy || '{}');
      const denyStatement = policy.Statement.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toContain('secretsmanager:GetSecretValue');
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('rotation lambda should exist with correct runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.rotationLambdaName })
      );
      expect(response.Configuration?.FunctionArn).toBe(outputs.rotationLambdaArn);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(30);
    }, 30000);

    test('rotation lambda should have environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.rotationLambdaName })
      );
      expect(response.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBe(outputs.environmentSuffix);
      expect(response.Environment?.Variables?.KMS_KEY_ID).toBe(outputs.secretsEncryptionKeyId);
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    test('application log group should exist with correct retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.applicationLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.applicationLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);

    test('audit log group should exist with 10-year retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.auditLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.auditLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(3653);
    }, 30000);

    test('security log group should exist with 90-day retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.securityLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.securityLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    }, 30000);

    test('log groups should use KMS encryption', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.applicationLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.applicationLogGroupName
      );
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('IAM Access Analyzer', () => {
    test('analyzer should exist and be active', async () => {
      const analyzerName = outputs.analyzerArn.split('/').pop();
      const response = await analyzerClient.send(
        new GetAnalyzerCommand({ analyzerName })
      );
      expect(response.analyzer?.arn).toBe(outputs.analyzerArn);
      expect(response.analyzer?.status).toBe('ACTIVE');
      expect(response.analyzer?.type).toBe('ACCOUNT');
    }, 30000);
  });

  describe('Environment Configuration', () => {
    test('should have correct environment suffix', () => {
      expect(outputs.environmentSuffix).toBeDefined();
      expect(typeof outputs.environmentSuffix).toBe('string');
    });

    test('should be deployed in configured region', () => {
      expect(outputs.awsRegion).toBeDefined();
      expect(typeof outputs.awsRegion).toBe('string');
    });

    test('should have correct resource prefix', () => {
      expect(outputs.resourcePrefix).toBeDefined();
      expect(outputs.resourcePrefix).toBe(`tap-${outputs.environmentSuffix}`);
    });
  });

  describe('Compliance Requirements', () => {
    test('audit bucket should have 1-year retention', () => {
      expect(outputs.AuditBucketRetentionDays).toBe('365');
    });

    test('data bucket should have 7-year retention', () => {
      expect(outputs.DataBucketRetentionDays).toBe('2555');
    });

    test('cross-account role should have external ID', () => {
      expect(outputs.CrossAccountExternalId).toBeDefined();
      expect(outputs.CrossAccountExternalId).toMatch(new RegExp(`^tap-${outputs.environmentSuffix}-`));
    });
  });
});
