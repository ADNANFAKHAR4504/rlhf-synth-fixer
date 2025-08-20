
/**
 * Unit tests for ../lib/tap_stack.tf
 * - Pure static analysis: NO terraform init/plan/apply.
 * - Uses string/regex introspection so it runs anywhere.
 * - Comprehensive coverage of all Terraform resources and configurations.
 */

import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  let terraformContent: string;
  let providerContent: string;

  beforeAll(() => {
    const tapStackPath = path.join(__dirname, '../lib/tap_stack.tf');
    const providerPath = path.join(__dirname, '../lib/provider.tf');
    
    terraformContent = fs.readFileSync(tapStackPath, 'utf-8');
    providerContent = fs.readFileSync(providerPath, 'utf-8');
  });

  describe('Provider Configuration', () => {
    test('should have required Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+/);
    });

    test('should configure AWS provider correctly', () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should use archive data source for Lambda zipping', () => {
      // Archive data source is used for Lambda deployment packages
      expect(terraformContent).toMatch(/data\s+"archive_file"\s+"lambda1_zip"/);
      expect(terraformContent).toMatch(/data\s+"archive_file"\s+"lambda2_zip"/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable with correct default', () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"/);
      expect(terraformContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('should define company_name variable', () => {
      expect(terraformContent).toMatch(/variable\s+"company_name"/);
      expect(terraformContent).toMatch(/description\s*=\s*"Company name/);
      expect(terraformContent).toMatch(/default\s*=\s*"acme"/);
    });

    test('should define environment variable with default', () => {
      expect(terraformContent).toMatch(/variable\s+"environment"/);
      expect(terraformContent).toMatch(/default\s*=\s*"dev"/);
    });

    test('should define Lambda configuration variables', () => {
      expect(terraformContent).toMatch(/variable\s+"lambda_runtime"/);
      expect(terraformContent).toMatch(/default\s*=\s*"python3\.12"/);
      expect(terraformContent).toMatch(/variable\s+"lambda_memory_size"/);
      expect(terraformContent).toMatch(/default\s*=\s*512/);
      expect(terraformContent).toMatch(/variable\s+"lambda_timeout"/);
      expect(terraformContent).toMatch(/default\s*=\s*30/);
    });

    test('should define DynamoDB capacity variables', () => {
      expect(terraformContent).toMatch(/variable\s+"dynamodb_read_capacity"/);
      expect(terraformContent).toMatch(/variable\s+"dynamodb_write_capacity"/);
      expect(terraformContent).toMatch(/default\s*=\s*5/);
    });
  });

  describe('Local Values', () => {
    test('should define name_prefix local combining company and environment', () => {
      expect(terraformContent).toMatch(/name_prefix\s*=\s*"\${var\.company_name}-\${var\.environment}"/);
    });

    test('should define common_tags with required fields', () => {
      expect(terraformContent).toMatch(/common_tags\s*=/);
      expect(terraformContent).toContain('Project');
      expect(terraformContent).toContain('Company');
      expect(terraformContent).toContain('Environment');
      expect(terraformContent).toContain('ManagedBy');
    });

    test('should define deterministic resource names', () => {
      expect(terraformContent).toMatch(/ddb_table_name\s*=\s*"\${local\.name_prefix}-table"/);
      expect(terraformContent).toMatch(/lambda1_name\s*=\s*"\${local\.name_prefix}-lambda1"/);
      expect(terraformContent).toMatch(/lambda2_name\s*=\s*"\${local\.name_prefix}-lambda2"/);
    });
  });

  describe('Data Sources', () => {
    test('should include AWS caller identity data source', () => {
      expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should include AWS partition data source', () => {
      expect(terraformContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  describe('KMS Resources', () => {
    test('should define KMS key policy document', () => {
      expect(terraformContent).toMatch(/data\s+"aws_iam_policy_document"\s+"kms_key_policy"/);
    });

    test('should include root account permissions in KMS policy', () => {
      expect(terraformContent).toMatch(/sid\s*=\s*"AllowRootAccount"/);
      expect(terraformContent).toContain('kms:*');
    });

    test('should include CloudWatch Logs permissions in KMS policy', () => {
      expect(terraformContent).toMatch(/sid\s*=\s*"AllowCloudWatchLogsUse"/);
      expect(terraformContent).toContain('logs.${var.aws_region}.amazonaws.com');
    });

    test('should include Lambda service permissions in KMS policy', () => {
      expect(terraformContent).toMatch(/sid\s*=\s*"AllowLambdaUse"/);
      expect(terraformContent).toContain('lambda.amazonaws.com');
    });

    test('should create KMS key with key rotation enabled', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_key"\s+"cmk"/);
      expect(terraformContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should create KMS alias', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_alias"\s+"cmk_alias"/);
      expect(terraformContent).toMatch(/name\s*=\s*local\.kms_alias_name/);
    });
  });

  describe('DynamoDB Configuration', () => {
    test('should create DynamoDB table with correct configuration', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
      expect(terraformContent).toMatch(/name\s*=\s*local\.ddb_table_name/);
      expect(terraformContent).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
    });

    test('should configure DynamoDB with correct capacity settings', () => {
      expect(terraformContent).toMatch(/read_capacity\s*=\s*var\.dynamodb_read_capacity/);
      expect(terraformContent).toMatch(/write_capacity\s*=\s*var\.dynamodb_write_capacity/);
    });

    test('should configure DynamoDB hash key as id', () => {
      expect(terraformContent).toMatch(/hash_key\s*=\s*"id"/);
      expect(terraformContent).toMatch(/name\s*=\s*"id"/);
      expect(terraformContent).toMatch(/type\s*=\s*"S"/);
    });

    test('should enable server-side encryption with CMK', () => {
      expect(terraformContent).toMatch(/server_side_encryption\s*{/);
      expect(terraformContent).toMatch(/enabled\s*=\s*true/);
      expect(terraformContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.cmk\.arn/);
    });

    test('should enable point-in-time recovery', () => {
      expect(terraformContent).toMatch(/point_in_time_recovery\s*{/);
      expect(terraformContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create log groups for both Lambda functions', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda1"/);
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda2"/);
    });

    test('should configure log groups with encryption and retention', () => {
      expect(terraformContent).toMatch(/retention_in_days\s*=\s*14/);
      expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cmk\.arn/);
    });
  });

  describe('IAM Configuration', () => {
    test('should create Lambda execution role', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_exec"/);
      expect(terraformContent).toMatch(/name\s*=\s*"\${local\.name_prefix}-lambda-role"/);
    });

    test('should configure correct assume role policy for Lambda', () => {
      expect(terraformContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(terraformContent).toContain('lambda.amazonaws.com');
      expect(terraformContent).toContain('sts:AssumeRole');
    });

    test('should attach AWS managed Lambda basic execution role', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic"/);
      expect(terraformContent).toContain('AWSLambdaBasicExecutionRole');
    });

    test('should create custom DynamoDB policy', () => {
      expect(terraformContent).toMatch(/data\s+"aws_iam_policy_document"\s+"lambda_custom"/);
      expect(terraformContent).toMatch(/sid\s*=\s*"DynamoDBCrudOnTable"/);
    });

    test('should include required DynamoDB permissions', () => {
      expect(terraformContent).toContain('dynamodb:GetItem');
      expect(terraformContent).toContain('dynamodb:PutItem');
      expect(terraformContent).toContain('dynamodb:UpdateItem');
      expect(terraformContent).toContain('dynamodb:DeleteItem');
      expect(terraformContent).toContain('dynamodb:Query');
      expect(terraformContent).toContain('dynamodb:Scan');
    });

    test('should include KMS permissions for Lambda', () => {
      expect(terraformContent).toMatch(/sid\s*=\s*"KmsForLogsAndEnv"/);
      expect(terraformContent).toContain('kms:Decrypt');
      expect(terraformContent).toContain('kms:Encrypt');
      expect(terraformContent).toContain('kms:GenerateDataKey');
    });
  });

  describe('Lambda Functions', () => {
    test('should create archive files for Lambda deployment packages', () => {
      expect(terraformContent).toMatch(/data\s+"archive_file"\s+"lambda1_zip"/);
      expect(terraformContent).toMatch(/data\s+"archive_file"\s+"lambda2_zip"/);
      expect(terraformContent).toMatch(/type\s*=\s*"zip"/);
    });

    test('should include inline Lambda code for lambda1', () => {
      expect(terraformContent).toContain('import os, json, boto3');
      expect(terraformContent).toContain('dynamodb = boto3.resource("dynamodb")');
      expect(terraformContent).toContain('table.put_item(Item=item)');
    });

    test('should include inline Lambda code for lambda2', () => {
      expect(terraformContent).toContain('table.get_item(Key=key)');
      expect(terraformContent).toContain('resp.get("Item", {"missing": True})');
    });

    test('should create Lambda function resources with correct configuration', () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lambda_function"\s+"lambda1"/);
      expect(terraformContent).toMatch(/resource\s+"aws_lambda_function"\s+"lambda2"/);
    });

    test('should configure Lambda functions with correct settings', () => {
      expect(terraformContent).toMatch(/function_name\s*=\s*local\.lambda1_name/);
      expect(terraformContent).toMatch(/function_name\s*=\s*local\.lambda2_name/);
      expect(terraformContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
      expect(terraformContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test('should configure environment variables for Lambda functions', () => {
      expect(terraformContent).toMatch(/environment\s*{/);
      expect(terraformContent).toMatch(/DYNAMODB_TABLE_NAME\s*=\s*aws_dynamodb_table\.main\.name/);
    });

    test('should configure Lambda functions with KMS encryption', () => {
      expect(terraformContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.cmk\.arn/);
    });

    test('should configure proper dependencies for log groups', () => {
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda1\]/);
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda2\]/);
    });
  });

  describe('Outputs', () => {
    test('should define required infrastructure outputs', () => {
      expect(terraformContent).toMatch(/output\s+"region"/);
      expect(terraformContent).toMatch(/output\s+"company_name"/);
      expect(terraformContent).toMatch(/output\s+"environment"/);
    });

    test('should define KMS-related outputs', () => {
      expect(terraformContent).toMatch(/output\s+"kms_key_arn"/);
      expect(terraformContent).toMatch(/output\s+"kms_key_alias"/);
    });

    test('should define DynamoDB outputs', () => {
      expect(terraformContent).toMatch(/output\s+"dynamodb_table_name"/);
      expect(terraformContent).toMatch(/output\s+"dynamodb_table_arn"/);
    });

    test('should define Lambda function outputs', () => {
      expect(terraformContent).toMatch(/output\s+"lambda1_name"/);
      expect(terraformContent).toMatch(/output\s+"lambda1_arn"/);
      expect(terraformContent).toMatch(/output\s+"lambda2_name"/);
      expect(terraformContent).toMatch(/output\s+"lambda2_arn"/);
    });

    test('should define CloudWatch log group outputs', () => {
      expect(terraformContent).toMatch(/output\s+"log_group_lambda1"/);
      expect(terraformContent).toMatch(/output\s+"log_group_lambda2"/);
    });

    test('should define IAM role outputs', () => {
      expect(terraformContent).toMatch(/output\s+"lambda_role_name"/);
      expect(terraformContent).toMatch(/output\s+"lambda_role_arn"/);
    });
  });

  describe('Security Best Practices', () => {
    test('should implement least privilege IAM policies', () => {
      expect(terraformContent).toMatch(/resources\s*=\s*\[aws_dynamodb_table\.main\.arn\]/);
    });

    test('should use customer-managed KMS keys for encryption', () => {
      expect(terraformContent).toContain('aws_kms_key.cmk.arn');
    });

    test('should enable encryption at rest for all applicable services', () => {
      // DynamoDB encryption
      expect(terraformContent).toMatch(/server_side_encryption\s*{/);
      // CloudWatch logs encryption
      expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cmk\.arn/);
      // Lambda environment variable encryption
      expect(terraformContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.cmk\.arn/);
    });

    test('should include proper resource tagging', () => {
      expect(terraformContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test('should enable backup and recovery features', () => {
      expect(terraformContent).toMatch(/point_in_time_recovery\s*{/);
      expect(terraformContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('Naming Conventions', () => {
    test('should follow consistent naming pattern across resources', () => {
      expect(terraformContent).toMatch(/\${local\.name_prefix}-/);
    });

    test('should use descriptive resource names', () => {
      expect(terraformContent).toContain('-table');
      expect(terraformContent).toContain('-lambda1');
      expect(terraformContent).toContain('-lambda2');
      expect(terraformContent).toContain('-lambda-role');
    });
  });

  describe('Resource Dependencies', () => {
    test('should properly reference dependent resources', () => {
      expect(terraformContent).toMatch(/aws_dynamodb_table\.main\.name/);
      expect(terraformContent).toMatch(/aws_iam_role\.lambda_exec\.arn/);
      expect(terraformContent).toMatch(/aws_kms_key\.cmk\.arn/);
    });

    test('should use explicit dependencies where needed', () => {
      expect(terraformContent).toMatch(/depends_on\s*=\s*\[/);
    });
  });

  describe('Configuration Validation', () => {
    test('should not contain hardcoded environment suffixes', () => {
      // Check that environment suffix is parameterized
      expect(terraformContent).not.toMatch(/\b(dev|test|prod|stage)-/);
    });

    test('should use variables instead of hardcoded values', () => {
      expect(terraformContent).toMatch(/var\./);
    });

    test('should not contain sensitive information', () => {
      // Basic check for common sensitive patterns
      expect(terraformContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(terraformContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(terraformContent).not.toMatch(/key\s*=\s*"AKIA/);
    });
  });
});

