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

  describe('Network ACLs', () => {
    test('creates Network ACL resource', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
    });

    test('Network ACL has ingress rules', () => {
      const naclSection = tapStackContent.match(/resource\s+"aws_network_acl"\s+"main"\s*{[\s\S]*?(?=\nresource|$)/);
      expect(naclSection).not.toBeNull();
      expect(naclSection![0]).toMatch(/ingress\s*{/);
    });

    test('Network ACL has egress rules', () => {
      const naclSection = tapStackContent.match(/resource\s+"aws_network_acl"\s+"main"\s*{[\s\S]*?(?=\nresource|$)/);
      expect(naclSection).not.toBeNull();
      expect(naclSection![0]).toMatch(/egress\s*{/);
    });

    test('Network ACL is associated with VPC', () => {
      const naclSection = tapStackContent.match(/resource\s+"aws_network_acl"\s+"main"\s*{[\s\S]*?(?=\nresource|$)/);
      expect(naclSection).not.toBeNull();
      expect(naclSection![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe('CloudTrail Enhanced', () => {
    test('CloudTrail uses KMS encryption', () => {
      const cloudtrailSection = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?(?=\nresource|$)/);
      expect(cloudtrailSection).not.toBeNull();
      expect(cloudtrailSection![0]).toMatch(/kms_key_id/);
    });

    test('CloudTrail has proper tags', () => {
      const cloudtrailSection = tapStackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?(?=\n\nresource|$)/);
      expect(cloudtrailSection).not.toBeNull();
      expect(cloudtrailSection![0]).toMatch(/tags\s*=\s*{/);
    });
  });

  describe('AWS Config', () => {
    test('Config uses S3 bucket for delivery', () => {
      const configDeliverySection = tapStackContent.match(/resource\s+"aws_config_delivery_channel"[\s\S]*?(?=\nresource|$)/);
      expect(configDeliverySection).not.toBeNull();
      expect(configDeliverySection![0]).toMatch(/s3_bucket_name/);
    });

    test('Config has proper IAM role', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      const configRecorderSection = tapStackContent.match(/resource\s+"aws_config_configuration_recorder"[\s\S]*?(?=\nresource|$)/);
      expect(configRecorderSection).not.toBeNull();
      expect(configRecorderSection![0]).toMatch(/role_arn/);
    });
  });

  describe('SSM Session Manager', () => {
    test('SSM uses CloudWatch log group', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"session_manager"/);
      expect(tapStackContent).toMatch(/\/aws\/ssm\/session-manager/);
    });

    test('SSM document has proper configuration', () => {
      const ssmDocSection = tapStackContent.match(/resource\s+"aws_ssm_document"[\s\S]*?(?=\nresource|$)/);
      expect(ssmDocSection).not.toBeNull();
      expect(ssmDocSection![0]).toMatch(/document_type/);
    });
  });

  // Enhanced test coverage for >90% coverage requirement
  describe('Environment Suffix Usage', () => {
    test('KMS resources use environment suffix', () => {
      expect(tapStackContent).toMatch(/master-kms-key-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/alias\/master-key-\$\{var\.environment_suffix\}/);
    });

    test('VPC resources use environment suffix', () => {
      expect(tapStackContent).toMatch(/main-vpc-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/vpc-flow-logs-\$\{var\.environment_suffix\}/);
    });

    test('IAM roles use environment suffix', () => {
      expect(tapStackContent).toMatch(/vpc-flow-log-role-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/ec2-instance-role-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/config-role-\$\{var\.environment_suffix\}/);
    });

    test('Security groups use environment suffix', () => {
      expect(tapStackContent).toMatch(/alb-security-group-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/ec2-security-group-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/rds-security-group-\$\{var\.environment_suffix\}/);
    });

    test('RDS resources use environment suffix', () => {
      expect(tapStackContent).toMatch(/main-database-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/main-db-subnet-group-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/main-mysql-params-\$\{var\.environment_suffix\}/);
    });

    test('ALB and networking use environment suffix', () => {
      expect(tapStackContent).toMatch(/main-alb-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/main-tg-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/main-lt-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/main-asg-\$\{var\.environment_suffix\}/);
    });

    test('CloudWatch resources use environment suffix', () => {
      expect(tapStackContent).toMatch(/high-cpu-alarm-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/low-cpu-alarm-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/rds-cpu-alarm-\$\{var\.environment_suffix\}/);
    });

    test('WAF and CloudFront use environment suffix', () => {
      expect(tapStackContent).toMatch(/main-waf-acl-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/main-cloudfront-\$\{var\.environment_suffix\}/);
    });

    test('Config rules use environment suffix', () => {
      expect(tapStackContent).toMatch(/s3-bucket-encryption-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/rds-encryption-enabled-\$\{var\.environment_suffix\}/);
      expect(tapStackContent).toMatch(/cloudtrail-enabled-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Realistic Operational Values', () => {
    test('domain name uses realistic value', () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"tapinfra\.com"/);
    });

    test('alert email uses realistic value', () => {
      expect(tapStackContent).toMatch(/default\s*=\s*"security@tapinfra\.com"/);
    });

    test('domain references use realistic value throughout', () => {
      expect(tapStackContent).toMatch(/domain_name\s*=\s*var\.domain_name/);
      expect(tapStackContent).toMatch(/endpoint\s*=\s*var\.alert_email/);
    });
  });

  describe('Resource Count and Density', () => {
    test('contains substantial number of resources', () => {
      const resourceMatches = tapStackContent.match(/^resource\s+"/gm) || [];
      expect(resourceMatches.length).toBeGreaterThan(70);
    });

    test('contains comprehensive AWS service coverage', () => {
      const services = [
        'aws_kms_key', 'aws_vpc', 'aws_s3_bucket', 'aws_cloudtrail',
        'aws_iam_role', 'aws_db_instance', 'aws_secretsmanager_secret',
        'aws_acm_certificate', 'aws_lb', 'aws_autoscaling_group',
        'aws_cloudwatch_metric_alarm', 'aws_wafv2_web_acl',
        'aws_cloudfront_distribution', 'aws_config_configuration_recorder',
        'aws_guardduty_detector', 'aws_sns_topic', 'aws_ssm_document'
      ];
      
      services.forEach(service => {
        expect(tapStackContent).toMatch(new RegExp(`resource\\s+"${service}"`));
      });
    });

    test('contains all required outputs', () => {
      const outputs = [
        'vpc_id', 'public_subnet_ids', 'private_subnet_ids', 'database_subnet_ids',
        'alb_dns_name', 'alb_arn', 'cloudfront_distribution_domain', 
        'cloudfront_distribution_id', 'rds_endpoint', 'rds_arn',
        's3_logs_bucket', 'kms_key_id', 'kms_key_arn', 'sns_topic_arn',
        'guardduty_detector_id', 'waf_web_acl_id', 'autoscaling_group_name',
        'launch_template_id'
      ];
      
      outputs.forEach(output => {
        expect(tapStackContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });

  describe('Advanced Security Configuration', () => {
    test('KMS policy allows CloudWatch Logs service', () => {
      const kmsSection = tapStackContent.match(/resource\s+"aws_kms_key"\s+"master"[\s\S]*?(?=\nresource|$)/);
      expect(kmsSection).not.toBeNull();
      expect(kmsSection![0]).toMatch(/Allow CloudWatch Logs/);
      expect(kmsSection![0]).toMatch(/logs\.\$\{var\.aws_region\}\.amazonaws\.com/);
    });

    test('KMS policy allows CloudTrail service', () => {
      const kmsSection = tapStackContent.match(/resource\s+"aws_kms_key"\s+"master"[\s\S]*?(?=\nresource|$)/);
      expect(kmsSection).not.toBeNull();
      expect(kmsSection![0]).toMatch(/Allow CloudTrail/);
      expect(kmsSection![0]).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test('S3 bucket policy allows CloudTrail', () => {
      const s3PolicySection = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"logs"[\s\S]*?(?=\nresource|$)/);
      expect(s3PolicySection).not.toBeNull();
      expect(s3PolicySection![0]).toMatch(/AWSCloudTrailAclCheck/);
      expect(s3PolicySection![0]).toMatch(/AWSCloudTrailWrite/);
    });

    test('S3 bucket policy allows Config service', () => {
      const s3PolicySection = tapStackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"logs"[\s\S]*?(?=\nresource|$)/);
      expect(s3PolicySection).not.toBeNull();
      expect(s3PolicySection![0]).toMatch(/AWSConfigBucketPermissionsCheck/);
      expect(s3PolicySection![0]).toMatch(/AWSConfigBucketDelivery/);
    });

    test('EC2 role has comprehensive permissions', () => {
      expect(tapStackContent).toMatch(/ec2-ssm-policy/);
      expect(tapStackContent).toMatch(/ec2-secrets-policy/);
      expect(tapStackContent).toMatch(/ec2-cloudwatch-policy/);
      
      const ec2CloudWatchPolicy = tapStackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch"[\s\S]*?(?=\nresource|$)/);
      expect(ec2CloudWatchPolicy).not.toBeNull();
      expect(ec2CloudWatchPolicy![0]).toMatch(/cloudwatch:PutMetricData/);
      expect(ec2CloudWatchPolicy![0]).toMatch(/logs:PutLogEvents/);
    });

    test('MFA enforcement policy is comprehensive', () => {
      const mfaPolicy = tapStackContent.match(/resource\s+"aws_iam_policy"\s+"enforce_mfa"[\s\S]*?(?=\n\n# |$)/);
      expect(mfaPolicy).not.toBeNull();
      expect(mfaPolicy![0]).toMatch(/AllowViewAccountInfo/);
      expect(mfaPolicy![0]).toMatch(/DenyAllExceptListedIfNoMFA/);
      expect(mfaPolicy![0]).toMatch(/aws:MultiFactorAuthPresent/);
    });
  });

  describe('High Availability Configuration', () => {
    test('resources span multiple AZs', () => {
      expect(tapStackContent).toMatch(/count\s*=\s*2/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('RDS is configured for Multi-AZ', () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=\nresource|$)/);
      expect(rdsSection).not.toBeNull();
      expect(rdsSection![0]).toMatch(/multi_az\s*=\s*true/);
    });

    test('Auto Scaling Group has proper capacity settings', () => {
      const asgSection = tapStackContent.match(/resource\s+"aws_autoscaling_group"\s+"main"[\s\S]*?(?=\nresource|$)/);
      expect(asgSection).not.toBeNull();
      expect(asgSection![0]).toMatch(/min_size\s*=\s*2/);
      expect(asgSection![0]).toMatch(/max_size\s*=\s*10/);
      expect(asgSection![0]).toMatch(/desired_capacity\s*=\s*2/);
    });

    test('Load Balancer spans multiple subnets', () => {
      const albSection = tapStackContent.match(/resource\s+"aws_lb"\s+"main"[\s\S]*?(?=\nresource|$)/);
      expect(albSection).not.toBeNull();
      expect(albSection![0]).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('NAT Gateways for each AZ', () => {
      const natSection = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?(?=\nresource|$)/);
      expect(natSection).not.toBeNull();
      expect(natSection![0]).toMatch(/count\s*=\s*2/);
    });
  });

  describe('Performance and Cost Optimization', () => {
    test('S3 lifecycle policies configured', () => {
      const s3LifecycleSection = tapStackContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?(?=\nresource|$)/);
      expect(s3LifecycleSection).not.toBeNull();
      expect(s3LifecycleSection![0]).toMatch(/GLACIER/);
      expect(s3LifecycleSection![0]).toMatch(/days\s*=\s*365/);
    });

    test('RDS uses appropriate instance class', () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=\nresource|$)/);
      expect(rdsSection).not.toBeNull();
      expect(rdsSection![0]).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
      expect(rdsSection![0]).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test('EC2 instances use cost-effective sizing', () => {
      const launchTemplateSection = tapStackContent.match(/resource\s+"aws_launch_template"[\s\S]*?(?=\nresource|$)/);
      expect(launchTemplateSection).not.toBeNull();
      expect(launchTemplateSection![0]).toMatch(/instance_type\s*=\s*"t3\.micro"/);
    });

    test('CloudWatch log retention optimized', () => {
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*90/);
    });
  });

  describe('WAF Rules Coverage', () => {
    test('has rate limiting rule', () => {
      const wafSection = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"[\s\S]*?(?=\nresource|$)/);
      expect(wafSection).not.toBeNull();
      expect(wafSection![0]).toMatch(/RateLimitRule/);
      expect(wafSection![0]).toMatch(/limit\s*=\s*2000/);
    });

    test('has AWS managed common rule set', () => {
      const wafSection = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"[\s\S]*?(?=\nresource|$)/);
      expect(wafSection).not.toBeNull();
      expect(wafSection![0]).toMatch(/AWSManagedRulesCommonRuleSet/);
    });

    test('has AWS managed known bad inputs rule set', () => {
      const wafSection = tapStackContent.match(/resource\s+"aws_wafv2_web_acl"[\s\S]*?(?=\nresource|$)/);
      expect(wafSection).not.toBeNull();
      expect(wafSection![0]).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('WAF is associated with ALB', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"/);
      const wafAssocSection = tapStackContent.match(/resource\s+"aws_wafv2_web_acl_association"[\s\S]*?(?=\nresource|$)/);
      expect(wafAssocSection).not.toBeNull();
      expect(wafAssocSection![0]).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
    });
  });

  describe('Compliance Configuration', () => {
    test('all required Config rules present', () => {
      const requiredRules = [
        's3-bucket-encryption',
        's3-bucket-public-read-prohibited', 
        'rds-encryption-enabled',
        'mfa-enabled-for-iam-console-access',
        'cloudtrail-enabled'
      ];
      
      requiredRules.forEach(rule => {
        expect(tapStackContent).toMatch(new RegExp(`${rule}-\\$\\{var\\.environment_suffix\\}`));
      });
    });

    test('GuardDuty has comprehensive datasources', () => {
      const guardDutySection = tapStackContent.match(/resource\s+"aws_guardduty_detector"[\s\S]*?(?=\nresource|$)/);
      expect(guardDutySection).not.toBeNull();
      expect(guardDutySection![0]).toMatch(/s3_logs/);
      expect(guardDutySection![0]).toMatch(/kubernetes/);
      expect(guardDutySection![0]).toMatch(/malware_protection/);
    });

    test('CloudTrail has proper event selector', () => {
      const cloudtrailSection = tapStackContent.match(/resource\s+"aws_cloudtrail"[\s\S]*?(?=\nresource|$)/);
      expect(cloudtrailSection).not.toBeNull();
      expect(cloudtrailSection![0]).toMatch(/event_selector/);
      expect(cloudtrailSection![0]).toMatch(/AWS::S3::Object/);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('resources have proper dependencies', () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[/);
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.logs\]/);
    });

    test('launch template has proper lifecycle', () => {
      const launchTemplateSection = tapStackContent.match(/resource\s+"aws_launch_template"[\s\S]*?(?=\nresource|$)/);
      expect(launchTemplateSection).not.toBeNull();
      expect(launchTemplateSection![0]).toMatch(/name_prefix/);
    });

    test('security groups have lifecycle rules', () => {
      const sgSections = tapStackContent.match(/resource\s+"aws_security_group"[\s\S]*?lifecycle\s*{[\s\S]*?create_before_destroy\s*=\s*true[\s\S]*?}/g);
      expect(sgSections).not.toBeNull();
      expect(sgSections!.length).toBeGreaterThanOrEqual(3);
    });

    test('RDS has final snapshot configuration', () => {
      const rdsSection = tapStackContent.match(/resource\s+"aws_db_instance"[\s\S]*?(?=\nresource|$)/);
      expect(rdsSection).not.toBeNull();
      expect(rdsSection![0]).toMatch(/skip_final_snapshot\s*=\s*false/);
      expect(rdsSection![0]).toMatch(/final_snapshot_identifier/);
    });

    test('ALB has access logging enabled', () => {
      const albSection = tapStackContent.match(/resource\s+"aws_lb"[\s\S]*?(?=\nresource|$)/);
      expect(albSection).not.toBeNull();
      expect(albSection![0]).toMatch(/access_logs\s*{/);
      expect(albSection![0]).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('Variable Types and Validation', () => {
    test('all variables have proper type definitions', () => {
      const variables = ['aws_region', 'environment_suffix', 'vpc_cidr', 'domain_name', 'alert_email'];
      variables.forEach(variable => {
        const variableMatch = tapStackContent.match(new RegExp(`variable\\s+"${variable}"\\s*{[\\s\\S]*?type\\s*=\\s*string[\\s\\S]*?}`));
        expect(variableMatch).not.toBeNull();
      });
    });

    test('variables have descriptions', () => {
      const variables = ['aws_region', 'environment_suffix', 'vpc_cidr', 'domain_name', 'alert_email'];
      variables.forEach(variable => {
        const variableMatch = tapStackContent.match(new RegExp(`variable\\s+"${variable}"\\s*{[\\s\\S]*?description[\\s\\S]*?}`));
        expect(variableMatch).not.toBeNull();
      });
    });
  });
});
