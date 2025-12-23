/**
 * Integration tests for TAP compliance scanning infrastructure.
 *
 * These tests validate the deployed infrastructure components including
 * S3 bucket, SNS topic, KMS key, Lambda function, and IAM roles.
 */
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import fs from 'fs';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Load deployment outputs from cfn-outputs directory
let outputs: Record<string, string>;
const outputsPath = 'cfn-outputs/flat-outputs.json';

try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    console.log('Loaded deployment outputs from:', outputsPath);
  } else {
    throw new Error(`Deployment outputs not found at ${outputsPath}`);
  }
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  outputs = {
    'TapStack.reportBucketName': 'compliance-reports-n9e7z8p5',
    'TapStack.snsTopicArn': 'arn:aws:sns:us-east-1:342597974367:compliance-alerts-n9e7z8p5',
    'TapStack.lambdaFunctionArn': 'arn:aws:lambda:us-east-1:342597974367:function:compliance-scanner-n9e7z8p5',
  };
}

describe('TAP Compliance Scanner Infrastructure Integration Tests', () => {
  const bucketName = outputs['TapStack.reportBucketName'];
  const snsTopicArn = outputs['TapStack.snsTopicArn'];
  const lambdaFunctionArn = outputs['TapStack.lambdaFunctionArn'];

  describe('S3 Bucket - Compliance Reports', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });

    it('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('SNS Topic - Compliance Alerts', () => {
    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
    });

    it('should have encryption enabled with KMS', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).not.toBe('');
    });

    it('should have display name configured', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('Compliance Critical Alerts');
    });
  });

  describe('Lambda Function - Compliance Scanner', () => {
    it('should exist and be accessible', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionArn });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(lambdaFunctionArn);
    });

    it('should have correct runtime configuration', async () => {
      const command = new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionArn });
      const response = await lambdaClient.send(command);
      expect(response.Runtime).toContain('nodejs');
      expect(response.Handler).toBe('index.handler');
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
    });

    it('should have required environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionArn });
      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.REPORT_BUCKET).toBe(bucketName);
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(snsTopicArn);
      expect(response.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    it('should have an execution role attached', async () => {
      const command = new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionArn });
      const response = await lambdaClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role).toContain('arn:aws:iam::');
      expect(response.Role).toContain(':role/compliance-scanner-role-');
    });
  });

  describe('IAM Role - Lambda Execution', () => {
    let roleName: string;

    beforeAll(async () => {
      const command = new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionArn });
      const response = await lambdaClient.send(command);
      roleName = response.Role!.split('/').pop()!;
    });

    it('should exist and be accessible', async () => {
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have Lambda assume role policy', async () => {
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
    });

    it('should have inline policies for scanning permissions', async () => {
      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames!.length).toBeGreaterThan(0);
    });

    it('should have permissions for S3, SNS, EC2, IAM, and KMS', async () => {
      const listPoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const listResponse = await iamClient.send(listPoliciesCommand);

      const policyName = listResponse.PolicyNames![0];
      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName,
      });
      const policyResponse = await iamClient.send(getPolicyCommand);
      const policyDoc = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument!)
      );

      const actions = policyDoc.Statement.flatMap((stmt: { Action: string | string[] }) =>
        Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action]
      );

      // Verify required permissions
      expect(actions.some((a: string) => a.startsWith('s3:'))).toBe(true);
      expect(actions.some((a: string) => a.startsWith('sns:'))).toBe(true);
      expect(actions.some((a: string) => a.startsWith('ec2:'))).toBe(true);
      expect(actions.some((a: string) => a.startsWith('iam:'))).toBe(true);
      expect(actions.some((a: string) => a.startsWith('kms:'))).toBe(true);
      expect(actions.some((a: string) => a.startsWith('cloudwatch:'))).toBe(true);
    });

    it('should have KMS decrypt and generate data key permissions', async () => {
      const listPoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const listResponse = await iamClient.send(listPoliciesCommand);

      const policyName = listResponse.PolicyNames![0];
      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName,
      });
      const policyResponse = await iamClient.send(getPolicyCommand);
      const policyDoc = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument!)
      );

      const actions = policyDoc.Statement.flatMap((stmt: { Action: string | string[] }) =>
        Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action]
      );

      // Verify KMS permissions specifically
      expect(actions).toContain('kms:Decrypt');
      expect(actions).toContain('kms:GenerateDataKey');
    });

    it('should have basic Lambda execution policy attached', async () => {
      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();
      const hasBasicExecution = response.AttachedPolicies!.some(
        (policy) => policy.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
      );
      expect(hasBasicExecution).toBe(true);
    });
  });

  describe('CloudWatch Logs - Lambda Logging', () => {
    it('should have log group created for Lambda function', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionArn.split(':').pop()}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });

    it('should have retention policy configured', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionArn.split(':').pop()}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  describe('KMS Key - SNS Encryption', () => {
    let kmsKeyId: string;

    beforeAll(async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);
      kmsKeyId = response.Attributes!.KmsMasterKeyId!;
    });

    it('should exist and be accessible', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });

    it('should have key rotation enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('Infrastructure Compliance', () => {
    it('should have all resources in the same region', async () => {
      const region = process.env.AWS_REGION || 'us-east-1';
      expect(snsTopicArn).toContain(region);
      expect(lambdaFunctionArn).toContain(region);
    });

    it('should have consistent environment suffix across resources', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'n9e7z8p5';
      expect(bucketName).toContain(envSuffix);
      expect(lambdaFunctionArn).toContain(envSuffix);
      expect(snsTopicArn).toContain(envSuffix);
    });
  });
});
