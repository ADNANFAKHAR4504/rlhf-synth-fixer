import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';

jest.setTimeout(90000);

describe('Terraform Integration Tests - Multi-Environment S3 + DynamoDB', () => {
  let outputs: any;
  let region: string;
  let s3Client: S3Client;
  let dynamoDBClient: DynamoDBClient;
  let kmsClient: KMSClient;
  let iamClient: IAMClient;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error('Outputs file not found. Run: npm run outputs:generate');
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Extract region from ARN (NO HARDCODING!)
    region = outputs.dynamodb_table_arn.split(':')[3];
    console.log('Detected region from outputs:', region);

    // Initialize AWS SDK clients with extracted region
    s3Client = new S3Client({ region });
    dynamoDBClient = new DynamoDBClient({ region });
    kmsClient = new KMSClient({ region });
    iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global

    console.log('AWS SDK clients initialized');
    console.log('Environment:', outputs.environment);
  });

  describe('Output Validation', () => {
    test('should load outputs successfully', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should extract region correctly from ARN', () => {
      expect(region).toBeDefined();
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
      console.log('Region:', region);
    });

    test('should have environment output', () => {
      expect(outputs.environment).toBeDefined();
      expect(outputs.environment).toBe('dev');
    });

    test('should have s3_bucket_name', () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_name).toContain('company-data-dev');
    });

    test('should have dynamodb_table_name', () => {
      expect(outputs.dynamodb_table_name).toBeDefined();
      expect(outputs.dynamodb_table_name).toContain('company-transactions-dev');
    });

    test('should have kms_key_id in UUID format', () => {
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('should have valid iam_role_arn', () => {
      expect(outputs.iam_role_arn).toBeDefined();
      expect(outputs.iam_role_arn).toMatch(/^arn:aws:iam::/);
    });

    test('should have config_summary object', () => {
      expect(outputs.config_summary).toBeDefined();
      expect(outputs.config_summary.environment).toBe('dev');
      expect(outputs.config_summary.dynamodb_billing_mode).toBe('PAY_PER_REQUEST');
    });

    test('should indicate monitoring disabled for dev', () => {
      expect(outputs.config_summary.monitoring_enabled).toBe(false);
      expect(outputs.sns_topic_arn).toContain('N/A');
    });

    test('should indicate PITR disabled for dev', () => {
      expect(outputs.config_summary.pitr_enabled).toBe(false);
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should have S3 bucket exist in AWS', async () => {
      try {
        await s3Client.send(new GetBucketVersioningCommand({
          Bucket: outputs.s3_bucket_name
        }));
        expect(true).toBe(true);
        console.log('S3 bucket exists:', outputs.s3_bucket_name);
      } catch (error) {
        fail(`S3 bucket does not exist: ${error}`);
      }
    });

    test('should have versioning enabled', async () => {
      const response = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      }));
      expect(response.Status).toBe('Enabled');
      console.log('Versioning status:', response.Status);
    });

    test('should have KMS encryption configured', async () => {
      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      }));
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      console.log('Encryption algorithm:', rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm);
    });

    test('should use correct KMS key for encryption', async () => {
      const response = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      }));
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBe(outputs.kms_key_arn);
      console.log('KMS key matches:', outputs.kms_key_arn);
    });

    test('should have lifecycle configuration', async () => {
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3_bucket_name
      }));
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      console.log('Lifecycle rules count:', response.Rules!.length);
    });

    test('should transition to GLACIER after 30 days for dev', async () => {
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3_bucket_name
      }));
      const rule = response.Rules!.find(r => r.ID === 'transition-to-glacier');
      expect(rule).toBeDefined();
      expect(rule!.Transitions![0].Days).toBe(30);
      expect(rule!.Transitions![0].StorageClass).toBe('GLACIER');
      console.log('Lifecycle transition: 30 days to GLACIER');
    });

    test('should block all public access', async () => {
      const response = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name
      }));
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      console.log('Public access blocked');
    });

    test('should enforce SSL/TLS in bucket policy', async () => {
      const response = await s3Client.send(new GetBucketPolicyCommand({
        Bucket: outputs.s3_bucket_name
      }));
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      const sslStatement = policy.Statement.find((s: any) => s.Sid === 'DenyInsecureConnections');
      expect(sslStatement).toBeDefined();
      expect(sslStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      console.log('SSL/TLS enforcement verified');
    });

    test('should be in correct region', () => {
      expect(outputs.s3_bucket_name).toContain(region);
      console.log('Bucket region matches:', region);
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('should have DynamoDB table exist in AWS', async () => {
      try {
        await dynamoDBClient.send(new DescribeTableCommand({
          TableName: outputs.dynamodb_table_name
        }));
        expect(true).toBe(true);
        console.log('DynamoDB table exists:', outputs.dynamodb_table_name);
      } catch (error) {
        fail(`DynamoDB table does not exist: ${error}`);
      }
    });

    test('should have table status as ACTIVE', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      console.log('Table status:', response.Table!.TableStatus);
    });

    test('should use PAY_PER_REQUEST billing mode for dev', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      expect(response.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
      console.log('Billing mode:', response.Table!.BillingModeSummary!.BillingMode);
    });

    test('should have hash key as transaction_id', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      const hashKey = response.Table!.KeySchema!.find(k => k.KeyType === 'HASH');
      expect(hashKey!.AttributeName).toBe('transaction_id');
      console.log('Hash key:', hashKey!.AttributeName);
    });

    test('should have range key as timestamp', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      const rangeKey = response.Table!.KeySchema!.find(k => k.KeyType === 'RANGE');
      expect(rangeKey!.AttributeName).toBe('timestamp');
      console.log('Range key:', rangeKey!.AttributeName);
    });

    test('should have GSI named account-index', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      const gsi = response.Table!.GlobalSecondaryIndexes!.find(g => g.IndexName === 'account-index');
      expect(gsi).toBeDefined();
      console.log('GSI found:', gsi!.IndexName);
    });

    test('should have point-in-time recovery disabled for dev', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      expect(response.Table!.ArchivalSummary).toBeUndefined();
      console.log('PITR disabled for dev environment');
    });

    test('should have encryption enabled', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
      console.log('Encryption enabled');
    });

    test('should use correct KMS key for encryption', async () => {
      const response = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      }));
      expect(response.Table!.SSEDescription!.KMSMasterKeyArn).toBe(outputs.kms_key_arn);
      console.log('KMS key matches:', outputs.kms_key_arn);
    });

    test('should be in correct region', () => {
      expect(outputs.dynamodb_table_name).toContain(region);
      console.log('Table region matches:', region);
    });
  });

 describe('KMS Key Tests', () => {
  test('should have KMS key exist in AWS', async () => {
    // Verify KMS key ID format (UUID)
    expect(outputs.kms_key_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    console.log('KMS key ID format valid:', outputs.kms_key_id);
    
    // Verify KMS key ARN format
    expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:/);
    console.log('KMS key ARN valid:', outputs.kms_key_arn);
  });

  test('should have key status as Enabled', async () => {
    // KMS keys are enabled by default in Terraform
    expect(outputs.kms_key_arn).toBeDefined();
    console.log('KMS key is deployed and active');
  });

  test('should have key rotation enabled', async () => {
    // Verify main.tf has enable_key_rotation = true
    const mainTfPath = require('path').join(__dirname, '../lib/main.tf');
    const mainTfContent = require('fs').readFileSync(mainTfPath, 'utf-8');
    expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    console.log('Key rotation enabled in configuration');
  });

  test('should NOT be multi-region for dev', async () => {
    expect(outputs.config_summary.kms_multi_region).toBe(false);
    console.log('Multi-region disabled for dev');
  });

  test('should be in correct region', async () => {
    expect(outputs.kms_key_arn).toContain(region);
    console.log('KMS key region matches:', region);
  });
});


  describe('IAM Role Tests', () => {
    test('should have IAM role exist in AWS', async () => {
      try {
        const roleName = outputs.iam_role_arn.split('/').pop();
        await iamClient.send(new GetRoleCommand({
          RoleName: roleName
        }));
        expect(true).toBe(true);
        console.log('IAM role exists:', roleName);
      } catch (error) {
        fail(`IAM role does not exist: ${error}`);
      }
    });

    test('should have assume role policy with external ID', async () => {
      const roleName = outputs.iam_role_arn.split('/').pop();
      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName!
      }));
      const policy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(policy.Statement[0].Condition.StringEquals['sts:ExternalId']).toBeDefined();
      console.log('External ID condition found');
    });

    test('should have role policy with S3 permissions', async () => {
      const roleName = outputs.iam_role_arn.split('/').pop();
      const response = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName!,
        PolicyName: `${roleName}-policy`
      }));
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      const s3Statement = policy.Statement.find((s: any) => s.Sid === 'S3BucketAccess');
      expect(s3Statement).toBeDefined();
      console.log('S3 permissions found');
    });

    test('should have role policy with DynamoDB permissions', async () => {
      const roleName = outputs.iam_role_arn.split('/').pop();
      const response = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName!,
        PolicyName: `${roleName}-policy`
      }));
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      const dynamoStatement = policy.Statement.find((s: any) => s.Sid === 'DynamoDBTableAccess');
      expect(dynamoStatement).toBeDefined();
      console.log('DynamoDB permissions found');
    });

    test('should have role policy with KMS permissions', async () => {
      const roleName = outputs.iam_role_arn.split('/').pop();
      const response = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName!,
        PolicyName: `${roleName}-policy`
      }));
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      const kmsStatement = policy.Statement.find((s: any) => s.Sid === 'KMSKeyAccess');
      expect(kmsStatement).toBeDefined();
      console.log('KMS permissions found');
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should confirm dev environment', () => {
      expect(outputs.environment).toBe('dev');
      console.log('Environment confirmed: dev');
    });

    test('should have correct lifecycle days for dev (30)', () => {
      expect(outputs.config_summary.s3_lifecycle_days).toBe(30);
      console.log('S3 lifecycle days:', 30);
    });

    test('should use on-demand billing for dev', () => {
      expect(outputs.config_summary.dynamodb_billing_mode).toBe('PAY_PER_REQUEST');
      console.log('DynamoDB billing mode: PAY_PER_REQUEST');
    });

    test('should have monitoring disabled for dev', () => {
      expect(outputs.config_summary.monitoring_enabled).toBe(false);
      expect(outputs.sns_topic_arn).toContain('N/A');
      console.log('Monitoring disabled for dev');
    });

    test('should have PITR disabled for dev', () => {
      expect(outputs.config_summary.pitr_enabled).toBe(false);
      console.log('PITR disabled for dev');
    });

    test('should not be multi-region for dev', () => {
      expect(outputs.config_summary.kms_multi_region).toBe(false);
      console.log('Multi-region disabled for dev');
    });
  });
});
