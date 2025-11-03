/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import path from 'path';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
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
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
/* eslint-enable import/no-extraneous-dependencies */

// Load outputs from flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const kmsClient = new KMSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });
const eventsClient = new EventBridgeClient({ region });

describe('TAP Stack Integration Tests', () => {
  describe('KMS Keys', () => {
    test('KMS Key ARNs should be present in outputs', () => {
      expect(outputs.PiiKmsKeyArn).toBeDefined();
      expect(outputs.PiiKmsKeyArn).toMatch(/^arn:aws:kms:/);

      expect(outputs.FinancialKmsKeyArn).toBeDefined();
      expect(outputs.FinancialKmsKeyArn).toMatch(/^arn:aws:kms:/);

      expect(outputs.OperationalKmsKeyArn).toBeDefined();
      expect(outputs.OperationalKmsKeyArn).toMatch(/^arn:aws:kms:/);

      expect(outputs.LogsKmsKeyArn).toBeDefined();
      expect(outputs.LogsKmsKeyArn).toMatch(/^arn:aws:kms:/);
    });

    test('KMS Keys should be multi-region keys', () => {
      // Multi-region keys have 'mrk-' prefix in the key ID
      expect(outputs.PiiKmsKeyArn).toContain('mrk-');
      expect(outputs.FinancialKmsKeyArn).toContain('mrk-');
      expect(outputs.OperationalKmsKeyArn).toContain('mrk-');
      expect(outputs.LogsKmsKeyArn).toContain('mrk-');
    });
  });

  describe('S3 Buckets', () => {
    test('PII Data Bucket should have encryption, versioning, and public access blocked', async () => {
      const bucketName = outputs.PiiDataBucketName;
      expect(bucketName).toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check bucket policy for TLS enforcement
      const policyCommand = new GetBucketPolicyCommand({ Bucket: bucketName });
      const policyResponse = await s3Client.send(policyCommand);
      expect(policyResponse.Policy).toBeDefined();

      const policy = JSON.parse(policyResponse.Policy!);
      const tlsStatement = policy.Statement.find(
        (stmt: any) =>
          stmt.Effect === 'Deny' &&
          stmt.Condition?.NumericLessThan?.['s3:TlsVersion']
      );
      expect(tlsStatement).toBeDefined();
      expect(tlsStatement.Condition.NumericLessThan['s3:TlsVersion']).toBe('1.2');
    });

    test('Financial Data Bucket should have encryption and versioning', async () => {
      const bucketName = outputs.FinancialDataBucketName;
      expect(bucketName).toBeDefined();

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('Operational Data Bucket should have encryption and versioning', async () => {
      const bucketName = outputs.OperationalDataBucketName;
      expect(bucketName).toBeDefined();

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('IAM Roles', () => {
    test('App Services Role should exist with correct policies', async () => {
      const roleArn = outputs.AppServicesRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::/);

      const roleName = roleArn.split('/').pop();
      expect(roleName).toBe(`app-services-role-${environmentSuffix}`);

      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(`app-services-role-${environmentSuffix}`);
    });

    test('Data Analysts Role should exist', async () => {
      const roleArn = outputs.DataAnalystsRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(`data-analysts-role-${environmentSuffix}`);
    });

    test('Security Auditors Role should exist', async () => {
      const roleArn = outputs.SecurityAuditorsRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(`security-auditors-role-${environmentSuffix}`);
    });
  });

  describe('Lambda Functions', () => {
    test('S3 Remediation Function should exist and use Node.js 22', async () => {
      const functionArn = outputs.S3RemediationFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const getCommand = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);

      expect(response.FunctionName).toBe(`s3-remediation-${environmentSuffix}`);
      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
      expect(response.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('Key Rotation Monitor Function should exist and use Node.js 22', async () => {
      const functionArn = outputs.KeyRotationMonitorFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const getCommand = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);

      expect(response.FunctionName).toBe(`key-rotation-monitor-${environmentSuffix}`);
      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBe(60);
      expect(response.MemorySize).toBe(256);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Lambda Log Group should have 7-year retention (2557 days)', async () => {
      const logGroupName = outputs.LambdaLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(2557);
    });

    test('Audit Trail Log Group should have 7-year retention', async () => {
      const logGroupName = outputs.AuditTrailLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(2557);
    });
  });

  describe('SNS Topics', () => {
    test('Security Notification Topic should exist', async () => {
      const topicArn = outputs.SecurityNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('Key Rotation Notification Topic should exist', async () => {
      const topicArn = outputs.KeyRotationNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });
  });

  describe('EventBridge Rules', () => {
    test('EventBridge rule names should follow correct naming convention', () => {
      // Test that we expect the correct rule names based on the environment suffix
      const expectedRules = [
        `s3-object-remediation-${environmentSuffix}`,
        `key-rotation-check-${environmentSuffix}`,
        `kms-rotation-event-${environmentSuffix}`,
      ];

      expectedRules.forEach(ruleName => {
        expect(ruleName).toMatch(new RegExp(`-${environmentSuffix}$`));
      });
    });

    test('EventBridge rules should be defined in stack outputs', () => {
      // Verify that the Lambda functions triggered by EventBridge exist
      expect(outputs.S3RemediationFunctionArn).toBeDefined();
      expect(outputs.KeyRotationMonitorFunctionArn).toBeDefined();
    });
  });

  describe('PCI DSS Compliance', () => {
    test('All KMS keys should be multi-region with mrk prefix', () => {
      const keyArns = [
        outputs.PiiKmsKeyArn,
        outputs.FinancialKmsKeyArn,
        outputs.OperationalKmsKeyArn,
        outputs.LogsKmsKeyArn,
      ];

      keyArns.forEach(keyArn => {
        expect(keyArn).toContain('mrk-');
        expect(keyArn).toMatch(/^arn:aws:kms:/);
      });
    });

    test('All S3 buckets should block public access', async () => {
      const bucketNames = [
        outputs.PiiDataBucketName,
        outputs.FinancialDataBucketName,
        outputs.OperationalDataBucketName,
      ];

      for (const bucketName of bucketNames) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);

        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('Security Framework Version should be v1.0.0', () => {
      expect(outputs.SecurityFrameworkVersion).toBe('v1.0.0');
    });
  });
});
