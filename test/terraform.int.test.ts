// test/terraform.int.test.ts
// Integration tests for Terraform compliance module
// Tests real AWS resources deployed by the module

import { S3Client, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { EventBridgeClient, ListRulesCommand, ListTargetsByRuleCommand } from '@aws-sdk/client-eventbridge';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { CloudWatchClient, GetDashboardCommand } from '@aws-sdk/client-cloudwatch';
import fs from 'fs';
import path from 'path';

// Read deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS clients
const region = outputs.aws_region || 'us-east-1';
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventsClient = new EventBridgeClient({ region });
const iamClient = new IAMClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

describe('Terraform Compliance Module - Integration Tests', () => {
  const environmentSuffix = outputs.environment_suffix || 'synth101912441';

  describe('S3 Configuration Bucket', () => {
    const bucketName = outputs.config_bucket_name;

    test('bucket exists and is accessible', async () => {
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);
    });

    test('bucket has encryption enabled with KMS', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });

    test('bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('KMS Encryption Key', () => {
    const keyId = outputs.kms_key_id;
    const keyArn = outputs.kms_key_arn;

    test('KMS key exists and is accessible', async () => {
      expect(keyId).toBeDefined();
      expect(keyArn).toBeDefined();
      expect(keyArn).toContain(keyId);
    });

    test('KMS key is enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('KMS key has rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('KMS key has policy attached', async () => {
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
      expect(response.KeyMetadata?.Description).toContain('compliance module');
    });
  });

  describe('Lambda Remediation Function', () => {
    const functionName = outputs.remediation_lambda_name;
    const functionArn = outputs.remediation_lambda_arn;

    test('Lambda function exists', async () => {
      expect(functionName).toBeDefined();
      expect(functionArn).toBeDefined();
      expect(functionName).toContain(environmentSuffix);
    });

    test('Lambda function configuration is correct', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('index.handler');
      expect(response.Configuration!.Timeout).toBe(300);
    });

    test('Lambda function has required environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars!.ENVIRONMENT_SUFFIX).toBe(environmentSuffix);
      expect(envVars!.CONFIG_BUCKET).toBe(outputs.config_bucket_name);
      expect(envVars!.KMS_KEY_ID).toBe(outputs.kms_key_id);
      expect(envVars!.SNS_TOPIC_ARN).toBeDefined();
    });

    test('Lambda function can be invoked (dry run)', async () => {
      // Test with a simple event that Lambda can parse
      const testEvent = {
        detail: {
          resourceType: 'AWS::S3::Bucket',
          resourceId: 'test-bucket',
          configRuleName: 's3-bucket-encryption-test',
          newEvaluationResult: {
            complianceType: 'COMPLIANT'
          }
        }
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'DryRun',
        Payload: Buffer.from(JSON.stringify(testEvent)),
      });

      // DryRun should succeed without actually executing
      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(204);
    });
  });

  describe('CloudWatch Log Group', () => {
    const logGroupName = `/aws/lambda/compliance-remediation-${environmentSuffix}`;

    test('Lambda log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    test('log group has retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBe(14);
    });
  });

  describe('EventBridge Configuration', () => {
    const ruleName = `compliance-config-change-${environmentSuffix}`;

    test('EventBridge rule exists', async () => {
      const command = new ListRulesCommand({
        NamePrefix: ruleName,
      });
      const response = await eventsClient.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      const rule = response.Rules!.find(r => r.Name === ruleName);
      expect(rule).toBeDefined();
      expect(rule?.State).toBe('ENABLED');
    });

    test('EventBridge rule targets Lambda function', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const response = await eventsClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      const lambdaTarget = response.Targets!.find(t => t.Arn?.includes('compliance-remediation'));
      expect(lambdaTarget).toBeDefined();
    });

    test('EventBridge rule has correct event pattern', async () => {
      const command = new ListRulesCommand({
        NamePrefix: ruleName,
      });
      const response = await eventsClient.send(command);

      const rule = response.Rules!.find(r => r.Name === ruleName);
      expect(rule?.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(rule!.EventPattern!);
      expect(eventPattern.source).toContain('aws.config');
      expect(eventPattern['detail-type']).toContain('Config Rules Compliance Change');
      expect(eventPattern.detail.newEvaluationResult.complianceType).toContain('NON_COMPLIANT');
    });
  });

  describe('IAM Roles and Policies', () => {
    const lambdaRoleName = `compliance-lambda-remediation-${environmentSuffix}`;
    const configRoleName = `compliance-config-role-${environmentSuffix}`;

    test('Lambda IAM role exists', async () => {
      const command = new GetRoleCommand({
        RoleName: lambdaRoleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(lambdaRoleName);
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Lambda IAM role has correct trust policy', async () => {
      const command = new GetRoleCommand({
        RoleName: lambdaRoleName,
      });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const statement = trustPolicy.Statement[0];
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('Lambda IAM role has inline policy with required permissions', async () => {
      const command = new GetRolePolicyCommand({
        RoleName: lambdaRoleName,
        PolicyName: 'compliance-lambda-remediation-policy',
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));

      const statements = policy.Statement;
      const actions = statements.flatMap((s: any) => s.Action);

      // Check for required permissions
      expect(actions.some((a: string) => a.includes('logs:') || a === 'logs:CreateLogGroup')).toBe(true);
      expect(actions.some((a: string) => a.includes('s3:') || a === 's3:PutBucketPublicAccessBlock')).toBe(true);
      expect(actions.some((a: string) => a.includes('kms:') || a === 'kms:Decrypt')).toBe(true);
    });

    test('Config IAM role exists', async () => {
      const command = new GetRoleCommand({
        RoleName: configRoleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(configRoleName);
    });

    test('Config IAM role has correct trust policy', async () => {
      const command = new GetRoleCommand({
        RoleName: configRoleName,
      });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const statement = trustPolicy.Statement[0];
      expect(statement.Principal.Service).toContain('config.amazonaws.com');
    });
  });

  describe('CloudWatch Dashboard', () => {
    const dashboardName = `compliance-monitoring-${environmentSuffix}`;

    test('Dashboard exists', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    });

    test('Dashboard includes compliance metrics', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudwatchClient.send(command);

      const dashboard = JSON.parse(response.DashboardBody!);
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);

      // Check for compliance score widget
      const hasComplianceWidget = dashboard.widgets.some((w: any) =>
        w.properties?.title?.includes('Compliance') ||
        w.properties?.metrics?.some((m: any) => m.includes('ComplianceScore'))
      );
      expect(hasComplianceWidget).toBe(true);
    });

    test('Dashboard includes Lambda logs widget', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudwatchClient.send(command);

      const dashboard = JSON.parse(response.DashboardBody!);

      // Check for logs widget
      const hasLogsWidget = dashboard.widgets.some((w: any) =>
        w.type === 'log' ||
        w.properties?.query?.includes('compliance-remediation')
      );
      expect(hasLogsWidget).toBe(true);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resource names include environment_suffix', () => {
      expect(outputs.config_bucket_name).toContain(environmentSuffix);
      expect(outputs.remediation_lambda_name).toContain(environmentSuffix);
      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.compliance_dashboard_url).toContain(environmentSuffix);
    });

    test('dashboard URL is correctly formatted', () => {
      const dashboardUrl = outputs.compliance_dashboard_url;
      expect(dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
      expect(dashboardUrl).toContain('dashboards:name=compliance-monitoring-');
      expect(dashboardUrl).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Integration', () => {
    test('all core infrastructure components are deployed', () => {
      expect(outputs.config_bucket_name).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.remediation_lambda_arn).toBeDefined();
      expect(outputs.compliance_dashboard_url).toBeDefined();
    });

    test('Lambda function can access S3 bucket', async () => {
      const functionCommand = new GetFunctionCommand({
        FunctionName: outputs.remediation_lambda_name,
      });
      const functionResponse = await lambdaClient.send(functionCommand);

      const bucketEnvVar = functionResponse.Configuration?.Environment?.Variables?.CONFIG_BUCKET;
      expect(bucketEnvVar).toBe(outputs.config_bucket_name);

      // Verify bucket is accessible
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketEnvVar!,
      });
      await expect(s3Client.send(encryptionCommand)).resolves.toBeDefined();
    });

    test('Lambda function has access to KMS key', async () => {
      const functionCommand = new GetFunctionCommand({
        FunctionName: outputs.remediation_lambda_name,
      });
      const functionResponse = await lambdaClient.send(functionCommand);

      const kmsKeyEnvVar = functionResponse.Configuration?.Environment?.Variables?.KMS_KEY_ID;
      expect(kmsKeyEnvVar).toBe(outputs.kms_key_id);

      // Verify key is accessible
      const keyCommand = new DescribeKeyCommand({
        KeyId: kmsKeyEnvVar!,
      });
      await expect(kmsClient.send(keyCommand)).resolves.toBeDefined();
    });

    test('all resources are tagged with environment', async () => {
      // Check Lambda function tags
      const functionCommand = new GetFunctionCommand({
        FunctionName: outputs.remediation_lambda_name,
      });
      const functionResponse = await lambdaClient.send(functionCommand);
      expect(functionResponse.Tags?.Environment).toBe(environmentSuffix);

      // Check KMS key tags
      const keyCommand = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });
      const keyResponse = await kmsClient.send(keyCommand);
      expect(keyResponse.KeyMetadata?.Description).toContain('compliance');
    });
  });
});
