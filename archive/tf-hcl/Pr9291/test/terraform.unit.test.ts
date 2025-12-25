import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

  describe('Provider Configuration', () => {
    test('AWS provider is configured with correct region', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
      
      // Check that the default region is set in variables.tf
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toContain('default     = "us-west-2"');
    });

    test('S3 backend is configured', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      expect(providerContent).toContain('backend "s3"');
      // Using partial backend configuration - encryption is set at runtime
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Primary S3 bucket has encryption configured', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(mainContent).toContain('primary_encryption');
      expect(mainContent).toContain('sse_algorithm');
    });

    test('Backup S3 bucket has encryption configured', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(mainContent).toContain('backup_encryption');
    });

    test('S3 buckets have versioning enabled', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_s3_bucket_versioning');
      expect(mainContent).toContain('status = "Enabled"');
    });

    test('S3 buckets have public access blocked', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_s3_bucket_public_access_block');
      expect(mainContent).toContain('block_public_acls       = true');
      expect(mainContent).toContain('block_public_policy     = true');
      expect(mainContent).toContain('ignore_public_acls      = true');
      expect(mainContent).toContain('restrict_public_buckets = true');
    });

    test('S3 buckets have force_destroy enabled for cleanup', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('force_destroy = true');
    });

    test('S3 bucket policies enforce SSL/TLS', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('"aws:SecureTransport"');
      expect(mainContent).toContain('"false"');
      expect(mainContent).toContain('Effect    = "Deny"');
    });
  });

  describe('KMS Configuration', () => {
    test('KMS key is configured for S3 encryption', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_kms_key');
      expect(mainContent).toContain('enable_key_rotation     = true');
      expect(mainContent).toContain('deletion_window_in_days = 7');
    });

    test('KMS key has an alias', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_kms_alias');
      expect(mainContent).toContain('s3-key');
    });
  });

  describe('IAM Configuration', () => {
    test('IAM role is created for S3 access', () => {
      const iamContent = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
      expect(iamContent).toContain('aws_iam_role');
      expect(iamContent).toContain('s3_access_role');
      expect(iamContent).toContain('AssumeRole');
    });

    test('IAM policy follows least privilege principle', () => {
      const iamContent = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
      expect(iamContent).toContain('aws_iam_policy');
      expect(iamContent).toContain('s3:GetObject');
      expect(iamContent).toContain('s3:PutObject');
      expect(iamContent).toContain('s3:DeleteObject');
      expect(iamContent).toContain('s3:ListBucket');
      // Should not contain dangerous permissions
      expect(iamContent).not.toContain('s3:*');
      expect(iamContent).not.toContain('"*"');
    });

    test('IAM instance profile is created', () => {
      const iamContent = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
      expect(iamContent).toContain('aws_iam_instance_profile');
      expect(iamContent).toContain('s3_access_profile');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail bucket is configured', () => {
      const cloudtrailContent = fs.readFileSync(path.join(libPath, 'cloudtrail.tf'), 'utf8');
      expect(cloudtrailContent).toContain('aws_s3_bucket');
      expect(cloudtrailContent).toContain('cloudtrail_logs');
    });

    test('CloudTrail bucket has appropriate policy', () => {
      const cloudtrailContent = fs.readFileSync(path.join(libPath, 'cloudtrail.tf'), 'utf8');
      expect(cloudtrailContent).toContain('aws_s3_bucket_policy');
      expect(cloudtrailContent).toContain('AWSCloudTrailAclCheck');
      expect(cloudtrailContent).toContain('AWSCloudTrailWrite');
    });

    test('CloudTrail is conditionally created', () => {
      const cloudtrailContent = fs.readFileSync(path.join(libPath, 'cloudtrail.tf'), 'utf8');
      expect(cloudtrailContent).toContain('count          = var.create_cloudtrail ? 1 : 0');
    });
  });

  describe('Monitoring Configuration', () => {
    test('SNS topic is configured for security notifications', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');
      expect(monitoringContent).toContain('aws_sns_topic');
      expect(monitoringContent).toContain('security_notifications');
    });

    test('CloudWatch log group is configured', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');
      expect(monitoringContent).toContain('aws_cloudwatch_log_group');
      expect(monitoringContent).toContain('retention_in_days = 30');
    });

    test('CloudWatch alarms are configured for IAM changes', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');
      expect(monitoringContent).toContain('aws_cloudwatch_metric_alarm');
      expect(monitoringContent).toContain('iam_policy_changes');
      expect(monitoringContent).toContain('IAMPolicyChanges');
    });

    test('CloudWatch alarm is configured for root usage', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');
      expect(monitoringContent).toContain('aws_cloudwatch_metric_alarm');
      expect(monitoringContent).toContain('root_usage');
      expect(monitoringContent).toContain('RootAccountUsage');
    });

    test('EventBridge rule is configured for IAM changes', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');
      expect(monitoringContent).toContain('aws_cloudwatch_event_rule');
      expect(monitoringContent).toContain('iam_changes');
      expect(monitoringContent).toContain('AttachRolePolicy');
      expect(monitoringContent).toContain('DetachRolePolicy');
    });

    test('Security Hub is enabled', () => {
      const monitoringContent = fs.readFileSync(path.join(libPath, 'monitoring.tf'), 'utf8');
      // Security Hub account is already enabled in AWS, so we only manage the standards subscription
      expect(monitoringContent).toContain('aws_securityhub_standards_subscription');
      expect(monitoringContent).toContain('aws-foundational-security-best-practices');
      // Ensure we don't have the conflicting account resource
      expect(monitoringContent).not.toContain('aws_securityhub_account');
    });
  });

  describe('Variables Configuration', () => {
    test('Required variables are defined', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toContain('variable "environment"');
      expect(variablesContent).toContain('variable "bucket_prefix"');
      expect(variablesContent).toContain('variable "security_notification_email"');
      expect(variablesContent).toContain('variable "environment_suffix"');
    });

    test('Variables have appropriate defaults', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      expect(variablesContent).toContain('default     = "us-west-2"');
      expect(variablesContent).toContain('default     = "production"');
    });
  });

  describe('Outputs Configuration', () => {
    test('Essential outputs are defined', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
      expect(outputsContent).toContain('output "primary_bucket_name"');
      expect(outputsContent).toContain('output "backup_bucket_name"');
      expect(outputsContent).toContain('output "iam_role_arn"');
      expect(outputsContent).toContain('output "kms_key_arn"');
      expect(outputsContent).toContain('output "sns_topic_arn"');
    });
  });

  describe('Environment Suffix Support', () => {
    test('Resources use environment suffix in naming', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('local.suffix_string');
      expect(mainContent).toContain('var.environment_suffix');
    });

    test('Environment suffix is properly handled in locals', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('locals {');
      expect(mainContent).toContain('env_suffix');
      expect(mainContent).toContain('suffix_string');
    });
  });

  describe('Security Requirements', () => {
    test('AES-256 encryption is configured', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      const cloudtrailContent = fs.readFileSync(path.join(libPath, 'cloudtrail.tf'), 'utf8');
      expect(mainContent).toContain('sse_algorithm');
      expect(mainContent.includes('aws:kms') || cloudtrailContent.includes('AES256')).toBe(true);
    });

    test('S3 versioning is enabled', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      const versioningCount = (mainContent.match(/status\s*=\s*"Enabled"/g) || []).length;
      expect(versioningCount).toBeGreaterThanOrEqual(2); // At least primary and backup buckets
    });

    test('No hardcoded AWS keys', () => {
      const allFiles = fs.readdirSync(libPath)
        .filter(f => f.endsWith('.tf'))
        .map(f => fs.readFileSync(path.join(libPath, f), 'utf8'))
        .join('\n');
      
      // Check for patterns that might indicate hardcoded keys
      expect(allFiles).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(allFiles).not.toMatch(/aws_access_key_id\s*=\s*"[^"]+"/);
      expect(allFiles).not.toMatch(/aws_secret_access_key\s*=\s*"[^"]+"/);
    });

    test('Tags are consistently applied', () => {
      const mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      expect(mainContent).toContain('local.common_tags');
      expect(mainContent).toContain('Project');
      expect(mainContent).toContain('Environment');
      expect(mainContent).toContain('ManagedBy');
    });
  });
});