import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let iamTfContent: string;
  let lambdaTfContent: string;
  let firehoseTfContent: string;
  let cloudwatchInsightsTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Read all Terraform files as strings
    mainTfContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    variablesTfContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    outputsTfContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    iamTfContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
    lambdaTfContent = fs.readFileSync(path.join(LIB_DIR, 'lambda.tf'), 'utf8');
    firehoseTfContent = fs.readFileSync(path.join(LIB_DIR, 'firehose.tf'), 'utf8');
    cloudwatchInsightsTfContent = fs.readFileSync(path.join(LIB_DIR, 'cloudwatch_insights.tf'), 'utf8');
    providerTfContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
  });

  describe('File Existence Tests', () => {
    test('main.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
    });

    test('variables.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('outputs.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('provider.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
    });

    test('iam.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'iam.tf'))).toBe(true);
    });

    test('lambda.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'lambda.tf'))).toBe(true);
    });

    test('firehose.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'firehose.tf'))).toBe(true);
    });

    test('cloudwatch_insights.tf should exist', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'cloudwatch_insights.tf'))).toBe(true);
    });
  });

  describe('Provider Configuration Tests', () => {
    test('should use AWS provider', () => {
      expect(providerTfContent).toContain('provider "aws"');
    });

    test('should configure S3 backend', () => {
      expect(providerTfContent).toContain('backend "s3"');
    });

    test('should specify Terraform version requirements', () => {
      expect(providerTfContent).toContain('required_version');
    });

    test('should require AWS provider version >= 5.0', () => {
      expect(providerTfContent).toContain('source  = "hashicorp/aws"');
      expect(providerTfContent).toContain('version = ">= 5.0"');
    });
  });

  describe('Variables Tests', () => {
    test('should define aws_region variable', () => {
      expect(variablesTfContent).toContain('variable "aws_region"');
    });

    test('should define environment_suffix variable', () => {
      expect(variablesTfContent).toContain('variable "environment_suffix"');
    });

    test('should define application_count variable with default 12', () => {
      expect(variablesTfContent).toContain('variable "application_count"');
      expect(variablesTfContent).toContain('default     = 12');
    });

    test('should define firehose_buffer_size with minimum 64', () => {
      expect(variablesTfContent).toContain('variable "firehose_buffer_size"');
      expect(variablesTfContent).toContain('default     = 64');
    });

    test('should define log_retention_days with default 90', () => {
      expect(variablesTfContent).toContain('variable "log_retention_days"');
      expect(variablesTfContent).toContain('default     = 90');
    });

    test('should define firehose_buffer_interval variable', () => {
      expect(variablesTfContent).toContain('variable "firehose_buffer_interval"');
      expect(variablesTfContent).toContain('default     = 60');
    });

    test('should define project_name variable', () => {
      expect(variablesTfContent).toContain('variable "project_name"');
    });

    test('should define cross_account_ids variable', () => {
      expect(variablesTfContent).toContain('variable "cross_account_ids"');
    });

    test('should define tags variable', () => {
      expect(variablesTfContent).toContain('variable "tags"');
    });
  });

  describe('Resource Tests - Main.tf', () => {
    test('should define KMS key resource', () => {
      expect(mainTfContent).toContain('resource "aws_kms_key" "logging_key"');
    });

    test('KMS key should have deletion window configured', () => {
      expect(mainTfContent).toContain('deletion_window_in_days');
    });

    test('KMS key should have rotation enabled', () => {
      expect(mainTfContent).toContain('enable_key_rotation');
    });

    test('should define KMS alias', () => {
      expect(mainTfContent).toContain('resource "aws_kms_alias"');
    });

    test('should define S3 bucket resource', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "log_storage"');
    });

    test('S3 bucket should have versioning', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_versioning"');
    });

    test('S3 bucket should have encryption', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
    });

    test('S3 bucket should have lifecycle configuration', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_lifecycle_configuration"');
    });

    test('S3 bucket should have public access block', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_public_access_block"');
    });

    test('should define CloudWatch Log Groups', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_group" "applications"');
    });

    test('should define CloudWatch Log subscription filters', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_subscription_filter"');
    });

    test('should define locals for name_prefix', () => {
      expect(mainTfContent).toContain('locals');
      expect(mainTfContent).toContain('name_prefix');
    });

    test('should use data sources', () => {
      expect(mainTfContent).toContain('data "aws_caller_identity"');
      expect(mainTfContent).toContain('data "aws_region"');
    });
  });

  describe('Resource Tests - IAM.tf', () => {
    test('should define CloudWatch to Firehose IAM role', () => {
      expect(iamTfContent).toContain('resource "aws_iam_role" "cloudwatch_to_firehose"');
    });

    test('should define Firehose IAM role', () => {
      expect(iamTfContent).toContain('resource "aws_iam_role" "firehose"');
    });

    test('should define Lambda IAM role', () => {
      expect(iamTfContent).toContain('resource "aws_iam_role" "lambda"');
    });

    test('should define KMS key policy', () => {
      expect(iamTfContent).toContain('resource "aws_kms_key_policy"');
    });

    test('should attach basic execution role to Lambda', () => {
      expect(iamTfContent).toContain('resource "aws_iam_role_policy_attachment" "lambda_basic"');
    });

    test('should define IAM role policies', () => {
      expect(iamTfContent).toContain('resource "aws_iam_role_policy"');
    });

    test('should define cross-account audit role', () => {
      expect(iamTfContent).toContain('resource "aws_iam_role" "cross_account_audit"');
    });

    test('IAM roles should use local.name_prefix', () => {
      expect(iamTfContent).toContain('local.name_prefix');
    });
  });

  describe('Resource Tests - Lambda.tf', () => {
    test('should define Lambda function', () => {
      expect(lambdaTfContent).toContain('resource "aws_lambda_function" "log_transformer"');
    });

    test('Lambda function should use Python 3.12 runtime', () => {
      expect(lambdaTfContent).toContain('runtime       = "python3.12"');
    });

    test('should define Lambda CloudWatch log group', () => {
      expect(lambdaTfContent).toContain('resource "aws_cloudwatch_log_group" "lambda"');
    });

    test('should create Lambda code file', () => {
      expect(lambdaTfContent).toContain('resource "local_file" "lambda_code"');
    });

    test('should create Lambda zip archive', () => {
      expect(lambdaTfContent).toContain('data "archive_file" "lambda_zip"');
    });

    test('Lambda function should have proper handler', () => {
      expect(lambdaTfContent).toContain('handler       = "index.handler"');
    });

    test('Lambda function should have timeout configured', () => {
      expect(lambdaTfContent).toContain('timeout');
    });

    test('Lambda function should have memory configured', () => {
      expect(lambdaTfContent).toContain('memory_size');
    });
  });

  describe('Resource Tests - Firehose.tf', () => {
    test('should define Kinesis Firehose delivery stream', () => {
      expect(firehoseTfContent).toContain('resource "aws_kinesis_firehose_delivery_stream"');
    });

    test('Firehose should use extended_s3 destination', () => {
      expect(firehoseTfContent).toContain('destination = "extended_s3"');
    });

    test('Firehose should have GZIP compression', () => {
      expect(firehoseTfContent).toContain('compression_format = "GZIP"');
    });

    test('Firehose should have dynamic partitioning enabled', () => {
      expect(firehoseTfContent).toContain('dynamic_partitioning_configuration');
      expect(firehoseTfContent).toContain('enabled = true');
    });

    test('should define Firehose CloudWatch log group', () => {
      expect(firehoseTfContent).toContain('resource "aws_cloudwatch_log_group" "firehose"');
    });

    test('should define CloudWatch log streams', () => {
      expect(firehoseTfContent).toContain('resource "aws_cloudwatch_log_stream"');
    });

    test('Firehose should have Lambda transformation processor', () => {
      expect(firehoseTfContent).toContain('type = "Lambda"');
    });

    test('Firehose should have metadata extraction processor', () => {
      expect(firehoseTfContent).toContain('type = "MetadataExtraction"');
    });

    test('Firehose should have S3 backup enabled', () => {
      expect(firehoseTfContent).toContain('s3_backup_mode = "Enabled"');
    });
  });

  describe('Resource Tests - CloudWatch Insights', () => {
    test('should define error logs query', () => {
      expect(cloudwatchInsightsTfContent).toContain('resource "aws_cloudwatch_query_definition" "error_logs"');
    });

    test('should define application stats query', () => {
      expect(cloudwatchInsightsTfContent).toContain('resource "aws_cloudwatch_query_definition" "application_stats"');
    });

    test('should define hourly log volume query', () => {
      expect(cloudwatchInsightsTfContent).toContain('resource "aws_cloudwatch_query_definition" "hourly_log_volume"');
    });

    test('should define errors by application query', () => {
      expect(cloudwatchInsightsTfContent).toContain('resource "aws_cloudwatch_query_definition" "application_errors_by_type"');
    });

    test('should define recent logs query', () => {
      expect(cloudwatchInsightsTfContent).toContain('resource "aws_cloudwatch_query_definition" "recent_logs_all_apps"');
    });

    test('queries should filter for ERROR messages', () => {
      expect(cloudwatchInsightsTfContent).toContain('/ERROR/');
    });

    test('queries should use CloudWatch Insights syntax', () => {
      expect(cloudwatchInsightsTfContent).toContain('fields @timestamp');
      expect(cloudwatchInsightsTfContent).toContain('sort');
    });
  });

  describe('Outputs Tests', () => {
    test('should define S3 bucket name output', () => {
      expect(outputsTfContent).toContain('output "s3_bucket_name"');
    });

    test('should define S3 bucket ARN output', () => {
      expect(outputsTfContent).toContain('output "s3_bucket_arn"');
    });

    test('should define KMS key ARN output', () => {
      expect(outputsTfContent).toContain('output "kms_key_arn"');
    });

    test('should define KMS key ID output', () => {
      expect(outputsTfContent).toContain('output "kms_key_id"');
    });

    test('should define Firehose delivery stream name output', () => {
      expect(outputsTfContent).toContain('output "firehose_delivery_stream_name"');
    });

    test('should define Firehose delivery stream ARN output', () => {
      expect(outputsTfContent).toContain('output "firehose_delivery_stream_arn"');
    });

    test('should define Lambda function name output', () => {
      expect(outputsTfContent).toContain('output "lambda_function_name"');
    });

    test('should define Lambda function ARN output', () => {
      expect(outputsTfContent).toContain('output "lambda_function_arn"');
    });

    test('should define CloudWatch log groups output', () => {
      expect(outputsTfContent).toContain('output "cloudwatch_log_groups"');
    });

    test('should define CloudWatch Insights queries output', () => {
      expect(outputsTfContent).toContain('output "cloudwatch_insights_queries"');
    });

    test('should define cross account role ARN output', () => {
      expect(outputsTfContent).toContain('output "cross_account_role_arn"');
    });
  });

  describe('Security Tests', () => {
    test('S3 bucket should block all public access', () => {
      expect(mainTfContent).toContain('block_public_acls       = true');
      expect(mainTfContent).toContain('block_public_policy     = true');
      expect(mainTfContent).toContain('ignore_public_acls      = true');
      expect(mainTfContent).toContain('restrict_public_buckets = true');
    });

    test('S3 bucket should use KMS encryption', () => {
      expect(mainTfContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainTfContent).toContain('kms_master_key_id');
    });

    test('CloudWatch Log Groups should use KMS encryption', () => {
      expect(mainTfContent).toContain('kms_key_id        = aws_kms_key.logging_key.arn');
    });

    test('Lambda log group should use KMS encryption', () => {
      expect(lambdaTfContent).toContain('kms_key_id');
    });
  });

  describe('Naming Convention Tests', () => {
    test('should use locals for name_prefix', () => {
      expect(mainTfContent).toContain('local.name_prefix');
    });

    test('resources should include environment suffix in names', () => {
      expect(mainTfContent).toContain('local.name_prefix');
      expect(iamTfContent).toContain('local.name_prefix');
      expect(lambdaTfContent).toContain('local.name_prefix');
      expect(firehoseTfContent).toContain('local.name_prefix');
    });

    test('name_prefix should use environment_suffix variable', () => {
      expect(mainTfContent).toContain('var.environment_suffix');
    });
  });

  describe('Requirement Validation Tests', () => {
    test('should configure 12 CloudWatch Log Groups', () => {
      expect(variablesTfContent).toContain('default     = 12');
    });

    test('should set 90-day retention for CloudWatch logs', () => {
      expect(variablesTfContent).toContain('default     = 90');
    });

    test('should configure Firehose with 60-second buffer interval', () => {
      expect(variablesTfContent).toContain('default     = 60');
    });

    test('Lambda function should be for log transformation', () => {
      expect(lambdaTfContent).toContain('log-transformer');
    });

    test('should partition logs by application and date', () => {
      expect(firehoseTfContent).toContain('application=!{partitionKeyFromQuery:application}');
      expect(firehoseTfContent).toContain('year=!{timestamp:yyyy}');
      expect(firehoseTfContent).toContain('month=!{timestamp:MM}');
      expect(firehoseTfContent).toContain('day=!{timestamp:dd}');
    });
  });

  describe('Dependencies Tests', () => {
    test('CloudWatch log groups should depend on KMS key policy', () => {
      expect(mainTfContent).toContain('depends_on = [aws_kms_key_policy.logging_key]');
    });

    test('Lambda log group should depend on KMS key policy', () => {
      expect(lambdaTfContent).toContain('depends_on = [aws_kms_key_policy.logging_key]');
    });

    test('Lambda function should depend on Lambda code', () => {
      expect(lambdaTfContent).toContain('depends_on = [local_file.lambda_code]');
    });

    test('Subscription filters should depend on IAM policy', () => {
      expect(mainTfContent).toContain('depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]');
    });
  });
});
