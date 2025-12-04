import * as fs from 'fs';
import * as path from 'path';
import { Lambda } from '@aws-sdk/client-lambda';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { IAM } from '@aws-sdk/client-iam';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

describe('Lambda Transaction Processing Infrastructure - Integration Tests', () => {
  let outputs: Record<string, string>;
  let lambda: Lambda;
  let logs: CloudWatchLogs;
  let iam: IAM;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    lambda = new Lambda({ region: AWS_REGION });
    logs = new CloudWatchLogs({ region: AWS_REGION });
    iam = new IAM({ region: AWS_REGION });
  });

  describe('Lambda Functions', () => {
    it('should have deployed payment-validator function', async () => {
      expect(outputs.paymentValidatorArn).toBeDefined();
      const functionName = outputs.paymentValidatorArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('payment-validator');
    });

    it('should have deployed fraud-detector function', async () => {
      expect(outputs.fraudDetectorArn).toBeDefined();
      const functionName = outputs.fraudDetectorArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('fraud-detector');
    });

    it('should have deployed notification-sender function', async () => {
      expect(outputs.notificationSenderArn).toBeDefined();
      const functionName = outputs.notificationSenderArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('notification-sender');
    });
  });

  describe('Lambda Configuration', () => {
    it('payment-validator should use ARM64 architecture (Graviton2)', async () => {
      const functionName = outputs.paymentValidatorArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration?.Architectures).toEqual(['arm64']);
    });

    it('fraud-detector should use ARM64 architecture (Graviton2)', async () => {
      const functionName = outputs.fraudDetectorArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration?.Architectures).toEqual(['arm64']);
    });

    it('notification-sender should use ARM64 architecture (Graviton2)', async () => {
      const functionName = outputs.notificationSenderArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration?.Architectures).toEqual(['arm64']);
    });

    it('payment-validator should have 512MB memory', async () => {
      const functionName = outputs.paymentValidatorArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    it('fraud-detector should have 256MB memory', async () => {
      const functionName = outputs.fraudDetectorArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    it('notification-sender should have 128MB memory', async () => {
      const functionName = outputs.notificationSenderArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName });
      expect(response.Configuration?.MemorySize).toBe(128);
    });

    it('all functions should have X-Ray tracing enabled', async () => {
      const functions = [
        outputs.paymentValidatorArn,
        outputs.fraudDetectorArn,
        outputs.notificationSenderArn,
      ];

      for (const arn of functions) {
        const functionName = arn.split(':').pop();
        const response = await lambda.getFunction({ FunctionName: functionName });
        expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      }
    });
  });

  describe('Function URLs', () => {
    it('should have function URL for payment-validator', () => {
      expect(outputs.paymentValidatorUrl).toBeDefined();
      expect(outputs.paymentValidatorUrl).toMatch(/^https:\/\/.*\.lambda-url\..*\.on\.aws\/$/);
    });

    it('should have function URL for fraud-detector', () => {
      expect(outputs.fraudDetectorUrl).toBeDefined();
      expect(outputs.fraudDetectorUrl).toMatch(/^https:\/\/.*\.lambda-url\..*\.on\.aws\/$/);
    });

    it('should have function URL for notification-sender', () => {
      expect(outputs.notificationSenderUrl).toBeDefined();
      expect(outputs.notificationSenderUrl).toMatch(/^https:\/\/.*\.lambda-url\..*\.on\.aws\/$/);
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have log group for payment-validator with 7-day retention', async () => {
      const logGroupName = outputs.paymentValidatorLogGroup;
      const response = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName });
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });

    it('should have log group for fraud-detector with 7-day retention', async () => {
      const logGroupName = outputs.fraudDetectorLogGroup;
      const response = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName });
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });

    it('should have log group for notification-sender with 7-day retention', async () => {
      const logGroupName = outputs.notificationSenderLogGroup;
      const response = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName });
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('IAM Roles', () => {
    it('payment-validator should have IAM role with X-Ray permissions', async () => {
      const roleArn = outputs.paymentValidatorRoleArn;
      const roleName = roleArn.split('/').pop();
      const response = await iam.listAttachedRolePolicies({ RoleName: roleName });
      const xrayPolicy = response.AttachedPolicies?.find((p) =>
        p.PolicyArn?.includes('AWSXRayDaemonWriteAccess')
      );
      expect(xrayPolicy).toBeDefined();
    });

    it('fraud-detector should have IAM role with X-Ray permissions', async () => {
      const roleArn = outputs.fraudDetectorRoleArn;
      const roleName = roleArn.split('/').pop();
      const response = await iam.listAttachedRolePolicies({ RoleName: roleName });
      const xrayPolicy = response.AttachedPolicies?.find((p) =>
        p.PolicyArn?.includes('AWSXRayDaemonWriteAccess')
      );
      expect(xrayPolicy).toBeDefined();
    });

    it('notification-sender should have IAM role with X-Ray permissions', async () => {
      const roleArn = outputs.notificationSenderRoleArn;
      const roleName = roleArn.split('/').pop();
      const response = await iam.listAttachedRolePolicies({ RoleName: roleName });
      const xrayPolicy = response.AttachedPolicies?.find((p) =>
        p.PolicyArn?.includes('AWSXRayDaemonWriteAccess')
      );
      expect(xrayPolicy).toBeDefined();
    });

    it('all functions should have Lambda basic execution policy', async () => {
      const roleArns = [
        outputs.paymentValidatorRoleArn,
        outputs.fraudDetectorRoleArn,
        outputs.notificationSenderRoleArn,
      ];

      for (const roleArn of roleArns) {
        const roleName = roleArn.split('/').pop();
        const response = await iam.listAttachedRolePolicies({ RoleName: roleName });
        const basicPolicy = response.AttachedPolicies?.find((p) =>
          p.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
        );
        expect(basicPolicy).toBeDefined();
      }
    });
  });

  describe('Resource Naming', () => {
    it('all resources should include environment suffix', () => {
      const resources = [
        outputs.paymentValidatorArn,
        outputs.fraudDetectorArn,
        outputs.notificationSenderArn,
        outputs.paymentValidatorRoleArn,
        outputs.fraudDetectorRoleArn,
        outputs.notificationSenderRoleArn,
      ];

      // Get environment suffix from environment variable or default to pr pattern
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const suffixPattern = new RegExp(`-${envSuffix}`);

      for (const resource of resources) {
        expect(resource).toMatch(suffixPattern);
      }
    });
  });
});
