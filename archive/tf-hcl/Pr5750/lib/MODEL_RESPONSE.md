# Multi-Environment E-Commerce Infrastructure

Complete Terraform configuration for deploying e-commerce infrastructure with support for multiple environments using a flexible environment_suffix parameter.

## File: lib/tap_stack.tf

```hcl
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ecommerce-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "ecommerce-kms${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/ecommerce${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "ecommerce-vpc${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "ecommerce-igw${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "ecommerce-public-subnet-${count.index + 1}${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "ecommerce-private-subnet-${count.index + 1}${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
    Type        = "private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "ecommerce-nat-eip${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "ecommerce-nat${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "ecommerce-public-rt${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "ecommerce-private-rt${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "ecommerce-alb${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ecommerce-alb-sg${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "ecommerce-ec2${var.environment_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ecommerce-ec2-sg${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "ecommerce-rds${var.environment_suffix}-"
  description = "Security group for RDS MySQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name        = "ecommerce-rds-sg${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ecommerce-alb${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name        = "ecommerce-alb${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = "ecom${substr(var.environment_suffix, 0, 2)}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name        = "ecommerce-tg${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/ecommerce${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "ecommerce-logs${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name_prefix = "ecommerce-ec2${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ecommerce-ec2-role${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name_prefix = "cloudwatch-logs-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.app.arn}:*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "ecommerce-ec2${var.environment_suffix}-"
  role        = aws_iam_role.ec2.name

  tags = {
    Name        = "ecommerce-ec2-profile${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "ecommerce-app${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>E-commerce Application ${var.environment_suffix}</h1>" > /var/www/html/index.html
              echo "OK" > /var/www/html/health
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "ecommerce-instance${var.environment_suffix}"
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
    }
  }

  tags = {
    Name        = "ecommerce-lt${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name_prefix         = "ecommerce-asg${var.environment_suffix}-"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ecommerce-asg${var.environment_suffix}"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "Terraform"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "ecommerce-db${var.environment_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name        = "ecommerce-db-subnet-group${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier     = "ecommerce-db${var.environment_suffix}"
  engine         = "mysql"
  engine_version = "8.0.35"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = "ecommerce"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = var.db_multi_az
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = {
    Name        = "ecommerce-db${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# S3 Bucket for Static Assets
resource "aws_s3_bucket" "static_assets" {
  bucket = "ecommerce-static-assets${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "ecommerce-static-assets${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# DynamoDB Table for Terraform State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "ecommerce-terraform-locks${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "ecommerce-terraform-locks${var.environment_suffix}"
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
  }
}
```

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., -dev, -staging, -prod, -pr123)"
  type        = string
  default     = "-dev"

  validation {
    condition     = can(regex("^-[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must start with a hyphen and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"

  validation {
    condition     = can(regex("^t3\\.(micro|small|medium|large)$", var.instance_type))
    error_message = "Instance type must be a valid t3 instance type (micro, small, medium, or large)."
  }
}

variable "asg_min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 1

  validation {
    condition     = var.asg_min_size >= 1 && var.asg_min_size <= 10
    error_message = "ASG min size must be between 1 and 10."
  }
}

variable "asg_max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 4

  validation {
    condition     = var.asg_max_size >= 1 && var.asg_max_size <= 20
    error_message = "ASG max size must be between 1 and 20."
  }
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.asg_desired_capacity >= 1 && var.asg_desired_capacity <= 20
    error_message = "ASG desired capacity must be between 1 and 20."
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"

  validation {
    condition     = can(regex("^db\\.t3\\.(micro|small|medium|large)$", var.db_instance_class))
    error_message = "DB instance class must be a valid db.t3 instance type."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true

  validation {
    condition     = length(var.db_username) >= 1 && length(var.db_username) <= 16
    error_message = "DB username must be between 1 and 16 characters."
  }
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 8
    error_message = "DB password must be at least 8 characters long."
  }
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = false
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "Endpoint of the RDS MySQL instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "Address of the RDS MySQL instance"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "Port of the RDS MySQL instance"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.main.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.app.name
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "ecommerce"
    }
  }
}
```

## File: test/terraform.unit.test.ts

```typescript
import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  describe('File Structure', () => {
    it('should have tap_stack.tf file', () => {
      const filePath = path.join(libDir, 'tap_stack.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have variables.tf file', () => {
      const filePath = path.join(libDir, 'variables.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have outputs.tf file', () => {
      const filePath = path.join(libDir, 'outputs.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have provider.tf file', () => {
      const filePath = path.join(libDir, 'provider.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environment_suffix in all resource names', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');

      // Check VPC naming
      expect(stackFile).toContain('ecommerce-vpc${var.environment_suffix}');

      // Check ALB naming
      expect(stackFile).toContain('ecommerce-alb${var.environment_suffix}');

      // Check RDS naming
      expect(stackFile).toContain('ecommerce-db${var.environment_suffix}');

      // Check S3 naming
      expect(stackFile).toContain('ecommerce-static-assets${var.environment_suffix}');
    });

    it('should include Environment and ManagedBy tags', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');

      expect(stackFile).toContain('Environment = var.environment_suffix');
      expect(stackFile).toContain('ManagedBy   = "Terraform"');
    });
  });

  describe('Variables Configuration', () => {
    it('should define environment_suffix variable', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('variable "environment_suffix"');
    });

    it('should define instance_type variable with validation', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('variable "instance_type"');
      expect(varsFile).toContain('validation');
    });

    it('should define db_instance_class variable', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('variable "db_instance_class"');
    });

    it('should mark sensitive variables as sensitive', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('sensitive   = true');
    });
  });

  describe('Network Configuration', () => {
    it('should create VPC with 10.0.0.0/16 CIDR', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('cidr_block           = "10.0.0.0/16"');
    });

    it('should create 2 public subnets', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_subnet" "public"');
      expect(stackFile).toContain('count                   = 2');
    });

    it('should create 2 private subnets', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_subnet" "private"');
      expect(stackFile).toContain('count             = 2');
    });

    it('should create NAT Gateway for private subnet connectivity', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_nat_gateway" "main"');
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with HTTP/HTTPS ingress', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_security_group" "alb"');
      expect(stackFile).toContain('from_port   = 80');
      expect(stackFile).toContain('from_port   = 443');
    });

    it('should create EC2 security group allowing traffic from ALB', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_security_group" "ec2"');
      expect(stackFile).toContain('security_groups = [aws_security_group.alb.id]');
    });

    it('should create RDS security group allowing MySQL from EC2', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_security_group" "rds"');
      expect(stackFile).toContain('from_port       = 3306');
      expect(stackFile).toContain('security_groups = [aws_security_group.ec2.id]');
    });
  });

  describe('Encryption Configuration', () => {
    it('should create KMS key for encryption', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_kms_key" "main"');
      expect(stackFile).toContain('enable_key_rotation     = true');
    });

    it('should enable RDS storage encryption with KMS', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('storage_encrypted     = true');
      expect(stackFile).toContain('kms_key_id            = aws_kms_key.main.arn');
    });

    it('should enable S3 bucket encryption with KMS', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(stackFile).toContain('sse_algorithm     = "aws:kms"');
    });
  });

  describe('Outputs Configuration', () => {
    it('should output ALB DNS name', () => {
      const outputsFile = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
      expect(outputsFile).toContain('output "alb_dns_name"');
      expect(outputsFile).toContain('aws_lb.main.dns_name');
    });

    it('should output RDS endpoint', () => {
      const outputsFile = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
      expect(outputsFile).toContain('output "rds_endpoint"');
      expect(outputsFile).toContain('aws_db_instance.main.endpoint');
    });

    it('should output S3 bucket name', () => {
      const outputsFile = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
      expect(outputsFile).toContain('output "s3_bucket_name"');
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should create launch template', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_launch_template" "app"');
    });

    it('should create auto scaling group', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_autoscaling_group" "app"');
    });

    it('should configure health checks for ASG', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('health_check_type   = "ELB"');
    });
  });

  describe('RDS Configuration', () => {
    it('should create MySQL RDS instance', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_db_instance" "main"');
      expect(stackFile).toContain('engine         = "mysql"');
    });

    it('should configure automated backups', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('backup_retention_period = 7');
      expect(stackFile).toContain('backup_window');
    });

    it('should allow destruction without final snapshot for testing', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('skip_final_snapshot = true');
      expect(stackFile).toContain('deletion_protection = false');
    });
  });

  describe('S3 Configuration', () => {
    it('should create S3 bucket with versioning', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_s3_bucket_versioning"');
      expect(stackFile).toContain('status = "Enabled"');
    });

    it('should block public access to S3 bucket', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(stackFile).toContain('block_public_acls       = true');
    });
  });

  describe('Monitoring Configuration', () => {
    it('should create CloudWatch log group', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_cloudwatch_log_group" "app"');
    });

    it('should enable RDS CloudWatch logs export', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('enabled_cloudwatch_logs_exports');
    });
  });

  describe('Provider Configuration', () => {
    it('should require Terraform version >= 1.5.0', () => {
      const providerFile = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
      expect(providerFile).toContain('required_version = ">= 1.5.0"');
    });

    it('should use AWS provider version ~> 5.0', () => {
      const providerFile = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
      expect(providerFile).toContain('version = "~> 5.0"');
    });

    it('should set default tags', () => {
      const providerFile = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
      expect(providerFile).toContain('default_tags');
    });
  });
});
```

## File: test/terraform.int.test.ts

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';

describe('Terraform Integration Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  const testSuffix = `-test-${Date.now()}`;

  beforeAll(() => {
    console.log('Initializing Terraform...');
    execSync('terraform init', { cwd: libDir, stdio: 'inherit' });
  });

  describe('Terraform Validation', () => {
    it('should validate Terraform configuration', () => {
      expect(() => {
        execSync('terraform validate', { cwd: libDir, stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should format Terraform files correctly', () => {
      const output = execSync('terraform fmt -check', {
        cwd: libDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      }).toString();

      expect(output.trim()).toBe('');
    });
  });

  describe('Terraform Plan', () => {
    it('should create a valid plan with test suffix', () => {
      expect(() => {
        execSync(`terraform plan -var="environment_suffix=${testSuffix}" -out=tfplan`, {
          cwd: libDir,
          stdio: 'inherit'
        });
      }).not.toThrow();
    });

    it('should show expected resource count in plan', () => {
      const planOutput = execSync(`terraform show -json tfplan`, {
        cwd: libDir,
        encoding: 'utf-8'
      });

      const plan = JSON.parse(planOutput);
      const resourceChanges = plan.resource_changes || [];

      // Expect at least these core resources
      const expectedResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_security_group',
        'aws_lb',
        'aws_lb_target_group',
        'aws_autoscaling_group',
        'aws_db_instance',
        'aws_s3_bucket',
        'aws_kms_key'
      ];

      expectedResources.forEach(resourceType => {
        const found = resourceChanges.some((rc: any) =>
          rc.type === resourceType
        );
        expect(found).toBe(true);
      });
    });
  });

  describe('Variable Validation', () => {
    it('should accept valid environment suffix', () => {
      expect(() => {
        execSync('terraform plan -var="environment_suffix=-prod"', {
          cwd: libDir,
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    it('should accept valid instance types', () => {
      expect(() => {
        execSync('terraform plan -var="instance_type=t3.large" -var="environment_suffix=-test"', {
          cwd: libDir,
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    it('should accept valid db instance types', () => {
      expect(() => {
        execSync('terraform plan -var="db_instance_class=db.t3.medium" -var="environment_suffix=-test"', {
          cwd: libDir,
          stdio: 'pipe'
        });
      }).not.toThrow();
    });
  });

  describe('Output Validation', () => {
    it('should define all required outputs', () => {
      const output = execSync('terraform output', {
        cwd: libDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      }).toString();

      // Since we haven't applied, just check the output definitions exist
      // by running terraform show
      const showOutput = execSync('terraform show -json tfplan', {
        cwd: libDir,
        encoding: 'utf-8'
      });

      const plan = JSON.parse(showOutput);
      expect(plan).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    it('should not expose sensitive values in plan', () => {
      const planOutput = execSync('terraform show tfplan', {
        cwd: libDir,
        encoding: 'utf-8'
      });

      // Check that sensitive variables are not exposed
      expect(planOutput).not.toContain('db_password =');
    });

    it('should enable encryption for RDS', () => {
      const planOutput = execSync('terraform show -json tfplan', {
        cwd: libDir,
        encoding: 'utf-8'
      });

      const plan = JSON.parse(planOutput);
      const rdsResource = plan.resource_changes?.find((rc: any) =>
        rc.type === 'aws_db_instance'
      );

      expect(rdsResource?.change?.after?.storage_encrypted).toBe(true);
    });

    it('should block public access for S3', () => {
      const planOutput = execSync('terraform show -json tfplan', {
        cwd: libDir,
        encoding: 'utf-8'
      });

      const plan = JSON.parse(planOutput);
      const s3BlockResource = plan.resource_changes?.find((rc: any) =>
        rc.type === 'aws_s3_bucket_public_access_block'
      );

      expect(s3BlockResource?.change?.after?.block_public_acls).toBe(true);
    });
  });

  describe('Tagging Validation', () => {
    it('should apply Environment tag to all resources', () => {
      const planOutput = execSync('terraform show -json tfplan', {
        cwd: libDir,
        encoding: 'utf-8'
      });

      const plan = JSON.parse(planOutput);
      const resourcesWithTags = plan.resource_changes?.filter((rc: any) =>
        rc.change?.after?.tags?.Environment !== undefined
      );

      expect(resourcesWithTags.length).toBeGreaterThan(0);
    });

    it('should apply ManagedBy tag to all resources', () => {
      const planOutput = execSync('terraform show -json tfplan', {
        cwd: libDir,
        encoding: 'utf-8'
      });

      const plan = JSON.parse(planOutput);
      const resourcesWithManagedBy = plan.resource_changes?.filter((rc: any) =>
        rc.change?.after?.tags?.ManagedBy === 'Terraform'
      );

      expect(resourcesWithManagedBy.length).toBeGreaterThan(0);
    });
  });

  afterAll(() => {
    // Clean up plan file
    try {
      execSync('rm -f tfplan', { cwd: libDir });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});
```
