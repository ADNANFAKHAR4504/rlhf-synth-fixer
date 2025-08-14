import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests (Content-based)', () => {
  const tfDir = path.join(__dirname, '../lib');
  let mainContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    // Read all terraform files for content-based testing
    try {
      mainContent = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
      variablesContent = fs.readFileSync(path.join(tfDir, 'variables.tf'), 'utf-8');
      outputsContent = fs.readFileSync(path.join(tfDir, 'outputs.tf'), 'utf-8');
      providerContent = fs.readFileSync(path.join(tfDir, 'provider.tf'), 'utf-8');
    } catch (error) {
      console.error('Failed to read Terraform files:', error);
      throw error;
    }
  });

  describe('Terraform Configuration Validation', () => {
    test('should have valid Terraform syntax (basic check)', () => {
      // Basic syntax validation by checking for matching braces
      const openBraces = (mainContent.match(/\{/g) || []).length;
      const closeBraces = (mainContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should use required Terraform version', () => {
      expect(providerContent).toContain('required_version = ">= 1.4.0"');
    });

    test('should have AWS provider configured', () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should have archive provider configured', () => {
      expect(providerContent).toContain('archive = {');
      expect(providerContent).toContain('source  = "hashicorp/archive"');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resources should include environment suffix in naming', () => {
      expect(mainContent).toContain('${var.environment_suffix}');
      expect(mainContent).toContain(
        'name_prefix = "${local.account_id}-security-${var.environment_suffix}"'
      );
    });

    test('all resources should have proper tags', () => {
      expect(mainContent).toContain('tags = local.common_tags');
      // Check that the common_tags contains expected keys (ignore spacing)
      expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(mainContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(mainContent).toMatch(
        /EnvironmentSuffix\s*=\s*var\.environment_suffix/
      );
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('should have KMS key resource defined', () => {
      expect(mainContent).toContain('resource "aws_kms_key" "security_key"');
      expect(mainContent).toContain('enable_key_rotation     = true');
      expect(mainContent).toContain('deletion_window_in_days = 7');
    });

    test('KMS key should have proper policy for CloudWatch Logs', () => {
      expect(mainContent).toContain('Sid    = "Allow CloudWatch Logs"');
      expect(mainContent).toContain(
        'Service = "logs.${local.region}.amazonaws.com"'
      );
    });

    test('should have KMS key alias', () => {
      expect(mainContent).toContain('resource "aws_kms_alias"');
      expect(mainContent).toContain('alias/');
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    test('all S3 buckets should have encryption configured', () => {
      // Verify encryption is configured in the Terraform code
      expect(mainContent).toContain(
        'aws_s3_bucket_server_side_encryption_configuration'
      );
      expect(mainContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainContent).toContain('bucket_key_enabled = true');
      expect(mainContent).toContain(
        'kms_master_key_id = aws_kms_key.security_key.arn'
      );

      // Count encryption configurations in the code
      const encryptionMatches = mainContent.match(
        /aws_s3_bucket_server_side_encryption_configuration/g
      );
      expect(encryptionMatches?.length).toBeGreaterThanOrEqual(3); // 3 buckets should have encryption
    });

    test('all S3 buckets should have public access blocked', () => {
      expect(mainContent).toContain('aws_s3_bucket_public_access_block');
      expect(mainContent).toContain('block_public_acls       = true');
      expect(mainContent).toContain('block_public_policy     = true');
      expect(mainContent).toContain('ignore_public_acls      = true');
      expect(mainContent).toContain('restrict_public_buckets = true');
    });

    test('all S3 buckets should have force_destroy enabled', () => {
      expect(mainContent).toContain('force_destroy = true');
    });

    test('secure bucket should have SSL-only policy', () => {
      expect(mainContent).toContain('DenyUnSecureCommunications');
      expect(mainContent).toContain('"aws:SecureTransport" = "false"');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have security monitoring role with proper permissions', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "security_monitoring_role"');
      expect(mainContent).toContain('monitoring-role');
    });

    test('should have cross-account role with external ID', () => {
      expect(mainContent).toContain('cross_account_role');
      expect(mainContent).toContain('sts:ExternalId');
    });

    test('Lambda execution role should have necessary permissions', () => {
      expect(mainContent).toContain('lambda_execution_role');
      expect(mainContent).toContain('logs:CreateLogGroup');
      expect(mainContent).toContain('sns:Publish');
      expect(mainContent).toContain('kms:Decrypt');
    });

    test('Config role should have proper service permissions', () => {
      expect(mainContent).toContain('resource "aws_iam_role" "config_role"');
      expect(mainContent).toContain('config.amazonaws.com');
    });
  });

  describe('CloudWatch and SNS Configuration', () => {
    test('should have CloudWatch log group with KMS encryption', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_group"');
      expect(mainContent).toContain('retention_in_days = 90');
      expect(mainContent).toContain('kms_key_id');
      expect(mainContent).toContain('aws_kms_key.security_key');
    });

    test('should have CloudWatch metric filter for IAM actions', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_log_metric_filter"');
      expect(mainContent).toContain('CreateUser');
      expect(mainContent).toContain('DeleteRole');
    });

    test('should have CloudWatch alarm for IAM actions', () => {
      expect(mainContent).toContain('resource "aws_cloudwatch_metric_alarm"');
      expect(mainContent).toContain('name      = "IAMActions"');
      expect(mainContent).toContain('threshold           = "1"');
    });

    test('should have SNS topic with KMS encryption', () => {
      expect(mainContent).toContain(
        'resource "aws_sns_topic" "security_alerts"'
      );
      expect(mainContent).toMatch(
        /kms_master_key_id\s*=\s*aws_kms_key\.security_key/
      );
    });
  });

  describe('Lambda and Step Functions', () => {
    test('should have Lambda function for security response', () => {
      expect(mainContent).toContain('resource "aws_lambda_function"');
      expect(mainContent).toContain('runtime       = "python3.9"');
      expect(mainContent).toContain('timeout       = 300');
      expect(mainContent).toContain('handler       = "index.handler"');
    });

    test('Lambda function should have environment variables', () => {
      expect(mainContent).toContain('environment {');
      expect(mainContent).toContain('SNS_TOPIC_ARN');
      expect(mainContent).toContain('KMS_KEY_ID');
    });

    test('should have Step Function state machine', () => {
      expect(mainContent).toContain('resource "aws_sfn_state_machine"');
      expect(mainContent).toContain('ProcessSecurityEvent');
      expect(mainContent).toContain('StartAt');
    });
  });

  describe('AWS Config Configuration', () => {
    test('should have Config recorder with all resources enabled', () => {
      expect(mainContent).toContain('resource "aws_config_configuration_recorder"');
      expect(mainContent).toContain('all_supported                 = true');
      expect(mainContent).toContain('include_global_resource_types = true');
    });

    test('should have Config delivery channel', () => {
      expect(mainContent).toContain('resource "aws_config_delivery_channel"');
      expect(mainContent).toContain('s3_key_prefix  = "config"');
    });

    test('Config bucket should have proper policy', () => {
      expect(mainContent).toContain('config_bucket_policy');
      expect(mainContent).toContain('AWSConfigBucketPermissionsCheck');
      expect(mainContent).toContain('Service = "config.amazonaws.com"');
    });
  });

  describe('Security Hub and GuardDuty', () => {
    test('should have Security Hub enabled', () => {
      expect(mainContent).toContain('resource "aws_securityhub_account"');
    });

    test('should have Security Hub standards subscriptions', () => {
      expect(mainContent).toContain('resource "aws_securityhub_standards_subscription"');
      expect(mainContent).toContain('aws-foundational-security-best-practices');
      expect(mainContent).toContain('cis-aws-foundations-benchmark');
    });

    test('should have GuardDuty detector enabled', () => {
      expect(mainContent).toContain('resource "aws_guardduty_detector"');
      expect(mainContent).toContain('enable = true');
    });

    test('should have GuardDuty features enabled', () => {
      expect(mainContent).toContain('resource "aws_guardduty_detector_feature"');
      expect(mainContent).toContain('S3_DATA_EVENTS');
      expect(mainContent).toContain('EKS_AUDIT_LOGS');
      expect(mainContent).toContain('EBS_MALWARE_PROTECTION');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs defined', () => {
      const requiredOutputs = [
        'kms_key_id',
        'kms_key_arn',
        'sns_topic_arn',
        'secure_bucket_name',
        'lambda_function_name',
        'step_function_arn',
        'guardduty_detector_id',
        'security_hub_account_id',
        'cloudwatch_log_group_name',
        'security_monitoring_role_arn',
        'cross_account_role_arn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });
  });

  describe('Variables', () => {
    test('should have all required variables defined', () => {
      const requiredVars = [
        'aws_region',
        'environment',
        'project_name',
        'notification_email',
        'environment_suffix',
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toContain(`variable "${varName}"`);
      });
    });

    test('environment_suffix variable should have proper default', () => {
      expect(variablesContent).toContain('variable "environment_suffix"');
      expect(variablesContent).toContain('default     = "dev"');
    });
  });
});
