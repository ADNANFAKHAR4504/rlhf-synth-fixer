/**
 * Unit Tests for Terraform Infrastructure
 * 
 * This test suite provides comprehensive static analysis validation of the Terraform
 * infrastructure code without executing Terraform commands. Tests validate file structure,
 * provider configuration, resource naming, security settings, and best practices.
 * 
 * Requirements:
 * - 90%+ code coverage (MANDATORY)
 * - Static analysis using regex patterns
 * - No hardcoded environment suffixes
 * - Validation of AWS Provider 5.x+ compliance
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Read Terraform files as text for static analysis
    mainTfContent = fs.readFileSync(path.join(__dirname, '../lib/main.tf'), 'utf8');
    providerTfContent = fs.readFileSync(path.join(__dirname, '../lib/provider.tf'), 'utf8');
  });

  // Helper function to check if a pattern exists in content
  const has = (content: string, pattern: string | RegExp): boolean => {
    if (typeof pattern === 'string') {
      return content.includes(pattern);
    }
    return pattern.test(content);
  };

  // Helper function to count occurrences of a pattern
  const count = (content: string, pattern: string | RegExp): number => {
    if (typeof pattern === 'string') {
      return (content.match(new RegExp(pattern, 'g')) || []).length;
    }
    return (content.match(pattern) || []).length;
  };

  describe('1. File Structure & Separation', () => {
    test('should have separate provider.tf and main.tf files', () => {
      expect(providerTfContent).toBeTruthy();
      expect(mainTfContent).toBeTruthy();
      expect(providerTfContent.length).toBeGreaterThan(0);
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    test('should separate provider configuration from resources', () => {
      expect(has(providerTfContent, 'terraform {')).toBe(true);
      expect(has(providerTfContent, 'provider "aws"')).toBe(true);
      expect(has(mainTfContent, 'resource "')).toBe(true);
      expect(has(mainTfContent, 'terraform {')).toBe(false);
    });

    test('should organize code with clear section headers', () => {
      expect(has(mainTfContent, '# Data Sources')).toBe(true);
      expect(has(mainTfContent, '# Variables')).toBe(true);
      expect(has(mainTfContent, '# Locals')).toBe(true);
      expect(has(mainTfContent, '# Outputs')).toBe(true);
      expect(has(mainTfContent, '# ===========================')).toBe(true);
    });

    test('should have logical resource grouping', () => {
      expect(has(mainTfContent, '# S3 Bucket Configuration')).toBe(true);
      expect(has(mainTfContent, '# Lambda Function')).toBe(true);
      expect(has(mainTfContent, '# EventBridge Configuration')).toBe(true);
      expect(has(mainTfContent, '# DynamoDB Table')).toBe(true);
      expect(has(mainTfContent, '# IAM Roles and Policies')).toBe(true);
    });
  });

  describe('2. Provider Configuration & Compliance', () => {
    test('should specify correct Terraform version requirement', () => {
      expect(has(providerTfContent, 'required_version = ">= 1.0"')).toBe(true);
    });

    test('should use AWS Provider 6.x (not deprecated 5.x)', () => {
      expect(has(providerTfContent, 'version = "~> 6.0"')).toBe(true);
      expect(has(providerTfContent, '~> 5.')).toBe(false);
    });

    test('should include random provider for suffix generation', () => {
      expect(has(providerTfContent, 'random = {')).toBe(true);
      expect(has(providerTfContent, 'version = "~> 3.5"')).toBe(true);
    });

    test('should configure S3 backend', () => {
      expect(has(providerTfContent, 'backend "s3"')).toBe(true);
    });

    test('should have default tags configuration', () => {
      expect(has(providerTfContent, 'default_tags')).toBe(true);
      expect(has(providerTfContent, 'Environment = var.environment')).toBe(true);
      expect(has(providerTfContent, 'ManagedBy   = "terraform"')).toBe(true);
    });
  });

  describe('3. Data Sources & Variables', () => {
    test('should define required data sources', () => {
      expect(has(mainTfContent, 'data "aws_caller_identity" "current"')).toBe(true);
      expect(has(mainTfContent, 'data "aws_region" "current"')).toBe(true);
    });

    test('should have properly defined variables with descriptions', () => {
      expect(has(mainTfContent, 'variable "aws_region"')).toBe(true);
      expect(has(mainTfContent, 'variable "environment"')).toBe(true);
      expect(has(mainTfContent, 'variable "notification_email"')).toBe(true);
      expect(count(mainTfContent, /description\s*=\s*"/g)).toBeGreaterThanOrEqual(3);
    });

    test('should have appropriate default values', () => {
      expect(has(mainTfContent, 'default     = "us-west-2"')).toBe(true);
      expect(has(mainTfContent, 'default     = "prod"')).toBe(true);
      expect(has(mainTfContent, 'default     = "team@example.com"')).toBe(true);
    });

    test('should specify variable types', () => {
      expect(count(mainTfContent, /type\s*=\s*string/g)).toBeGreaterThanOrEqual(3);
    });
  });

  describe('4. Locals & Common Tags', () => {
    test('should define common_tags in locals', () => {
      expect(has(mainTfContent, 'locals {')).toBe(true);
      expect(has(mainTfContent, 'common_tags = {')).toBe(true);
    });

    test('should have proper tag structure', () => {
      expect(has(mainTfContent, 'System      = "file-processing"')).toBe(true);
      expect(has(mainTfContent, 'CostCenter  = "content-management"')).toBe(true);
      expect(has(mainTfContent, 'Compliance  = "internal"')).toBe(true);
    });

    test('should define configuration constants in locals', () => {
      expect(has(mainTfContent, 'lambda_timeout     = 60')).toBe(true);
      expect(has(mainTfContent, 'lambda_memory      = 512')).toBe(true);
      expect(has(mainTfContent, 'log_retention_days = 7')).toBe(true);
      expect(has(mainTfContent, 'alarm_period      = 300')).toBe(true);
    });

    test('should have resource_prefix in locals', () => {
      expect(has(mainTfContent, 'resource_prefix = "cms-file-processor"')).toBe(true);
    });
  });

  describe('5. Random Suffix Configuration', () => {
    test('should configure random string with correct parameters', () => {
      expect(has(mainTfContent, 'resource "random_string" "suffix"')).toBe(true);
    });

    test('should have length = 8', () => {
      expect(has(mainTfContent, 'length  = 8')).toBe(true);
    });

    test('should have special = false', () => {
      expect(has(mainTfContent, 'special = false')).toBe(true);
    });

    test('should have upper = false', () => {
      expect(has(mainTfContent, 'upper   = false')).toBe(true);
    });

    test('should allow numeric characters', () => {
      expect(has(mainTfContent, 'numeric = true')).toBe(true);
    });
  });

  describe('6. Resource Naming Standards', () => {
    test('should use consistent naming pattern with random suffix', () => {
      const namingPattern = /\$\{local\.resource_prefix\}-.*-\$\{random_string\.suffix\.result\}/g;
      expect(count(mainTfContent, namingPattern)).toBeGreaterThanOrEqual(10);
    });

    test('should not have hardcoded environment names in resource names', () => {
      expect(has(mainTfContent, 'prod-')).toBe(false);
      expect(has(mainTfContent, 'dev-')).toBe(false);
      expect(has(mainTfContent, 'staging-')).toBe(false);
      expect(has(mainTfContent, 'test-')).toBe(false);
    });

    test('should use random suffix in all major resources', () => {
      expect(has(mainTfContent, '${local.resource_prefix}-${random_string.suffix.result}')).toBe(true);
      expect(has(mainTfContent, 'uploads-${random_string.suffix.result}')).toBe(true);
      expect(has(mainTfContent, 'notifications-${random_string.suffix.result}')).toBe(true);
      expect(has(mainTfContent, 'metadata-${random_string.suffix.result}')).toBe(true);
    });
  });

  describe('7. Security Configuration', () => {
    test('should enable S3 server-side encryption', () => {
      expect(has(mainTfContent, 'aws_s3_bucket_server_side_encryption_configuration')).toBe(true);
      expect(has(mainTfContent, 'sse_algorithm = "AES256"')).toBe(true);
    });

    test('should configure S3 public access blocks', () => {
      expect(has(mainTfContent, 'aws_s3_bucket_public_access_block')).toBe(true);
      expect(has(mainTfContent, 'block_public_acls       = true')).toBe(true);
      expect(has(mainTfContent, 'block_public_policy     = true')).toBe(true);
      expect(has(mainTfContent, 'ignore_public_acls      = true')).toBe(true);
      expect(has(mainTfContent, 'restrict_public_buckets = true')).toBe(true);
    });

    test('should enable S3 bucket versioning', () => {
      expect(has(mainTfContent, 'aws_s3_bucket_versioning')).toBe(true);
      expect(has(mainTfContent, 'status = "Enabled"')).toBe(true);
    });

    test('should configure SNS topic with KMS encryption', () => {
      expect(has(mainTfContent, 'kms_master_key_id = "alias/aws/sns"')).toBe(true);
    });

    test('should enable DynamoDB point-in-time recovery', () => {
      expect(has(mainTfContent, 'point_in_time_recovery')).toBe(true);
      expect(has(mainTfContent, 'enabled = true')).toBe(true);
    });
  });

  describe('8. AWS Provider 6.x Compliance', () => {
    test('should not use deprecated resource types', () => {
      expect(has(mainTfContent, 'aws_s3_bucket_encryption')).toBe(false);
      expect(has(mainTfContent, 'aws_s3_bucket_acl')).toBe(false);
    });

    test('should use separate encryption configuration resource', () => {
      expect(has(mainTfContent, 'aws_s3_bucket_server_side_encryption_configuration')).toBe(true);
    });

    test('should use pay-per-request billing for DynamoDB', () => {
      expect(has(mainTfContent, 'billing_mode = "PAY_PER_REQUEST"')).toBe(true);
    });

    test('should use current Lambda runtime', () => {
      expect(has(mainTfContent, 'runtime         = "nodejs18.x"')).toBe(true);
    });
  });

  describe('9. IAM Security & Policies', () => {
    test('should use jsonencode for IAM policies', () => {
      expect(count(mainTfContent, /jsonencode\s*\(/g)).toBeGreaterThanOrEqual(2);
    });

    test('should not have hardcoded ARNs in policies', () => {
      expect(has(mainTfContent, 'arn:aws:iam::123456789012:')).toBe(false);
      expect(has(mainTfContent, 'arn:aws:s3:::my-bucket')).toBe(false);
    });

    test('should use resource references in policies', () => {
      expect(has(mainTfContent, '${aws_s3_bucket.file_uploads.arn}')).toBe(true);
      expect(has(mainTfContent, '${aws_dynamodb_table.file_metadata.arn}')).toBe(true);
      expect(has(mainTfContent, 'aws_sns_topic.notifications.arn')).toBe(true);
    });

    test('should follow least privilege principle', () => {
      expect(has(mainTfContent, '"s3:GetObject"')).toBe(true);
      expect(has(mainTfContent, '"s3:ListBucket"')).toBe(true);
      expect(has(mainTfContent, '"dynamodb:PutItem"')).toBe(true);
      expect(has(mainTfContent, '"sns:Publish"')).toBe(true);
      expect(has(mainTfContent, '"s3:*"')).toBe(false); // Should not use wildcard
    });

    test('should include CloudWatch logging permissions', () => {
      expect(has(mainTfContent, '"logs:CreateLogGroup"')).toBe(true);
      expect(has(mainTfContent, '"logs:CreateLogStream"')).toBe(true);
      expect(has(mainTfContent, '"logs:PutLogEvents"')).toBe(true);
    });
  });

  describe('10. Lambda Configuration', () => {
    test('should configure Lambda with proper settings', () => {
      expect(has(mainTfContent, 'timeout         = local.lambda_timeout')).toBe(true);
      expect(has(mainTfContent, 'memory_size     = local.lambda_memory')).toBe(true);
    });

    test('should have environment variables configuration', () => {
      expect(has(mainTfContent, 'environment {')).toBe(true);
      expect(has(mainTfContent, 'DYNAMODB_TABLE = aws_dynamodb_table.file_metadata.name')).toBe(true);
      expect(has(mainTfContent, 'SNS_TOPIC_ARN  = aws_sns_topic.notifications.arn')).toBe(true);
      expect(has(mainTfContent, 'BUCKET_NAME    = aws_s3_bucket.file_uploads.id')).toBe(true);
    });

    test('should have Lambda permission for EventBridge', () => {
      expect(has(mainTfContent, 'aws_lambda_permission')).toBe(true);
      expect(has(mainTfContent, 'principal     = "events.amazonaws.com"')).toBe(true);
    });

    test('should include placeholder deployment package', () => {
      expect(has(mainTfContent, 'data "archive_file" "lambda_placeholder"')).toBe(true);
      expect(has(mainTfContent, 'type        = "zip"')).toBe(true);
    });
  });

  describe('11. EventBridge & Monitoring', () => {
    test('should configure EventBridge rule for S3 events', () => {
      expect(has(mainTfContent, 'aws_cloudwatch_event_rule')).toBe(true);
      expect(has(mainTfContent, 'event_pattern = jsonencode')).toBe(true);
    });

    test('should have EventBridge target configuration', () => {
      expect(has(mainTfContent, 'aws_cloudwatch_event_target')).toBe(true);
      expect(has(mainTfContent, 'target_id = "LambdaTarget"')).toBe(true);
    });

    test('should configure S3 EventBridge notifications', () => {
      expect(has(mainTfContent, 'aws_s3_bucket_notification')).toBe(true);
      expect(has(mainTfContent, 'eventbridge = true')).toBe(true);
    });
  });

  describe('12. CloudWatch Alarms & Monitoring', () => {
    test('should have Lambda error rate alarm', () => {
      expect(has(mainTfContent, 'aws_cloudwatch_metric_alarm" "lambda_error_rate')).toBe(true);
      expect(has(mainTfContent, 'metric_name        = "Errors"')).toBe(true);
      expect(has(mainTfContent, 'namespace          = "AWS/Lambda"')).toBe(true);
    });

    test('should have DynamoDB write capacity alarm', () => {
      expect(has(mainTfContent, 'dynamodb_write_capacity')).toBe(true);
      expect(has(mainTfContent, 'metric_name        = "ConsumedWriteCapacityUnits"')).toBe(true);
    });

    test('should have Lambda invocation monitoring', () => {
      expect(has(mainTfContent, 'lambda_invocations')).toBe(true);
      expect(has(mainTfContent, 'metric_name        = "Invocations"')).toBe(true);
    });

    test('should configure alarm actions to SNS', () => {
      expect(count(mainTfContent, /alarm_actions = \[aws_sns_topic\.notifications\.arn\]/g)).toBeGreaterThanOrEqual(3);
    });
  });

  describe('13. DynamoDB Configuration', () => {
    test('should configure DynamoDB table with hash key', () => {
      expect(has(mainTfContent, 'aws_dynamodb_table')).toBe(true);
      expect(has(mainTfContent, 'hash_key     = "upload_id"')).toBe(true);
    });

    test('should define proper attribute configuration', () => {
      expect(has(mainTfContent, 'name = "upload_id"')).toBe(true);
      expect(has(mainTfContent, 'name = "s3_key"')).toBe(true);
      expect(has(mainTfContent, 'name = "upload_timestamp"')).toBe(true);
    });

    test('should configure Global Secondary Indexes', () => {
      expect(has(mainTfContent, 'global_secondary_index')).toBe(true);
      expect(has(mainTfContent, 'name            = "S3KeyIndex"')).toBe(true);
      expect(has(mainTfContent, 'name            = "TimestampIndex"')).toBe(true);
    });

    test('should have TTL configuration', () => {
      expect(has(mainTfContent, 'ttl {')).toBe(true);
      expect(has(mainTfContent, 'enabled        = false')).toBe(true);
    });
  });

  describe('14. Outputs Configuration', () => {
    test('should have all required outputs with descriptions', () => {
      expect(has(mainTfContent, 'output "s3_bucket_name"')).toBe(true);
      expect(has(mainTfContent, 'output "lambda_function_arn"')).toBe(true);
      expect(has(mainTfContent, 'output "sns_topic_arn"')).toBe(true);
      expect(has(mainTfContent, 'output "dynamodb_table_name"')).toBe(true);
      expect(has(mainTfContent, 'output "deployment_region"')).toBe(true);
    });

    test('should have proper output descriptions', () => {
      expect(count(mainTfContent, /output.*{\s*description/g)).toBeGreaterThanOrEqual(6);
    });

    test('should output resource identifiers, not hardcoded values', () => {
      expect(has(mainTfContent, 'value       = aws_s3_bucket.file_uploads.id')).toBe(true);
      expect(has(mainTfContent, 'value       = aws_lambda_function.file_processor.arn')).toBe(true);
      expect(has(mainTfContent, 'value       = data.aws_region.current.id')).toBe(true);
    });
  });

  describe('15. Destroyability & No Retention Policies', () => {
    test('should not have prevent_destroy lifecycle rules', () => {
      expect(has(mainTfContent, 'prevent_destroy')).toBe(false);
    });

    test('should not have retain deletion policies', () => {
      expect(has(mainTfContent, 'deletion_policy = "Retain"')).toBe(false);
      expect(has(mainTfContent, 'DeletionPolicy.*Retain')).toBe(false);
    });

    test('should have short log retention periods', () => {
      expect(has(mainTfContent, 'retention_in_days = local.log_retention_days')).toBe(true);
      expect(has(mainTfContent, 'log_retention_days = 7')).toBe(true);
    });

    test('should use pay-per-request DynamoDB billing', () => {
      expect(has(mainTfContent, 'billing_mode = "PAY_PER_REQUEST"')).toBe(true);
      expect(has(mainTfContent, 'provisioned_throughput')).toBe(false);
    });
  });

  describe('16. Code Organization & Best Practices', () => {
    test('should use consistent resource naming', () => {
      const resourcePattern = /resource\s+"[\w_]+".*"[\w-]+"/g;
      expect(count(mainTfContent, resourcePattern)).toBeGreaterThanOrEqual(15);
    });

    test('should have proper tag merging patterns', () => {
      expect(count(mainTfContent, /merge\s*\(/g)).toBeGreaterThanOrEqual(5);
      expect(count(mainTfContent, /local\.common_tags/g)).toBeGreaterThanOrEqual(5);
    });

    test('should avoid magic numbers by using locals', () => {
      expect(has(mainTfContent, 'timeout         = local.lambda_timeout')).toBe(true);
      expect(has(mainTfContent, 'memory_size     = local.lambda_memory')).toBe(true);
      expect(has(mainTfContent, 'period             = local.alarm_period')).toBe(true);
    });

    test('should have comprehensive resource tagging', () => {
      expect(count(mainTfContent, /tags\s*=\s*merge/g)).toBeGreaterThanOrEqual(8);
    });

    test('should use proper Terraform syntax formatting', () => {
      expect(has(mainTfContent, '\n  ')).toBe(true); // Proper indentation
      expect(count(mainTfContent, /=\s/g)).toBeGreaterThan(50); // Proper spacing
    });

    test('should have CloudWatch log group for Lambda', () => {
      expect(has(mainTfContent, 'aws_cloudwatch_log_group')).toBe(true);
      expect(has(mainTfContent, 'name              = "/aws/lambda/${aws_lambda_function.file_processor.function_name}"')).toBe(true);
    });
  });
});