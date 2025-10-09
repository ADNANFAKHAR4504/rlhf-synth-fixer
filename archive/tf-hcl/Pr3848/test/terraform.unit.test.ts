// Unit tests for Terraform audit logging infrastructure
// Tests validate the infrastructure code without deploying

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure', () => {
    test('provider.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'provider.tf'));
      expect(exists).toBe(true);
    });

    test('variables.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'variables.tf'));
      expect(exists).toBe(true);
    });

    test('main.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'main.tf'));
      expect(exists).toBe(true);
    });

    test('outputs.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'outputs.tf'));
      expect(exists).toBe(true);
    });

    test('iam_policies.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'iam_policies.tf'));
      expect(exists).toBe(true);
    });

    test('lambda_function.py exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'lambda_function.py'));
      expect(exists).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
    });

    test('defines AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test('requires AWS provider version >= 5.0', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('requires archive provider', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });
  });

  describe('Variables', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    });

    test('defines aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    });

    test('defines environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('defines log_retention_days variable with default', () => {
      expect(variablesContent).toMatch(/variable\s+"log_retention_days"/);
      expect(variablesContent).toMatch(/default\s*=\s*3653/);
    });

    test('defines s3_retention_years variable', () => {
      expect(variablesContent).toMatch(/variable\s+"s3_retention_years"/);
      expect(variablesContent).toMatch(/default\s*=\s*10/);
    });

    test('defines project_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"/);
    });
  });

  describe('Main Infrastructure', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('defines resource_prefix local variable', () => {
      expect(mainContent).toMatch(/resource_prefix\s*=/);
    });

    test('creates KMS key for encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"audit_logs"/);
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('creates KMS alias', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"audit_logs"/);
    });

    test('creates CloudWatch log group with encryption', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"audit_events"/);
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.audit_logs\.arn/);
    });

    test('creates S3 bucket with Object Lock enabled', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs"/);
      expect(mainContent).toMatch(/object_lock_enabled\s*=\s*true/);
    });

    test('configures S3 Object Lock with GOVERNANCE mode', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_object_lock_configuration"/);
      expect(mainContent).toMatch(/mode\s*=\s*"GOVERNANCE"/);
    });

    test('enables S3 versioning', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures S3 server-side encryption with KMS', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('creates Lambda function for log processing', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"log_processor"/);
      expect(mainContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('creates IAM role for Lambda', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_log_processor"/);
    });

    test('creates SNS topic for alerts', () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"critical_alerts"/);
    });

    test('creates EventBridge rule for critical events', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"critical_events"/);
    });

    test('creates AppSync GraphQL API', () => {
      expect(mainContent).toMatch(/resource\s+"aws_appsync_graphql_api"\s+"monitoring"/);
      expect(mainContent).toMatch(/authentication_type\s*=\s*"API_KEY"/);
    });

    test('creates CloudWatch Insights query definition', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_query_definition"/);
    });

    test('uses resource_prefix for resource naming', () => {
      expect(mainContent).toMatch(/local\.resource_prefix/);
    });
  });

  describe('IAM Policies', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam_policies.tf'), 'utf8');
    });

    test('creates audit log reader policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"audit_log_reader"/);
    });

    test('creates audit log admin policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"audit_log_admin"/);
    });

    test('creates deny log modification policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"deny_log_modification"/);
    });

    test('admin policy includes BypassGovernanceRetention', () => {
      expect(iamContent).toMatch(/s3:BypassGovernanceRetention/);
    });
  });

  describe('Outputs', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    });

    test('exports KMS key ID', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('exports KMS key ARN', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('exports CloudWatch log group name', () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_log_group_name"/);
    });

    test('exports S3 bucket name', () => {
      expect(outputsContent).toMatch(/output\s+"s3_bucket_name"/);
    });

    test('exports Lambda function name', () => {
      expect(outputsContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test('exports AppSync API ID', () => {
      expect(outputsContent).toMatch(/output\s+"appsync_api_id"/);
    });

    test('exports SNS topic ARN', () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('marks AppSync API key as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"appsync_api_key"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  describe('Lambda Function', () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(LIB_DIR, 'lambda_function.py'), 'utf8');
    });

    test('defines handler function', () => {
      expect(lambdaContent).toMatch(/def\s+handler\s*\(/);
    });

    test('imports required modules', () => {
      expect(lambdaContent).toMatch(/import\s+json/);
      expect(lambdaContent).toMatch(/import\s+boto3/);
      expect(lambdaContent).toMatch(/import\s+gzip/);
    });

    test('uses S3 client', () => {
      expect(lambdaContent).toMatch(/boto3\.client\(['"]s3['"]\)/);
    });

    test('processes CloudWatch Logs data', () => {
      expect(lambdaContent).toMatch(/awslogs/);
      expect(lambdaContent).toMatch(/gzip\.decompress/);
    });

    test('uploads to S3 with KMS encryption', () => {
      expect(lambdaContent).toMatch(/put_object/);
      expect(lambdaContent).toMatch(/ServerSideEncryption/);
      expect(lambdaContent).toMatch(/SSEKMSKeyId/);
    });
  });

  describe('Security Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('S3 bucket policy denies unencrypted uploads', () => {
      expect(mainContent).toMatch(/DenyUnencryptedObjectUploads/);
    });

    test('S3 bucket policy denies insecure transport', () => {
      expect(mainContent).toMatch(/DenyInsecureTransport/);
      expect(mainContent).toMatch(/aws:SecureTransport/);
    });

    test('S3 bucket blocks public access', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test('KMS key has rotation enabled', () => {
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('all CloudWatch log groups are encrypted', () => {
      const logGroupMatches = mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g);
      const kmsMatches = mainContent.match(/kms_key_id\s*=\s*aws_kms_key\.audit_logs\.arn/g);
      expect(kmsMatches).toBeTruthy();
      expect(kmsMatches!.length).toBeGreaterThan(0);
    });
  });
});
