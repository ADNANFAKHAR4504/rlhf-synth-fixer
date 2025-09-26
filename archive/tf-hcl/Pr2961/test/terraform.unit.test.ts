import { beforeAll, describe, expect, test } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Enterprise Security Infrastructure - Comprehensive Unit Tests (72 Test Cases)', () => {
  const terraformDir = path.join(__dirname, '../lib');
  let tapStackContent: string;
  let providerContent: string;

  beforeAll(() => {
    process.chdir(terraformDir);
    tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
    providerContent = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
  });

  // ========================================
  // Terraform Configuration Validation Tests (3 tests)
  // ========================================
  describe('Terraform Configuration Validation', () => {
    test('should have valid Terraform syntax and format', () => {
      try {
        execSync('terraform init -backend=false', { encoding: 'utf8', cwd: terraformDir, stdio: 'pipe' });
        execSync('terraform validate', { encoding: 'utf8', cwd: terraformDir, stdio: 'pipe' });
        execSync('terraform fmt -check=true', { encoding: 'utf8', cwd: terraformDir });
        expect(true).toBe(true);
      } catch (error) {
        throw new Error(`Terraform validation/format failed: ${error}`);
      }
    });

    test('should have all required providers declared', () => {
      expect(providerContent).toContain('hashicorp/aws');
      expect(providerContent).toContain('hashicorp/random');
      expect(providerContent).toContain('hashicorp/tls');
      expect(providerContent).toMatch(/">= 1\.4\.0"/);
    });

    test('should have proper backend configuration', () => {
      expect(providerContent).toContain('backend "s3"');
      expect(providerContent).toContain('terraform');
      expect(providerContent).toContain('required_version');
    });
  });

  // ========================================
  // Variable Validation Tests (15 tests)
  // ========================================
  describe('Variable Configuration Tests', () => {
    test('should have project_name variable with default', () => {
      expect(tapStackContent).toMatch(/variable\s+"project_name"[\s\S]*?default\s*=\s*"nova-security"/);
    });

    test('should have environment variable with validation', () => {
      expect(tapStackContent).toMatch(/variable\s+"environment"[\s\S]*?validation\s*{/);
      expect(tapStackContent).toContain('contains(["dev", "staging", "prod"]');
    });

    test('should have aws_region variable with default', () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test('should have vpc_cidr variable with proper CIDR default', () => {
      expect(tapStackContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should have availability zones data source', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tapStackContent).toMatch(/state\s*=\s*"available"/);
    });

    test('should have db_engine variable with MySQL default', () => {
      expect(tapStackContent).toMatch(/variable\s+"db_engine"[\s\S]*?default\s*=\s*"mysql"/);
    });

    test('should have db_engine_version with MySQL 8.0.42', () => {
      expect(tapStackContent).toMatch(/variable\s+"db_engine_version"[\s\S]*?default\s*=\s*"8\.0\.42"/);
    });

    test('should have enable_multi_az variable with boolean default', () => {
      expect(tapStackContent).toMatch(/variable\s+"enable_multi_az"[\s\S]*?default\s*=\s*true/);
    });

    test('should have sensitive variables properly marked', () => {
      expect(tapStackContent).toMatch(/variable\s+"db_username"[\s\S]*?sensitive\s*=\s*true/);
      expect(tapStackContent).toMatch(/variable\s+"notification_email"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should have instance_type variable with validation', () => {
      expect(tapStackContent).toMatch(/variable\s+"instance_type"[\s\S]*?validation\s*{/);
    });

    test('should have s3_bucket_prefix variable with default', () => {
      expect(tapStackContent).toMatch(/variable\s+"s3_bucket_prefix"[\s\S]*?default\s*=\s*"nova-security"/);
    });

    test('should have rate_limit_requests variable with numeric default', () => {
      expect(tapStackContent).toMatch(/variable\s+"rate_limit_requests"[\s\S]*?default\s*=\s*2000/);
    });

    test('should have backup retention variables with proper defaults', () => {
      expect(tapStackContent).toMatch(/variable\s+"backup_window"[\s\S]*?default\s*=\s*"03:00-04:00"/);
      expect(tapStackContent).toMatch(/variable\s+"maintenance_window"[\s\S]*?default\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test('should have boolean configuration variables', () => {
      expect(tapStackContent).toMatch(/variable\s+"enable_deletion_protection"[\s\S]*?default\s*=\s*true/);
      expect(tapStackContent).toMatch(/variable\s+"enable_waf_logging"[\s\S]*?default\s*=\s*true/);
    });

    test('should have all required variables defined', () => {
      const requiredVars = [
        'project_name', 'environment', 'aws_region', 'vpc_cidr',
        'db_engine', 'db_engine_version', 'db_username', 'notification_email'
      ];
      requiredVars.forEach(varName => {
        expect(tapStackContent).toMatch(new RegExp(`variable\\s+"${varName}"`));
      });
    });
  });

  // ========================================
  // Resource Configuration Tests (12 tests)
  // ========================================
  describe('Resource Configuration Tests', () => {
    test('should have VPC with proper CIDR and tags', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should have Internet Gateway with proper tags', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('should have public subnets with correct configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('should have private subnets with correct configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('should have database subnets with correct configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('should have NAT Gateway with EIP', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test('should have KMS key with rotation enabled', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"master_key"/);
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*var\.encryption_key_rotation/);
      expect(tapStackContent).toMatch(/deletion_window_in_days/);
    });

    test('should have random password for RDS', () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(tapStackContent).toMatch(/length\s*=\s*16/);
      expect(tapStackContent).toMatch(/special\s*=\s*false/);
    });

    test('should have environment suffix for uniqueness', () => {
      expect(tapStackContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
      expect(tapStackContent).toMatch(/byte_length\s*=\s*4/);
    });

    test('should use environment suffix in resource names', () => {
      expect(tapStackContent).toMatch(/\${local\.name_prefix}-.*-\${local\.suffix}/);
      expect(tapStackContent).toMatch(/local\.suffix/);
    });

    test('should have proper tagging strategy', () => {
      expect(tapStackContent).toMatch(/common_tags\s*=/);
      expect(tapStackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('should have data sources for AMI and account info', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(tapStackContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);
    });
  });

  // ========================================
  // Security Group Rule Validation Tests (8 tests)
  // ========================================
  describe('Security Group Rule Validation Tests', () => {
    test('should have ALB security group with HTTPS ingress', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(tapStackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('should have ALB security group with HTTP redirect', () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*80/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*80/);
    });

    test('should have app security group with ingress from ALB only', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('should have app security group with SSH access restriction', () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*22/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*22/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('should have database security group with app tier access only', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test('should have security groups with proper descriptions', () => {
      expect(tapStackContent).toMatch(/description\s*=\s*"Security group for Application Load Balancer.*"/);
      expect(tapStackContent).toMatch(/description\s*=\s*"Security group for application servers.*"/);
      expect(tapStackContent).toMatch(/description\s*=\s*"Security group for RDS database.*"/);
    });

    test('should have security groups in correct VPC', () => {
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('should have ingress rules with proper protocols', () => {
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"-1"/); // Valid for egress rules
    });
  });

  // ========================================
  // IAM Policy and Role Validation Tests (8 tests)
  // ========================================
  describe('IAM Policy and Role Validation Tests', () => {
    test('should have EC2 IAM role with proper trust policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tapStackContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
      expect(tapStackContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test('should have EC2 instance profile', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(tapStackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test('should have EC2 policy with minimal permissions', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_policy_attachment"/);
      expect(tapStackContent).toMatch(/cloudwatch:PutMetricData/);
      expect(tapStackContent).toMatch(/logs:PutLogEvents/);
      expect(tapStackContent).toMatch(/logs:CreateLogGroup/);
    });

    test('should have RDS monitoring role when enabled', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
      expect(tapStackContent).toMatch(/Service\s*=\s*"monitoring\.rds\.amazonaws\.com"/);
      expect(tapStackContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
    });

    test('should have Config service role', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(tapStackContent).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
      expect(tapStackContent).toMatch(/AWS_ConfigServiceRole/);
    });

    test('should have API Gateway CloudWatch role', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch"/);
      expect(tapStackContent).toMatch(/Service\s*=\s*"apigateway\.amazonaws\.com"/);
      expect(tapStackContent).toMatch(/AmazonAPIGatewayPushToCloudWatchLogs/);
    });

    test('should have roles with proper naming and tags', () => {
      expect(tapStackContent).toMatch(/name\s*=\s*"\${local\.name_prefix}-.*-role-\${local\.suffix}"/);
      expect(tapStackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('should have proper resource ARN references in policies', () => {
      expect(tapStackContent).toMatch(/Resource.*\.arn/);
      expect(tapStackContent).toMatch(/\${aws_.*\.arn}/);
    });
  });

  // ========================================
  // RDS Configuration Tests (10 tests)
  // ========================================
  describe('RDS Configuration Tests', () => {
    test('should have RDS instance with MySQL 8.0.42', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main_v2"/);
      expect(tapStackContent).toMatch(/engine\s*=\s*var\.db_engine/);
      expect(tapStackContent).toMatch(/engine_version\s*=\s*var\.db_engine_version/);
    });

    test('should have RDS with encryption enabled', () => {
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master_key\.arn/);
    });

    test('should have RDS with Multi-AZ enabled', () => {
      expect(tapStackContent).toMatch(/multi_az\s*=\s*var\.enable_multi_az/);
    });

    test('should have RDS with proper backup configuration', () => {
      expect(tapStackContent).toMatch(/backup_retention_period\s*=/);
      expect(tapStackContent).toMatch(/backup_window\s*=\s*var\.backup_window/);
      expect(tapStackContent).toMatch(/maintenance_window\s*=\s*var\.maintenance_window/);
    });

    test('should have RDS with deletion protection', () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*var\.enable_deletion_protection/);
      expect(tapStackContent).toMatch(/skip_final_snapshot\s*=\s*false/);
    });

    test('should have RDS with enhanced monitoring', () => {
      expect(tapStackContent).toMatch(/performance_insights_enabled\s*=/);
      expect(tapStackContent).toMatch(/monitoring_interval\s*=/);
      expect(tapStackContent).toMatch(/monitoring_role_arn\s*=/);
    });

    test('should have RDS in database subnets', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
      expect(tapStackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test('should have RDS with security group', () => {
      expect(tapStackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.database\.id\]/);
    });

    test('should have RDS with random password', () => {
      expect(tapStackContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test('should have RDS with proper storage configuration', () => {
      expect(tapStackContent).toMatch(/allocated_storage\s*=/);
      expect(tapStackContent).toMatch(/max_allocated_storage\s*=/);
      expect(tapStackContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });
  });

  // ========================================
  // S3 Bucket Configuration Tests (8 tests)
  // ========================================
  describe('S3 Bucket Policy and Encryption Tests', () => {
    test('should have app data bucket with SSE-S3', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('should have CloudTrail logs bucket with KMS', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.master_key\.arn/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('should have public access blocks for all buckets', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_data"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"alb_logs"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"config_bucket"/);
    });

    test('should have public access blocks with all restrictions enabled', () => {
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should have CloudTrail bucket policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"/);
      expect(tapStackContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(tapStackContent).toMatch(/AWSCloudTrailWrite/);
    });

    test('should have ALB logs bucket policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs"/);
      expect(tapStackContent).toMatch(/data\.aws_elb_service_account\.main\.arn/);
    });

    test('should have Config bucket policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config_bucket"/);
      expect(tapStackContent).toMatch(/config\.amazonaws\.com/);
    });

    test('should have buckets with environment suffix', () => {
      expect(tapStackContent).toMatch(/bucket\s*=\s*"\${var\.s3_bucket_prefix}-.*-\${local\.suffix}"/);
    });
  });

  // ========================================
  // Auto Scaling and Launch Template Tests (6 tests)
  // ========================================
  describe('Auto Scaling Group and Launch Template Tests', () => {
    test('should have launch template with proper configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
      expect(tapStackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(tapStackContent).toMatch(/instance_type\s*=\s*local\.current_config\.instance_type/);
    });

    test('should have launch template with IAM instance profile', () => {
      expect(tapStackContent).toMatch(/iam_instance_profile\s*{/);
      expect(tapStackContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test('should have launch template with encrypted EBS', () => {
      expect(tapStackContent).toMatch(/block_device_mappings\s*{/);
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master_key\.arn/);
    });

    test('should have auto scaling group in private subnets', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
      expect(tapStackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('should have auto scaling group with ELB health checks', () => {
      expect(tapStackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(tapStackContent).toMatch(/health_check_grace_period\s*=\s*300/);
    });

    test('should have auto scaling group with instance refresh', () => {
      expect(tapStackContent).toMatch(/instance_refresh\s*{/);
      expect(tapStackContent).toMatch(/strategy\s*=\s*"Rolling"/);
      expect(tapStackContent).toMatch(/min_healthy_percentage\s*=\s*50/);
    });
  });

  // ========================================
  // CloudWatch and Monitoring Tests (6 tests)
  // ========================================
  describe('CloudWatch and Monitoring Tests', () => {
    test('should have CloudWatch log groups with encryption', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"system"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"security"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"/);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master_key\.arn/);
    });

    test('should have proper log retention periods', () => {
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*local\.current_config\.log_retention/);
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*90/);
    });

    test('should have CloudWatch alarms for high CPU', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(tapStackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(tapStackContent).toMatch(/threshold\s*=\s*"80"/);
    });

    test('should have CloudWatch alarms for database CPU', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"db_high_cpu"/);
      expect(tapStackContent).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
    });

    test('should have SNS topic for alerts', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.master_key\.id/);
    });

    test('should have alarms connected to SNS topics', () => {
      expect(tapStackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });
  });

  // ========================================
  // Load Balancer and SSL Tests (6 tests)
  // ========================================
  describe('Load Balancer and SSL Configuration Tests', () => {
    test('should have Application Load Balancer configuration', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tapStackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(tapStackContent).toMatch(/internal\s*=\s*false/);
    });

    test('should have ALB with access logs enabled', () => {
      expect(tapStackContent).toMatch(/access_logs\s*{/);
      expect(tapStackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\.alb_logs\.id/);
      expect(tapStackContent).toMatch(/enabled\s*=\s*true/);
    });

    test('should have ALB target group with health checks', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
      expect(tapStackContent).toMatch(/health_check\s*{/);
      expect(tapStackContent).toMatch(/path\s*=\s*"\/health"/);
      expect(tapStackContent).toMatch(/healthy_threshold\s*=\s*2/);
    });

    test('should have self-signed SSL certificate', () => {
      expect(tapStackContent).toMatch(/resource\s+"tls_private_key"\s+"main"/);
      expect(tapStackContent).toMatch(/resource\s+"tls_self_signed_cert"\s+"main"/);
      expect(tapStackContent).toMatch(/algorithm\s*=\s*"RSA"/);
    });

    test('should have HTTPS listener with SSL policy', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(tapStackContent).toMatch(/port\s*=\s*"443"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(tapStackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    });

    test('should have HTTP to HTTPS redirect listener', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http_redirect"/);
      expect(tapStackContent).toMatch(/port\s*=\s*"80"/);
      expect(tapStackContent).toMatch(/type\s*=\s*"redirect"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });
  });

  // ========================================
  // WAF and API Gateway Tests (6 tests)  
  // ========================================
  describe('WAF and API Gateway Tests', () => {
    test('should have WAFv2 Web ACL with managed rules', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(tapStackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(tapStackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test('should have WAF rate limiting rule', () => {
      expect(tapStackContent).toMatch(/rate_based_statement\s*{/);
      expect(tapStackContent).toMatch(/limit\s*=\s*var\.rate_limit_requests/);
      expect(tapStackContent).toMatch(/aggregate_key_type\s*=\s*"IP"/);
    });

    test('should have WAF associated with ALB', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
      expect(tapStackContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
      expect(tapStackContent).toMatch(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });

    test('should have API Gateway REST API', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"/);
      expect(tapStackContent).toMatch(/endpoint_configuration\s*{/);
      expect(tapStackContent).toMatch(/types\s*=\s*\["REGIONAL"\]/);
    });

    test('should have API Gateway health endpoint', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"health"/);
      expect(tapStackContent).toMatch(/path_part\s*=\s*"health"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"health_get"/);
    });

    test('should have API Gateway with access logging', () => {
      expect(tapStackContent).toMatch(/access_log_settings\s*{/);
      expect(tapStackContent).toMatch(/destination_arn\s*=\s*aws_cloudwatch_log_group\.api_gateway\.arn/);
    });
  });

  // ========================================
  // Output Validation Tests (5 tests)
  // ========================================
  describe('Output Validation Tests', () => {
    test('should have comprehensive infrastructure outputs', () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"/);
      expect(tapStackContent).toMatch(/output\s+"load_balancer_dns_name"/);
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(tapStackContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('should have security-focused outputs', () => {
      expect(tapStackContent).toMatch(/output\s+"ssl_certificate_arn"/);
      expect(tapStackContent).toMatch(/output\s+"waf_web_acl_arn"/);
      expect(tapStackContent).toMatch(/output\s+"cloudtrail_arn"/);
    });

    test('should have sensitive outputs marked', () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should have security compliance summary output', () => {
      expect(tapStackContent).toMatch(/output\s+"security_compliance_summary"/);
      expect(tapStackContent).toMatch(/encryption_at_rest/);
      expect(tapStackContent).toMatch(/encryption_in_transit/);
      expect(tapStackContent).toMatch(/access_controls/);
    });

    test('should have proper output descriptions', () => {
      expect(tapStackContent).toMatch(/description\s*=\s*".*security.*"/i);
      expect(tapStackContent).toMatch(/description\s*=\s*".*encryption.*"/i);
      expect(tapStackContent).toMatch(/description\s*=\s*".*compliance.*"/i);
    });
  });
});
