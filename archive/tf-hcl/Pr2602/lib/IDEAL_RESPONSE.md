# IDEAL_RESPONSE.md

## Overview

This document provides a detailed ideal response for a secure, production-grade AWS infrastructure stack managed with Terraform. It covers the expected configuration and best practices for the two main Terraform files in your project: `provider.tf` and `tap_stack.tf`. The goal is to ensure clarity, maintainability, and security for your cloud resources.

---

## 1. `provider.tf`
```hcl
provider.tf

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }

  backend "s3" {
    bucket         = var.state_bucket
    key            = var.state_key
    region         = var.state_bucket_region
    encrypt        = true
    dynamodb_table = var.state_lock_table
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}
```

---

## 2. `tap_stack.tf`
```hcl
# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "secure-web-app"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "DevOps-Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access (should be restricted)"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Private network only
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = "ChangeMeInProduction123!"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_guardduty_detector" "existing" {}

locals {
  guardduty_detector_id = data.aws_guardduty_detector.existing.id
}

resource "aws_guardduty_detector_feature" "s3_protection" {
  detector_id = local.guardduty_detector_id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

resource "aws_guardduty_detector_feature" "eks_protection" {
  detector_id = local.guardduty_detector_id
  name        = "EKS_AUDIT_LOGS"
  status      = "ENABLED"
}

resource "aws_guardduty_detector_feature" "malware_protection" {
  detector_id = local.guardduty_detector_id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

# KMS Key for encryption with proper service permissions
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.project_name}*"
          }
        }
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-database-subnet-${count.index + 1}"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
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
    Name = "${var.project_name}-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers"

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from private networks only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  ingress {
    description     = "MySQL/Aurora from web servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-database-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name_prefix = "${var.project_name}-ec2-role-"

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
    Name = "${var.project_name}-ec2-role"
  }
}

# IAM Policy for EC2 with least privilege
resource "aws_iam_policy" "ec2_policy" {
  name_prefix = "${var.project_name}-ec2-policy-"
  description = "Least privilege policy for EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/ec2/${var.project_name}*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-policy"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "${var.project_name}-ec2-profile-"
  role        = aws_iam_role.ec2_role.name

  tags = {
    Name = "${var.project_name}-ec2-profile"
  }
}

# S3 Bucket for application data
resource "aws_s3_bucket" "app_data" {
  bucket_prefix = "${var.project_name}-app-data-"

  tags = {
    Name = "${var.project_name}-app-data"
  }
}

resource "aws_s3_bucket_versioning" "app_data_versioning" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_encryption" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "app_data_pab" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket_prefix = "${var.project_name}-cloudtrail-logs-"

  tags = {
    Name = "${var.project_name}-cloudtrail-logs"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${var.project_name}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket
  s3_key_prefix  = "cloudtrail-logs"

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  kms_key_id = aws_kms_key.main.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_data.arn}/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-cloudtrail"
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_bucket_policy,
    aws_kms_key.main
  ]
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS Instance with Multi-AZ
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-database"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.main.arn

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = {
    Name = "${var.project_name}-database"
  }
}

# CloudWatch Log Groups - Create without KMS initially to avoid circular dependency
resource "aws_cloudwatch_log_group" "httpd_access" {
  name              = "/aws/ec2/${var.project_name}/httpd/access"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-httpd-access-logs"
  }

  depends_on = [aws_kms_key.main]
}

resource "aws_cloudwatch_log_group" "httpd_error" {
  name              = "/aws/ec2/${var.project_name}/httpd/error"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-httpd-error-logs"
  }

  depends_on = [aws_kms_key.main]
}

# Launch Template for EC2 instances
resource "aws_launch_template" "web" {
  name_prefix   = "${var.project_name}-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.project_name}</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "/aws/ec2/${var.project_name}/httpd/access",
                "log_stream_name": "{instance_id}"
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "/aws/ec2/${var.project_name}/httpd/error",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      }
    }
    EOL
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-web-server"
    }
  }

  tags = {
    Name = "${var.project_name}-web-launch-template"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "${var.project_name}-web-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.web.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-web-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "${var.project_name}-web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-web-tg"
  }
}

# Load Balancer Listener
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = {
    Name = "${var.project_name}-web-listener"
  }
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-web-acl"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }



    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                                 = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  tags = {
    Name = "${var.project_name}-web-acl"
  }
}

# Associate WAF Web ACL with Application Load Balancer
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name_prefix = "${var.project_name}-alarms-"

  tags = {
    Name = "${var.project_name}-alarms"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu"
  alarm_description   = "Alarm when CPU exceeds 80%"
  namespace            = "AWS/EC2"
  metric_name         = "CPUUtilization"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 80
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-high-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "low_disk_space" {
  alarm_name          = "${var.project_name}-low-disk-space"
  alarm_description   = "Alarm when disk space is below 10%"
  namespace            = "AWS/EC2"
  metric_name         = "DiskSpaceUtilization"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 10
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-low-disk-space-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.project_name}-high-memory"
  alarm_description   = "Alarm when Memory usage exceeds 80%"
  namespace            = "AWS/EC2"
  metric_name         = "MemoryUtilization"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 80
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-high-memory-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_backup_failure" {
  alarm_name          = "${var.project_name}-rds-backup-failure"
  alarm_description   = "Alarm when RDS backup fails"
  namespace            = "AWS/RDS"
  metric_name         = "BackupRetentionPeriod"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 1
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-backup-failure-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "elb_5xx" {
  alarm_name          = "${var.project_name}-elb-5xx"
  alarm_description   = "Alarm when ELB 5XX error rate exceeds 1%"
  namespace            = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX"
  dimensions          = {
    LoadBalancer = aws_lb.main.id
  }
  statistic            = "Sum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 1
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-elb-5xx-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_utilization" {
  alarm_name          = "${var.project_name}-rds-cpu-utilization"
  alarm_description   = "Alarm when RDS CPU utilization exceeds 80%"
  namespace            = "AWS/RDS"
  metric_name         = "CPUUtilization"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 80
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-cpu-utilization-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_space" {
  alarm_name          = "${var.project_name}-rds-storage-space"
  alarm_description   = "Alarm when RDS storage space is below 10%"
  namespace            = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 10
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-storage-space-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "elb_request_count" {
  alarm_name          = "${var.project_name}-elb-request-count"
  alarm_description   = "Alarm when ELB request count is less than 100 in 5 minutes"
  namespace            = "AWS/ApplicationELB"
  metric_name         = "RequestCount"
  dimensions          = {
    LoadBalancer = aws_lb.main.id
  }
  statistic            = "Sum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 100
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-elb-request-count-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_network_in" {
  alarm_name          = "${var.project_name}-high-network-in"
  alarm_description   = "Alarm when network in exceeds 1 GB"
  namespace            = "AWS/EC2"
  metric_name         = "NetworkIn"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Sum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 1073741824
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-high-network-in-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_network_out" {
  alarm_name          = "${var.project_name}-high-network-out"
  alarm_description   = "Alarm when network out exceeds 1 GB"
  namespace            = "AWS/EC2"
  metric_name         = "NetworkOut"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Sum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 1073741824
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-high-network-out-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "instance_reboot" {
  alarm_name          = "${var.project_name}-instance-reboot"
  alarm_description   = "Alarm when EC2 instance is rebooted"
  namespace            = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Maximum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 1
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-instance-reboot-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "instance_termination" {
  alarm_name          = "${var.project_name}-instance-termination"
  alarm_description   = "Alarm when EC2 instance is terminated"
  namespace            = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  dimensions          = {
    InstanceId = aws_db_instance.main.id
  }
  statistic            = "Maximum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 1
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-instance-termination-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_reboot" {
  alarm_name          = "${var.project_name}-rds-reboot"
  alarm_description   = "Alarm when RDS instance is rebooted"
  namespace            = "AWS/RDS"
  metric_name         = "Status"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Maximum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 0
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-reboot-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_termination" {
  alarm_name          = "${var.project_name}-rds-termination"
  alarm_description   = "Alarm when RDS instance is terminated"
  namespace            = "AWS/RDS"
  metric_name         = "Status"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Maximum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 0
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-termination-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "elb_active_connection_count" {
  alarm_name          = "${var.project_name}-elb-active-connection-count"
  alarm_description   = "Alarm when ELB active connection count is less than 10"
  namespace            = "AWS/ApplicationELB"
  metric_name         = "ActiveConnectionCount"
  dimensions          = {
    LoadBalancer = aws_lb.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 10
  comparison_operator  = "LessThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-elb-active-connection-count-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_read_latency" {
  alarm_name          = "${var.project_name}-rds-read-latency"
  alarm_description   = "Alarm when RDS read latency exceeds 100ms"
  namespace            = "AWS/RDS"
  metric_name         = "ReadLatency"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 0.1
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-read-latency-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_write_latency" {
  alarm_name          = "${var.project_name}-rds-write-latency"
  alarm_description   = "Alarm when RDS write latency exceeds 100ms"
  namespace            = "AWS/RDS"
  metric_name         = "WriteLatency"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 0.1
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-write-latency-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_deadlock_count" {
  alarm_name          = "${var.project_name}-rds-deadlock-count"
  alarm_description   = "Alarm when RDS deadlock count exceeds 0"
  namespace            = "AWS/RDS"
  metric_name         = "Deadlocks"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Sum"
  period               = 300
  evaluation_periods   = 1
  threshold            = 0
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-deadlock-count-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_replica_lag" {
  alarm_name          = "${var.project_name}-rds-replica-lag"
  alarm_description   = "Alarm when RDS replica lag exceeds 5 seconds"
  namespace            = "AWS/RDS"
  metric_name         = "ReplicaLag"
  dimensions          = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  statistic            = "Average"
  period               = 300
  evaluation_periods   = 1
  threshold            = 5
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.alarms.arn]
  ok_actions           = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  tags = {
    Name = "${var.project_name}-rds-replica-lag-alarm"
  }
}
```

---

## **Conclusion**

This ideal response ensures Terraform code is:
- **Modular** (uses variables and locals)
- **Secure** (encryption, key rotation, logging)
- **Consistent** (tags and naming conventions)

