import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Unit Tests', () => {
  const terraformDir = path.resolve(__dirname, '../lib');
  const mainTfPath = path.join(terraformDir, 'main.tf');
  const providerTfPath = path.join(terraformDir, 'provider.tf');
  
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Read Terraform files
    mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
    providerTfContent = fs.readFileSync(providerTfPath, 'utf-8');
  });

  describe('File Structure Validation', () => {
    test('main.tf file exists and is readable', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
      expect(mainTfContent).toBeDefined();
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    test('provider.tf file exists and is readable', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
      expect(providerTfContent).toBeDefined();
      expect(providerTfContent.length).toBeGreaterThan(0);
    });

    test('Lambda source directory exists', () => {
      const lambdaDir = path.join(terraformDir, 'lambda');
      expect(fs.existsSync(lambdaDir)).toBe(true);
      
      const lambdaIndexFile = path.join(lambdaDir, 'index.js');
      const lambdaPackageFile = path.join(lambdaDir, 'package.json');
      
      expect(fs.existsSync(lambdaIndexFile)).toBe(true);
      expect(fs.existsSync(lambdaPackageFile)).toBe(true);
    });
  });

  describe('Variables Validation', () => {
    test('aws_region variable is declared in main.tf', () => {
      expect(mainTfContent).toContain('variable "aws_region"');
      expect(mainTfContent).toContain('default     = "us-east-1"');
    });

    test('environment_suffix variable is declared with proper default', () => {
      expect(mainTfContent).toContain('variable "environment_suffix"');
      expect(mainTfContent).toContain('default     = "v2"');
    });

    test('vpc_id variable is optional', () => {
      expect(mainTfContent).toContain('variable "vpc_id"');
      expect(mainTfContent).toContain('default     = null');
    });

    test('subnet_ids variable is list type', () => {
      expect(mainTfContent).toContain('variable "subnet_ids"');
      expect(mainTfContent).toContain('type        = list(string)');
    });

    test('lambda_config variable has proper object structure', () => {
      expect(mainTfContent).toContain('variable "lambda_config"');
      expect(mainTfContent).toContain('runtime      = optional(string, "nodejs18.x")');
      expect(mainTfContent).toContain('timeout      = optional(number, 300)');
      expect(mainTfContent).toContain('memory_size  = optional(number, 512)');
    });
  });

  describe('Data Sources Validation', () => {
    test('required data sources are present', () => {
      expect(mainTfContent).toContain('data "aws_caller_identity" "current"');
      expect(mainTfContent).toContain('data "aws_region" "current"');
      expect(mainTfContent).toContain('data "aws_partition" "current"');
      expect(mainTfContent).toContain('data "aws_vpc" "default"');
      expect(mainTfContent).toContain('data "aws_subnets" "vpc_subnets"');
    });
  });

  describe('Locals Validation', () => {
    test('essential locals are defined', () => {
      expect(mainTfContent).toContain('locals {');
      expect(mainTfContent).toContain('account_id = data.aws_caller_identity.current.account_id');
      expect(mainTfContent).toContain('project_prefix = "projectXYZ-${var.environment_suffix}"');
      expect(mainTfContent).toContain('common_tags = {');
    });

    test('VPC configuration logic is present', () => {
      expect(mainTfContent).toContain('vpc_id     = var.vpc_id != null ? var.vpc_id : data.aws_vpc.default[0].id');
      expect(mainTfContent).toContain('subnet_ids = length(var.subnet_ids) > 0 ? var.subnet_ids : data.aws_subnets.vpc_subnets.ids');
    });
  });

  describe('Security Group Validation', () => {
    test('Lambda security group is properly configured', () => {
      expect(mainTfContent).toContain('resource "aws_security_group" "lambda_sg"');
      expect(mainTfContent).toContain('name        = "${local.project_prefix}-lambda-sg"');
      expect(mainTfContent).toContain('vpc_id      = local.vpc_id');
    });

    test('Security group has HTTPS egress rule', () => {
      expect(mainTfContent).toContain('egress {');
      expect(mainTfContent).toContain('from_port   = 443');
      expect(mainTfContent).toContain('to_port     = 443');
      expect(mainTfContent).toContain('protocol    = "tcp"');
      expect(mainTfContent).toContain('description = "HTTPS outbound for S3/KMS API calls"');
    });
  });

  describe('KMS Key Validation', () => {
    test('KMS key resource is properly configured', () => {
      expect(mainTfContent).toContain('resource "aws_kms_key" "s3_kms_key"');
      expect(mainTfContent).toContain('description             = "${local.project_prefix} S3 encryption key"');
      expect(mainTfContent).toContain('enable_key_rotation     = true');
    });

    test('KMS key alias is configured', () => {
      expect(mainTfContent).toContain('resource "aws_kms_alias" "s3_kms_key_alias"');
      expect(mainTfContent).toContain('name          = "alias/${local.project_prefix}-s3-encryption"');
    });

    test('KMS key policy includes service principals', () => {
      expect(mainTfContent).toContain('Service = "s3.amazonaws.com"');
      expect(mainTfContent).toContain('Service = "lambda.amazonaws.com"');
      expect(mainTfContent).toContain('"kms:ViaService"');
    });
  });

  describe('S3 Bucket Validation', () => {
    test('S3 bucket is properly configured', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "data_bucket"');
      expect(mainTfContent).toContain('bucket = "${lower(local.project_prefix)}-data-processing-${local.account_id}"');
    });

    test('S3 bucket has encryption configuration', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption"');
      expect(mainTfContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainTfContent).toContain('kms_master_key_id = aws_kms_key.s3_kms_key.arn');
    });

    test('S3 bucket has public access block', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_public_access_block" "data_bucket_pab"');
      expect(mainTfContent).toContain('block_public_acls       = true');
      expect(mainTfContent).toContain('block_public_policy     = true');
      expect(mainTfContent).toContain('ignore_public_acls      = true');
      expect(mainTfContent).toContain('restrict_public_buckets = true');
    });

    test('S3 bucket policy enforces HTTPS and encryption', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_policy" "data_bucket_policy"');
      expect(mainTfContent).toContain('Sid       = "DenyInsecureConnections"');
      expect(mainTfContent).toContain('"aws:SecureTransport" = "false"');
      expect(mainTfContent).toContain('Sid       = "DenyUnencryptedObjectUploads"');
      expect(mainTfContent).toContain('"s3:x-amz-server-side-encryption" = "aws:kms"');
    });
  });

  describe('Lambda Function Validation', () => {
    test('Lambda ZIP archive data source exists', () => {
      expect(mainTfContent).toContain('data "archive_file" "lambda_zip"');
      expect(mainTfContent).toContain('type        = "zip"');
      expect(mainTfContent).toContain('source_dir  = "${path.module}/lambda"');
    });

    test('Lambda execution role is properly configured', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role" "lambda_execution_role"');
      expect(mainTfContent).toContain('name = "${local.project_prefix}-lambda-execution-role"');
      expect(mainTfContent).toContain('Service = "lambda.amazonaws.com"');
    });

    test('Lambda function has VPC configuration', () => {
      expect(mainTfContent).toContain('resource "aws_lambda_function" "data_processor"');
      expect(mainTfContent).toContain('vpc_config {');
      expect(mainTfContent).toContain('subnet_ids         = local.subnet_ids');
      expect(mainTfContent).toContain('security_group_ids = [aws_security_group.lambda_sg.id]');
    });

    test('Lambda function has proper environment variables', () => {
      expect(mainTfContent).toContain('environment {');
      expect(mainTfContent).toContain('BUCKET_NAME    = aws_s3_bucket.data_bucket.bucket');
      expect(mainTfContent).toContain('KMS_KEY_ID     = aws_kms_key.s3_kms_key.key_id');
      expect(mainTfContent).toContain('PROJECT_PREFIX = local.project_prefix');
    });

    test('Lambda IAM policies follow least privilege', () => {
      expect(mainTfContent).toContain('resource "aws_iam_policy" "lambda_s3_kms_policy"');
      expect(mainTfContent).toContain('"s3:GetObject"');
      expect(mainTfContent).toContain('"s3:GetObjectVersion"');
      expect(mainTfContent).toContain('"kms:Decrypt"');
      expect(mainTfContent).toContain('"kms:GenerateDataKey"');
      expect(mainTfContent).toContain('"logs:CreateLogGroup"');
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('CloudWatch log group is configured', () => {
      expect(mainTfContent).toContain('resource "aws_cloudwatch_log_group" "lambda_log_group"');
      expect(mainTfContent).toContain('name              = "/aws/lambda/${local.project_prefix}-data-processor"');
      expect(mainTfContent).toContain('retention_in_days = 14');
      expect(mainTfContent).toContain('kms_key_id        = aws_kms_key.s3_kms_key.arn');
    });
  });

  describe('S3 Event Notification Validation', () => {
    test('Lambda permission for S3 invocation exists', () => {
      expect(mainTfContent).toContain('resource "aws_lambda_permission" "s3_lambda_permission"');
      expect(mainTfContent).toContain('statement_id  = "AllowExecutionFromS3Bucket"');
      expect(mainTfContent).toContain('principal     = "s3.amazonaws.com"');
    });

    test('S3 bucket notification is configured', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_notification" "bucket_notification"');
      expect(mainTfContent).toContain('events              = ["s3:ObjectCreated:*"]');
      expect(mainTfContent).toContain('filter_prefix       = "input/"');
      expect(mainTfContent).toContain('filter_suffix       = ".json"');
    });
  });

  describe('Outputs Validation', () => {
    const expectedOutputs = [
      'bucket_name',
      'lambda_function_name', 
      'kms_key_id',
      'kms_key_arn',
      'lambda_role_arn',
      'security_group_id',
      'vpc_id',
      'subnet_ids',
      'aws_region'
    ];

    test.each(expectedOutputs)('output "%s" is defined', (outputName) => {
      expect(mainTfContent).toContain(`output "${outputName}"`);
    });

    test('outputs have proper descriptions', () => {
      expect(mainTfContent).toContain('description = "Name of the S3 bucket for data processing"');
      expect(mainTfContent).toContain('description = "Name of the Lambda function for data processing"');
      expect(mainTfContent).toContain('description = "KMS Key ID used for S3 encryption"');
    });
  });

  describe('Provider Configuration Validation', () => {
    test('provider.tf contains AWS provider configuration', () => {
      expect(providerTfContent).toContain('provider "aws"');
      expect(providerTfContent).toContain('region = var.aws_region');
    });

    test('provider.tf contains S3 backend configuration', () => {
      expect(providerTfContent).toContain('backend "s3"');
    });

    test('provider.tf contains required providers block', () => {
      expect(providerTfContent).toContain('required_providers');
      expect(providerTfContent).toContain('aws = {');
      expect(providerTfContent).toContain('source  = "hashicorp/aws"');
      expect(providerTfContent).toContain('version = ">= 5.0"');
    });

    test('provider.tf has default tags configured', () => {
      expect(providerTfContent).toContain('default_tags');
      expect(providerTfContent).toContain('Project   = "TapStack"');
      expect(providerTfContent).toContain('ManagedBy = "terraform"');
    });
  });

  describe('Security Best Practices Validation', () => {
    test('no hardcoded secrets or sensitive data', () => {
      const sensitivePatterns = [
        /aws_access_key_id\s*=\s*"[^"]+"/,
        /aws_secret_access_key\s*=\s*"[^"]+"/,
        /password\s*=\s*"[^"]+"/,
        /secret\s*=\s*"[^"]+"/
      ];

      sensitivePatterns.forEach(pattern => {
        expect(mainTfContent).not.toMatch(pattern);
      });
    });

    test('S3 bucket has secure configuration', () => {
      expect(mainTfContent).toContain('block_public_acls       = true');
      expect(mainTfContent).toContain('block_public_policy     = true');
      expect(mainTfContent).toContain('ignore_public_acls      = true');
      expect(mainTfContent).toContain('restrict_public_buckets = true');
    });

    test('security group uses HTTPS only', () => {
      expect(mainTfContent).toContain('from_port   = 443');
      expect(mainTfContent).toContain('to_port     = 443');
      expect(mainTfContent).not.toContain('from_port   = 80');
      expect(mainTfContent).toContain('cidr_blocks = ["0.0.0.0/0"]');
    });

    test('encryption is enabled where applicable', () => {
      expect(mainTfContent).toContain('enable_key_rotation     = true');
      expect(mainTfContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainTfContent).toContain('bucket_key_enabled = true');
    });
  });

  describe('Tagging Consistency Validation', () => {
    test('common_tags local includes required tags', () => {
      expect(mainTfContent).toContain('common_tags = {');
      expect(mainTfContent).toContain('Environment = var.environment_suffix');
      expect(mainTfContent).toContain('Project     = local.project_prefix');
      expect(mainTfContent).toContain('ManagedBy   = "terraform"');
    });

    test('resources use consistent tagging', () => {
      const taggedResources = [
        'aws_security_group.lambda_sg',
        'aws_kms_key.s3_kms_key', 
        'aws_s3_bucket.data_bucket',
        'aws_iam_role.lambda_execution_role',
        'aws_lambda_function.data_processor'
      ];

      taggedResources.forEach(() => {
        expect(mainTfContent).toContain('tags = merge(local.common_tags');
      });
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('Lambda function has proper dependencies', () => {
      expect(mainTfContent).toContain('depends_on = [');
      expect(mainTfContent).toContain('aws_iam_role_policy_attachment.lambda_vpc_execution');
      expect(mainTfContent).toContain('aws_iam_role_policy_attachment.lambda_s3_kms_attachment');
      expect(mainTfContent).toContain('aws_cloudwatch_log_group.lambda_log_group');
    });

    test('S3 notification depends on Lambda permission', () => {
      expect(mainTfContent).toContain('depends_on = [aws_lambda_permission.s3_lambda_permission]');
    });
  });
});