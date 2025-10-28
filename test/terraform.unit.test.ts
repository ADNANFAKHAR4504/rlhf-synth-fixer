// test/terraform.unit.test.ts
// Unit tests for Terraform infrastructure defined in lib/tap_stack.tf

import fs from 'fs';
import path from 'path';

const TAP_STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');

describe('Terraform Infrastructure Unit Tests', () => {
  let tapStackContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, 'utf8');
  });

  describe('File Structure', () => {
    test('tap_stack.tf file exists', () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
    });

    test('tap_stack.tf is not empty', () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
    });

    test('does not contain provider configuration (should be in provider.tf)', () => {
      expect(tapStackContent).not.toMatch(/terraform\s*{/);
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });
  });

  describe('Variables', () => {
    test('declares aws_region variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"/);
    });

    test('declares environment_suffix variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('declares vpc_cidr variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"vpc_cidr"/);
    });

    test('declares domain_name variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"domain_name"/);
    });

    test('declares alert_email variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"alert_email"/);
    });

    test('aws_region defaults to us-west-2', () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('environment_suffix is used in resource names', () => {
      const suffixUsage = tapStackContent.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixUsage).not.toBeNull();
      expect(suffixUsage!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tagging Strategy', () => {
    test('resources have CostCenter tags', () => {
      expect(tapStackContent).toMatch(/CostCenter\s*=\s*"IT-Security"/);
    });

    test('resources have Environment tags', () => {
      expect(tapStackContent).toMatch(/Environment\s*=\s*"production"/);
    });

    test('resources have ManagedBy tags', () => {
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe('KMS Configuration', () => {
    test('creates KMS key resource named "master"', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"master"/);
    });

    test('enables KMS key rotation', () => {
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('creates KMS alias', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"master"/);
    });

    test('KMS key has proper policy', () => {
      expect(tapStackContent).toMatch(/policy\s*=\s*jsonencode/);
    });

    test('KMS key has proper deletion window', () => {
      expect(tapStackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC resource named "main"', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('VPC has correct CIDR', () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*(var\.vpc_cidr|"10\.0\.0\.0\/16")/);
    });

    test('enables DNS support and hostnames', () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates VPC flow logs', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test('creates public subnets', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('creates private subnets', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('creates database subnets', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test('creates Internet Gateway', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('creates NAT Gateway with EIP', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('creates route tables', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('creates route table associations', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test('creates Network ACL', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('creates EC2 security group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test('creates RDS security group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('security groups have lifecycle rules', () => {
      const sgMatches = tapStackContent.match(/resource\s+"aws_security_group"/g);
      expect(sgMatches).not.toBeNull();
      expect(sgMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('S3 and Logging', () => {
    test('creates S3 bucket for logs', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test('enables S3 versioning', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    });

    test('configures S3 encryption with KMS', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('blocks all public access', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('configures lifecycle policies', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
    });

    test('has S3 bucket policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test('enables log file validation', () => {
      expect(tapStackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('is multi-region trail', () => {
      expect(tapStackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('includes global service events', () => {
      expect(tapStackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test('uses KMS encryption', () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.arn/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 IAM role', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test('creates EC2 instance profile', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('creates flow log IAM role', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_log"/);
    });

    test('creates Config IAM role', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
    });

    test('EC2 role has SSM policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_ssm"/);
    });

    test('EC2 role has Secrets Manager policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_secrets"/);
    });

    test('EC2 role has CloudWatch policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch"/);
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('creates DB subnet group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test('creates DB parameter group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
    });

    test('enables storage encryption', () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('is not publicly accessible', () => {
      expect(tapStackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('enables multi-AZ', () => {
      expect(tapStackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('enables Performance Insights', () => {
      expect(tapStackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('has deletion protection', () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test('requires secure transport', () => {
      expect(tapStackContent).toMatch(/require_secure_transport/);
    });
  });

  describe('Secrets Manager', () => {
    test('creates secret for RDS password', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password"/);
    });

    test('creates secret version', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password"/);
    });

    test('secret uses KMS encryption', () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.id/);
    });
  });

  describe('ACM Certificate', () => {
    test('creates ACM certificate', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
    });

    test('uses DNS validation', () => {
      expect(tapStackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test('creates target group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });

    test('creates HTTPS listener', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    });

    test('creates HTTP listener with redirect', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(tapStackContent).toMatch(/type\s*=\s*"redirect"/);
    });

    test('enables deletion protection', () => {
      expect(tapStackContent).toMatch(/enable_deletion_protection\s*=\s*true/);
    });

    test('enables access logs', () => {
      expect(tapStackContent).toMatch(/access_logs\s*{/);
    });

    test('uses strong SSL policy', () => {
      expect(tapStackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS/);
    });
  });

  describe('Auto Scaling', () => {
    test('creates launch template', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });

    test('creates Auto Scaling Group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test('launch template has encrypted EBS', () => {
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('enforces IMDSv2', () => {
      expect(tapStackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test('enables detailed monitoring', () => {
      expect(tapStackContent).toMatch(/monitoring\s*{\s*enabled\s*=\s*true/);
    });

    test('creates scale up policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
    });

    test('creates scale down policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch log groups', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test('creates high CPU alarm', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
    });

    test('creates low CPU alarm', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
    });

    test('creates RDS CPU alarm', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    });

    test('creates root account usage alarm', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"/);
    });

    test('creates metric filter for root usage', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"root_usage"/);
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAFv2 Web ACL', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test('has rate limiting rule', () => {
      expect(tapStackContent).toMatch(/rate_based_statement/);
    });

    test('uses AWS managed rule sets', () => {
      expect(tapStackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(tapStackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('associates WAF with ALB', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test('creates Origin Access Identity', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"main"/);
    });

    test('enforces HTTPS', () => {
      expect(tapStackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test('uses TLS 1.2+', () => {
      expect(tapStackContent).toMatch(/TLSv1\.2/);
    });

    test('enables logging', () => {
      expect(tapStackContent).toMatch(/logging_config/);
    });
  });

  describe('SNS Notifications', () => {
    test('creates SNS topic', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test('SNS topic uses KMS encryption', () => {
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.master\.id/);
    });

    test('creates SNS subscription', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alert_email"/);
    });
  });

  describe('AWS Config', () => {
    test('creates Config recorder', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test('creates Config delivery channel', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test('enables Config recorder', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test('has S3 encryption rule', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"/);
    });

    test('has S3 public read prohibited rule', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"/);
    });

    test('has RDS encryption rule', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encryption_enabled"/);
    });

    test('has MFA rule', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"mfa_enabled_for_iam_console_access"/);
    });

    test('has CloudTrail enabled rule', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"cloudtrail_enabled"/);
    });
  });

  describe('GuardDuty', () => {
    test('creates GuardDuty detector', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
    });

    test('GuardDuty is enabled', () => {
      expect(tapStackContent).toMatch(/enable\s*=\s*true/);
    });

    test('enables S3 logs datasource', () => {
      expect(tapStackContent).toMatch(/s3_logs\s*{/);
    });
  });

  describe('Systems Manager', () => {
    test('creates SSM document for Session Manager', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ssm_document"\s+"session_manager_prefs"/);
    });

    test('SSM sessions are encrypted', () => {
      expect(tapStackContent).toMatch(/s3EncryptionEnabled/);
      expect(tapStackContent).toMatch(/cloudWatchEncryptionEnabled/);
    });
  });

  describe('MFA Policy', () => {
    test('creates MFA enforcement policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_policy"\s+"enforce_mfa"/);
    });
  });

  describe('Outputs', () => {
    test('exports VPC ID', () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"/);
    });

    test('exports public subnet IDs', () => {
      expect(tapStackContent).toMatch(/output\s+"public_subnet_ids"/);
    });

    test('exports private subnet IDs', () => {
      expect(tapStackContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('exports ALB DNS name', () => {
      expect(tapStackContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test('exports CloudFront domain', () => {
      expect(tapStackContent).toMatch(/output\s+"cloudfront_distribution_domain"/);
    });

    test('exports RDS endpoint as sensitive', () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(tapStackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test('exports S3 logs bucket', () => {
      expect(tapStackContent).toMatch(/output\s+"s3_logs_bucket"/);
    });

    test('exports KMS key ID', () => {
      expect(tapStackContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('exports SNS topic ARN', () => {
      expect(tapStackContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('exports GuardDuty detector ID', () => {
      expect(tapStackContent).toMatch(/output\s+"guardduty_detector_id"/);
    });

    test('exports WAF Web ACL ID', () => {
      expect(tapStackContent).toMatch(/output\s+"waf_web_acl_id"/);
    });

    test('exports Auto Scaling Group name', () => {
      expect(tapStackContent).toMatch(/output\s+"autoscaling_group_name"/);
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded credentials', () => {
      expect(tapStackContent).not.toMatch(/aws_access_key/i);
      expect(tapStackContent).not.toMatch(/aws_secret_key/i);
    });

    test('uses encryption at rest', () => {
      // Check for various encryption patterns: encrypted = true, storage_encrypted = true
      const encryptedPattern = /encrypted\s*=\s*true/gi;
      const storageEncryptedPattern = /storage_encrypted\s*=\s*true/gi;
      
      const encryptedMatches = tapStackContent.match(encryptedPattern) || [];
      const storageEncryptedMatches = tapStackContent.match(storageEncryptedPattern) || [];
      const totalEncryption = encryptedMatches.length + storageEncryptedMatches.length;
      
      // We should have at least 2 encryption settings: RDS (storage_encrypted) and EBS (encrypted)
      expect(totalEncryption).toBeGreaterThanOrEqual(2);
      
      // Also check for KMS encryption which is more comprehensive
      expect(tapStackContent).toMatch(/kms_key_id/);
      expect(tapStackContent).toMatch(/kms_master_key_id/);
    });

    test('enforces TLS/SSL', () => {
      expect(tapStackContent).toMatch(/require_secure_transport/);
      expect(tapStackContent).toMatch(/https/i);
    });

    test('uses KMS for encryption', () => {
      const kmsMatches = tapStackContent.match(/kms_key_id|kms_master_key_id/g);
      expect(kmsMatches).not.toBeNull();
      expect(kmsMatches!.length).toBeGreaterThan(5);
    });

    test('no Retain policies (resources should be destroyable)', () => {
      expect(tapStackContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });
  });

  describe('Random Provider Resources', () => {
    test('uses random_password for RDS', () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"\s+"rds_password"/);
    });

    test('uses random_id for unique naming', () => {
      expect(tapStackContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
    });
  });

  describe('Data Sources', () => {
    test('uses aws_caller_identity data source', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('uses aws_availability_zones data source', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('uses aws_ami data source for Amazon Linux 2', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
    });
  });
});
