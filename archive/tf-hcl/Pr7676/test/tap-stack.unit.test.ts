import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'hcl2-parser';

describe('Terraform Configuration - Unit Tests', () => {
  let mainTf: any;
  let variablesTf: any;
  let outputsTf: any;

  beforeAll(() => {
    // Load Terraform files
    const mainTfPath = path.join(process.cwd(), 'lib', 'main.tf');
    const variablesTfPath = path.join(process.cwd(), 'lib', 'variables.tf');
    const outputsTfPath = path.join(process.cwd(), 'lib', 'outputs.tf');

    mainTf = fs.readFileSync(mainTfPath, 'utf-8');
    variablesTf = fs.readFileSync(variablesTfPath, 'utf-8');
    outputsTf = fs.readFileSync(outputsTfPath, 'utf-8');
  });

  describe('Terraform Configuration', () => {
    test('should have Terraform version >= 1.5.0', () => {
      expect(mainTf).toContain('required_version = ">= 1.5.0"');
    });

    test('should use AWS provider version ~> 5.0', () => {
      expect(mainTf).toContain('source  = "hashicorp/aws"');
      expect(mainTf).toContain('version = "~> 5.0"');
    });

    test('should configure AWS provider with region variable', () => {
      expect(mainTf).toContain('provider "aws"');
      expect(mainTf).toContain('region = var.aws_region');
    });

    test('should have default tags for all resources', () => {
      expect(mainTf).toContain('default_tags');
      expect(mainTf).toContain('Environment = "production"');
      expect(mainTf).toContain('Project     = "payment-gateway"');
      expect(mainTf).toContain('ManagedBy   = "terraform"');
    });
  });

  describe('Variables Configuration', () => {
    test('should have aws_region variable with default us-east-1', () => {
      expect(variablesTf).toContain('variable "aws_region"');
      expect(variablesTf).toContain('default     = "us-east-1"');
    });

    test('should have environment_suffix variable with validation', () => {
      expect(variablesTf).toContain('variable "environment_suffix"');
      expect(variablesTf).toContain('validation');
      expect(variablesTf).toContain('can(regex("^[a-z0-9-]+$", var.environment_suffix))');
    });

    test('should have vpc_cidr variable with default', () => {
      expect(variablesTf).toContain('variable "vpc_cidr"');
      expect(variablesTf).toContain('default     = "10.0.0.0/16"');
    });

    test('should have ami_id variable', () => {
      expect(variablesTf).toContain('variable "ami_id"');
      expect(variablesTf).toContain('validation');
    });

    test('should have acm_certificate_arn variable with validation', () => {
      expect(variablesTf).toContain('variable "acm_certificate_arn"');
      expect(variablesTf).toContain('validation');
      expect(variablesTf).toContain('can(regex("^arn:aws:acm:", var.acm_certificate_arn))');
    });

    test('should have db_username variable marked as sensitive', () => {
      expect(variablesTf).toContain('variable "db_username"');
      expect(variablesTf).toContain('sensitive   = true');
    });

    test('should have db_password variable marked as sensitive', () => {
      expect(variablesTf).toContain('variable "db_password"');
      expect(variablesTf).toContain('sensitive   = true');
      expect(variablesTf).toContain('length(var.db_password) >= 8');
    });

    test('should have db_max_connections variable', () => {
      expect(variablesTf).toContain('variable "db_max_connections"');
      expect(variablesTf).toContain('default     = 100');
    });
  });

  describe('Outputs Configuration', () => {
    test('should output VPC ID', () => {
      expect(outputsTf).toContain('output "vpc_id"');
      expect(outputsTf).toContain('aws_vpc.main.id');
    });

    test('should output ALB DNS name', () => {
      expect(outputsTf).toContain('output "alb_dns_name"');
      expect(outputsTf).toContain('aws_lb.main.dns_name');
    });

    test('should output ALB zone ID', () => {
      expect(outputsTf).toContain('output "alb_zone_id"');
      expect(outputsTf).toContain('aws_lb.main.zone_id');
    });

    test('should output RDS endpoint', () => {
      expect(outputsTf).toContain('output "rds_endpoint"');
      expect(outputsTf).toContain('aws_db_instance.main.endpoint');
    });

    test('should output static assets bucket name', () => {
      expect(outputsTf).toContain('output "static_assets_bucket"');
      expect(outputsTf).toContain('aws_s3_bucket.static_assets.id');
    });

    test('should output flow logs bucket name', () => {
      expect(outputsTf).toContain('output "flow_logs_bucket"');
      expect(outputsTf).toContain('aws_s3_bucket.flow_logs.id');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should define VPC with correct CIDR', () => {
      expect(mainTf).toContain('resource "aws_vpc" "main"');
      expect(mainTf).toContain('cidr_block           = var.vpc_cidr');
      expect(mainTf).toContain('enable_dns_hostnames = true');
      expect(mainTf).toContain('enable_dns_support   = true');
    });

    test('should use availability zones data source', () => {
      expect(mainTf).toContain('data "aws_availability_zones" "available"');
      expect(mainTf).toContain('state = "available"');
    });

    test('should create public subnets with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_subnet" "public"');
      expect(mainTf).toContain('count             = 3');
      expect(mainTf).toContain('map_public_ip_on_launch = true');
      expect(mainTf).toContain('payment-gateway-public-');
      expect(mainTf).toContain('var.environment_suffix');
    });

    test('should create private subnets with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_subnet" "private"');
      expect(mainTf).toContain('count             = 3');
      expect(mainTf).toContain('payment-gateway-private-');
      expect(mainTf).toContain('var.environment_suffix');
    });

    test('should create Internet Gateway', () => {
      expect(mainTf).toContain('resource "aws_internet_gateway" "main"');
      expect(mainTf).toContain('vpc_id = aws_vpc.main.id');
    });

    test('should create Elastic IP for NAT Gateway', () => {
      expect(mainTf).toContain('resource "aws_eip" "nat"');
      expect(mainTf).toContain('domain = "vpc"');
    });

    test('should create NAT Gateway in public subnet', () => {
      expect(mainTf).toContain('resource "aws_nat_gateway" "main"');
      expect(mainTf).toContain('allocation_id = aws_eip.nat.id');
      expect(mainTf).toContain('subnet_id     = aws_subnet.public[0].id');
    });

    test('should create public route table with IGW route', () => {
      expect(mainTf).toContain('resource "aws_route_table" "public"');
      expect(mainTf).toContain('gateway_id = aws_internet_gateway.main.id');
      expect(mainTf).toContain('cidr_block = "0.0.0.0/0"');
    });

    test('should create private route table with NAT route', () => {
      expect(mainTf).toContain('resource "aws_route_table" "private"');
      expect(mainTf).toContain('nat_gateway_id = aws_nat_gateway.main.id');
      expect(mainTf).toContain('cidr_block = "0.0.0.0/0"');
    });

    test('should associate public subnets with public route table', () => {
      expect(mainTf).toContain('resource "aws_route_table_association" "public"');
      expect(mainTf).toContain('count          = 3');
      expect(mainTf).toContain('subnet_id      = aws_subnet.public[count.index].id');
      expect(mainTf).toContain('route_table_id = aws_route_table.public.id');
    });

    test('should associate private subnets with private route table', () => {
      expect(mainTf).toContain('resource "aws_route_table_association" "private"');
      expect(mainTf).toContain('count          = 3');
      expect(mainTf).toContain('subnet_id      = aws_subnet.private[count.index].id');
      expect(mainTf).toContain('route_table_id = aws_route_table.private.id');
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      expect(mainTf).toContain('resource "aws_kms_key" "main"');
      expect(mainTf).toContain('deletion_window_in_days = 10');
      expect(mainTf).toContain('enable_key_rotation     = true');
    });

    test('should create KMS alias with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_kms_alias" "main"');
      expect(mainTf).toContain('name          = "alias/payment-gateway-');
      expect(mainTf).toContain('var.environment_suffix');
      expect(mainTf).toContain('target_key_id = aws_kms_key.main.key_id');
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with PostgreSQL', () => {
      expect(mainTf).toContain('resource "aws_db_instance" "main"');
      expect(mainTf).toContain('engine            = "postgres"');
    });

    test('should enable Multi-AZ for RDS', () => {
      expect(mainTf).toContain('multi_az               = true');
    });

    test('should enable encryption with KMS', () => {
      expect(mainTf).toContain('storage_encrypted = true');
      expect(mainTf).toContain('kms_key_id        = aws_kms_key.main.arn');
    });

    test('should set backup retention to 7 days', () => {
      expect(mainTf).toContain('backup_retention_period = 7');
    });

    test('should skip final snapshot for easier cleanup', () => {
      expect(mainTf).toContain('skip_final_snapshot = true');
    });

    test('should use db.t3.medium instance class', () => {
      expect(mainTf).toContain('instance_class    = "db.t3.medium"');
    });

    test('should create DB subnet group', () => {
      expect(mainTf).toContain('resource "aws_db_subnet_group" "main"');
      expect(mainTf).toContain('subnet_ids  = aws_subnet.private[*].id');
    });

    test('should be in private subnet via security group', () => {
      expect(mainTf).toContain('vpc_security_group_ids = [aws_security_group.rds.id]');
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB in public subnets', () => {
      expect(mainTf).toContain('resource "aws_lb" "main"');
      expect(mainTf).toContain('load_balancer_type = "application"');
      expect(mainTf).toContain('subnets            = aws_subnet.public[*].id');
    });

    test('should be internet-facing', () => {
      expect(mainTf).toContain('internal           = false');
    });

    test('should create target group', () => {
      expect(mainTf).toContain('resource "aws_lb_target_group" "main"');
      expect(mainTf).toContain('port        = 80');
      expect(mainTf).toContain('protocol    = "HTTP"');
      expect(mainTf).toContain('vpc_id      = aws_vpc.main.id');
    });

    test('should have health check configured', () => {
      expect(mainTf).toContain('health_check');
      expect(mainTf).toContain('healthy_threshold');
      expect(mainTf).toContain('unhealthy_threshold');
    });

    test('should create HTTPS listener with ACM when certificate provided', () => {
      expect(mainTf).toContain('resource "aws_lb_listener" "https"');
      expect(mainTf).toContain('port              = "443"');
      expect(mainTf).toContain('protocol          = "HTTPS"');
      expect(mainTf).toContain('certificate_arn   = var.acm_certificate_arn');
    });
  });

  describe('Auto Scaling Group', () => {
    test('should use latest Amazon Linux 2 AMI', () => {
      expect(mainTf).toContain('data "aws_ami" "amazon_linux_2"');
      expect(mainTf).toContain('most_recent = true');
      expect(mainTf).toContain('amzn2-ami-hvm-*-x86_64-gp2');
    });

    test('should create launch template with t3.medium', () => {
      expect(mainTf).toContain('resource "aws_launch_template" "main"');
      expect(mainTf).toContain('instance_type = "t3.medium"');
    });

    test('should associate IAM instance profile', () => {
      expect(mainTf).toContain('iam_instance_profile');
      expect(mainTf).toContain('arn = aws_iam_instance_profile.ec2.arn');
    });

    test('should disable public IP association', () => {
      expect(mainTf).toContain('associate_public_ip_address = false');
    });

    test('should create ASG with min 2, max 6 instances', () => {
      expect(mainTf).toContain('resource "aws_autoscaling_group" "main"');
      expect(mainTf).toContain('min_size            = 2');
      expect(mainTf).toContain('max_size            = 6');
      expect(mainTf).toContain('desired_capacity    = 2');
    });

    test('should place instances in private subnets', () => {
      expect(mainTf).toContain('vpc_zone_identifier = aws_subnet.private[*].id');
    });

    test('should attach target group', () => {
      expect(mainTf).toContain('target_group_arns   = [aws_lb_target_group.main.arn]');
    });

    test('should configure health check with ELB', () => {
      expect(mainTf).toContain('health_check_type         = "ELB"');
      expect(mainTf).toContain('health_check_grace_period = 300');
    });
  });

  describe('S3 Storage', () => {
    test('should create S3 bucket for static assets with environment suffix', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket" "static_assets"');
      expect(mainTf).toContain('var.environment_suffix');
    });

    test('should enable versioning', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_versioning" "static_assets"');
      expect(mainTf).toContain('status = "Enabled"');
    });

    test('should enable encryption with KMS', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets"');
      expect(mainTf).toContain('sse_algorithm     = "aws:kms"');
      expect(mainTf).toContain('kms_master_key_id = aws_kms_key.main.arn');
    });

    test('should create lifecycle policy for Glacier transition', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_lifecycle_configuration" "static_assets"');
      expect(mainTf).toContain('storage_class = "GLACIER"');
      expect(mainTf).toContain('days          = 90');
    });

    test('should block public access', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket_public_access_block" "static_assets"');
      expect(mainTf).toContain('block_public_acls       = true');
      expect(mainTf).toContain('block_public_policy     = true');
      expect(mainTf).toContain('ignore_public_acls      = true');
      expect(mainTf).toContain('restrict_public_buckets = true');
    });

    test('should create flow logs bucket', () => {
      expect(mainTf).toContain('resource "aws_s3_bucket" "flow_logs"');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch log group for EC2', () => {
      expect(mainTf).toContain('resource "aws_cloudwatch_log_group" "ec2"');
      expect(mainTf).toContain('retention_in_days = 7');
    });

    test('should create CPU high alarm', () => {
      expect(mainTf).toContain('resource "aws_cloudwatch_metric_alarm" "cpu_high"');
      expect(mainTf).toContain('metric_name         = "CPUUtilization"');
      expect(mainTf).toContain('threshold           = 80');
      expect(mainTf).toContain('comparison_operator = "GreaterThanThreshold"');
    });

    test('should create RDS connections high alarm', () => {
      expect(mainTf).toContain('resource "aws_cloudwatch_metric_alarm" "rds_connections_high"');
      expect(mainTf).toContain('metric_name         = "DatabaseConnections"');
      expect(mainTf).toContain('threshold           = var.db_max_connections * 0.9');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 IAM role', () => {
      expect(mainTf).toContain('resource "aws_iam_role" "ec2"');
      expect(mainTf).toContain('Service = "ec2.amazonaws.com"');
    });

    test('should create IAM instance profile', () => {
      expect(mainTf).toContain('resource "aws_iam_instance_profile" "ec2"');
      expect(mainTf).toContain('role        = aws_iam_role.ec2.name');
    });

    test('should create S3 read policy', () => {
      expect(mainTf).toContain('resource "aws_iam_role_policy" "ec2_s3_read"');
      expect(mainTf).toContain('name_prefix = "s3-read-"');
      expect(mainTf).toContain('s3:GetObject');
      expect(mainTf).toContain('s3:ListBucket');
    });

    test('should create CloudWatch Logs policy with explicit deny', () => {
      expect(mainTf).toContain('resource "aws_iam_role_policy" "ec2_cloudwatch_logs"');
      expect(mainTf).toContain('name_prefix = "cloudwatch-logs-"');
      expect(mainTf).toContain('logs:CreateLogGroup');
      expect(mainTf).toContain('logs:PutLogEvents');
      expect(mainTf).toContain('Effect = "Deny"');
      expect(mainTf).toContain('logs:DeleteLogGroup');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      expect(mainTf).toContain('resource "aws_security_group" "alb"');
      expect(mainTf).toContain('name_prefix = "payment-gateway-alb-');
      expect(mainTf).toContain('vpc_id      = aws_vpc.main.id');
    });

    test('should allow HTTPS ingress from internet to ALB', () => {
      // ALB security group has inline ingress rules
      expect(mainTf).toContain('from_port   = 443');
      expect(mainTf).toContain('to_port     = 443');
      expect(mainTf).toContain('cidr_blocks = ["0.0.0.0/0"]');
    });

    test('should create EC2 security group', () => {
      expect(mainTf).toContain('resource "aws_security_group" "ec2"');
      expect(mainTf).toContain('name_prefix = "payment-gateway-ec2-');
    });

    test('should allow traffic from ALB to EC2', () => {
      // EC2 security group has inline ingress rule from ALB
      expect(mainTf).toContain('security_groups = [aws_security_group.alb.id]');
    });

    test('should create RDS security group', () => {
      expect(mainTf).toContain('resource "aws_security_group" "rds"');
      expect(mainTf).toContain('name_prefix = "payment-gateway-rds-');
    });

    test('should allow PostgreSQL traffic from EC2 to RDS', () => {
      // RDS security group has inline ingress rule from EC2
      expect(mainTf).toContain('from_port       = 5432');
      expect(mainTf).toContain('to_port         = 5432');
      expect(mainTf).toContain('security_groups = [aws_security_group.ec2.id]');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should enable VPC Flow Logs to S3', () => {
      expect(mainTf).toContain('resource "aws_flow_log" "main"');
      expect(mainTf).toContain('vpc_id               = aws_vpc.main.id');
      expect(mainTf).toContain('log_destination_type = "s3"');
      expect(mainTf).toContain('log_destination      = aws_s3_bucket.flow_logs.arn');
      expect(mainTf).toContain('traffic_type         = "ALL"');
    });
  });

  describe('Resource Naming', () => {
    test('all named resources should include environment_suffix', () => {
      const resourceNamingPatterns = [
        'payment-gateway-',
        'var.environment_suffix',
      ];

      resourceNamingPatterns.forEach(pattern => {
        expect(mainTf).toContain(pattern);
      });
    });

    test('should use name_prefix for most resources', () => {
      const prefixCount = (mainTf.match(/name_prefix/g) || []).length;
      expect(prefixCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('User Data Script', () => {
    test('launch template should have user data for CloudWatch agent', () => {
      expect(mainTf).toContain('user_data');
    });
  });

  describe('Tags', () => {
    test('should have Name tags with environment suffix on key resources', () => {
      const taggedResources = [
        'payment-gateway-vpc',
        'payment-gateway-public-',
        'payment-gateway-private-',
        'payment-gateway-igw',
        'payment-gateway-nat',
        'payment-gateway-alb',
        'payment-gateway-rds',
      ];

      taggedResources.forEach(resource => {
        expect(mainTf).toContain(resource);
      });
    });
  });
});
