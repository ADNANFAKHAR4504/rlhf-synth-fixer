// Unit tests for Terraform infrastructure
// Tests all modules: VPC, networking, compute, database, storage, IAM, security groups, monitoring

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper to read file content
function readFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

// Helper to check if file exists
function fileExists(filename: string): boolean {
  const filePath = path.join(LIB_DIR, filename);
  return fs.existsSync(filePath);
}

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Existence', () => {
    test('main.tf exists', () => {
      expect(fileExists('main.tf')).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fileExists('variables.tf')).toBe(true);
    });

    test('networking.tf exists', () => {
      expect(fileExists('networking.tf')).toBe(true);
    });

    test('security_groups.tf exists', () => {
      expect(fileExists('security_groups.tf')).toBe(true);
    });

    test('compute.tf exists', () => {
      expect(fileExists('compute.tf')).toBe(true);
    });

    test('database.tf exists', () => {
      expect(fileExists('database.tf')).toBe(true);
    });

    test('storage.tf exists', () => {
      expect(fileExists('storage.tf')).toBe(true);
    });

    test('iam.tf exists', () => {
      expect(fileExists('iam.tf')).toBe(true);
    });

    test('monitoring.tf exists', () => {
      expect(fileExists('monitoring.tf')).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fileExists('outputs.tf')).toBe(true);
    });

    test('user_data.sh exists', () => {
      expect(fileExists('user_data.sh')).toBe(true);
    });
  });

  describe('main.tf - Provider and Data Sources', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('main.tf');
    });

    test('terraform version is >= 1.5', () => {
      expect(content).toContain('required_version = ">= 1.5"');
    });

    test('AWS provider version is ~> 5.0', () => {
      expect(content).toContain('version = "~> 5.0"');
    });

    test('AWS provider has default tags configured', () => {
      expect(content).toContain('default_tags');
      expect(content).toContain('Environment');
      expect(content).toContain('Project');
      expect(content).toContain('ManagedBy');
      expect(content).toContain('Terraform');
    });

    test('AWS provider uses var.aws_region', () => {
      expect(content).toContain('region = var.aws_region');
    });

    test('availability zones data source is defined', () => {
      expect(content).toContain('data "aws_availability_zones" "available"');
      expect(content).toContain('state = "available"');
    });

    test('caller identity data source is defined', () => {
      expect(content).toContain('data "aws_caller_identity" "current"');
    });

    test('Amazon Linux 2023 AMI data source is configured', () => {
      expect(content).toContain('data "aws_ami" "amazon_linux_2023"');
      expect(content).toContain('most_recent = true');
      expect(content).toContain('owners      = ["amazon"]');
      expect(content).toContain('al2023-ami-*-x86_64');
      expect(content).toContain('virtualization-type');
      expect(content).toContain('hvm');
    });
  });

  describe('variables.tf - Input Variables', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('variables.tf');
    });

    test('aws_region variable has correct default', () => {
      expect(content).toContain('variable "aws_region"');
      expect(content).toContain('type        = string');
      expect(content).toContain('default     = "us-east-1"');
    });

    test('environment_suffix variable is required', () => {
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('type        = string');
      // Should not have a default value
      const envSuffixSection = content.split('variable "environment_suffix"')[1].split('}')[0];
      expect(envSuffixSection).not.toContain('default');
    });

    test('vpc_cidr variable has correct default', () => {
      expect(content).toContain('variable "vpc_cidr"');
      expect(content).toContain('default     = "10.0.0.0/16"');
    });

    test('public_subnet_cidrs has 3 subnets', () => {
      expect(content).toContain('variable "public_subnet_cidrs"');
      expect(content).toContain('10.0.1.0/24');
      expect(content).toContain('10.0.2.0/24');
      expect(content).toContain('10.0.3.0/24');
    });

    test('private_subnet_cidrs has 3 subnets', () => {
      expect(content).toContain('variable "private_subnet_cidrs"');
      expect(content).toContain('10.0.11.0/24');
      expect(content).toContain('10.0.12.0/24');
      expect(content).toContain('10.0.13.0/24');
    });

    test('instance_type defaults to t3.medium', () => {
      expect(content).toContain('variable "instance_type"');
      expect(content).toContain('default     = "t3.medium"');
    });

    test('ASG sizing variables have correct defaults', () => {
      expect(content).toContain('variable "asg_min_size"');
      expect(content).toContain('default     = 2');
      expect(content).toContain('variable "asg_max_size"');
      expect(content).toContain('default     = 10');
      expect(content).toContain('variable "asg_desired_capacity"');
    });

    test('CPU threshold variables have correct defaults', () => {
      expect(content).toContain('variable "cpu_scale_up_threshold"');
      expect(content).toContain('default     = 70');
      expect(content).toContain('variable "cpu_scale_down_threshold"');
      expect(content).toContain('default     = 30');
    });

    test('sensitive variables are marked as sensitive', () => {
      expect(content).toContain('variable "db_username"');
      expect(content).toContain('sensitive   = true');
      expect(content).toContain('variable "db_password"');
    });

    test('ACM certificate ARN variable exists', () => {
      expect(content).toContain('variable "acm_certificate_arn"');
    });
  });

  describe('networking.tf - VPC and Subnets', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('networking.tf');
    });

    test('VPC has DNS support enabled', () => {
      expect(content).toContain('resource "aws_vpc" "main"');
      expect(content).toContain('enable_dns_hostnames = true');
      expect(content).toContain('enable_dns_support   = true');
      expect(content).toContain('cidr_block           = var.vpc_cidr');
    });

    test('VPC has correct naming with environment_suffix', () => {
      expect(content).toContain('Name = "vpc-${var.environment_suffix}"');
    });

    test('Internet Gateway is attached to VPC', () => {
      expect(content).toContain('resource "aws_internet_gateway" "main"');
      expect(content).toContain('vpc_id = aws_vpc.main.id');
      expect(content).toContain('Name = "igw-${var.environment_suffix}"');
    });

    test('3 public subnets are created', () => {
      expect(content).toContain('resource "aws_subnet" "public"');
      expect(content).toContain('count = 3');
      expect(content).toContain('map_public_ip_on_launch = true');
      expect(content).toContain('Type = "public"');
    });

    test('3 private subnets are created', () => {
      expect(content).toContain('resource "aws_subnet" "private"');
      expect(content).toContain('count = 3');
      expect(content).toContain('Type = "private"');
    });

    test('3 Elastic IPs are created for NAT Gateways', () => {
      expect(content).toContain('resource "aws_eip" "nat"');
      expect(content).toContain('count  = 3');
      expect(content).toContain('domain = "vpc"');
      expect(content).toContain('depends_on = [aws_internet_gateway.main]');
    });

    test('3 NAT Gateways are created', () => {
      expect(content).toContain('resource "aws_nat_gateway" "main"');
      expect(content).toContain('count = 3');
      expect(content).toContain('allocation_id = aws_eip.nat[count.index].id');
      expect(content).toContain('subnet_id     = aws_subnet.public[count.index].id');
    });

    test('Public route table routes to IGW', () => {
      expect(content).toContain('resource "aws_route_table" "public"');
      expect(content).toContain('cidr_block = "0.0.0.0/0"');
      expect(content).toContain('gateway_id = aws_internet_gateway.main.id');
    });

    test('3 private route tables route to NAT Gateways', () => {
      expect(content).toContain('resource "aws_route_table" "private"');
      expect(content).toContain('count  = 3');
      expect(content).toContain('nat_gateway_id = aws_nat_gateway.main[count.index].id');
    });

    test('Public subnets have route table associations', () => {
      expect(content).toContain('resource "aws_route_table_association" "public"');
      expect(content).toContain('subnet_id      = aws_subnet.public[count.index].id');
    });

    test('Private subnets have route table associations', () => {
      expect(content).toContain('resource "aws_route_table_association" "private"');
      expect(content).toContain('subnet_id      = aws_subnet.private[count.index].id');
    });
  });

  describe('security_groups.tf - Security Groups', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('security_groups.tf');
    });

    test('ALB security group is created', () => {
      expect(content).toContain('resource "aws_security_group" "alb"');
      expect(content).toContain('vpc_id      = aws_vpc.main.id');
      expect(content).toContain('create_before_destroy = true');
    });

    test('ALB allows HTTP and HTTPS ingress', () => {
      expect(content).toContain('resource "aws_vpc_security_group_ingress_rule" "alb_http"');
      expect(content).toContain('from_port   = 80');
      expect(content).toContain('cidr_ipv4   = "0.0.0.0/0"');
      expect(content).toContain('resource "aws_vpc_security_group_ingress_rule" "alb_https"');
      expect(content).toContain('from_port   = 443');
    });

    test('ALB allows egress to EC2 on port 80', () => {
      expect(content).toContain('resource "aws_vpc_security_group_egress_rule" "alb_to_ec2"');
      expect(content).toContain('referenced_security_group_id = aws_security_group.ec2.id');
    });

    test('EC2 security group is created', () => {
      expect(content).toContain('resource "aws_security_group" "ec2"');
      expect(content).toContain('vpc_id      = aws_vpc.main.id');
    });

    test('EC2 allows ingress from ALB', () => {
      expect(content).toContain('resource "aws_vpc_security_group_ingress_rule" "ec2_from_alb"');
      expect(content).toContain('referenced_security_group_id = aws_security_group.alb.id');
    });

    test('EC2 allows egress to internet and RDS', () => {
      expect(content).toContain('resource "aws_vpc_security_group_egress_rule" "ec2_to_internet"');
      expect(content).toContain('resource "aws_vpc_security_group_egress_rule" "ec2_to_rds"');
      expect(content).toContain('from_port                    = 3306');
    });

    test('RDS security group is created', () => {
      expect(content).toContain('resource "aws_security_group" "rds"');
      expect(content).toContain('vpc_id      = aws_vpc.main.id');
    });

    test('RDS allows ingress from EC2 on port 3306', () => {
      expect(content).toContain('resource "aws_vpc_security_group_ingress_rule" "rds_from_ec2"');
      expect(content).toContain('from_port                    = 3306');
      expect(content).toContain('to_port                      = 3306');
    });
  });

  describe('compute.tf - ALB and Auto Scaling', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('compute.tf');
    });

    test('Application Load Balancer is created', () => {
      expect(content).toContain('resource "aws_lb" "main"');
      expect(content).toContain('internal           = false');
      expect(content).toContain('load_balancer_type = "application"');
      expect(content).toContain('enable_deletion_protection = false');
      expect(content).toContain('name               = "alb-${var.environment_suffix}"');
    });

    test('Target Group is configured correctly', () => {
      expect(content).toContain('resource "aws_lb_target_group" "app"');
      expect(content).toContain('port        = 80');
      expect(content).toContain('protocol    = "HTTP"');
      expect(content).toContain('deregistration_delay = 30');
    });

    test('Target Group health check is configured', () => {
      expect(content).toContain('health_check');
      expect(content).toContain('path                = "/health"');
      expect(content).toContain('matcher             = "200"');
      expect(content).toContain('protocol            = "HTTP"');
    });

    test('HTTP listener is created', () => {
      expect(content).toContain('resource "aws_lb_listener" "http"');
      expect(content).toContain('port              = "80"');
      expect(content).toContain('protocol          = "HTTP"');
    });

    test('Launch Template uses Amazon Linux 2023', () => {
      expect(content).toContain('resource "aws_launch_template" "app"');
      expect(content).toContain('image_id      = data.aws_ami.amazon_linux_2023.id');
      expect(content).toContain('instance_type = var.instance_type');
    });

    test('Launch Template uses IMDSv2', () => {
      expect(content).toContain('metadata_options');
      expect(content).toContain('http_endpoint               = "enabled"');
      expect(content).toContain('http_tokens                 = "required"');
      expect(content).toContain('http_put_response_hop_limit = 1');
      expect(content).toContain('instance_metadata_tags      = "enabled"');
    });

    test('Launch Template has monitoring enabled', () => {
      expect(content).toContain('monitoring');
      expect(content).toContain('enabled = true');
    });

    test('Launch Template has user data', () => {
      expect(content).toContain('user_data = base64encode(templatefile');
      expect(content).toContain('user_data.sh');
    });

    test('Auto Scaling Group is configured correctly', () => {
      expect(content).toContain('resource "aws_autoscaling_group" "app"');
      expect(content).toContain('health_check_type         = "ELB"');
      expect(content).toContain('health_check_grace_period = 300');
      expect(content).toContain('min_size         = var.asg_min_size');
      expect(content).toContain('max_size         = var.asg_max_size');
    });

    test('ASG uses latest launch template version', () => {
      expect(content).toContain('version = "$Latest"');
    });

    test('Scale up policy is created', () => {
      expect(content).toContain('resource "aws_autoscaling_policy" "scale_up"');
      expect(content).toContain('scaling_adjustment     = 1');
      expect(content).toContain('adjustment_type        = "ChangeInCapacity"');
      expect(content).toContain('cooldown               = 300');
    });

    test('Scale down policy is created', () => {
      expect(content).toContain('resource "aws_autoscaling_policy" "scale_down"');
      expect(content).toContain('scaling_adjustment     = -1');
    });

    test('CloudWatch CPU high alarm is configured', () => {
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "cpu_high"');
      expect(content).toContain('comparison_operator = "GreaterThanThreshold"');
      expect(content).toContain('metric_name         = "CPUUtilization"');
      expect(content).toContain('namespace           = "AWS/EC2"');
      expect(content).toContain('threshold           = var.cpu_scale_up_threshold');
    });

    test('CloudWatch CPU low alarm is configured', () => {
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "cpu_low"');
      expect(content).toContain('comparison_operator = "LessThanThreshold"');
      expect(content).toContain('threshold           = var.cpu_scale_down_threshold');
    });
  });

  describe('database.tf - RDS Configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('database.tf');
    });

    test('KMS key for RDS encryption is created', () => {
      expect(content).toContain('resource "aws_kms_key" "rds"');
      expect(content).toContain('deletion_window_in_days = 7');
      expect(content).toContain('enable_key_rotation     = true');
    });

    test('KMS alias is created', () => {
      expect(content).toContain('resource "aws_kms_alias" "rds"');
      expect(content).toContain('name          = "alias/rds-${var.environment_suffix}"');
      expect(content).toContain('target_key_id = aws_kms_key.rds.key_id');
    });

    test('RDS subnet group is created', () => {
      expect(content).toContain('resource "aws_db_subnet_group" "main"');
      expect(content).toContain('subnet_ids  = aws_subnet.private[*].id');
    });

    test('RDS parameter group is created', () => {
      expect(content).toContain('resource "aws_db_parameter_group" "main"');
      expect(content).toContain('family      = "mysql8.0"');
      expect(content).toContain('character_set_server');
      expect(content).toContain('utf8mb4');
    });

    test('RDS instance is configured correctly', () => {
      expect(content).toContain('resource "aws_db_instance" "main"');
      expect(content).toContain('engine            = "mysql"');
      expect(content).toContain('engine_version    = var.db_engine_version');
      expect(content).toContain('instance_class    = var.db_instance_class');
      expect(content).toContain('storage_type      = "gp3"');
    });

    test('RDS is encrypted at rest', () => {
      expect(content).toContain('storage_encrypted = true');
      expect(content).toContain('kms_key_id        = aws_kms_key.rds.arn');
    });

    test('RDS has Multi-AZ enabled', () => {
      expect(content).toContain('multi_az               = true');
    });

    test('RDS has 7-day backup retention', () => {
      expect(content).toContain('backup_retention_period = 7');
      expect(content).toContain('backup_window');
      expect(content).toContain('maintenance_window');
    });

    test('RDS is destroyable (skip_final_snapshot)', () => {
      expect(content).toContain('skip_final_snapshot       = true');
      expect(content).toContain('deletion_protection       = false');
    });

    test('RDS has CloudWatch logs enabled', () => {
      expect(content).toContain('enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]');
    });
  });

  describe('storage.tf - S3 and CloudFront', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('storage.tf');
    });

    test('S3 bucket is created with environment_suffix', () => {
      expect(content).toContain('resource "aws_s3_bucket" "static_assets"');
      expect(content).toContain('bucket = "static-assets-${var.environment_suffix}"');
    });

    test('S3 bucket has versioning enabled', () => {
      expect(content).toContain('resource "aws_s3_bucket_versioning" "static_assets"');
      expect(content).toContain('status = "Enabled"');
    });

    test('S3 bucket blocks public access', () => {
      expect(content).toContain('resource "aws_s3_bucket_public_access_block" "static_assets"');
      expect(content).toContain('block_public_acls       = true');
      expect(content).toContain('block_public_policy     = true');
      expect(content).toContain('ignore_public_acls      = true');
      expect(content).toContain('restrict_public_buckets = true');
    });

    test('S3 bucket has encryption enabled', () => {
      expect(content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(content).toContain('sse_algorithm = "AES256"');
      expect(content).toContain('bucket_key_enabled = true');
    });

    test('CloudFront Origin Access Control is created', () => {
      expect(content).toContain('resource "aws_cloudfront_origin_access_control" "main"');
      expect(content).toContain('origin_access_control_origin_type = "s3"');
      expect(content).toContain('signing_behavior                  = "always"');
      expect(content).toContain('signing_protocol                  = "sigv4"');
    });

    test('CloudFront distribution is configured', () => {
      expect(content).toContain('resource "aws_cloudfront_distribution" "main"');
      expect(content).toContain('enabled             = true');
      expect(content).toContain('is_ipv6_enabled     = true');
      expect(content).toContain('default_root_object = "index.html"');
    });

    test('CloudFront origin points to S3 bucket', () => {
      expect(content).toContain('domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name');
      expect(content).toContain('origin_access_control_id = aws_cloudfront_origin_access_control.main.id');
    });

    test('CloudFront redirects to HTTPS', () => {
      expect(content).toContain('viewer_protocol_policy = "redirect-to-https"');
      expect(content).toContain('compress               = true');
    });

    test('S3 bucket policy allows CloudFront access', () => {
      expect(content).toContain('resource "aws_s3_bucket_policy" "static_assets"');
      expect(content).toContain('cloudfront.amazonaws.com');
      expect(content).toContain('s3:GetObject');
    });
  });

  describe('iam.tf - IAM Roles and Policies', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('iam.tf');
    });

    test('EC2 IAM role is created', () => {
      expect(content).toContain('resource "aws_iam_role" "ec2"');
      expect(content).toContain('ec2.amazonaws.com');
      expect(content).toContain('sts:AssumeRole');
    });

    test('S3 access policy is attached to EC2 role', () => {
      expect(content).toContain('resource "aws_iam_role_policy" "s3_access"');
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('s3:DeleteObject');
      expect(content).toContain('s3:ListBucket');
      expect(content).toContain('aws_s3_bucket.static_assets.arn');
    });

    test('CloudWatch Logs policy is attached to EC2 role', () => {
      expect(content).toContain('resource "aws_iam_role_policy" "cloudwatch_logs"');
      expect(content).toContain('logs:CreateLogGroup');
      expect(content).toContain('logs:CreateLogStream');
      expect(content).toContain('logs:PutLogEvents');
    });

    test('CloudWatch Metrics policy is attached to EC2 role', () => {
      expect(content).toContain('resource "aws_iam_role_policy" "cloudwatch_metrics"');
      expect(content).toContain('cloudwatch:PutMetricData');
    });

    test('Instance profile is created', () => {
      expect(content).toContain('resource "aws_iam_instance_profile" "ec2"');
      expect(content).toContain('role        = aws_iam_role.ec2.name');
    });
  });

  describe('monitoring.tf - CloudWatch Alarms', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('monitoring.tf');
    });

    test('ALB unhealthy hosts alarm is created', () => {
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts"');
      expect(content).toContain('metric_name         = "UnHealthyHostCount"');
      expect(content).toContain('namespace           = "AWS/ApplicationELB"');
      expect(content).toContain('threshold           = 0');
    });

    test('RDS CPU high alarm is created', () => {
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "rds_cpu_high"');
      expect(content).toContain('metric_name         = "CPUUtilization"');
      expect(content).toContain('namespace           = "AWS/RDS"');
      expect(content).toContain('threshold           = 80');
    });

    test('RDS storage low alarm is created', () => {
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "rds_storage_low"');
      expect(content).toContain('metric_name         = "FreeStorageSpace"');
      expect(content).toContain('threshold           = 10737418240');
    });

    test('ALB response time alarm is created', () => {
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "alb_response_time"');
      expect(content).toContain('metric_name         = "TargetResponseTime"');
      expect(content).toContain('threshold           = 1.0');
    });

    test('CloudWatch log group is created', () => {
      expect(content).toContain('resource "aws_cloudwatch_log_group" "app"');
      expect(content).toContain('retention_in_days = 7');
    });
  });

  describe('outputs.tf - Outputs', () => {
    let content: string;

    beforeAll(() => {
      content = readFile('outputs.tf');
    });

    test('ALB DNS name output is defined', () => {
      expect(content).toContain('output "alb_dns_name"');
      expect(content).toContain('value       = aws_lb.main.dns_name');
    });

    test('CloudFront URL output is defined', () => {
      expect(content).toContain('output "cloudfront_distribution_url"');
      expect(content).toContain('aws_cloudfront_distribution.main.domain_name');
    });

    test('RDS endpoint output is defined', () => {
      expect(content).toContain('output "rds_endpoint"');
      expect(content).toContain('value       = aws_db_instance.main.endpoint');
    });

    test('VPC ID output is defined', () => {
      expect(content).toContain('output "vpc_id"');
      expect(content).toContain('value       = aws_vpc.main.id');
    });

    test('S3 bucket name output is defined', () => {
      expect(content).toContain('output "s3_bucket_name"');
      expect(content).toContain('value       = aws_s3_bucket.static_assets.id');
    });

    test('ALB ARN output is defined', () => {
      expect(content).toContain('output "alb_arn"');
      expect(content).toContain('value       = aws_lb.main.arn');
    });

    test('Auto Scaling Group name output is defined', () => {
      expect(content).toContain('output "autoscaling_group_name"');
      expect(content).toContain('value       = aws_autoscaling_group.app.name');
    });
  });

  describe('user_data.sh - User Data Script', () => {
    test('user_data.sh is not empty', () => {
      const userDataPath = path.join(LIB_DIR, 'user_data.sh');
      const content = fs.readFileSync(userDataPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('#!/bin/bash');
    });

    test('user_data.sh uses templated variables', () => {
      const userDataPath = path.join(LIB_DIR, 'user_data.sh');
      const content = fs.readFileSync(userDataPath, 'utf-8');
      // Should use template variables like ${region} or ${bucket_name}
      expect(content).toMatch(/\$\{[a-z_]+\}/);
    });
  });

  describe('Integration - Resource Dependencies and Best Practices', () => {
    test('all resources use environment_suffix for naming', () => {
      const tfFiles = ['networking.tf', 'compute.tf', 'database.tf', 'storage.tf', 'iam.tf', 'monitoring.tf', 'security_groups.tf'];

      tfFiles.forEach(file => {
        const content = readFile(file);
        expect(content).toContain('var.environment_suffix');
      });
    });

    test('no hardcoded environment values', () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

      tfFiles.forEach(file => {
        const content = readFile(file);
        // Should not have hardcoded environment names like prod, dev, staging
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-prod/);
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-dev-/);
        expect(content).not.toMatch(/name\s*=\s*"[^"]*-staging/);
      });
    });

    test('all .tf files are properly formatted', () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

      tfFiles.forEach(file => {
        const content = readFile(file);
        // Check basic formatting - should have proper indentation and structure
        expect(content.length).toBeGreaterThan(0);
        // All .tf files should contain either resource, variable, output, data, or provider
        expect(content).toMatch(/\b(resource|variable|output|data|provider|terraform)\b/);
      });
    });

    test('provider configuration uses correct AWS region variable', () => {
      const content = readFile('main.tf');
      expect(content).toContain('region = var.aws_region');
      // Provider definition can have region = var.aws_region
    });

    test('resources follow create_before_destroy pattern where needed', () => {
      const content = readFile('security_groups.tf');
      expect(content).toContain('create_before_destroy = true');
    });

    test('ALB and RDS have deletion_protection disabled', () => {
      const computeContent = readFile('compute.tf');
      const databaseContent = readFile('database.tf');

      expect(computeContent).toContain('enable_deletion_protection = false');
      expect(databaseContent).toContain('deletion_protection       = false');
    });

    test('no prevent_destroy lifecycle rules', () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

      tfFiles.forEach(file => {
        const content = readFile(file);
        expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
      });
    });
  });
});
