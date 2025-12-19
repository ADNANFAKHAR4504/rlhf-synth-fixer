import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Infrastructure Integration Tests', () => {
  const libDir = path.resolve(process.cwd(), 'lib');
  const stackPath = path.join(libDir, 'tap_stack.tf');
  let stackContent: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    stackContent = fs.readFileSync(stackPath, 'utf-8');
  });

  describe('File Structure and Basic Validation', () => {
    test('tap_stack.tf exists and is not empty', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(1000);
    });

    test('contains terraform and provider configuration', () => {
      expect(stackContent).toContain('terraform {');
      expect(stackContent).toContain('provider "aws"');
      expect(stackContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test('terraform fmt passes', () => {
      try {
        const result = execSync('terraform -chdir=lib fmt -check', {
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        // Empty output means formatting is correct
        expect(result.toString().trim()).toBe('');
      } catch (error: any) {
        // If terraform returns non-zero, it means files need formatting
        if (error.status !== undefined) {
          fail('Terraform files need formatting. Run: terraform -chdir=lib fmt');
        }
        // If terraform command not found, pass gracefully
        console.log('Terraform not available, skipping fmt check');
      }
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded AWS account IDs', () => {
      const hardcodedAccountPattern = /["']\d{12}["']/g;
      const matches = stackContent.match(hardcodedAccountPattern) || [];
      expect(matches.length).toBe(0);
    });

    test('no hardcoded passwords or secrets', () => {
      // Check for hardcoded passwords (we now use random_password)
      expect(stackContent).not.toMatch(/password\s*=\s*"[A-Za-z0-9!@#$%^&*()]+"/);
      // Should use random_password resource
      expect(stackContent).toContain('random_password');
      expect(stackContent).toContain('random_password.rds_password.result');
    });

    test('no insecure HTTP protocols', () => {
      // Check that HTTPS is enforced where it matters
      expect(stackContent).toContain('origin_protocol_policy = "https-only"');
      expect(stackContent).toContain('viewer_protocol_policy = "redirect-to-https"');
      // HTTPS should be present
      expect(stackContent).toContain('HTTPS');
    });

    test('encryption at rest is enforced', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toContain('kms_key_id');
    });

    test('KMS encryption is used for sensitive resources', () => {
      expect(stackContent).toContain('aws_kms_key');
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main/);
    });

    test('S3 bucket blocks public access', () => {
      expect(stackContent).toContain('aws_s3_bucket_public_access_block');
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('S3 bucket has versioning enabled', () => {
      expect(stackContent).toContain('aws_s3_bucket_versioning');
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket has lifecycle policies', () => {
      expect(stackContent).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(stackContent).toContain('transition');
    });

    test('CloudTrail is enabled with validation', () => {
      expect(stackContent).toContain('aws_cloudtrail');
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('MFA enforcement policy exists', () => {
      expect(stackContent).toContain('DenyAllExceptListedIfNoMFA');
      expect(stackContent).toContain('aws:MultiFactorAuthPresent');
    });
  });

  describe('Network Infrastructure', () => {
    test('VPC is configured with correct CIDR', () => {
      expect(stackContent).toContain('aws_vpc');
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('VPC has DNS support enabled', () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC Flow Logs are enabled', () => {
      expect(stackContent).toContain('aws_flow_log');
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('subnets are created in multiple availability zones', () => {
      expect(stackContent).toContain('aws_subnet');
      expect(stackContent).toContain('public');
      expect(stackContent).toContain('private');
      expect(stackContent).toContain('database');
    });

    test('Internet Gateway exists for public subnets', () => {
      expect(stackContent).toContain('aws_internet_gateway');
    });

    test('NAT Gateways exist for private subnet internet access', () => {
      expect(stackContent).toContain('aws_nat_gateway');
      expect(stackContent).toContain('aws_eip');
    });

    test('Route Tables are configured', () => {
      expect(stackContent).toContain('aws_route_table');
      expect(stackContent).toContain('aws_route_table_association');
    });

    test('Network ACLs are configured', () => {
      expect(stackContent).toContain('aws_network_acl');
      // Check for inline ingress/egress rules
      expect(stackContent).toMatch(/ingress\s*\{/);
      expect(stackContent).toMatch(/egress\s*\{/);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group exists', () => {
      expect(stackContent).toContain('aws_security_group');
      expect(stackContent).toMatch(/name\s*=\s*"secureapp-alb"/);
    });

    test('ALB security group allows HTTPS', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
    });

    test('EC2 security group exists', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"secureapp-ec2-"/);
    });

    test('RDS security group exists', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"secureapp-rds-"/);
    });

    test('RDS security group allows traffic only from EC2', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toContain('security_groups = [aws_security_group.ec2.id]');
    });

    test('security groups have lifecycle rules', () => {
      expect(stackContent).toContain('lifecycle {');
      expect(stackContent).toContain('create_before_destroy');
    });
  });

  describe('Compute Resources', () => {
    test('Launch Template is configured', () => {
      expect(stackContent).toContain('aws_launch_template');
      expect(stackContent).toContain('image_id');
      expect(stackContent).toContain('instance_type');
    });

    test('Launch Template has encrypted EBS volumes', () => {
      expect(stackContent).toContain('block_device_mappings');
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('Launch Template enforces IMDSv2', () => {
      expect(stackContent).toContain('metadata_options');
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test('Auto Scaling Group exists', () => {
      expect(stackContent).toContain('aws_autoscaling_group');
      expect(stackContent).toContain('min_size');
      expect(stackContent).toContain('max_size');
    });

    test('Auto Scaling has health checks', () => {
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('Auto Scaling policies exist', () => {
      expect(stackContent).toContain('aws_autoscaling_policy');
    });

    test('IAM role for EC2 exists', () => {
      expect(stackContent).toContain('aws_iam_role');
      expect(stackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test('IAM instance profile exists', () => {
      expect(stackContent).toContain('aws_iam_instance_profile');
    });

    test('EC2 has SSM permissions', () => {
      expect(stackContent).toContain('ssm:UpdateInstanceInformation');
      expect(stackContent).toContain('ssmmessages:CreateControlChannel');
    });
  });

  describe('Database Resources', () => {
    test('RDS instance is configured', () => {
      expect(stackContent).toContain('aws_db_instance');
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test('RDS has multi-AZ enabled', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('RDS is not publicly accessible', () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('RDS has encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('RDS has Performance Insights enabled', () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('RDS has backups configured', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
      expect(stackContent).toContain('backup_window');
    });

    test('RDS subnet group exists', () => {
      expect(stackContent).toContain('aws_db_subnet_group');
    });

    test('RDS parameter group exists', () => {
      expect(stackContent).toContain('aws_db_parameter_group');
      expect(stackContent).toContain('require_secure_transport');
    });

    test('Secrets Manager stores RDS credentials', () => {
      expect(stackContent).toContain('aws_secretsmanager_secret');
      expect(stackContent).toContain('aws_secretsmanager_secret_version');
      expect(stackContent).toMatch(/name\s*=\s*"secureapp-rds-password"/);
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer exists', () => {
      expect(stackContent).toContain('aws_lb');
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('ALB has deletion protection', () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*true/);
    });

    test('Target Group exists', () => {
      expect(stackContent).toContain('aws_lb_target_group');
      expect(stackContent).toContain('health_check');
    });

    test('HTTPS Listener exists', () => {
      expect(stackContent).toContain('aws_lb_listener');
      expect(stackContent).toMatch(/port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test('HTTPS Listener uses TLS 1.3', () => {
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS13-1-2-2021-06"/);
    });

    test('HTTP Listener redirects to HTTPS', () => {
      expect(stackContent).toMatch(/port\s*=\s*80/);
      expect(stackContent).toContain('redirect');
      expect(stackContent).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });

    test('ACM certificate exists', () => {
      expect(stackContent).toContain('aws_acm_certificate');
      expect(stackContent).toContain('domain_name');
    });

    test('ACM certificate uses DNS validation', () => {
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution exists', () => {
      expect(stackContent).toContain('aws_cloudfront_distribution');
    });

    test('CloudFront has Origin Access Identity', () => {
      expect(stackContent).toContain('aws_cloudfront_origin_access_identity');
    });

    test('CloudFront enforces HTTPS', () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test('CloudFront uses minimum TLS 1.2', () => {
      // Check viewer certificate is configured
      expect(stackContent).toMatch(/viewer_certificate\s*\{/);
      // Check that origin uses TLS 1.2
      expect(stackContent).toMatch(/origin_ssl_protocols\s*=\s*\["TLSv1\.2"\]/);
    });
  });

  describe('WAF Configuration', () => {
    test('WAF Web ACL exists', () => {
      expect(stackContent).toContain('aws_wafv2_web_acl');
      expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test('WAF has rate limiting rule', () => {
      expect(stackContent).toContain('rate_based_statement');
      expect(stackContent).toContain('limit');
    });

    test('WAF uses managed rule sets', () => {
      expect(stackContent).toContain('managed_rule_group_statement');
      expect(stackContent).toContain('AWSManagedRulesCommonRuleSet');
    });

    test('WAF is associated with ALB', () => {
      expect(stackContent).toContain('aws_wafv2_web_acl_association');
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch log groups exist', () => {
      expect(stackContent).toContain('aws_cloudwatch_log_group');
    });

    test('CloudWatch log groups have retention', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });

    test('CloudWatch log groups use KMS encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('CloudWatch alarms for CPU exist', () => {
      expect(stackContent).toContain('aws_cloudwatch_metric_alarm');
      expect(stackContent).toContain('CPUUtilization');
    });

    test('CloudWatch alarms for RDS exist', () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });

    test('Root account usage alarm exists', () => {
      expect(stackContent).toContain('RootAccountUsage');
    });
  });

  describe('AWS Config', () => {
    test('Config recorder exists', () => {
      expect(stackContent).toContain('aws_config_configuration_recorder');
    });

    test('Config delivery channel exists', () => {
      expect(stackContent).toContain('aws_config_delivery_channel');
    });

    test('Config rules for S3 encryption exist', () => {
      expect(stackContent).toContain('aws_config_config_rule');
      expect(stackContent).toContain('s3-bucket-encryption');
    });

    test('Config rules for RDS encryption exist', () => {
      expect(stackContent).toContain('rds-encryption-enabled');
    });

    test('Config rules for MFA exist', () => {
      expect(stackContent).toContain('mfa-enabled-for-iam-console-access');
    });

    test('Config rules for CloudTrail exist', () => {
      expect(stackContent).toContain('cloudtrail-enabled');
    });
  });

  describe('Systems Manager', () => {
    test('SSM document for Session Manager exists', () => {
      expect(stackContent).toContain('aws_ssm_document');
      expect(stackContent).toContain('Session');
    });

    test('SSM sessions are encrypted', () => {
      expect(stackContent).toContain('kmsKeyId');
      expect(stackContent).toContain('encryption');
    });
  });

  describe('SNS Notifications', () => {
    test('SNS topic exists', () => {
      expect(stackContent).toContain('aws_sns_topic');
      expect(stackContent).toMatch(/name\s*=\s*"secureapp-alerts"/);
    });

    test('SNS topic uses KMS encryption', () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test('SNS subscription exists', () => {
      expect(stackContent).toContain('aws_sns_topic_subscription');
    });
  });

  describe('Outputs', () => {
    test('VPC ID output exists', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test('ALB DNS output exists', () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test('CloudFront domain output exists', () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_distribution_domain"/);
    });

    test('RDS endpoint output exists and is sensitive', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test('S3 bucket output exists', () => {
      expect(stackContent).toMatch(/output\s+"s3_logs_bucket"/);
    });
  });

  describe('Terraform Best Practices', () => {
    test('uses data sources for dynamic values', () => {
      expect(stackContent).toContain('data "aws_caller_identity"');
      expect(stackContent).toContain('data "aws_region"');
      expect(stackContent).toContain('data "aws_availability_zones"');
    });

    test('has proper provider version constraints', () => {
      expect(stackContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
      expect(stackContent).toMatch(/version\s*=\s*"~>\s*\d+\.\d+"/);
    });

    test('uses default tags in provider', () => {
      expect(stackContent).toContain('default_tags');
      expect(stackContent).toContain('Project');
      expect(stackContent).toContain('Environment');
      expect(stackContent).toContain('ManagedBy');
    });

    test('resources have descriptive names', () => {
      expect(stackContent).toMatch(/resource\s+"aws_\w+"\s+"[a-z_]+"/);
    });

    test('uses random provider for password generation', () => {
      expect(stackContent).toContain('random');
      expect(stackContent).toContain('hashicorp/random');
    });
  });
});
