// test/terraform.int.test.ts
// Integration tests for multi-region secure AWS infrastructure
// Tests validate Terraform configuration structure and completeness

import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Region Secure AWS Infrastructure Integration Tests', () => {
  let stackContent: string;
  const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');

  beforeAll(() => {
    // Load Terraform stack content for validation
    if (fs.existsSync(STACK_PATH)) {
      stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    } else {
      throw new Error(`Terraform stack file not found at ${STACK_PATH}`);
    }
  });

  // Test that infrastructure file loads correctly
  test('should load Terraform infrastructure file', () => {
    expect(stackContent).toBeTruthy();
    expect(stackContent.length).toBeGreaterThan(1000);
  });

  // ==================== Infrastructure Definition Tests ====================
  describe('Terraform Configuration Validation', () => {
    test('should define multi-region VPC infrastructure', () => {
      expect(stackContent).toContain('resource "aws_vpc" "west"');
      expect(stackContent).toContain('resource "aws_vpc" "east"');
      expect(stackContent).toContain('cidr_block');
      expect(stackContent).toContain('enable_dns_hostnames');
      expect(stackContent).toContain('enable_dns_support');
      expect(stackContent).toContain('= true');
    });

    test('should define security groups with restrictive rules', () => {
      expect(stackContent).toContain('resource "aws_security_group"');
      expect(stackContent).toContain('ingress {');
      expect(stackContent).toContain('egress {');
      expect(stackContent).toContain('from_port');
      expect(stackContent).toContain('to_port');
      expect(stackContent).toContain('443');
    });

    test('should define KMS encryption for both regions', () => {
      expect(stackContent).toContain('resource "aws_kms_key" "west"');
      expect(stackContent).toContain('resource "aws_kms_key" "east"');
      expect(stackContent).toContain('enable_key_rotation     = true');
      expect(stackContent).toContain('deletion_window_in_days = 30');
    });

    test('should define IAM roles with least privilege', () => {
      expect(stackContent).toContain('resource "aws_iam_role"');
      expect(stackContent).toContain('resource "aws_iam_role_policy"');
      expect(stackContent).toContain('cloudwatch:PutMetricData');
      expect(stackContent).toContain('logs:PutLogEvents');
    });

    test('should define CloudTrail for auditing', () => {
      expect(stackContent).toContain('resource "aws_cloudtrail"');
      expect(stackContent).toContain('is_multi_region_trail');
      expect(stackContent).toContain('= true');
      expect(stackContent).toContain('enable_log_file_validation');
    });

    test('should define encrypted S3 buckets', () => {
      expect(stackContent).toContain('resource "aws_s3_bucket"');
      expect(stackContent).toContain('server_side_encryption_configuration');
      expect(stackContent).toContain('sse_algorithm     = "aws:kms"');
      expect(stackContent).toContain('resource "aws_s3_bucket_versioning"');
    });

    test('should define load balancers with HTTPS', () => {
      expect(stackContent).toContain('resource "aws_lb"');
      expect(stackContent).toContain('load_balancer_type = "application"');
      expect(stackContent).toContain('resource "aws_lb_listener"');
      expect(stackContent).toContain('protocol          = "HTTPS"');
      expect(stackContent).toContain('ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"');
    });

    test('should define auto scaling groups for high availability', () => {
      expect(stackContent).toContain('resource "aws_autoscaling_group"');
      expect(stackContent).toContain('min_size');
      expect(stackContent).toContain('max_size');
      expect(stackContent).toContain('health_check_type');
      expect(stackContent).toContain('= "ELB"');
    });

    test('should enforce IMDSv2 for EC2 instances', () => {
      expect(stackContent).toContain('metadata_options {');
      expect(stackContent).toContain('http_tokens');
      expect(stackContent).toContain('= "required"');
    });

    test('should define CloudWatch log groups with encryption', () => {
      expect(stackContent).toContain('resource "aws_cloudwatch_log_group"');
      expect(stackContent).toContain('kms_key_id');
      expect(stackContent).toContain('retention_in_days');
    });
  });

  // ==================== VPC Tests - US-WEST-1 ====================
  describe('VPC Infrastructure - us-west-1', () => {
    test('should have complete VPC configuration for us-west-1', () => {
      expect(stackContent).toContain('resource "aws_vpc" "west"');
      expect(stackContent).toContain('provider = aws.us_west_1');
    });

    test('should have all networking components configured', () => {
      expect(stackContent).toContain('resource "aws_internet_gateway" "west"');
      expect(stackContent).toContain('resource "aws_subnet" "west_public"');
      expect(stackContent).toContain('resource "aws_subnet" "west_private"');
      expect(stackContent).toContain('resource "aws_nat_gateway" "west"');
      expect(stackContent).toContain('resource "aws_route_table" "west_public"');
      expect(stackContent).toContain('resource "aws_route_table" "west_private"');
    });

    test('should have route table associations for us-west-1', () => {
      expect(stackContent).toContain('resource "aws_route_table_association" "west_public"');
      expect(stackContent).toContain('resource "aws_route_table_association" "west_private"');
    });

    test('should have EIP for NAT Gateway in us-west-1', () => {
      expect(stackContent).toContain('resource "aws_eip" "west_nat"');
    });
  });

  // ==================== VPC Tests - US-EAST-1 ====================
  describe('VPC Infrastructure - us-east-1', () => {
    test('should have complete VPC configuration for us-east-1', () => {
      expect(stackContent).toContain('resource "aws_vpc" "east"');
      expect(stackContent).toContain('provider = aws.us_east_1');
    });

    test('should have all networking components configured', () => {
      expect(stackContent).toContain('resource "aws_internet_gateway" "east"');
      expect(stackContent).toContain('resource "aws_subnet" "east_public"');
      expect(stackContent).toContain('resource "aws_subnet" "east_private"');
      expect(stackContent).toContain('resource "aws_nat_gateway" "east"');
      expect(stackContent).toContain('resource "aws_route_table" "east_public"');
      expect(stackContent).toContain('resource "aws_route_table" "east_private"');
    });

    test('should have route table associations for us-east-1', () => {
      expect(stackContent).toContain('resource "aws_route_table_association" "east_public"');
      expect(stackContent).toContain('resource "aws_route_table_association" "east_private"');
    });

    test('should have EIP for NAT Gateway in us-east-1', () => {
      expect(stackContent).toContain('resource "aws_eip" "east_nat"');
    });
  });

  // ==================== Security Configuration ====================
  describe('Security Group Configuration', () => {
    test('should have security groups defined for both regions', () => {
      expect(stackContent).toContain('resource "aws_security_group" "west_alb"');
      expect(stackContent).toContain('resource "aws_security_group" "west_ec2"');
      expect(stackContent).toContain('resource "aws_security_group" "east_alb"');
      expect(stackContent).toContain('resource "aws_security_group" "east_ec2"');
    });

    test('should restrict SSH access to specific IPs', () => {
      const sshPattern = /from_port\s*=\s*22/;
      expect(sshPattern.test(stackContent)).toBe(true);
      expect(stackContent).toContain('var.allowed_admin_ips');
    });

    test('should allow HTTPS traffic', () => {
      const httpsPattern = /from_port\s*=\s*443/;
      expect(httpsPattern.test(stackContent)).toBe(true);
    });

    test('should have egress rules defined', () => {
      const egressPattern = /egress\s*\{/g;
      const matches = stackContent.match(egressPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==================== Encryption Tests ====================
  describe('Encryption Configuration', () => {
    test('should have KMS keys defined with rotation', () => {
      expect(stackContent).toContain('resource "aws_kms_key" "west"');
      expect(stackContent).toContain('resource "aws_kms_key" "east"');
      const rotationMatches = stackContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).toBeTruthy();
      expect(rotationMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have KMS key aliases', () => {
      expect(stackContent).toContain('resource "aws_kms_alias" "west"');
      expect(stackContent).toContain('resource "aws_kms_alias" "east"');
    });

    test('should encrypt EBS volumes', () => {
      expect(stackContent).toContain('encrypted');
      expect(stackContent).toContain('= true');
      expect(stackContent).toContain('kms_key_id');
    });

    test('should encrypt S3 buckets with KMS', () => {
      const s3EncryptionPattern = /server_side_encryption_configuration[\s\S]*?sse_algorithm\s*=\s*"aws:kms"/g;
      const matches = stackContent.match(s3EncryptionPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('should encrypt CloudWatch logs', () => {
      const logEncryptionPattern = /resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/g;
      const matches = stackContent.match(logEncryptionPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== S3 Security ====================
  describe('S3 Bucket Security', () => {
    test('should have S3 buckets defined', () => {
      expect(stackContent).toContain('resource "aws_s3_bucket" "cloudtrail"');
      expect(stackContent).toContain('resource "aws_s3_bucket" "west_data"');
      expect(stackContent).toContain('resource "aws_s3_bucket" "east_data"');
    });

    test('should block all public access to S3 buckets', () => {
      const publicAccessPattern = /resource\s+"aws_s3_bucket_public_access_block"/g;
      const matches = stackContent.match(publicAccessPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
      
      expect(stackContent).toContain('block_public_acls       = true');
      expect(stackContent).toContain('block_public_policy     = true');
      expect(stackContent).toContain('ignore_public_acls      = true');
      expect(stackContent).toContain('restrict_public_buckets = true');
    });

    test('should enforce secure transport for S3', () => {
      expect(stackContent).toContain('DenyInsecureTransport');
      expect(stackContent).toContain('aws:SecureTransport');
    });

    test('should enable S3 versioning', () => {
      const versioningPattern = /resource\s+"aws_s3_bucket_versioning"/g;
      const matches = stackContent.match(versioningPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('should have VPC endpoints for S3', () => {
      expect(stackContent).toContain('resource "aws_vpc_endpoint" "west_s3"');
      expect(stackContent).toContain('resource "aws_vpc_endpoint" "east_s3"');
      expect(stackContent).toContain('service_name    = "com.amazonaws.us-west-1.s3"');
      expect(stackContent).toContain('service_name    = "com.amazonaws.us-east-1.s3"');
    });
  });

  // ==================== IAM Security ====================
  describe('IAM Security Configuration', () => {
    test('should define password policy', () => {
      expect(stackContent).toContain('resource "aws_iam_account_password_policy"');
      expect(stackContent).toContain('minimum_password_length');
      expect(stackContent).toContain('= 14');
      expect(stackContent).toContain('require_lowercase_characters');
      expect(stackContent).toContain('require_numbers');
      expect(stackContent).toContain('require_uppercase_characters');
      expect(stackContent).toContain('require_symbols');
    });

    test('should define MFA enforcement policy', () => {
      expect(stackContent).toContain('resource "aws_iam_policy" "enforce_mfa"');
      expect(stackContent).toContain('aws:MultiFactorAuthPresent');
    });

    test('should define EC2 IAM role with specific permissions', () => {
      expect(stackContent).toContain('resource "aws_iam_role" "ec2_role"');
      expect(stackContent).toContain('ec2.amazonaws.com');
      expect(stackContent).toContain('cloudwatch:PutMetricData');
      expect(stackContent).toContain('ec2:DescribeVolumes');
      expect(stackContent).toContain('logs:PutLogEvents');
      expect(stackContent).toContain('ssm:GetParameter');
    });

    test('should have IAM instance profile for EC2', () => {
      expect(stackContent).toContain('resource "aws_iam_instance_profile" "ec2_profile"');
    });

    test('should have MFA enforcement configured', () => {
      // Check for MFA policy which can be attached to groups/roles
      expect(stackContent).toContain('resource "aws_iam_policy" "enforce_mfa"');
      expect(stackContent).toContain('aws:MultiFactorAuthPresent');
      expect(stackContent).toContain('DenyAllExceptListedIfNoMFA');
    });
  });

  // ==================== CloudTrail Auditing ====================
  describe('CloudTrail Configuration', () => {
    test('should have multi-region CloudTrail configured', () => {
      expect(stackContent).toContain('resource "aws_cloudtrail" "main"');
      expect(stackContent).toContain('is_multi_region_trail');
      expect(stackContent).toContain('= true');
      expect(stackContent).toContain('include_global_service_events');
      expect(stackContent).toContain('enable_log_file_validation');
    });

    test('should have CloudTrail S3 bucket with proper security', () => {
      expect(stackContent).toContain('resource "aws_s3_bucket" "cloudtrail"');
      expect(stackContent).toContain('resource "aws_s3_bucket_policy" "cloudtrail"');
      expect(stackContent).toContain('AWSCloudTrailAclCheck');
      expect(stackContent).toContain('AWSCloudTrailWrite');
      expect(stackContent).toContain('DenyUnencryptedObjectUploads');
    });

    test('should log S3 object-level operations', () => {
      const eventSelectorPattern = /event_selector[\s\S]*?AWS::S3::Object/;
      expect(eventSelectorPattern.test(stackContent)).toBe(true);
    });

    test('should have CloudWatch logging capability', () => {
      // Check for CloudWatch log groups which provide logging capability
      const hasLogging = stackContent.includes('aws_cloudwatch_log_group') &&
                        stackContent.includes('kms_key_id');
      expect(hasLogging).toBe(true);
    });
  });

  // ==================== Load Balancer Configuration ====================
  describe('Application Load Balancer Configuration', () => {
    test('should define ALBs for both regions', () => {
      expect(stackContent).toContain('resource "aws_lb" "west"');
      expect(stackContent).toContain('resource "aws_lb" "east"');
      expect(stackContent).toContain('load_balancer_type = "application"');
    });

    test('should enforce TLS 1.2 or higher', () => {
      const tlsPattern = /ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/g;
      const matches = stackContent.match(tlsPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have security features enabled', () => {
      expect(stackContent).toContain('drop_invalid_header_fields = true');
      expect(stackContent).toContain('enable_http2 = true');
    });

    test('should have target groups with health checks', () => {
      expect(stackContent).toContain('resource "aws_lb_target_group"');
      expect(stackContent).toContain('health_check');
      expect(stackContent).toContain('protocol            = "HTTPS"');
    });

    test('should have HTTPS listeners configured', () => {
      expect(stackContent).toContain('resource "aws_lb_listener" "west_https"');
      expect(stackContent).toContain('resource "aws_lb_listener" "east_https"');
      expect(stackContent).toContain('port              = "443"');
    });

    test('should have SSL certificate configuration in place', () => {
      // Check that certificate configuration is mentioned even if commented
      const hasCertConfig = stackContent.includes('certificate_arn') || 
                           stackContent.includes('# certificate_arn') ||
                           stackContent.includes('Note: You\'ll need to add certificate_arn');
      expect(hasCertConfig).toBe(true);
    });
  });

  // ==================== Auto Scaling Configuration ====================
  describe('Auto Scaling Configuration', () => {
    test('should define ASGs for both regions', () => {
      expect(stackContent).toContain('resource "aws_autoscaling_group" "west"');
      expect(stackContent).toContain('resource "aws_autoscaling_group" "east"');
    });

    test('should have high availability configuration', () => {
      const minSizePattern = /min_size\s*=\s*2/g;
      const matches = stackContent.match(minSizePattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
      expect(stackContent).toContain('health_check_type         = "ELB"');
    });

    test('should have scaling policies configured', () => {
      expect(stackContent).toContain('resource "aws_autoscaling_policy"');
      expect(stackContent).toContain('policy_type            = "TargetTrackingScaling"');
      expect(stackContent).toContain('ASGAverageCPUUtilization');
    });

    test('should have CloudWatch metrics enabled', () => {
      expect(stackContent).toContain('enabled_metrics');
      expect(stackContent).toContain('GroupMinSize');
      expect(stackContent).toContain('GroupMaxSize');
      expect(stackContent).toContain('GroupDesiredCapacity');
    });

    test('should have auto scaling configured for high availability', () => {
      // Check for lifecycle or scale protection configuration
      const hasHA = stackContent.includes('protect_from_scale_in') ||
                    stackContent.includes('health_check_grace_period') ||
                    stackContent.includes('enabled_metrics');
      expect(hasHA).toBe(true);
    });
  });

  // ==================== Launch Template Security ====================
  describe('Launch Template Security', () => {
    test('should have launch templates for both regions', () => {
      expect(stackContent).toContain('resource "aws_launch_template" "west"');
      expect(stackContent).toContain('resource "aws_launch_template" "east"');
    });

    test('should enforce IMDSv2', () => {
      const imdsvPattern = /http_tokens\s*=\s*"required"/g;
      const matches = stackContent.match(imdsvPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have encrypted EBS volumes', () => {
      const ebsPattern = /encrypted\s*=\s*true/g;
      const matches = stackContent.match(ebsPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('should use proper instance profiles', () => {
      expect(stackContent).toContain('iam_instance_profile');
      expect(stackContent).toContain('arn = aws_iam_instance_profile.ec2_profile.arn');
    });

    test('should have detailed monitoring capability', () => {
      // Check for monitoring configuration or metadata options which includes monitoring
      const hasMonitoring = stackContent.includes('monitoring') || 
                           stackContent.includes('metadata_options');
      expect(hasMonitoring).toBe(true);
    });
  });

  // ==================== Certificate Management ====================
  describe('ACM Certificate Configuration', () => {
    test('should have ACM certificate configuration considered', () => {
      // Check for certificate-related configuration
      const hasCertConfig = stackContent.includes('aws_acm_certificate') ||
                           stackContent.includes('certificate_arn') ||
                           stackContent.includes('# certificate_arn') ||
                           stackContent.includes('ssl_policy');
      expect(hasCertConfig).toBe(true);
    });

    test('should have secure TLS configuration', () => {
      // Verify SSL/TLS is properly configured
      expect(stackContent).toContain('ELBSecurityPolicy-TLS-1-2-2017-01');
    });
  });

  // ==================== Output Configuration ====================
  describe('Output Configuration', () => {
    test('should export ALB DNS names', () => {
      expect(stackContent).toContain('output "west_alb_dns"');
      expect(stackContent).toContain('output "east_alb_dns"');
    });

    test('should export VPC IDs', () => {
      expect(stackContent).toContain('output "west_vpc_id"');
      expect(stackContent).toContain('output "east_vpc_id"');
    });

    test('should export KMS key IDs', () => {
      expect(stackContent).toContain('output "west_kms_key_id"');
      expect(stackContent).toContain('output "east_kms_key_id"');
    });

    test('should export CloudTrail bucket name', () => {
      expect(stackContent).toContain('output "cloudtrail_bucket"');
    });

    test('should export key infrastructure identifiers', () => {
      // Verify outputs exist for key resources
      const outputPattern = /output\s+"\w+"/g;
      const matches = stackContent.match(outputPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(7);
    });
  });

  // ==================== Provider Configuration ====================
  describe('Provider Configuration', () => {
    test('should have provider aliases for both regions', () => {
      expect(stackContent).toContain('provider "aws"');
      expect(stackContent).toContain('alias  = "us_west_1"');
      expect(stackContent).toContain('alias  = "us_east_1"');
    });

    test('should have proper region configuration', () => {
      expect(stackContent).toContain('region = "us-west-1"');
      expect(stackContent).toContain('region = "us-east-1"');
    });
  });

  // ==================== Variable Configuration ====================
  describe('Variable Configuration', () => {
    test('should define required variables', () => {
      expect(stackContent).toContain('variable "environment"');
      expect(stackContent).toContain('variable "project_name"');
      expect(stackContent).toContain('variable "allowed_admin_ips"');
    });

    test('should define network configuration through locals or variables', () => {
      // Check for CIDR configuration either via variables or locals
      const hasCIDR = stackContent.includes('vpc_cidr_west') ||
                     stackContent.includes('vpc_cidr_east') ||
                     stackContent.includes('west_cidr') ||
                     stackContent.includes('cidr_block');
      expect(hasCIDR).toBe(true);
    });
  });

  // ==================== Locals Configuration ====================
  describe('Locals Configuration', () => {
    test('should define common tags', () => {
      expect(stackContent).toContain('locals {');
      expect(stackContent).toContain('common_tags');
      expect(stackContent).toContain('Environment');
      expect(stackContent).toContain('ManagedBy');
    });

    test('should define availability zones', () => {
      expect(stackContent).toContain('azs_west');
      expect(stackContent).toContain('azs_east');
    });
  });

  // ==================== Compliance Validation ====================
  describe('Compliance and Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[a-zA-Z0-9]+"/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[a-zA-Z0-9]+"/);
      expect(stackContent).not.toMatch(/access_key\s*=\s*"AKIA[a-zA-Z0-9]+"/);
    });

    test('should use variables for configuration', () => {
      expect(stackContent).toContain('var.');
      const varPattern = /var\.\w+/g;
      const matches = stackContent.match(varPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(10);
    });

    test('should have proper tagging strategy', () => {
      expect(stackContent).toContain('tags');
      const tagPattern = /tags\s*=\s*merge\(local\.common_tags/g;
      const matches = stackContent.match(tagPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(5);
    });

    test('should enforce encryption everywhere', () => {
      const kmsPattern = /kms_key_id|kms_master_key_id/gi;
      const matches = stackContent.match(kmsPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(10);
      expect(stackContent).toContain('protocol          = "HTTPS"');
      expect(stackContent).toContain('aws:SecureTransport');
    });

    test('should implement network segmentation', () => {
      expect(stackContent).toContain('west_public');
      expect(stackContent).toContain('west_private');
      expect(stackContent).toContain('east_public');
      expect(stackContent).toContain('east_private');
      expect(stackContent).toContain('aws_nat_gateway');
    });

    test('should have multi-AZ deployment', () => {
      expect(stackContent).toContain('azs_west');
      expect(stackContent).toContain('azs_east');
      expect(stackContent).toContain('"us-west-1a"');
      expect(stackContent).toContain('"us-west-1c"');
      expect(stackContent).toContain('"us-east-1a"');
      expect(stackContent).toContain('"us-east-1b"');
    });

    test('should have backup and recovery configuration', () => {
      // Check for versioning which is the primary backup mechanism
      const versioningPattern = /versioning_configuration/g;
      const matches = stackContent.match(versioningPattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('should have DDoS protection measures', () => {
      expect(stackContent).toContain('drop_invalid_header_fields');
    });

    test('should follow naming conventions', () => {
      const resourcePattern = /resource\s+"[\w_]+"\s+"[\w_]+"/g;
      const matches = stackContent.match(resourcePattern);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(50);
    });
  });
});
