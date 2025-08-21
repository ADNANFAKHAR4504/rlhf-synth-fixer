import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  let tapStackContent: string;
  let providerContent: string;

  beforeAll(() => {
    const tapStackPath = path.join(__dirname, '../lib/tap_stack.tf');
    const providerPath = path.join(__dirname, '../lib/provider.tf');
    
    tapStackContent = fs.readFileSync(tapStackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
  });

  describe('Provider Configuration', () => {
    test('should use AWS provider version >= 5.0', () => {
      expect(providerContent).toContain('version = ">= 5.0"');
    });

    test('should configure S3 backend', () => {
      expect(providerContent).toContain('backend "s3"');
    });

    test('should target us-west-2 region', () => {
      expect(tapStackContent).toContain('default     = "us-west-2"');
    });
  });

  describe('Core Variables', () => {
    test('should have environment_suffix variable', () => {
      expect(tapStackContent).toContain('variable "environment_suffix"');
      expect(tapStackContent).toContain('description = "Suffix to append to resource names');
    });

    test('should have VPC CIDR configuration', () => {
      expect(tapStackContent).toContain('variable "vpc_cidr"');
      expect(tapStackContent).toContain('default     = "10.0.0.0/16"');
    });
  });

  describe('KMS Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      expect(tapStackContent).toContain('resource "aws_kms_key" "main"');
      expect(tapStackContent).toContain('enable_key_rotation     = true');
      expect(tapStackContent).toContain('deletion_window_in_days = 7');
    });

    test('should have KMS key policy for multiple services', () => {
      expect(tapStackContent).toContain('resource "aws_kms_key" "main"');
      expect(tapStackContent).toContain('Allow CloudWatch Logs');
      expect(tapStackContent).toContain('Allow EventBridge');
      expect(tapStackContent).toContain('Allow SSM Parameter Store');
    });

    test('should create KMS alias', () => {
      expect(tapStackContent).toContain('resource "aws_kms_alias" "main"');
      expect(tapStackContent).toMatch(/name\s*=\s*"alias\/\$\{var\.project_name\}-\$\{var\.environment_suffix\}/);
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with proper configuration', () => {
      expect(tapStackContent).toContain('resource "aws_vpc" "main"');
      expect(tapStackContent).toContain('enable_dns_hostnames = true');
      expect(tapStackContent).toContain('enable_dns_support   = true');
    });

    test('should create public and private subnets', () => {
      expect(tapStackContent).toContain('resource "aws_subnet" "public"');
      expect(tapStackContent).toContain('resource "aws_subnet" "private"');
      expect(tapStackContent).toContain('map_public_ip_on_launch = true');
    });

    test('should create NAT gateways for private subnets', () => {
      expect(tapStackContent).toContain('resource "aws_nat_gateway" "main"');
      expect(tapStackContent).toContain('resource "aws_eip" "nat"');
      expect(tapStackContent).toContain('domain = "vpc"');
    });

    test('should create route tables and associations', () => {
      expect(tapStackContent).toContain('resource "aws_route_table" "public"');
      expect(tapStackContent).toContain('resource "aws_route_table" "private"');
      expect(tapStackContent).toContain('resource "aws_route_table_association"');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP/HTTPS ingress', () => {
      expect(tapStackContent).toContain('resource "aws_security_group" "alb"');
      expect(tapStackContent).toContain('from_port   = 80');
      expect(tapStackContent).toContain('from_port   = 443');
    });

    test('should create webapp security group with ALB ingress only', () => {
      expect(tapStackContent).toContain('resource "aws_security_group" "webapp"');
      expect(tapStackContent).toContain('description     = "HTTP from ALB"');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with KMS encryption', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "webapp_assets"');
      expect(tapStackContent).toContain('sse_algorithm     = "aws:kms"');
      expect(tapStackContent).toContain('kms_master_key_id = aws_kms_key.main.arn');
    });

    test('should block public access to S3 bucket', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_public_access_block" "webapp_assets"');
      expect(tapStackContent).toContain('block_public_acls       = true');
      expect(tapStackContent).toContain('block_public_policy     = true');
      expect(tapStackContent).toContain('ignore_public_acls      = true');
      expect(tapStackContent).toContain('restrict_public_buckets = true');
    });

    test('should enable versioning on S3 bucket', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_versioning" "webapp_assets"');
      expect(tapStackContent).toContain('status = "Enabled"');
    });

    test('should have S3 bucket policy for ALB logs', () => {
      expect(tapStackContent).toContain('resource "aws_s3_bucket_policy" "alb_logs"');
      expect(tapStackContent).toContain('arn:aws:iam::797873946194:root');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create webapp log group with KMS encryption', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_log_group" "webapp_logs"');
      expect(tapStackContent).toContain('retention_in_days = 14');
      expect(tapStackContent).toContain('kms_key_id');
    });

    test('should create EventBridge log group with KMS encryption', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_log_group" "eventbridge_logs"');
      expect(tapStackContent).toContain('retention_in_days = 7');
      expect(tapStackContent).toContain('kms_key_id');
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB with access logs enabled', () => {
      expect(tapStackContent).toContain('resource "aws_lb" "main"');
      expect(tapStackContent).toContain('enabled = true');
      expect(tapStackContent).toContain('prefix  = "alb-access-logs"');
    });

    test('should disable deletion protection for testing', () => {
      expect(tapStackContent).toContain('enable_deletion_protection = false');
    });
  });

  describe('WAF v2 Configuration', () => {
    test('should create WAF Web ACL with managed rule sets', () => {
      expect(tapStackContent).toContain('resource "aws_wafv2_web_acl" "main"');
      expect(tapStackContent).toContain('AWSManagedRulesCommonRuleSet');
      expect(tapStackContent).toContain('AWSManagedRulesKnownBadInputsRuleSet');
    });

    test('should include rate limiting rule', () => {
      expect(tapStackContent).toContain('RateLimitRule');
      expect(tapStackContent).toContain('rate_based_statement');
      expect(tapStackContent).toContain('limit              = 2000');
    });

    test('should associate WAF with ALB', () => {
      expect(tapStackContent).toContain('resource "aws_wafv2_web_acl_association" "main"');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create webapp IAM role with EC2 assume role', () => {
      expect(tapStackContent).toContain('resource "aws_iam_role" "webapp_role"');
      expect(tapStackContent).toContain('Service = "ec2.amazonaws.com"');
    });

    test('should create EventBridge logs IAM role', () => {
      expect(tapStackContent).toContain('resource "aws_iam_role" "eventbridge_logs_role"');
      expect(tapStackContent).toContain('Service = "events.amazonaws.com"');
    });

    test('should attach least privilege policies', () => {
      expect(tapStackContent).toContain('resource "aws_iam_role_policy" "webapp_policy"');
      expect(tapStackContent).toContain('s3:GetObject');
      expect(tapStackContent).toContain('s3:PutObject');
      expect(tapStackContent).toContain('logs:CreateLogStream');
      expect(tapStackContent).toContain('ssm:GetParameter');
      expect(tapStackContent).toContain('events:PutEvents');
    });

    test('should create IAM instance profile', () => {
      expect(tapStackContent).toContain('resource "aws_iam_instance_profile" "webapp_profile"');
    });
  });

  describe('Systems Manager Parameter Store', () => {
    test('should create database host parameter', () => {
      expect(tapStackContent).toContain('resource "aws_ssm_parameter" "database_host"');
      expect(tapStackContent).toContain('type = "String"');
    });

    test('should create app config parameter', () => {
      expect(tapStackContent).toContain('resource "aws_ssm_parameter" "app_config"');
      expect(tapStackContent).toContain('type = "String"');
    });

    test('should create encrypted API key parameter', () => {
      expect(tapStackContent).toContain('resource "aws_ssm_parameter" "api_key"');
      expect(tapStackContent).toContain('type   = "SecureString"');
      expect(tapStackContent).toContain('key_id');
    });
  });

  describe('EventBridge Configuration', () => {
    test('should create custom event bus', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_bus" "webapp_events"');
      expect(tapStackContent).toContain('${var.project_name}-${var.environment_suffix}');
    });

    test('should create user activity event rule', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_rule" "user_activity"');
      expect(tapStackContent).toContain('User Activity');
      expect(tapStackContent).toContain('login');
      expect(tapStackContent).toContain('logout');
      expect(tapStackContent).toContain('signup');
    });

    test('should create system alerts event rule', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_rule" "system_alerts"');
      expect(tapStackContent).toContain('System Alert');
      expect(tapStackContent).toContain('HIGH');
      expect(tapStackContent).toContain('CRITICAL');
    });

    test('should create event targets for CloudWatch Logs', () => {
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_target" "user_activity_logs"');
      expect(tapStackContent).toContain('resource "aws_cloudwatch_event_target" "system_alerts_logs"');
    });
  });

  describe('Outputs', () => {
    test('should output all critical resource identifiers', () => {
      const expectedOutputs = [
        'output "vpc_id"',
        'output "public_subnet_ids"',
        'output "private_subnet_ids"',
        'output "alb_dns_name"',
        'output "s3_bucket_name"',
        'output "kms_key_arn"',
        'output "cloudwatch_log_group_name"',
        'output "waf_web_acl_arn"',
        'output "ssm_parameter_database_host"',
        'output "ssm_parameter_app_config"',
        'output "ssm_parameter_api_key"',
        'output "eventbridge_bus_arn"',
        'output "eventbridge_logs_group"'
      ];
      
      expectedOutputs.forEach(outputName => {
        expect(tapStackContent).toContain(outputName);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use environment suffix in all resource names', () => {
      // Check various resources for proper naming with environment suffix
      const resourcePatterns = [
        /Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}/,
        /name\s*=\s*"[^"]*\$\{var\.environment_suffix\}/
      ];
      
      resourcePatterns.forEach(pattern => {
        expect(tapStackContent).toMatch(pattern);
      });
      
      // Count occurrences of environment_suffix variable usage
      const matches = tapStackContent.match(/\$\{var\.environment_suffix\}/g) || [];
      expect(matches.length).toBeGreaterThan(20); // Should be used extensively
    });
  });
});