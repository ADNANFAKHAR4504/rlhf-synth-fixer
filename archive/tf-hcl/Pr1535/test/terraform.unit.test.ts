import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests - Secure Data Storage', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const mainTfPath = path.join(libPath, 'main.tf');
  const providerTfPath = path.join(libPath, 'provider.tf');

  describe('File Structure', () => {
    test('main.tf exists and is readable', () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
      
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(1000);
      expect(content).toContain('# Terraform configuration for secure AWS data storage infrastructure');
    });

    test('provider.tf exists and contains required configuration', () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
      
      const content = fs.readFileSync(providerTfPath, 'utf8');
      expect(content).toContain('terraform {');
      expect(content).toContain('required_version = ">= 1.4.0"');
      expect(content).toContain('hashicorp/aws');
      expect(content).toContain('provider "aws" {');
      expect(content).toContain('region = var.aws_region');
    });
  });

  describe('Variables Configuration', () => {
    test('contains required variables with proper types and defaults', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Test aws_region variable
      expect(content).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string[\s\S]*?default\s*=\s*"us-west-2"/);
      
      // Test allowed_cidrs variable
      expect(content).toMatch(/variable\s+"allowed_cidrs"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(content).toContain('10.0.0.0/8');
      expect(content).toContain('172.16.0.0/12');
      expect(content).toContain('192.168.0.0/16');
      
      // Test security_team_emails variable
      expect(content).toMatch(/variable\s+"security_team_emails"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(content).toContain('security@example.com');
    });

    test('locals configuration includes required values', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/locals\s*{[\s\S]*?bucket_prefix\s*=\s*"secure-data-\$\{random_id\.bucket_suffix\.hex\}"/);
      expect(content).toMatch(/tags\s*=\s*{[\s\S]*?Environment\s*=\s*"production"/);
      expect(content).toMatch(/Project\s*=\s*"secure-data-storage"/);
      expect(content).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe('S3 Bucket Resources', () => {
    test('contains primary and logs S3 buckets', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Primary bucket
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"\s*{/);
      expect(content).toContain('bucket = "${local.bucket_prefix}-primary"');
      
      // Logs bucket
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
      expect(content).toContain('bucket = "${local.bucket_prefix}-logs"');
    });

    test('S3 bucket versioning is enabled', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
      expect(content).toContain('status = "Enabled"');
    });

    test('S3 bucket encryption is configured with AES256', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(content).toContain('sse_algorithm = "AES256"');
      expect(content).toContain('bucket_key_enabled = true');
    });

    test('S3 bucket public access is blocked', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(content).toContain('block_public_acls       = true');
      expect(content).toContain('block_public_policy     = true');
      expect(content).toContain('ignore_public_acls      = true');
      expect(content).toContain('restrict_public_buckets = true');
    });

    test('S3 bucket ownership controls are enforced', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_ownership_controls"\s+"primary"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_ownership_controls"\s+"logs"/);
      expect(content).toContain('object_ownership = "BucketOwnerEnforced"');
    });

    test('S3 server access logging is configured', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"primary"/);
      expect(content).toContain('target_bucket = aws_s3_bucket.logs.id');
      expect(content).toContain('target_prefix = "access-logs/primary/"');
    });
  });

  describe('S3 Bucket Policies', () => {
    test('primary bucket policy enforces HTTPS and IP restrictions', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"primary"/);
      expect(content).toContain('"DenyInsecureConnections"');
      expect(content).toContain('"aws:SecureTransport" = "false"');
      expect(content).toContain('"RestrictToAllowedCIDRs"');
      expect(content).toContain('"aws:SourceIp" = var.allowed_cidrs');
    });

    test('logs bucket policy allows CloudTrail access', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
      expect(content).toContain('"AllowCloudTrailLogs"');
      expect(content).toContain('"cloudtrail.amazonaws.com"');
      expect(content).toContain('"AllowCloudTrailAclCheck"');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('s3:GetBucketAcl');
    });
  });

  describe('IAM Resources', () => {
    test('application IAM role is configured for EC2', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"application"/);
      expect(content).toContain('name = "application-role"');
      expect(content).toContain('"ec2.amazonaws.com"');
      expect(content).toContain('sts:AssumeRole');
    });

    test('IAM role policy provides minimal S3 permissions', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"application_s3"/);
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('s3:ListBucket');
      expect(content).toContain('${aws_s3_bucket.primary.arn}/app/*');
      expect(content).toContain('"s3:prefix" = ["app/*"]');
    });

    test('instance profile is created for the role', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"application"/);
      expect(content).toContain('name = "application-instance-profile"');
      expect(content).toContain('role = aws_iam_role.application.name');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail is configured correctly', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"security_trail"/);
      expect(content).toMatch(/name\s*=\s*"security-trail"/);
      expect(content).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.logs\.bucket/);
      expect(content).toMatch(/s3_key_prefix\s*=\s*"cloudtrail"/);
      expect(content).toMatch(/include_global_service_events\s*=\s*true/);
      expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(content).toMatch(/enable_logging\s*=\s*true/);
    });
  });

  describe('SNS and Monitoring', () => {
    test('SNS topic for security alerts is configured', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
      expect(content).toContain('name = "security-alerts"');
    });

    test('SNS topic policy allows CloudWatch to publish', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_sns_topic_policy"\s+"security_alerts"/);
      expect(content).toContain('"AllowCloudWatchAlarmsToPublish"');
      expect(content).toContain('"cloudwatch.amazonaws.com"');
      expect(content).toContain('SNS:Publish');
    });

    test('SNS topic subscriptions are configured', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"security_team_email"/);
      expect(content).toMatch(/count\s*=\s*length\(var\.security_team_emails\)/);
      expect(content).toMatch(/protocol\s*=\s*"email"/);
      expect(content).toMatch(/endpoint\s*=\s*var\.security_team_emails\[count\.index\]/);
    });

    test('CloudWatch log group is configured', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
      expect(content).toMatch(/name\s*=\s*"\/aws\/cloudtrail\/security-trail"/);
      expect(content).toMatch(/retention_in_days\s*=\s*90/);
    });

    test('CloudWatch metric filter for IAM changes is configured', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"iam_policy_changes"/);
      expect(content).toMatch(/name\s*=\s*"iam-policy-changes"/);
      expect(content).toContain('PutRolePolicy');
      expect(content).toContain('AttachRolePolicy');
      expect(content).toMatch(/name\s*=\s*"IAMPolicyChanges"/);
      expect(content).toMatch(/namespace\s*=\s*"SecurityMetrics"/);
    });

    test('CloudWatch alarm for IAM changes is configured', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"iam_policy_changes"/);
      expect(content).toMatch(/alarm_name\s*=\s*"iam-policy-role-changes"/);
      expect(content).toMatch(/comparison_operator\s*=\s*"GreaterThanOrEqualToThreshold"/);
      expect(content).toMatch(/threshold\s*=\s*"1"/);
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.security_alerts\.arn\]/);
    });
  });

  describe('Random ID Resource', () => {
    test('random_id resource is configured for bucket naming', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
      expect(content).toContain('byte_length = 4');
    });
  });

  describe('Outputs', () => {
    test('contains all required outputs', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Primary bucket name output
      expect(content).toMatch(/output\s+"primary_bucket_name"\s*{/);
      expect(content).toMatch(/value\s*=\s*aws_s3_bucket\.primary\.bucket/);

      // Logs bucket name output
      expect(content).toMatch(/output\s+"logs_bucket_name"\s*{/);
      expect(content).toMatch(/value\s*=\s*aws_s3_bucket\.logs\.bucket/);

      // Application IAM role ARN output
      expect(content).toMatch(/output\s+"application_iam_role_arn"\s*{/);
      expect(content).toMatch(/value\s*=\s*aws_iam_role\.application\.arn/);

      // Security alerts SNS topic ARN output
      expect(content).toMatch(/output\s+"security_alerts_sns_topic_arn"\s*{/);
      expect(content).toMatch(/value\s*=\s*aws_sns_topic\.security_alerts\.arn/);
    });

    test('outputs have proper descriptions', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toContain('description = "Name of the primary S3 bucket"');
      expect(content).toContain('description = "Name of the logs S3 bucket"');
      expect(content).toContain('description = "ARN of the application IAM role"');
      expect(content).toContain('description = "ARN of the security alerts SNS topic"');
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded sensitive values', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Should not contain any obvious secrets or keys
      expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/key\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/token\s*=\s*"[^"]+"/i);
    });

    test('uses secure default values', () => {
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Encryption should be enabled
      expect(content).toContain('sse_algorithm = "AES256"');
      
      // Versioning should be enabled
      expect(content).toContain('status = "Enabled"');
      
      // Public access should be blocked
      expect(content).toContain('block_public_acls       = true');
    });
  });
});

// Utility function tests
describe('Terraform Configuration Utility Tests', () => {
  describe('CIDR Validation', () => {
    const validateCidr = (cidr: string): boolean => {
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      if (!cidrRegex.test(cidr)) return false;
      
      const [ip, mask] = cidr.split('/');
      const maskNum = parseInt(mask, 10);
      if (maskNum < 0 || maskNum > 32) return false;
      
      const ipParts = ip.split('.').map(part => parseInt(part, 10));
      return ipParts.every(part => part >= 0 && part <= 255);
    };

    test('validates correct CIDR blocks', () => {
      expect(validateCidr('10.0.0.0/8')).toBe(true);
      expect(validateCidr('172.16.0.0/12')).toBe(true);
      expect(validateCidr('192.168.0.0/16')).toBe(true);
      expect(validateCidr('203.0.113.0/24')).toBe(true);
    });

    test('rejects invalid CIDR blocks', () => {
      expect(validateCidr('10.0.0.0/33')).toBe(false);
      expect(validateCidr('256.0.0.0/16')).toBe(false);
      expect(validateCidr('10.0.0.0')).toBe(false);
      expect(validateCidr('invalid')).toBe(false);
    });
  });

  describe('AWS Region Validation', () => {
    const validateAwsRegion = (region: string): boolean => {
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-southeast-1',
        'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2'
      ];
      return validRegions.includes(region);
    };

    test('validates correct AWS regions', () => {
      expect(validateAwsRegion('us-west-2')).toBe(true);
      expect(validateAwsRegion('us-east-1')).toBe(true);
      expect(validateAwsRegion('eu-west-1')).toBe(true);
    });

    test('rejects invalid AWS regions', () => {
      expect(validateAwsRegion('invalid-region')).toBe(false);
      expect(validateAwsRegion('us-invalid-1')).toBe(false);
      expect(validateAwsRegion('')).toBe(false);
    });
  });
});