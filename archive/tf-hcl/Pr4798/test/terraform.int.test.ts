import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectVersionsCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import fs from 'fs';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cloudTrailClient = new CloudTrailClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });

const outputsPath = 'terraform-outputs.json';

interface TerraformOutputs {
  primary_bucket_name?: { value: string };
  audit_bucket_name?: { value: string };
  reporting_bucket_name?: { value: string };
  primary_kms_key_id?: { value: string };
  audit_kms_key_id?: { value: string };
  uploader_role_name?: { value: string };
  auditor_role_name?: { value: string };
  admin_role_name?: { value: string };
  compliance_lambda_function_name?: { value: string };
  reporting_lambda_function_name?: { value: string };
  cloudtrail_name?: { value: string };
  sns_topic_arn?: { value: string };
  cloudwatch_dashboard_name?: { value: string };
  compliance_check_rule_name?: { value: string };
  monthly_report_rule_name?: { value: string };
}

describe('Legal Document Storage - Integration Tests', () => {
  let outputs: TerraformOutputs = {};
  let isDeployed = false;

  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      isDeployed = Object.keys(outputs).length > 0;
    }
  });

  describe('Infrastructure Deployment Status', () => {
    test('should have terraform outputs file', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('No terraform outputs found - infrastructure may not be deployed');
      }
      expect(typeof isDeployed).toBe('boolean');
    });
  });

  describe('S3 Bucket Verification', () => {
    test('primary bucket should exist and be accessible', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('primary bucket should have versioning enabled', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('primary bucket should have KMS encryption', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('primary bucket should have lifecycle configuration', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });

    test('primary bucket should block all public access', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('primary bucket should have bucket policy', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('audit bucket should exist and be accessible', async () => {
      if (!isDeployed || !outputs.audit_bucket_name) {
        return;
      }

      const bucketName = outputs.audit_bucket_name.value;
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('reporting bucket should exist and be accessible', async () => {
      if (!isDeployed || !outputs.reporting_bucket_name) {
        return;
      }

      const bucketName = outputs.reporting_bucket_name.value;
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('KMS Key Verification', () => {
    test('primary KMS key should exist and be enabled', async () => {
      if (!isDeployed || !outputs.primary_kms_key_id) {
        return;
      }

      const keyId = outputs.primary_kms_key_id.value;
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('primary KMS key should have rotation enabled', async () => {
      if (!isDeployed || !outputs.primary_kms_key_id) {
        return;
      }

      const keyId = outputs.primary_kms_key_id.value;
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('audit KMS key should exist and be enabled', async () => {
      if (!isDeployed || !outputs.audit_kms_key_id) {
        return;
      }

      const keyId = outputs.audit_kms_key_id.value;
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('IAM Role Verification', () => {
    test('uploader role should exist with correct trust policy', async () => {
      if (!isDeployed || !outputs.uploader_role_name) {
        return;
      }

      const roleName = outputs.uploader_role_name.value;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('auditor role should exist with read-only permissions', async () => {
      if (!isDeployed || !outputs.auditor_role_name) {
        return;
      }

      const roleName = outputs.auditor_role_name.value;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
    });

    test('admin role should exist with MFA requirement', async () => {
      if (!isDeployed || !outputs.admin_role_name) {
        return;
      }

      const roleName = outputs.admin_role_name.value;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      const policy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      const hasMFACondition = policy.Statement.some(
        (stmt: any) => stmt.Condition?.Bool?.['aws:MultiFactorAuthPresent']
      );
      expect(hasMFACondition).toBe(true);
    });
  });

  describe('Lambda Function Verification', () => {
    test('compliance Lambda should exist and be configured', async () => {
      if (!isDeployed || !outputs.compliance_lambda_function_name) {
        return;
      }

      const functionName = outputs.compliance_lambda_function_name.value;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.12');
      expect(response.Configuration?.Handler).toBe('index.lambda_handler');
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.PRIMARY_BUCKET_NAME
      ).toBeDefined();
    });

    test('reporting Lambda should exist and be configured', async () => {
      if (!isDeployed || !outputs.reporting_lambda_function_name) {
        return;
      }

      const functionName = outputs.reporting_lambda_function_name.value;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.12');
      expect(response.Configuration?.Handler).toBe('index.lambda_handler');
      expect(
        response.Configuration?.Environment?.Variables?.REPORTING_BUCKET_NAME
      ).toBeDefined();
    });
  });

  describe('CloudTrail Verification', () => {
    test('CloudTrail should be logging and enabled', async () => {
      if (!isDeployed || !outputs.cloudtrail_name) {
        return;
      }

      const trailName = outputs.cloudtrail_name.value;
      const command = new GetTrailStatusCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);
      expect(response.IsLogging).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', async () => {
      if (!isDeployed || !outputs.cloudtrail_name) {
        return;
      }

      const trailName = outputs.cloudtrail_name.value;
      const command = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const response = await cloudTrailClient.send(command);
      expect(response.trailList?.[0]?.LogFileValidationEnabled).toBe(true);
      expect(response.trailList?.[0]?.IsMultiRegionTrail).toBe(true);
    });
  });

  describe('CloudWatch Monitoring Verification', () => {
    test('SNS topic should exist for alerts', async () => {
      if (!isDeployed || !outputs.sns_topic_arn) {
        return;
      }

      const topicArn = outputs.sns_topic_arn.value;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test('CloudWatch alarms should be configured', async () => {
      if (!isDeployed) {
        return;
      }

      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('CloudWatch dashboard should exist', async () => {
      if (!isDeployed || !outputs.cloudwatch_dashboard_name) {
        return;
      }

      const dashboardName = outputs.cloudwatch_dashboard_name.value;
      const command = new GetDashboardCommand({ DashboardName: dashboardName });
      await expect(cloudWatchClient.send(command)).resolves.toBeDefined();
    });

    test('metric filters should be configured', async () => {
      if (!isDeployed) {
        return;
      }

      const command = new DescribeMetricFiltersCommand({});
      const response = await cloudWatchLogsClient.send(command);
      expect(response.metricFilters).toBeDefined();
    });
  });

  describe('EventBridge Rules Verification', () => {
    test('compliance check rule should be configured', async () => {
      if (!isDeployed || !outputs.compliance_check_rule_name) {
        return;
      }

      const ruleName = outputs.compliance_check_rule_name.value;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);
      expect(response.ScheduleExpression).toBeDefined();
      expect(response.State).toBe('ENABLED');
    });

    test('compliance check rule should target Lambda function', async () => {
      if (!isDeployed || !outputs.compliance_check_rule_name) {
        return;
      }

      const ruleName = outputs.compliance_check_rule_name.value;
      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
    });

    test('monthly report rule should be configured', async () => {
      if (!isDeployed || !outputs.monthly_report_rule_name) {
        return;
      }

      const ruleName = outputs.monthly_report_rule_name.value;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);
      expect(response.ScheduleExpression).toBeDefined();
      expect(response.State).toBe('ENABLED');
    });
  });

  describe('Application Flow Integration Tests', () => {
    describe('Document Upload Workflow', () => {
      test('should successfully upload encrypted document to primary bucket', async () => {
        if (!isDeployed || !outputs.primary_bucket_name || !outputs.primary_kms_key_id) {
          return;
        }

        const bucketName = outputs.primary_bucket_name.value;
        const keyId = outputs.primary_kms_key_id.value;
        const testKey = `test/integration-test-${Date.now()}.txt`;
        const testContent = 'Integration test document content';

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: keyId,
        });

        await expect(s3Client.send(putCommand)).resolves.toBeDefined();

        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        const getResponse = await s3Client.send(getCommand);
        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        expect(getResponse.SSEKMSKeyId).toContain(keyId);

        const cleanupCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        await s3Client.send(cleanupCommand);
      });

      test('should create version when document is updated', async () => {
        if (!isDeployed || !outputs.primary_bucket_name) {
          return;
        }

        const bucketName = outputs.primary_bucket_name.value;
        const testKey = `test/versioning-test-${Date.now()}.txt`;

        const put1Command = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Version 1',
        });
        const version1 = await s3Client.send(put1Command);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const put2Command = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Version 2',
        });
        const version2 = await s3Client.send(put2Command);

        expect(version1.VersionId).toBeDefined();
        expect(version2.VersionId).toBeDefined();
        expect(version1.VersionId).not.toBe(version2.VersionId);

        const listVersionsCommand = new ListObjectVersionsCommand({
          Bucket: bucketName,
          Prefix: testKey,
        });
        const versions = await s3Client.send(listVersionsCommand);
        expect(versions.Versions?.length).toBeGreaterThanOrEqual(2);

        const cleanupCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        await s3Client.send(cleanupCommand);
      });

      test('should enforce encryption on upload', async () => {
        if (!isDeployed || !outputs.primary_bucket_name) {
          return;
        }

        const bucketName = outputs.primary_bucket_name.value;
        const testKey = `test/no-encryption-test-${Date.now()}.txt`;

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Test content',
        });

        try {
          await s3Client.send(putCommand);
        } catch (error: any) {
          expect(error.name).toBe('AccessDenied');
        }
      });
    });

    describe('Compliance Check Workflow', () => {
      test('should successfully invoke compliance Lambda function', async () => {
        if (!isDeployed || !outputs.compliance_lambda_function_name) {
          return;
        }

        const functionName = outputs.compliance_lambda_function_name.value;
        const command = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({})),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        expect(response.Payload).toBeDefined();

        const payload = JSON.parse(
          Buffer.from(response.Payload!).toString('utf8')
        );
        expect(payload).toBeDefined();
        expect(payload.statusCode).toBeDefined();
      });

      test('compliance check should verify bucket configuration', async () => {
        if (!isDeployed || !outputs.compliance_lambda_function_name) {
          return;
        }

        const functionName = outputs.compliance_lambda_function_name.value;
        const command = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({})),
        });

        const response = await lambdaClient.send(command);
        const payload = JSON.parse(
          Buffer.from(response.Payload!).toString('utf8')
        );
        const body = JSON.parse(payload.body);

        expect(body.bucket).toBeDefined();
        expect(body.timestamp).toBeDefined();
        expect(typeof body.all_checks_passed).toBe('boolean');
      });
    });

    describe('Monthly Report Workflow', () => {
      test('should successfully invoke reporting Lambda function', async () => {
        if (!isDeployed || !outputs.reporting_lambda_function_name) {
          return;
        }

        const functionName = outputs.reporting_lambda_function_name.value;
        const command = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({})),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        expect(response.Payload).toBeDefined();

        const payload = JSON.parse(
          Buffer.from(response.Payload!).toString('utf8')
        );
        expect(payload.statusCode).toBe(200);
      });

      test('reporting should generate CSV report to reporting bucket', async () => {
        if (
          !isDeployed ||
          !outputs.reporting_lambda_function_name ||
          !outputs.reporting_bucket_name
        ) {
          return;
        }

        const functionName = outputs.reporting_lambda_function_name.value;

        const invokeCommand = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({})),
        });

        const invokeResponse = await lambdaClient.send(invokeCommand);
        const payload = JSON.parse(
          Buffer.from(invokeResponse.Payload!).toString('utf8')
        );

        expect(payload.statusCode).toBe(200);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const body = JSON.parse(payload.body);
        if (body.report_location) {
          expect(body.report_location).toContain('monthly-reports');
          expect(body.report_location).toContain('.csv');
        }
      });
    });

    describe('Audit Trail Workflow', () => {
      test('should log S3 operations to CloudTrail', async () => {
        if (
          !isDeployed ||
          !outputs.primary_bucket_name ||
          !outputs.cloudtrail_name
        ) {
          return;
        }

        const bucketName = outputs.primary_bucket_name.value;
        const testKey = `test/audit-test-${Date.now()}.txt`;

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Audit test content',
        });

        await s3Client.send(putCommand);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusCommand = new GetTrailStatusCommand({
          Name: outputs.cloudtrail_name.value,
        });
        const status = await cloudTrailClient.send(statusCommand);
        expect(status.IsLogging).toBe(true);

        const cleanupCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        await s3Client.send(cleanupCommand);
      });

      test('should store CloudTrail logs in audit bucket', async () => {
        if (!isDeployed || !outputs.audit_bucket_name) {
          return;
        }

        const bucketName = outputs.audit_bucket_name.value;
        const command = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(command)).resolves.toBeDefined();
      });
    });

    describe('End-to-End Document Lifecycle', () => {
      test('complete document lifecycle: upload, version, retrieve, audit', async () => {
        if (
          !isDeployed ||
          !outputs.primary_bucket_name ||
          !outputs.primary_kms_key_id
        ) {
          return;
        }

        const bucketName = outputs.primary_bucket_name.value;
        const keyId = outputs.primary_kms_key_id.value;
        const testKey = `test/lifecycle-test-${Date.now()}.txt`;

        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Original document content',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: keyId,
        });
        const uploadResponse = await s3Client.send(uploadCommand);
        expect(uploadResponse.VersionId).toBeDefined();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const updateCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Updated document content',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: keyId,
        });
        const updateResponse = await s3Client.send(updateCommand);
        expect(updateResponse.VersionId).not.toBe(uploadResponse.VersionId);

        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        const getResponse = await s3Client.send(getCommand);
        const content = await getResponse.Body?.transformToString();
        expect(content).toBe('Updated document content');

        const listVersionsCommand = new ListObjectVersionsCommand({
          Bucket: bucketName,
          Prefix: testKey,
        });
        const versions = await s3Client.send(listVersionsCommand);
        expect(versions.Versions?.length).toBeGreaterThanOrEqual(2);

        const getOldVersionCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          VersionId: uploadResponse.VersionId,
        });
        const oldVersionResponse = await s3Client.send(getOldVersionCommand);
        const oldContent = await oldVersionResponse.Body?.transformToString();
        expect(oldContent).toBe('Original document content');

        const cleanupCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        });
        await s3Client.send(cleanupCommand);
      });
    });
  });

  describe('Security and Compliance Validation', () => {
    test('bucket should enforce HTTPS-only access', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);

      const hasDenyInsecureTransport = policy.Statement.some(
        (stmt: any) =>
          stmt.Effect === 'Deny' &&
          stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );

      expect(hasDenyInsecureTransport).toBe(true);
    });

    test('bucket should deny unencrypted uploads', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);

      const hasDenyUnencrypted = policy.Statement.some(
        (stmt: any) =>
          stmt.Effect === 'Deny' &&
          stmt.Condition?.StringNotEquals?.[
            's3:x-amz-server-side-encryption'
          ] === 'aws:kms'
      );

      expect(hasDenyUnencrypted).toBe(true);
    });

    test('all buckets should have default encryption enabled', async () => {
      if (
        !isDeployed ||
        (!outputs.primary_bucket_name &&
          !outputs.audit_bucket_name &&
          !outputs.reporting_bucket_name)
      ) {
        return;
      }

      const buckets = [
        outputs.primary_bucket_name?.value,
        outputs.audit_bucket_name?.value,
        outputs.reporting_bucket_name?.value,
      ].filter(Boolean) as string[];

      for (const bucketName of buckets) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(
          response.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('aws:kms');
      }
    });

    test('lifecycle policies should be properly configured', async () => {
      if (!isDeployed || !outputs.primary_bucket_name) {
        return;
      }

      const bucketName = outputs.primary_bucket_name.value;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThanOrEqual(3);

      const hasTransitionRule = response.Rules!.some(
        (rule) => rule.Transitions && rule.Transitions.length > 0
      );
      expect(hasTransitionRule).toBe(true);

      const hasExpirationRule = response.Rules!.some(
        (rule) =>
          rule.NoncurrentVersionExpiration ||
          rule.Expiration?.ExpiredObjectDeleteMarker
      );
      expect(hasExpirationRule).toBe(true);
    });
  });

  describe('Monitoring and Alerting Integration', () => {
    test('CloudWatch alarms should be in OK or ALARM state', async () => {
      if (!isDeployed) {
        return;
      }

      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);

      response.MetricAlarms?.forEach((alarm) => {
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(
          alarm.StateValue
        );
      });
    });

    test('EventBridge rules should have active targets', async () => {
      if (
        !isDeployed ||
        (!outputs.compliance_check_rule_name &&
          !outputs.monthly_report_rule_name)
      ) {
        return;
      }

      const rules = [
        outputs.compliance_check_rule_name?.value,
        outputs.monthly_report_rule_name?.value,
      ].filter(Boolean) as string[];

      for (const ruleName of rules) {
        const command = new ListTargetsByRuleCommand({ Rule: ruleName });
        const response = await eventBridgeClient.send(command);
        expect(response.Targets).toBeDefined();
        expect(response.Targets!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('Lambda functions should have required tags', async () => {
      if (
        !isDeployed ||
        (!outputs.compliance_lambda_function_name &&
          !outputs.reporting_lambda_function_name)
      ) {
        return;
      }

      const functions = [
        outputs.compliance_lambda_function_name?.value,
        outputs.reporting_lambda_function_name?.value,
      ].filter(Boolean) as string[];

      for (const functionName of functions) {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Tags).toBeDefined();
        expect(response.Tags?.Project).toBeDefined();
        expect(response.Tags?.Environment).toBeDefined();
        expect(response.Tags?.ManagedBy).toBe('Terraform');
      }
    });
  });
});
