import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

interface StackOutputs {
  's3-kms-key-id': string;
  'logs-kms-key-id': string;
  's3-bucket-name': string;
  's3-bucket-arn': string;
  'payment-role-arn': string;
  'cross-account-role-arn': string;
  'audit-log-group-name': string;
  'compliance-topic-arn': string;
  'security-scp-id'?: string;
}

describe('TAP Stack Integration Tests', () => {
  let outputs: StackOutputs;
  let s3Client: S3Client;
  let kmsClient: KMSClient;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;
  let snsClient: SNSClient;
  const region = process.env.AWS_REGION_OVERRIDE || 'ap-southeast-1';

  beforeAll(() => {
    console.log('\n========================================');
    console.log('TAP Stack Integration Tests - Starting');
    console.log('========================================\n');

    // Load outputs from flat-outputs.json
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    console.log(`Loading outputs from: ${outputsPath}`);

    const outputsData = fs.readFileSync(outputsPath, 'utf-8');
    const parsedData = JSON.parse(outputsData);
    
    // Handle nested structure - get the first (and likely only) stack
    const stackKey = Object.keys(parsedData)[0];
    outputs = parsedData[stackKey];

    console.log('\nDeployment Outputs Loaded:');
    console.log(JSON.stringify(outputs, null, 2));
    console.log(`\nAWS Region: ${region}\n`);

    // Initialize AWS clients
    console.log('Initializing AWS SDK clients...');
    const clientConfig = { region };
    
    s3Client = new S3Client(clientConfig);
    kmsClient = new KMSClient(clientConfig);
    iamClient = new IAMClient(clientConfig);
    logsClient = new CloudWatchLogsClient(clientConfig);
    snsClient = new SNSClient(clientConfig);
    console.log('AWS SDK clients initialized successfully\n');
  });

  afterAll(async () => {
    console.log('\n========================================');
    console.log('Cleaning up AWS SDK clients...');
    s3Client.destroy();
    kmsClient.destroy();
    iamClient.destroy();
    logsClient.destroy();
    snsClient.destroy();
    console.log('All clients destroyed');
    console.log('========================================\n');
  });

  describe('Output Validation Tests', () => {
    test('Should load deployment outputs successfully', () => {
      console.log('\n--- Testing Output Loading ---');
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      console.log('✓ Outputs loaded successfully');
    });

    test('Should have all required KMS key IDs', () => {
      console.log('\n--- Testing KMS Key Outputs ---');
      console.log(`S3 KMS Key ID: ${outputs['s3-kms-key-id']}`);
      console.log(`Logs KMS Key ID: ${outputs['logs-kms-key-id']}`);
      
      expect(outputs['s3-kms-key-id']).toBeDefined();
      expect(outputs['logs-kms-key-id']).toBeDefined();
      expect(outputs['s3-kms-key-id']).not.toBe(outputs['logs-kms-key-id']);
      console.log('✓ KMS key IDs are present and unique');
    });

    test('Should have all required S3 outputs', () => {
      console.log('\n--- Testing S3 Outputs ---');
      console.log(`S3 Bucket Name: ${outputs['s3-bucket-name']}`);
      console.log(`S3 Bucket ARN: ${outputs['s3-bucket-arn']}`);
      
      expect(outputs['s3-bucket-name']).toBeDefined();
      expect(outputs['s3-bucket-arn']).toBeDefined();
      expect(outputs['s3-bucket-name']).toContain('payment-data-bucket');
      console.log('✓ S3 outputs are present');
    });

    test('Should have all required IAM role ARNs', () => {
      console.log('\n--- Testing IAM Outputs ---');
      console.log(`Payment Role ARN: ${outputs['payment-role-arn']}`);
      console.log(`Cross-Account Role ARN: ${outputs['cross-account-role-arn']}`);
      
      expect(outputs['payment-role-arn']).toBeDefined();
      expect(outputs['cross-account-role-arn']).toBeDefined();
      expect(outputs['payment-role-arn']).toContain('payment-processing-role');
      expect(outputs['cross-account-role-arn']).toContain('cross-account-access-role');
      console.log('✓ IAM role ARNs are present');
    });

    test('Should have all required monitoring outputs', () => {
      console.log('\n--- Testing Monitoring Outputs ---');
      console.log(`Audit Log Group: ${outputs['audit-log-group-name']}`);
      console.log(`Compliance Topic ARN: ${outputs['compliance-topic-arn']}`);
      
      expect(outputs['audit-log-group-name']).toBeDefined();
      expect(outputs['compliance-topic-arn']).toBeDefined();
      expect(outputs['audit-log-group-name']).toContain('/aws/payment-processing/audit');
      console.log('✓ Monitoring outputs are present');
    });
  });

  describe('KMS Integration Tests', () => {
    test('S3 KMS key should exist and be enabled', async () => {
      console.log('\n--- Testing S3 KMS Key ---');
      const keyId = outputs['s3-kms-key-id'];
      console.log(`Key ID: ${keyId}`);

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(describeCommand);

      console.log(`Key State: ${response.KeyMetadata?.KeyState}`);
      console.log(`Multi-Region: ${response.KeyMetadata?.MultiRegion}`);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      console.log('✓ S3 KMS key is enabled');
    });

    test('S3 KMS key should have rotation enabled', async () => {
      console.log('\n--- Testing S3 KMS Key Rotation ---');
      const keyId = outputs['s3-kms-key-id'];

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(rotationCommand);

      console.log(`Rotation Enabled: ${response.KeyRotationEnabled}`);
      expect(response.KeyRotationEnabled).toBe(true);
      console.log('✓ S3 KMS key rotation is enabled');
    });

    test('Logs KMS key should exist and be enabled', async () => {
      console.log('\n--- Testing Logs KMS Key ---');
      const keyId = outputs['logs-kms-key-id'];
      console.log(`Key ID: ${keyId}`);

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(describeCommand);

      console.log(`Key State: ${response.KeyMetadata?.KeyState}`);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      console.log('✓ Logs KMS key is enabled');
    });

    test('Logs KMS key should have rotation enabled', async () => {
      console.log('\n--- Testing Logs KMS Key Rotation ---');
      const keyId = outputs['logs-kms-key-id'];

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(rotationCommand);

      console.log(`Rotation Enabled: ${response.KeyRotationEnabled}`);
      expect(response.KeyRotationEnabled).toBe(true);
      console.log('✓ Logs KMS key rotation is enabled');
    });
  });

  describe('S3 Integration Tests', () => {
    test('S3 bucket should be accessible', async () => {
      console.log('\n--- Testing S3 Bucket Accessibility ---');
      const bucketName = outputs['s3-bucket-name'];
      console.log(`Bucket Name: ${bucketName}`);

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
      console.log('✓ S3 bucket is accessible');
    });

    test('S3 bucket should have versioning enabled', async () => {
      console.log('\n--- Testing S3 Bucket Versioning ---');
      const bucketName = outputs['s3-bucket-name'];

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      console.log(`Versioning Status: ${response.Status}`);
      expect(response.Status).toBe('Enabled');
      console.log('✓ S3 versioning is enabled');
    });

    test('S3 bucket should have KMS encryption', async () => {
      console.log('\n--- Testing S3 Bucket Encryption ---');
      const bucketName = outputs['s3-bucket-name'];
      const expectedKeyId = outputs['s3-kms-key-id'];

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      console.log(`SSE Algorithm: ${rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm}`);
      console.log(`Bucket Key Enabled: ${rule?.BucketKeyEnabled}`);

      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.BucketKeyEnabled).toBe(true);
      
      const kmsKeyArn = rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      expect(kmsKeyArn).toContain(expectedKeyId);
      console.log('✓ S3 KMS encryption is configured correctly');
    });

    test('S3 bucket should block all public access', async () => {
      console.log('\n--- Testing S3 Public Access Block ---');
      const bucketName = outputs['s3-bucket-name'];

      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const config = response.PublicAccessBlockConfiguration;
      console.log(`Block Public ACLs: ${config?.BlockPublicAcls}`);
      console.log(`Block Public Policy: ${config?.BlockPublicPolicy}`);
      console.log(`Ignore Public ACLs: ${config?.IgnorePublicAcls}`);
      console.log(`Restrict Public Buckets: ${config?.RestrictPublicBuckets}`);

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
      console.log('✓ All public access is blocked');
    });
  });

  describe('IAM Integration Tests', () => {
    test('Payment processing role should exist', async () => {
      console.log('\n--- Testing Payment Processing Role ---');
      const roleArn = outputs['payment-role-arn'];
      const roleName = roleArn.split('/').pop()!;
      console.log(`Role Name: ${roleName}`);

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      console.log(`Max Session Duration: ${response.Role?.MaxSessionDuration}s`);
      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
      console.log('✓ Payment role exists with correct session duration');
    });

    test('Payment role should have MFA requirement', async () => {
      console.log('\n--- Testing Payment Role MFA ---');
      const roleArn = outputs['payment-role-arn'];
      const roleName = roleArn.split('/').pop()!;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const assumePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      const statement = assumePolicy.Statement[0];

      console.log(`MFA Required: ${statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']}`);
      expect(statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('true');
      console.log('✓ MFA is required for payment role');
    });

    test('Payment role should have attached policies', async () => {
      console.log('\n--- Testing Payment Role Policies ---');
      const roleArn = outputs['payment-role-arn'];
      const roleName = roleArn.split('/').pop()!;

      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      console.log(`Total Policies: ${response.AttachedPolicies?.length || 0}`);
      response.AttachedPolicies?.forEach((policy, idx) => {
        console.log(`  ${idx + 1}. ${policy.PolicyName}`);
      });

      expect(response.AttachedPolicies).toBeDefined();
      expect(response.AttachedPolicies!.length).toBeGreaterThan(0);
      console.log('✓ Payment role has attached policies');
    });

    test('Cross-account role should exist', async () => {
      console.log('\n--- Testing Cross-Account Role ---');
      const roleArn = outputs['cross-account-role-arn'];
      const roleName = roleArn.split('/').pop()!;
      console.log(`Role Name: ${roleName}`);

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      console.log('✓ Cross-account role exists');
    });

    test('Cross-account role should have external ID requirement', async () => {
      console.log('\n--- Testing Cross-Account External ID ---');
      const roleArn = outputs['cross-account-role-arn'];
      const roleName = roleArn.split('/').pop()!;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const assumePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      const statement = assumePolicy.Statement[0];

      console.log(`External ID: ${statement.Condition?.StringEquals?.['sts:ExternalId']}`);
      expect(statement.Condition?.StringEquals?.['sts:ExternalId']).toBe(
        'payment-processing-external-id'
      );
      console.log('✓ External ID is required for cross-account role');
    });
  });

  describe('Monitoring Integration Tests', () => {
    test('Audit log group should exist', async () => {
      console.log('\n--- Testing Audit Log Group ---');
      const logGroupName = outputs['audit-log-group-name'];
      console.log(`Log Group Name: ${logGroupName}`);

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      console.log(`Retention Days: ${logGroup.retentionInDays}`);
      console.log(`Encrypted: ${!!logGroup.kmsKeyId}`);

      expect(logGroup.logGroupName).toBe(logGroupName);
      console.log('✓ Audit log group exists');
    });

    test('Audit log group should have encryption', async () => {
      console.log('\n--- Testing Log Group Encryption ---');
      const logGroupName = outputs['audit-log-group-name'];
      const expectedKeyId = outputs['logs-kms-key-id'];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups![0];
      console.log(`KMS Key ID: ${logGroup.kmsKeyId}`);

      expect(logGroup.kmsKeyId).toBeDefined();
      expect(logGroup.kmsKeyId).toContain(expectedKeyId);
      console.log('✓ Log group is encrypted with correct KMS key');
    });

    test('Audit log group should have retention policy', async () => {
      console.log('\n--- Testing Log Group Retention ---');
      const logGroupName = outputs['audit-log-group-name'];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups![0];
      console.log(`Retention Days: ${logGroup.retentionInDays}`);

      expect(logGroup.retentionInDays).toBe(365);
      console.log('✓ Log group has 365-day retention');
    });

    test('Compliance SNS topic should exist', async () => {
      console.log('\n--- Testing Compliance SNS Topic ---');
      const topicArn = outputs['compliance-topic-arn'];
      console.log(`Topic ARN: ${topicArn}`);

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      console.log(`Display Name: ${response.Attributes?.DisplayName}`);
      expect(response.Attributes).toBeDefined();
      console.log('✓ SNS topic exists');
    });

    test('Compliance SNS topic should have KMS encryption', async () => {
      console.log('\n--- Testing SNS Topic Encryption ---');
      const topicArn = outputs['compliance-topic-arn'];

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      console.log(`KMS Master Key: ${response.Attributes?.KmsMasterKeyId || 'None'}`);
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      console.log('✓ SNS topic is encrypted');
    });
  });
});
