// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests infrastructure configuration without executing Terraform

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform Secure Data Storage Infrastructure Unit Tests', () => {
  let terraformContent: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Terraform file not found at: ${stackPath}`);
    }
    terraformContent = fs.readFileSync(stackPath, 'utf8');
  });

  describe('File Structure and Basic Configuration', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      expect(terraformContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('declares aws_region variable with correct default', () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(terraformContent).toMatch(/default\s*=\s*"eu-west-3"/);
    });

    test('declares required variables for security configuration', () => {
      expect(terraformContent).toMatch(/variable\s+"allowed_ip_ranges"/);
      expect(terraformContent).toMatch(/variable\s+"security_team_email"/);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates secure storage S3 bucket with proper naming', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_s3_bucket"\s+"secure_storage"/
      );
      expect(terraformContent).toMatch(/bucket\s*=\s*local\.bucket_name/);
    });

    test('enables S3 bucket versioning', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"secure_storage_versioning"/
      );
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures AES-256 encryption for S3 bucket', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/
      );
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('blocks public access to S3 bucket', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"secure_storage_pab"/
      );
      expect(terraformContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(terraformContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(terraformContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('implements IP-based access restrictions', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_s3_bucket_policy"\s+"secure_storage_policy"/
      );
      expect(terraformContent).toMatch(/"aws:SourceIp"/);
      expect(terraformContent).toMatch(/var\.allowed_ip_ranges/);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('creates CloudTrail with proper configuration', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_cloudtrail"\s+"secure_data_trail"/
      );
      expect(terraformContent).toMatch(
        /name\s*=\s*"secure-data-cloudtrail-\$\{random_id\.bucket_suffix\.hex\}"/
      );
      expect(terraformContent).toMatch(
        /include_global_service_events\s*=\s*true/
      );
      expect(terraformContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(terraformContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test('creates separate S3 bucket for CloudTrail logs', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/
      );
      expect(terraformContent).toMatch(
        /bucket\s*=\s*"cloudtrail-logs-\$\{random_id\.bucket_suffix\.hex\}"/
      );
    });

    test('configures CloudTrail with CloudWatch Logs integration', () => {
      expect(terraformContent).toMatch(/cloud_watch_logs_group_arn/);
      expect(terraformContent).toMatch(/cloud_watch_logs_role_arn/);
    });

    test('creates CloudWatch log group for CloudTrail', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail_log_group"/
      );
      expect(terraformContent).toMatch(
        /name\s*=\s*"\/aws\/cloudtrail\/secure-data-trail-\$\{random_id\.bucket_suffix\.hex\}"/
      );
    });

    test('creates IAM role for CloudTrail CloudWatch integration', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_iam_role"\s+"cloudtrail_logs_role"/
      );
      expect(terraformContent).toMatch(
        /Service.*=.*"cloudtrail\.amazonaws\.com"/
      );
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role for application access', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_iam_role"\s+"app_role"/
      );
      expect(terraformContent).toMatch(
        /name\s*=\s*"secure-storage-app-role-\$\{random_id\.bucket_suffix\.hex\}"/
      );
    });

    test('implements least privilege IAM policy for S3 access', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_iam_role_policy"\s+"app_s3_policy"/
      );
      expect(terraformContent).toMatch(/"s3:GetObject"/);
      expect(terraformContent).toMatch(/"s3:PutObject"/);
      expect(terraformContent).toMatch(/"s3:ListBucket"/);
      // Should not contain s3:* in IAM policies (specific to app_s3_policy)
      expect(terraformContent).not.toMatch(
        /aws_iam_role_policy.*app_s3_policy.*s3:\*/s
      );
    });

    test('creates instance profile for EC2', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_iam_instance_profile"\s+"app_profile"/
      );
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch metric filter for IAM changes', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_cloudwatch_log_metric_filter"\s+"iam_changes_filter"/
      );
      expect(terraformContent).toMatch(
        /CreateRole.*DeleteRole.*AttachRolePolicy/
      );
    });

    test('creates CloudWatch alarm for IAM changes', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"iam_changes_alarm"/
      );
      expect(terraformContent).toMatch(/metric_name\s*=\s*"IAMChangesCount"/);
      expect(terraformContent).toMatch(/namespace\s*=\s*"Security\/IAM"/);
    });

    test('creates CloudWatch alarm for S3 access attempts', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"s3_access_denied_alarm"/
      );
      expect(terraformContent).toMatch(/metric_name\s*=\s*"4xxError"/);
      expect(terraformContent).toMatch(/namespace\s*=\s*"AWS\/S3"/);
    });
  });

  describe('SNS Configuration', () => {
    test('creates SNS topic for notifications', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_sns_topic"\s+"iam_changes"/
      );
      expect(terraformContent).toMatch(
        /name\s*=\s*"iam-role-changes-\$\{random_id\.bucket_suffix\.hex\}"/
      );
    });

    test('creates SNS subscription for security team', () => {
      expect(terraformContent).toMatch(
        /resource\s+"aws_sns_topic_subscription"\s+"security_team_email"/
      );
      expect(terraformContent).toMatch(/protocol\s*=\s*"email"/);
      expect(terraformContent).toMatch(
        /endpoint\s*=\s*var\.security_team_email/
      );
    });

    test('links CloudWatch alarms to SNS topic', () => {
      expect(terraformContent).toMatch(
        /alarm_actions\s*=\s*\[aws_sns_topic\.iam_changes\.arn\]/
      );
    });
  });

  describe('Security Best Practices', () => {
    test('uses proper tagging strategy', () => {
      expect(terraformContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(terraformContent).toMatch(/Environment/);
      expect(terraformContent).toMatch(/Project/);
      expect(terraformContent).toMatch(/ManagedBy/);
    });

    test('implements proper resource dependencies', () => {
      // Check for proper resource ordering without circular dependencies
      // CloudTrail should be able to be created independently
      expect(terraformContent).toMatch(/aws_cloudtrail.*secure_data_trail/);
      expect(terraformContent).toMatch(
        /aws_s3_bucket_policy.*cloudtrail_logs_policy/
      );
      // Ensure no circular dependency exists (CloudTrail should not depend on its own policy)
      expect(terraformContent).not.toMatch(
        /depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail_logs_policy\]/
      );
    });

    test('uses random suffixes for globally unique names', () => {
      expect(terraformContent).toMatch(
        /resource\s+"random_id"\s+"bucket_suffix"/
      );
      expect(terraformContent).toMatch(/byte_length\s*=\s*8/);
    });
  });

  describe('Outputs Configuration', () => {
    test('provides required outputs for CI/CD integration', () => {
      expect(terraformContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(terraformContent).toMatch(/output\s+"s3_bucket_arn"/);
      expect(terraformContent).toMatch(/output\s+"cloudtrail_name"/);
      expect(terraformContent).toMatch(/output\s+"iam_role_arn"/);
      expect(terraformContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(terraformContent).toMatch(/output\s+"aws_region"/);
    });

    test('outputs do not expose sensitive information', () => {
      // Should not output passwords, keys, or other secrets
      expect(terraformContent).not.toMatch(/output.*password/i);
      expect(terraformContent).not.toMatch(/output.*\bsecret\b/i); // Word boundary to avoid "deployment_timestamp"
      expect(terraformContent).not.toMatch(/output.*access_key/i);
    });
  });

  describe('Compliance Validation', () => {
    test('meets all PROMPT.md requirements', () => {
      // AES-256 encryption
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      // IP restrictions - check for proper IP restriction logic (not IpAddressIfExists)
      expect(terraformContent).toMatch(/IpAddress.*aws:SourceIp/s);
      expect(terraformContent).not.toMatch(/IpAddressIfExists/); // Should not use flawed condition
      // CloudTrail logging
      expect(terraformContent).toMatch(/aws_cloudtrail/);
      // IAM roles (not keys)
      expect(terraformContent).toMatch(/aws_iam_role/);
      expect(terraformContent).not.toMatch(/aws_access_key/);
      // Least privilege - check for specific S3 actions
      expect(terraformContent).toMatch(/"s3:GetObject"/);
      expect(terraformContent).toMatch(/"s3:PutObject"/);
      expect(terraformContent).toMatch(/"s3:ListBucket"/);
      // eu-west-3 region
      expect(terraformContent).toMatch(/default\s*=\s*"eu-west-3"/);
      // Versioning
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
      // CloudWatch alarms
      expect(terraformContent).toMatch(/aws_cloudwatch_metric_alarm/);
      // SNS notifications
      expect(terraformContent).toMatch(/aws_sns_topic/);
    });
  });
});
